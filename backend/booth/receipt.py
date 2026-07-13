"""Receipt renderer.

Reproduces the frontend `ReceiptStrip` layout as a 1-bit image at printer
width (384 dots for 58 mm paper, 576 for 80 mm). Photos are grayscaled,
auto-contrasted and Floyd–Steinberg dithered; typography stays pure black.
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

_FONT_CANDIDATES = {
    "regular": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "bold": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ],
    "mono": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ],
}


def _font(kind: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in _FONT_CANDIDATES[kind]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def edition_date(d: datetime | None = None) -> str:
    d = d or datetime.now()
    return d.strftime("%d %B %Y").upper()


def edition_time(d: datetime | None = None) -> str:
    return (d or datetime.now()).strftime("%H:%M:%S")


def issue_no(d: datetime | None = None) -> str:
    d = d or datetime.now()
    return f"NO. {d.timetuple().tm_yday:03d}"


class ReceiptRenderer:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.w = settings.printer_width_dots
        # All metrics scale from the 384-dot baseline.
        self.s = self.w / 384

    # -- drawing helpers -----------------------------------------------------

    def _dashed(self, d: ImageDraw.ImageDraw, y: int) -> int:
        x, on = int(10 * self.s), True
        while x < self.w - 10 * self.s:
            if on:
                d.line([(x, y), (min(x + 8, self.w - 10), y)], fill=0, width=2)
            x += 12
            on = not on
        return y + int(22 * self.s)

    def _center(self, d: ImageDraw.ImageDraw, y: int, text: str, font) -> int:
        tw = d.textlength(text, font=font)
        d.text(((self.w - tw) / 2, y), text, fill=0, font=font)
        return y + int(font.size * 1.35)

    def _meta_row(self, d: ImageDraw.ImageDraw, y: int, label: str, value: str, font) -> int:
        pad = int(14 * self.s)
        d.text((pad, y), label, fill=0, font=font)
        vw = d.textlength(value, font=font)
        d.text((self.w - pad - vw, y), value, fill=0, font=font)
        return y + int(font.size * 1.6)

    def _photo(self, canvas: Image.Image, y: int, jpeg: bytes) -> int:
        """Paste one frame as a full-width 4:3 landscape crop, dithered."""
        img = Image.open(io.BytesIO(jpeg)).convert("L")
        w, h = img.size
        target_h = int(w * 3 / 4)
        if h > target_h:  # portrait still -> center-crop to 4:3 landscape
            top = (h - target_h) // 2
            img = img.crop((0, top, w, top + target_h))
        pad = int(10 * self.s)
        pw = self.w - pad * 2
        img = img.resize((pw, int(pw * 3 / 4)))
        img = ImageOps.autocontrast(img, cutoff=2)
        canvas.paste(img.convert("1"), (pad, y))
        return y + img.height + int(10 * self.s)

    def _barcode(self, d: ImageDraw.ImageDraw, y: int, serial: str) -> int:
        # Deterministic decorative bars derived from the serial (matches the
        # UI's fake barcode — it is not a scannable symbology).
        widths = [(ord(c) % 4) + 1 for c in f"{serial}{serial}"][:30]
        height = int(56 * self.s)
        total = sum(w * 2 + 2 for w in widths)
        x = (self.w - total) / 2
        for w in widths:
            d.rectangle([x, y, x + w * 2 - 1, y + height], fill=0)
            x += w * 2 + 2
        return y + height + int(12 * self.s)

    def _qr(self, canvas: Image.Image, y: int, serial: str) -> int:
        if qrcode is None or not self.settings.qr_base_url:
            return y
        qr = qrcode.QRCode(border=0, box_size=3)
        qr.add_data(f"{self.settings.qr_base_url}/{serial}")
        qr.make(fit=True)
        img = qr.make_image().get_image().convert("1")
        size = int(120 * self.s)
        img = img.resize((size, size), Image.NEAREST)
        canvas.paste(img, ((self.w - size) // 2, y))
        return y + size + int(16 * self.s)

    # -- main ----------------------------------------------------------------

    def render(self, frames: list[bytes], serial: str, now: datetime | None = None) -> Image.Image:
        s = self.s
        # Generous canvas; cropped to content at the end.
        est_h = int(2600 * s) + len(frames) * int(320 * s)
        canvas = Image.new("L", (self.w, est_h), 255)
        d = ImageDraw.Draw(canvas)

        f_mast = _font("bold", int(38 * s))
        f_kick = _font("mono", int(14 * s))
        f_meta = _font("mono", int(16 * s))
        f_total = _font("bold", int(24 * s))
        f_foot = _font("regular", int(18 * s))

        y = int(20 * s)
        y = self._center(d, y, "THE RECEIPT", f_mast)
        y = self._center(d, y + int(2 * s), "P O R T R A I T   E D I T I O N", f_kick)
        y = self._dashed(d, y + int(14 * s))

        now = now or datetime.now()
        y = self._meta_row(d, y, "DATE", edition_date(now), f_meta)
        y = self._meta_row(d, y, "TIME", edition_time(now), f_meta)
        y = self._meta_row(d, y, "ISSUE", issue_no(now), f_meta)
        y = self._dashed(d, y + int(8 * s))

        for jpeg in frames:
            y = self._photo(canvas, y, jpeg)
        y = self._dashed(d, y + int(8 * s))

        y = self._meta_row(d, y, f"{len(frames)}X PORTRAIT STRIP", "0.00", f_meta)
        y = self._meta_row(d, y, "CONFIDENCE", "MAX", f_meta)
        y = self._meta_row(d, y, "SERVICE", "COMPLIMENTARY", f_meta)
        y = self._meta_row(d, y + int(6 * s), "TOTAL", "ONE SMILE", f_total)
        y = self._dashed(d, y + int(10 * s))

        y = self._barcode(d, y + int(4 * s), serial)
        y = self._center(d, y, serial, f_meta)
        y = self._qr(canvas, y + int(14 * s), serial)

        y = self._center(d, y + int(6 * s), "Thank you — keep this moment.", f_foot)
        y = self._center(d, y + int(4 * s), "THE-RECEIPT.STUDIO", f_kick)
        y += int(40 * s)  # feed room before the cut

        return canvas.crop((0, 0, self.w, y)).convert("1")
