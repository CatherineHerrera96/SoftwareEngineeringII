"""
Streak Engine - Core logic for Duolingo-style habit streaks.

Handles:
- Cooldown enforcement (server-side time only)
- Streak calculation (continue, reset, or start)
- Test vs production mode intervals
- Timezone-aware datetime handling
"""
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
try:
    from zoneinfo import ZoneInfo
except ImportError:
    # Fallback for Python < 3.9 (backports.zoneinfo) or just use UTC
    from datetime import timezone as ZoneInfoUTC
    def ZoneInfo(name):
        return timezone.utc

from sqlalchemy.orm import Session

from models import User, UserHabit, Checkin
import config


class StreakStatus:
    """Enum-like constants for streak status"""
    CONTINUES = "streak_continues"
    RESET = "streak_reset" 
    STARTED = "streak_started"


class StreakError(Exception):
    """Base exception for streak-related errors"""
    def __init__(self, code: str, message: str, lock_until: Optional[datetime] = None):
        self.code = code
        self.message = message
        self.lock_until = lock_until
        super().__init__(message)


class StreakResult:
    """Result of a streak check-in operation"""
    def __init__(
        self,
        habit_id: int,
        current_streak: int,
        longest_streak: int,
        total_completions: int,
        lock_until: datetime,
        status: str,
        user_message: str,
        new_achievements: list = None
    ):
        self.habit_id = habit_id
        self.current_streak = current_streak
        self.longest_streak = longest_streak
        self.total_completions = total_completions
        self.lock_until = lock_until
        self.status = status
        self.user_message = user_message
        self.new_achievements = new_achievements or []

    def to_dict(self):
        return {
            "habit_id": self.habit_id,
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "total_completions": self.total_completions,
            "lock_until": self.lock_until.isoformat(),
            "status": self.status,
            "user_message": self.user_message,
            "new_achievements": self.new_achievements
        }


def get_user_now(user: User) -> datetime:
    """
    Get current time in user's timezone.
    """
    if user.timezone:
        try:
            return datetime.now(ZoneInfo(user.timezone))
        except Exception:
            pass
    
    # Default to UTC if no valid timezone
    return datetime.now(timezone.utc)


