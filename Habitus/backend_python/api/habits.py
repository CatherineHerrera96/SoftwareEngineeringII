from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..db import get_db
from .. import schemas, crud
from ..auth_deps import get_current_user
from ..models import User, Habit, UserHabit, Checkin

router = APIRouter(tags=["habits"])


@router.post("/", response_model=schemas.HabitRead, status_code=201)
def create_habit(
    habit_in: schemas.HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create a custom habit for the user
    habit_data = habit_in.dict()
    habit_data["user_id"] = current_user.id
    habit_data["is_custom"] = True
    
    new_habit = Habit(**habit_data)
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return new_habit


@router.get("/", response_model=List[schemas.HabitRead])
def list_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Return system habits (user_id is NULL) AND user's custom habits
    return db.query(Habit).filter(
        or_(
            Habit.user_id == None,
            Habit.user_id == current_user.id
        )
    ).all()


@router.get("/{habit_id}", response_model=schemas.HabitRead)
def get_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single habit by ID."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Check access: system habits or user's own custom habits
    if habit.user_id is not None and habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this habit")
    
    return habit


@router.put("/{habit_id}", response_model=schemas.HabitRead)
def update_habit(
    habit_id: int,
    habit_update: schemas.HabitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a habit. Only the owner can update custom habits."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Only allow updating custom habits that belong to the user
    if habit.user_id is None:
        raise HTTPException(status_code=403, detail="Cannot modify system habits")
    
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this habit")
    
    # Update fields
    update_data = habit_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)
    
    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=204)
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a habit. Only the owner can delete custom habits."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Only allow deleting custom habits that belong to the user
    if habit.user_id is None:
        raise HTTPException(status_code=403, detail="Cannot delete system habits")
    
    if habit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this habit")
    
    # First, delete all related checkins for user_habits referencing this habit
    user_habits = db.query(UserHabit).filter(UserHabit.habit_id == habit_id).all()
    for uh in user_habits:
        db.query(Checkin).filter(Checkin.user_habit_id == uh.id).delete()
    
    # Then delete all user_habits referencing this habit
    db.query(UserHabit).filter(UserHabit.habit_id == habit_id).delete()
    
    # Finally delete the habit itself
    db.delete(habit)
    db.commit()
    return None
