from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
import os

# Mock Config
class Config:
    class StreakMode:
        TEST = "test"
        DAILY = "daily"
    STREAK_MODE = "test"
    STREAK_INTERVAL_SECONDS = 60

# --- MOCK STREAK ENGINE HELPERS ---

def get_interval_index(dt: datetime) -> int:
    # Simplified mock
    epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
    seconds_since_epoch = (dt - epoch).total_seconds()
    return int(seconds_since_epoch // Config.STREAK_INTERVAL_SECONDS)

def calculate_streak(
    last_completed_at: Optional[datetime],
    current_now: datetime,
    current_streak: int
) -> Tuple[int, str, str]:
    print(f"DEBUG: calculate_streak called with last={last_completed_at}, now={current_now}")
    
    if last_completed_at is None:
        return (1, "start", "start")
    
    # Normalize
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
    print(f"DEBUG: diff={diff}")
    
    if diff == 0: return (current_streak, "cont", "msg")
    elif diff == 1: return (current_streak + 1, "cont", "msg")
    else: return (1, "reset", "msg")

def get_next_interval_start(dt: datetime) -> datetime:
    epoch = datetime(2020, 1, 1, tzinfo=timezone.utc)
    dt_utc = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    
    seconds_since = (dt_utc - epoch).total_seconds()
    interval = Config.STREAK_INTERVAL_SECONDS
    
    current_idx = int(seconds_since // interval)
    next_idx = current_idx + 1
    
    next_start_utc = epoch + timedelta(seconds=next_idx * interval)
    return next_start_utc.astimezone(dt.tzinfo) if dt.tzinfo else next_start_utc

# --- TEST ---
try:
    print("Testing calculate_streak...")
    now = datetime.now(timezone.utc)
    last = now - timedelta(seconds=65) # Diff should be 1
    
    res = calculate_streak(last, now, 1)
    print(f"Result: {res}")
    
    print("\nTesting get_next_interval_start...")
    next_start = get_next_interval_start(now)
    print(f"Next start: {next_start}")
    
    print("\nTesting with None last...")
    res_none = calculate_streak(None, now, 0)
    print(f"Result None: {res_none}")

    print("\nSUCCESS")
except Exception as e:
    print(f"\nCRITICAL FAIL: {e}")
    import traceback
    traceback.print_exc()
