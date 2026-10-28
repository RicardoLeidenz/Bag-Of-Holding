import pytest

# Every data endpoint, called without a token, must answer 401
PROTECTED = [
    ("get", "/api/me", None),
    ("get", "/api/characters", None),
    ("get", "/api/character/1", None),
    ("post", "/api/character", {"name": "x", "race": "x", "characterClass": "x", "subClass": "x"}),
    ("put", "/api/character", {"id": 1, "hp": 1}),
    ("delete", "/api/character", {"id": 1}),
    ("put", "/api/stat", {"id": 1, "value": 10}),
    ("post", "/api/consumable", {"character_id": 1, "name": "x"}),
    ("put", "/api/consumable", {"id": 1, "amount": 1}),
    ("delete", "/api/consumable", {"id": 1}),
]


@pytest.mark.parametrize("method,url,body", PROTECTED)
def test_requires_token(client, method, url, body):
    response = getattr(client, method)(url, json=body)
    assert response.status_code == 401


def test_character_list_only_shows_own(client, make_user, make_character):
    _, alice = make_user("alice@test.com")
    _, bob = make_user("bob@test.com")
    make_character(alice, "Aria")
    make_character(bob, "Borin")

    names = [c["name"] for c in client.get("/api/characters", headers=alice).get_json()["characters"]]
    assert names == ["Aria"]


def test_created_character_belongs_to_token_user_not_body(client, make_user):
    alice_id, alice = make_user("alice@test.com")
    bob_id, _ = make_user("bob@test.com")
    response = client.post("/api/character", headers=alice, json={
        "user_id": bob_id, "name": "Aria", "race": "Elf", "characterClass": "Wizard", "subClass": "Evocation"
    })
    assert response.get_json()["character"]["user_id"] == alice_id


def test_get_own_character(client, make_user, make_character):
    _, alice = make_user()
    character = make_character(alice)
    response = client.get(f"/api/character/{character['id']}", headers=alice)
    assert response.status_code == 200
    assert response.get_json()["character"]["name"] == "Aria"


def test_cannot_touch_other_users_character(client, make_user, make_character):
    _, alice = make_user("alice@test.com")
    _, bob = make_user("bob@test.com")
    character = make_character(alice)
    char_id = character["id"]
    stat_id = character["stats"][0]["id"]

    assert client.get(f"/api/character/{char_id}", headers=bob).status_code == 404
    assert client.put("/api/character", headers=bob, json={"id": char_id, "hp": 1}).status_code == 404
    assert client.delete("/api/character", headers=bob, json={"id": char_id}).status_code == 404
    assert client.put("/api/stat", headers=bob, json={"id": stat_id, "value": 18}).status_code == 404
    assert client.post("/api/consumable", headers=bob,
                       json={"character_id": char_id, "name": "Potion"}).status_code == 404

    # Alice's data is unchanged
    alice_view = client.get(f"/api/character/{char_id}", headers=alice).get_json()["character"]
    assert alice_view["hp"] == 0
    assert alice_view["stats"][0]["value"] == 10
    assert alice_view["consumables"] == []


def test_cannot_touch_other_users_consumable(client, make_user, make_character):
    _, alice = make_user("alice@test.com")
    _, bob = make_user("bob@test.com")
    character = make_character(alice)
    consumable = client.post("/api/consumable", headers=alice,
                             json={"character_id": character["id"], "name": "Potion"}).get_json()["Consumable Created"]

    assert client.put("/api/consumable", headers=bob, json={"id": consumable["id"], "amount": 5}).status_code == 404
    assert client.delete("/api/consumable", headers=bob, json={"id": consumable["id"]}).status_code == 404


def test_owner_can_update_and_delete(client, make_user, make_character):
    _, alice = make_user()
    character = make_character(alice)

    response = client.put("/api/character", headers=alice, json={"id": character["id"], "hp": 12})
    assert response.get_json()["Character updated"]["hp"] == 12

    stat_id = character["stats"][0]["id"]
    assert client.put("/api/stat", headers=alice, json={"id": stat_id, "value": 15}).status_code == 200

    assert client.delete("/api/character", headers=alice, json={"id": character["id"]}).status_code == 200
    assert client.get(f"/api/character/{character['id']}", headers=alice).status_code == 404
