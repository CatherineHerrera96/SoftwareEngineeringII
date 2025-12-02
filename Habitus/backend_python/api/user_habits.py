from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud

router = APIRouter(tags=["user-habits"])


@router.post("/", response_model=List[schemas.UserHabitRead], status_code=201)
def assign_user_habit(
    user_habits_in: List[schemas.UserHabitCreate],
    db: Session = Depends(get_db),
):
    return [
        schemas.UserHabitRead(
            id           = habit.id,
            user_id      = habit.user_id,
            habit_id     = habit.habit_id,
            is_active    = habit.is_active
        )
        for habit in map(lambda h: crud.assign_habit_to_user(db, h),user_habits_in)
    ]


@router.get("/{user_id}", response_model=List[schemas.UserHabitRead])
def list_user_habits(
    user_id: str,
    db: Session = Depends(get_db),
):
    return [
        schemas.UserHabitRead(
            id           = habits_info.id,
            user_id      = habits_info.user_id,
            habit_id     = habits_info.habit_id,
            is_active    = habits_info.is_active
        )
        for habits_info in crud.list_user_habits(db, user_id=user_id)
    ]


@router.get("/active/{user_id}", response_model=List[schemas.UserActiveHabitRead])
def list_user_habits(
    user_id: str,
    db: Session = Depends(get_db),
):
    return [
        schemas.UserActiveHabitRead(
            id           = habits_info.id,
            user_id      = habits_info.user_id,
            habit_id     = habits_info.habit_id,
            name     = name,
            is_completed = completed
        )
        for habits_info, name, completed in filter(lambda v: v[0].is_active, crud.list_active_user_habits(db, user_id=user_id))
    ]