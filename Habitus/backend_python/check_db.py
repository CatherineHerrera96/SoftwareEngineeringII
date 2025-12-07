"""
Diagnostic script to check database schema state.
Run: python check_db.py
"""
from sqlalchemy import text, inspect
from db import engine

def check_db():
    print("Checking database schema...")
    inspector = inspect(engine)
    
    # Check user_habits columns
    if "user_habits" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("user_habits")]
        print(f"\n[user_habits] columns: {columns}")
        
        missing = []
        for col in ["total_completions", "last_completed_at", "current_streak"]:
            if col not in columns:
                missing.append(col)
        
        if missing:
            print(f"❌ MISSING columns in user_habits: {missing}")
        else:
            print("✅ user_habits schema looks correct.")
    else:
        print("❌ Table 'user_habits' does not exist!")

    # Check achievements columns
    if "achievements" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("achievements")]
        print(f"\n[achievements] columns: {columns}")
        
        missing = []
        for col in ["code", "threshold_type", "threshold_value"]:
            if col not in columns:
                missing.append(col)
        
        if missing:
            print(f"❌ MISSING columns in achievements: {missing}")
        else:
            print("✅ achievements schema looks correct.")
    else:
        print("❌ Table 'achievements' does not exist!")

if __name__ == "__main__":
    check_db()
