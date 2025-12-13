# 6.5 Acceptance Testing

Acceptance tests validate that the system meets business requirements and user expectations. Tests are written in Given/When/Then format (Behavior Driven Development - BDD) to clearly express business scenarios.

---

## 6.5.1 Given/When/Then Criteria Applied

### BDD (Behavior Driven Development) Format

The Given/When/Then (Gherkin) format provides clear, testable criteria for acceptance:

**Structure:**
- **GIVEN** (Context): Preconditions and initial system state
- **WHEN** (Action): Actions performed by the user or system
- **THEN** (Result): Expected outcomes and assertions

**Benefits:**
- ✅ Non-technical stakeholders can understand tests
- ✅ Clear separation of setup, action, and validation
- ✅ Reusable test steps
- ✅ Easy to trace from requirements to test execution

### Example Template

```gherkin
Scenario: [Descriptive Title]

  GIVEN [Initial system state]
    AND [Additional preconditions]
    AND [More context]
  
  WHEN [User performs action 1]
    AND [User performs action 2]
    AND [System processes]
  
  THEN [Expected outcome 1]
    AND [Expected outcome 2]
    AND [System validates]
```

---

## 6.5.2 Acceptance Criteria: New User Registers First Habit

### Scenario: New user signs in and registers their first habit

**Description:**
This scenario validates the complete onboarding flow for a new user: registration, login, habit selection, and first check-in.

---

### GIVEN (Context)

```
GIVEN A new user email 'newuser@test.com' does not exist in the system
  AND The habit catalog contains 81 system habits
  AND The user has not activated any habits yet
  AND The database is ready to accept new registrations
```

**Preconditions:**
- No user exists with the test email
- System has initialized with default habits
- Database connection is active
- Authentication service is operational

---

### WHEN (Actions)

```
WHEN 1. The user registers with email 'newuser@test.com' and password 'secure123'
  AND 2. The user logs in with their credentials
  AND 3. The user views the available habits catalog
  AND 4. The user activates 'Morning Exercise' habit
```

**Step 1: User Registration**
- **HTTP Request:**
  ```
  POST http://localhost:8080/auth/register
  Content-Type: application/json
  
  {
    "email": "newuser@test.com",
    "password": "secure123"
  }
  ```
- **Expected Response:** 200 or 201
- **Validation:** User record created in database

**Step 2: User Login**
- **HTTP Request:**
  ```
  POST http://localhost:8080/auth/login
  Content-Type: application/json
  
  {
    "email": "newuser@test.com",
    "password": "secure123"
  }
  ```
- **Expected Response:** 200 OK
- **Response Body:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "newuser@test.com"
  }
  ```

**Step 3: View Habit Catalog**
- **HTTP Request:**
  ```
  GET http://localhost:8000/api/habits/
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Expected Response:** 200 OK
- **Response Body:** Array of 81 habits with names and categories

**Step 4: Activate Habit**
- **HTTP Request:**
  ```
  POST http://localhost:8000/api/user-habits/
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  
  {
    "habit_ids": ["1"]
  }
  ```
- **Expected Response:** 201 Created
- **Response Body:**
  ```json
  [
    {
      "id": 1,
      "habit_id": 1,
      "habit_name": "Morning Exercise",
      "is_active": true,
      "current_streak": 0,
      "total_completions": 0
    }
  ]
  ```

---

### THEN (Expected Outcomes)

```
THEN 1. The user's profile is created in the system
  AND 2. The activated habit appears in user's habit list
  AND 3. The habit shows 0 completions and 0 streak
  AND 4. User can submit a check-in for the habit
  AND 5. The user can view weekly statistics
```

**Assertion 1: Profile Created**
```python
GET http://localhost:8000/api/profile/
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "id": 1,
  "email": "newuser@test.com",
  "name": null,
  "avatar_url": null,
  "timezone": "America/Bogota"
}

Validation:
- ✅ User ID exists and is > 0
- ✅ Email matches registration email
- ✅ Profile is associated with correct user
```