def get_interval_index(dt: datetime) -> int:
    """
    Get an integer index representing the streak interval for a given time.
    Daily: Ordinal date.
    Test: Bucket index based on epoch.
    """
    if config.STREAK_MODE == config.StreakMode.DAILY:
        return dt.date().toordinal()
    else:
        epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
        seconds_since_epoch = (dt - epoch).total_seconds()
        interval_seconds = config.STREAK_INTERVAL_SECONDS
        return int(seconds_since_epoch // interval_seconds)

def get_interval_key(dt: datetime) -> str:
    """Legacy wrapper for logging/debugging mainly"""
    return str(get_interval_index(dt))

def is_completed_in_current_interval(last_completed_at: Optional[datetime], now: datetime) -> bool:
    """
    Check if the last completion counts for the current 'now' interval.
    Robustly handles timezone differences (e.g. UTC DB vs User TZ).
    """
    if not last_completed_at:
        return False
        
    # Split logic based on Mode
    if config.STREAK_MODE == config.StreakMode.TEST:
        # TEST MODE: Use Absolute Time (UTC)
        # We don't care about "Days", just absolute seconds since Epoch.
        # Normalize both to UTC.
        last = last_completed_at.astimezone(timezone.utc) if last_completed_at.tzinfo else last_completed_at.replace(tzinfo=timezone.utc)
        cur = now.astimezone(timezone.utc) if now.tzinfo else now.replace(tzinfo=timezone.utc)
        return get_interval_index(last) == get_interval_index(cur)
    else:
        # DAILY MODE: Use User's Local Date
        # Verify both dates fall on the same local day.
        # Postgres stores as UTC (Aware). 'now' is User Aware. 
        # We must compare Interval Indices in the SAME timezone logic (User's day).
        adjusted_last = last_completed_at
        
        if last_completed_at.tzinfo and now.tzinfo:
            adjusted_last = last_completed_at.astimezone(now.tzinfo)
        elif last_completed_at.tzinfo is None and now.tzinfo:
            # Assume DB stored UTC if naive
            adjusted_last = last_completed_at.replace(tzinfo=timezone.utc).astimezone(now.tzinfo)
            
        return get_interval_index(adjusted_last) == get_interval_index(now)

def calculate_streak(
    last_completed_at: Optional[datetime],
    current_now: datetime,
    current_streak: int
) -> Tuple[int, str, str]:
    """
    Calculate new streak value based on interval indices.
    Includes debug logging for streak analysis.
    """
    if last_completed_at is None:
        return (1, StreakStatus.STARTED, "🎉 Started your first streak! Keep it going!")
    
    # Normalize for safety (though subtraction usually handles it)
    if last_completed_at.tzinfo:
        last_utc = last_completed_at.astimezone(timezone.utc)
    else:
        last_utc = last_completed_at.replace(tzinfo=timezone.utc)
        
    if current_now.tzinfo:
        now_utc = current_now.astimezone(timezone.utc)
    else:
        now_utc = current_now.replace(tzinfo=timezone.utc)

    last_idx = get_interval_index(last_utc)
    current_idx = get_interval_index(now_utc)
    
    diff = current_idx - last_idx
    
    if diff == 0:
        # Same interval - already completed
        return (current_streak, StreakStatus.CONTINUES, f"🔥 {current_streak}-day streak!")
    elif diff == 1:
        # Consecutive interval - Increment!
        new_streak = current_streak + 1
        messages = [
            f"🔥 {new_streak}-day streak! You're on fire!",
            f"💪 {new_streak} days and counting! Keep it up!",
            f"⭐ Amazing! {new_streak}-day streak maintained!",
            f"🎯 {new_streak} days strong! Don't break the chain!",
        ]
        message = messages[min(new_streak - 1, len(messages) - 1)]
        return (new_streak, StreakStatus.CONTINUES, message)
    else:
        # Gap > 1 - Reset
        old_streak = current_streak
        messages = [
            f"😢 You lost your {old_streak}-day streak. But you can start fresh today!",
            f"💔 Streak reset from {old_streak} days. Don't give up!",
            f"🔄 Your {old_streak}-day streak ended, but every day is a new chance!",
        ]
        message = messages[min(old_streak - 1, len(messages) - 1)] if old_streak > 0 else "Let's start a new streak!"
        return (1, StreakStatus.RESET, message)


def get_next_interval_start(dt: datetime) -> datetime:
    """
    Calculate the start time of the NEXT interval.
    Daily: Next midnight.
    Test: Start of next bucket.
    """
    if config.STREAK_MODE == config.StreakMode.TEST:
        # Test Mode (Buckets)
        # Epoch-based
        epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
        # Ensure dt is UTC for calc
        dt_utc = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        
        seconds_since = (dt_utc - epoch).total_seconds()
        interval = config.STREAK_INTERVAL_SECONDS
        
        current_idx = int(seconds_since // interval)
        next_idx = current_idx + 1
        
        next_start_utc = epoch + timedelta(seconds=next_idx * interval)
        # Convert back to dt's timezone if possible, or UTC
        return next_start_utc.astimezone(dt.tzinfo) if dt.tzinfo else next_start_utc
        
    else:
        # Daily Mode
        # Tomorrow Midnight (User Local Time)
        # dt is assumed to be User Local Time (get_user_now)
        tomorrow = dt.date() + timedelta(days=1)
        next_start = datetime.combine(tomorrow, datetime.min.time())
        # Apply timezone
        if dt.tzinfo:
            next_start = next_start.replace(tzinfo=dt.tzinfo)
        return next_start


async def process_checkin(
    db: Session,
    user_id: int,
    habit_id: int
) -> StreakResult:
    """
    Main streak engine. Process a habit check-in and update streaks.
    """
    # Import here to avoid circular dependency
    from logic.achievement_engine import evaluate_achievements
    
    # 1. Load user and user_habit
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise StreakError("USER_NOT_FOUND", "User not found")
    
    user_habit = db.query(UserHabit).filter(
        UserHabit.user_id == user_id,
        UserHabit.habit_id == habit_id,
        UserHabit.is_active == True
    ).first()
    
    if not user_habit:
        raise StreakError("HABIT_NOT_ASSIGNED", "This habit is not assigned to you")
    
    # 2. Get server time in user's timezone
    now = get_user_now(user)
    
    # 3. Enforce cooldown using Stored Next Available
    # Fixed Logic: Use the stored next_available boundary (Start of Interval)
    # This replaces the sliding window logic which broke streaks.
    if user_habit.next_available_checkin_at:
        # Check against stored boundary
        check_time = user_habit.next_available_checkin_at
        
        # Normalize for comparison
        if check_time.tzinfo and now.tzinfo:
            if now < check_time:
                 # Cooldown active
                 diff = check_time - now
                 msg = f"Wait {int(diff.total_seconds())}s"
                 raise StreakError("COOLDOWN_ACTIVE", msg, lock_until=check_time)
        elif not check_time.tzinfo and not now.tzinfo:
             if now < check_time:
                 raise StreakError("COOLDOWN_ACTIVE", "Wait...", lock_until=check_time)
        else:
             # Mismatch - conservative fail (or convert one)
             # Should not happen with get_user_now consistency
             pass

    # 4. Check if already completed in this interval (idempotent)
    # Double check logic - if last_completed is in current interval
    if is_completed_in_current_interval(user_habit.last_completed_at, now):
         return StreakResult(
            habit_id=habit_id,
            current_streak=user_habit.current_streak,
            longest_streak=user_habit.longest_streak,
            total_completions=user_habit.total_completions,
            lock_until=user_habit.next_available_checkin_at or now,
            status=StreakStatus.CONTINUES,
            user_message=f"✅ Already completed!",
            new_achievements=[]
        )
    
    # 5. Calculate new streak
    new_streak, status, user_message = calculate_streak(
        user_habit.last_completed_at,
        now,
        user_habit.current_streak
    )
    
    # 6. Update user_habit
    user_habit.current_streak = new_streak
    user_habit.longest_streak = max(user_habit.longest_streak, new_streak)
    if user_habit.total_completions is None:
        user_habit.total_completions = 0
    user_habit.total_completions += 1
    user_habit.last_completed_at = now
    
    # CALCULATE NEXT AVAILABLE (Start of Next Interval)
    user_habit.next_available_checkin_at = get_next_interval_start(now)
    
    # 7. Create/update checkin record
    if config.STREAK_MODE == config.StreakMode.DAILY:
        log_date = now.date()
    else:
        log_date = now.date()
    
    checkin = db.query(Checkin).filter(
        Checkin.user_habit_id == user_habit.id,
        Checkin.log_date == log_date
    ).first()
    
    if not checkin:
        checkin = Checkin(
            user_habit_id=user_habit.id,
            log_date=log_date,
            is_completed=True
        )
        db.add(checkin)
    else:
        checkin.is_completed = True
    
    db.commit()
    db.refresh(user_habit)
    
    # Capture values for result BEFORE risky achievement evaluation
    # This prevents PendingRollbackError if achievements fail
    res_habit_id = habit_id
    res_current_streak = new_streak
    res_longest_streak = user_habit.longest_streak
    res_total_completions = user_habit.total_completions
    res_lock_until = user_habit.next_available_checkin_at
    res_status = status
    res_user_message = user_message
    
    # 8. Evaluate achievements (Safely)
    new_achievements = []
    try:
        new_achievements = await evaluate_achievements(
            db,
            user_id,
            habit_id,
            new_streak,
            user_habit.total_completions
        )
    except Exception as e:
        print(f"Achievement evaluation failed (non-blocking): {e}")
        # Rollback the failed sub-transaction to clean session state
        try:
            db.rollback() 
        except:
            pass
    
    # 9. Return result
    return StreakResult(
        habit_id=res_habit_id,
        current_streak=res_current_streak,
        longest_streak=res_longest_streak,
        total_completions=res_total_completions,
        lock_until=res_lock_until,
        status=res_status,
        user_message=res_user_message,
        new_achievements=new_achievements
    )


async def undo_checkin(
    db: Session,
    user_id: int,
    habit_id: int
) -> StreakResult:
    """
    Undo a check-in for the current interval.
    Decrements streak, removes checkin record, and resets cooldown.
    """
    # 1. Load context
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise StreakError("USER_NOT_FOUND", "User not found")
        
    user_habit = db.query(UserHabit).filter(
        UserHabit.user_id == user_id,
        UserHabit.habit_id == habit_id
    ).first()
    
    if not user_habit:
        raise StreakError("HABIT_NOT_ASSIGNED", "Habit Not Found")

    now = get_user_now(user)
    
    # 2. Find Today's Checkin
    # Use logic matching process_checkin for log_date
    if config.STREAK_MODE == config.StreakMode.DAILY:
        log_date = now.date()
    else:
        log_date = now.date() # Test mode also uses date for Checkin constraints usually
        
    checkin = db.query(Checkin).filter(
        Checkin.user_habit_id == user_habit.id,
        Checkin.log_date == log_date
    ).first()
    
    if not checkin:
        # Nothing to undo for today
        # Just return current state
        return StreakResult(
            habit_id=habit_id,
            current_streak=user_habit.current_streak,
            longest_streak=user_habit.longest_streak,
            total_completions=user_habit.total_completions,
            lock_until=now, # No lock
            status="undo_nop",
            user_message="Nothing to undo for today.",
            new_achievements=[]
        )
        
    # 3. Perform Undo
    db.delete(checkin)
    
    # Revert counts (Safe decrement)
    if user_habit.total_completions > 0:
        user_habit.total_completions -= 1
        
    if user_habit.current_streak > 0:
        user_habit.current_streak -= 1
    
    # Reset Timer to allow immediate re-checkin
    user_habit.next_available_checkin_at = None
    
    # Revert last_completed_at
    # Critical for is_completed_in_current_interval to return False
    # We set it to essentially "Yesterday" or None if streak is 0
    if user_habit.current_streak == 0:
        user_habit.last_completed_at = None
    else:
        # Set to a safe past time (e.g. yesterday) so streak calc 
        # (Compare Now vs Last) sees Diff=1 or Diff=0 correctly?
        # If we set to yesterday: Now - Last = 1 (Consecutive).
        # Next checkin: Diff=1 -> Increment -> Back to original value. CORRECT.
        
        # Calculate "Yesterday"
        if config.STREAK_MODE == config.StreakMode.TEST:
             interval = config.STREAK_INTERVAL_SECONDS
             user_habit.last_completed_at = now - timedelta(seconds=interval * 1.5)
        else:
             user_habit.last_completed_at = now - timedelta(days=1)
             
    db.commit()
    db.refresh(user_habit)
    
    return StreakResult(
        habit_id=habit_id,
        current_streak=user_habit.current_streak,
        longest_streak=user_habit.longest_streak,
        total_completions=user_habit.total_completions,
        lock_until=now, # Unlocked
        status="undone",
        user_message="Check-in undone.",
        new_achievements=[]
    )
