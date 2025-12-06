from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String)
    avatar_url = Column(String)
    timezone = Column(String, default="UTC")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    habits = relationship("Habit", back_populates="user")
    user_habits = relationship("UserHabit", back_populates="user")
    user_achievements = relationship("UserAchievement", back_populates="user")

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for system habits
    name = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(Text)
    frequency = Column(String, default="daily") # Keeping for compatibility
    is_custom = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="habits")
    user_habits = relationship("UserHabit", back_populates="habit")

class UserHabit(Base):
    __tablename__ = "user_habits"
    __table_args__ = (UniqueConstraint("user_id", "habit_id", name="uq_user_habit"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    activated_at = Column(Date, default=func.current_date())

    user = relationship("User", back_populates="user_habits")
    habit = relationship("Habit", back_populates="user_habits")
    # checkins = relationship("DailyCheckin", back_populates="user_habit")
    # Since we removed user_habit from DailyCheckin, we should remove this or make it viewonly with primaryjoin
    # For now, let's just comment it out to fix the error.


class DailyCheckin(Base):
    __tablename__ = "daily_checkins"
    __table_args__ = (UniqueConstraint("user_id", "habit_id", "date", name="uq_daily_checkin"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    date = Column(Date, nullable=False)
    completed = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # We can link back to UserHabit if needed, but the direct link is via user_id/habit_id
    # For convenience, let's assume we might join via user_habit_id if we had it, but we don't.
    # However, we can add a relationship to UserHabit using a composite foreign key or just manual join.
    # For now, let's keep it simple.
    
    # Actually, let's add a relationship to UserHabit for convenience if SQLAlchemy supports it easily with composite join,
    # or just rely on the fact that we can query it.
    # The original schema had user_habit_id. The new one uses user_id + habit_id.
    # Let's add a property or just leave it.
    
    # user_habit relationship removed to avoid complexity with composite keys


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    condition_type = Column(String) # Keeping for compatibility
    threshold = Column(Integer) # Keeping for compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_achievements = relationship("UserAchievement", back_populates="achievement")

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id = Column(Integer, primary_key=True, index=True) # Added ID for consistency
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="user_achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")
