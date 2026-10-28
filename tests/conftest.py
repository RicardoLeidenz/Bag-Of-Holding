import os

# Configure the app for testing before it is imported (app.py reads these at import time).
# This overrides values pipenv loads from .env, so tests never touch the development database.
# Set TEST_DATABASE_URL to run against a dedicated PostgreSQL test database (its tables are dropped after each test).
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite:///:memory:")
os.environ["JWT_SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ["FLASK_DEBUG"] = "1"

import pytest
from app import app as flask_app
from api.models import db
from api.utils import limiter


@pytest.fixture(autouse=True)
def reset_rate_limits():
    # Rate-limit counters live in memory for the whole test run; start each test fresh
    limiter.reset()


@pytest.fixture
def app():
    flask_app.config["TESTING"] = True
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_user(client):
    # Signs up and logs in a user, returning (user_id, auth headers)
    def _make_user(email="alice@test.com", password="password123"):
        client.post("/api/sign_up", json={"email": email, "password": password})
        response = client.post("/api/log_in", json={"email": email, "password": password})
        data = response.get_json()
        return data["user"]["id"], {"Authorization": "Bearer " + data["token"]}
    return _make_user


@pytest.fixture
def make_character(client):
    # Creates a character for the user owning the given headers, returning its JSON
    def _make_character(headers, name="Aria"):
        response = client.post("/api/character", headers=headers, json={
            "name": name, "race": "Elf", "characterClass": "Wizard", "subClass": "Evocation"
        })
        assert response.status_code == 201
        return response.get_json()["character"]
    return _make_character
