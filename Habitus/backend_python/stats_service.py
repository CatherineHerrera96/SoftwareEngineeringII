from datetime import date, timedelta
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import Checkin, UserHabit
from .schemas import WeeklySummary


def get_week_bounds(week_start: date) -> Tuple[date, date]:
    """
    Returns the [week_start, week_end) 7-day interval.
    For now we assume week_start already comes normalized (e.g., Monday).
    """
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def compute_weekly_stats(db: Session, user_id: str, week_start: date) -> WeeklySummary:
    start, end = get_week_bounds(week_start)

    # All checkins for this user in the week
    q = (
        db.query(Checkin)
        .join(UserHabit)
        .filter(
            UserHabit.user_id == user_id,
            Checkin.log_date >= start,
            Checkin.log_date < end,
        )
    )
    checkins = q.all()
    total = len(checkins)
    completed = sum(1 for checkin in checkins if checkin.is_completed)

    completion_rate = 0.0
    if total > 0:
        completion_rate = round((completed / total) * 100.0, 2)

    # Simple global streak: consecutive days with at least one completed checkin,
    # counting backwards from the last checkin date.
    streak = 0
    if completed > 0:
        days_map = {}
        for c in checkins:
            if c.is_completed:
                days_map[c.log_date] = True

        if days_map:
            current_day = max(days_map.keys())
            while days_map.get(current_day, False):
                streak += 1
                current_day = current_day - timedelta(days=1)


    return WeeklySummary(
        user_id=user_id,
        week_start=start,
        completion_rate=completion_rate,
        streak_global=streak,
        checkins_total=total,
        checkins_completed= completed,
    )
