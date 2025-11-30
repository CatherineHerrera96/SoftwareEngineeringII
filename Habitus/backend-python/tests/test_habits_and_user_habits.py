def test_create_and_list_habits(client):
    payload = {
        "code": "drink_water",
        "name": "Drink water",
        "category": "health",
        "default_frequency": "daily",
    }
    resp = client.post("/habits/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["code"] == "drink_water"

    resp = client.get("/habits/")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["name"] == "Drink water"


def test_assign_user_habit_and_list(client):
    # First create a habit
    payload = {
        "code": "study_60",
        "name": "Study 60 minutes",
        "category": "academic",
        "default_frequency": "daily",
    }
    resp = client.post("/habits/", json=payload)
    habit = resp.json()

    # Assign habit to user
    user_id = "user-123"
    resp = client.post(
        "/user-habits/",
        json={
            "user_id": user_id,
            "habit_id": habit["id"],
            "frequency": "daily",
        },
    )
    assert resp.status_code == 201
    user_habit = resp.json()
    assert user_habit["user_id"] == user_id
    assert user_habit["habit_id"] == habit["id"]

    # List user habits
    resp = client.get(f"/user-habits/{user_id}")
    assert resp.status_code == 200
    lst = resp.json()
    assert len(lst) == 1
    assert lst[0]["habit_id"] == habit["id"]
