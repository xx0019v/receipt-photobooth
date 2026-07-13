import io

from PIL import Image

from booth.config import Settings
from booth.receipt import ReceiptRenderer

SCENT = {
    "code": "SM-003",
    "name": "SLOW BURN",
    "mood": "Warm",
    "destination": "DUSK",
    "notes": ["Tobacco", "Vanilla", "Cedar"],
}


def _fake_jpeg(w=600, h=800) -> bytes:
    buf = io.BytesIO()
    img = Image.new("L", (w, h))
    for y in range(h):  # gradient so dithering has something to chew on
        img.paste(int(255 * y / h), (0, y, w, y + 1))
    img.save(buf, "JPEG")
    return buf.getvalue()


def _black_ratio(img: Image.Image) -> float:
    return img.histogram()[0] / (img.width * img.height)


def test_pass_is_rotated_landscape(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=384, data_dir=tmp_path))
    img = r.render([_fake_jpeg()] * 3, "2026-0001", style="pass", meta={"scent": SCENT})
    assert img.mode == "1"
    assert img.width == 384
    # 1000x636 landscape rotated: length = 1000 * 384/636
    assert img.height == int(1000 * 384 / 636)
    assert 0.05 < _black_ratio(img) < 0.9


def test_cover_is_upright(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=384, data_dir=tmp_path))
    img = r.render(
        [_fake_jpeg()] * 3,
        "2026-0002",
        style="cover",
        meta={"quote": {"text": "Prove them wrong.", "variant": "sans"}},
    )
    assert img.mode == "1"
    assert img.width == 384
    assert img.height == int(780 * 384 / 640)
    assert 0.05 < _black_ratio(img) < 0.9


def test_defaults_when_no_meta(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=384, data_dir=tmp_path))
    for style in ("pass", "cover"):
        img = r.render([_fake_jpeg()], "2026-0003", style=style)
        assert img.width == 384


def test_80mm_scales_up(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=576, data_dir=tmp_path))
    img = r.render([_fake_jpeg()] * 3, "2026-0004", style="pass")
    assert img.width == 576
