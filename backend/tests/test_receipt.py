import io

from PIL import Image

from booth.config import Settings
from booth.receipt import ReceiptRenderer


def _fake_jpeg(w=600, h=800) -> bytes:
    buf = io.BytesIO()
    img = Image.new("L", (w, h))
    for y in range(h):  # gradient so dithering has something to chew on
        img.paste(int(255 * y / h), (0, y, w, y + 1))
    img.save(buf, "JPEG")
    return buf.getvalue()


def test_render_58mm_width_and_mode(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=384, data_dir=tmp_path))
    img = r.render([_fake_jpeg()] * 3, "2026-0001")
    assert img.mode == "1"
    assert img.width == 384
    assert img.height > 1000


def test_render_80mm_scales_up(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=576, data_dir=tmp_path))
    img = r.render([_fake_jpeg()], "2026-0002")
    assert img.width == 576


def test_render_dithers_photos_not_blank(tmp_path):
    r = ReceiptRenderer(Settings(printer_width_dots=384, data_dir=tmp_path))
    img = r.render([_fake_jpeg()] * 3, "2026-0003")
    # A dithered gradient must produce a healthy mix of black pixels.
    hist = img.histogram()
    black_ratio = hist[0] / (img.width * img.height)
    assert 0.1 < black_ratio < 0.9
