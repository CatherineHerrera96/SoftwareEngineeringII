from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from auth import get_current_user
from models import User, UserAchievement, Achievement
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class AchievementRead(BaseModel):
    id: int
    code: str | None
    title: str # Frontend expects 'title'
    description: str | None
    awarded_at: datetime | None

    class Config:
        orm_mode = True

@router.get("/mine", response_model=List[AchievementRead])
def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Join UserAchievement with Achievement
    results = db.query(UserAchievement, Achievement).join(Achievement).filter(UserAchievement.user_id == current_user.id).all()
    
    # Format response
    output = []
    for ua, ach in results:
        output.append(AchievementRead(
            id=ach.id,
            code=ach.code,
            title=ach.name, # Map name to title
            description=ach.description,
            awarded_at=ua.awarded_at
        ))
    return output
