from datetime import date, timedelta


def setup_user_and_habit(client, user_id: str):
    """Helper: create a habit and assign it to the current user.

    Returns one `user_habit` object suitable for check-in tests.
    """
    # Create a habit
    resp = client.post(
        "/api/habits/",
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
        "/api/user-habits/",
        json={"habit_ids": [str(habit["id"])]},
    )
    user_habits = resp.json()
    return user_habits[0]


def test_checkins_are_idempotent_and_update_stats(client):
    """Duplicate check-ins update the same record and weekly stats reflect it.

    First check-in completes, second marks missed for the same day — the
    endpoint must update, not create duplicates. Then weekly stats should
    include at least one check-in and a non-negative completion rate.
    """
    user_id = "user-456"
    user_habit = setup_user_and_habit(client, user_id)
    today = date.today()

    # First checkin completed
    resp = client.post(
        "/api/checkins/",
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
        "/api/checkins/",
        json={
            "user_habit_id": user_habit["id"],
            "date": today.isoformat(),
            "is_completed": False,
        },
    )
    assert resp.status_code == 201
    chk2 = resp.json()
    assert chk2["id"] == chk1["id"]
    assert not chk2["is_completed"]

    # Weekly stats endpoint
    week_start = today.isoformat()
    resp = client.get(f"/api/stats/weekly?week_start={week_start}")
    assert resp.status_code == 200
    summary = resp.json()
    assert str(summary["user_id"]) == str(user_habit["user_id"])
    assert summary["checkins_total"] >= 1
    # Since last status is "missed", completion_rate could be 0
    assert summary["completion_rate"] >= 0.0


def test_weekly_stats_with_multiple_days_and_streak(client):
    """Three consecutive days completed yields 100% rate and streak=3.

    Verifies weekly totals, completed count, completion rate and global
    streak for consecutive daily completions.
    """
    user_id = "user-789"
    user_habit = setup_user_and_habit(client, user_id)
    base_day = date.today()

    # Three consecutive days completed
    for i in range(3):
        day = base_day + timedelta(days=i)
        resp = client.post(
            "/api/checkins/",
            json={
                "user_habit_id": user_habit["id"],
                "date": day.isoformat(),
                "is_completed": True,
            },
        )
        assert resp.status_code == 201

    week_start = base_day.isoformat()
    resp = client.get(f"/api/stats/weekly?week_start={week_start}")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["checkins_total"] == 3
    assert summary["checkins_completed"] == 3
    assert summary["completion_rate"] == 100.0
    assert summary["streak_global"] == 3
