from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from db import get_db
from auth import get_current_user
from models import User, DailyCheckin
from logic import checkins as checkin_logic
from pydantic import BaseModel

router = APIRouter()

class CheckinCreate(BaseModel):
    user_habit_id: int
    date: date
    is_completed: bool

class CheckinRead(BaseModel):
    id: int
    user_habit_id: int | None = None # We don't store this directly in DailyCheckin anymore, but frontend expects it?
    # Wait, DailyCheckin has user_id and habit_id. 
    # Frontend sends user_habit_id.
    # We should return what frontend expects if possible.
    habit_id: int
    date: date
    completed: bool

    class Config:
        orm_mode = True

@router.post("/", response_model=CheckinRead)
def checkin(
    payload: CheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # We need to map user_habit_id to habit_id inside the logic or here.
    # The logic `perform_checkin` takes user_habit_id.
    try:
        checkin_record = checkin_logic.perform_checkin(
            db, 
            current_user.id, 
            payload.user_habit_id, 
            payload.date, 
            payload.is_completed
        )
        return checkin_record
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/", response_model=list[CheckinRead])
def list_checkins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DailyCheckin).filter(DailyCheckin.user_id == current_user.id).all()
