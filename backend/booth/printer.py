"""Printer drivers.

`PrinterDriver.print_image()` takes the fully rendered receipt (1-bit PIL
image at printer width) and pushes it to paper, reporting progress via a
callback so the UI's printing screen can track real progress.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Callable

from PIL import Image

from .config import Settings

ProgressFn = Callable[[float], None]

# Print the receipt in horizontal bands so we can report progress and avoid
# one giant USB transfer.
BAND_HEIGHT = 128


class PrinterDriver(ABC):
    @abstractmethod
    def print_image(self, image: Image.Image, on_progress: ProgressFn) -> None: ...

    @abstractmethod
    def healthy(self) -> bool: ...


class MockPrinter(PrinterDriver):
    """Writes the receipt PNG to disk and simulates print time (~28 mm/s)."""

    def __init__(self, settings: Settings):
        self.out_dir = settings.data_dir / "prints"
        self.dots_per_second = 8 * 28  # 8 dots/mm * 28 mm/s

    def print_image(self, image: Image.Image, on_progress: ProgressFn) -> None:
        self.out_dir.mkdir(parents=True, exist_ok=True)
        path = self.out_dir / f"receipt-{int(time.time() * 1000)}.png"
        image.save(path)
        total = image.height
        for y in range(0, total, BAND_HEIGHT):
            time.sleep(min(BAND_HEIGHT, total - y) / self.dots_per_second)
            on_progress(min(1.0, (y + BAND_HEIGHT) / total))
        on_progress(1.0)

    def healthy(self) -> bool:
        return True


class EscposPrinter(PrinterDriver):
    """ESC/POS over USB via python-escpos (raster mode, banded)."""

    def __init__(self, settings: Settings):
        from escpos.printer import Usb  # lazy: needs pyusb + udev on the Pi

        self.settings = settings
        self._Usb = Usb
        self._printer = Usb(settings.printer_usb_vendor, settings.printer_usb_product)

    def print_image(self, image: Image.Image, on_progress: ProgressFn) -> None:
        p = self._printer
        total = image.height
        for y in range(0, total, BAND_HEIGHT):
            band = image.crop((0, y, image.width, min(y + BAND_HEIGHT, total)))
            p.image(band, impl="bitImageRaster")
            on_progress(min(1.0, (y + BAND_HEIGHT) / total))
        p.print_and_feed(3)
        if self.settings.printer_cut:
            p.cut()
        on_progress(1.0)

    def healthy(self) -> bool:
        try:
            return self._printer.is_online()
        except Exception:
            # Some cheap printers don't answer status queries; being
            # constructed without a USB error is the best signal we have.
            return self._printer is not None


def make_printer(settings: Settings) -> PrinterDriver:
    if settings.printer_driver == "escpos":
        return EscposPrinter(settings)
    return MockPrinter(settings)
