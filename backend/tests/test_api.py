"""End-to-end flow against the mock drivers: session -> 3 captures -> print."""

import hashlib
import importlib
import io
import json
import time

import pytest
from fastapi.testclient import TestClient
from PIL import Image


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("BOOTH_MOCK", "1")
    monkeypatch.setenv("BOOTH_DATA_DIR", str(tmp_path))
    import booth.main

    importlib.reload(booth.main)
    with TestClient(booth.main.app) as c:
        yield c


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["camera"] is True
    assert body["drivers"] == {"camera": "mock", "printer": "mock"}


def test_full_session_flow(client):
    sid = client.post("/api/sessions").json()
    assert sid["serial"].count("-") == 1

    urls = []
    for _ in range(3):
        res = client.post(f"/api/sessions/{sid['session_id']}/capture")
        assert res.status_code == 200
        urls.append(res.json()["url"])

    for url in urls:
        res = client.get(url)
        assert res.status_code == 200
        assert res.headers["content-type"] == "image/jpeg"

    job = client.post(
        f"/api/sessions/{sid['session_id']}/print",
        json={
            "style": "cover",
            "scent": {"mood": "Warm", "name": "SLOW BURN"},
            "quote": {"text": "trust the process.", "variant": "serif-italic"},
        },
    )
    assert job.status_code == 202
    job_id = job.json()["job_id"]

    deadline = time.time() + 30
    state = None
    while time.time() < deadline:
        state = client.get(f"/api/print-jobs/{job_id}").json()
        if state["state"] in ("done", "error"):
            break
        time.sleep(0.2)
    assert state["state"] == "done", state
    assert state["progress"] == 1.0


def test_print_empty_session_rejected(client):
    sid = client.post("/api/sessions").json()["session_id"]
    assert client.post(f"/api/sessions/{sid}/print").status_code == 409


def test_share_page_and_qr(client):
    sid = client.post("/api/sessions").json()
    for _ in range(2):
        client.post(f"/api/sessions/{sid['session_id']}/capture")
    serial = sid["serial"]

    page = client.get(f"/p/{serial}")
    assert page.status_code == 200
    assert serial in page.text
    assert f"/api/frames/{serial}-1.jpg" in page.text

    qr = client.get(f"/api/qr/{serial}.png")
    assert qr.status_code == 200
    assert qr.headers["content-type"] == "image/png"

    assert client.get("/p/2099-9999").status_code == 404
    assert client.get("/p/../etc").status_code == 404


def _wait_done(client, job_id, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        state = client.get(f"/api/print-jobs/{job_id}").json()
        if state["state"] in ("done", "error"):
            return state
        time.sleep(0.2)
    raise AssertionError("print job did not finish")


def test_unknown_style_is_refused_not_defaulted(client):
    """An unknown style must NOT print as a PASS.

    This inverts the old behaviour deliberately. Falling back to the default
    layout means the guest walks away holding an artefact they never chose —
    a worse outcome than an error the operator can see and fix.
    """
    sid = client.post("/api/sessions").json()["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = client.post(
        f"/api/sessions/{sid}/print",
        json={"style": "film", "motif": {"id": "grain-01"}},
    )
    assert res.status_code == 422
    assert "unknown style" in res.json()["detail"]


def test_duplicate_print_is_idempotent(client):
    sid = client.post("/api/sessions").json()["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    first = client.post(f"/api/sessions/{sid}/print", json={"style": "pass"})
    second = client.post(f"/api/sessions/{sid}/print", json={"style": "pass"})
    assert first.json()["job_id"] == second.json()["job_id"]
    # ...even after the job has finished: one session, one print.
    _wait_done(client, first.json()["job_id"])
    third = client.post(f"/api/sessions/{sid}/print", json={"style": "pass"})
    assert third.json()["job_id"] == first.json()["job_id"]


def test_print_frame_selection_reorders_and_subsets(client):
    """Capture 6, print only 3 — in a print order that isn't capture order."""
    sid = client.post("/api/sessions").json()["session_id"]
    for _ in range(6):
        client.post(f"/api/sessions/{sid}/capture")
    res = client.post(
        f"/api/sessions/{sid}/print",
        json={"style": "pass", "frames": [4, 1, 6]},
    )
    assert res.status_code == 202
    state = _wait_done(client, res.json()["job_id"])
    assert state["state"] == "done"


def test_print_frame_selection_out_of_range_rejected(client):
    sid = client.post("/api/sessions").json()["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = client.post(
        f"/api/sessions/{sid}/print",
        json={"style": "pass", "frames": [1, 9]},
    )
    assert res.status_code == 422


def test_unknown_session_404(client):
    assert client.post("/api/sessions/nope/capture").status_code == 404
    assert client.get("/api/frames/2099-9999-1.jpg").status_code == 404


# -- canonical artefact path ---------------------------------------------------


def _artifact_png(width=384, height=900):
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), "white")
    # A few black marks so the result isn't a blank page.
    for y in range(100, 200):
        for x in range(20, width - 20):
            img.putpixel((x, y), (0, 0, 0))
    img.save(buf, format="PNG")
    return buf.getvalue()


