"""
Debug script to manually trigger a checkin and print the full error.
Usage: python debug_checkin.py <user_id>
"""
import sys
import asyncio
from sqlalchemy.orm import Session
from db import SessionLocal
from logic.streak_engine import process_checkin
from models import UserHabit

async def debug(user_id):
    db: Session = SessionLocal()
    try:
        # Find a user habit for this user
        uh = db.query(UserHabit).filter(UserHabit.user_id == user_id, UserHabit.is_active == True).first()
        if not uh:
            print(f"No active habits found for user {user_id}")
            return

        print(f"Attempting check-in for User {user_id}, Habit {uh.habit_id} (UH ID: {uh.id})")
        print(f"Current Streak: {uh.current_streak}")
        print(f"Last Completed: {uh.last_completed_at}")

        result = await process_checkin(db, user_id, uh.habit_id)
        
        print("\n✅ SUCCESS!")
        print(f"New Streak: {result.current_streak}")
        print(f"Message: {result.user_message}")

    except Exception as e:
        print("\n❌ FAILED WITH ERROR:")
        print("-" * 60)
        import traceback
        traceback.print_exc()
        print("-" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_checkin.py <user_id>")
        # Default to user 1 if not provided for convenience
        asyncio.run(debug(1))
    else:
        asyncio.run(debug(int(sys.argv[1])))
