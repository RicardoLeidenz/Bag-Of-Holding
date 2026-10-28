from flask_jwt_extended import decode_token


def test_sign_up_and_log_in(client):
    response = client.post("/api/sign_up", json={"email": "a@test.com", "password": "pw123456"})
    assert response.status_code == 201

    response = client.post("/api/log_in", json={"email": "a@test.com", "password": "pw123456"})
    assert response.status_code == 200
    assert "token" in response.get_json()


def test_log_in_wrong_password(client):
    client.post("/api/sign_up", json={"email": "a@test.com", "password": "pw123456"})
    response = client.post("/api/log_in", json={"email": "a@test.com", "password": "wrong"})
    assert response.status_code == 401


def test_token_identity_is_decodable_string(app, client, make_user):
    user_id, headers = make_user()
    token = headers["Authorization"].split(" ")[1]
    assert decode_token(token)["sub"] == str(user_id)


def test_me_returns_current_user(client, make_user):
    user_id, headers = make_user()
    response = client.get("/api/me", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["user"]["id"] == user_id


def test_user_list_endpoint_removed(client, make_user):
    make_user()
    response = client.get("/api/user")
    # Falls through to the SPA catch-all or 404, but must not return user data
    assert b"alice@test.com" not in response.data


def test_token_lasts_12_hours(app, client, make_user):
    _, headers = make_user()
    claims = decode_token(headers["Authorization"].split(" ")[1])
    assert claims["exp"] - claims["iat"] == 12 * 60 * 60


def test_expired_token_is_json_401(app, client, make_user):
    from datetime import timedelta
    from flask_jwt_extended import create_access_token
    user_id, _ = make_user()
    expired = create_access_token(identity=str(user_id), expires_delta=timedelta(seconds=-1))
    response = client.get("/api/me", headers={"Authorization": "Bearer " + expired})
    assert response.status_code == 401
    assert "expired" in response.get_json()["error"].lower()
