"""
Achievement Engine - Evaluates and unlocks achievements based on streaks.

Handles:
- Checking achievement thresholds
- Unlocking new achievements
- Preventing duplicate awards
"""
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session

from ..models import Achievement, UserAchievement


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
    
    # Get already unlocked achievements for this user (Global Uniqueness Check)
    existing = db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id
    ).all()
    
    existing_ids = {ua.achievement_id for ua in existing}
    
    
    # Check each achievement
    for achievement in all_achievements:
        # Skip if already unlocked (Globally)
        if achievement.id in existing_ids:
            continue
        
        # Check threshold
        unlocked = False
        target_habit_id = None
        
        if achievement.threshold_type == "per_habit_streak":
            if current_streak >= achievement.threshold_value:
                unlocked = True
                target_habit_id = habit_id
        elif achievement.threshold_type == "total_completions":
            if total_completions >= achievement.threshold_value:
                unlocked = True
                # Global achievement, no specific habit linked (or could link to triggering habit)
                target_habit_id = None
        
        # Unlock if threshold met
        if unlocked:
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                habit_id=target_habit_id
            )
            db.add(user_achievement)
            
            new_achievements.append({
                "id": achievement.id,
                "code": achievement.code,
                "name": achievement.name,
                "description": achievement.description,
                "category": achievement.category,
                "tier": achievement.tier,
                "icon_emoji": achievement.icon_emoji,
                "habit_id": target_habit_id,
                "unlocked_at": datetime.now(timezone.utc).isoformat()
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
        # --- STREAK ACHIEVEMENTS (Per Habit) ---
        {
            "code": "STREAK_3",
            "name": "On a Roll",
            "description": "Maintain a 3-day streak on a single habit.",
            "category": "streak",
            "tier": "bronze",
            "icon_emoji": "🔥",
            "threshold_type": "per_habit_streak",
            "threshold_value": 3
        },
        {
            "code": "STREAK_5",
            "name": "Work Week",
            "description": "5-day streak on a habit.",
            "category": "streak",
            "tier": "bronze",
            "icon_emoji": "💼",
            "threshold_type": "per_habit_streak",
            "threshold_value": 5
        },
        {
            "code": "STREAK_7",
            "name": "Weekly Warrior",
            "description": "Maintain a 7-day streak on a single habit.",
            "category": "streak",
            "tier": "silver",
            "icon_emoji": "🏅",
            "threshold_type": "per_habit_streak",
            "threshold_value": 7
        },
        {
            "code": "STREAK_10",
            "name": "Double Digits",
            "description": "10-day streak on a habit.",
            "category": "streak",
            "tier": "silver",
            "icon_emoji": "🔟",
            "threshold_type": "per_habit_streak",
            "threshold_value": 10
        },
        {
            "code": "STREAK_14",
            "name": "Two-Week Blaze",
            "description": "Maintain a 14-day streak on a single habit.",
            "category": "streak",
            "tier": "gold",
            "icon_emoji": "⚡",
            "threshold_type": "per_habit_streak",
            "threshold_value": 14
        },
        {
            "code": "STREAK_21",
            "name": "Habit Former",
            "description": "Maintain a 21-day streak. Science says it takes 21 days!",
            "category": "streak",
            "tier": "gold",
            "icon_emoji": "🧠",
            "threshold_type": "per_habit_streak",
            "threshold_value": 21
        },
        {
            "code": "STREAK_30",
            "name": "Unbreakable",
            "description": "Maintain a 30-day streak on a single habit.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "🌟",
            "threshold_type": "per_habit_streak",
            "threshold_value": 30
        },
        {
            "code": "STREAK_40",
            "name": "Quarantine Pro",
            "description": "40 days and 40 nights of discipline.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "⛺",
            "threshold_type": "per_habit_streak",
            "threshold_value": 40
        },
        {
            "code": "STREAK_50",
            "name": "Half Century",
            "description": "Maintain a 50-day streak on a single habit.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "🛡️",
            "threshold_type": "per_habit_streak",
            "threshold_value": 50
        },
        {
            "code": "STREAK_60",
            "name": "Example Setter",
            "description": "Two full months of consistency.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "👩‍🏫",
            "threshold_type": "per_habit_streak",
            "threshold_value": 60
        },
        {
            "code": "STREAK_75",
            "name": "Diamond Discipline",
            "description": "75 days of unbreakable will.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "�",
            "threshold_type": "per_habit_streak",
            "threshold_value": 75
        },
        {
            "code": "STREAK_90",
            "name": "Quarterly King",
            "description": "90 days - almost a full season!",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "🍂",
            "threshold_type": "per_habit_streak",
            "threshold_value": 90
        },
        {
            "code": "STREAK_100",
            "name": "Centurion",
            "description": "Reach a majestic 100-day streak.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "👑",
            "threshold_type": "per_habit_streak",
            "threshold_value": 100
        },
        {
            "code": "STREAK_200",
            "name": "Spartan",
            "description": "200 days of dedication.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "⚔️",
            "threshold_type": "per_habit_streak",
            "threshold_value": 200
        },
        {
            "code": "STREAK_365",
            "name": "Year of Greatness",
            "description": "A full year streak. You are a legend.",
            "category": "streak",
            "tier": "master",
            "icon_emoji": "📅",
            "threshold_type": "per_habit_streak",
            "threshold_value": 365
        },

        # --- GLOBAL COMPLETIONS (Total count across all habits) ---
        {
            "code": "TOTAL_1",
            "name": "First Steps",
            "description": "Complete your very first habit.",
            "category": "consistency",
            "tier": "bronze",
            "icon_emoji": "�",
            "threshold_type": "total_completions",
            "threshold_value": 1
        },
        {
            "code": "TOTAL_5",
            "name": "High Five",
            "description": "Complete 5 habits.",
            "category": "consistency",
            "tier": "bronze",
            "icon_emoji": "✋",
            "threshold_type": "total_completions",
            "threshold_value": 5
        },
        {
            "code": "TOTAL_10",
            "name": "Getting Started",
            "description": "Complete any habit 10 times.",
            "category": "consistency",
            "tier": "bronze",
            "icon_emoji": "🎉",
            "threshold_type": "total_completions",
            "threshold_value": 10
        },
        {
            "code": "TOTAL_25",
            "name": "Picking Up Steam",
            "description": "Complete habits 25 times in total.",
            "category": "consistency",
            "tier": "bronze",
            "icon_emoji": "�",
            "threshold_type": "total_completions",
            "threshold_value": 25
        },
        {
            "code": "TOTAL_50",
            "name": "Routine Builder",
            "description": "Complete habits 50 times in total.",
            "category": "consistency",
            "tier": "silver",
            "icon_emoji": "�",
            "threshold_type": "total_completions",
            "threshold_value": 50
        },
        {
            "code": "TOTAL_75",
            "name": "Stacking Up",
            "description": "Complete habits 75 times in total.",
            "category": "consistency",
            "tier": "silver",
            "icon_emoji": "�️",
            "threshold_type": "total_completions",
            "threshold_value": 75
        },
        {
            "code": "TOTAL_100",
            "name": "Century Club",
            "description": "Complete 100 habits total.",
            "category": "consistency",
            "tier": "silver",
            "icon_emoji": "💯",
            "threshold_type": "total_completions",
            "threshold_value": 100
        },
        {
            "code": "TOTAL_150",
            "name": "Momentum Master",
            "description": "150 completions. You're rolling!",
            "category": "consistency",
            "tier": "silver",
            "icon_emoji": "🌊",
            "threshold_type": "total_completions",
            "threshold_value": 150
        },
        {
            "code": "TOTAL_250",
            "name": "Habit Machine",
            "description": "Complete 250 habits total.",
            "category": "consistency",
            "tier": "gold",
            "icon_emoji": "🤖",
            "threshold_type": "total_completions",
            "threshold_value": 250
        },
        {
            "code": "TOTAL_500",
            "name": "Consistency King",
            "description": "Complete 500 habits total.",
            "category": "consistency",
            "tier": "gold",
            "icon_emoji": "🏰",
            "threshold_type": "total_completions",
            "threshold_value": 500
        },
        {
            "code": "TOTAL_750",
            "name": "Virtuoso",
            "description": "750 completions. Pure dedication.",
            "category": "consistency",
            "tier": "gold",
            "icon_emoji": "🎻",
            "threshold_type": "total_completions",
            "threshold_value": 750
        },
        {
            "code": "TOTAL_1000",
            "name": "Legendary",
            "description": "Complete 1,000 habits total.",
            "category": "consistency",
            "tier": "master",
            "icon_emoji": "🦄",
            "threshold_type": "total_completions",
            "threshold_value": 1000
        },
         {
            "code": "TOTAL_1500",
            "name": "Mythic",
            "description": "1,500 completions. Beyond legendary.",
            "category": "consistency",
            "tier": "master",
            "icon_emoji": "🐉",
            "threshold_type": "total_completions",
            "threshold_value": 1500
        },
        {
            "code": "TOTAL_2500",
            "name": "Ethereal",
            "description": "2,500 completions. Pure energy.",
            "category": "consistency",
            "tier": "master",
            "icon_emoji": "🌌",
            "threshold_type": "total_completions",
            "threshold_value": 2500
        },
        {
            "code": "TOTAL_5000",
            "name": "Universal",
            "description": "5,000 completions. You are the habit.",
            "category": "consistency",
            "tier": "master",
            "icon_emoji": "🪐",
            "threshold_type": "total_completions",
            "threshold_value": 5000
        }
    ]
    
    for ach_data in achievements:
        existing = db.query(Achievement).filter(Achievement.code == ach_data["code"]).first()
        if not existing:
            achievement = Achievement(**ach_data)
            db.add(achievement)
        else:
            # Update existing if needed (optional)
            for k, v in ach_data.items():
                setattr(existing, k, v)
    
    db.commit()
    print(f"[Achievement Engine] Seeded/Updated {len(achievements)} achievements")
