"""FastAPI app — the HTTP contract the kiosk UI talks to.

Run (dev, mock drivers):
    BOOTH_MOCK=1 uvicorn booth.main:app --port 8000
Run (Pi):
    CAMERA_DRIVER=picamera2 PRINTER_DRIVER=escpos uvicorn booth.main:app
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from .camera import make_camera
from .config import settings_from_env
from .jobs import PrintQueue
from .printer import make_printer
from .receipt import ReceiptRenderer
from .sessions import SessionStore

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s %(message)s")

settings = settings_from_env()
settings.data_dir.mkdir(parents=True, exist_ok=True)

camera = make_camera(settings)
printer = make_printer(settings)
store = SessionStore(settings)
print_queue = PrintQueue(ReceiptRenderer(settings), printer)

@asynccontextmanager
async def lifespan(_: FastAPI):
    camera.start()
    yield
    camera.stop()


app = FastAPI(title="THE RECEIPT booth backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "camera": camera.healthy(),
        "printer": printer.healthy(),
        "drivers": {
            "camera": settings.camera_driver,
            "printer": settings.printer_driver,
        },
    }


@app.get("/api/preview.mjpg")
async def preview_stream() -> StreamingResponse:
    boundary = "boothframe"
    interval = 1 / settings.preview_fps

    async def gen():
        loop = asyncio.get_running_loop()
        while True:
            jpeg = await loop.run_in_executor(None, camera.preview_jpeg)
            yield (
                f"--{boundary}\r\ncontent-type: image/jpeg\r\n"
                f"content-length: {len(jpeg)}\r\n\r\n"
            ).encode() + jpeg + b"\r\n"
            await asyncio.sleep(interval)

    return StreamingResponse(
        gen(), media_type=f"multipart/x-mixed-replace; boundary={boundary}"
    )


@app.post("/api/sessions", status_code=201)
def create_session() -> dict:
    session = store.create()
    return {"session_id": session.id, "serial": session.serial}


@app.post("/api/sessions/{sid}/capture")
async def capture(sid: str) -> dict:
    session = store.get(sid)
    if session is None:
        raise HTTPException(404, "unknown or expired session")
    loop = asyncio.get_running_loop()
    jpeg = await loop.run_in_executor(None, camera.capture_jpeg)
    frame_id, _ = store.add_frame(session, jpeg)
    return {"frame_id": frame_id, "url": f"/api/frames/{frame_id}.jpg"}


@app.get("/api/frames/{frame_id}.jpg")
def frame(frame_id: str) -> FileResponse:
    path = store.frame_path(frame_id)
    if path is None:
        raise HTTPException(404, "unknown frame")
    return FileResponse(path, media_type="image/jpeg")


@app.post("/api/sessions/{sid}/print", status_code=202)
def print_session(sid: str) -> dict:
    session = store.get(sid)
    if session is None:
        raise HTTPException(404, "unknown or expired session")
    if not session.frames:
        raise HTTPException(409, "session has no captured frames")
    job = print_queue.submit(session)
    return {"job_id": job.id}


@app.get("/api/print-jobs/{job_id}")
def print_job(job_id: str) -> dict:
    job = print_queue.get(job_id)
    if job is None:
        raise HTTPException(404, "unknown job")
    return job.snapshot()
