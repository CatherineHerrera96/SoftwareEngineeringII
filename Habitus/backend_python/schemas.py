from datetime import date as DateType
from pydantic import BaseModel, Field, ConfigDict  # 👈 añadimos ConfigDict


# ----- Habit -----
class HabitBase(BaseModel):
    name: str
    category: str
    description: str
    frequency: str


class HabitCreate(HabitBase):
    pass


class HabitRead(HabitBase):
    id: int

    # Pydantic v2: usar model_config en vez de class Config
    model_config = ConfigDict(from_attributes=True)


# ----- UserHabit -----
class UserHabitCreate(BaseModel):
    user_id: int
    habit_id: int
    is_active: bool


class UserHabitRead(BaseModel):
    id: int
    user_id: int
    habit_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class UserActiveHabitRead(BaseModel):
    id: int
    user_id: int
    habit_id: int
    name: str
    is_completed: bool
    
    model_config = ConfigDict(from_attributes=True)

# ----- Checkin -----
class CheckinCreate(BaseModel):
    user_habit_id: int
    # Usamos DateType (alias) para evitar choque nombre campo/tipo
    date: DateType = Field(default_factory=DateType.today)
    is_completed: bool


class CheckinRead(BaseModel):
    id: int
    user_habit_id: int
    date: DateType
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
    user_id: int
    week_start: DateType
    completion_rate: float
    streak_global: int
    checkins_total: int
    checkins_completed: int


class AchievementRead(BaseModel):
    id: int
    title: str
    description: str