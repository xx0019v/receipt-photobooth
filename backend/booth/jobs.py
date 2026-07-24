"""Print job queue: one worker thread, serialized jobs, polled state."""

from __future__ import annotations

import logging
import queue
import threading
import uuid
from dataclasses import dataclass, field

from .artifact import ThermalArtifact, save_bundle
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
    # 1-based indices into session.frames, in the guest's chosen print order.
    # None (or empty) prints every captured frame in capture order — the
    # pre-selection flow this backs is a frontend concern.
    frame_order: list[int] | None = None
    # Canonical raster handed over by the kiosk — already the exact artefact
    # the guest approved. When present the layout is NEVER rebuilt here.
    artifact: ThermalArtifact | None = None
    artifact_manifest: dict | None = None
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

    def submit(
        self,
        session: Session,
        style: str = "pass",
        meta: dict | None = None,
        frame_order: list[int] | None = None,
        artifact: ThermalArtifact | None = None,
        artifact_manifest: dict | None = None,
    ) -> PrintJob:
        """Idempotent per session: a repeat POST (double tap, client retry)
        returns the session's existing job instead of printing twice. Only a
        failed job frees the session for another attempt.

        Idempotency is keyed on the session AND, when a canonical raster is
        supplied, its hash: re-submitting the identical artefact rejoins the
        running job, while a genuinely different artefact for the same session
        is a programming error upstream and must not silently reuse the old
        job's paper."""
        with self._submit_lock:
            existing = self._by_session.get(session.id)
            if existing is not None and existing.snapshot()["state"] != "error":
                same_artifact = (
                    artifact is None
                    or existing.artifact is None
                    or existing.artifact.sha256 == artifact.sha256
                )
                if same_artifact:
                    return existing
            job = PrintJob(
                id=uuid.uuid4().hex[:12],
                session=session,
                style=style,
                meta=meta or {},
                frame_order=frame_order or None,
                artifact=artifact,
                artifact_manifest=artifact_manifest,
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
                note = ""

                if job.artifact is not None:
                    # Canonical path: the kiosk already rasterised the exact
                    # artefact the guest approved. Print those pixels; do not
                    # rebuild a layout here, or screen and paper drift apart.
                    image = job.artifact.thermal
                    save_bundle(
                        job.artifact,
                        job.session.dir,
                        manifest=job.artifact_manifest or {},
                    )
                else:
                    # Legacy path (no artifact supplied). Kept so existing
                    # callers and smoke tests keep working, but it re-derives
                    # the design and therefore cannot guarantee parity.
                    paths = job.session.frames
                    if job.frame_order:
                        paths = [
                            paths[i - 1] for i in job.frame_order if 1 <= i <= len(paths)
                        ] or paths
                    frames = [p.read_bytes() for p in paths]
                    image = self.renderer.render(
                        frames, job.session.serial, style=job.style, meta=job.meta
                    )
                    image.save(job.session.dir / "receipt.png")
                    note = (
                        "legacy renderer used — printed layout is not guaranteed "
                        "to match the screen artefact"
                    )
                    if job.style not in KNOWN_STYLES:
                        # Never silently print an unknown style as a PASS.
                        raise ValueError(
                            f"unknown style {job.style!r} and no canonical artifact supplied"
                        )

                job.update(state="printing")
                self.printer.print_image(
                    image, on_progress=lambda p: job.update(progress=p)
                )
                job.update(state="done", progress=1.0, message=note)
                log.info("printed serial=%s job=%s style=%s", job.session.serial, job.id, job.style)
            except Exception as exc:  # printer unplugged, out of paper, ...
                log.exception("print job failed job=%s", job.id)
                job.update(state="error", message=str(exc))
