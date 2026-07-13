"""Session store: serial allocation, frame persistence, lifecycle."""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from .config import Settings

SESSION_TTL_SECONDS = 10 * 60


@dataclass
class Session:
    id: str
    serial: str
    dir: Path
    created_at: float = field(default_factory=time.monotonic)
    frames: list[Path] = field(default_factory=list)

    @property
    def expired(self) -> bool:
        return time.monotonic() - self.created_at > SESSION_TTL_SECONDS


class SessionStore:
    def __init__(self, settings: Settings):
        self.root = settings.data_dir / "sessions"
        self.root.mkdir(parents=True, exist_ok=True)
        self._counter_file = settings.data_dir / "serial-counter"
        self._lock = threading.Lock()
        self._sessions: dict[str, Session] = {}

    def _next_serial(self) -> str:
        """Persistent `YYYY-NNNN` counter; survives restarts, resets yearly."""
        year = datetime.now().year
        with self._lock:
            last_year, seq = year, 0
            if self._counter_file.exists():
                try:
                    raw = self._counter_file.read_text().split(":")
                    last_year, seq = int(raw[0]), int(raw[1])
                except (ValueError, IndexError):
                    pass
            seq = seq + 1 if last_year == year else 1
            self._counter_file.write_text(f"{year}:{seq}")
        return f"{year}-{seq:04d}"

    def create(self) -> Session:
        self._sweep()
        sid = uuid.uuid4().hex[:12]
        serial = self._next_serial()
        sdir = self.root / serial
        sdir.mkdir(parents=True, exist_ok=True)
        session = Session(id=sid, serial=serial, dir=sdir)
        self._sessions[sid] = session
        return session

    def get(self, sid: str) -> Session | None:
        s = self._sessions.get(sid)
        return None if s is None or s.expired else s

    def add_frame(self, session: Session, jpeg: bytes) -> tuple[str, Path]:
        idx = len(session.frames) + 1
        path = session.dir / f"frame-{idx}.jpg"
        path.write_bytes(jpeg)
        session.frames.append(path)
        return f"{session.serial}-{idx}", path

    def frame_path(self, frame_id: str) -> Path | None:
        """frame_id is `{serial}-{n}`; resolve strictly under the store root."""
        serial, _, n = frame_id.rpartition("-")
        if not serial or not n.isdigit():
            return None
        path = (self.root / serial / f"frame-{n}.jpg").resolve()
        if not path.is_relative_to(self.root.resolve()) or not path.exists():
            return None
        return path

    def _sweep(self) -> None:
        for sid in [k for k, v in self._sessions.items() if v.expired]:
            del self._sessions[sid]
