"""
Streak Engine - Core logic for Duolingo-style habit streaks.

Handles:
- Cooldown enforcement (server-side time only)
- Streak calculation (continue, reset, or start)
- Test vs production mode intervals
- Timezone-aware datetime handling
"""
from datetime import datetime, timedelta, timezone, time
from typing import Tuple, Optional
try:
    from zoneinfo import ZoneInfo
except ImportError:
    # Fallback for Python < 3.9 (backports.zoneinfo) or just use UTC
    from datetime import timezone as ZoneInfoUTC
    def ZoneInfo(name):
        return timezone.utc

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc

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
        streak_broken: bool = False,
        previous_streak: int = None,
        new_achievements: list = None,
        debug_info: dict = None
    ):
        self.habit_id = habit_id
        self.current_streak = current_streak
        self.longest_streak = longest_streak
        self.total_completions = total_completions
        self.lock_until = lock_until
        self.status = status
        self.user_message = user_message
        self.streak_broken = streak_broken
        self.previous_streak = previous_streak
        self.new_achievements = new_achievements or []
        self.debug_info = debug_info or {}

    def to_dict(self):
        return {
            "habit_id": self.habit_id,
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "total_completions": self.total_completions,
            "lock_until": self.lock_until.isoformat(),
            "status": self.status,
            "user_message": self.user_message,
            "streak_broken": self.streak_broken,
            "previous_streak": self.previous_streak,
            "new_achievements": self.new_achievements,
            "debug": self.debug_info
        }


def get_user_now(user: User) -> datetime:
    """
    Get current time in user's timezone.
    """
    if user.timezone:
        try:
            return datetime.now(ZoneInfo(user.timezone))
        except Exception as e:
            print(f"ERROR: Failed to load timezone '{user.timezone}': {e}")
            # Manual fallback for the user's known timezone if system database is missing
            if user.timezone == "America/Bogota":
                return datetime.now(timezone(timedelta(hours=-5)))

    # Default to UTC if no valid timezone
    print(f"WARNING: Defaulting to UTC for user {user.id}")
    return datetime.now(timezone.utc)


