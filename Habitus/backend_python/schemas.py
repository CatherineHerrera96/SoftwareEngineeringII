from datetime import date as DateType, datetime
from pydantic import BaseModel, Field, ConfigDict


# ----- User -----
class UserBase(BaseModel):
    email: str

class UserRead(UserBase):
    id: int
    name: str | None = None
    avatar_url: str | None = None
    timezone: str | None = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    timezone: str | None = None


# ----- Habit -----
class HabitBase(BaseModel):
    name: str
    category: str
    frequency: str
    description: str | None = None
    is_custom: bool = False
    season_id: str | None = None  # NEW: seasonal affinity


class HabitCreate(HabitBase):
    pass


class HabitRead(HabitBase):
    id: int
    user_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class HabitUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    frequency: str | None = None
    description: str | None = None


# ----- UserHabit -----
class UserHabitCreate(BaseModel):
    user_id: int
    habit_id: int


class UserHabitRead(BaseModel):
    id: int
    user_id: int
    habit_id: int
    habit_name: str | None = None
    habit_category: str | None = None
    season_id: str | None = None
    is_active: bool
    current_streak: int = 0
    longest_streak: int = 0
    total_completions: int = 0
    next_available_checkin_at: datetime | None = None
    window_end_at: datetime | None = None
    last_completed_at: datetime | None = None
    is_completed: bool = False
    
    # New fields for broken streak visual feedback
    streak_broken: bool = False
    previous_streak: int | None = None

    model_config = ConfigDict(from_attributes=True)


# ----- Checkin -----
class CheckinCreate(BaseModel):
    user_habit_id: int
    date: DateType = Field(default_factory=DateType.today)
    is_completed: bool


class CheckinRead(BaseModel):
    id: int
    user_habit_id: int
    log_date: DateType
    is_completed: bool

    model_config = ConfigDict(from_attributes=True)


# ----- StatsWeekly & summary -----
class StatsWeeklyRead(BaseModel):
    id: int
    user_id: int
    week_start: DateType
    completion_rate: float
    streak_global: int

    model_config = ConfigDict(from_attributes=True)


class WeeklySummary(BaseModel):
    user_id: str
    week_start: DateType
    completion_rate: float
    streak_global: int
    checkins_total: int
    checkins_completed: int


class AchievementRead(BaseModel):
    id: int
    code: str
    name: str 
    description: str | None = None
    category: str | None = None
    tier: str | None = None
    icon_emoji: str | None = None
    unlocked_at: datetime | None = None
    habit_id: int | None = None
    habit_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

class AchievementLockedRead(BaseModel):
    id: int
    code: str
    name: str
    description: str | None = None
    category: str | None = None
    tier: str | None = None
    icon_emoji: str | None = None
    threshold_type: str
    threshold_value: int
    progress: dict | None = None

    model_config = ConfigDict(from_attributes=True)

class AchievementStats(BaseModel):
    weekly_completion_rate: int
    total_streak_days: int
    trend: list[dict] | None = None

class AchievementsResponse(BaseModel):
    stats: AchievementStats
    unlocked: list[AchievementRead]
    locked: list[AchievementLockedRead]