# Habitus

**Build Habits. Maintain Streaks. Unlock Your Potential.**

Habitus is a gamified habit-tracking system designed to help you build and maintain healthy routines. Inspired by apps like Duolingo, it features streak protection, achievements, and seasonal themes to keep you motivated.

## 🌟 High-Level Features

- **Auth & Profile System**: Secure JWT-based authentication with customizable user profiles (avatars, bio).
- **Habit Catalog**: Browse pre-defined habits (Wellness, Health, etc.) or create your own custom habits.
- **Daily Checklist & Streaks**: Mark habits as done daily. Streaks are tracked with "streak freeze" logic and visual indicators.
- **Gamification**:
    - **Achievements**: Unlock Bronze, Silver, and Gold medals for streaks and completion milestones.
    - **Stats**: View weekly completion percentages and streak history.
- **Dynamic UI**:
    - **Seasonal Themes**: Enjoy time-limited themes (e.g., "The 100", "Winter Wonderland").
    - **Dark Mode**: Fully supported system-wide dark mode.
    - **Responsive Design**: Works on desktop and mobile.

## 🛠️ Tech Stack

**Frontend**
- **Vanilla JS**: Modular architecture (ES6 Modules)
- **HTML5 & CSS3**: Modern variables-based styling, no external frameworks.
- **Path**: `/frontend`

**Auth Backend**
- **Java / Spring Boot**: Handles user registration, login, JWT issuance, and password management.
- **Path**: `/backend-java/authservice`

**Habit Backend**
- **Python / FastAPI**: Manages habits, check-ins, streak logic, stats, and achievements.
- **Path**: `/backend_python`

**Database**
- **PostgreSQL**: Relational database for all user and habit data.
- **Infrastructure**: Managed via Docker Compose.

## 🚀 Quick Start

For a detailed step-by-step setup guide, please refer to **[WALKTHROUGH.md](./WALKTHROUGH.md)**.

### Prerequisites
- **Git**
- **Docker Desktop**

### Minimal Setup Commands

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd Habitus
   ```

2. **Run Docker**
   ```bash
   cd Habitus
   docker-compose up -d
   ```

All done!

## 📂 Project Structure

```
Habitus/
├── backend-java/           # Spring Boot Auth Service
│   └── authservice/
├── backend_python/         # FastAPI Habit & Streak Service
│   ├── api/                # API Endpoints
│   ├── logic/              # Streak & Achievement Engines
│   └── main.py             # Entry point
├── db/                     # Database schemas and seeds
├── frontend/               # Single Page Application
│   ├── css/
│   ├── js/
│   └── index.html
├── docker-compose.yml      # DB & pgAdmin Orchestration
├── ARCHITECTURE.md         # Technical internal documentation
├── WALKTHROUGH.md          # Step-by-step setup guide
└── README.md               # You are here
```

## 🧪 Environments

The system supports two major modes for controlling time/streaks, configured via environment variables in the Python backend:

1. **Production Mode** (`STREAK_MODE=production`):
   - Standard daily habits. Streak window expires at local midnight.
2. **Test Mode** (`STREAK_MODE=test`):
   - Accelerated time. Streak windows last for 60 seconds (or configurable `STREAK_INTERVAL_SECONDS`). Use this for quick demos of breaking/keeping streaks.

*See [WALKTHROUGH.md](./WALKTHROUGH.md) for details on how to switch modes.*

## 🤝 Contributing

We welcome contributions!
- **Branching**: PLease create a feature branch (`feature/my-cool-feature`) off `main`.
- **PRs**: Submit a Pull Request with a clear description of changes.
- **Code Style**:
    - Python: PEP 8 guidelines.
    - Java: Standard Java conventions.
    - JS: Clean, modular ES6+.

## 📄 License

This project is open source.
