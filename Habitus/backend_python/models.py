import uuid
from datetime import date
from sqlalchemy import (
    Column,
    String,
    Date,
    Boolean,
    Numeric,
    Integer,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .db import Base


def uuid_str() -> str:
    return str(uuid.uuid4())


class Habit(Base):
    __tablename__ = "habits"

    id = Column(String, primary_key=True, default=uuid_str)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)           # wellness | health | academic | work
    default_frequency = Column(String, nullable=False)  # daily | weekly

    user_habits = relationship("UserHabit", back_populates="habit")


class UserHabit(Base):
    __tablename__ = "user_habits"
    __table_args__ = (
        UniqueConstraint("user_id", "habit_id", name="uq_user_habit"),
    )

    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, nullable=False)   # from Java auth (e.g., JWT subject)
    habit_id = Column(String, ForeignKey("habits.id"), nullable=False)
    frequency = Column(String, nullable=False, default="daily")
    is_active = Column(Boolean, nullable=False, default=True)

    habit = relationship("Habit", back_populates="user_habits")
    checkins = relationship("Checkin", back_populates="user_habit")


class Checkin(Base):
    __tablename__ = "checkins"
    __table_args__ = (
        UniqueConstraint("user_habit_id", "date", name="uq_checkin_day"),
    )

    id = Column(String, primary_key=True, default=uuid_str)
    user_habit_id = Column(String, ForeignKey("user_habits.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    status = Column(String, nullable=False)  # "completed" | "missed"

    user_habit = relationship("UserHabit", back_populates="checkins")


class StatsWeekly(Base):
    __tablename__ = "stats_weekly"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_user_week"),
    )

    id = Column(String, primary_key=True, default=uuid_str)
    user_id = Column(String, nullable=False)
    week_start = Column(Date, nullable=False)
    completion_rate = Column(Numeric(5, 2), nullable=False)  # 0–100
    streak_global = Column(Integer, nullable=False, default=0)
