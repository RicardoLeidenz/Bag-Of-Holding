import pytest


def test_rename_character(client, make_user, make_character):
    _, headers = make_user()
    character = make_character(headers)
    response = client.put("/api/character", headers=headers, json={"id": character["id"], "name": "  Borin  "})
    assert response.status_code == 200
    assert response.get_json()["Character updated"]["name"] == "Borin"


@pytest.mark.parametrize("name", ["", "   ", "x" * 26, 5])
def test_rename_rejects_invalid_names(client, make_user, make_character, name):
    _, headers = make_user()
    character = make_character(headers)
    response = client.put("/api/character", headers=headers, json={"id": character["id"], "name": name})
    assert response.status_code == 400


def test_saving_throw_proficiency(client, make_user, make_character):
    _, headers = make_user()
    stat = make_character(headers)["stats"][0]
    response = client.put("/api/stat", headers=headers, json={"id": stat["id"], "proficient": True})
    assert response.status_code == 200
    assert response.get_json()["Stat Changed"] == {**stat, "proficient": True}


def test_stat_update_needs_value_or_proficient(client, make_user, make_character):
    _, headers = make_user()
    stat = make_character(headers)["stats"][0]
    assert client.put("/api/stat", headers=headers, json={"id": stat["id"]}).status_code == 400
    assert client.put("/api/stat", headers=headers, json={"id": stat["id"], "proficient": "yes"}).status_code == 400


def _skill(client, headers, **body):
    return client.put("/api/skill", headers=headers, json=body)


def test_skill_proficiency_and_expertise(client, make_user, make_character):
    _, headers = make_user()
    skill_id = make_character(headers)["skills"][0]["id"]

    data = _skill(client, headers, id=skill_id, proficient=True).get_json()["Skill Changed"]
    assert (data["proficient"], data["expert"]) == (True, False)

    data = _skill(client, headers, id=skill_id, expert=True).get_json()["Skill Changed"]
    assert (data["proficient"], data["expert"]) == (True, True)

    # Removing proficiency also removes expertise
    data = _skill(client, headers, id=skill_id, proficient=False).get_json()["Skill Changed"]
    assert (data["proficient"], data["expert"]) == (False, False)


def test_expertise_implies_proficiency(client, make_user, make_character):
    _, headers = make_user()
    skill_id = make_character(headers)["skills"][0]["id"]
    data = _skill(client, headers, id=skill_id, expert=True).get_json()["Skill Changed"]
    assert (data["proficient"], data["expert"]) == (True, True)


def test_skill_validation(client, make_user, make_character):
    _, headers = make_user()
    skill_id = make_character(headers)["skills"][0]["id"]
    assert _skill(client, headers, id=skill_id).status_code == 400
    assert _skill(client, headers, id=skill_id, proficient=1).status_code == 400
    assert _skill(client, headers, id=999999, proficient=True).status_code == 404


def test_skill_requires_login_and_ownership(client, make_user, make_character):
    _, alice = make_user("alice@test.com")
    _, bob = make_user("bob@test.com")
    skill_id = make_character(alice)["skills"][0]["id"]
    assert client.put("/api/skill", json={"id": skill_id, "proficient": True}).status_code == 401
    assert _skill(client, bob, id=skill_id, proficient=True).status_code == 404
    stat_id = make_character(alice)["stats"][0]["id"]
    assert client.put("/api/stat", headers=bob, json={"id": stat_id, "proficient": True}).status_code == 404


def test_lists_keep_a_stable_order_after_updates(client, make_user, make_character):
    # PostgreSQL returns updated rows last unless the query orders them
    _, headers = make_user()
    character = make_character(headers)
    client.put("/api/skill", headers=headers, json={"id": character["skills"][0]["id"], "proficient": True})
    client.put("/api/stat", headers=headers, json={"id": character["stats"][0]["id"], "value": 15})
    for name in ["Potion", "Arrows"]:
        client.post("/api/consumable", headers=headers, json={"character_id": character["id"], "name": name})
    first = client.get("/api/characters", headers=headers).get_json()["characters"][0]
    client.put("/api/consumable", headers=headers, json={"id": first["consumables"][0]["id"], "amount": 3})

    reloaded = client.get(f"/api/character/{character['id']}", headers=headers).get_json()["character"]
    for field in ["skills", "stats", "consumables"]:
        ids = [item["id"] for item in reloaded[field]]
        assert ids == sorted(ids), field


def test_new_character_starts_with_level_1_proficiency(client, make_user, make_character):
    _, headers = make_user()
    character = make_character(headers)
    assert (character["level"], character["proficiency"]) == (1, 2)
