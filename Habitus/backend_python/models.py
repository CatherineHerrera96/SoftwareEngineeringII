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

class Habit(Base):
    __tablename__ = "habits"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String, nullable=False)
    category    = Column(String)                        # wellness | health | academic | work
    frequency   = Column(String, nullable=False)        # daily | weekly
    description = Column(String)

    user_habits = relationship("UserHabit", back_populates="habits")


class UserHabit(Base):
    __tablename__ = "user_habits"
    __table_args__ = (
        UniqueConstraint("user_id", "habit_id", name="uq_user_habit"),
    )

    id          = Column(Integer, primary_key=True, autoincrement=True)
    user_id     = Column(Integer, nullable=False)   # from Java auth (e.g., JWT subject)
    habit_id    = Column(Integer, ForeignKey("habits.id"), nullable=False)
    is_active   = Column(Boolean, nullable=False, default=True)

    habits = relationship("Habit", back_populates="user_habits")
    checkins = relationship("Checkin", back_populates="user_habits")
    usr_achievements = relationship("UserAchievement", back_populates="user_habits")


class Checkin(Base):
    __tablename__ = "habit_tracker"
    __table_args__ = (
        UniqueConstraint("user_habit_id", "log_date", name="uq_checkin_day"),
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_habit_id   = Column(Integer, ForeignKey("user_habits.id"), nullable=False)
    log_date        = Column(Date, nullable=False, default=date.today)
    is_completed    = Column(Boolean, nullable=False)

    user_habits = relationship("UserHabit", back_populates="checkins")


class Achievement(Base):
    __tablename__ = "achievements"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    name            = Column(String, nullable=False)
    description     = Column(String)
    condition_type  = Column(String, nullable=False)
    threshold       = Column(Integer, nullable=False)
    
    usr_achievements = relationship("UserAchievement", back_populates="achievements")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_week"),
    )
    
    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(Integer, ForeignKey("user_habits.id"), nullable=False)
    achievement_id  = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    awarded_at      = Column(Date, nullable= False, default=date.today())
    
    user_habits = relationship("UserHabit", back_populates="usr_achievements")
    achievements = relationship("Achievement", back_populates="usr_achievements")