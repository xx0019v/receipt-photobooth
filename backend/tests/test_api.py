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

    job = client.post(f"/api/sessions/{sid['session_id']}/print")
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


def test_unknown_session_404(client):
    assert client.post("/api/sessions/nope/capture").status_code == 404
    assert client.get("/api/frames/2099-9999-1.jpg").status_code == 404
