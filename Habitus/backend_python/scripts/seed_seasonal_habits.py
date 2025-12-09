
import sys
import os

# Ensure the parent directory is in the path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import SessionLocal, engine
from models import Habit, Base

# Define the data
SEASONAL_HABITS = [
    # --- Cosmere RPG ---
    {"name": "Read Stormlight Archive", "category": "cosmere", "description": "Read at least 15 minutes of Brandon Sanderson's epic.", "season_id": "cosmere"},
    {"name": "Practice Allomancy", "category": "cosmere", "description": "Mental exercises to burn metals (focus & mindfulness).", "season_id": "cosmere"},
    {"name": "Say the Ideals", "category": "cosmere", "description": "Recite the Immortal Words: Life before Death.", "season_id": "cosmere"},
    {"name": "Investiture Meditation", "category": "cosmere", "description": "Breathing exercises to gather Stormlight.", "season_id": "cosmere"},
    {"name": "Speak with Spren", "category": "cosmere", "description": "A moment of gratitude to attract positive honorspren.", "season_id": "cosmere"},

    # --- The 100 ---
    {"name": "Survival Training", "category": "the100", "description": "Physical workout to survive on the ground.", "season_id": "the100"},
    {"name": "Grounder Language", "category": "the100", "description": "Learn 5 new words in Trigedasleng.", "season_id": "the100"},
    {"name": "Maintain the Ark", "category": "the100", "description": "Clean and organize your living space.", "season_id": "the100"},
    {"name": "Radio Check", "category": "the100", "description": "Reach out to a friend or family member (Raven style).", "season_id": "the100"},
    {"name": "Avoid Acid Fog", "category": "the100", "description": "Stay indoors and focus on deep work for 1 hour.", "season_id": "the100"},

    # --- New Year ---
    {"name": "Write 2026 Resolutions", "category": "new_year", "description": "Reflect on goals for the upcoming year.", "season_id": "new_year"},
    {"name": "Daily Declutter", "category": "new_year", "description": "Remove 3 items you no longer need.", "season_id": "new_year"},
    {"name": "Financial Review", "category": "new_year", "description": "Check spending and savings goals.", "season_id": "new_year"},
    {"name": "Learn a New Skill", "category": "new_year", "description": "Spend 20 mins practicing something new.", "season_id": "new_year"},

    # --- Christmas ---
    {"name": "Gift Wrapping", "category": "christmas", "description": "Wrap presents or prepare thoughtful notes.", "season_id": "christmas"},
    {"name": "Drink Hot Cocoa", "category": "christmas", "description": "Relax with a warm holiday beverage.", "season_id": "christmas"},
    {"name": "Holiday Reading", "category": "christmas", "description": "Read a festive story or article.", "season_id": "christmas"},
    {"name": "Snow Walk", "category": "christmas", "description": "Take a walk outside (even if there's no snow!).", "season_id": "christmas"},
    {"name": "Decoration Tidy", "category": "christmas", "description": "Maintain or adjust holiday decorations.", "season_id": "christmas"},

    # --- Halloween ---
    {"name": "Watch a Scary Movie", "category": "halloween", "description": "Get spurred by adrenaline!", "season_id": "halloween"},
    {"name": "Pumpkin Carving Plan", "category": "halloween", "description": "Sketch or plan a creative design.", "season_id": "halloween"},
    {"name": "Night Walk", "category": "halloween", "description": "A spooky evening stroll.", "season_id": "halloween"},
    {"name": "Eat Less Candy", "category": "halloween", "description": "Resist the sugar rush (or enjoy just one!).", "season_id": "halloween"},
    {"name": "Costume Prep", "category": "halloween", "description": "Work on your Halloween outfit.", "season_id": "halloween"},

    # --- Summer ---
    {"name": "Hydrate", "category": "summer", "description": "Drink 8 glasses of water.", "season_id": "summer"},
    {"name": "Sunscreen Application", "category": "summer", "description": "Protect your skin before going out.", "season_id": "summer"},
    {"name": "Morning Swim/Run", "category": "summer", "description": "Exercise while it's still cool.", "season_id": "summer"},
    {"name": "Eat Fresh Fruit", "category": "summer", "description": "Enjoy seasonal berries or melon.", "season_id": "summer"},
    {"name": "Sunset Watch", "category": "summer", "description": "Relax and watch the day end.", "season_id": "summer"},

     # --- Valentine ---
    {"name": "Express Love", "category": "valentine", "description": "Tell someone you appreciate them.", "season_id": "valentine"},
    {"name": "Self-Care Date", "category": "valentine", "description": "Treat yourself to something nice.", "season_id": "valentine"},
    {"name": "Write a Poem", "category": "valentine", "description": "Creative writing about emotions.", "season_id": "valentine"},
    {"name": "Quality Time", "category": "valentine", "description": "Spend focused time with a partner or friend.", "season_id": "valentine"},

    # --- April Fools ---
    {"name": "Plan a Prank", "category": "april_fools", "description": "Think of a harmless, funny joke.", "season_id": "april_fools"},
    {"name": "Laugh Daily", "category": "april_fools", "description": "Watch a comedy clip or tell a joke.", "season_id": "april_fools"},
    {"name": "Practice Magic", "category": "april_fools", "description": "Learn a simple sleight of hand trick.", "season_id": "april_fools"},
    {"name": "Juggling", "category": "april_fools", "description": "Practice coordination (clown training).", "season_id": "april_fools"},

    # --- Spring ---
    {"name": "Plant Seeds", "category": "spring", "description": "Start a garden or tend to plants.", "season_id": "spring"},
    {"name": "Spring Cleaning", "category": "spring", "description": "Deep clean one small area.", "season_id": "spring"},
    {"name": "Nature Walk", "category": "spring", "description": "Look for blooming flowers.", "season_id": "spring"},
    {"name": "Open Windows", "category": "spring", "description": "Let fresh air circulate.", "season_id": "spring"},
]

