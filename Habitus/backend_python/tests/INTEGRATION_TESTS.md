# Integration Tests Documentation

## 6.4 Integration Tests (Pruebas de Integración)

This document describes the integration tests for the Habitus backend, covering the complete user flow from authentication to weekly statistics.

---

## 6.4.1 Complete Authentication → Habit Activation → Check-in Flow

### Overview
Integration tests validate the end-to-end functionality of the application by testing the complete user journey:

1. **User Registration** - Creating a new account
2. **User Authentication** - Logging in and receiving JWT token
3. **Profile Retrieval** - Fetching user profile data
4. **Habit Catalog** - Listing available habits
5. **Habit Activation** - Adding habits to user's profile
6. **Check-in Submission** - Marking habits as completed
7. **Idempotent Check-ins** - Ensuring duplicate check-ins update instead of creating duplicates
8. **User Habits List** - Retrieving active habits with completion status

### Test Cases

#### Test 6.4.1.1: User Registration
**Endpoint:** `POST http://localhost:8080/auth/register`

**Request:**
```json
{
  "email": "integration_test_20251212123456@test.com",
  "password": "testpass123"
}
```

**Expected Response:** `201 Created`
```json
{
  "message": "User registered successfully"
}
```

**Validation:**
- Status code is 201
- User is created in database
- Email is unique

---

#### Test 6.4.1.2: User Authentication
**Endpoint:** `POST http://localhost:8080/auth/login`

**Request:**
```json
{
  "email": "integration_test_20251212123456@test.com",
  "password": "testpass123"
}
```

**Expected Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "integration_test_20251212123456@test.com"
}
```

**Validation:**
- Status code is 200
- JWT token is returned
- Token contains user email in `sub` claim

---

#### Test 6.4.1.3: Profile Retrieval
**Endpoint:** `GET http://localhost:8000/api/profile/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Expected Response:** `200 OK`
```json
{
  "id": 123,
  "email": "integration_test_20251212123456@test.com",
  "name": null,
  "avatar_url": null,
  "timezone": null
}
```

**Validation:**
- Status code is 200
- Profile data matches registered user
- User ID is present

---

#### Test 6.4.1.4: List Available Habits
**Endpoint:** `GET http://localhost:8000/api/habits/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Morning Exercise",
    "category": "health",
    "frequency": "daily",
    "description": "Start your day with 30 minutes of exercise",
    "is_custom": false,
    "season_id": null,
    "user_id": null
  },
  ...
]
```

**Validation:**
- Status code is 200
- Array of habits is returned
- Each habit has required fields

---

#### Test 6.4.1.5: Habit Activation
**Endpoint:** `POST http://localhost:8000/api/user-habits/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "habit_ids": ["1"]
}
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": 456,
    "habit_id": 1,
    "habit_name": "Morning Exercise",
    "habit_category": "health",
    "is_completed": false,
    "current_streak": 0,
    "longest_streak": 0,
    "total_completions": 0,
    "lock_until": null,
    "is_active": true,
    "streak_broken": false,
    "previous_streak": 0
  }
]
```

**Validation:**
- Status code is 200
- User habit is created with `is_active = true`
- User habit ID is returned for future check-ins

---

#### Test 6.4.1.6: Check-in Submission
**Endpoint:** `POST http://localhost:8000/api/checkins/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "user_habit_id": 456,
  "date": "2025-12-12",
  "is_completed": true
}
```

**Expected Response:** `201 Created`
```json
{
  "id": 789,
  "user_habit_id": 456,
  "log_date": "2025-12-12",
  "is_completed": true,
  "new_achievements": []
}
```

**Validation:**
- Status code is 201
- Check-in is created
- Date matches request
- `is_completed` is true

---

#### Test 6.4.1.7: Idempotent Check-in (Duplicate Prevention)
**Endpoint:** `POST http://localhost:8000/api/checkins/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:** (Same as previous check-in)
```json
{
  "user_habit_id": 456,
  "date": "2025-12-12",
  "is_completed": true
}
```

**Expected Response:** `201 Created`
```json
{
  "id": 789,
  "user_habit_id": 456,
  "log_date": "2025-12-12",
  "is_completed": true,
  "new_achievements": []
}
```

**Validation:**
- Status code is 201
- Same check-in ID is returned (not a new record)
- No duplicate check-in created in database

---

#### Test 6.4.1.8: List User's Active Habits
**Endpoint:** `GET http://localhost:8000/api/user-habits/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": 456,
    "habit_id": 1,
    "habit_name": "Morning Exercise",
    "habit_category": "health",
    "is_completed": true,
    "current_streak": 1,
    "longest_streak": 1,
    "total_completions": 1,
    "lock_until": null,
    "is_active": true,
    "streak_broken": false,
    "previous_streak": 0
  }
]
```

**Validation:**
- Status code is 200
- User's active habits are returned
- `is_completed` reflects today's check-in status
- Streak counters are updated

---

## 6.4.2 Weekly Dashboard Validation

### Test Case: Weekly Statistics
**Endpoint:** `GET http://localhost:8000/api/stats/weekly`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Expected Response:** `200 OK`
```json
{
  "user_id": "123",
  "week_start": "2025-12-08",
  "week_end": "2025-12-14",
  "checkins_total": 1,
  "checkins_completed": 1,
  "completion_rate": 100.0,
  "habits_by_category": {
    "health": 1
  },
  "daily_breakdown": [
    {
      "date": "2025-12-08",
      "total": 0,
      "completed": 0
    },
    ...
    {
      "date": "2025-12-12",
      "total": 1,
      "completed": 1
    },
    ...
  ]
}
```