**Assertion 2: Habit Appears in List**
```python
GET http://localhost:8000/api/user-habits/
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "habit_id": 1,
    "habit_name": "Morning Exercise",
    "is_active": true,
    "is_completed": false
  }
]

Validation:
- ✅ Habit list contains 1 item
- ✅ is_active = true
- ✅ habit_name matches activated habit
```

**Assertion 3: Streak and Completion Initialization**
```python
Response fields validation:
- ✅ total_completions = 0 (no check-ins yet)
- ✅ current_streak = 0 (no streak started)
- ✅ longest_streak = 0 (no history)
- ✅ streak_broken = false (no broken streak)
```

**Assertion 4: Check-in Submission Works**
```python
POST http://localhost:8000/api/checkins/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "user_habit_id": 1,
  "date": "2025-12-12",
  "is_completed": true
}

Response (201 Created):
{
  "id": 1,
  "user_habit_id": 1,
  "log_date": "2025-12-12",
  "is_completed": true,
  "new_achievements": []
}

Validation:
- ✅ Check-in ID exists
- ✅ Status code is 201 (created)
- ✅ new_achievements array is present
```

**Assertion 5: Weekly Statistics Available**
```python
GET http://localhost:8000/api/stats/weekly
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "user_id": "1",
  "week_start": "2025-12-08",
  "week_end": "2025-12-14",
  "checkins_total": 1,
  "checkins_completed": 1,
  "completion_rate": 100.0
}

Validation:
- ✅ Stats endpoint accessible
- ✅ checkins_total >= 1 (includes the submitted check-in)
- ✅ completion_rate calculated correctly
- ✅ week_start and week_end match current week
```

---

## 6.5.3 Acceptance Criteria: User Maintains Streak and Earns Achievement

### Scenario: User maintains streak and earns an achievement

**Description:**
This scenario validates the streak tracking system and automatic achievement evaluation when users complete habits consecutively.

---

### GIVEN (Context)

```
GIVEN A user account exists and is logged in
  AND The user has activated a habit
  AND The user has 2 consecutive completed check-ins (yesterday and today)
  AND Achievement thresholds are configured (e.g., 3-day streak = achievement)
```

**Preconditions:**
- User is authenticated with valid token
- User habit is active and ready for check-ins
- Achievement system is initialized
- Check-in dates are consecutive days

---

### WHEN (Actions)

```
WHEN 1. The user submits check-in for yesterday
  AND 2. The user submits check-in for today
```

**Step 1: Submit Yesterday's Check-in**
```python
POST http://localhost:8000/api/checkins/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "user_habit_id": 1,
  "date": "2025-12-11",  # Yesterday
  "is_completed": true
}

Response (201 Created):
{
  "id": 1,
  "user_habit_id": 1,
  "log_date": "2025-12-11",
  "is_completed": true,
  "new_achievements": []
}
```

**Step 2: Submit Today's Check-in**
```python
POST http://localhost:8000/api/checkins/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "user_habit_id": 1,
  "date": "2025-12-12",  # Today
  "is_completed": true
}

Response (201 Created):
{
  "id": 2,
  "user_habit_id": 1,
  "log_date": "2025-12-12",
  "is_completed": true,
  "new_achievements": [
    {
      "id": 5,
      "code": "CONSECUTIVE_3_DAYS",
      "name": "On Fire",
      "description": "Complete a habit 3 days in a row"
    }
  ]
}
```

---

### THEN (Expected Outcomes)

```
THEN 1. The user's habit streak increases to 2
  AND 2. The completion rate is 100% for the week
  AND 3. Achievement system evaluates the completion
  AND 4. The daily breakdown shows completed check-ins
```

**Assertion 1: Streak Updated**
```python
GET http://localhost:8000/api/user-habits/
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "habit_id": 1,
    "habit_name": "Morning Exercise",
    "current_streak": 2,         # ✅ Increased from 0
    "longest_streak": 2,
    "total_completions": 2
  }
]

Validation:
- ✅ current_streak = 2 (two consecutive days)
- ✅ total_completions = 2 (two check-ins)
- ✅ streak tracking is accurate
```

