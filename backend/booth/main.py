"""FastAPI app — the HTTP contract the kiosk UI talks to.

Run (dev, mock drivers):
    BOOTH_MOCK=1 uvicorn booth.main:app --port 8000
Run (Pi):
    CAMERA_DRIVER=picamera2 PRINTER_DRIVER=escpos uvicorn booth.main:app
"""

from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    FileResponse,
    HTMLResponse,
    Response,
    StreamingResponse,
)
from pydantic import BaseModel, ConfigDict

from .artifact import KNOWN_ARTIFACT_STYLES, ArtifactError, prepare
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
    """Health plus the facts the kiosk needs before it rasterises.

    `printer.width_dots` is reported rather than assumed by the frontend:
    58 mm (384) and 80 mm (576) heads are both plausible, and rastering at
    the wrong width would silently letterbox or crop the artefact.

    `mode` is explicit ("hardware" | "mock") so the kiosk can refuse to run a
    mock print as if it were real — a mock booth must LOOK like a mock booth.
    """
    is_mock = settings.printer_driver == "mock" or settings.camera_driver == "mock"
    return {
        "status": "ok",
        "mode": "mock" if is_mock else "hardware",
        "camera": camera.healthy(),
        "printer": printer.healthy(),
        "drivers": {
            "camera": settings.camera_driver,
            "printer": settings.printer_driver,
        },
        "artifact": {
            "width_dots": settings.printer_width_dots,
            "styles": list(KNOWN_ARTIFACT_STYLES),
            "dpi": 203,
            "physical_width_mm": round(settings.printer_width_dots / 8, 2),
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


class PrintRequest(BaseModel):
    """Print payload for the LEGACY server-rendered path.

    Prefer `POST /print-artifact`: this route re-derives the layout in Python
    and therefore cannot guarantee the paper matches the screen. It is kept
    for smoke tests and for callers that predate the artefact pipeline.

    Extra fields (`motif`, future additions) are passed through to the
    renderer untouched. `style` is validated — an unknown style is refused,
    never quietly printed as a PASS.

    `frames` is optional: the guest may capture more frames than get printed
    (e.g. 6 captured, 3 selected). When set, it is a 1-based, print-order
    list of indices into the frames captured on this session; omitted means
    "print every captured frame, in capture order".
    """

    model_config = ConfigDict(extra="allow")

    style: str = "pass"
    scent: dict | None = None
    quote: dict | None = None
    frames: list[int] | None = None


@app.post("/api/sessions/{sid}/print", status_code=202)
def print_session(sid: str, req: PrintRequest | None = None) -> dict:
    session = store.get(sid)
    if session is None:
        raise HTTPException(404, "unknown or expired session")
    if not session.frames:
        raise HTTPException(409, "session has no captured frames")
    req = req or PrintRequest()
    if req.style not in KNOWN_ARTIFACT_STYLES:
        # Refuse rather than default. Printing an unknown style as a PASS
        # hands the guest an artefact they never chose.
        raise HTTPException(
            422,
            f"unknown style {req.style!r}; expected one of {list(KNOWN_ARTIFACT_STYLES)}",
        )
    if req.frames is not None and any(
        n < 1 or n > len(session.frames) for n in req.frames
    ):
        raise HTTPException(422, "frame selection out of range")
    meta = {"scent": req.scent, "quote": req.quote, **(req.model_extra or {})}
    # Idempotent per session: a duplicate POST returns the same job.
    job = print_queue.submit(session, style=req.style, meta=meta, frame_order=req.frames)
    return {"job_id": job.id}


@app.post("/api/sessions/{sid}/print-artifact", status_code=202)
async def print_artifact(
    sid: str,
    manifest: str = Form(...),
    artifact_hash: str = Form(...),
    artifact: UploadFile = File(...),
    idempotency_key: str | None = Form(None),
) -> dict:
    """Print the canonical raster the kiosk rendered.

    This is the parity-preserving path: the artefact arrives as pixels that
    the guest already approved on screen, so no layout is rebuilt here. We
    validate and thermalise only.

    Anything suspicious is refused rather than substituted — printing a
    different design is a worse outcome than printing nothing.
    """
    session = store.get(sid)
    if session is None:
        raise HTTPException(404, "unknown or expired session")

    try:
        spec = json.loads(manifest)
    except json.JSONDecodeError as exc:
        raise HTTPException(422, f"manifest is not valid JSON: {exc}") from exc

    style = spec.get("style")
    if not isinstance(style, str):
        raise HTTPException(422, "manifest.style missing")

    # The serial identifies the edition; a mismatch means the artefact was
    # built for a different session and must never reach paper.
    spec_serial = spec.get("serial")
    if spec_serial and spec_serial != session.serial:
        raise HTTPException(
            422, f"manifest serial {spec_serial!r} != session serial {session.serial!r}"
        )

    order = spec.get("selectedFrameOrder") or []
    if order and any(
        not isinstance(n, int) or n < 1 or n > len(session.frames) for n in order
    ):
        raise HTTPException(422, "selectedFrameOrder out of range for this session")

    data = await artifact.read()
    try:
        prepared = prepare(
            data,
            style=style,
            expected_width_dots=settings.printer_width_dots,
            expected_sha256=artifact_hash,
        )
    except ArtifactError as exc:
        # 422: the upload is well-formed HTTP but unusable as an artefact.
        raise HTTPException(422, str(exc)) from exc

    job = print_queue.submit(
        session,
        style=style,
        meta=spec,
        frame_order=order or None,
        artifact=prepared,
        artifact_manifest={
            **spec,
            "idempotency_key": idempotency_key,
            "printer_width_dots": settings.printer_width_dots,
            "printer_driver": settings.printer_driver,
        },
    )
    return {
        "job_id": job.id,
        "artifact_sha256": prepared.sha256,
        "width_dots": prepared.width_dots,
        "height_dots": prepared.height_dots,
        "black_ratio": prepared.black_ratio,
    }


@app.get("/api/print-jobs/{job_id}")
def print_job(job_id: str) -> dict:
    job = print_queue.get(job_id)
    if job is None:
        raise HTTPException(404, "unknown job")
    return job.snapshot()


# -- share page: where the printed / on-screen QR actually lands ---------------


@app.get("/api/qr/{serial}.png")
def qr_png(serial: str) -> Response:
    """Real, scannable QR for the DONE screen (same URL as the printed one)."""
    import io

    import qrcode

    if store.serial_dir(serial) is None:
        raise HTTPException(404, "unknown serial")
    qr = qrcode.QRCode(border=1, box_size=12)
    qr.add_data(f"{settings.qr_base_url}/{serial}")
    qr.make(fit=True)
    buf = io.BytesIO()
    qr.make_image().save(buf, "PNG")
    return Response(buf.getvalue(), media_type="image/png")


_SHARE_PAGE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>THE RECEIPT — {serial}</title>
<style>
  body {{ margin:0; background:#f4f1e9; color:#111; font-family:Georgia,'Times New Roman',serif; }}
  main {{ max-width:520px; margin:0 auto; padding:40px 20px 80px; }}
  h1 {{ font-size:34px; font-weight:600; letter-spacing:-0.01em; margin:0; }}
  .k {{ font-family:ui-monospace,Menlo,monospace; font-size:11px; letter-spacing:0.3em;
        text-transform:uppercase; color:#8a877f; }}
  .rule {{ border-top:1px dashed #111; margin:26px 0; }}
  img {{ width:100%; display:block; filter:grayscale(1) contrast(1.1); }}
  figure {{ margin:0 0 14px; }}
  a.dl {{ display:block; text-align:center; border:1px solid #111; color:#111;
          text-decoration:none; padding:14px 0; margin-top:10px;
          font-family:ui-monospace,Menlo,monospace; font-size:12px;
          letter-spacing:0.28em; text-transform:uppercase; }}
  footer {{ margin-top:44px; text-align:center; font-style:italic; font-size:16px; }}
</style></head><body><main>
<p class="k">Parfum Receipt Studio</p>
<h1>THE RECEIPT</h1>
<p class="k" style="margin-top:10px">{serial}</p>
<div class="rule"></div>
{receipt_block}
{photo_blocks}
<footer>Thank you — keep this moment.</footer>
</main></body></html>"""


@app.get("/p/{serial}", response_class=HTMLResponse)
def share_page(serial: str) -> str:
    sdir = store.serial_dir(serial)
    if sdir is None:
        raise HTTPException(404, "unknown serial")
    receipt_block = ""
    if (sdir / "receipt.png").exists():
        receipt_block = (
            f'<figure><img src="/p/{serial}/receipt.png" alt="receipt"></figure>'
            f'<a class="dl" href="/p/{serial}/receipt.png" download>Save the receipt</a>'
            '<div class="rule"></div>'
        )
    photos = sorted(sdir.glob("frame-*.jpg"))
    photo_blocks = "".join(
        f'<figure><img src="/api/frames/{serial}-{i}.jpg" alt="frame {i}"></figure>'
        f'<a class="dl" href="/api/frames/{serial}-{i}.jpg" download>Save frame {i:02d}</a>'
        for i, _ in enumerate(photos, start=1)
    )
    return _SHARE_PAGE.format(
        serial=serial, receipt_block=receipt_block, photo_blocks=photo_blocks
    )


@app.get("/p/{serial}/receipt.png")
def share_receipt(serial: str) -> FileResponse:
    sdir = store.serial_dir(serial)
    if sdir is None or not (sdir / "receipt.png").exists():
        raise HTTPException(404, "no receipt for this serial")
    return FileResponse(sdir / "receipt.png", media_type="image/png")
