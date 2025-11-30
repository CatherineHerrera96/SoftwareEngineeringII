from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta

from ..db import get_db
from .. import schemas
from ..stats_service import compute_weekly_stats

router = APIRouter(tags=["stats"])


@router.get("/weekly/{user_id}", response_model=schemas.WeeklySummary)
def get_weekly_stats(
    user_id: str,
    week_start: date | None = Query(None, description="Week start date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    if week_start is None:
        today = date.today()
        #initialize as last Monday
        week_start = today - timedelta(today.weekday())
    return compute_weekly_stats(db, user_id, week_start)
