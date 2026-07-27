"""Golden rasters: the thermal pipeline must stay byte-stable.

`pass-source.png` / `film-source.png` are the canonical rasters the kiosk
produced from the fixed fixture (serial 2026-0003 / 2026-0004, frame order
[4, 1, 6], scent NOCTURNE, quote "Your only limit is you."). `*-thermal.png`
are what the head actually burned for those.

The test re-thermalises each committed source and asserts it reproduces the
committed thermal EXACTLY. If dithering, autocontrast, or the 1-bit conversion
ever changes, this fails — which is the point: the printed artefact must not
drift silently.

To regenerate after an intentional change: open the Print Artifact Inspector,
drive a print of each style through the mock backend, and copy the saved
`artifact-source.png` / `artifact-thermal.png` from `data/sessions/{serial}/`
into this directory.
"""

from pathlib import Path

import pytest
from PIL import Image, ImageChops

from booth.artifact import prepare

GOLDEN = Path(__file__).parent / "golden"

CASES = {
    "pass": {
        "width": 384,
        "height": 1301,
        "physical_mm": 162.62,
        "has_qr": True,  # PASS carries a real QR; FILM never does.
    },
    "cover": {
        "width": 384,
        "height": 768,
        "physical_mm": 96.0,
        "has_qr": False,
    },
}

NAME = {"pass": "pass", "cover": "film"}


def _source(style: str) -> bytes:
    return (GOLDEN / f"{NAME[style]}-source.png").read_bytes()


@pytest.mark.parametrize("style", ["pass", "cover"])
def test_golden_dimensions(style):
    art = prepare(_source(style), style=style, expected_width_dots=384)
    assert art.width_dots == CASES[style]["width"]
    assert art.height_dots == CASES[style]["height"]
    # 8 dots/mm — the physical length follows from the dot height.
    assert round(art.height_dots / 8, 2) == CASES[style]["physical_mm"]


@pytest.mark.parametrize("style", ["pass", "cover"])
def test_golden_thermal_is_byte_stable(style):
    """Re-thermalising the source reproduces the committed thermal exactly."""
    art = prepare(_source(style), style=style, expected_width_dots=384)
    committed = Image.open(GOLDEN / f"{NAME[style]}-thermal.png").convert("1")
    produced = art.thermal.convert("1")

    assert produced.size == committed.size
    diff = ImageChops.difference(produced, committed)
    assert diff.getbbox() is None, f"{style} thermal drifted from golden"


@pytest.mark.parametrize("style", ["pass", "cover"])
def test_golden_is_one_bit_and_not_a_slab(style):
    art = prepare(_source(style), style=style, expected_width_dots=384)
    assert art.thermal.mode == "1"
    # A legible editorial artefact is neither blank nor a solid black brick.
    assert 0.01 < art.black_ratio < 0.35, art.black_ratio


@pytest.mark.parametrize("style", ["pass", "cover"])
def test_golden_source_has_no_alpha(style):
    """A stray alpha channel would print as a black slab; the source must be
    flat RGB before it ever reaches the head."""
    img = Image.open(GOLDEN / f"{NAME[style]}-source.png")
    assert img.mode in ("RGB", "L", "1", "P"), img.mode
    if img.mode == "P":
        assert "transparency" not in img.info


def test_pass_has_ink_where_the_qr_sits():
    """The QR block is the bottom-left of the rotated PASS canvas. It must
    contain real modules — a blank corner means the QR silently dropped."""
    art = prepare(_source("pass"), style="pass", expected_width_dots=384)
    one_bit = art.thermal.convert("1")
    w, h = one_bit.size
    # bottom-left eighth of the strip
    corner = one_bit.crop((0, int(h * 0.88), int(w * 0.4), h))
    black = corner.histogram()[0]
    assert black > 200, "expected QR ink in the PASS stub corner"
