from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db
from auth import get_current_user
from models import User
from pydantic import BaseModel

router = APIRouter()

class UserRead(BaseModel):
    id: int
    email: str
    name: str | None
    avatar_url: str | None
    timezone: str | None

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    timezone: str | None = None

@router.get("/", response_model=UserRead)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return current_user

@router.put("/", response_model=UserRead)
def update_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_update.name is not None:
        current_user.name = profile_update.name
    if profile_update.avatar_url is not None:
        current_user.avatar_url = profile_update.avatar_url
    if profile_update.timezone is not None:
        current_user.timezone = profile_update.timezone
    
    db.commit()
    db.refresh(current_user)
    return current_user
