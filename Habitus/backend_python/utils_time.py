
from datetime import date, datetime, timezone
from typing import Optional
import pytz
import os

# Default fallback if user has no timezone. 
# Defaults to UTC, but can be overridden by env (e.g., for specific deployments)
DEFAULT_TIMEZONE = os.getenv("DEFAULT_TIMEZONE", "UTC") 

def get_user_timezone(user) -> pytz.timezone:
    """
    Helper to resolve pytz timezone object from user profile.
    Returns UTC if invalid or missing.
    """
    tz_name = getattr(user, "timezone", None)
    
    if tz_name:
        try:
            return pytz.timezone(tz_name)
        except pytz.UnknownTimeZoneError:
            pass
            
    # Check if we want to fallback to a global default before UTC
    if DEFAULT_TIMEZONE != "UTC":
        try:
            return pytz.timezone(DEFAULT_TIMEZONE)
        except:
            pass

    return pytz.utc

def get_user_now(user) -> datetime:
    """
    Get current aware datetime in user's timezone.
    """
    tz = get_user_timezone(user)
    return datetime.now(tz)

def get_user_today(user) -> date:
    """
    Get current date in user's timezone.
    """
    return get_user_now(user).date()
