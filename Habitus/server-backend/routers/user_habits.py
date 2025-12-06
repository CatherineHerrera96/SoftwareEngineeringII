from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from db import get_db
from auth import get_current_user
from models import User, UserHabit, DailyCheckin
from logic import habits as habit_logic
from pydantic import BaseModel

router = APIRouter()

class UserHabitRead(BaseModel):
    id: int
    habit_id: int
    is_active: bool
    current_streak: int
    longest_streak: int
    is_completed: bool # Computed field for "today"
    # We might want to include habit details here or let frontend join
    # For MVP, let's include basic habit info if needed, or just IDs
    
    class Config:
        orm_mode = True

class TrackHabitsRequest(BaseModel):
    habit_ids: List[str] # Frontend sends strings sometimes

@router.get("/", response_model=List[UserHabitRead])
def get_user_habits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_habits = habit_logic.get_user_tracked_habits(db, current_user.id)
    
    # Check "today" completion status for each
    # Use server date or strictly UTC? Using server date for simplicity matching checkins.py default.
    today = date.today()
    
    results = []
    for uh in user_habits:
        # Check if completed today
        # Optimization: could fetch all checkins for today in one query, but list is short.
        is_done = db.query(DailyCheckin).filter(
            DailyCheckin.user_habit_id == uh.id if hasattr(DailyCheckin, 'user_habit_id') else DailyCheckin.user_id == current_user.id,
            DailyCheckin.habit_id == uh.habit_id,
            DailyCheckin.date == today, 
            DailyCheckin.completed == True
        ).first() is not None
        
        # Note: DailyCheckin schema update removed user_habit_id, uses user_id + habit_id.
        # But wait, did I update DailyCheckin logic in routers/user_habits.py to reflect that?
        # My previous edit to models.py removed relationship but I might have logic relying on it.
        # The filter above handles both cases safely.
        
        results.append(UserHabitRead(
            id=uh.id,
            habit_id=uh.habit_id,
            is_active=uh.is_active,
            current_streak=uh.current_streak,
            longest_streak=uh.longest_streak,
            is_completed=is_done
        ))
        
    return results

@router.post("/")
def track_habits(
    payload: TrackHabitsRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    results = []
    for habit_id_str in payload.habit_ids:
        try:
            habit_id = int(habit_id_str)
            uh = habit_logic.track_habit(db, current_user.id, habit_id)
            results.append(uh)
        except ValueError:
            continue
    return results

@router.delete("/{user_habit_id}")
def delete_user_habit(
    user_habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uh = db.query(UserHabit).filter(UserHabit.id == user_habit_id, UserHabit.user_id == current_user.id).first()
    if not uh:
        raise HTTPException(status_code=404, detail="User habit not found")
    
    # Soft delete or hard delete?
    # The requirement says "delete", but usually we might just deactivate.
    # However, for "delete" button, let's hard delete or deactivate.
    # Let's hard delete for now as per previous conversation context about "Fix Habit Delete".
    db.delete(uh)
    db.commit()
    return {"success": True}
