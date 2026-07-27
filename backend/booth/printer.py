"""Printer drivers.

`PrinterDriver.print_image()` takes the fully rendered receipt (1-bit PIL
image at printer width) and pushes it to paper, reporting progress via a
callback so the UI's printing screen can track real progress.
"""

from __future__ import annotations

import os
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable

from PIL import Image

from .config import Settings

ProgressFn = Callable[[float], None]
StateFn = Callable[[str], None]

# Print the receipt in horizontal bands so we can report progress and avoid
# one giant USB transfer.
BAND_HEIGHT = 128


@dataclass(frozen=True)
class PrinterStatus:
    connection_available: bool
    device_status: str  # online | unknown | offline
    detail: str

    def as_dict(self) -> dict:
        return asdict(self)


class PrinterWriteError(RuntimeError):
    def __init__(self, message: str, *, bands_sent: int):
        super().__init__(message)
        self.bands_sent = bands_sent
        self.may_have_printed = bands_sent > 0


class PrinterDriver(ABC):
    @abstractmethod
    def print_image(
        self,
        image: Image.Image,
        on_progress: ProgressFn,
        on_state: StateFn | None = None,
    ) -> None: ...

    @abstractmethod
    def status(self) -> PrinterStatus: ...

    def healthy(self) -> bool:
        return self.status().connection_available


class MockPrinter(PrinterDriver):
    """Writes the receipt PNG to disk and simulates print time (~28 mm/s)."""

    def __init__(self, settings: Settings):
        self.out_dir = settings.data_dir / "prints"
        self.dots_per_second = 8 * 28  # 8 dots/mm * 28 mm/s

    def print_image(
        self,
        image: Image.Image,
        on_progress: ProgressFn,
        on_state: StateFn | None = None,
    ) -> None:
        self.out_dir.mkdir(parents=True, exist_ok=True)
        path = self.out_dir / f"receipt-{int(time.time() * 1000)}.png"
        image.save(path)
        total = image.height
        for y in range(0, total, BAND_HEIGHT):
            time.sleep(min(BAND_HEIGHT, total - y) / self.dots_per_second)
            on_progress(min(1.0, (y + BAND_HEIGHT) / total))
        if on_state:
            on_state("sent")
            on_state("feeding")
            on_state("cutting")
        on_progress(1.0)

    def status(self) -> PrinterStatus:
        return PrinterStatus(True, "online", "mock printer")


class EscposPrinter(PrinterDriver):
    """ESC/POS printer via python-escpos (raster mode, banded).

    Talks through the usblp device node (e.g. /dev/usb/lp0) when the kernel
    has claimed the printer — the robust path for GD32-style micro printers —
    or falls back to raw pyusb when no node is configured.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self._printer = None
        self._lock = threading.Lock()

    def _open(self):
        if self.settings.printer_device:
            from escpos.printer import File

            self._printer = File(self.settings.printer_device, auto_flush=True)
        else:
            from escpos.printer import Usb

            self._printer = Usb(
                self.settings.printer_usb_vendor,
                self.settings.printer_usb_product,
            )
        return self._printer

    def _close(self) -> None:
        if self._printer is None:
            return
        try:
            self._printer.close()
        except Exception:
            pass
        self._printer = None

    def print_image(
        self,
        image: Image.Image,
        on_progress: ProgressFn,
        on_state: StateFn | None = None,
    ) -> None:
        if image.width != self.settings.printer_width_dots:
            raise PrinterWriteError(
                f"payload width {image.width} != printer width "
                f"{self.settings.printer_width_dots}",
                bands_sent=0,
            )
        with self._lock:
            p = self._printer or self._open()
            total = image.height
            bands_sent = 0
            try:
                for y in range(0, total, BAND_HEIGHT):
                    band = image.crop(
                        (0, y, image.width, min(y + BAND_HEIGHT, total))
                    )
                    p.image(band, impl="bitImageRaster")
                    bands_sent += 1
                    on_progress(min(0.96, (y + band.height) / total * 0.96))
                if on_state:
                    on_state("sent")
                    on_state("feeding")
                p.print_and_feed(3)
                if on_state:
                    on_state("cutting")
                if self.settings.printer_cut:
                    p.cut()
                on_progress(1.0)
            except (BrokenPipeError, OSError, RuntimeError) as exc:
                self._close()
                raise PrinterWriteError(
                    f"ESC/POS write failed after {bands_sent} bands: {exc}",
                    bands_sent=bands_sent,
                ) from exc

    def status(self) -> PrinterStatus:
        if self.settings.printer_device:
            device = Path(self.settings.printer_device)
            if not device.exists():
                return PrinterStatus(False, "offline", f"{device} is missing")
            if not os.access(device, os.W_OK):
                return PrinterStatus(
                    False, "offline", f"{device} is not writable by this service"
                )
        try:
            p = self._printer or self._open()
        except Exception as exc:
            return PrinterStatus(False, "offline", f"open failed: {exc}")
        try:
            online = p.is_online()
            return PrinterStatus(
                bool(online),
                "online" if online else "offline",
                "ESC/POS realtime status",
            )
        except Exception as exc:
            # Cheap devices often accept writes but do not implement realtime
            # status. Keep availability and device status separate.
            return PrinterStatus(
                True,
                "unknown",
                f"connection available; realtime status unsupported: {exc}",
            )


def make_printer(settings: Settings) -> PrinterDriver:
    if settings.printer_driver == "escpos":
        return EscposPrinter(settings)
    return MockPrinter(settings)
