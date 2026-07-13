"""End-to-end flow against the mock drivers: session -> 3 captures -> print."""

import importlib
import time

import pytest
from fastapi.testclient import TestClient


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


def test_unknown_style_falls_back_to_default_layout(client):
    """The frontend owns the style vocabulary: a style this side doesn't know
    yet must still print (default layout), not 4xx."""
    sid = client.post("/api/sessions").json()["session_id"]
    client.post(f"/api/sessions/{sid}/capture")
    res = client.post(
        f"/api/sessions/{sid}/print",
        json={"style": "film", "motif": {"id": "grain-01"}},
    )
    assert res.status_code == 202
    state = _wait_done(client, res.json()["job_id"])
    assert state["state"] == "done"
    assert "default" in state["message"]


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


def test_unknown_session_404(client):
    assert client.post("/api/sessions/nope/capture").status_code == 404
    assert client.get("/api/frames/2099-9999-1.jpg").status_code == 404
