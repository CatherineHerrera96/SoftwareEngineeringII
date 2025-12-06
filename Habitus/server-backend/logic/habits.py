from sqlalchemy.orm import Session
from models import Habit, UserHabit
from typing import List, Optional
from pydantic import BaseModel
from fastapi import HTTPException

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    frequency: str = "daily"

def get_system_habits(db: Session) -> List[Habit]:
    return db.query(Habit).filter(Habit.is_custom == False).all()

def get_user_custom_habits(db: Session, user_id: int) -> List[Habit]:
    return db.query(Habit).filter(Habit.user_id == user_id, Habit.is_custom == True).all()

def create_custom_habit(db: Session, habit: HabitCreate, user_id: int) -> Habit:
    db_habit = Habit(
        name=habit.name,
        description=habit.description,
        category=habit.category,
        frequency=habit.frequency,
        is_custom=True,
        user_id=user_id
    )
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

def update_custom_habit(db: Session, habit_id: int, habit_data: HabitCreate, user_id: int) -> Habit:
    db_habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Security check
    if not db_habit.is_custom or db_habit.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this habit")
    
    db_habit.name = habit_data.name
    db_habit.description = habit_data.description
    db_habit.category = habit_data.category
    # Frequency is usually fixed but can update if needed
    
    db.commit()
    db.refresh(db_habit)
    return db_habit

def delete_custom_habit(db: Session, habit_id: int, user_id: int):
    db_habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    # Security check
    if not db_habit.is_custom or db_habit.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this habit")
    
    # Cascade delete? Usually handled by DB, but safe to delete explicit refs if needed
    # For now, just delete the habit. SQLAlchemy cascade should handle user_habits associations if model is configured,
    # otherwise we might get ConstraintViolation.
    # Ideally: db.query(UserHabit).filter(UserHabit.habit_id == habit_id).delete()
    
    # We should delete related user_habits to be clean or rely on ON DELETE CASCADE
    db.query(UserHabit).filter(UserHabit.habit_id == habit_id).delete()
    
    db.delete(db_habit)
    db.commit()
    return {"message": "Habit deleted"}

def get_user_tracked_habits(db: Session, user_id: int):
    return db.query(UserHabit).filter(UserHabit.user_id == user_id, UserHabit.is_active == True).all()

def track_habit(db: Session, user_id: int, habit_id: int) -> UserHabit:
    # Check if already tracked
    existing = db.query(UserHabit).filter(UserHabit.user_id == user_id, UserHabit.habit_id == habit_id).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing
    
    new_user_habit = UserHabit(user_id=user_id, habit_id=habit_id)
    db.add(new_user_habit)
    db.commit()
    db.refresh(new_user_habit)
    return new_user_habit
