from datetime import date, datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Boolean,
    Numeric,
    Integer,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True) # Added for stats logic

    usr_achievements = relationship("UserAchievement", back_populates="user")


class Habit(Base):
    __tablename__ = "habits"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for system habits
    name        = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category    = Column(String, nullable=False)        # wellness | health | academic | work
    frequency   = Column(String, nullable=False)        # daily | weekly
    is_custom   = Column(Boolean, default=False)
    season_id   = Column(String, nullable=True)         # NEW: 'christmas', 'halloween', etc. NULL = permanent

    user_habits = relationship("UserHabit", back_populates="habits")


class UserHabit(Base):
    __tablename__ = "user_habits"
    __table_args__ = (
        UniqueConstraint("user_id", "habit_id", name="uq_user_habit"),
    )

    id              = Column(Integer, primary_key=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    habit_id        = Column(Integer, ForeignKey("habits.id"), nullable=False)
    is_active       = Column(Boolean, nullable=False, default=True)
    current_streak  = Column(Integer, default=0)
    longest_streak  = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    last_completed_at = Column(DateTime(timezone=True), nullable=True)
    next_available_checkin_at = Column(DateTime(timezone=True), nullable=True)
    activated_at    = Column(Date, default=date.today)

    habits = relationship("Habit", back_populates="user_habits")
    checkins = relationship("Checkin", back_populates="user_habits")


class Checkin(Base):
    __tablename__ = "habit_tracker"
    __table_args__ = (
        UniqueConstraint("user_habit_id", "log_date", name="uq_checkin_day"),
    )

    id              = Column(Integer, primary_key=True)
    user_habit_id   = Column(Integer, ForeignKey("user_habits.id"), nullable=False)
    log_date        = Column(Date, nullable=False, default=date.today)
    is_completed    = Column(Boolean, nullable=False)

    user_habits = relationship("UserHabit", back_populates="checkins")


class Achievement(Base):
    __tablename__ = "achievements"

    id              = Column(Integer, primary_key=True)
    code            = Column(String, unique=True, nullable=False)  # e.g., "STREAK_3"
    name            = Column(String, nullable=False)
    description     = Column(String)
    # category column removed as it does not exist in DB
    tier            = Column(String, nullable=True) # bronze | silver | gold
    icon_emoji      = Column(String, nullable=True) 
    threshold_type  = Column(String, nullable=False)  # "per_habit_streak" or "total_completions"
    threshold_value = Column(Integer, nullable=False)
    is_active       = Column(Boolean, default=True)
    
    usr_achievements = relationship("UserAchievement", back_populates="achievements")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", "habit_id", name="uq_user_achievement_habit"),
    )
    
    id              = Column(Integer, primary_key=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id  = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    habit_id        = Column(Integer, ForeignKey("habits.id"), nullable=True)  # For per-habit achievements
    awarded_at      = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="usr_achievements")
    achievements = relationship("Achievement", back_populates="usr_achievements")