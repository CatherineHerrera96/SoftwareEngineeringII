import os
import sys
from datetime import datetime
import traceback

# Ensure we can import from current directory
sys.path.append(os.getcwd())

from db import SessionLocal
from models import User, UserHabit
from logic.streak_engine import process_checkin
import asyncio

async def diagnose():
    # 1. Get IDs first to avoid session mixup
    db_setup = SessionLocal()
    try:
        print("Finding all active user habits...")
        user_habits = db_setup.query(UserHabit).filter(UserHabit.is_active == True).all()
        # Store tuples (user_id, habit_id)
        targets = [(uh.user_id, uh.habit_id) for uh in user_habits]
    except Exception as e:
        print(f"Setup failed: {e}")
        return
    finally:
        db_setup.close()

    if not targets:
        print("No active user habits found.")
        return

    print(f"Found {len(targets)} habits. Starting robust stress test...")
    
    for uid, hid in targets:
        print(f"\n--- Testing User {uid} Habit {hid} ---")
        
        # New Session for each attempt
        db = SessionLocal()
        try:
            # 1. First Checkin
            print("1. Attempting Check-in...")
            try:
                result = await process_checkin(db, uid, hid)
                print(f"   Success! Status: {result.status}")
            except Exception as e:
                 print(f"   !!! CHECK-IN 1 FAILED: {e}")
                 traceback.print_exc()
                 db.rollback() # Ensure cleanup even if we close
            
            # 2. Immediate Second Checkin (Fresh Session ideally, but reuse is realistic effectively)
            # Actually, let's reuse to simulate request flow? No, requests are separate.
            # But here we want to test db state.
            
            print("2. Attempting Immediate Re-check (Stress Test)...")
            try:
                # process_checkin does its own queries, so passing db is fine.
                result2 = await process_checkin(db, uid, hid)
                print(f"   Re-check Result: {result2.status}")
                print(f"   Is Completed in Interval? {result2.user_message}")
            except Exception as e:
                # Check if it's StreakError
                if "StreakError" in str(type(e)) or "COOLDOWN" in str(e):
                        print(f"   Caught Expected Cooldown: {e}")
                else:
                        print(f"   !!! UNEXPECTED ERROR IN RE-CHECK: {e}")
                        traceback.print_exc()

        except Exception as e:
             print(f"CRITICAL LOOP ERROR: {e}")
        finally:
            db.close()
        
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(diagnose())
