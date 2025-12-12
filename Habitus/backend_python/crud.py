from datetime import date, timedelta
from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from . import models, schemas
from .stats_service import compute_weekly_stats, get_week_bounds


# ----- User -----
def get_user_by_email(db: Session, email: str) -> models.User:
    return db.query(models.User).filter(models.User.email == email).first()


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
    # Check if already exists (even if inactive)
    existing = db.query(models.UserHabit).filter(
        models.UserHabit.user_id == user_habit_in.user_id,
        models.UserHabit.habit_id == user_habit_in.habit_id
    ).first()

    if existing:
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    user_habit = models.UserHabit(
        user_id=user_habit_in.user_id,
        habit_id=user_habit_in.habit_id,
        is_active=True,
    )
    db.add(user_habit)
    db.commit()
    db.refresh(user_habit)
    return user_habit


def list_user_habits(db: Session, user_id: int) -> List[tuple[models.UserHabit, bool]]:
    # 1. Get user habits
    user_habits = (
        db.query(models.UserHabit)
        .join(models.Habit)
        .filter(
            models.UserHabit.user_id == user_id,
            models.UserHabit.is_active == True
        )
        .all()
    )
    
    # 2. Get relevant completed checkins for today/this week
    today = date.today()
    week_start = today - timedelta(days=7)
    
    checkins = (
        db.query(models.Checkin)
        .join(models.UserHabit)
        .join(models.Habit)
        .filter(
            models.UserHabit.user_id == user_id,
            models.Checkin.is_completed == True,
            or_(
                and_(models.Habit.frequency == 'daily', models.Checkin.log_date == today),
                and_(models.Habit.frequency == 'weekly', models.Checkin.log_date >= week_start)
            )
        )
        .all()
    )
    
    completed_map = {c.user_habit_id: True for c in checkins}
    
    return [
        (uh, completed_map.get(uh.id, False))
        for uh in user_habits
    ]


# ----- Checkin + Stats -----
def create_or_update_checkin(
    db: Session,
    user_habit_id: int,
    date_: date,
    is_completed: bool,
) -> models.Checkin:
    """
    Creates a new checkin or updates the existing one for (user_habit_id, date_).
    This enforces idempotent daily logging, as required in the specs.
    """
    checkin = models.Checkin(
        user_habit_id=user_habit_id,
        log_date=date_,
        is_completed=is_completed,
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
                models.Checkin.log_date == date_,
            )
            .one()
        )
        existing.is_completed = is_completed
        db.commit()
        db.refresh(existing)
        checkin = existing
    else:
        db.refresh(checkin)

    # Recompute stats for that user/week (SQLAlchemy 2.x style)
    user_habit = db.get(models.UserHabit, user_habit_id)
    week_start, _ = get_week_bounds(date_)
    compute_weekly_stats(db, user_habit.user_id, week_start)
    return checkin


def list_checkins_for_user_week(
    db: Session,
    user_id: int,
    week_start: date,
):
    start, end = get_week_bounds(week_start)
    return (
        db.query(models.Checkin)
        .join(models.UserHabit)
        .filter(
            models.UserHabit.user_id == user_id,
            models.Checkin.log_date >= start,
            models.Checkin.log_date < end,
        )
        .all()
    )

def list_achievements(db: Session):
    return db.query(models.Achievement).all()

def list_user_achievements(
    db: Session,
    user_id: int
):
    return (
        db.query(models.Achievement)
        .join(models.UserAchievement)
        .filter(
            models.UserAchievement.user_id == user_id
        )
    ).all()