from datetime import date as DateType
from pydantic import BaseModel, Field, ConfigDict  # 👈 añadimos ConfigDict


# ----- Habit -----
class HabitBase(BaseModel):
    code: str
    name: str
    category: str
    default_frequency: str


class HabitCreate(HabitBase):
    pass


class HabitRead(HabitBase):
    id: str

    # Pydantic v2: usar model_config en vez de class Config
    model_config = ConfigDict(from_attributes=True)


# ----- UserHabit -----
class UserHabitCreate(BaseModel):
    user_id: str
    habit_id: str
    frequency: str = "daily"


class UserHabitRead(BaseModel):
    id: str
    user_id: str
    habit_id: str
    frequency: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ----- Checkin -----
class CheckinCreate(BaseModel):
    user_habit_id: str
    # Usamos DateType (alias) para evitar choque nombre campo/tipo
    date: DateType = Field(default_factory=DateType.today)
    status: str  # "completed" | "missed"


class CheckinRead(BaseModel):
    id: str
    user_habit_id: str
    date: DateType
    status: str

    model_config = ConfigDict(from_attributes=True)


# ----- StatsWeekly & summary -----
class StatsWeeklyRead(BaseModel):
    id: str
    user_id: str
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
