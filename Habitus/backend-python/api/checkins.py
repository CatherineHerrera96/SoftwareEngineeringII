from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.post("/", response_model=schemas.CheckinRead, status_code=201)
def create_checkin(
    checkin_in: schemas.CheckinCreate,
    db: Session = Depends(get_db),
):
    checkin = crud.create_or_update_checkin(
        db=db,
        user_habit_id=checkin_in.user_habit_id,
        date_=checkin_in.date,
        status=checkin_in.status,
    )
    return checkin