**Validation:**
- Status code is 200
- Week range is current week (Monday to Sunday)
- `checkins_total` matches number of check-ins
- `checkins_completed` matches completed check-ins
- `completion_rate` is calculated correctly: (completed/total) * 100
- Daily breakdown shows per-day statistics

**Calculation Verification:**
```
completion_rate = (checkins_completed / checkins_total) * 100
Example: (1 / 1) * 100 = 100.0%
```

---

## 6.4.3 How Integration Tests Were Executed

### Method 1: Python Script (Recommended)

The integration tests are automated in a Python script that can be run with a single command.

**Prerequisites:**
- Backend services running (Docker containers or local)
- Python 3.10+ installed
- `requests` library installed

**Execution Steps:**

1. **Start backend services:**
   ```bash
   cd /home/juandavid/Documents/SoftwareEngineeringII/Habitus
   docker compose up -d
   ```

2. **Verify services are running:**
   ```bash
   docker compose ps
   ```
   
   Expected output:
   - `habitus-python-1` on port 8000
   - `habitus-java-1` on port 8080
   - `habitus_db` (PostgreSQL) on port 5432

3. **Run integration tests:**
   ```bash
   cd backend_python/tests
   python test_integration.py
   ```

**Example Output:**
```
======================================================================
HABITUS INTEGRATION TEST SUITE
Testing complete flow: Auth → Habit Activation → Check-in → Stats
======================================================================

======================================================================
STEP 1: User Registration
======================================================================
Registering user: integration_test_20251212153045@test.com
Status Code: 201
Response: {"message":"User registered successfully"}
✅ User registration successful

...

======================================================================
TEST RESULTS SUMMARY
======================================================================
6.4.1.1: User Registration              ✅ PASS
6.4.1.2: User Login                     ✅ PASS
6.4.1.3: Get Profile                    ✅ PASS
6.4.1.4: List Habits                    ✅ PASS
6.4.1.5: Activate Habit                 ✅ PASS
6.4.1.6: Submit Check-in                ✅ PASS
6.4.1.7: Idempotent Check-in            ✅ PASS
6.4.2: Weekly Dashboard                 ✅ PASS
6.4.1.8: List User Habits               ✅ PASS

======================================================================
Total: 9/9 tests passed (100.0%)
======================================================================
```

---

### Method 2: cURL Commands

Manual testing using cURL commands for each endpoint.

**1. Register User:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpass123"
  }'
```

**2. Login User:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpass123"
  }'
```

**Save the token from response:**
```bash
TOKEN="<paste_token_here>"
```

**3. Get Profile:**
```bash
curl -X GET http://localhost:8000/api/profile/ \
  -H "Authorization: Bearer $TOKEN"
```

**4. List Habits:**
```bash
curl -X GET http://localhost:8000/api/habits/ \
  -H "Authorization: Bearer $TOKEN"
```

**5. Activate Habit:**
```bash
curl -X POST http://localhost:8000/api/user-habits/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "habit_ids": ["1"]
  }'
```

**Save the user_habit_id from response:**
```bash
USER_HABIT_ID="<paste_id_here>"
```

**6. Submit Check-in:**
```bash
curl -X POST http://localhost:8000/api/checkins/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_habit_id": '$USER_HABIT_ID',
    "date": "'$(date +%Y-%m-%d)'",
    "is_completed": true
  }'
```

**7. Get Weekly Stats:**
```bash
curl -X GET http://localhost:8000/api/stats/weekly \
  -H "Authorization: Bearer $TOKEN"
```

**8. List User Habits:**
```bash
curl -X GET http://localhost:8000/api/user-habits/ \
  -H "Authorization: Bearer $TOKEN"
```

---

### Method 3: Postman Collection

**Setup:**

1. **Create a new Postman Collection** named "Habitus Integration Tests"

