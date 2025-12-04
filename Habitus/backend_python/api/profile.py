from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, db
from auth_deps import get_current_user

router = APIRouter(tags=["profile"])

@router.get("/", response_model=schemas.UserRead)
def get_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(db.get_db)
):
    # Refresh user from DB to get latest fields
    db.refresh(current_user)
    return current_user

@router.put("/", response_model=schemas.UserRead)
def update_profile(
    profile_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(db.get_db)
):
    # Update fields if provided
    if profile_update.name is not None:
        current_user.name = profile_update.name
    if profile_update.avatar_url is not None:
        current_user.avatar_url = profile_update.avatar_url
    if profile_update.timezone is not None:
        current_user.timezone = profile_update.timezone
    
    db.commit()
    db.refresh(current_user)
    return current_user
