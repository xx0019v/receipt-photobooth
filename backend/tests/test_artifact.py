"""The artefact pipeline refuses rather than substitutes.

Every test here asserts that something is NOT printed. That bias is the
design: the guest approved one specific artefact on screen, so printing a
different one is worse than printing nothing at all.
"""

import hashlib
import io
import json

import pytest
from PIL import Image

from booth.artifact import (
    ArtifactError,
    black_ratio,
    decode_artifact,
    prepare,
    save_bundle,
    thermalize,
)

WIDTH = 384


def png_bytes(width=WIDTH, height=800, color="white", mode="RGB") -> bytes:
    buf = io.BytesIO()
    Image.new(mode, (width, height), color).save(buf, format="PNG")
    return buf.getvalue()


def test_accepts_a_well_formed_artifact():
    data = png_bytes()
    art = prepare(data, style="pass", expected_width_dots=WIDTH)
    assert art.width_dots == WIDTH
    assert art.height_dots == 800
    assert art.thermal.mode == "1"
    assert art.sha256 == hashlib.sha256(data).hexdigest()


def test_fixed_tail_feed_is_part_of_the_printer_payload():
    data = png_bytes(height=800)
    art = prepare(
        data,
        style="pass",
        expected_width_dots=WIDTH,
        tail_feed_dots=96,
    )
    assert art.content_height_dots == 800
    assert art.tail_feed_dots == 96
    assert art.height_dots == 896
    # The appended rows are white but still have physical height, so the last
    # design row exits the head before the job can finish.
    assert art.thermal.crop((0, 800, WIDTH, 896)).getextrema() == (255, 255)


def test_unknown_style_is_refused():
    with pytest.raises(ArtifactError, match="unknown style"):
        prepare(png_bytes(), style="ticket", expected_width_dots=WIDTH)


def test_hash_mismatch_is_refused():
    with pytest.raises(ArtifactError, match="hash mismatch"):
        prepare(
            png_bytes(),
            style="pass",
            expected_width_dots=WIDTH,
            expected_sha256="0" * 64,
        )


def test_wrong_width_is_refused():
    """A 576-dot artefact on a 384-dot head would print cropped."""
    with pytest.raises(ArtifactError, match="width"):
        prepare(png_bytes(width=576), style="pass", expected_width_dots=WIDTH)


def test_runaway_height_is_refused():
    with pytest.raises(ArtifactError, match="height"):
        decode_artifact(
            png_bytes(height=25_000), style="pass", expected_width_dots=WIDTH
        )


def test_too_short_is_refused():
    with pytest.raises(ArtifactError, match="height"):
        decode_artifact(png_bytes(height=8), style="pass", expected_width_dots=WIDTH)


def test_corrupt_upload_is_refused():
    with pytest.raises(ArtifactError, match="not a readable image"):
        decode_artifact(b"not a png at all", style="pass", expected_width_dots=WIDTH)


def test_empty_upload_is_refused():
    with pytest.raises(ArtifactError, match="empty"):
        decode_artifact(b"", style="pass", expected_width_dots=WIDTH)


def test_transparency_flattens_to_white_not_black():
    """An alpha channel left unflattened prints as a solid black slab —
    metres of wasted paper and an unreadable artefact."""
    buf = io.BytesIO()
    Image.new("RGBA", (WIDTH, 400), (0, 0, 0, 0)).save(buf, format="PNG")
    flat = decode_artifact(buf.getvalue(), style="pass", expected_width_dots=WIDTH)
    assert flat.mode == "RGB"
    assert flat.getpixel((10, 10)) == (255, 255, 255)
    assert black_ratio(thermalize(flat)) == 0.0


def test_midtones_survive_as_dither_texture():
    """Flat 50% grey must become dot texture, not vanish into the paper.

    This is the silver/photographic failure mode the design brief calls out:
    a hard threshold sends mid greys to pure white and the artefact loses its
    photographs entirely.
    """
    buf = io.BytesIO()
    Image.new("RGB", (WIDTH, 400), (128, 128, 128)).save(buf, format="PNG")
    source = decode_artifact(buf.getvalue(), style="cover", expected_width_dots=WIDTH)
    ratio = black_ratio(thermalize(source, autocontrast=False))
    assert 0.2 < ratio < 0.8, f"midtone collapsed to {ratio}"


def test_save_bundle_records_exactly_what_was_printed(tmp_path):
    art = prepare(png_bytes(height=1000), style="cover", expected_width_dots=WIDTH)
    save_bundle(art, tmp_path, manifest={"serial": "2026-0042", "style": "cover"})

    for name in (
        "artifact-source.png",
        "artifact-thermal.png",
        "receipt.png",
        "artifact-manifest.json",
    ):
        assert (tmp_path / name).exists(), name

    # receipt.png is the image handed to the driver, not a re-render.
    assert Image.open(tmp_path / "receipt.png").mode == "1"

    manifest = json.loads((tmp_path / "artifact-manifest.json").read_text())
    assert manifest["serial"] == "2026-0042"
    assert manifest["artifact_sha256"] == art.sha256
    assert manifest["width_dots"] == WIDTH
    assert manifest["height_dots"] == 1000
    assert manifest["physical_width_mm"] == 48.0  # 384 dots / 8 dots per mm
