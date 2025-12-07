# Backend - Habitus Python Service

This service handles the core business logic for Habitus, including habit tracking, streaks, and achievements.

## Tech Stack
- **FastAPI**: RESTful API framework.
- **SQLAlchemy**: ORM for PostgreSQL.
- **Pydantic**: Data validation and schema definition.

## Setup & Running

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Migration:**
   This project uses a custom migration script for the streak system.
   ```bash
   python migrate_streaks.py
   ```

3. **Run the Server:**
   ```bash
   python main.py
   ```
   Server runs on `http://0.0.0.0:8000`.

## Configuration (Environment Variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | Connection string for PostgreSQL |
| `STREAK_MODE` | `daily` | `daily` (24h cooldown) or `test` (short intervals) |
| `STREAK_INTERVAL_SECONDS` | `60` | Duration of interval in `test` mode |

### Streak Modes
- **Daily Mode**: Habits can be checked once per calendar day. Cooldown resets at midnight or after 24 hours depending on logic.
- **Test Mode**: Habits can be checked every `STREAK_INTERVAL_SECONDS` (default 60s). exact timestamps are used.

## API Endpoints

### Habits
- `GET /api/user-habits/`: List today's checklist with streak status.
- `POST /api/user-habits/{id}/assign`: Assign a habit to the user.
- `DELETE /api/user-habits/{id}`: Delete a habit (requires confirmation if active streak).

### Check-ins
- `POST /api/checkins/`: Complete a habit for the current interval.
  - Returns `200 OK` with streak info if successful.
  - Returns `409 Conflict` if cooldown is active (with `lock_until` time).

### Achievements
- `GET /api/achievements/mine`: List unlocked achievements.
- `GET /api/achievements/`: List all available achievements.

## Testing
Run the test suite with:
```bash
pytest
```