# Habitus - End-to-End Walkthrough

This document is a complete guide to setting up, running, and using Habitus. It is written for developers and teammates who need to get the system running from zero.

---

## 1. Prerequisites

Before you start, ensure you have the following installed:

- **Git**: For version control.
- **Docker Desktop**: For running the PostgreSQL database and pgAdmin.
- **Java 17+**: Required for the Authentication Service (Spring Boot).
- **Python 3.10+**: Required for the Habits Service (FastAPI).
- **Web Browser**: Chrome, Firefox, or Edge.

### Environment Variables
The application uses default values for development, but you should be aware of:

- **Database**:
    - `POSTGRES_USER`: `postgres`
    - `POSTGRES_PASSWORD`: `password`
    - `POSTGRES_DB`: `habitus`
- **Auth Service (Java)**:
    - `spring.datasource.url`: Defaults to `jdbc:postgresql://localhost:5432/habitus`
    - `spring.mail.host`: Defaults to Mailtrap for dev.
- **Habits Service (Python)**:
    - `STREAK_MODE`: `production` (default) or `test`.

---

## 2. Setup & Installation

### 2.1. Clone the Repository

```bash
git clone <your-repo-url>
cd Habitus
```

### 2.2. Start the Database

We use Docker Compose to spin up PostgreSQL and pgAdmin.

```bash
docker-compose up -d
```

- **PostgreSQL** runs on port `5432`.
- **pgAdmin** runs on port `5050` (http://localhost:5050).
    - Default login: `admin@admin.com`
    - Default password: `admin`

**Note:** The database schema is initialized automatically via the volume mapping in `docker-compose.yml` (`./db:/docker-entrypoint-initdb.d`), which runs `habitusTables.sql` and `seedData.sql` on the first run.

If you ever need to reset the DB:
```bash
docker-compose down -v
docker-compose up -d
```

### 2.3. Run Java Auth Service

This service handles login, registration, and user profiles.

1. Open a terminal in `backend-java/authservice`.
2. Run the application using the Maven wrapper:

```bash
cd backend-java/authservice
# Windows
.\mvnw.cmd spring-boot:run
# Mac/Linux
./mvnw spring-boot:run
```

- **Port**: `8080`
- **Verification**: Go to http://localhost:8080/auth/health (if endpoint exists) or just check console for "Started AuthApplication".

### 2.4. Run Python Habits Service

This service handles habits, check-ins, streaks, and achievements.

1. Open a terminal in `backend_python`.
2. Create and activate a virtual environment (recommended):

```bash
cd backend_python

# Create venv
python -m venv venv

# Activate venv
# Windows:
.\venv\Scripts\Activate
# Mac/Linux:
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```
*Note: If you encounter issues with `psycopg2`, try installing `psycopg2-binary` manually.*

4. Run the server:

```bash
# This command ensures it listens on all interfaces (important for some network setups)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Port**: `8000`
- **Docs**: Visit http://localhost:8000/docs to see the Swagger UI.

### 2.5. Run the Frontend

The frontend is a vanilla JS application. You just need to serve the static files.

1. Open a terminal in `frontend`.
2. Serves files using Python's built-in HTTP server:

```bash
cd frontend
python -m http.server 8001
```

- **Access URL**: http://localhost:8001

---

## 3. Using the App

### 3.1. Register & Login
1. Navigate to http://localhost:8001.
2. If not logged in, you will see the **Login** screen.
3. Click "Create account" to register.
4. Enter an email and password.
    - *Note*: In dev mode, email verification is skipped.

### 3.2. Profile Management
After logging in, you land on the **Profile** page.
- **Avatar**: You can change your avatar in the "Edit Profile" section.
- **Dark Mode**: Toggle the moon/sun icon in the top right.
- **Seasonal Themes**: The app may automatically apply a theme based on the season or active events.

### 3.3. Habit Catalog & Custom Habits
1. Go to the **Habits** tab.
2. **Catalog**: Browse categories like Wellness, Health, etc. Select habits you want to track.
3. **Custom Habits**: Click the "Create Custom Habit" button.
    - Name your habit (e.g., "Read 10 pages").
    - Set frequency (currently defaulting to Daily).
    - Save it. It will appear in your "My Habits" list.

### 3.4. Daily Checklist & Streaks
1. Go to the **Daily Checklist** tab (or check the main dashboard).
2. You will see your active habits for the day.
3. **Mark as Done**: Click the checkmark.
    - The item turns green.
    - Your **Current Streak** increases by 1 (if you tracked yesterday too, or if it's day 1).
    - A "Streak Freeze" icon might appear if you missed a day but had a freeze available (future feature).
4. **Broken Streak**: If you miss a day (and time expires), the streak resets to 0.

### 3.5. Achievements
1. Check the **Achievements** section on your Profile.
2. **Stats Cards**: View your Weekly Completion % and Best Streak.
3. **Badges**:
    - **Unlocked**: Full color badges (e.g., "First Step" for 1 completion).
    - **Locked**: Greyed out badges with descriptions of how to unlock them.
4. **Toasts**: When you trigger an achievement (e.g., reaching a 3-day streak), a popup toast will appear on screen instantly.

---

## 4. Modes: Test vs Production

The behavior of streaks depends on the `STREAK_MODE` environment variable in the Python backend.

### 4.1. Production Mode (Default)
- **Config**: `STREAK_MODE=production`
- **Behavior**:
    - The "Day" ends at **midnight local server time**.
    - If you check in today, your streak increments.
    - If you don't check in by midnight, your streak resets to 0 the next time you check.

### 4.2. Test Mode (For Demos)
- **Config**: `STREAK_MODE=test`
- **Streak Interval**: Defaults to 60 seconds (`STREAK_INTERVAL_SECONDS=60`).
- **Use Case**: This is critical for demonstrating the "Streak Broken" logic without waiting 24 hours.
    - Mark a habit as done.
    - Wait > 60 seconds.
    - The system considers the "day" passed.
    - If you didn't check in again, the streak breaks.
- **How to Activate**:
    - Stop the Python server.
    - Set env var:
      ```bash
      # Windows PowerShell
      $env:STREAK_MODE="test"
      
      # Mac/Linux
      export STREAK_MODE=test
      ```
    - Restart the Python server.

---

## 5. Troubleshooting Common Issues

- **CORS Errors**: If the frontend says "Network Error" or console shows CORS issues:
    - Ensure Python backend is running on port 8000.
    - Ensure Java backend is running on port 8080.
    - Check browser console for specific error details.

- **Check-in not saving**:
    - Check Python console logs.
    - Ensure your token hasn't expired (try logging out and back in).

- **Database Connection Refused**:
    - Ensure Docker container is running (`docker ps`).
    - Check if port 5432 is already in use by a local Postgres installation.

- **"No module named uvicorn"**:
    - Ensure you activated the virtual environment (`venv`) before running `uvicorn`.
