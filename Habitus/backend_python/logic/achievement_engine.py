"""
Achievement Engine - Evaluates and unlocks achievements based on streaks.

Handles:
- Checking achievement thresholds
- Unlocking new achievements
- Preventing duplicate awards
"""
from typing import List
from sqlalchemy.orm import Session

from models import Achievement, UserAchievement


async def evaluate_achievements(
    db: Session,
    user_id: int,
    habit_id: int,
    current_streak: int,
    total_completions: int
) -> List[dict]:
    """
    Evaluate and unlock achievements based on current progress.
    
    Args:
        db: Database session
        user_id: User ID
        habit_id: Habit ID
        current_streak: Current streak length
        total_completions: Total number of completions
        
    Returns:
        List of newly unlocked achievements as dicts
    """
    new_achievements = []
    
    # Get all possible achievements
    all_achievements = db.query(Achievement).all()
    
    # Get already unlocked achievements for this user & habit
    existing = db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id,
        UserAchievement.habit_id == habit_id
    ).all()
    
    existing_ids = {ua.achievement_id for ua in existing}
    
    # Check each achievement
    for achievement in all_achievements:
        # Skip if already unlocked
        if achievement.id in existing_ids:
            continue
        
        # Check threshold
        unlocked = False
        if achievement.threshold_type == "streak_length":
            if current_streak >= achievement.threshold_value:
                unlocked = True
        elif achievement.threshold_type == "total_completions":
            if total_completions >= achievement.threshold_value:
                unlocked = True
        
        # Unlock if threshold met
        if unlocked:
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                habit_id=habit_id
            )
            db.add(user_achievement)
            
            new_achievements.append({
                "id": achievement.id,
                "code": achievement.code,
                "name": achievement.name,
                "description": achievement.description
            })
    
    if new_achievements:
        db.commit()
    
    return new_achievements


def seed_initial_achievements(db: Session):
    """
    Seed database with initial achievement definitions.
    Call this once when setting up the database.
    """
    achievements = [
        {
            "code": "STREAK_3",
            "name": "3-Day Streak",
            "description": "Complete a habit for 3 consecutive days",
            "threshold_type": "streak_length",
            "threshold_value": 3
        },
        {
            "code": "STREAK_7",
            "name": "Week Warrior",
            "description": "Complete a habit for 7 consecutive days",
            "threshold_type": "streak_length",
            "threshold_value": 7
        },
        {
            "code": "STREAK_30",
            "name": "Monthly Master",
            "description": "Complete a habit for 30 consecutive days",
            "threshold_type": "streak_length",
            "threshold_value": 30
        },
        {
            "code": "STREAK_100",
            "name": "Centurion",
            "description": "Complete a habit for 100 consecutive days",
            "threshold_type": "streak_length",
            "threshold_value": 100
        },
        {
            "code": "TOTAL_10",
            "name": "Getting Started",
            "description": "Complete a habit 10 times",
            "threshold_type": "total_completions",
            "threshold_value": 10
        },
        {
            "code": "TOTAL_50",
            "name": "Dedicated",
            "description": "Complete a habit 50 times",
            "threshold_type": "total_completions",
            "threshold_value": 50
        },
        {
            "code": "TOTAL_100",
            "name": "Hundred Club",
            "description": "Complete a habit 100 times",
            "threshold_type": "total_completions",
            "threshold_value": 100
        },
    ]
    
    for ach_data in achievements:
        # Check if already exists
        existing = db.query(Achievement).filter(Achievement.code == ach_data["code"]).first()
        if not existing:
            achievement = Achievement(**ach_data)
            db.add(achievement)
    
    db.commit()
    print(f"[Achievement Engine] Seeded {len(achievements)} achievements")
