import os
import subprocess
import sys

import pytest


###### SIGN UP / LOG IN ######

@pytest.mark.parametrize("body,message", [
    ({"email": "a@test.com"}, "'password' is required"),
    ({"password": "password123"}, "'email' is required"),
    ({"email": "not-an-email", "password": "password123"}, "valid email"),
    ({"email": "a@test.com", "password": "short"}, "at least 8"),
    ({"email": 5, "password": "password123"}, "must be text"),
])
def test_sign_up_rejects_invalid_input(client, body, message):
    response = client.post("/api/sign_up", json=body)
    assert response.status_code == 400
    assert message in response.get_json()["error"]


def test_sign_up_rejects_non_json_body(client):
    response = client.post("/api/sign_up", data="hello", content_type="text/plain")
    assert response.status_code == 400
    assert "JSON" in response.get_json()["error"]


def test_duplicate_email_is_409_and_case_insensitive(client):
    client.post("/api/sign_up", json={"email": "a@test.com", "password": "password123"})
    response = client.post("/api/sign_up", json={"email": " A@Test.com ", "password": "password123"})
    assert response.status_code == 409


def test_log_in_same_error_for_unknown_email_and_wrong_password(client):
    client.post("/api/sign_up", json={"email": "a@test.com", "password": "password123"})
    unknown = client.post("/api/log_in", json={"email": "b@test.com", "password": "password123"})
    wrong = client.post("/api/log_in", json={"email": "a@test.com", "password": "wrong-password"})
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.get_json() == wrong.get_json()


def test_log_in_is_rate_limited(client):
    client.post("/api/sign_up", json={"email": "a@test.com", "password": "password123"})
    codes = [client.post("/api/log_in", json={"email": "a@test.com", "password": "wrong-password"}).status_code
             for _ in range(6)]
    assert codes == [401] * 5 + [429]
    assert "error" in client.post("/api/log_in", json={"email": "a@test.com", "password": "x"}).get_json()


###### CHARACTERS ######

def test_create_character_validates_fields(client, make_user):
    _, headers = make_user()
    base = {"name": "Aria", "race": "Elf", "characterClass": "Wizard", "subClass": "Evocation"}

    missing = {k: v for k, v in base.items() if k != "race"}
    assert client.post("/api/character", headers=headers, json=missing).status_code == 400

    too_long = {**base, "name": "x" * 26}
    response = client.post("/api/character", headers=headers, json=too_long)
    assert response.status_code == 400
    assert "at most 25" in response.get_json()["error"]

    blank = {**base, "name": "   "}
    assert client.post("/api/character", headers=headers, json=blank).status_code == 400


@pytest.mark.parametrize("field,value", [
    ("level", 0), ("level", 21), ("level", "5"), ("level", None), ("level", True),
    ("hp", -1), ("ac", 100), ("hitDice", "1d10+5"), ("hitDice", 8),
])
def test_update_character_rejects_bad_values(client, make_user, make_character, field, value):
    _, headers = make_user()
    character = make_character(headers)
    response = client.put("/api/character", headers=headers, json={"id": character["id"], field: value})
    assert response.status_code == 400


def test_update_character_is_all_or_nothing(client, make_user, make_character):
    _, headers = make_user()
    character = make_character(headers)
    # hp is valid but level is not: nothing should be saved
    client.put("/api/character", headers=headers, json={"id": character["id"], "hp": 30, "level": 99})
    saved = client.get(f"/api/character/{character['id']}", headers=headers).get_json()["character"]
    assert saved["hp"] == 0


def test_update_character_ignores_unknown_fields(client, make_user, make_character):
    # The frontend sends the whole character (stats, skills...) when saving
    _, headers = make_user()
    character = make_character(headers)
    response = client.put("/api/character", headers=headers, json={**character, "hp": 12, "hitDice": "1d8"})
    assert response.status_code == 200
    assert response.get_json()["Character updated"]["hp"] == 12


def test_stat_value_range(client, make_user, make_character):
    _, headers = make_user()
    stat_id = make_character(headers)["stats"][0]["id"]
    assert client.put("/api/stat", headers=headers, json={"id": stat_id, "value": 31}).status_code == 400
    assert client.put("/api/stat", headers=headers, json={"id": stat_id, "value": None}).status_code == 400
    assert client.put("/api/stat", headers=headers, json={"id": stat_id, "value": 18}).status_code == 200


def test_consumable_validation(client, make_user, make_character):
    _, headers = make_user()
    character = make_character(headers)
    assert client.post("/api/consumable", headers=headers,
                       json={"character_id": character["id"], "name": ""}).status_code == 400
    created = client.post("/api/consumable", headers=headers,
                          json={"character_id": character["id"], "name": "Potion"})
    assert created.status_code == 201
    consumable_id = created.get_json()["Consumable Created"]["id"]
    assert client.put("/api/consumable", headers=headers,
                      json={"id": consumable_id, "amount": -1}).status_code == 400
    assert client.put("/api/consumable", headers=headers, json={"amount": 3}).status_code == 400


###### ERROR FORMAT ######

def test_unknown_api_path_is_json_404(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Not found"}


def test_wrong_method_is_json_405(client):
    response = client.patch("/api/character")
    assert response.status_code == 405
    assert "error" in response.get_json()


def test_invalid_token_is_json_401(client):
    response = client.get("/api/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
    assert "error" in response.get_json()


###### ADMIN ######

def test_admin_disabled_in_production():
    # app.py decides at import time, so check a fresh production-mode import in a separate process
    env = {**os.environ, "FLASK_DEBUG": "0", "JWT_SECRET_KEY": "x" * 32, "DATABASE_URL": "sqlite:///:memory:"}
    code = "from app import app; print(any(r.rule.startswith('/admin') for r in app.url_map.iter_rules()))"
    result = subprocess.run([sys.executable, "-c", code], cwd="src", env=env, capture_output=True, text=True)
    assert result.stdout.strip() == "False", result.stderr


def test_admin_enabled_in_development(app):
    assert any(r.rule.startswith("/admin") for r in app.url_map.iter_rules())


###### RATE LIMIT SWITCH ######

def _limiter_enabled(extra_env):
    env = {**os.environ, "FLASK_DEBUG": "1", "JWT_SECRET_KEY": "x" * 32,
           "DATABASE_URL": "sqlite:///:memory:", **extra_env}
    env.pop("RATELIMIT_ENABLED", None) if "RATELIMIT_ENABLED" not in extra_env else None
    code = "from app import app; from api.utils import limiter; print(limiter.enabled)"
    result = subprocess.run([sys.executable, "-c", code], cwd="src", env=env, capture_output=True, text=True)
    return result.stdout.strip().splitlines()[-1]


def test_rate_limiting_on_by_default():
    assert _limiter_enabled({}) == "True"


def test_rate_limiting_can_be_disabled_for_e2e_runs():
    assert _limiter_enabled({"RATELIMIT_ENABLED": "false"}) == "False"
