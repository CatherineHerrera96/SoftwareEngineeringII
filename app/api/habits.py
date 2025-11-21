from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud

router = APIRouter(prefix="/habits", tags=["habits"])


@router.post("/", response_model=schemas.HabitRead, status_code=201)
def create_habit(habit_in: schemas.HabitCreate, db: Session = Depends(get_db)):
    return crud.create_habit(db, habit_in)


@router.get("/", response_model=List[schemas.HabitRead])
def list_habits(db: Session = Depends(get_db)):
    return crud.list_habits(db)
