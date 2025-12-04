from typing import List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud
from ..auth_deps import get_current_user
from ..models import User

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
            is_completed=False 
        ) for h in created_habits
    ]


@router.get("/", response_model=List[schemas.UserHabitRead])
def list_my_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [
        schemas.UserHabitRead(
            id=habits_info.id,
            user_id=habits_info.user_id,
            habit_id=habits_info.habit_id,
            is_active=habits_info.is_active,
            is_completed=completed
        )
        for habits_info, completed in crud.list_user_habits(db, user_id=current_user.id)
    ]
