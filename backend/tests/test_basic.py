from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_create_game():
    resp = client.post("/game")
    assert resp.status_code == 200
    code = resp.json()["code"]
    assert len(code) == 4
