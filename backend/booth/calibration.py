"""Deterministic thermal-printer calibration sheet.

Usage on the Pi, after confirming paper is loaded:

    BOOTH_MODE=hardware CAMERA_DRIVER=picamera2 PRINTER_DRIVER=escpos \
      .venv/bin/python -m booth.calibration --print

Without ``--print`` this only writes a PNG. It never opens the printer.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from .artifact import thermalize
from .config import settings_from_env
from .printer import make_printer


def build_test_pattern(width: int = 384) -> Image.Image:
    height = 1250
    canvas = Image.new("L", (width, height), "white")
    draw = ImageDraw.Draw(canvas)
    sans = ImageFont.load_default()

    draw.rectangle((0, 0, width - 1, height - 1), outline=0, width=1)
    draw.text((16, 18), "THE RECEIPT / THERMAL CALIBRATION", fill=0, font=sans)
    draw.text((16, 38), f"WIDTH {width} DOTS / 203 DPI", fill=0, font=sans)

    y = 72
    for line_width in (1, 2, 3):
        draw.line((16, y, width - 16, y), fill=0, width=line_width)
        draw.text((16, y + 6), f"{line_width} DOT LINE", fill=0, font=sans)
        y += 42

    draw.text((16, y), "SANS  ABCDEFGHIJKLMNOPQRSTUVWXYZ", fill=0, font=sans)
    y += 24
    draw.text((16, y), "MONO  0123456789 / - : .", fill=0, font=sans)
    y += 42

    step_w = max(1, (width - 32) // 8)
    for i in range(8):
        shade = round(255 * i / 7)
        x0 = 16 + i * step_w
        x1 = width - 16 if i == 7 else x0 + step_w
        draw.rectangle((x0, y, x1, y + 90), fill=shade)
    draw.text((16, y + 98), "GREYSCALE 0 / 7", fill=0, font=sans)
    y += 132

    # Dense black field exposes power/thermal throttling and horizontal gaps.
    draw.rectangle((16, y, width - 16, y + 120), fill=0)
    draw.rectangle((28, y + 12, width - 28, y + 108), outline=255, width=2)
    draw.text((36, y + 52), "BLACK FIELD", fill=255, font=sans)
    y += 148

    # Deterministic pseudo-barcode, bracketed by crop marks.
    x = 24
    bars = (1, 3, 2, 1, 4, 2, 2, 3, 1, 1, 4, 3, 2, 1, 3, 4, 1, 2)
    for i, bar in enumerate(bars):
        if i % 2 == 0:
            draw.rectangle((x, y, x + bar * 2, y + 86), fill=0)
        x += bar * 2 + 1
    draw.text((16, y + 96), "BAR / TRANSFER ALIGNMENT", fill=0, font=sans)
    y += 132

    # QR-like registration matrix (not a URL; the real PASS QR is verified
    # separately). Finder blocks and alternating modules expose dot loss.
    cell = 5
    qx = 16
    qy = y
    for row in range(29):
        for col in range(29):
            finder = (
                (row < 7 and col < 7)
                or (row < 7 and col >= 22)
                or (row >= 22 and col < 7)
            )
            module = finder or ((row * 13 + col * 7 + row * col) % 5 < 2)
            if module:
                draw.rectangle(
                    (
                        qx + col * cell,
                        qy + row * cell,
                        qx + (col + 1) * cell - 1,
                        qy + (row + 1) * cell - 1,
                    ),
                    fill=0,
                )
    draw.text((180, y + 24), "MODULE / QR", fill=0, font=sans)
    draw.text((180, y + 44), "CHECK SQUARE DOTS", fill=0, font=sans)
    draw.text((180, y + 64), "NO CLIPPING", fill=0, font=sans)

    draw.line((0, height - 24, 20, height - 24), fill=0, width=1)
    draw.line((width - 21, height - 24, width - 1, height - 24), fill=0, width=1)
    return thermalize(canvas, autocontrast=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("calibration-pattern.png"))
    parser.add_argument("--print", action="store_true", dest="send_to_printer")
    args = parser.parse_args()

    settings = settings_from_env()
    pattern = build_test_pattern(settings.printer_width_dots)
    pattern.save(args.output)
    print(f"saved {args.output} ({pattern.width}x{pattern.height}, mode={pattern.mode})")

    if args.send_to_printer:
        if settings.booth_mode != "hardware":
            raise SystemExit("--print requires BOOTH_MODE=hardware")
        driver = make_printer(settings)
        driver.print_image(
            pattern,
            on_progress=lambda progress: print(
                f"\rprinting {progress * 100:5.1f}%", end="", flush=True
            ),
        )
        print("\nwrite/feed/cut sequence completed; physical result still needs inspection")


if __name__ == "__main__":
    main()
