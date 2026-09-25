"""Test setup: run the Flask app against an in-memory MongoDB (mongomock)."""
import os
import sys

import mongomock
import pymongo
import pytest

os.environ["MONGO_URI"] = "mongodb://test"
os.environ["MONGO_DB_NAME"] = "smart_tutor_test"
os.environ["ADMIN_EMAIL"] = "admin@test.local"
os.environ["ADMIN_PASSWORD"] = "AdminPass123"
for key in ("SPEECH_KEY", "GROQ_API_KEY", "DEEPGRAM_API_KEY", "GEMINI_API_KEY"):
    os.environ.pop(key, None)

pymongo.MongoClient = mongomock.MongoClient  # must happen before the app is imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app as backend  # noqa: E402

PASSWORD = "kid-pass-1"


@pytest.fixture(autouse=True)
def clean_db():
    for name in backend.db.list_collection_names():
        backend.db[name].delete_many({})
    yield


@pytest.fixture
def client():
    return backend.app.test_client()


@pytest.fixture
def db():
    return backend.db


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def make_user(client):
    """Register and log in a user; returns the login JSON (token, user_id, ...)."""
    def _make(email, user_type="child", first="Test", last="User"):
        r = client.post("/api/register", json={
            "first_name": first, "last_name": last, "username": email,
            "password": PASSWORD, "user_type": user_type,
        })
        assert r.status_code in (201, 202), r.get_json()
        if user_type == "teacher":
            backend.db.users.update_one({"username": email.lower()}, {"$set": {"restricted": False}, "$unset": {"pending_approval": ""}})
            r = client.post("/api/login", json={"username": email, "password": PASSWORD})
            assert r.status_code == 200, r.get_json()
        return r.get_json()
    return _make


@pytest.fixture
def admin_token(client):
    r = client.post("/api/login", json={"username": "admin@test.local", "password": "AdminPass123"})
    assert r.status_code == 200
    return r.get_json()["token"]
