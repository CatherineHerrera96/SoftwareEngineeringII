
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from ..db import get_db
from .. import schemas, crud
from ..auth_deps import get_current_user
from ..models import User, Checkin, UserHabit
from ..logic.streak_engine import process_checkin, undo_checkin, StreakError

router = APIRouter(tags=["checkins"])


@router.post("/", response_model=dict, status_code=201)
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
        # Verify user owns this user_habit
        user_habit = db.query(UserHabit).filter(UserHabit.id == checkin_in.user_habit_id).first()
        if not user_habit or user_habit.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="User habit not found")

        # Delegate to Streak Engine
        if checkin_in.is_completed:
            result = await process_checkin(db, current_user.id, user_habit.habit_id)
        else:
            result = await undo_checkin(db, current_user.id, user_habit.habit_id)

        return result.to_dict()

    except StreakError as se:
        # Map StreakErrors to HTTP exceptions
        if se.code == "COOLDOWN":
            raise HTTPException(status_code=409, detail=se.message)
        else:
            raise HTTPException(status_code=400, detail=se.message)
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
