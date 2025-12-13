from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta

from ..db import get_db
from .. import schemas
from ..stats_service import compute_weekly_stats
from ..utils_time import get_user_today
from ..auth_deps import get_current_user
from ..models import User

router = APIRouter(tags=["stats"])


@router.get("/weekly", response_model=schemas.WeeklySummary)
def get_weekly_stats(
    week_start: date | None = Query(None, description="Week start date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if week_start is None:
        today = get_user_today(current_user)
        #initialize as last Monday
        week_start = today - timedelta(today.weekday())
    return compute_weekly_stats(db, str(current_user.id), week_start)
