from sqlalchemy.orm import Session
from models import Achievement, UserAchievement, UserHabit, DailyCheckin
from datetime import date

def check_and_unlock_achievements(user_id: int, db: Session):
    # Get all achievements
    all_achievements = db.query(Achievement).all()
    
    # Get user's unlocked achievements
    user_achievements = db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    unlocked_ids = {ua.achievement_id for ua in user_achievements}
    
    for achievement in all_achievements:
        if achievement.id in unlocked_ids:
            continue
            
        if evaluate_achievement(user_id, achievement, db):
            unlock_achievement(user_id, achievement.id, db)

def evaluate_achievement(user_id: int, achievement: Achievement, db: Session) -> bool:
    code = achievement.code
    
    if code == "STREAK_7":
        return check_streak(user_id, 7, db)
    elif code == "STREAK_30":
        return check_streak(user_id, 30, db)
    elif code == "TOTAL_100_CHECKINS":
        return check_total_checkins(user_id, 100, db)
    
    return False

def check_streak(user_id: int, target_streak: int, db: Session) -> bool:
    # Check if any user habit has a current streak >= target
    # Note: This checks current streak. If we want longest streak ever, we should check longest_streak.
    # Let's check longest_streak to be safe/generous.
    user_habits = db.query(UserHabit).filter(UserHabit.user_id == user_id).all()
    for uh in user_habits:
        if uh.longest_streak >= target_streak:
            return True
    return False

def check_total_checkins(user_id: int, target_count: int, db: Session) -> bool:
    count = db.query(DailyCheckin).filter(DailyCheckin.user_id == user_id, DailyCheckin.completed == True).count()
    return count >= target_count

def unlock_achievement(user_id: int, achievement_id: int, db: Session):
    ua = UserAchievement(user_id=user_id, achievement_id=achievement_id)
    db.add(ua)
    db.commit()
