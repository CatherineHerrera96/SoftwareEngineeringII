from typing import List
from fastapi import APIRouter, Depends, Body, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from db import get_db
import schemas, crud
from auth_deps import get_current_user
from models import User, UserHabit

router = APIRouter(tags=["user-habits"])


class UserHabitRequest(schemas.BaseModel):
    habit_ids: List[str]


@router.post("/", response_model=List[schemas.UserHabitRead], status_code=201)
def assign_user_habit(
    request: UserHabitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create UserHabit objects for each habit_id
    created_habits = []
    for habit_id in request.habit_ids:
        user_habit_in = schemas.UserHabitCreate(
            user_id=current_user.id,
            habit_id=habit_id
        )
        # Check if already exists? crud.assign_habit_to_user should handle it or we catch error
        # For MVP, we just try to assign.
        try:
            uh = crud.assign_habit_to_user(db, user_habit_in)
            created_habits.append(uh)
        except Exception:
            # Ignore duplicates or errors for now
            db.rollback()
            pass
            
    # Return the list of created (or existing) habits
    # We might need to re-fetch to be sure
    return [
        schemas.UserHabitRead(
            id=h.id,
            user_id=h.user_id,
            habit_id=h.habit_id,
            is_active=h.is_active,
            current_streak=h.current_streak,
            longest_streak=h.longest_streak,
            total_completions=h.total_completions,
            next_available_checkin_at=h.next_available_checkin_at,
            last_completed_at=h.last_completed_at,
            is_completed=False 
        ) for h in created_habits
    ]


from logic import streak_engine
from seasonal_config import CURRENT_SEASON

@router.get("/", response_model=List[schemas.UserHabitRead])
def list_my_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_now = streak_engine.get_user_now(current_user)
    results = []
    
    # We ignore the SQL-derived 'completed' boolean because it is date-based
    # and doesn't handle Test Mode intervals correctly.
    for habits_info, _ in crud.list_user_habits(db, user_id=current_user.id):
        
        # SEASONAL FILTERING:
        # 1. If habit has no season_id (Permanent) -> ALWAYS SHOW
        # 2. If habit has season_id (Seasonal):
        #    - matches CURRENT_SEASON -> SHOW
        #    - does NOT match (or CURRENT_SEASON is None) -> HIDE
        if habits_info.habits.season_id is not None:
             if CURRENT_SEASON != habits_info.habits.season_id:
                 # WRONG SEASON:
                 # 1. Reset streak to 0 (so it starts fresh next year)
                 if habits_info.current_streak > 0:
                     habits_info.current_streak = 0
                     habits_info.next_available_checkin_at = None # Unlock
                     db.commit()
                 
                 # 2. Hide from list
                 continue
        
        # Determine strict completion status for current interval
        # This handles both Daily and Test Mode (60s) intervals correctly
        is_completed = streak_engine.is_completed_in_current_interval(
            habits_info.last_completed_at,
            user_now
        )
        
        # Calculate Deadline (Window End)
        # For current interval, the "Next Interval Start" IS the deadline of this interval.
        window_end_at = streak_engine.get_next_interval_start(user_now)
        
        # STREAK RESET LOGIC: Check if streak is broken based on intervals
        # The previous logic (now >= next_available) was wrong because next_available starts the NEW window.
        # We only reset if the gap between last_completed and now is > 1.
        
        streak_broken = False
        previous_streak = None
        
        if habits_info.last_completed_at and habits_info.current_streak > 0:
            # Use the engine to check if checking in NOW would be a Reset
            # calculate_streak returns (new_streak, status, message, debug)
            _, status, _, _ = streak_engine.calculate_streak(
                habits_info.last_completed_at, 
                user_now, 
                habits_info.current_streak
            )
            
            if status == streak_engine.StreakStatus.RESET:
                # Streak is broken (gap > 1)
                previous_streak = habits_info.current_streak
                habits_info.current_streak = 0
                streak_broken = True
                # Reset cooldown/lock
                habits_info.next_available_checkin_at = None
                db.commit()

        results.append(schemas.UserHabitRead(
            id=habits_info.id,
            user_id=habits_info.user_id,
            habit_id=habits_info.habit_id,
            is_active=habits_info.is_active,
            current_streak=habits_info.current_streak,
            longest_streak=habits_info.longest_streak,
            total_completions=habits_info.total_completions,
            next_available_checkin_at=habits_info.next_available_checkin_at,
            window_end_at=window_end_at,
            last_completed_at=habits_info.last_completed_at,
            is_completed=is_completed,
            streak_broken=streak_broken,
            previous_streak=previous_streak
        ))
        
    return results


@router.delete("/{user_habit_id}")
def delete_user_habit(
    user_habit_id: int,
    confirm: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a habit from the user's tracked habits.
    
    If the habit has an active streak (>0), deletion requires ?confirm=true.
    Otherwise, returns a 400/409 with details about the streak to be lost.
    """
    user_habit = db.query(UserHabit).filter(UserHabit.id == user_habit_id).first()
    
    if not user_habit:
        raise HTTPException(status_code=404, detail="User habit not found")
    
    if user_habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this habit")
    
    # Check for active streak/progress
    has_progress = user_habit.current_streak > 0
    
    if has_progress and not confirm:
        # Require confirmation
        return JSONResponse(
            status_code=409,
            content={
                "requires_confirmation": True,
                "detail": f"You will lose your {user_habit.current_streak}-day streak!",
                "current_streak": user_habit.current_streak,
                "longest_streak": user_habit.longest_streak
            }
        )
    
    # Soft delete by setting is_active to False
    user_habit.is_active = False
    
    # Reset streak on deletion so re-adding starts fresh
    user_habit.current_streak = 0
    # Also reset lock so they can start immediately if re-added
    user_habit.next_available_checkin_at = None
    
    db.commit()
    
    return {"message": "Habit deleted successfully"}
