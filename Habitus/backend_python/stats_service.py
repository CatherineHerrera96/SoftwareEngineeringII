from datetime import date, timedelta, timezone
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from .models import Checkin, UserHabit
from .schemas import WeeklySummary
from .utils_time import get_user_today, get_user_timezone

# Removed local definition of get_user_today


def get_week_bounds(week_start: date) -> Tuple[date, date]:
    """
    Returns the [week_start, week_end) 7-day interval.
    For now we assume week_start already comes normalized (e.g., Monday).
    """
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def compute_weekly_stats(db: Session, user_id: str, week_start: date) -> WeeklySummary:
    start, end = get_week_bounds(week_start)

    # All checkins for this user in the week
    q = (
        db.query(Checkin)
        .join(UserHabit)
        .filter(
            UserHabit.user_id == user_id,
            Checkin.log_date >= start,
            Checkin.log_date < end,
        )
    )
    checkins = q.all()
    total = len(checkins)
    completed = sum(1 for checkin in checkins if checkin.is_completed)

    completion_rate = 0.0
    if total > 0:
        completion_rate = round((completed / total) * 100.0, 2)

    # Simple global streak: consecutive days with at least one completed checkin,
    # counting backwards from the last checkin date.
    streak = 0
    if completed > 0:
        days_map = {}
        for c in checkins:
            if c.is_completed:
                days_map[c.log_date] = True

        if days_map:
            current_day = max(days_map.keys())
            while days_map.get(current_day, False):
                streak += 1
                current_day = current_day - timedelta(days=1)


    return WeeklySummary(
        user_id=str(user_id),
        week_start=start,
        completion_rate=completion_rate,
        streak_global=streak,
        checkins_total=total,
        checkins_completed= completed,
    )


def calculate_global_stats(db: Session, user_id: int) -> dict:
    """
    Calculate global stats including:
    - Weekly completion rate (fixed Sun-Sat window)
    - Total streak days
    - 7-Day Trend (fixed Sun-Sat window) with Status (completed/lost/cold/future)
    """
    from . import config
    from .models import User
    
    # 1. Fetch User for created_at
    user = db.query(User).filter(User.id == user_id).first()
    
    created_at_date = date.min
    if user and user.created_at:
        # created_at is likely Naive UTC in Postgres/SQLAlchemy
        # Localize it to User Timezone to determine the "User's First Day"
        dt_utc = user.created_at.replace(tzinfo=timezone.utc) if not user.created_at.tzinfo else user.created_at
        user_tz = get_user_timezone(user)
        created_at_date = dt_utc.astimezone(user_tz).date()

    today = get_user_today(user)
    
    # Determine Calendar Week Start (Sunday)
    # weekday(): Mon=0, Sun=6
    # If Today is Sun(6): Start is Today.
    # If Today is Mon(0): Start is Today-1.
    # Shift = (today.weekday() + 1) % 7
    shift = (today.weekday() + 1) % 7
    week_start = today - timedelta(days=shift)
    week_end = week_start + timedelta(days=6) # Saturday
    
    # Total Scheduled: Active Habits * 7
    active_habits_count = db.query(UserHabit).filter(
        UserHabit.user_id == user_id, 
        UserHabit.is_active == True
    ).count()
    
    # 2. Weekly Completion Rate (Sun-Sat)
    total_scheduled = active_habits_count * 7
    weekly_rate = 0
    checkins_count = 0
    
    if total_scheduled > 0:
        # Count only checkins within this specific week
        checkins_count = (
            db.query(Checkin)
            .join(UserHabit)
            .filter(
                UserHabit.user_id == user_id,
                UserHabit.is_active == True,
                Checkin.log_date >= week_start,
                Checkin.log_date <= week_end,
                Checkin.is_completed == True
            )
            .count()
        )
        weekly_rate = int((checkins_count / total_scheduled) * 100)
        
    if weekly_rate > 100: weekly_rate = 100

    # 3. Total Streak Days (Unchanged logic)
    streak = 0
    if config.STREAK_MODE == 'test':
        user_habits = db.query(UserHabit).filter(UserHabit.user_id == user_id).all()
        streak = max((h.current_streak for h in user_habits), default=0)
    else:
        # Standard Streak Logic
        dates = (
            db.query(Checkin.log_date)
            .join(UserHabit)
            .filter(UserHabit.user_id == user_id, Checkin.is_completed == True)
            .distinct()
            .order_by(Checkin.log_date.desc())
            .all()
        )
        distinct_dates = [d[0] for d in dates]
        if distinct_dates:
            last_date = distinct_dates[0]
            if last_date >= today - timedelta(days=1):
                streak = 1
                current_check = last_date
                for i in range(1, len(distinct_dates)):
                    prev = distinct_dates[i]
                    if prev == current_check - timedelta(days=1):
                        streak += 1
                        current_check = prev
                    else:
                        break

    # 4. Weekly Trend (Sun -> Sat) with Status Logic
    trend = []
    
    # Pre-fetch counts for range [week_start-1, week_end]
    # We need week_start-1 (Saturday prev week) to determine if Sunday was a "Lost Streak"
    fetch_start = week_start - timedelta(days=1)
    
    counts_map = {}
    if config.STREAK_MODE == 'test':
        # Dummy Data Generation for Test Mode
        # Generate patterns based on relative date
        for i in range(-1, 7): # -1 to 6
            d = week_start + timedelta(days=i)
            # Simple pattern: 1, 0, 1, 1, 0, 1, 1 (Mon-Sun based)
            # Use day of month to determine hit/miss deterministically
            vals = [3, 0, 4, 2, 0, 5, 1] 
            counts_map[d] = vals[d.day % 7] if d <= today else 0 
            # In test mode, we might want to simulate 'today' activity if d==today
    else:
        raw_counts = (
            db.query(Checkin.log_date, func.count(Checkin.id))
            .join(UserHabit)
            .filter(
                UserHabit.user_id == user_id,
                Checkin.log_date >= fetch_start,
                Checkin.log_date <= week_end,
                Checkin.is_completed == True
            )
            .group_by(Checkin.log_date)
            .all()
        )
        for d, c in raw_counts:
            counts_map[d] = c

    # Build Trend List
    for i in range(7):
        current_day = week_start + timedelta(days=i)
        dates_iso = current_day.isoformat()
        
        # Determine Status
        status = 'cold' # Default
        
        count = counts_map.get(current_day, 0)
        prev_count = counts_map.get(current_day - timedelta(days=1), 0)
        
        if current_day > today:
            status = 'future' # Gray
        elif current_day < created_at_date:
            status = 'pre_exist' # Gray
        elif count > 0:
            status = 'completed' # Green
        else:
            # Missed. Was it a Lost Streak?
            # Lost Streak = Missed Today (0) AND Active Yesterday (>0)
            if prev_count > 0:
                status = 'lost' # Red
            else:
                status = 'cold' # Gray/Cold (Consecutive miss)

        trend.append({
            "date": dates_iso,
            "count": count,
            "status": status
        })

    return {
        "weekly_completion_rate": weekly_rate,
        "total_streak_days": streak,
        "trend": trend
    }
