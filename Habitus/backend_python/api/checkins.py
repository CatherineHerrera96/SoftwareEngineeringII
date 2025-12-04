from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta

from db import get_db
import schemas, crud
from auth_deps import get_current_user
from models import User, Checkin, UserHabit
from logic import achievements as achievement_logic

router = APIRouter(tags=["checkins"])


@router.post("/", response_model=schemas.CheckinRead)
def checkin_habit(
    checkin_in: schemas.CheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # 1. Verify user owns this user_habit
        user_habit = db.query(UserHabit).filter(UserHabit.id == checkin_in.user_habit_id).first()
        if not user_habit or user_habit.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="User habit not found")

        # 2. Idempotent check-in (Upsert logic)
        existing_checkin = db.query(Checkin).filter(
            Checkin.user_habit_id == checkin_in.user_habit_id,
            Checkin.log_date == checkin_in.date
        ).first()

        if existing_checkin:
            existing_checkin.is_completed = checkin_in.is_completed
            db.commit()
            db.refresh(existing_checkin)
            checkin_record = existing_checkin
        else:
            checkin_record = Checkin(
                user_habit_id=checkin_in.user_habit_id,
                log_date=checkin_in.date,
                is_completed=checkin_in.is_completed
            )
            db.add(checkin_record)
            db.commit()
            db.refresh(checkin_record)

        # 3. Recalculate Streak
        streak = 0
        check_date = date.today()
        
        while True:
            done = db.query(Checkin).filter(
                Checkin.user_habit_id == user_habit.id,
                Checkin.log_date == check_date,
                Checkin.is_completed == True
            ).first()
            
            if done:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                if check_date == date.today():
                    check_date -= timedelta(days=1)
                    continue
                else:
                    break
        
        user_habit.current_streak = streak
        current_longest = user_habit.longest_streak or 0
        if streak > current_longest:
            user_habit.longest_streak = streak
            
        db.commit()

        # 4. Check Achievements
        try:
            achievement_logic.check_and_unlock_achievements(current_user.id, db)
        except Exception as e:
            print(f"Error checking achievements: {e}")
            pass

        return checkin_record

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
