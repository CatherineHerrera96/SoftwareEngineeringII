"""
Configuration for streak and achievements system.

Supports two modes:
- DAILY (production): 24-hour streak intervals
- TEST: Configurable short intervals (default 60s) for rapid testing
"""
import os
from datetime import timedelta
from enum import Enum


class StreakMode(str, Enum):
    PRODUCTION = "production"
    TEST = "test"


# Environment variables
STREAK_MODE = os.getenv("STREAK_MODE", "production").lower()
STREAK_INTERVAL_SECONDS = int(os.getenv("STREAK_INTERVAL_SECONDS", "7"))


def get_streak_interval() -> timedelta:
    """
    Get the streak interval based on current mode.
    
    Returns:
        timedelta: 24 hours for daily mode, configurable seconds for test mode
    """
    if STREAK_MODE == StreakMode.TEST:
        return timedelta(seconds=STREAK_INTERVAL_SECONDS)
    return timedelta(days=1)


def get_interval_name() -> str:
    """Get human-readable interval name for display."""
    if STREAK_MODE == StreakMode.TEST:
        return f"{STREAK_INTERVAL_SECONDS} seconds"
    return "daily until local midnight"


# Configuration info for logging
print(f"[Streak Config] Mode: {STREAK_MODE}")
print(f"[Streak Config] Interval: {get_interval_name()}")
