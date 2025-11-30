from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud

router = APIRouter(tags=["user-habits"])


@router.post("/", response_model=schemas.UserHabitRead, status_code=201)
def assign_user_habit(
    user_habit_in: schemas.UserHabitCreate,
    db: Session = Depends(get_db),
):
    return crud.assign_habit_to_user(db, user_habit_in)


@router.get("/{user_id}", response_model=List[schemas.UserHabitRead])
def list_user_habits(
    user_id: str,
    db: Session = Depends(get_db),
):
    return crud.list_user_habits(db, user_id=user_id)
