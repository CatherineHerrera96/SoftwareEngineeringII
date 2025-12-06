from sqlalchemy.orm import Session
from db import SessionLocal, engine
from models import Habit

# Ensure tables exist (should be handled by migration or main app, but safe to ignore if exists)
# Base.metadata.create_all(bind=engine) 

THE_100_HABITS = [
    {
        "name": "May we meet again",
        "category": "the100",
        "description": "Say the traveler's blessing to a friend.",
        "is_custom": False
    },
    {
        "name": "Survive the Dropship",
        "category": "the100",
        "description": "Complete a high-intensity cardio workout.",
        "is_custom": False
    },
    {
        "name": "Grounder Training",
        "category": "the100",
        "description": "Practice combat or strength training (1 hour).",
        "is_custom": False
    },
    {
        "name": "Review Ark Systems",
        "category": "the100",
        "description": "Study or learn a new technical skill.",
        "is_custom": False
    },
    {
        "name": "Blood must have blood",
        "category": "the100",
        "description": "Face a difficult conflict or challenge head-on.",
        "is_custom": False
    },
    {
        "name": "Radioactive Check",
        "category": "the100",
        "description": "Check local air quality/UV index before going out.",
        "is_custom": False
    }
]

def seed_db():
    db = SessionLocal()
    try:
        print("Seeding 'The 100' habits directly to DB...")
        
        # Get existing names to avoid dupes
        existing = db.query(Habit).filter(Habit.category == "the100").all()
        existing_names = {h.name for h in existing}
        
        count = 0
        for h_data in THE_100_HABITS:
            if h_data["name"] in existing_names:
                print(f"Skipping: {h_data['name']}")
                continue
            
            new_habit = Habit(
                name=h_data["name"],
                category=h_data["category"],
                description=h_data["description"],
                is_custom=h_data["is_custom"]
            )
            db.add(new_habit)
            count += 1
            print(f"Added: {h_data['name']}")
            
        db.commit()
        print(f"Done! Added {count} habits.")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
