# Logic for achievements
from sqlalchemy.orm import Session
from datetime import date
from models import UserAchievement, Achievement, UserHabit, Checkin
import schemas

def check_and_unlock_achievements(user_id: int, db: Session):
    """
    Evaluates all achievement conditions for a user and unlocks them if met.
    """
    # 1. Get all achievements
    all_achievements = db.query(Achievement).all()
    
    # 2. Get user's current unlocked achievements (IDs)
    unlocked_ids = {
        ua.achievement_id for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    }
    
    # 3. Gather stats needed for evaluation
    # Total checkins
    total_checkins = db.query(Checkin).join(UserHabit).filter(UserHabit.user_id == user_id, Checkin.is_completed == True).count()
    
    # Max streak across all habits
    max_streak = 0
    user_habits = db.query(UserHabit).filter(UserHabit.user_id == user_id).all()
    for uh in user_habits:
        if uh.longest_streak > max_streak:
            max_streak = uh.longest_streak
        if uh.current_streak > max_streak:
            max_streak = uh.current_streak

    # 4. Evaluate each locked achievement
    newly_unlocked = []
    
    for ach in all_achievements:
        if ach.id in unlocked_ids:
            continue
            
        unlocked = False
        
        if ach.condition_type == 'checkins_count':
            if total_checkins >= ach.threshold:
                unlocked = True
                
        elif ach.condition_type == 'streak_days':
            if max_streak >= ach.threshold:
                unlocked = True
                
        elif ach.condition_type == 'perfect_day':
            # Check if user completed all active habits today
            # This is expensive to check every time, maybe optimize later.
            # For MVP: Check if today's checkins count == active habits count
            active_count = db.query(UserHabit).filter(UserHabit.user_id == user_id, UserHabit.is_active == True).count()
            today_checkins = db.query(Checkin).join(UserHabit).filter(
                UserHabit.user_id == user_id, 
                Checkin.log_date == date.today(),
                Checkin.is_completed == True
            ).count()
            
            if active_count > 0 and today_checkins >= active_count:
                unlocked = True

        if unlocked:
            # Grant achievement
            new_ua = UserAchievement(user_id=user_id, achievement_id=ach.id, awarded_at=date.today())
            db.add(new_ua)
            newly_unlocked.append(ach.name)
            
    if newly_unlocked:
        db.commit()
        
    return newly_unlocked
