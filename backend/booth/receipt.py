"""Receipt renderer — thermal counterparts of the two print styles.

  pass   SCENT BOARDING PASS (frontend `ReceiptStrip`, landscape 1000x636).
         Rendered in landscape, rotated 90deg and scaled so the short side
         fills the paper width (58 mm / 384 dots -> ~75 mm long ticket).
  cover  Quote card (frontend `MagazineCover`, 640x760). Printed upright.

Photos are grayscaled + autocontrasted; the whole canvas is Floyd-Steinberg
dithered at the end, so the cover's soft-grey card renders as a fine dot
texture, matching the strict black-on-paper design rule.

Font sizes are deliberately larger than the on-screen design: the printed
artefact is physically small, and thermal dots need ~1.5 mm minimum glyphs.
"""

from __future__ import annotations

import io
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont, ImageOps

try:
    import qrcode
except ImportError:  # pragma: no cover - optional
    qrcode = None

from .config import Settings

BRAND = "THE RECEIPT"

# Styles with a dedicated layout. Anything else falls back to the default
# layout instead of erroring: the frontend owns the design vocabulary and may
# introduce new styles before this side learns to render them.
KNOWN_STYLES = ("pass", "cover")

# Copy shared with the kiosk UI (app/lib/i18n.ts — English voice).
AIRLINE = "SCENT MEMORY AIRWAYS"
PASS_TITLE = "SCENT BOARDING PASS"
CLOSING = "THIS MOMENT WAS PRINTED"
STUDIO = "PARFUM RECEIPT STUDIO"

# Fallbacks when the frontend sends no metadata (tests, curl smoke runs).
DEFAULT_SCENT = {
    "code": "SM-001",
    "name": "AFTER HOURS",
    "mood": "Nocturne",
    "destination": "AFTERGLOW",
    "notes": ["Iris", "Black Amber", "Smoke"],
}
DEFAULT_QUOTE = {"text": "This is art.", "variant": "serif-italic"}

_FONT_CANDIDATES = {
    "sans": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "sans_bold": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ],
    "serif": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    ],
    "serif_italic": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
    ],
    "mono": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Supplemental/Courier New.ttf",
    ],
}


def _font(kind: str, size: int):
    for path in _FONT_CANDIDATES[kind]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def edition_date(d: datetime | None = None) -> str:
    return (d or datetime.now()).strftime("%d %b %Y").upper()


def edition_time(d: datetime | None = None) -> str:
    return (d or datetime.now()).strftime("%H:%M")


def issue_no(d: datetime | None = None) -> str:
    d = d or datetime.now()
    return f"NO. {d.timetuple().tm_yday:03d}"