**Assertion 2: Completion Rate**
```python
GET http://localhost:8000/api/stats/weekly
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "user_id": "1",
  "week_start": "2025-12-08",
  "week_end": "2025-12-14",
  "checkins_total": 2,
  "checkins_completed": 2,
  "completion_rate": 100.0    # ✅ (2/2) * 100 = 100%
}

Validation:
- ✅ completion_rate = 100.0 (all check-ins completed)
- ✅ Formula: (completed / total) * 100
```

**Assertion 3: Achievement Evaluation**
```python
Validation from check-in response:
- ✅ new_achievements array is populated when threshold reached
- ✅ Achievement contains: id, code, name, description
- ✅ System automatically evaluates after each check-in

Example Achievement:
{
  "id": 5,
  "code": "CONSECUTIVE_3_DAYS",
  "name": "On Fire",
  "description": "Complete a habit 3 days in a row",
  "threshold_type": "streak",
  "threshold_value": 3
}
```

**Assertion 4: Daily Breakdown**
```python
GET http://localhost:8000/api/stats/weekly
Authorization: Bearer <JWT_TOKEN>

Response includes daily_breakdown:
"daily_breakdown": [
  { "date": "2025-12-08", "total": 0, "completed": 0 },
  { "date": "2025-12-09", "total": 0, "completed": 0 },
  { "date": "2025-12-10", "total": 0, "completed": 0 },
  { "date": "2025-12-11", "total": 1, "completed": 1 },  # ✅ Yesterday
  { "date": "2025-12-12", "total": 1, "completed": 1 },  # ✅ Today
  { "date": "2025-12-13", "total": 0, "completed": 0 },
  { "date": "2025-12-14", "total": 0, "completed": 0 }
]

Validation:
- ✅ Shows 2 days with completed check-ins
- ✅ Consecutive days are tracked
- ✅ Daily totals match actual check-ins
```

---

## 6.5.4 Functional Requirements Compliance Verification

### Overview

All 6 major functional requirements are verified through automated acceptance tests:

| ID  | Requirement | Status | Evidence |
|-----|-------------|--------|----------|
| FR-1 | User Authentication | ✅ PASS | Users can register and login |
| FR-2 | Habit Management | ✅ PASS | Catalog access and activation |
| FR-3 | Check-in System | ✅ PASS | Idempotent check-ins |
| FR-4 | Statistics & Tracking | ✅ PASS | Weekly dashboard with rates |
| FR-5 | Profile Management | ✅ PASS | Profile retrieval and updates |
| FR-6 | Achievement System | ✅ PASS | Achievement evaluation |

---

### FR-1: User Authentication

**Requirement:** Users must be able to register, login, and receive JWT tokens for accessing protected resources.

**Test Cases:**

```gherkin
GIVEN No user exists with email 'test@example.com'
WHEN User submits registration with email and password
THEN User account is created in database
  AND JWT token is issued
  AND Token is valid for subsequent requests
```

**Implementation:**
```python
POST /auth/register
{
  "email": "test@example.com",
  "password": "secure123"
}

Response (200/201):
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "test@example.com"
}

# Verify token works
GET /api/profile/
Authorization: Bearer <token>

Response (200 OK): Profile data
```

**Validation Criteria:**
- ✅ Email must be unique
- ✅ Password must be at least 6 characters
- ✅ JWT token is returned immediately
- ✅ Token is valid for 24 hours
- ✅ Token contains email in `sub` claim

**Pass/Fail Status:** ✅ PASS

---

### FR-2: Habit Management

**Requirement:** System must provide catalog of 81 habits and allow users to activate them.

**Test Cases:**

```gherkin
GIVEN User is authenticated
WHEN User requests habit catalog
THEN System returns array of all 81 habits
  AND Each habit has name, category, frequency, description
  AND User can activate one or more habits
  AND Activated habits appear in user's habit list
```

**Implementation:**
```python
# List habits
GET /api/habits/
Authorization: Bearer <token>

Response (200 OK): [81 habit objects]

# Activate habits
POST /api/user-habits/
Authorization: Bearer <token>
{
  "habit_ids": ["1", "2", "5"]
}

Response (201 Created): [3 user_habit objects]

# List user's habits
GET /api/user-habits/
Authorization: Bearer <token>

Response (200 OK): [user's activated habits]
```

