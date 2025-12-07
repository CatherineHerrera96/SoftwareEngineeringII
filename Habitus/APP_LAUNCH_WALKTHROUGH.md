# Habitus MVP Walkthrough

This guide details how to set up, run, and verify the Habitus MVP, including the new **Modern UI** and **Gamification** features.

## 1. Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Java 17+ (Maven)
- Modern Web Browser

## 2. Setup & Run

### Step 1: Database
Start the PostgreSQL database:
```bash
docker-compose up -d postgres
```
*Wait for the database to be ready.*

### Step 2: Java Auth Service
Open a terminal in `backend-java/authservice`:
```bash
./mvnw spring-boot:run
```
*Runs on port 8080.*
> **Note**: For password reset to work, ensure you've updated `frontend-url` and email credentials in `src/main/resources/application.properties`.

### Step 3: Python Habits Service
Open a terminal in `backend_python`:
```bash
# Create venv (use 'py' if 'python' is not in PATH or version issues occur)
py -m venv venv
# OR
python -m venv venv

# Activate venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server (Preferred method to avoid path issues):
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Most Robust Method (if activation fails):
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Runs on port 8000.*

### Step 4: Frontend
The frontend has been refactored with a new modern design.
Open a terminal in `frontend`:
```bash
# Simple HTTP server
python -m http.server 8001
```
*Runs on port 8001.*

## 3. Features Walkthrough

### A. User Profile & Auth
1. Go to `http://localhost:8001`.
2. **Login/Register**: Use the new modern login form.
3. **Profile Dashboard**: View your Avatar, Stats, and Achievements in the new card-based layout.
4. **Edit Profile**: Click "Edit Profile" to slide down the update form.

### B. Habit Management
1. Navigate to **Habits** tab.
2. **Catalog**: Browse system habits using the new category tabs (Wellness, Health, etc.).
3. **Custom Habits**: Click "+ Create Custom Habit" to open the new creation form.
4. **Track**: Select habits to track. The UI now supports bulk selection saving.

### C. Daily Tracking & Gamification
1. Navigate to **Daily Checklist** tab (on Profile page).
2. **Check-in**: Mark habits as done with the new check buttons.
3. **Delete**: You can now remove habits directly from the daily list using the trash icon.
4. **Progress**: Watch the daily progress bar fill up.
5. **Achievements**: Unlock badges like "Early Bird" or "Scholar".

## 4. Verification

### Automated Verification
Run the verification script to test the full backend flow:
```bash
python verify_flow.py
```
*This script registers a user, creates a custom habit, checks it in, and verifies streaks/achievements.*

### Manual Verification
1. **Login**: Verify you land on the Profile page with the new design.
2. **Create Habit**: Create a habit "Test Habit" (Daily).
3. **Check-in**: Go to Daily Checklist, mark "Test Habit" as done.
4. **Verify Streak**: Refresh page, see "🔥 1 day" badge.
5. **Verify Achievement**: Go to Profile, see "First Step" achievement unlocked.
6. **Verify Email**: Send a test email via `POST http://localhost:8080/auth/test-email?email=YOUR_EMAIL` (or use Postman/Curl) to verify SMTP settings.

## 5. Troubleshooting
- **CORS Errors**: Ensure Java (8080) and Python (8000) allow origin `http://localhost:8001`.
- **Database**: If schema errors occur, run `docker-compose down -v` and restart to re-init schema.
- **Docker Service**: Note that the database service is named `postgres`, not `db`.
- **"Fatal error in launcher" / "No module named uvicorn"**: You might be using the wrong virtual environment or a broken shim. Ensure you are in `backend_python` and using `backend_python/venv`. Try deleting `venv` and recreating it, or use `python -m uvicorn ...` instead of just `uvicorn`.
- **"Unable to copy ... venvlauncher.exe"**: This means a Python process is likely locking the file. Open Task Manager and kill all `python.exe` processes, or run `taskkill /F /IM python.exe` in the terminal, then try recreating the venv.
- **"ERR_CONNECTION_REFUSED" on specific IP**: If your frontend uses a specific IP (e.g. Hamachi), valid that `uvicorn` is running with `--host 0.0.0.0` to listen on all interfaces, not just localhost.
