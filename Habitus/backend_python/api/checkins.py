from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta

from db import get_db
import schemas, crud
from auth_deps import get_current_user
from models import User, Checkin, UserHabit
from logic import achievements as achievement_logic

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
        else:
            # Undo Check-in (Handle "False" explicit flag)
            from logic.streak_engine import undo_checkin
            result = await undo_checkin(
                db,
                current_user.id,
                user_habit.habit_id
            )
        
        return result.to_dict()
        
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
    return db.query(Checkin).join(UserHabit).filter(UserHabit.user_id == current_user.id).all()
