"""Camera drivers.

`CameraDriver` is the only surface the rest of the app sees:
  - `preview_jpeg()`  — latest low-res frame for the MJPEG stream
  - `capture_jpeg()`  — full-res still, portrait 3:4

Drivers: `MockCamera` (runs anywhere, used on macOS and in tests) and
`Picamera2Camera` (Raspberry Pi, imported lazily so the module loads off-Pi).
"""

from __future__ import annotations

import io
import math
import threading
import time
from abc import ABC, abstractmethod

from PIL import Image, ImageDraw, ImageOps

from .config import Settings


class CameraDriver(ABC):
    @abstractmethod
    def start(self) -> None: ...

    @abstractmethod
    def stop(self) -> None: ...

    @abstractmethod
    def preview_jpeg(self) -> bytes:
        """Latest preview frame as JPEG (portrait 3:4)."""

    @abstractmethod
    def capture_jpeg(self) -> bytes:
        """High-res still as JPEG (portrait 3:4)."""

    def healthy(self) -> bool:
        try:
            return len(self.preview_jpeg()) > 0
        except Exception:
            return False


def crop_portrait_3x4(img: Image.Image) -> Image.Image:
    """Center-crop any frame to portrait 3:4."""
    w, h = img.size
    target = 3 / 4
    if w / h > target:  # too wide
        new_w = int(h * target)
        x = (w - new_w) // 2
        return img.crop((x, 0, x + new_w, h))
    new_h = int(w / target)
    y = (h - new_h) // 2
    return img.crop((0, y, 0 + w, y + new_h))


def _jpeg(img: Image.Image, quality: int = 85) -> bytes:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=quality)
    return buf.getvalue()


class MockCamera(CameraDriver):
    """Synthesizes an editorial-looking grayscale portrait with a moving
    element so the preview stream visibly updates."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._t0 = time.monotonic()

    def start(self) -> None:
        pass

    def stop(self) -> None:
        pass

    def _render(self, size: tuple[int, int]) -> Image.Image:
        w, h = size
        t = time.monotonic() - self._t0
        img = Image.new("L", (w, h), 235)
        d = ImageDraw.Draw(img)

        # vignette-ish background bands
        for i in range(6):
            g = 225 - i * 12
            d.ellipse(
                [w * 0.5 - w * (0.9 - i * 0.12), h * 0.34 - h * (0.7 - i * 0.09),
                 w * 0.5 + w * (0.9 - i * 0.12), h * 0.34 + h * (0.7 - i * 0.09)],
                outline=None, fill=g,
            )

        # swaying silhouette (head + shoulders)
        sway = math.sin(t * 1.4) * w * 0.03
        cx = w / 2 + sway
        d.ellipse([cx - w * 0.19, h * 0.28, cx + w * 0.19, h * 0.52], fill=18)
        d.polygon(
            [(cx - w * 0.42, h), (cx - w * 0.30, h * 0.62), (cx, h * 0.56),
             (cx + w * 0.30, h * 0.62), (cx + w * 0.42, h)],
            fill=18,
        )

        # timecode so stills are distinguishable
        d.text((w * 0.05, h * 0.94), f"MOCK {t:07.2f}", fill=90)
        return img

    def preview_jpeg(self) -> bytes:
        return _jpeg(self._render(self.settings.preview_size), quality=70)

    def capture_jpeg(self) -> bytes:
        return _jpeg(self._render(self.settings.still_size), quality=92)


class Picamera2Camera(CameraDriver):
    """Raspberry Pi camera via Picamera2/libcamera.

    Runs one video-mode pipeline: `main` at still resolution (captures pull
    from it) and `lores` for the preview stream, so exposure stays continuous
    and captures return in well under 500 ms (no mode switch).
    """

    def __init__(self, settings: Settings):
        from picamera2 import Picamera2  # lazy: only importable on the Pi

        self.settings = settings
        self._lock = threading.Lock()
        self.picam = Picamera2()
        main_w, main_h = settings.still_size
        # Sensor is landscape; request swapped dims and crop to portrait.
        config = self.picam.create_video_configuration(
            main={"size": (main_h, main_w), "format": "RGB888"},
            lores={"size": (640, 480), "format": "YUV420"},
        )
        self.picam.configure(config)

    def start(self) -> None:
        self.picam.start()

    def stop(self) -> None:
        self.picam.stop()

    def _grab(self, stream: str) -> Image.Image:
        with self._lock:
            arr = self.picam.capture_array(stream)
        if stream == "lores":  # YUV420 planar -> take Y plane as grayscale
            h = arr.shape[0] * 2 // 3
            img = Image.fromarray(arr[:h, :], "L")
        else:
            img = Image.fromarray(arr[:, :, ::-1])  # BGR -> RGB
        return crop_portrait_3x4(img)

    def preview_jpeg(self) -> bytes:
        img = self._grab("lores").resize(self.settings.preview_size)
        return _jpeg(img, quality=70)

    def capture_jpeg(self) -> bytes:
        img = ImageOps.autocontrast(self._grab("main"), cutoff=1)
        return _jpeg(img, quality=92)


def make_camera(settings: Settings) -> CameraDriver:
    if settings.camera_driver == "picamera2":
        return Picamera2Camera(settings)
    return MockCamera(settings)