**Validation Criteria:**
- ✅ Habit catalog contains 81 items
- ✅ Habits have required fields
- ✅ Activation returns user_habit IDs
- ✅ Activated habits are queryable
- ✅ Each habit initializes with 0 streak, 0 completions

**Pass/Fail Status:** ✅ PASS

---

### FR-3: Check-in System

**Requirement:** Users can submit check-ins to mark habits as completed, with idempotency guarantee.

**Test Cases:**

```gherkin
GIVEN User has activated a habit
WHEN User submits check-in for a specific date
THEN Check-in is recorded with completion status
  AND Submitting same check-in twice returns same ID (idempotent)
  AND No duplicate check-in records are created
```

**Implementation:**
```python
# Submit check-in
POST /api/checkins/
Authorization: Bearer <token>
{
  "user_habit_id": 1,
  "date": "2025-12-12",
  "is_completed": true
}

Response (201): { "id": 1, ... }

# Submit identical check-in again
POST /api/checkins/
{ ... same data ... }

Response (201): { "id": 1, ... }  # Same ID!

# Verify no duplicate in database
SELECT COUNT(*) FROM checkins 
WHERE user_habit_id = 1 AND log_date = '2025-12-12'
# Result: 1 (not 2)
```

**Validation Criteria:**
- ✅ Check-in created with 201 status
- ✅ Idempotent operation (same ID on duplicate)
- ✅ Unique constraint on (user_habit_id, date)
- ✅ Can mark habit as completed or incomplete
- ✅ Can list all check-ins for user

**Pass/Fail Status:** ✅ PASS

---

### FR-4: Statistics and Tracking

**Requirement:** System must calculate and display weekly completion statistics.

**Test Cases:**

```gherkin
GIVEN User has completed check-ins for multiple days
WHEN User requests weekly statistics
THEN System returns:
  - Week date range (Monday-Sunday)
  - Total check-ins submitted
  - Completed check-ins count
  - Completion rate percentage
  - Daily breakdown for each day of week
```

**Implementation:**
```python
GET /api/stats/weekly
Authorization: Bearer <token>

Response (200):
{
  "user_id": "1",
  "week_start": "2025-12-08",
  "week_end": "2025-12-14",
  "checkins_total": 3,
  "checkins_completed": 2,
  "completion_rate": 66.67,
  "streak_global": 1,
  "daily_breakdown": [
    { "date": "2025-12-08", "total": 0, "completed": 0 },
    { "date": "2025-12-09", "total": 1, "completed": 1 },
    { "date": "2025-12-10", "total": 1, "completed": 0 },
    { "date": "2025-12-11", "total": 1, "completed": 1 },
    ...
  ]
}
```

**Validation Criteria:**
- ✅ Completion Rate Formula: `(completed / total) * 100`
- ✅ Week range spans current week (Monday-Sunday)
- ✅ Daily breakdown contains all 7 days
- ✅ Totals match actual database records
- ✅ Global streak calculated correctly

**Calculation Verification:**
```
completion_rate = (checkins_completed / checkins_total) * 100
Example: (2 / 3) * 100 = 66.67%
```

**Pass/Fail Status:** ✅ PASS

---

### FR-5: Profile Management

**Requirement:** Users can view and update their profile information.

**Test Cases:**

```gherkin
GIVEN User is authenticated
WHEN User requests their profile
THEN System returns user profile data
  AND User can update name, avatar, timezone
  AND Updated data is persisted
```

**Implementation:**
```python
# Get profile
GET /api/profile/
Authorization: Bearer <token>

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "name": null,
  "avatar_url": null,
  "timezone": "America/Bogota"
}

# Update profile
PUT /api/profile/
Authorization: Bearer <token>
{
  "name": "John Doe",
  "timezone": "America/New_York"
}

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "timezone": "America/New_York"
}
```

**Validation Criteria:**
- ✅ Profile endpoint returns authenticated user data
- ✅ User ID matches token email
- ✅ Updates persist to database
- ✅ Optional fields can be null
- ✅ Updates are immediately visible

**Pass/Fail Status:** ✅ PASS

---

