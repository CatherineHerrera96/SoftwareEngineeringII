from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
import schemas, crud
from auth_deps import get_current_user
from models import User

router = APIRouter(tags=["achievements"])


@router.get("/", response_model=list[schemas.AchievementRead])
def list_all_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [
        schemas.AchievementRead(
            id          = ach.id,
            title       = ach.name,
            description = ach.description
        )
        for ach in crud.list_achievements(db)
    ]

@router.get("/mine", response_model=list[schemas.AchievementRead])
def list_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [
        schemas.AchievementRead(
            id          = ach.id,
            title       = ach.name,
            description = ach.description
        )
        for ach in crud.list_user_achievements(db, current_user.id)
    ]
