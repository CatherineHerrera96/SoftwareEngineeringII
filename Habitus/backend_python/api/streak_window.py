from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from auth_deps import get_current_user
from models import User
from logic import streak_engine

router = APIRouter(tags=["streak"])


@router.get("/streak-window")
async def get_streak_window(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return the current streak window end time for the user.
    This is when the current day/interval expires.
    """
    user_now = streak_engine.get_user_now(current_user)
    window_end_at = streak_engine.get_next_interval_start(user_now)
    
    return {
        "window_end_at": window_end_at.isoformat(),
        "current_time": user_now.isoformat()
    }