2. **Set Collection Variables:**
   - `base_url`: `http://localhost:8000/api`
   - `auth_url`: `http://localhost:8080/auth`
   - `token`: (will be set automatically after login)
   - `user_habit_id`: (will be set automatically after activation)

3. **Import Requests:**

   Create the following requests in order:

   **a) Register User**
   - Method: POST
   - URL: `{{auth_url}}/register`
   - Body (raw JSON):
     ```json
     {
       "email": "postman_test@example.com",
       "password": "testpass123"
     }
     ```

   **b) Login User**
   - Method: POST
   - URL: `{{auth_url}}/login`
   - Body (raw JSON):
     ```json
     {
       "email": "postman_test@example.com",
       "password": "testpass123"
     }
     ```
   - Tests (JavaScript):
     ```javascript
     var jsonData = pm.response.json();
     pm.collectionVariables.set("token", jsonData.token);
     ```

   **c) Get Profile**
   - Method: GET
   - URL: `{{base_url}}/profile/`
   - Headers: `Authorization: Bearer {{token}}`

   **d) List Habits**
   - Method: GET
   - URL: `{{base_url}}/habits/`
   - Headers: `Authorization: Bearer {{token}}`

   **e) Activate Habit**
   - Method: POST
   - URL: `{{base_url}}/user-habits/`
   - Headers: 
     - `Authorization: Bearer {{token}}`
     - `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "habit_ids": ["1"]
     }
     ```
   - Tests (JavaScript):
     ```javascript
     var jsonData = pm.response.json();
     if (jsonData.length > 0) {
       pm.collectionVariables.set("user_habit_id", jsonData[0].id);
     }
     ```

   **f) Submit Check-in**
   - Method: POST
   - URL: `{{base_url}}/checkins/`
   - Headers: 
     - `Authorization: Bearer {{token}}`
     - `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "user_habit_id": {{user_habit_id}},
       "date": "2025-12-12",
       "is_completed": true
     }
     ```

   **g) Get Weekly Stats**
   - Method: GET
   - URL: `{{base_url}}/stats/weekly`
   - Headers: `Authorization: Bearer {{token}}`

   **h) List User Habits**
   - Method: GET
   - URL: `{{base_url}}/user-habits/`
   - Headers: `Authorization: Bearer {{token}}`

4. **Run Collection:**
   - Click "Run collection" button
   - All tests will execute in sequence
   - Review results in Collection Runner

---

## Test Results and Validation

### Success Criteria

All integration tests should pass with the following validations:

✅ **Authentication Flow**
- User can register with unique email
- User can login and receive valid JWT token
- Token is accepted by Python backend endpoints

✅ **Habit Management**
- User can view available habits catalog
- User can activate habits to their profile
- Activated habits appear in user's habit list

✅ **Check-in Flow**
- User can submit check-ins for active habits
- Check-ins update existing records (idempotent)
- Check-in status is reflected in user habits list

✅ **Weekly Dashboard**
- Weekly stats calculate correct date range
- Completion rate formula: (completed/total) * 100
- Daily breakdown shows per-day statistics
- Category breakdown aggregates by habit category

### Common Issues and Troubleshooting

**Issue: "Could not validate credentials" (401)**
- **Cause:** JWT token mismatch between Java and Python backends
- **Solution:** Verify both backends use same `SECRET_KEY`

**Issue: "User not found" (404)**
- **Cause:** User registered in Java but not found by Python
- **Solution:** Verify both backends connect to same PostgreSQL database

**Issue: "User habit not found" (404)**
- **Cause:** Invalid user_habit_id or habit not activated
- **Solution:** Ensure habit activation step completed successfully

**Issue: Empty weekly stats**
- **Cause:** No check-ins submitted yet
- **Solution:** Submit at least one check-in before requesting stats

---

## Continuous Integration

### GitHub Actions Workflow (Future Implementation)

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
          POSTGRES_DB: habitus
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r backend_python/requirements.txt
      
      - name: Start backend services
        run: |
          docker compose up -d
          sleep 10
      
      - name: Run integration tests
        run: |
          cd backend_python/tests
          python test_integration.py
```

---

## Conclusion

The integration tests provide comprehensive validation of the Habitus application's core functionality. By testing the complete user journey from registration to weekly statistics, we ensure that all components work together correctly and that the API contracts are maintained.

**Test Coverage:**
- ✅ Authentication (registration, login, JWT validation)
- ✅ Profile management
- ✅ Habit catalog and activation
- ✅ Check-in submission and idempotency
- ✅ Weekly statistics calculation
- ✅ Cross-service communication (Java ↔ Python)

**Execution Methods:**
- ✅ Automated Python script (recommended)
- ✅ Manual cURL commands
- ✅ Postman collection
- ✅ CI/CD integration (GitHub Actions)
