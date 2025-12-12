from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from ..db import get_db
from .. import schemas, crud
from ..auth_deps import get_current_user
from ..models import User, Checkin, UserHabit
from ..logic import achievements as achievement_logic

router = APIRouter(tags=["checkins"])


@router.post("/", response_model=dict)
async def checkin_habit(
    checkin_in: schemas.CheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a habit as completed for today.
    
    Uses the streak engine to:
    - Enforce cooldown period
    - Update streaks
    - Unlock achievements
    - Return structured response with user-friendly messages
    """
    try:
        # Import streak engine
        from logic.streak_engine import process_checkin, StreakError
        
        # Verify user owns this user_habit
        user_habit = db.query(UserHabit).filter(UserHabit.id == checkin_in.user_habit_id).first()
        if not user_habit or user_habit.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="User habit not found")
        
        # Process check-in with streak engine
        if checkin_in.is_completed:
            # Normal Check-in
            result = await process_checkin(
                db,
                current_user.id,
                user_habit.habit_id
            )
            
            # --- Unlock Achievements ---
            try:
                # Calculate global total completions
                total_global = (
                    db.query(func.sum(UserHabit.total_completions))
                    .filter(UserHabit.user_id == current_user.id)
                    .scalar()
                ) or 0
                
                new_unlocks = await achievement_logic.evaluate_achievements(
                    db,
                    current_user.id,
                    user_habit.habit_id,
                    result.current_streak,
                    total_global
                )
                
                # Update result with new achievements
                # Note: result is a StreakResult object, we might need to attach it 
                # or just merge dicts. StreakResult has to_dict().
                
                # Check if StreakResult has a field for this, if not we merge after to_dict.
                # But here we are returning result.to_dict() at the end.
                # Let's attach it to the dict response.
                
            except Exception as e:
                print(f"Achievement Eval Error: {e}")
                new_unlocks = []
                
        else:
            # Undo Check-in (Handle "False" explicit flag)
            from logic.streak_engine import undo_checkin
            result = await undo_checkin(
                db,
                current_user.id,
                user_habit.habit_id
            )
            new_unlocks = []
        
        response_data = result.to_dict()
        response_data["new_achievements"] = new_unlocks
        return response_data
        
    except StreakError as se:
        # Cooldown or other streak-specific error
        if se.code == "COOLDOWN_ACTIVE":
            raise HTTPException(
                status_code=409,
                detail={
                    "code": se.code,
                    "message": se.message,
                    "lock_until": se.lock_until.isoformat() if se.lock_until else None
                }
            )
        else:
            raise HTTPException(status_code=400, detail={"code": se.code, "message": se.message})
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL ERROR IN CHECKIN: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[schemas.CheckinRead])
def list_checkins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Return checkins for current user
    return db.query(Checkin).join(UserHabit).filter(
        UserHabit.user_id == current_user.id,
        Checkin.is_completed == True
    ).all()
