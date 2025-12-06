from sqlalchemy.orm import Session
from models import DailyCheckin, UserHabit, User
from datetime import date, timedelta
from logic.achievements import check_and_unlock_achievements

def perform_checkin(db: Session, user_id: int, user_habit_id: int, checkin_date: date, completed: bool):
    # Verify ownership
    user_habit = db.query(UserHabit).filter(UserHabit.id == user_habit_id).first()
    if not user_habit or user_habit.user_id != user_id:
        raise ValueError("User habit not found or access denied")

    # Idempotent upsert
    existing = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == user_id,
        DailyCheckin.habit_id == user_habit.habit_id,
        DailyCheckin.date == checkin_date
    ).first()

    if existing:
        if existing.completed == completed:
            # No change
            return existing
        existing.completed = completed
    else:
        new_checkin = DailyCheckin(
            user_id=user_id,
            habit_id=user_habit.habit_id,
            date=checkin_date,
            completed=completed
        )
        db.add(new_checkin)
    
    db.commit() # Commit checkin first to ensure it's visible for streak calc

    # Recalculate streak
    update_streak(db, user_habit)
    
    # Check achievements
    if completed:
        check_and_unlock_achievements(user_id, db)
        
    return existing or new_checkin

def update_streak(db: Session, user_habit: UserHabit):
    # Calculate streak based on consecutive days ending today or yesterday
    # We need to find the chain of completed checkins going back from today/yesterday.
    
    # Get all completed checkins for this habit, ordered by date desc
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == user_habit.user_id,
        DailyCheckin.habit_id == user_habit.habit_id,
        DailyCheckin.completed == True
    ).order_by(DailyCheckin.date.desc()).all()
    
    if not checkins:
        user_habit.current_streak = 0
        db.commit()
        return

    # Determine "today" relative to the user's timezone? 
    # For now, we assume the checkins are already logical dates.
    # The streak is the count of consecutive days.
    
    streak = 0
    # We start checking from the latest checkin. 
    # If the latest checkin is today or yesterday, the streak is alive.
    # If the latest checkin is older than yesterday, the streak is broken (0), 
    # UNLESS we are strictly counting the chain ending at the latest checkin.
    # Usually "current streak" implies it's active.
    
    # Let's just count the chain from the latest checkin backwards.
    last_date = checkins[0].date
    streak = 1
    
    for i in range(1, len(checkins)):
        expected_date = last_date - timedelta(days=1)
        if checkins[i].date == expected_date:
            streak += 1
            last_date = checkins[i].date
        else:
            break
            
    # Now, is the streak "current"?
    # If the last checkin was today or yesterday, it's current.
    # If it was 2 days ago, it's 0.
    # Note: We need to know "today" in the user's context. 
    # Since we don't have easy access to "today" here without passing it in,
    # let's assume if we just updated it, it's likely current.
    # But for correctness, we should check against server time or user time.
    # Let's use server date for now as a fallback, or just store the chain length.
    # Most apps show the chain length of the last active run.
    # But if I missed yesterday, my streak should be 0 today.
    
    # Let's check gap from today.
    today = date.today()
    gap = (today - checkins[0].date).days
    
    if gap > 1:
        user_habit.current_streak = 0
    else:
        user_habit.current_streak = streak
        
    if user_habit.current_streak > user_habit.longest_streak:
        user_habit.longest_streak = user_habit.current_streak
        
    db.commit()
