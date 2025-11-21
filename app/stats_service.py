from datetime import date, timedelta
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import Checkin, StatsWeekly, UserHabit


def get_week_bounds(week_start: date) -> Tuple[date, date]:
    """
    Returns the [week_start, week_end) 7-day interval.
    For now we assume week_start already comes normalized (e.g., Monday).
    """
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def recompute_weekly_stats(db: Session, user_id: str, week_start: date) -> StatsWeekly:
    start, end = get_week_bounds(week_start)

    # All checkins for this user in the week
    q = (
        db.query(Checkin)
        .join(UserHabit)
        .filter(
            UserHabit.user_id == user_id,
            Checkin.date >= start,
            Checkin.date < end,
        )
    )
    checkins = q.all()
    total = len(checkins)
    completed = sum(1 for c in checkins if c.status == "completed")

    completion_rate = 0.0
    if total > 0:
        completion_rate = round((completed / total) * 100.0, 2)

    # Simple global streak: consecutive days with at least one completed checkin,
    # counting backwards from the last checkin date.
    streak = 0
    if completed > 0:
        days_map = {}
        for c in checkins:
            if c.status == "completed":
                days_map[c.date] = True

        if days_map:
            current_day = max(days_map.keys())
            while days_map.get(current_day, False):
                streak += 1
                current_day = current_day - timedelta(days=1)

    stats = (
        db.query(StatsWeekly)
        .filter(
            StatsWeekly.user_id == user_id,
            StatsWeekly.week_start == week_start,
        )
        .one_or_none()
    )

    if stats is None:
        stats = StatsWeekly(
            user_id=user_id,
            week_start=week_start,
            completion_rate=completion_rate,
            streak_global=streak,
        )
        db.add(stats)
    else:
        stats.completion_rate = completion_rate
        stats.streak_global = streak

    db.commit()
    db.refresh(stats)
    return stats