def _post_artifact(client, sid, *, manifest, data=None, artifact_hash=None):
    data = _artifact_png() if data is None else data
    return client.post(
        f"/api/sessions/{sid}/print-artifact",
        data={
            "manifest": json.dumps(manifest),
            "artifact_hash": artifact_hash or hashlib.sha256(data).hexdigest(),
        },
        files={"artifact": ("artifact.png", data, "image/png")},
    )


def test_health_reports_printer_geometry_and_mode(client):
    body = client.get("/api/health").json()
    # The kiosk rasterises to whatever width the head actually has.
    assert body["artifact"]["width_dots"] == 384
    assert set(body["artifact"]["styles"]) == {"pass", "cover"}
    # A mock booth must never look like a real one.
    assert body["mode"] == "mock"


def test_artifact_prints_the_uploaded_pixels(client):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    for _ in range(3):
        client.post(f"/api/sessions/{sid}/capture")

    data = _artifact_png()
    res = _post_artifact(
        client,
        sid,
        manifest={
            "style": "pass",
            "serial": session["serial"],
            "selectedFrameOrder": [3, 1, 2],
        },
        data=data,
    )
    assert res.status_code == 202, res.text
    body = res.json()
    assert body["artifact_sha256"] == hashlib.sha256(data).hexdigest()
    assert body["width_dots"] == 384
    # The source artwork is 900 dots. Production adds a fixed 96-dot white
    # tear margin to the actual printer payload so the design clears the head.
    assert body["height_dots"] == 996

    state = _wait_done(client, body["job_id"])
    assert state["state"] == "done", state


def test_artifact_with_wrong_serial_is_refused(client):
    """A raster built for another session must never reach paper."""
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = _post_artifact(
        client, sid, manifest={"style": "pass", "serial": "1999-0001"}
    )
    assert res.status_code == 422
    assert "serial" in res.json()["detail"]


def test_artifact_with_bad_hash_is_refused(client):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = _post_artifact(
        client,
        sid,
        manifest={"style": "pass", "serial": session["serial"]},
        artifact_hash="0" * 64,
    )
    assert res.status_code == 422
    assert "hash mismatch" in res.json()["detail"]


def test_artifact_with_unknown_style_is_refused(client):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = _post_artifact(
        client, sid, manifest={"style": "ticket", "serial": session["serial"]}
    )
    assert res.status_code == 422
    assert "unknown style" in res.json()["detail"]


def test_artifact_with_wrong_width_is_refused(client):
    """Rastered for an 80 mm head, printed on a 58 mm one — would be cropped."""
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = _post_artifact(
        client,
        sid,
        manifest={"style": "pass", "serial": session["serial"]},
        data=_artifact_png(width=576),
    )
    assert res.status_code == 422
    assert "width" in res.json()["detail"]


def test_artifact_frame_order_out_of_range_is_refused(client):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = _post_artifact(
        client,
        sid,
        manifest={
            "style": "pass",
            "serial": session["serial"],
            "selectedFrameOrder": [1, 9],
        },
    )
    assert res.status_code == 422


def test_identical_artifact_resubmit_rejoins_the_same_job(client):
    """A double tap or a client retry must not print twice."""
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    manifest = {"style": "cover", "serial": session["serial"]}
    data = _artifact_png()
    first = _post_artifact(client, sid, manifest=manifest, data=data)
    second = _post_artifact(client, sid, manifest=manifest, data=data)
    assert first.json()["job_id"] == second.json()["job_id"]


def test_artifact_bundle_is_written_for_audit(client, tmp_path):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = _post_artifact(
        client, sid, manifest={"style": "cover", "serial": session["serial"]}
    )
    job_id = res.json()["job_id"]
    _wait_done(client, job_id)

    out = (
        tmp_path
        / "sessions"
        / session["serial"]
        / "print-jobs"
        / job_id
    )
    manifest = json.loads((out / "manifest.json").read_text())
    assert manifest["artifact_sha256"] == res.json()["artifact_sha256"]
    assert manifest["printer_driver"] == "mock"
    for name in (
        "artifact-source.png",
        "artifact-thermal.png",
        "artifact-final-1bit.png",
        "printer-payload.png",
        "job-state.json",
        "print.log",
    ):
        assert (out / name).exists(), name
    state = json.loads((out / "job-state.json").read_text())
    assert state["state"] == "done"
    assert (tmp_path / "sessions" / session["serial"] / "receipt.png").exists()


def test_different_artifact_for_same_session_is_conflict(client):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    manifest = {"style": "pass", "serial": session["serial"]}
    first = _post_artifact(client, sid, manifest=manifest)
    assert first.status_code == 202

    different = _artifact_png(height=901)
    second = _post_artifact(client, sid, manifest=manifest, data=different)
    assert second.status_code == 409
    assert "different artifact" in second.json()["detail"]


def test_clear_captures_resets_frame_numbering(client):
    session = client.post("/api/sessions").json()
    sid = session["session_id"]
    first = client.post(f"/api/sessions/{sid}/capture").json()
    assert first["frame_id"].endswith("-1")
    assert client.delete(f"/api/sessions/{sid}/frames").status_code == 204
    replacement = client.post(f"/api/sessions/{sid}/capture").json()
    assert replacement["frame_id"].endswith("-1")
