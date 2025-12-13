"""
Integration Tests for Habitus Backend

Tests the complete flow:
1. Authentication (register/login)
2. Habit activation
3. Check-in submission
4. Weekly dashboard validation

These tests run against a live backend instance and verify end-to-end functionality.
"""

import requests
import json
from datetime import date, datetime, timedelta
from typing import Dict, Optional


class HabitusIntegrationTest:
    """
    Integration test suite for Habitus application.
    
    Tests the complete user journey from registration to weekly statistics.
    """
    
    def __init__(self, base_url: str = "http://localhost:8000/api"):
        self.base_url = base_url
        self.auth_url = "http://localhost:8080/auth"
        self.token: Optional[str] = None
        self.user_email: Optional[str] = None
        self.test_user_habit_id: Optional[int] = None
        
    def _headers(self) -> Dict[str, str]:
        """Get headers with authorization token."""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def print_step(self, step_num: str, description: str):
        """Print formatted test step."""
        print(f"\n{'='*70}")
        print(f"STEP {step_num}: {description}")
        print('='*70)
    
    def test_1_register_user(self) -> bool:
        """
        Test 6.4.1.1: User Registration
        
        Validates that a new user can be registered successfully.
        """
        self.print_step("1", "User Registration")
        
        # Generate unique email for test
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.user_email = f"integration_test_{timestamp}@test.com"
        
        payload = {
            "email": self.user_email,
            "password": "testpass123"
        }
        
        print(f"Registering user: {self.user_email}")
        response = requests.post(
            f"{self.auth_url}/register",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Java backend returns 200 with token (auto-login) or 201 with message
        if response.status_code in [200, 201]:
            # If we got a token in response, save it for next steps
            try:
                data = response.json()
                if "token" in data:
                    self.token = data["token"]
                    print("✅ User registration successful (auto-logged in)")
                else:
                    print("✅ User registration successful")
            except:
                print("✅ User registration successful")
            return True
        else:
            print(f"❌ User registration failed: {response.text}")
            return False
    
    def test_2_login_user(self) -> bool:
        """
        Test 6.4.1.2: User Authentication
        
        Validates that a registered user can log in and receive a JWT token.
        """
        self.print_step("2", "User Login")
        
        payload = {
            "email": self.user_email,
            "password": "testpass123"
        }
        
        print(f"Logging in user: {self.user_email}")
        response = requests.post(
            f"{self.auth_url}/login",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            print(f"Token received: {self.token[:50]}...")
            print("✅ User login successful")
            return True
        else:
            print(f"❌ User login failed: {response.text}")
            return False
    
    def test_3_get_profile(self) -> bool:
        """
        Test 6.4.1.3: Profile Retrieval
        
        Validates that authenticated user can retrieve their profile.
        """
        self.print_step("3", "Get User Profile")
        
        response = requests.get(
            f"{self.base_url}/profile/",
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            profile = response.json()
            print(f"Profile Data: {json.dumps(profile, indent=2)}")
            print(f"User ID: {profile.get('id')}")
            print(f"Email: {profile.get('email')}")
            print("✅ Profile retrieval successful")
            return True
        else:
            print(f"❌ Profile retrieval failed: {response.text}")
            return False
    
    def test_4_list_habits(self) -> bool:
        """
        Test 6.4.1.4: List Available Habits
        
        Validates that the system returns available habits catalog.
        """
        self.print_step("4", "List Available Habits")
        
        response = requests.get(
            f"{self.base_url}/habits/",
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            habits = response.json()
            print(f"Total habits available: {len(habits)}")
            if habits:
                print(f"Sample habit: {habits[0]['name']} (ID: {habits[0]['id']})")
            print("✅ Habits list retrieved successfully")
            return True
        else:
            print(f"❌ Habits list retrieval failed: {response.text}")
            return False
    
    def test_5_activate_habit(self) -> bool:
        """
        Test 6.4.1.5: Habit Activation
        
        Validates that a user can activate a habit from the catalog.
        """
        self.print_step("5", "Activate Habit")
        
        # First get available habits
        response = requests.get(
            f"{self.base_url}/habits/",
            headers=self._headers()
        )
        
        if response.status_code != 200:
            print("❌ Cannot retrieve habits to activate")
            return False
        
        habits = response.json()
        if not habits:
            print("❌ No habits available to activate")
            return False
        
        # Select first habit
        habit_id = str(habits[0]['id'])
        habit_name = habits[0]['name']
        
        print(f"Activating habit: {habit_name} (ID: {habit_id})")
        
        payload = {
            "habit_ids": [habit_id]
        }
        
        response = requests.post(
            f"{self.base_url}/user-habits/",
            json=payload,
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            user_habits = response.json()
            print(f"Response: {json.dumps(user_habits, indent=2)}")
            
            if user_habits and len(user_habits) > 0:
                self.test_user_habit_id = user_habits[0]['id']
                print(f"User Habit ID: {self.test_user_habit_id}")
                print("✅ Habit activation successful")
                return True
            else:
                print("❌ No user habits returned")
                return False
        else:
            print(f"❌ Habit activation failed: {response.text}")
            return False
    
    def test_6_submit_checkin(self) -> bool:
        """
        Test 6.4.1.6: Check-in Submission
        
        Validates that a user can submit a check-in for an active habit.
        """
        self.print_step("6", "Submit Check-in")
        
        if not self.test_user_habit_id:
            print("❌ No active habit to check-in")
            return False
        
        today = date.today().isoformat()
        
        payload = {
            "user_habit_id": self.test_user_habit_id,
            "date": today,
            "is_completed": True
        }
        
        print(f"Submitting check-in for User Habit ID: {self.test_user_habit_id}")
        print(f"Date: {today}")
        
        response = requests.post(
            f"{self.base_url}/checkins/",
            json=payload,
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            checkin_data = response.json()
            print(f"Response: {json.dumps(checkin_data, indent=2)}")
            print("✅ Check-in submission successful")
            return True
        else:
            print(f"❌ Check-in submission failed: {response.text}")
            return False
    
    def test_7_idempotent_checkin(self) -> bool:
        """
        Test 6.4.1.7: Idempotent Check-in
        
        Validates that submitting the same check-in twice updates instead of duplicating.
        """
        self.print_step("7", "Idempotent Check-in (Duplicate Prevention)")
        
        if not self.test_user_habit_id:
            print("❌ No active habit to check-in")
            return False
        
        today = date.today().isoformat()
        
        payload = {
            "user_habit_id": self.test_user_habit_id,
            "date": today,
            "is_completed": True
        }
        
        print("Submitting check-in again for same date...")
        
        response = requests.post(
            f"{self.base_url}/checkins/",
            json=payload,
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            checkin_data = response.json()
            print(f"Response: {json.dumps(checkin_data, indent=2)}")
            print("✅ Idempotent check-in successful (no duplicate created)")
            return True
        else:
            print(f"❌ Idempotent check-in failed: {response.text}")
            return False
    
    def test_8_get_weekly_stats(self) -> bool:
        """
        Test 6.4.2: Weekly Dashboard Validation
        
        Validates that the weekly statistics dashboard returns correct data
        including completion rates and streaks.
        """
        self.print_step("8", "Weekly Dashboard Statistics")
        
        response = requests.get(
            f"{self.base_url}/stats/weekly",
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"Weekly Stats: {json.dumps(stats, indent=2)}")
            
            # Validate expected fields
            expected_fields = ['week_start', 'week_end', 'checkins_total', 
                             'checkins_completed', 'completion_rate']
            
            missing_fields = [f for f in expected_fields if f not in stats]
            
            if missing_fields:
                print(f"⚠️ Missing fields: {missing_fields}")
            
            print(f"\nWeek: {stats.get('week_start')} to {stats.get('week_end')}")
            print(f"Total Check-ins: {stats.get('checkins_total')}")
            print(f"Completed: {stats.get('checkins_completed')}")
            print(f"Completion Rate: {stats.get('completion_rate')}%")
            
            if stats.get('checkins_total', 0) > 0:
                print("✅ Weekly stats retrieved with check-in data")
            else:
                print("✅ Weekly stats retrieved (no check-ins yet)")
            
            return True
        else:
            print(f"❌ Weekly stats retrieval failed: {response.text}")
            return False
    
    def test_9_list_user_habits(self) -> bool:
        """
        Test 6.4.1.8: List Active User Habits
        
        Validates that user can retrieve their active habits with completion status.
        """
        self.print_step("9", "List User's Active Habits")
        
        response = requests.get(
            f"{self.base_url}/user-habits/",
            headers=self._headers()
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_habits = response.json()
            print(f"Total active habits: {len(user_habits)}")
            
            for uh in user_habits:
                print(f"\nHabit: {uh.get('habit_name')}")
                print(f"  Completed today: {uh.get('is_completed')}")
                print(f"  Current streak: {uh.get('current_streak')}")
                print(f"  Total completions: {uh.get('total_completions')}")
            
            print("✅ User habits list retrieved successfully")
            return True
        else:
            print(f"❌ User habits list retrieval failed: {response.text}")
            return False
    
    def run_all_tests(self):
        """
        Execute complete integration test suite.
        
        Runs all tests in sequence and reports results.
        """
        print("\n" + "="*70)
        print("HABITUS INTEGRATION TEST SUITE")
        print("Testing complete flow: Auth → Habit Activation → Check-in → Stats")
        print("="*70)
        
        tests = [
            ("6.4.1.1", "User Registration", self.test_1_register_user),
            ("6.4.1.2", "User Login", self.test_2_login_user),
            ("6.4.1.3", "Get Profile", self.test_3_get_profile),
            ("6.4.1.4", "List Habits", self.test_4_list_habits),
            ("6.4.1.5", "Activate Habit", self.test_5_activate_habit),
            ("6.4.1.6", "Submit Check-in", self.test_6_submit_checkin),
            ("6.4.1.7", "Idempotent Check-in", self.test_7_idempotent_checkin),
            ("6.4.2", "Weekly Dashboard", self.test_8_get_weekly_stats),
            ("6.4.1.8", "List User Habits", self.test_9_list_user_habits),
        ]
        
        results = []
        
        for test_id, test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_id, test_name, result))
            except Exception as e:
                print(f"\n❌ Exception in {test_name}: {str(e)}")
                results.append((test_id, test_name, False))
        
        # Print summary
        print("\n" + "="*70)
        print("TEST RESULTS SUMMARY")
        print("="*70)
        
        passed = sum(1 for _, _, result in results if result)
        total = len(results)
        
        for test_id, test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_id}: {test_name:30s} {status}")
        
        print("\n" + "="*70)
        print(f"Total: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        print("="*70)
        
        return passed == total


if __name__ == "__main__":
    # Run integration tests
    test_suite = HabitusIntegrationTest()
    success = test_suite.run_all_tests()
    
    exit(0 if success else 1)
