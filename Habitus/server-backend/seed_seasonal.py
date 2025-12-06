from sqlalchemy.orm import Session
from db import SessionLocal
from models import Habit
from logic.habits import create_custom_habit # We can reuse logic or just insert directly

def seed_seasonal_habits():
    db = SessionLocal()
    try:
        # Define seasonal habits
        seasonal_data = [
            # New Year
            {"name": "Write Resolutions", "category": "New Year", "description": "Set goals for the year ahead"},
            {"name": "Review Achievements", "category": "New Year", "description": "Reflect on last year's wins"},
            {"name": "Declutter Workspace", "category": "New Year", "description": "Start fresh with a clean desk"},
            # Christmas
            {"name": "Wrap Gifts", "category": "Christmas", "description": "Prepare presents for the family"},
            {"name": "Decorate Tree", "category": "Christmas", "description": "Put up ornaments and lights"},
            {"name": "Drink Hot Cocoa", "category": "Christmas", "description": "Enjoy a warm mug by the fire"},
            # Halloween
            {"name": "Carve Pumpkin", "category": "Halloween", "description": "Make a spooky jack-o-lantern"},
            {"name": "Watch Scary Movie", "category": "Halloween", "description": "Get spooked!"},
            {"name": "Buy Candy", "category": "Halloween", "description": "Prepare for trick-or-treaters"},
            # Summer
            {"name": "Go to the Beach", "category": "Summer", "description": "Soak up the sun"},
            {"name": "Hydrate", "category": "Summer", "description": "Drink 8 glasses of water"},
            {"name": "Morning Swim", "category": "Summer", "description": "Start the day fresh"},
            # Valentine
            {"name": "Buy Flowers", "category": "Valentine", "description": "Surprise someone special"},
            {"name": "Date Night", "category": "Valentine", "description": "Plan a romantic evening"},
            # April Fools
            {"name": "Plan a Prank", "category": "April Fools", "description": "Harmless fun only!"},
            # Spring
            {"name": "Plant Flowers", "category": "Spring", "description": "Start the garden"},
            {"name": "Spring Cleaning", "category": "Spring", "description": "Tidy up the house"}
        ]

        print("Seeding seasonal habits...")
        for h_data in seasonal_data:
            # Check if exists (by name + category, generic check)
            exists = db.query(Habit).filter(
                Habit.name == h_data["name"], 
                Habit.category == h_data["category"],
                Habit.is_custom == False
            ).first()
            
            if not exists:
                new_habit = Habit(
                    name=h_data["name"],
                    category=h_data["category"],
                    description=h_data["description"],
                    frequency="daily",
                    is_custom=False, # System habit
                    user_id=None     # No owner
                )
                db.add(new_habit)
                print(f"Added: {h_data['name']}")
            else:
                print(f"Skipped (Exists): {h_data['name']}")
        
        db.commit()
        print("Seeding complete.")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_seasonal_habits()
