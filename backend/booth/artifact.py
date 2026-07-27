"""Thermal translation of a frontend-rendered artifact.

The kiosk UI owns the design. It rasterises the SAME components the guest saw
on screen and hands us a PNG; this module never rebuilds a layout. Our job is
strictly mechanical:

    validate -> flatten -> grayscale -> autocontrast -> dither -> 1-bit

Everything that could make paper differ from screen (layout, copy, photo
order, crop, serial, timestamps) is decided upstream and arrives already
baked into the pixels. That is the whole point: there is exactly one design
definition in the system.

Refusing is always safer than printing something else. A bad hash, a wrong
width or an unknown style raises — we never "fall back" to another layout,
because the guest would receive an artefact they never approved.
"""

from __future__ import annotations

import hashlib
import io
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

# Styles the pipeline accepts. Unknown styles are refused, not defaulted.
KNOWN_ARTIFACT_STYLES = ("pass", "cover")

# Guard rails for a 58/80 mm thermal head. A runaway height would feed metres
# of paper before anyone could stop it.
MAX_ARTIFACT_BYTES = 12 * 1024 * 1024
MAX_HEIGHT_DOTS = 20_000
MIN_HEIGHT_DOTS = 64


class ArtifactError(ValueError):
    """Rejected artifact. Carries a message safe to surface to the kiosk."""


@dataclass(frozen=True)
class ThermalArtifact:
    source: Image.Image  # as received (RGB, flattened)
    thermal: Image.Image  # final 1-bit image handed to the printer
    sha256: str
    width_dots: int
    height_dots: int
    content_height_dots: int
    tail_feed_dots: int
    black_ratio: float


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def decode_artifact(
    data: bytes,
    *,
    style: str,
    expected_width_dots: int,
    expected_sha256: str | None = None,
) -> Image.Image:
    """Validate the uploaded PNG and return it flattened onto white."""
    if style not in KNOWN_ARTIFACT_STYLES:
        raise ArtifactError(
            f"unknown style {style!r}; refusing to print rather than guess a layout"
        )
    if not data:
        raise ArtifactError("empty artifact")
    if len(data) > MAX_ARTIFACT_BYTES:
        raise ArtifactError(f"artifact too large ({len(data)} bytes)")

    if expected_sha256:
        actual = _sha256(data)
        if actual.lower() != expected_sha256.lower():
            raise ArtifactError("artifact hash mismatch; refusing to print")

    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Exception as exc:  # corrupt upload, truncated transfer
        raise ArtifactError(f"artifact is not a readable image: {exc}") from exc

    if image.width != expected_width_dots:
        raise ArtifactError(
            f"artifact width {image.width} != printer width {expected_width_dots}"
        )
    if not (MIN_HEIGHT_DOTS <= image.height <= MAX_HEIGHT_DOTS):
        raise ArtifactError(f"artifact height {image.height} out of range")

    # Thermal paper is the white; anything transparent must become white, not
    # black, or an alpha channel would print as a solid slab.
    if image.mode in ("RGBA", "LA", "P"):
        rgba = image.convert("RGBA")
        flat = Image.new("RGB", rgba.size, "white")
        flat.paste(rgba, mask=rgba.split()[-1])
        return flat
    return image.convert("RGB")


def thermalize(
    image: Image.Image,
    *,
    dither: bool = True,
    autocontrast: bool = True,
) -> Image.Image:
    """Grayscale -> autocontrast -> 1-bit, ready for the print head.

    Floyd-Steinberg keeps the silver/photographic passages alive as dot
    texture. Without it, mid greys land either side of the threshold and the
    silver marks vanish into the paper — the failure the design brief calls
    out explicitly.
    """
    gray = ImageOps.grayscale(image)
    if autocontrast:
        gray = ImageOps.autocontrast(gray)
    # Image.convert("1") applies Floyd-Steinberg by default; dither=NONE gives
    # a hard threshold, which is right for pure line/QR artwork.
    return gray.convert("1", dither=Image.FLOYDSTEINBERG if dither else Image.NONE)


def black_ratio(one_bit: Image.Image) -> float:
    """Fraction of black dots — a cheap guard against a solid-black slab."""
    histogram = one_bit.convert("1").histogram()
    black = histogram[0]
    total = one_bit.width * one_bit.height
    return round(black / total, 4) if total else 0.0


def prepare(
    data: bytes,
    *,
    style: str,
    expected_width_dots: int,
    expected_sha256: str | None = None,
    dither: bool = True,
    tail_feed_dots: int = 0,
) -> ThermalArtifact:
    source = decode_artifact(
        data,
        style=style,
        expected_width_dots=expected_width_dots,
        expected_sha256=expected_sha256,
    )
    thermal = thermalize(source, dither=dither)
    if tail_feed_dots < 0:
        raise ArtifactError("tail feed dots must be non-negative")
    if tail_feed_dots:
        with_tail = Image.new(
            "1",
            (thermal.width, thermal.height + tail_feed_dots),
            255,
        )
        with_tail.paste(thermal, (0, 0))
        thermal = with_tail
    return ThermalArtifact(
        source=source,
        thermal=thermal,
        sha256=_sha256(data),
        width_dots=thermal.width,
        height_dots=thermal.height,
        content_height_dots=source.height,
        tail_feed_dots=tail_feed_dots,
        black_ratio=black_ratio(thermal),
    )


def save_bundle(
    artifact: ThermalArtifact,
    out_dir: Path,
    *,
    manifest: dict,
    receipt_path: Path | None = None,
) -> None:
    """Persist exactly what happened, so a print can be audited after the fact.

    `receipt.png` is the SAME image object handed to the driver — not a
    re-render — so what is on file is what came out of the machine.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    artifact.source.save(out_dir / "artifact-source.png")
    artifact.thermal.save(out_dir / "artifact-thermal.png")
    artifact.thermal.save(out_dir / "artifact-final-1bit.png")
    artifact.thermal.save(out_dir / "printer-payload.png")
    receipt_path = receipt_path or (out_dir / "receipt.png")
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    artifact.thermal.save(receipt_path)
    manifest_body = json.dumps(
        {
            **manifest,
            "artifact_sha256": artifact.sha256,
            "width_dots": artifact.width_dots,
            "height_dots": artifact.height_dots,
            "content_height_dots": artifact.content_height_dots,
            "tail_feed_dots": artifact.tail_feed_dots,
            "black_ratio": artifact.black_ratio,
            "physical_width_mm": round(artifact.width_dots / 8, 2),
            "physical_length_mm": round(artifact.height_dots / 8, 2),
            "dpi": 203,
        },
        indent=2,
        ensure_ascii=False,
    )
    (out_dir / "manifest.json").write_text(manifest_body, encoding="utf-8")
    # Compatibility alias for pre-incident tooling. New production jobs use
    # manifest.json as specified by the physical-print audit contract.
    (out_dir / "artifact-manifest.json").write_text(
        manifest_body, encoding="utf-8"
    )
