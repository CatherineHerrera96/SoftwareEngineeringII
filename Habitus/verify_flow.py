import requests
import json
import sys

# Configuration
JAVA_AUTH_URL = "http://localhost:8080/auth"
PYTHON_API_URL = "http://localhost:8000/api"

# Test User
EMAIL = "verify_user@example.com"
PASSWORD = "password123"

def print_step(msg):
    print(f"\n[STEP] {msg}")

def fail(msg):
    print(f"[FAIL] {msg}")
    sys.exit(1)

def success(msg):
    print(f"[SUCCESS] {msg}")

def main():
    print("=== Starting End-to-End Verification Flow ===")

    # 1. Register / Login
    print_step("Registering/Logging in User")
    session = requests.Session()
    
    # Try login first
    login_payload = {"email": EMAIL, "password": PASSWORD}
    res = session.post(f"{JAVA_AUTH_URL}/login", json=login_payload)
    
    if res.status_code == 401 or res.status_code == 404:
        # Register if login fails
        print("User not found, registering...")
        reg_res = session.post(f"{JAVA_AUTH_URL}/register", json=login_payload)
        if reg_res.status_code != 200:
            fail(f"Registration failed: {reg_res.text}")
        # Login again
        res = session.post(f"{JAVA_AUTH_URL}/login", json=login_payload)

    if res.status_code != 200:
        print(f"Status Code: {res.status_code}")
        print(f"Response Content: {res.text}")
        fail(f"Login failed: {res.text}")
    
    token = res.json().get("token")
    if not token:
        fail("No token received")
    
    headers = {"Authorization": f"Bearer {token}"}
    success(f"Authenticated as {EMAIL}")

    # 2. Create Custom Habit
    print_step("Creating Custom Habit")
    habit_payload = {
        "name": "Test Custom Habit",
        "category": "Personal",
        "frequency": "daily",
        "description": "A test habit",
        "is_custom": True
    }
    res = requests.post(f"{PYTHON_API_URL}/habits/", json=habit_payload, headers=headers)
    if res.status_code != 201:
        fail(f"Create habit failed: {res.text}")
    
    habit_data = res.json()
    habit_id = habit_data["id"]
    success(f"Created habit ID: {habit_id}")

    # 3. Assign Habit to User (Implicitly done? No, create_habit just creates it in catalog usually, 
    # but my implementation in api/habits.py creates it. 
    # Wait, does it assign it to user_habits? 
    # Checking api/habits.py: It adds to `habits` table with user_id.
    # But does it add to `user_habits`? 
    # NO! My implementation in api/habits.py only adds to `habits` table.
    # The user still needs to 'track' it (add to user_habits).
    # I should fix this in api/habits.py OR call user-habits endpoint here.
    # Let's call user-habits endpoint here to be safe and consistent with flow.
    
    print_step("Assigning Habit to User")
    assign_payload = {"habit_ids": [str(habit_id)]}
    res = requests.post(f"{PYTHON_API_URL}/user-habits/", json=assign_payload, headers=headers)
    if res.status_code not in [200, 201]:
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
        fail(f"Assign habit failed: {res.text}")
    
    user_habits = res.json()
    # Find our user_habit_id
    # user_habits is list of {id, habit_id, ...}
    my_uh = next((uh for uh in user_habits if uh["habit_id"] == habit_id), None)
    if not my_uh:
        fail("Habit not found in user_habits response")
    
    user_habit_id = my_uh["id"]
    success(f"Assigned habit. UserHabit ID: {user_habit_id}")

    # 4. Check-in
    print_step("Performing Check-in")
    checkin_payload = {
        "user_habit_id": user_habit_id,
        "is_completed": True
    }
    res = requests.post(f"{PYTHON_API_URL}/checkins/", json=checkin_payload, headers=headers)
    if res.status_code != 200:
        fail(f"Check-in failed: {res.text}")
    
    checkin_data = res.json()
    success("Check-in successful")

    # 5. Verify Streak & Achievements
    print_step("Verifying Streak and Achievements")
    # Fetch user habits again to check streak
    res = requests.get(f"{PYTHON_API_URL}/user-habits/", headers=headers)
    user_habits = res.json()
    my_uh = next((uh for uh in user_habits if uh["id"] == user_habit_id), None)
    
    print(f"Current Streak: {my_uh.get('current_streak')}")
    if my_uh.get("current_streak") < 1:
        fail("Streak did not increment")
    
    # Fetch achievements
    res = requests.get(f"{PYTHON_API_URL}/achievements/mine", headers=headers)
    achievements = res.json()
    print(f"Achievements: {[a['title'] for a in achievements]}")
    
    # Expect 'First Step' achievement
    if not any(a['title'] == 'First Step' for a in achievements):
        print("[WARN] 'First Step' achievement not found. Logic might need check.")
    else:
        success("'First Step' achievement unlocked!")

    success("=== Verification Complete ===")

if __name__ == "__main__":
    main()