class ReceiptRenderer:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.w = settings.printer_width_dots

    # -- shared helpers ------------------------------------------------------

    @staticmethod
    def _photo(canvas: Image.Image, jpeg: bytes, box: tuple[int, int, int, int]) -> None:
        """Paste a frame center-cropped to fill box=(x, y, w, h)."""
        x, y, w, h = box
        img = Image.open(io.BytesIO(jpeg)).convert("L")
        iw, ih = img.size
        target = w / h
        if iw / ih > target:
            nw = int(ih * target)
            img = img.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
        else:
            nh = int(iw / target)
            img = img.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
        img = ImageOps.autocontrast(img.resize((w, h)), cutoff=2)
        canvas.paste(img, (x, y))

    @staticmethod
    def _hdash(d: ImageDraw.ImageDraw, x0: int, x1: int, y: int, width: int = 2) -> None:
        x = x0
        while x < x1:
            d.line([(x, y), (min(x + 10, x1), y)], fill=0, width=width)
            x += 18

    @staticmethod
    def _vdash(d: ImageDraw.ImageDraw, x: int, y0: int, y1: int, width: int = 2) -> None:
        y = y0
        while y < y1:
            d.line([(x, y), (x, min(y + 10, y1))], fill=0, width=width)
            y += 18

    @staticmethod
    def _right(d: ImageDraw.ImageDraw, x_right: int, y: int, text: str, font, fill=0) -> None:
        d.text((x_right - d.textlength(text, font=font), y), text, fill=fill, font=font)

    @staticmethod
    def _center_x(d: ImageDraw.ImageDraw, cx: int, y: int, text: str, font, fill=0) -> None:
        d.text((cx - d.textlength(text, font=font) / 2, y), text, fill=fill, font=font)

    def _barcode(self, d: ImageDraw.ImageDraw, x0: int, x1: int, y: int, h: int, serial: str) -> None:
        widths = [(ord(c) % 4) + 1 for c in f"{serial}{serial}"][:24]
        total = sum(w * 3 + 3 for w in widths)
        x = x0 + ((x1 - x0) - total) / 2
        for w in widths:
            d.rectangle([x, y, x + w * 3 - 1, y + h], fill=0)
            x += w * 3 + 3

    def _qr_img(self, serial: str, size: int) -> Image.Image | None:
        if qrcode is None or not self.settings.qr_base_url:
            return None
        qr = qrcode.QRCode(border=0, box_size=4)
        qr.add_data(f"{self.settings.qr_base_url}/{serial}")
        qr.make(fit=True)
        return qr.make_image().get_image().convert("L").resize((size, size), Image.NEAREST)

    # -- PASS (landscape boarding pass, printed rotated) ----------------------

    def _render_pass(self, frames: list[bytes], serial: str, scent: dict, now: datetime) -> Image.Image:
        W, H = 1000, 636
        c = Image.new("L", (W, H), 255)
        d = ImageDraw.Draw(c)

        f_mono_s = _font("mono", 20)
        f_mono = _font("mono", 24)
        f_mono_b = _font("sans_bold", 26)
        f_serif = _font("serif", 48)
        f_serif_m = _font("serif", 34)
        f_serif_xl = _font("serif", 60)
        f_ital = _font("serif_italic", 26)

        # top bar + photo band
        d.rectangle([0, 0, W, 8], fill=0)
        n = max(1, len(frames))
        pw = (W - (n - 1) * 4) // n
        for i, jpeg in enumerate(frames):
            self._photo(c, jpeg, (i * (pw + 4), 12, pw, 200))

        # caption strip
        d.text((24, 224), f"FRAMES 01-{len(frames):02d} · {AIRLINE}", font=f_mono_s, fill=0)
        self._right(d, W - 24, 224, f"{scent['code']} · {edition_date(now)}", f_mono_s)
        self._hdash(d, 0, W, 258)

        top = 276
        # LEFT — identity + fragrance (x 24..300)
        d.text((24, top), PASS_TITLE, font=f_mono_s, fill=0)
        d.text((24, top + 30), BRAND, font=f_serif, fill=0)
        d.text((24, 486), "FRAGRANCE", font=f_mono_s, fill=0)
        d.text((24, 514), scent["mood"], font=f_serif_m, fill=0)
        d.text((24, 556), scent["name"], font=f_ital, fill=0)
        self._vdash(d, 318, top, H - 20)

        # CENTER — route + notes (x 340..750)
        d.rectangle([560, top, 748, top + 62], outline=0, width=3)
        self._center_x(d, 654, top + 6, "BOARDED", f_mono_b)
        self._center_x(d, 654, top + 36, edition_date(now), f_mono_s)

        d.text((340, 392), "FROM", font=f_mono_s, fill=0)
        d.text((340, 418), "NOW", font=f_serif_xl, fill=0)
        self._hdash(d, 480, 610, 452)
        d.polygon([(610, 452), (594, 444), (594, 460)], fill=0)  # plane arrow
        d.text((624, 392), "TO", font=f_mono_s, fill=0)
        d.text((624, 418), scent["destination"], font=f_serif_xl, fill=0)

        notes = scent.get("notes", DEFAULT_SCENT["notes"])
        col_w = 136
        for i, (tier, note) in enumerate(zip(("TOP", "HEART", "BASE"), notes)):
            x = 340 + i * col_w
            d.text((x, 532), tier, font=f_mono_s, fill=0)
            d.text((x, 560), note, font=f_ital, fill=0)

        # PERFORATION
        self._vdash(d, 764, 290, H - 20, width=3)

        # RIGHT — stub (x 784..1000)
        d.text((784, top), "STUB", font=f_mono_s, fill=0)
        self._right(d, W - 20, top, scent["code"], f_mono_s)
        for i, (label, value) in enumerate(
            [("GATE", "MEMORY"), ("SEAT", f"{len(frames):02d}"), ("FLIGHT", scent["code"])]
        ):
            y = top + 40 + i * 42
            d.text((784, y + 4), label, font=f_mono_s, fill=0)
            self._right(d, W - 20, y, value, f_mono_b)

        qr = self._qr_img(serial, 130)
        if qr is not None:
            c.paste(qr, (784, 448))
            d.rectangle([780, 444, 918, 582], outline=0, width=2)
        self._barcode(d, 784, W - 20, 592, 24, serial)
        self._center_x(d, (784 + W - 20) // 2, 606, serial, f_mono_s)

        # rotate so the 636 side lies across the 384-dot paper
        out = c.rotate(90, expand=True)
        return out.resize((self.w, int(W * self.w / H)))

    # -- COVER (quote card, printed upright) ----------------------------------

    def _wrap(self, d: ImageDraw.ImageDraw, text: str, font, max_w: int) -> list[str]:
        words, lines, cur = text.split(), [], ""
        for w in words:
            trial = f"{cur} {w}".strip()
            if d.textlength(trial, font=font) <= max_w or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def _render_cover(
        self, frames: list[bytes], serial: str, scent: dict, quote: dict, now: datetime
    ) -> Image.Image:
        W, H = 640, 780
        c = Image.new("L", (W, H), 255)
        d = ImageDraw.Draw(c)

        f_mono = _font("mono", 20)

        d.text((30, 24), STUDIO, font=f_mono, fill=0)
        self._right(d, W - 30, 24, issue_no(now), f_mono)

        # square soft-grey art card
        cx0, cy0, card = 30, 64, 580
        d.rectangle([cx0, cy0, cx0 + card, cy0 + card], fill=236)
        pad = 30
        inner_w = card - pad * 2

        # contact strip
        n = max(1, len(frames))
        pw = (inner_w - (n - 1) * 8) // n
        for i, jpeg in enumerate(frames):
            self._photo(c, jpeg, (cx0 + pad + i * (pw + 8), cy0 + pad, pw, 140))

        # the quote — the hero
        variant = quote.get("variant", "serif")
        text = quote.get("text", DEFAULT_QUOTE["text"])
        if variant == "sans-caps":
            qf, text = _font("sans_bold", 72), text.upper()
        elif variant == "sans":
            qf = _font("sans_bold", 58)
        elif variant == "serif-italic":
            qf = _font("serif_italic", 62)
        else:
            qf = _font("serif", 56)
        lines = self._wrap(d, text, qf, inner_w - 20)
        line_h = int(qf.size * 1.12)
        block_top = cy0 + pad + 140
        block_h = card - pad * 2 - 140 - 30
        qy = block_top + (block_h - len(lines) * line_h) // 2
        for line in lines:
            self._center_x(d, cx0 + card // 2, qy, line, qf)
            qy += line_h

        # caption inside the card
        cap_y = cy0 + card - pad - 20
        d.text((cx0 + pad, cap_y), f"{scent['mood']} · {scent['name']}", font=f_mono, fill=0)
        self._right(d, cx0 + card - pad, cap_y, edition_date(now), f_mono, fill=0)

        # footer
        d.text((30, H - 44), serial, font=f_mono, fill=0)
        self._right(d, W - 30, H - 44, CLOSING, f_mono)

        return c.resize((self.w, int(H * self.w / W)))

    # -- entry point -----------------------------------------------------------

    def render(
        self,
        frames: list[bytes],
        serial: str,
        style: str = "pass",
        meta: dict | None = None,
        now: datetime | None = None,
    ) -> Image.Image:
        meta = meta or {}
        scent = {**DEFAULT_SCENT, **(meta.get("scent") or {})}
        quote = {**DEFAULT_QUOTE, **(meta.get("quote") or {})}
        now = now or datetime.now()
        if style == "cover":
            img = self._render_cover(frames, serial, scent, quote, now)
        else:  # "pass" and any yet-unknown style
            img = self._render_pass(frames, serial, scent, now)
        return img.convert("1")  # global Floyd-Steinberg pass