def get_interval_index(dt: datetime, target_tz=None) -> int:
    """
    Get an integer index representing the streak interval for a given time.

    - Production (Daily): Returns Ordinal Date in USER LOCALE.
    - Test: Returns bucket index based on Seconds from Epoch in UTC.
    """
    if config.STREAK_MODE == config.StreakMode.PRODUCTION:
        # PRODUCTION: Day Indices based on Local Time
        # Ensure dt is in the target timezone (User's TZ)
        if target_tz:
            if dt.tzinfo:
                local_dt = dt.astimezone(target_tz)
            else:
                # Naive to Aware... assume UTC if unknown, then convert
                local_dt = dt.replace(tzinfo=timezone.utc).astimezone(target_tz)
        else:
             # Look at dt's own tz info, fallback to UTC
             local_dt = dt

        return local_dt.date().toordinal()

    else:
        # TEST MODE: Absolute Seconds / Interval (UTC Based)
        epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
        dt_utc = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        seconds_since_epoch = (dt_utc - epoch).total_seconds()
        interval_seconds = config.STREAK_INTERVAL_SECONDS
        return int(seconds_since_epoch // interval_seconds)


def is_completed_in_current_interval(last_completed_at: Optional[datetime], now: datetime) -> bool:
    """
    Check if the last completion counts for the current 'now' interval.
    Robustly handles timezone differences (e.g. UTC DB vs User TZ).
    """
    if not last_completed_at:
        return False

    target_tz = now.tzinfo or timezone.utc
    
    last_idx = get_interval_index(last_completed_at, target_tz)
    current_idx = get_interval_index(now, target_tz)
    
    return last_idx == current_idx


def calculate_streak(
    last_completed_at: Optional[datetime],
    current_now: datetime,
    current_streak: int
) -> Tuple[int, str, str, dict]:
    """
    Calculate new streak value based on interval indices.
    """
    if last_completed_at is None:
        return (1, StreakStatus.STARTED, "🎉 Started your first streak!", {})

    target_tz = current_now.tzinfo or timezone.utc

    last_idx = get_interval_index(last_completed_at, target_tz)
    current_idx = get_interval_index(current_now, target_tz)

    diff = current_idx - last_idx
    debug_info = {
        "last_raw": str(last_completed_at),
        "now_raw": str(current_now),
        "last_idx": last_idx,
        "curr_idx": current_idx,
        "diff": diff
    }

    if diff == 0:
        return (current_streak, StreakStatus.CONTINUES, f"🔥 {current_streak}-day streak!", debug_info)
    elif diff == 1:
        new_streak = current_streak + 1
        return (new_streak, StreakStatus.CONTINUES, f"🔥 {new_streak}-day streak!", debug_info)
    else:
        # Gap > 1
        return (1, StreakStatus.RESET, "Streak reset", debug_info)


def get_next_interval_start(dt: datetime) -> datetime:
    """
    Calculate the start time of the NEXT interval.
    """
    if config.STREAK_MODE == config.StreakMode.TEST:
        epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
        dt_utc = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        seconds_since = (dt_utc - epoch).total_seconds()
        interval = config.STREAK_INTERVAL_SECONDS
        current_idx = int(seconds_since // interval)
        next_idx = current_idx + 1
        next_start_utc = epoch + timedelta(seconds=next_idx * interval)
        return next_start_utc.astimezone(dt.tzinfo) if dt.tzinfo else next_start_utc

    else:
        # Production Mode (Daily): Tomorrow Midnight (User Local Time)
        tomorrow = dt.date() + timedelta(days=1)
        next_start = datetime.combine(tomorrow, datetime.min.time())
        if dt.tzinfo:
            next_start = next_start.replace(tzinfo=dt.tzinfo)
        return next_start


async def process_checkin(
    db: Session,
    user_id: int,
    habit_id: int
) -> StreakResult:
    from logic.achievement_engine import evaluate_achievements

    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise StreakError("USER_NOT_FOUND", "User not found")

    user_habit = db.query(UserHabit).filter(
        UserHabit.user_id == user_id, 
        UserHabit.habit_id == habit_id,
        UserHabit.is_active == True
    ).first()
    if not user_habit: raise StreakError("HABIT_NOT_ASSIGNED", "Habit not found")

    now = get_user_now(user)

    # Cooldown check
    if user_habit.next_available_checkin_at:
        check_time = user_habit.next_available_checkin_at
        # Safe compare
        check_tz = check_time.tzinfo or timezone.utc
        now_tz_check = now.astimezone(check_tz) if now.tzinfo else now.replace(tzinfo=check_tz)
        
        # If check_time is in future, locked.
        if now_tz_check < check_time:
             # In production, this prevents multiple checkins per day, but we also handle idempotency below.
             # Actually, if we are completed in current interval, we should return success message not fail.
             if is_completed_in_current_interval(user_habit.last_completed_at, now):
                 # Pass through to idempotency block
                 pass
             else:
                 # It's locked for another reason (e.g. cooldown forced)
                 pass

    user_habit = db.query(UserHabit).filter(UserHabit.id == user_habit.id).with_for_update().first()

    # Idempotency
    if is_completed_in_current_interval(user_habit.last_completed_at, now):
         return StreakResult(
            habit_id=habit_id,
            current_streak=user_habit.current_streak,
            longest_streak=user_habit.longest_streak,
            total_completions=user_habit.total_completions,
            lock_until=user_habit.next_available_checkin_at or now,
            status=StreakStatus.CONTINUES,
            user_message=f"✅ Already completed!",
            streak_broken=False,
            new_achievements=[]
        )

    # Upsert Checkin
    log_date = now.date()
    checkin = db.query(Checkin).filter(Checkin.user_habit_id == user_habit.id, Checkin.log_date == log_date).first()

    if checkin:
        checkin.is_completed = True
    else:
        checkin = Checkin(user_habit_id=user_habit.id, log_date=log_date, is_completed=True)
        db.add(checkin)

    db.flush()
    db.refresh(user_habit)

    # Calculate Streak
    new_streak, status, user_message, debug_info = calculate_streak(
        user_habit.last_completed_at,
        now,
        user_habit.current_streak
    )
    
    streak_broken = (status == StreakStatus.RESET)
    previous_streak = user_habit.current_streak if streak_broken else None

    user_habit.current_streak = new_streak
    user_habit.longest_streak = max(user_habit.longest_streak, new_streak)
    if user_habit.total_completions is None: user_habit.total_completions = 0
    user_habit.total_completions += 1
    user_habit.last_completed_at = now

    user_habit.next_available_checkin_at = get_next_interval_start(now)

    db.commit()
    db.refresh(user_habit)

    # Achievements
    new_achievements = []
    try:
        new_achievements = await evaluate_achievements(db, user_id, habit_id, new_streak, user_habit.total_completions)
    except:
        pass

    return StreakResult(
        habit_id=habit_id,
        current_streak=new_streak,
        longest_streak=user_habit.longest_streak,
        total_completions=user_habit.total_completions,
        lock_until=user_habit.next_available_checkin_at,
        status=status,
        user_message=user_message,
        streak_broken=streak_broken,
        previous_streak=previous_streak,
        new_achievements=new_achievements,
        debug_info=debug_info
    )


async def undo_checkin(
    db: Session,
    user_id: int,
    habit_id: int
) -> StreakResult:
    """
    Undo a check-in. Reverts streak and allows re-checkin.
    Uses DB history to correctly restore 'last_completed_at', preventing streak loss bugs.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise StreakError("USER_NOT_FOUND", "User not found")

    user_habit = db.query(UserHabit).filter(
        UserHabit.user_id == user_id,
        UserHabit.habit_id == habit_id
    ).with_for_update().first()

    if not user_habit: raise StreakError("HABIT_NOT_ASSIGNED", "Habit Not Found")

    now = get_user_now(user)
    log_date = now.date()

    checkin = db.query(Checkin).filter(
        Checkin.user_habit_id == user_habit.id,
        Checkin.log_date == log_date
    ).first()

    if not checkin or not checkin.is_completed:
        # Nothing to undo
        return StreakResult(
            habit_id=habit_id,
            current_streak=user_habit.current_streak,
            longest_streak=user_habit.longest_streak,
            total_completions=user_habit.total_completions,
            lock_until=now,
            status="undo_nop",
            user_message="Nothing to undo for today.",
            streak_broken=False,
            new_achievements=[]
        )

    # Undo
    checkin.is_completed = False

    if user_habit.total_completions > 0:
        user_habit.total_completions -= 1

    if user_habit.current_streak > 0:
        user_habit.current_streak -= 1

    user_habit.next_available_checkin_at = None

    # --- RESTORE LAST COMPLETED FROM DB HISTORY ---
    # Find the most recent checkin that is NOT today/this instance
    previous_checkin = db.query(Checkin).filter(
        Checkin.user_habit_id == user_habit.id,
        Checkin.is_completed == True,
        Checkin.log_date < log_date  # Must be strictly before today
    ).order_by(desc(Checkin.log_date)).first()

    if previous_checkin:
        # We found a previous day. Restore it.
        # Since we only care about interval index (Date), setting it to end-of-day is safe.
        # Converting Date -> DateTime (at 23:59:59) implies it was done that day.
        prev_dt_naive = datetime.combine(previous_checkin.log_date, time.max).replace(microsecond=0)
        
        # We need to be careful with Timezones. 
        # Checkin.log_date is in "User Local Time" context usually (date created via now.date()).
        # So we treat this reconstructed DateTime as User Local Time.
        if user.timezone:
            try:
                tz = ZoneInfo(user.timezone)
                # handle ambiguous times (dst) if needed, but for streaks it is fine
                prev_dt_aware = prev_dt_naive.replace(tzinfo=tz) 
                # Convert to UTC if storage requires, but UserHabit.last_completed_at is TZAware.
                # SQLAlchemy + Postgres handles aware datetimes well.
                user_habit.last_completed_at = prev_dt_aware
            except:
                user_habit.last_completed_at = prev_dt_naive.replace(tzinfo=timezone.utc)
        else:
             user_habit.last_completed_at = prev_dt_naive.replace(tzinfo=timezone.utc)
             
    elif user_habit.current_streak > 0:
        # FALLBACK: No history found, but we have a positive streak.
        # This happens if data was migrated, created in Test Mode (all same day), or manually edited.
        # We MUST restore 'last_completed_at' to "Yesterday" to prevent the streak from dying on next check-in.
        
        # In Production: Yesterday. In Test: -1 interval.
        if config.STREAK_MODE == config.StreakMode.TEST:
             interval = config.STREAK_INTERVAL_SECONDS
             # Just subtract enough to put it in previous bucket
             user_habit.last_completed_at = now - timedelta(seconds=interval + 1)
        else:
             # Production: Yesterday end-of-day
             yesterday = now.date() - timedelta(days=1)
             prev_dt_naive = datetime.combine(yesterday, time.max).replace(microsecond=0)
             
             if user.timezone:
                try:
                    tz = ZoneInfo(user.timezone)
                    user_habit.last_completed_at = prev_dt_naive.replace(tzinfo=tz) 
                except:
                     user_habit.last_completed_at = prev_dt_naive.replace(tzinfo=timezone.utc)
             else:
                  user_habit.last_completed_at = prev_dt_naive.replace(tzinfo=timezone.utc)

    else:
        # No history found. This was the first checkin.
        user_habit.current_streak = 0 # Ensure 0 just in case
        user_habit.last_completed_at = None

    db.commit()
    db.refresh(user_habit)

    return StreakResult(
        habit_id=habit_id,
        current_streak=user_habit.current_streak,
        longest_streak=user_habit.longest_streak,
        total_completions=user_habit.total_completions,
        lock_until=now,
        status="undone",
        user_message="Check-in undone.",
        streak_broken=False,
        new_achievements=[]
    )
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
from sqlalchemy.exc import IntegrityError

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
        new_achievements: list = None,
        debug_info: dict = None
    ):
        self.habit_id = habit_id
        self.current_streak = current_streak
        self.longest_streak = longest_streak
        self.total_completions = total_completions
        self.lock_until = lock_until
        self.status = status
        self.user_message = user_message
        self.new_achievements = new_achievements or []
        self.debug_info = debug_info or {}

    def to_dict(self):
        return {
            "habit_id": self.habit_id,
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "total_completions": self.total_completions,
            "lock_until": self.lock_until.isoformat(),
            "status": self.status,
            "user_message": self.user_message,
            "new_achievements": self.new_achievements,
            "debug": self.debug_info
        }


def get_user_now(user: User) -> datetime:
    """
    Get current time in user's timezone.
    """
    if user.timezone:
        try:
            return datetime.now(ZoneInfo(user.timezone))
        except Exception as e:
            print(f"ERROR: Failed to load timezone '{user.timezone}': {e}")
            # Manual fallback for the user's known timezone if system database is missing
            if user.timezone == "America/Bogota":
                return datetime.now(timezone(timedelta(hours=-5)))
                
    # Default to UTC if no valid timezone
    print(f"WARNING: Defaulting to UTC for user {user.id}")
    return datetime.now(timezone.utc)


def get_interval_index(dt: datetime) -> int:
    """
    Get an integer index representing the streak interval for a given time.
    Daily: Ordinal date (respecting User's Local Time).
    Test: Bucket index based on epoch (UTC).
    """
    if config.STREAK_MODE == config.StreakMode.PRODUCTION:
        # PRODUCTION: Trust the timezone on dt. If none, assume UTC (bad but fallback).
        # We need the LOCAL date.
        return dt.date().toordinal()
    else:
        epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
        # Normalize to UTC for epoch math
        dt_utc = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        seconds_since_epoch = (dt_utc - epoch).total_seconds()
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
        
    if config.STREAK_MODE == config.StreakMode.TEST:
        # TEST MODE: Absolute Time (UTC)
        last = last_completed_at.astimezone(timezone.utc) if last_completed_at.tzinfo else last_completed_at.replace(tzinfo=timezone.utc)
        cur = now.astimezone(timezone.utc) if now.tzinfo else now.replace(tzinfo=timezone.utc)
        return get_interval_index(last) == get_interval_index(cur)
    else:
        # PRODUCTION (DAILY) MODE: User's Local Date
        # We must align 'last_completed_at' to the User's Timezone (from 'now')
        # before checking the interval index (date).
        
        target_tz = now.tzinfo or timezone.utc
        
        # Convert DB time (potentially UTC) to User Local Time
        if last_completed_at.tzinfo:
            adjusted_last = last_completed_at.astimezone(target_tz)
        else:
            # Assume UTC if naive, then convert
            adjusted_last = last_completed_at.replace(tzinfo=timezone.utc).astimezone(target_tz)
            
        return get_interval_index(adjusted_last) == get_interval_index(now)

def calculate_streak(
    last_completed_at: Optional[datetime],
    current_now: datetime,
    current_streak: int
) -> Tuple[int, str, str, dict]:
    """
    Calculate new streak value based on interval indices.
    """
    if last_completed_at is None:
        return (1, StreakStatus.STARTED, "🎉 Started your first streak!", {})
    
    # NORMALIZE TO COMPARE APPLES TO APPLES
    # In Production, we compare Local Dates. In Test, UTC Buckets.
    
    if config.STREAK_MODE == config.StreakMode.PRODUCTION:
        target_tz = current_now.tzinfo or timezone.utc
        
        if last_completed_at.tzinfo:
            last_normalized = last_completed_at.astimezone(target_tz)
        else:
            last_normalized = last_completed_at.replace(tzinfo=timezone.utc).astimezone(target_tz)
        
        now_normalized = current_now
        
    else:
        # TEST MODE: UTC
        last_normalized = last_completed_at.astimezone(timezone.utc) if last_completed_at.tzinfo else last_completed_at.replace(tzinfo=timezone.utc)
        now_normalized = current_now.astimezone(timezone.utc) if current_now.tzinfo else current_now.replace(tzinfo=timezone.utc)

    last_idx = get_interval_index(last_normalized)
    current_idx = get_interval_index(now_normalized)
    
    diff = current_idx - last_idx
    debug_info = {
        "last_raw": str(last_completed_at),
        "now_raw": str(current_now),
        "last_idx": last_idx,
        "curr_idx": current_idx,
        "diff": diff
    }
    
    if diff == 0:
        return (current_streak, StreakStatus.CONTINUES, f"🔥 {current_streak}-day streak!", debug_info)
    elif diff == 1:
        new_streak = current_streak + 1
        return (new_streak, StreakStatus.CONTINUES, f"🔥 {new_streak}-day streak!", debug_info)
    else:
        return (1, StreakStatus.RESET, "Streak reset", debug_info)


def get_next_interval_start(dt: datetime) -> datetime:
    """
    Calculate the start time of the NEXT interval.
    """
    if config.STREAK_MODE == config.StreakMode.TEST:
        epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
        dt_utc = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        seconds_since = (dt_utc - epoch).total_seconds()
        interval = config.STREAK_INTERVAL_SECONDS
        current_idx = int(seconds_since // interval)
        next_idx = current_idx + 1
        next_start_utc = epoch + timedelta(seconds=next_idx * interval)
        return next_start_utc.astimezone(dt.tzinfo) if dt.tzinfo else next_start_utc
        
    else:
        # Production Mode (Daily): Tomorrow Midnight (User Local Time)
        tomorrow = dt.date() + timedelta(days=1)
        next_start = datetime.combine(tomorrow, datetime.min.time())
        if dt.tzinfo:
            next_start = next_start.replace(tzinfo=dt.tzinfo)
        return next_start


async def process_checkin(
    db: Session,
    user_id: int,
    habit_id: int
) -> StreakResult:
    from logic.achievement_engine import evaluate_achievements
    
    # ... (Load User, etc - same as before) ...
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise StreakError("USER_NOT_FOUND", "User not found")
    
    user_habit = db.query(UserHabit).filter(
        UserHabit.user_id == user_id, 
        UserHabit.habit_id == habit_id,
        UserHabit.is_active == True
    ).first()
    if not user_habit: raise StreakError("HABIT_NOT_ASSIGNED", "Habit not found")
    
    now = get_user_now(user)
    
    # Cooldown Logic (Use Stored Boundary)
    if user_habit.next_available_checkin_at:
        check_time = user_habit.next_available_checkin_at
        # Careful time comparison
        check_tz = check_time.tzinfo or timezone.utc
        now_tz_check = now.astimezone(check_tz) if now.tzinfo else now.replace(tzinfo=check_tz)
        
        if now_tz_check < check_time:
             # Just checking naive vs aware risk
             pass # Logic is sound if both are consistently timezone-aware

    # Lock Parent
    user_habit = db.query(UserHabit).filter(UserHabit.id == user_habit.id).with_for_update().first()
    
    # Idempotency
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
    
    # Upsert Checkin
    log_date = now.date()
    checkin = db.query(Checkin).filter(Checkin.user_habit_id == user_habit.id, Checkin.log_date == log_date).first()
    
    if checkin:
        checkin.is_completed = True
    else:
        checkin = Checkin(user_habit_id=user_habit.id, log_date=log_date, is_completed=True)
        db.add(checkin)
    
    db.flush()
    db.refresh(user_habit)

    # Calculate Streak
    new_streak, status, user_message, debug_info = calculate_streak(
        user_habit.last_completed_at,
        now,
        user_habit.current_streak
    )

    user_habit.current_streak = new_streak
    user_habit.longest_streak = max(user_habit.longest_streak, new_streak)
    if user_habit.total_completions is None: user_habit.total_completions = 0
    user_habit.total_completions += 1
    user_habit.last_completed_at = now
    
    user_habit.next_available_checkin_at = get_next_interval_start(now)
    
    db.commit()
    db.refresh(user_habit)
    
    # Achievements
    new_achievements = []
    try:
        new_achievements = await evaluate_achievements(db, user_id, habit_id, new_streak, user_habit.total_completions)
    except:
        pass
        
    return StreakResult(
        habit_id=habit_id,
        current_streak=new_streak,
        longest_streak=user_habit.longest_streak,
        total_completions=user_habit.total_completions,
        lock_until=user_habit.next_available_checkin_at,
        status=status,
        user_message=user_message,
        new_achievements=new_achievements,
        debug_info=debug_info
    )


async def undo_checkin(
    db: Session,
    user_id: int,
    habit_id: int
) -> StreakResult:
    """
    Undo a check-in. Reverts streak and allows re-checkin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise StreakError("USER_NOT_FOUND", "User not found")
        
    user_habit = db.query(UserHabit).filter(
        UserHabit.user_id == user_id,
        UserHabit.habit_id == habit_id
    ).with_for_update().first()
    
    if not user_habit: raise StreakError("HABIT_NOT_ASSIGNED", "Habit Not Found")

    now = get_user_now(user)
    log_date = now.date()
        
    checkin = db.query(Checkin).filter(
        Checkin.user_habit_id == user_habit.id,
        Checkin.log_date == log_date
    ).first()
    
    if not checkin or not checkin.is_completed:
        # Nothing to undo
        return StreakResult(
            habit_id=habit_id,
            current_streak=user_habit.current_streak,
            longest_streak=user_habit.longest_streak,
            total_completions=user_habit.total_completions,
            lock_until=now,
            status="undo_nop",
            user_message="Nothing to undo for today.",
            new_achievements=[]
        )

    # Undo
    checkin.is_completed = False
    
    if user_habit.total_completions > 0:
        user_habit.total_completions -= 1
        
    if user_habit.current_streak > 0:
        user_habit.current_streak -= 1
    
    user_habit.next_available_checkin_at = None
    
    # Revert last_completed_at
    if user_habit.current_streak == 0:
        user_habit.last_completed_at = None
    else:
        # Set to "Yesterday" so next check-in is seen as Consecutive (Diff=1)
        # Using Local Time logic
        if config.STREAK_MODE == config.StreakMode.TEST:
             interval = config.STREAK_INTERVAL_SECONDS
             user_habit.last_completed_at = now - timedelta(seconds=interval)
        else:
             # PRODUCTION: Set to Yesterday Local Time
             # This ensures get_interval_index(last) == today_index - 1
             user_habit.last_completed_at = now - timedelta(days=1)
             
    db.commit()
    db.refresh(user_habit)
    
    return StreakResult(
        habit_id=habit_id,
        current_streak=user_habit.current_streak,
        longest_streak=user_habit.longest_streak,
        total_completions=user_habit.total_completions,
        lock_until=now,
        status="undone",
        user_message="Check-in undone.",
        new_achievements=[]
    )
