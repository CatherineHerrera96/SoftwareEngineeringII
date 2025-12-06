import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server-backend')))

from models import Habit
from db import SessionLocal, engine

def seed_seasonal_habits():
    db = SessionLocal()
    
    seasonal_habits = [
        {
            "name": "Read Christmas Stories",
            "description": "Read a festive story for 20 minutes.",
            "category": "Seasonal",
            "is_custom": False
        },
        {
            "name": "Drink Hot Cocoa",
            "description": "Enjoy a warm cup of cocoa.",
            "category": "Seasonal",
            "is_custom": False
        },
        {
            "name": "Wrap Gifts",
            "description": "Prepare gifts for friends and family.",
            "category": "Seasonal",
            "is_custom": False
        },
        {
            "name": "Decorate for Christmas",
            "description": "Add some festive cheer to your home.",
            "category": "Seasonal",
            "is_custom": False
        }
    ]

    print("Checking for seasonal habits...")
    for h_data in seasonal_habits:
        exists = db.query(Habit).filter(Habit.name == h_data["name"]).first()
        if not exists:
            print(f"Adding: {h_data['name']}")
            habit = Habit(
                name=h_data["name"],
                description=h_data["description"],
                category=h_data["category"],
                is_custom=h_data["is_custom"]
            )
            db.add(habit)
        else:
            print(f"Skipping: {h_data['name']} (Already exists)")
    
    db.commit()
    db.close()
    print("Seasonal habits seeded!")

if __name__ == "__main__":
    seed_seasonal_habits()
