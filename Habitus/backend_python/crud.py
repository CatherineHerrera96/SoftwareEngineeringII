from datetime import date, timedelta
from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case

from . import models, schemas
from .stats_service import compute_weekly_stats, get_week_bounds


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
    #find row with data if it exists
    user_habit = db.query(models.UserHabit).filter(
        models.UserHabit.user_id  == user_habit_in.user_id,
        models.UserHabit.habit_id == user_habit_in.habit_id
    ).first()
    
    #if it doesn't exist 
    if user_habit is None:
        user_habit = models.UserHabit(
            user_id   = user_habit_in.user_id,
            habit_id  = user_habit_in.habit_id,
            is_active = user_habit_in.is_active,
        )
        db.add(user_habit)
    else:
        user_habit.is_active = user_habit_in.is_active
    db.commit()
    db.refresh(user_habit)
    return user_habit


def list_user_habits(db: Session, user_id: str) -> List[tuple[models.UserHabit, bool]]:
    return (
        db.query(models.UserHabit)
        .filter(models.UserHabit.user_id == user_id)   
    ).all()

def list_active_user_habits(db: Session, user_id: str) -> List[tuple[models.UserHabit, bool]]:
    latest_checkin = (
        db.query(
            models.Checkin.user_habit_id,
            func.max(case(
                (or_(
                    models.Checkin.log_date >= date.today(),
                    and_(
                        models.Habit.frequency == "weekly",
                        models.Checkin.log_date >= date.today() - timedelta(days=7))
                ), models.Checkin.log_date),
                else_= None
            )).label("latest_date"))
        .join(models.UserHabit)
        .join(models.Habit)
        .filter(
            models.UserHabit.is_active
        )
        .group_by(models.Checkin.user_habit_id)
    ).subquery()
    
    is_completed_q = (
        db.query(models.Checkin.is_completed)
        .filter(
            models.Checkin.user_habit_id == latest_checkin.c.user_habit_id,
            models.Checkin.log_date == latest_checkin.c.latest_date
        )
    ).scalar_subquery()
    
    
    query = (
        db.query(
            models.UserHabit,
            models.Habit.name,
            case(
                (latest_checkin.c.latest_date.is_(None), False),
                else_= is_completed_q
            ).label("is_completed")
        )
        .join(models.Habit)
        .outerjoin(latest_checkin, models.UserHabit.id == latest_checkin.c.user_habit_id)
        .filter(models.UserHabit.user_id == user_id)   
    )
    
    return query.all()


# ----- Checkin + Stats -----
def create_or_update_checkin(
    db: Session,
    user_habit_id: str,
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
    # user_habit = db.get(models.UserHabit, user_habit_id)
    # week_start, _ = get_week_bounds(date_)
    # compute_weekly_stats(db, user_habit.user_id, week_start)
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
            models.Checkin.log_date >= start,
            models.Checkin.log_date < end,
        )
        .all()
    )

def list_achievements(db: Session):
    return db.query(models.Achievement).all()

def list_user_achievements(
    db: Session,
    user_id: str
):
    return (
        db.query(models.Achievement)
        .join(models.UserAchievement)
        .filter(
            models.UserAchievement.user_id == user_id
        )
    ).all()