from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud
from ..stats_service import recompute_weekly_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/weekly/{user_id}", response_model=schemas.WeeklySummary)
def get_weekly_stats(
    user_id: str,
    week_start: date = Query(..., description="Week start date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    stats = recompute_weekly_stats(db, user_id=user_id, week_start=week_start)
    checkins = crud.list_checkins_for_user_week(db, user_id=user_id, week_start=week_start)
    total = len(checkins)
    completed = sum(1 for c in checkins if c.status == "completed")

    return schemas.WeeklySummary(
        user_id=user_id,
        week_start=week_start,
        completion_rate=float(stats.completion_rate),
        streak_global=stats.streak_global,
        checkins_total=total,
        checkins_completed=completed,
    )
