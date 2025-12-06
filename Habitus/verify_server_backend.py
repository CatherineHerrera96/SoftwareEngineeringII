import json
import urllib.request
import urllib.error
from datetime import date, timedelta
from jose import jwt

BASE_URL = "http://localhost:8000/api"
SECRET_KEY = "my_super_secret_key_for_habitus_mvp_123456789"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def make_request(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data is not None:
        data_bytes = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        raise

def verify():
    email = "test@example.com"
    token = create_access_token({"sub": email})
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Testing with token for {email}")

    # 1. Profile
    try:
        profile = make_request("GET", f"{BASE_URL}/profile/", headers=headers)
        print("Profile:", profile)
    except Exception as e:
        print(f"Error hitting profile: {e}")
        return

    # 2. Create a custom habit
    habit_data = {
        "name": "Test Habit Urllib",
        "category": "Testing",
        "description": "A habit for testing streaks",
        "frequency": "daily"
    }
    try:
        habit = make_request("POST", f"{BASE_URL}/habits/", data=habit_data, headers=headers)
        print(f"Created habit: {habit['id']}")
    except Exception as e:
        print(f"Failed to create habit: {e}")
        return
    
    # 3. Track the habit
    try:
        user_habits = make_request("POST", f"{BASE_URL}/user-habits/", data={"habit_ids": [str(habit['id'])]}, headers=headers)
        user_habit = user_habits[0]
        print(f"Tracked user habit: {user_habit['id']}")
    except Exception as e:
        print(f"Failed to track habit: {e}")
        return
    
    # 4. Checkin Day 1
    today = date.today()
    day1 = today - timedelta(days=1)
    try:
        res = make_request("POST", f"{BASE_URL}/checkins/", data={
            "user_habit_id": user_habit['id'],
            "date": str(day1),
            "is_completed": True
        }, headers=headers)
        print("Checkin Day 1: Success")
    except Exception as e:
        print(f"Checkin Day 1 Failed: {e}")
    
    # 5. Checkin Day 2 (Today)
    try:
        res = make_request("POST", f"{BASE_URL}/checkins/", data={
            "user_habit_id": user_habit['id'],
            "date": str(today),
            "is_completed": True
        }, headers=headers)
        print("Checkin Day 2: Success")
    except Exception as e:
        print(f"Checkin Day 2 Failed: {e}")
    
    # 6. Verify Streak
    try:
        uhs = make_request("GET", f"{BASE_URL}/user-habits/", headers=headers)
        my_uh = next(uh for uh in uhs if uh['id'] == user_habit['id'])
        print(f"Current Streak: {my_uh['current_streak']}")
        
        if my_uh['current_streak'] >= 2:
            print("SUCCESS: Streak calculation works!")
        else:
            print("FAILURE: Streak calculation failed.")
    except Exception as e:
        print(f"Failed to verify streak: {e}")

if __name__ == "__main__":
    verify()
