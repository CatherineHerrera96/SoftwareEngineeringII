def test_create_and_list_habits(client):
    payload = {
        "description": "Drink every day some water",
        "name": "Drink water",
        "category": "health",
        "frequency": "daily",
    }
    resp = client.post("/api/habits/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["description"] == payload["description"]

    resp = client.get("/api/habits/")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["name"] == "Drink water"


def test_assign_user_habit_and_list(client):
    # First create a habit
    payload = {
        "description": "Study once a day for one hour at least",
        "name": "Study 60 minutes",
        "category": "academic",
        "frequency": "daily",
    }
    resp = client.post("/api/habits/", json=payload)
    habit = resp.json()

    # Assign habit to current user (auth overridden)
    resp = client.post(
        "/api/user-habits/",
        json={"habit_ids": [str(habit["id"])]},
    )
    assert resp.status_code == 201
    user_habit = resp.json()[0]
    # user_id is implicit via auth override; just validate habit linkage
    assert user_habit["habit_id"] == habit["id"]

    # List user habits
    resp = client.get("/api/user-habits/")
    assert resp.status_code == 200
    lst = resp.json()
    assert any(item["habit_id"] == habit["id"] for item in lst)

def test_habit_activation_toggle(client):
    """Código 6.x: Test de activación de hábito."""
    resp = client.post(
        "/api/habits/",
        json={
            "description": "Meditate",
            "name": "Meditate",
            "category": "health",
            "frequency": "daily",
        },
    )
    habit = resp.json()

    resp = client.post("/api/user-habits/", json={"habit_ids": [str(habit["id"]) ]})
    assert resp.status_code == 201
    uh = resp.json()[0]
    assert uh["is_active"] is True

    resp = client.delete(f"/api/user-habits/{uh['id']}")
    assert resp.status_code in (200, 204)

    resp = client.get("/api/user-habits/")
    assert resp.status_code == 200
    lst = resp.json()
    found = next((x for x in lst if x["id"] == uh["id"]), None)
    assert found is None or found["is_active"] is False
