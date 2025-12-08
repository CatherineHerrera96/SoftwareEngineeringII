from sqlalchemy.orm import Session
from db import SessionLocal
from logic.achievement_engine import seed_initial_achievements

def run_seed():
    db = SessionLocal()
    try:
        print("Seeding achievements...")
        seed_initial_achievements(db)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
