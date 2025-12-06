import os
import sys

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from db import SessionLocal, engine
from models import Habit, UserHabit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEASONAL_CATEGORIES = [
    'Christmas',
    'Halloween',
    'Summer', 
    'Valentine', 
    'April Fools', 
    'Spring',
    'New Year',
    'Seasonal'
]

def cleanup_seasonal_habits():
    db = SessionLocal()
    try:
        logger.info("Starting seasonal habit cleanup...")
        
        # detailed criteria: is_custom=False AND category in SEASONAL_CATEGORIES
        query = db.query(Habit).filter(
            Habit.is_custom == False,
            Habit.category.in_(SEASONAL_CATEGORIES)
        )
        
        habits_to_delete = query.all()
        count = len(habits_to_delete)
        
        if count == 0:
            logger.info("No obsolete seasonal habits found.")
            return

        logger.info(f"Found {count} seasonal habits to delete.")
        
        for habit in habits_to_delete:
            logger.info(f"Deleting habit: {habit.name} (ID: {habit.id}, Category: {habit.category})")
            
            # Manually delete related user_habits first (if cascade isn't set, though it likely is)
            db.query(UserHabit).filter(UserHabit.habit_id == habit.id).delete()
            
            # Delete the habit
            db.delete(habit)
            
        db.commit()
        logger.info("Cleanup complete. Obsolete seasonal habits removed.")
        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_seasonal_habits()