CORE_HABITS = [
    # --- Health & Fitness ---
    {"name": "Drink Water", "category": "health", "description": "Drink 8 glasses of water daily.", "season_id": None},
    {"name": "Exercise", "category": "health", "description": "30 minutes of physical activity.", "season_id": None},
    {"name": "Sleep 8 Hours", "category": "health", "description": "Get a full night's rest.", "season_id": None},
    {"name": "Healthy Breakfast", "category": "health", "description": "Start the day with a nutritious meal.", "season_id": None},
    {"name": "No Sugar", "category": "health", "description": "Avoid sugary snacks and drinks.", "season_id": None},
    {"name": "Take Vitamins", "category": "health", "description": "Take daily supplements.", "season_id": None},
    {"name": "Stretching", "category": "health", "description": "10 minutes of stretching.", "season_id": None},
    {"name": "Walk 5k Steps", "category": "health", "description": "Keep moving throughout the day.", "season_id": None},
    {"name": "Floss Teeth", "category": "health", "description": "Dental hygiene is key.", "season_id": None},
    {"name": "Cook a Meal", "category": "health", "description": "Prepare a home-cooked meal.", "season_id": None},
    
    # --- Mindfulness & Spirit ---
    {"name": "Meditate", "category": "mindfulness", "description": "10 minutes of mindfulness meditation.", "season_id": None},
    {"name": "Journaling", "category": "mindfulness", "description": "Write down your thoughts and feelings.", "season_id": None},
    {"name": "Gratitude", "category": "mindfulness", "description": "List 3 things you are grateful for.", "season_id": None},
    {"name": "Digital Detox", "category": "mindfulness", "description": "1 hour without screens.", "season_id": None},
    {"name": "Deep Breathing", "category": "mindfulness", "description": "5 minutes of breathwork.", "season_id": None},
    {"name": "Morning Affirmations", "category": "mindfulness", "description": "Start the day with positive intent.", "season_id": None},
    {"name": "Prayer/Reflection", "category": "mindfulness", "description": "Spiritual connection time.", "season_id": None},
    
    # --- Productivity & Growth ---
    {"name": "Plan the Day", "category": "productivity", "description": "Outline your tasks for the day.", "season_id": None},
    {"name": "Deep Work", "category": "productivity", "description": "1 hour of focused, distraction-free work.", "season_id": None},
    {"name": "Inbox Zero", "category": "productivity", "description": "Clear out emails and notifications.", "season_id": None},
    {"name": "Review Goals", "category": "productivity", "description": "Check progress on long-term goals.", "season_id": None},
    {"name": "Tidy Workspace", "category": "productivity", "description": "Clear desk, clear mind.", "season_id": None},
    {"name": "Read", "category": "learning", "description": "Read a book or article for 20 minutes.", "season_id": None},
    {"name": "Learn Language", "category": "learning", "description": "Practice vocabulary or Duolingo.", "season_id": None},
    {"name": "Code Practice", "category": "learning", "description": "Solve one algorithm or write code.", "season_id": None},
    {"name": "Watch Documentary", "category": "learning", "description": "Learn something new about the world.", "season_id": None},
    {"name": "Listen to Podcast", "category": "learning", "description": "Educational audio content.", "season_id": None},

    # --- Social & Kindness ---
    {"name": "Call a Friend", "category": "social", "description": "Reach out to someone you care about.", "season_id": None},
    {"name": "Family Time", "category": "social", "description": "Uninterrupted time with family.", "season_id": None},
    {"name": "Compliment Someone", "category": "social", "description": "Make someone's day brighter.", "season_id": None},
    {"name": "Volunteer/Help", "category": "social", "description": "Do a good deed.", "season_id": None},
    {"name": "Network", "category": "social", "description": "Connect with a professional contact.", "season_id": None},
    
    # --- Creativity & Hobbies ---
    {"name": "Draw/Paint", "category": "creativity", "description": "Express yourself visually.", "season_id": None},
    {"name": "Write 500 Words", "category": "creativity", "description": "Fiction, blog, or essays.", "season_id": None},
    {"name": "Play Instrument", "category": "creativity", "description": "Practice music.", "season_id": None},
    {"name": "Photography", "category": "creativity", "description": "Take a photo of something interesting.", "season_id": None},
    {"name": "DIY Project", "category": "creativity", "description": "Work on a craft or repair.", "season_id": None},
    
    # --- Finance ---
    {"name": "Track Spending", "category": "finance", "description": "Update your budget ledger.", "season_id": None},
    {"name": "Save $5", "category": "finance", "description": "Put small amount into savings.", "season_id": None},
    {"name": "No Spur Spending", "category": "finance", "description": "Stick strictly to the list.", "season_id": None},
]

