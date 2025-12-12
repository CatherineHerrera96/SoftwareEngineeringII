from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schemas, crud
from ..auth_deps import get_current_user
from ..auth_deps import get_current_user
from ..models import User, Achievement, UserAchievement, Habit, UserHabit

router = APIRouter(tags=["achievements"])


@router.get("/", response_model=list[schemas.AchievementRead])
def list_all_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return [
        schemas.AchievementRead(
            id              = ach.id,
            code            = ach.code,
            name            = ach.name,
            description     = ach.description,
            threshold_type  = ach.threshold_type,
            threshold_value = ach.threshold_value
        )
        for ach in crud.list_achievements(db)
    ]

@router.get("/mine", response_model=schemas.AchievementsResponse)
def list_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Get Stats
    from ..stats_service import calculate_global_stats
    stats_data = calculate_global_stats(db, current_user.id)
    
    # 2. Get All Achievements
    all_achievements = crud.list_achievements(db)
    
    # 3. Get User Unlocked Achievements (with habit info logic if needed)
    # Re-using the raw relationship or simple query might fail to get habit names efficiently
    # So we do a custom query or post-process.
    
    user_unlocks = (
        db.query(UserAchievement, Habit.name)
        .outerjoin(Habit, UserAchievement.habit_id == Habit.id)
        .filter(UserAchievement.user_id == current_user.id)
        .all()
    )
    # user_unlocks is list of (UserAchievement, habit_name)
    
    unlocked_map = {ua.achievement_id: ua for ua, _ in user_unlocks}
    
    unlocked_list = []
    seen_keys = set()
    seen_achievement_ids = set()
    
    for ua, h_name in user_unlocks:
        # Deduplication logic:
        # If it's global (no habit_id), only show once.
        # If it's per-habit (habit_id exists), allow multiple (one per habit).
        
        # Check if we should skip
        if ua.achievement_id in seen_achievement_ids:
            # If it's a per-habit achievement, we allow duplicates ONLY if they are for different habits
            # But here `seen_achievement_ids` only tracks IDs.
            # Let's verify current UA nature.
            pass # deeper check below
        
        ach_def = next((a for a in all_achievements if a.id == ua.achievement_id), None)
        if ach_def:
            # Determine if this specific unlock should be added
            unique_key = (ach_def.id, ua.habit_id) # Unique by ID + Habit
            
            # Global achievements have habit_id=None. If we already saw (ID, None), skip.
            # Per-habit achievements have habit_id=123. If we saw (ID, 123), skip (shouldn't happen due to DB constraint).
            # But if we saw (ID, 456), we allow (ID, 123).
            
            # Use a separate set for keys
            if unique_key in seen_keys:
                continue
            
            seen_keys.add(unique_key)
            seen_achievement_ids.add(ach_def.id)
            # print(
            #     f"""{ach_def.id=!r}
            #     {ach_def.code=!r}
            #     {ach_def.name=!r}
            #     {ach_def.description=!r}
            #     {ach_def.category=!r}
            #     {ach_def.tier=!r}
            #     {ach_def.icon_emoji=!r}
            #     {ach_def.awarded_at=!r}
            #     {ach_def.habit_id=!r}
            #     {h_name=!r}"""
            # )
            unlocked_list.append(schemas.AchievementRead(
                id=ach_def.id,
                code=ach_def.code,
                name=ach_def.name,
                description=ach_def.description,
                category=ach_def.category,
                tier=ach_def.tier,
                icon_emoji=ach_def.icon_emoji,
                unlocked_at=ua.awarded_at,
                habit_id=ua.habit_id,
                habit_name=h_name
            ))
            
    # 4. Locked List
    locked_list = []
    
    # Pre-fetch user habits for progress calculation
    # Pre-fetch user habits for progress calculation
    user_habits = db.query(UserHabit).filter(UserHabit.user_id == current_user.id).all()
    total_completions_global = sum(uh.total_completions for uh in user_habits)
    best_streak = max((uh.current_streak for uh in user_habits), default=0)
    
    for ach in all_achievements:
        if ach.id in unlocked_map:
            continue
            
        # Calculate progress
        progress = None
        current_val = 0
        if ach.threshold_type == "per_habit_streak":
            current_val = best_streak
        elif ach.threshold_type == "total_completions":
            current_val = total_completions_global
            
        progress = {
            "current": min(current_val, ach.threshold_value),
            "target": ach.threshold_value
        }
        
        # FIX: Check for retroactive unlock (Self-Healing)
        if current_val >= ach.threshold_value:
            # Criteria met but not yet awarded. Award now.
            try:
                from datetime import datetime, timezone
                new_ua = UserAchievement(
                    user_id=current_user.id,
                    achievement_id=ach.id,
                    habit_id=None, # Global stats usually don't link to single habit unless specific
                    awarded_at=datetime.now(timezone.utc)
                )
                db.add(new_ua)
                db.commit()
                db.refresh(new_ua)
                
                # Add to unlocked list
                unlocked_list.append(schemas.AchievementRead(
                    id=ach.id,
                    code=ach.code,
                    name=ach.name,
                    description=ach.description,
                    category=ach.category,
                    tier=ach.tier,
                    icon_emoji=ach.icon_emoji,
                    unlocked_at=new_ua.awarded_at,
                    habit_id=None,
                    habit_name=None
                ))
                continue # Skip adding to locked_list
            except Exception as e:
                # If error (e.g. race condition), fallback to showing as locked
                db.rollback()
                pass

        locked_list.append(schemas.AchievementLockedRead(
            id=ach.id,
            code=ach.code,
            name=ach.name,
            description=ach.description,
            category=ach.category,
            tier=ach.tier,
            icon_emoji=ach.icon_emoji,
            threshold_type=ach.threshold_type,
            threshold_value=ach.threshold_value,
            progress=progress
        ))
    
    return schemas.AchievementsResponse(
        stats=schemas.AchievementStats(**stats_data),
        unlocked=unlocked_list,
        locked=locked_list
    )
