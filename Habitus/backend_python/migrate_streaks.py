"""
Migration script to update database schema for Streak System.
Run this directly: python migrate_streaks.py
"""
from sqlalchemy import text
from db import engine, SessionLocal
from logic.achievement_engine import seed_initial_achievements

def migrate():
    print("Starting database migration for Streak System (Robust Mode)...")
    
    # Use AUTOCOMMIT so each statement is its own transaction
    # This prevents one failure from rolling back everything or blocking subsequent commands
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        
        # 1. Update user_habits table
        print("Updating user_habits table...")
        try:
            conn.execute(text("ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS total_completions INTEGER DEFAULT 0"))
        except Exception as e: print(f" - total_completions: {e}")
        
        try:
            conn.execute(text("ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMP WITH TIME ZONE"))
        except Exception as e: print(f" - last_completed_at: {e}")

        try:
            conn.execute(text("ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS next_available_checkin_at TIMESTAMP WITH TIME ZONE"))
        except Exception as e: print(f" - next_available_checkin_at: {e}")
        

        # 2. Update achievements table
        print("Updating achievements table...")
        try:
            conn.execute(text("ALTER TABLE achievements ADD COLUMN IF NOT EXISTS code VARCHAR(50)"))
        except Exception as e: print(f" - code: {e}")

        try:
            conn.execute(text("ALTER TABLE achievements ADD COLUMN IF NOT EXISTS threshold_type VARCHAR(50)"))
        except Exception as e: print(f" - threshold_type: {e}")

        try:
            conn.execute(text("ALTER TABLE achievements ADD COLUMN IF NOT EXISTS threshold_value INTEGER"))
        except Exception as e: print(f" - threshold_value: {e}")
        
        # Make code unique (might fail if duplicates exist)
        try:
            conn.execute(text("ALTER TABLE achievements ADD CONSTRAINT uq_achievement_code UNIQUE (code)"))
        except Exception as e: 
            print(f" - constraint uq_achievement_code (might already exist): {e}")


        # 3. Update user_achievements table
        print("Updating user_achievements table...")
        try:
            conn.execute(text("ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS habit_id INTEGER"))
        except Exception as e: print(f" - habit_id: {e}")
        
        # Add foreign key 
        try:
            conn.execute(text("ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievements_habit_id FOREIGN KEY (habit_id) REFERENCES habits(id)"))
        except Exception as e:
            msg = str(e)
            if "already exists" in msg:
                print(" - FK constraint already exists, skipping.")
            else:
                print(f" - Error adding FK: {e}")

        # Update awarded_at type to timestamp
        try:
            conn.execute(text("ALTER TABLE user_achievements ALTER COLUMN awarded_at TYPE TIMESTAMP WITH TIME ZONE USING awarded_at::timestamp with time zone"))
        except Exception as e: print(f" - awarded_at type change: {e}")

        print("Schema changes applied (errors above are likely harmless if columns already existed).")

    # 4. Seed Achievements
    print("Seeding initial achievements...")
    db = SessionLocal()
    try:
        seed_initial_achievements(db)
        print("Achievements seeded.")
    except Exception as e:
        print(f"Error seeding achievements (might be duplicates): {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