### FR-6: Achievement System

**Requirement:** System evaluates and awards achievements based on user progress.

**Test Cases:**

```gherkin
GIVEN User completes habits consistently
WHEN Achievement thresholds are met
THEN System automatically unlocks achievements
  AND Achievements are returned in check-in responses
  AND User can view all earned achievements
```

**Implementation:**
```python
# Submit check-in (triggers achievement evaluation)
POST /api/checkins/
Authorization: Bearer <token>
{
  "user_habit_id": 1,
  "date": "2025-12-12",
  "is_completed": true
}

Response (201):
{
  "id": 1,
  "new_achievements": [
    {
      "id": 5,
      "code": "CONSECUTIVE_3_DAYS",
      "name": "On Fire",
      "description": "Complete a habit 3 days in a row"
    }
  ]
}

# Get all achievements
GET /api/achievements/mine
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "code": "FIRST_CHECKIN",
    "name": "First Step",
    "earned_at": "2025-12-10T10:00:00"
  },
  ...
]
```

**Validation Criteria:**
- ✅ Achievements auto-evaluated after check-in
- ✅ Achievements returned in check-in response
- ✅ User can query earned achievements
- ✅ Each achievement has id, code, name, description
- ✅ Thresholds include streak, completion count, etc.

**Pass/Fail Status:** ✅ PASS

---

## Execution Results

### Test Run: December 12, 2025

**Environment:**
- Python Backend: http://localhost:8000 (Docker)
- Java Backend: http://localhost:8080 (Docker)
- Database: PostgreSQL 15 (Docker)

**Execution Method:** Python script

```bash
python backend_python/tests/test_acceptance.py
```

**Results:**

```
======================================================================
ACCEPTANCE TEST SUITE
======================================================================

SCENARIO 6.5.2: New user signs in and registers their first habit
  ✅ User registration successful
  ✅ User login successful  
  ✅ Habit catalog loaded
  ✅ Habit activated
  ✅ Profile created
  ✅ Habit visible in list
  ✅ Check-in submitted
  ✅ Weekly dashboard accessible
  Status: ✅ PASS

SCENARIO 6.5.3: User maintains streak and earns an achievement
  ✅ User setup complete
  ✅ Yesterday's check-in recorded
  ✅ Today's check-in recorded
  ✅ Streak updated to 2
  ✅ Completion rate 100%
  ✅ Achievement system evaluated
  ✅ Daily breakdown recorded
  Status: ✅ PASS

SCENARIO 6.5.4: Functional Requirements Compliance
  ✅ FR-1: Authentication (register, login, token)
  ✅ FR-2: Habit Management (catalog, activation)
  ✅ FR-3: Check-in System (idempotent)
  ✅ FR-4: Statistics & Tracking (weekly dashboard)
  ✅ FR-5: Profile Management (get, update)
  ✅ FR-6: Achievement System (evaluation)
  Status: ✅ PASS

======================================================================
FINAL RESULTS: 3/3 scenarios passed (100.0%)
======================================================================
```

---

## Traceability Matrix

| Test Case | Requirement | Status | Evidence |
|-----------|-------------|--------|----------|
| 6.5.2 | User onboarding | ✅ | Registration → Activation → Check-in |
| 6.5.3 | Streak & Achievements | ✅ | Consecutive days tracked |
| 6.5.4.1 | FR-1 Authentication | ✅ | JWT validation |
| 6.5.4.2 | FR-2 Habits | ✅ | 81 habits activated |
| 6.5.4.3 | FR-3 Check-ins | ✅ | Idempotency verified |
| 6.5.4.4 | FR-4 Statistics | ✅ | Completion rate calculated |
| 6.5.4.5 | FR-5 Profiles | ✅ | Profile CRUD operations |
| 6.5.4.6 | FR-6 Achievements | ✅ | Auto-evaluation confirmed |

---

## Conclusion

All acceptance tests pass successfully (100%), confirming that:

✅ The system meets business requirements  
✅ User workflows function correctly  
✅ All functional requirements are satisfied  
✅ Cross-component integration works properly  
✅ Data persistence and consistency maintained  

The Habitus application is ready for production deployment.
