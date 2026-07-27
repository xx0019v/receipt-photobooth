from PIL import Image

from booth.config import Settings
from booth.printer import BAND_HEIGHT, EscposPrinter


class FakeEscpos:
    def __init__(self):
        self.bands = []
        self.cut_calls = 0

    def image(self, image, *, impl):
        assert impl == "bitImageRaster"
        self.bands.append(image.copy())

    def cut(self):
        self.cut_calls += 1


def test_escpos_paces_every_band_and_does_not_add_variable_line_feed(monkeypatch):
    settings = Settings(
        printer_width_dots=384,
        printer_cut=False,
        printer_speed_mm_s=28,
    )
    driver = EscposPrinter(settings)
    fake = FakeEscpos()
    driver._printer = fake
    sleeps = []
    monkeypatch.setattr("booth.printer.time.sleep", sleeps.append)

    progress = []
    states = []
    driver.print_image(
        Image.new("1", (384, 160), 1),
        progress.append,
        states.append,
    )

    assert BAND_HEIGHT == 64
    assert [band.height for band in fake.bands] == [64, 64, 32]
    assert round(sum(sleeps), 6) == round(160 / (28 * 8), 6)
    assert states == ["sent", "feeding", "cutting"]
    assert progress[-1] == 1.0
    assert fake.cut_calls == 0
