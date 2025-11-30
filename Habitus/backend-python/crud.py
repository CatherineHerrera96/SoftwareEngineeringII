from datetime import date
from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas
from .stats_service import recompute_weekly_stats, get_week_bounds


# ----- Habit -----
def create_habit(db: Session, habit_in: schemas.HabitCreate) -> models.Habit:
    habit = models.Habit(**habit_in.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def list_habits(db: Session) -> List[models.Habit]:
    return db.query(models.Habit).all()


# ----- UserHabit -----
def assign_habit_to_user(
    db: Session,
    user_habit_in: schemas.UserHabitCreate,
) -> models.UserHabit:
    user_habit = models.UserHabit(
        user_id=user_habit_in.user_id,
        habit_id=user_habit_in.habit_id,
        frequency=user_habit_in.frequency,
        is_active=True,
    )
    db.add(user_habit)
    db.commit()
    db.refresh(user_habit)
    return user_habit


def list_user_habits(db: Session, user_id: str) -> List[models.UserHabit]:
    return (
        db.query(models.UserHabit)
        .filter(models.UserHabit.user_id == user_id)
        .all()
    )


# ----- Checkin + Stats -----
def create_or_update_checkin(
    db: Session,
    user_habit_id: str,
    date_: date,
    status: str,
) -> models.Checkin:
    """
    Creates a new checkin or updates the existing one for (user_habit_id, date_).
    This enforces idempotent daily logging, as required in the specs.
    """
    checkin = models.Checkin(
        user_habit_id=user_habit_id,
        date=date_,
        status=status,
    )
    db.add(checkin)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = (
            db.query(models.Checkin)
            .filter(
                models.Checkin.user_habit_id == user_habit_id,
                models.Checkin.date == date_,
            )
            .one()
        )
        existing.status = status
        db.commit()
        db.refresh(existing)
        checkin = existing
    else:
        db.refresh(checkin)

    # Recompute stats for that user/week (SQLAlchemy 2.x style)
    user_habit = db.get(models.UserHabit, user_habit_id)
    week_start, _ = get_week_bounds(date_)
    recompute_weekly_stats(db, user_habit.user_id, week_start)
    return checkin


def list_checkins_for_user_week(
    db: Session,
    user_id: str,
    week_start: date,
):
    start, end = get_week_bounds(week_start)
    return (
        db.query(models.Checkin)
        .join(models.UserHabit)
        .filter(
            models.UserHabit.user_id == user_id,
            models.Checkin.date >= start,
            models.Checkin.date < end,
        )
        .all()
    )
