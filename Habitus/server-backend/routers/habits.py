from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from auth import get_current_user
from models import User, Habit
from logic import habits as habit_logic
from pydantic import BaseModel

router = APIRouter()

class HabitRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    category: str
    frequency: str
    is_custom: bool
    user_id: int | None = None

    class Config:
        orm_mode = True

class HabitCreate(BaseModel):
    name: str
    description: str | None = None
    category: str
    frequency: str = "daily"

@router.get("/", response_model=List[HabitRead])
def get_habits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    system_habits = habit_logic.get_system_habits(db)
    custom_habits = habit_logic.get_user_custom_habits(db, current_user.id)
    return system_habits + custom_habits

@router.post("/", response_model=HabitRead)
def create_habit(habit: HabitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return habit_logic.create_custom_habit(db, habit, current_user.id)

@router.put("/{habit_id}", response_model=HabitRead)
def update_habit(habit_id: int, habit: HabitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return habit_logic.update_custom_habit(db, habit_id, habit, current_user.id)

@router.delete("/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return habit_logic.delete_custom_habit(db, habit_id, current_user.id)
