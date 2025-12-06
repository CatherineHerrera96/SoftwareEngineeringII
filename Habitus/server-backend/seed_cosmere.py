from sqlalchemy.orm import Session
from db import SessionLocal, engine
from models import Habit

COSMERE_HABITS = [
    {
        "name": "Speak the First Ideal",
        "category": "cosmere",
        "description": "Life before death, strength before weakness, journey before destination.",
        "is_custom": False
    },
    {
        "name": "Burn Pewter",
        "category": "cosmere",
        "description": "Engage in physical exercise or endurance training.",
        "is_custom": False
    },
    {
        "name": "Store Health",
        "category": "cosmere",
        "description": "Get adequate rest and recovery (Gold Feruchemy).",
        "is_custom": False
    },
    {
        "name": "Practice Surgebinding",
        "category": "cosmere",
        "description": "Develop a new skill or hobby (Transformation/Illumination).",
        "is_custom": False
    },
    {
        "name": "Read the Way of Kings",
        "category": "cosmere",
        "description": "Read for 30 minutes (Scholarship).",
        "is_custom": False
    },
    {
        "name": "Offer Stormlight",
        "category": "cosmere",
        "description": "Perform an act of kindness or charity.",
        "is_custom": False
    }
]

def seed_db():
    db = SessionLocal()
    try:
        print("Seeding 'Cosmere RPG' habits directly to DB...")
        
        # Get existing names to avoid dupes in this category
        existing = db.query(Habit).filter(Habit.category == "cosmere").all()
        existing_names = {h.name for h in existing}
        
        count = 0
        for h_data in COSMERE_HABITS:
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