def seed_habits():
    session = SessionLocal()
    try:
        # OPTIONAL: Clear existing SEASONAL/SYSTEM habits to avoid duplicates 
        # But we must be careful not to delete user custom habits if we don't want to.
        # Here we will delete ALL system habits (is_custom=False) to ensure a clean slate of official seasonal habits.
        # This will NOT delete user progress on them if we cascade properly, OR we might have issues if user_habits point to deleted habits.
        # Given the user asked to "reset", and this is dev, we might just wipe system habits.
        
        # However, deleting a habit referenced by user_habits might cause FK constraint errors unless we cascade or delete those too.
        # To be safe for this request, let's delete any system habit with a season_id or matching our list.
        
        print("Cleaning up old seasonal system habits...")
        
        # 1. Find IDs of habits to delete (ALL system habits to ensure clean slate)
        habits_to_delete = session.query(Habit.id).filter(Habit.is_custom == False).all()
        habit_ids = [h[0] for h in habits_to_delete]
        
        if habit_ids:
            print(f"Found {len(habit_ids)} habits to delete. Removing associated UserHabits first...")
            # 2. Delete references in user_habits
            # Note: If user_habits has children (like checkins/streaks), we might need to delete those too if cascade isn't set up.
            from models import UserHabit, Checkin
            
            # Find UserHabit IDs to delete Checkins (if cascade not on DB level)
            user_habits_to_delete = session.query(UserHabit.id).filter(UserHabit.habit_id.in_(habit_ids)).all()
            uh_ids = [uh[0] for uh in user_habits_to_delete]
            
            # 2a. Delete user_achievements that reference these HABITS (FK constraint)
            from models import UserAchievement
            print(f"Removing user_achievements dependent on these habits...")
            session.query(UserAchievement).filter(UserAchievement.habit_id.in_(habit_ids)).delete(synchronize_session=False)

            if uh_ids:
                print(f"Removing {len(uh_ids)} UserHabits and their checkins...")
                session.query(Checkin).filter(Checkin.user_habit_id.in_(uh_ids)).delete(synchronize_session=False)
                session.query(UserHabit).filter(UserHabit.id.in_(uh_ids)).delete(synchronize_session=False)

            # 3. Now delete the habits
            session.query(Habit).filter(Habit.id.in_(habit_ids)).delete(synchronize_session=False)
            
        session.commit()

        print("Seeding new habits (Seasonal + Core)...")
        ALL_HABITS = SEASONAL_HABITS + CORE_HABITS
        
        for data in ALL_HABITS:
            # Check if exists (by name) just in case
            exists = session.query(Habit).filter_by(name=data["name"]).first()
            if not exists:
                habit = Habit(
                    name=data["name"],
                    category=data["category"],
                    description=data["description"],
                    frequency="daily",
                    is_custom=False,
                    season_id=data["season_id"]
                )
                session.add(habit)
        
        session.commit()
        print("Done!")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_habits()
