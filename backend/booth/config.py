"""Environment-driven settings.

Everything hardware-specific is selected here so the same codebase runs on
macOS (mock drivers) and on the Raspberry Pi (real drivers) without edits.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    return int(raw, 0) if raw else default


@dataclass(frozen=True)
class Settings:
    # Explicit runtime policy. Hardware mode is fail-closed: mock drivers are
    # a configuration error, never a successful-looking fallback.
    booth_mode: str = "mock"            # "mock" | "hardware"
    # Drivers: "mock" everywhere unless explicitly configured for hardware.
    # BOOTH_MOCK=1 forces both to mock regardless of the individual values.
    camera_driver: str = "mock"       # "mock" | "picamera2"
    printer_driver: str = "mock"      # "mock" | "escpos"

    # Thermal printer geometry. 384 dots = 58 mm paper, 576 dots = 80 mm.
    printer_width_dots: int = 384
    printer_cut: bool = True
    # Preferred path: the usblp device node the kernel creates for the
    # printer. Empty string -> talk raw USB via pyusb with the IDs below.
    printer_device: str = "/dev/usb/lp0"
    # USB IDs for the ESC/POS printer (see `lsusb` on the Pi).
    printer_usb_vendor: int = 0x28E9   # GDMicroelectronics micro-printer
    printer_usb_product: int = 0x0289

    # Capture geometry (portrait 3:4).
    still_size: tuple[int, int] = (1536, 2048)
    preview_size: tuple[int, int] = (480, 640)
    preview_fps: int = 15

    data_dir: Path = field(default_factory=lambda: Path("data"))

    # Printed on the receipt QR. Empty string disables the QR block.
    qr_base_url: str = "https://the-receipt.studio/p"

    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    )


def settings_from_env() -> Settings:
    mock_all = _env_flag("BOOTH_MOCK")
    camera = "mock" if mock_all else os.environ.get("CAMERA_DRIVER", "mock")
    printer = "mock" if mock_all else os.environ.get("PRINTER_DRIVER", "mock")
    mode = "mock" if mock_all else os.environ.get("BOOTH_MODE", "").strip().lower()
    if not mode:
        mode = "hardware" if camera != "mock" and printer != "mock" else "mock"
    if mode not in ("mock", "hardware"):
        raise ValueError("BOOTH_MODE must be 'mock' or 'hardware'")
    if mode == "hardware" and (camera == "mock" or printer == "mock"):
        raise ValueError(
            "BOOTH_MODE=hardware requires non-mock camera and printer drivers"
        )
    return Settings(
        booth_mode=mode,
        camera_driver=camera,
        printer_driver=printer,
        printer_width_dots=_env_int("PRINTER_WIDTH_DOTS", 384),
        printer_cut=_env_flag("PRINTER_CUT", True),
        printer_device=os.environ.get("PRINTER_DEVICE", "/dev/usb/lp0"),
        printer_usb_vendor=_env_int("PRINTER_USB_VENDOR", 0x28E9),
        printer_usb_product=_env_int("PRINTER_USB_PRODUCT", 0x0289),
        data_dir=Path(os.environ.get("BOOTH_DATA_DIR", "data")),
        qr_base_url=os.environ.get("QR_BASE_URL", "https://the-receipt.studio/p"),
        host=os.environ.get("BOOTH_HOST", "127.0.0.1"),
        port=_env_int("BOOTH_PORT", 8000),
        cors_origins=_env_origins("BOOTH_CORS_ORIGINS", Settings.cors_origins),
    )


def _env_origins(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    """Comma-separated origin list.

    The UI does not always sit on :3000 — a parity check or a second kiosk
    build runs elsewhere, and a CORS refusal looks exactly like a dead
    backend from the browser. Configurable rather than guessed.
    """
    raw = os.environ.get(name)
    if not raw:
        return default
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())
