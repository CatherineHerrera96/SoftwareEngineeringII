"""
Diagnostic script to check database schema state and configuration.
Run: python check_db.py
"""
import os
import sys
from sqlalchemy import text, inspect, create_engine
from dotenv import load_dotenv

def check_db():
    print("="*40)
    print("Habitus Database Diagnostic Tool")
    print("="*40)

    # 1. Check for .env file
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        print(f"✅ Found .env file at: {env_path}")
        load_dotenv(env_path)
    else:
        print(f"⚠️  No .env file found at: {env_path}")
        print("   Using default/system environment variables.")

    # 2. Check DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL is not set!")
        print("   Please create a .env file (copy .env.example) or set the environment variable.")
        sys.exit(1)
    
    # Mask password for display
    safe_url = database_url
    if ":" in database_url and "@" in database_url:
        try:
            # Simple masking: postgresql://user:pass@host... -> postgresql://user:****@host...
            part1, part2 = database_url.split("@", 1)
            prefix, userpass = part1.split("://", 1)
            if ":" in userpass:
                username = userpass.split(":")[0]
                safe_url = f"{prefix}://{username}:****@{part2}"
        except Exception:
            pass # Fallback to showing full definition or manual masking if complex
    
    print(f"ℹ️  Connecting to: {safe_url}")

    # 3. Attempt Connection
    try:
        engine = create_engine(database_url)
        with engine.connect() as connection:
            print("✅ Successfully connected to the database!")
            
            # 4. Check Schema
            print("\nChecking database schema...")
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f"   Found tables: {tables}")

            required_tables = ["users", "habits", "user_habits", "achievements", "habit_tracker"]
            missing_tables = [t for t in required_tables if t not in tables]
            
            if missing_tables:
                print(f"❌ MISSING TABLES: {missing_tables}")
                print("   Run migrations using: python migrate_streaks.py (or alembic upgrade head)")
            else:
                print("✅ All core tables are present.")

                # Check specific columns if tables exist
                if "user_habits" in tables:
                    columns = [c["name"] for c in inspector.get_columns("user_habits")]
                    missing = [col for col in ["total_completions", "current_streak"] if col not in columns]
                    if missing:
                        print(f"❌ MISSING columns in user_habits: {missing}")
                    else:
                        print("✅ user_habits schema looks correct.")

                if "achievements" in tables:
                    columns = [c["name"] for c in inspector.get_columns("achievements")]
                    missing = [col for col in ["code", "threshold_type"] if col not in columns]
                    if missing:
                        print(f"❌ MISSING columns in achievements: {missing}")
                    else:
                        print("✅ achievements schema looks correct.")
                
    except Exception as e:
        print("\n❌ CONNECTION FAILED:")
        print(f"   {e}")
        print("\nTroubleshooting Tips:")
        print("   1. Is the database server running? (Postgres)")
        print("   2. Does the database 'habitus' exist?")
        print("   3. Are the username/password correct in .env?")
        sys.exit(1)

    print("\n✅ Diagnostic complete. System appears ready.")

if __name__ == "__main__":
    check_db()
