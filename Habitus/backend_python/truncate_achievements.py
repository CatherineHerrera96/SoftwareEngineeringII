from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal

def truncate_tables():
    db = SessionLocal()
    try:
        print("Truncating achievements and user_achievements...")
        db.execute(text("TRUNCATE TABLE user_achievements CASCADE;"))
        db.execute(text("TRUNCATE TABLE achievements CASCADE;"))
        db.commit()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    truncate_tables()
