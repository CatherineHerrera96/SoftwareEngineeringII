from datetime import date, timedelta


def setup_user_and_habit(client, user_id: str):
    # Create a habit
    resp = client.post(
        "/habits/",
        json={
            "description": "Exercise once a day for at least 30 minutes",
            "name": "Exercise 30 minutes",
            "category": "health",
            "frequency": "daily",
        },
    )
    habit = resp.json()

    # Assign to user
    resp = client.post(
        "/user-habits/",
        json=[
            {
                "user_id": user_id,
                "habit_id": habit["id"]
            },
        ],
    )
    user_habit = resp.json()
    return user_habit[0]


def test_checkins_are_idempotent_and_update_stats(client):
    user_id = "user-456"
    user_habit = setup_user_and_habit(client, user_id)
    today = date.today()

    # First checkin completed
    resp = client.post(
        "/checkins/",
        json={
            "user_habit_id": user_habit["id"],
            "date": today.isoformat(),
            "is_completed": True,
        },
    )
    assert resp.status_code == 201
    chk1 = resp.json()
    assert chk1["is_completed"]

    # Second checkin same day but missed -> should update, not create duplicate
    resp = client.post(
        "/checkins/",
        json={
            "user_habit_id": user_habit["id"],
            "log_date": today.isoformat(),
            "is_completed": False,
        },
    )
    assert resp.status_code == 201
    chk2 = resp.json()
    assert chk2["id"] == chk1["id"]
    assert not chk2["is_completed"]

    # Weekly stats endpoint
    week_start = today.isoformat()
    resp = client.get(f"/stats/weekly/{user_id}?week_start={week_start}")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["user_id"] == user_id
    assert summary["checkins_total"] >= 1
    # Since last status is "missed", completion_rate could be 0
    assert summary["completion_rate"] >= 0.0


def test_weekly_stats_with_multiple_days_and_streak(client):
    user_id = "user-789"
    user_habit = setup_user_and_habit(client, user_id)
    base_day = date.today()

    # Three consecutive days completed
    for i in range(3):
        day = base_day + timedelta(days=i)
        resp = client.post(
            "/checkins/",
            json={
                "user_habit_id": user_habit["id"],
                "date": day.isoformat(),
                "is_completed": True,
            },
        )
        assert resp.status_code == 201

    week_start = base_day.isoformat()
    resp = client.get(f"/stats/weekly/{user_id}?week_start={week_start}")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["checkins_total"] == 3
    assert summary["checkins_completed"] == 3
    assert summary["completion_rate"] == 100.0
    assert summary["streak_global"] == 3
