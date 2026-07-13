"""Print job queue: one worker thread, serialized jobs, polled state."""

from __future__ import annotations

import logging
import queue
import threading
import uuid
from dataclasses import dataclass, field

from .printer import PrinterDriver
from .receipt import KNOWN_STYLES, ReceiptRenderer
from .sessions import Session

log = logging.getLogger("booth.jobs")


@dataclass
class PrintJob:
    id: str
    session: Session
    style: str = "pass"  # "pass" | "cover"
    meta: dict = field(default_factory=dict)  # scent / quote from the UI
    state: str = "queued"  # queued | rendering | printing | done | error
    progress: float = 0.0
    message: str = ""
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "job_id": self.id,
                "state": self.state,
                "progress": round(self.progress, 3),
                "message": self.message,
            }

    def update(self, **kw) -> None:
        with self._lock:
            for k, v in kw.items():
                setattr(self, k, v)


class PrintQueue:
    def __init__(self, renderer: ReceiptRenderer, printer: PrinterDriver):
        self.renderer = renderer
        self.printer = printer
        self._jobs: dict[str, PrintJob] = {}
        self._by_session: dict[str, PrintJob] = {}
        self._submit_lock = threading.Lock()
        self._q: queue.Queue[PrintJob] = queue.Queue()
        self._worker = threading.Thread(target=self._run, daemon=True)
        self._worker.start()

    def submit(self, session: Session, style: str = "pass", meta: dict | None = None) -> PrintJob:
        """Idempotent per session: a repeat POST (double tap, client retry)
        returns the session's existing job instead of printing twice. Only a
        failed job frees the session for another attempt."""
        with self._submit_lock:
            existing = self._by_session.get(session.id)
            if existing is not None and existing.snapshot()["state"] != "error":
                return existing
            job = PrintJob(
                id=uuid.uuid4().hex[:12], session=session, style=style, meta=meta or {}
            )
            self._jobs[job.id] = job
            self._by_session[session.id] = job
        self._q.put(job)
        return job

    def get(self, job_id: str) -> PrintJob | None:
        return self._jobs.get(job_id)

    def _run(self) -> None:
        while True:
            job = self._q.get()
            try:
                job.update(state="rendering", progress=0.0)
                frames = [p.read_bytes() for p in job.session.frames]
                image = self.renderer.render(
                    frames, job.session.serial, style=job.style, meta=job.meta
                )
                # Keep a copy of what actually went to paper.
                image.save(job.session.dir / "receipt.png")

                job.update(state="printing")
                self.printer.print_image(
                    image, on_progress=lambda p: job.update(progress=p)
                )
                note = (
                    ""
                    if job.style in KNOWN_STYLES
                    else f"style '{job.style}' has no dedicated layout yet — printed with the default one"
                )
                job.update(state="done", progress=1.0, message=note)
                log.info("printed serial=%s job=%s style=%s", job.session.serial, job.id, job.style)
            except Exception as exc:  # printer unplugged, out of paper, ...
                log.exception("print job failed job=%s", job.id)
                job.update(state="error", message=str(exc))
