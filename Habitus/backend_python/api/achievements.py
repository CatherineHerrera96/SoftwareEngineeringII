from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud

router = APIRouter(tags=["achievements"])


@router.get("/", response_model=list[schemas.AchievementRead])
def list_all_achievements(
    db: Session = Depends(get_db),
):
    return [
        schemas.AchievementRead(
            id          = achivement.id,
            title       = achivement.name,
            description = achivement.description
        )
        for achivement in crud.list_achievements(db)
    ]

@router.get("/{user_id}", response_model=list[schemas.AchievementRead])
def list_user_achievements(
    user_id: str,
    db: Session = Depends(get_db),
):
    return [
        schemas.AchievementRead(
            id          = achivement.id,
            title       = achivement.name,
            description = achivement.description
        )
        for achivement in crud.list_user_achievements(db, user_id)
    ]
