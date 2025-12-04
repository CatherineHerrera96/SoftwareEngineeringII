# Habitus - Habit Tracking MVP

**Habitus** is a habit-tracking application designed to help users build and maintain healthy routines. This MVP (Minimum Viable Product) demonstrates a full-stack architecture with separate authentication and habit management services.

## 🏗️ Architecture Overview

The project follows a microservices-inspired architecture with clear separation of concerns:

- **Java Auth Backend** - Spring Boot service handling user authentication and JWT token generation
- **Python Habits Backend** - FastAPI service managing habit catalogs, user habits, check-ins, and statistics
- **PostgreSQL Database** - Relational database storing users, habits, and tracking data
- **Vanilla JS Frontend** - Single-page application with modular view architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│ Java Auth    │────▶│ PostgreSQL  │
│  (Port 8001)│     │ (Port 8080)  │     │ Database    │
│             │     └──────────────┘     └─────────────┘
│             │            │                     ▲
│             │            │                     │
│             │     ┌──────▼──────┐             │
│             │────▶│ Python API  │─────────────┘
└─────────────┘     │ (Port 8000) │
                    └─────────────┘
```

## ✨ MVP Features

### User Authentication
- **Registration** - Create new user accounts with email/password
- **Login** - Authenticate and receive JWT tokens
- **Session Management** - Persistent sessions via localStorage

### Habit Management
- **Habit Catalog** - Browse and select from predefined habits across categories (Wellness, Health, Academic, Work)
- **Personal Habits** - Save selected habits to your profile
- **Habit Tracking** - Mark habits as complete or missed each day

### Progress Tracking
- **Daily Checklist** - View and check off today's habits with visual progress bar
- **Weekly Dashboard** - See completion rates, current streak, and 7-day trends
- **Achievements** - Unlock achievements based on habit completion milestones

### Profile View
- **Unified Home** - Central hub showing user info, daily checklist, and weekly stats
- **Profile Editing** - Update display name, avatar, and timezone preferences

## 🚀 How to Run the MVP

### Prerequisites

- **Docker & Docker Compose** - For PostgreSQL database
- **Java 17+** - For the authentication service
- **Python 3.9+** - For the habits API service
- **pip** - Python package manager

### Setup Steps

1. **Start the Database**
   ```bash
   # From project root
   docker-compose up -d
   ```

2. **Initialize the Database**
   ```bash
   # Connect to PostgreSQL (password: habituspass)
   docker exec -it habitus-db psql -U habitususer -d habitusdb
   
   # Run the schema and seed data
   \i /docker-entrypoint-initdb.d/habitusTables.sql
   \i /docker-entrypoint-initdb.d/seedData.sql
   \q
   ```

3. **Start the Java Auth Service**
   ```bash
   cd backend-java/authservice
   
   # Build the project
   ./mvnw clean package -DskipTests  # On Windows: .\mvnw.cmd clean package -DskipTests
   
   # Run the service (from authservice directory)
   java -jar target/authservice-0.0.1-SNAPSHOT.jar
   ```
   The auth service will start on `http://localhost:8080`

4. **Start the Python Habits Service**
   ```bash
   # From project root
   pip install -r backend_python/requirements.txt
   
   # Run with uvicorn
   python -m uvicorn backend_python.main:app --reload --port 8000
   ```
   The habits API will be available at `http://localhost:8000`

5. **Serve the Frontend**
   ```bash
   cd frontend
   python -3 -m http.server 8001
   ```
   Access the application at `http://localhost:8001`

> 💡 **Tip**: For detailed step-by-step instructions including troubleshooting, see [MVP_WALKTHROUGH.md](./MVP_WALKTHROUGH.md)

## 🗺️ Application Routing & Structure

### View Hierarchy

The frontend follows a single-page application (SPA) pattern with client-side routing:

```
┌─────────────────────────────────────────────┐
│ App Entry (main.js)                         │
│  ├─ Router (router.js)                      │
│  ├─ Global State (state.js)                 │
│  └─ Navigation Handler                      │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Unauthenticated        Authenticated
        │                       │
   ┌────▼────┐           ┌──────▼──────┐
   │ Login   │           │  Profile    │ (Default home)
   │ Register│           │  ├─ Daily   │
   └─────────┘           │  └─ Weekly  │
                         ├─────────────┤
                         │  Habits     │ (Catalog selection)
                         └─────────────┘
```

### Main Views

**Login View** (`loginView.js`)
- Entry point for unauthenticated users
- Handles registration and login forms
- Communicates with Java auth backend via `authApi.js`
- Stores JWT token in state and localStorage on success

**Profile View** (`profileView.js`)
- Home screen for authenticated users
- Displays user information (email, display name, avatar)
- Integrates two sub-views:
  - **Daily Checklist** - Today's habits with completion tracking
  - **Weekly Progress** - Statistics and achievement summary
- Allows editing profile fields (name, avatar URL, timezone)

**Habits View** (`habitsView.js`)
- Browse habit catalog with category filters
- Select/deselect habits to track
- Saves selections to user profile via Python backend
- Uses `habitsApi.js` for all API communication

**Daily Checklist View** (`dailyChecklistView.js`)
- Lists user's active habits for today
- "Done" / "Missed" buttons to mark completion
- Visual progress bar showing completion percentage
- Embedded in Profile view's "Daily" tab

**Dashboard View** (`dashboardView.js`)
- Weekly completion rate display
- Current streak counter
- Achievement cards with unlock status
- Embedded in Profile view's "Weekly" tab

### Frontend Architecture

```
frontend/
├── index.html              # Main HTML structure
├── css/
│   └── base.css           # Unified styles
└── js/
    ├── main.js            # App initialization / Inicialización de la app
    ├── router.js          # View routing logic / Lógica de enrutamiento
    ├── state.js           # Global state management / Gestión de estado global
    ├── components/
    │   └── notifications.js  # Toast notification system / Sistema de notificaciones
    ├── views/             # UI modules / Módulos de interfaz
    │   ├── loginView.js
    │   ├── profileView.js
    │   ├── habitsView.js
    │   ├── dailyChecklistView.js
    │   └── dashboardView.js
    └── api/               # HTTP clients / Clientes HTTP
        ├── authApi.js     # Calls Java backend / Llama al backend Java
        └── habitsApi.js   # Calls Python backend / Llama al backend Python
```

**Key Components:**
- **`main.js`** - Application entry point, sets up event listeners and initializes views
- **`router.js`** - Maps navigation states to view render functions, handles auth checks
- **`state.js`** - Manages global application state (auth token, user data, habits)
- **`views/*`** - Render functions for each screen, handle UI interactions
- **`api/*`** - HTTP request wrappers with error handling and token management

### Data Flow

1. **Authentication Flow**
   ```
   LoginView → authApi.login() → Java Backend → JWT Token → state.setAuth() → Navigate to Profile
   ```

2. **Habit Selection Flow**
   ```
   HabitsView → habitsApi.saveUserHabits() → Python Backend → Database → Success Notification
   ```

3. **Daily Check-in Flow**
   ```
   DailyChecklistView → habitsApi.saveDailyStatus() → Python Backend → Update Completion → Refresh UI
   ```

## 📁 Project Structure

```
Habitus/
├── backend-java/
│   └── authservice/              # Spring Boot authentication service
│       ├── src/main/java/com/habitus/authservice/
│       │   ├── controller/       # REST endpoints for auth
│       │   ├── service/          # Business logic layer
│       │   ├── repository/       # Data access interfaces
│       │   ├── entity/           # JPA entities (User)
│       │   ├── dto/              # Data transfer objects
│       │   ├── security/         # JWT & security config
│       │   └── config/           # Spring configuration
│       ├── src/main/resources/
│       └── pom.xml               # Maven dependencies
│
├── backend_python/               # FastAPI habits service
│   ├── api/                      # Route handlers
│   │   ├── habits.py
│   │   ├── user_habits.py
│   │   ├── checkins.py
│   │   ├── stats.py
│   │   ├── achievements.py
│   │   └── profile.py
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── crud.py                   # Database operations
│   ├── auth_deps.py              # JWT validation dependency
│   ├── db.py                     # Database connection
│   ├── main.py                   # FastAPI app entry
│   └── requirements.txt
│
├── db/                           # Database initialization
│   ├── habitusTables.sql         # Schema definition
│   └── seedData.sql              # Initial data (habits catalog)
│
├── frontend/                     # Static web application
│   ├── index.html
│   ├── css/
│   │   └── base.css
│   ├── js/
│   │   ├── main.js
│   │   ├── router.js
│   │   ├── state.js
│   │   ├── components/
│   │   ├── views/
│   │   └── api/
│   └── assets/
│
├── docker-compose.yml            # PostgreSQL container setup
├── README.md                     # This file
└── MVP_WALKTHROUGH.md            # Detailed setup guide
```

## 🔧 Development Notes

### Design Principles

This MVP demonstrates separation of concerns across layers:

- **Controller Layer** (Java/Python) - Handles HTTP requests and responses
- **Service Layer** (Java) / **CRUD Layer** (Python) - Contains business logic
- **Data Layer** - Database access through JPA repositories and SQLAlchemy
- **Frontend Modules** - Clear boundaries between views, API clients, and state

### Current Limitations (MVP Scope)

- **Single-tenant** - No multi-organization support
- **Basic validation** - Limited input sanitization
- **No password recovery** - Would require email service integration
- **Client-side routing** - No server-side rendering or SEO optimization
- **Minimal error handling** - Production would need comprehensive logging

### Technology Stack

**Backend:**
- Java 17, Spring Boot 3.x, Spring Security, JWT
- Python 3.9+, FastAPI, SQLAlchemy, Pydantic
- PostgreSQL 14+

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- CSS3 (no preprocessor)
- Native Fetch API (no axios/jQuery)

## 📚 Additional Documentation

- **[MVP_WALKTHROUGH.md](./MVP_WALKTHROUGH.md)** - Complete step-by-step setup guide with troubleshooting
- **API Documentation** - Visit `http://localhost:8000/docs` when Python backend is running (Swagger UI)

## 🤝 Contributing

This is an MVP project. When contributing:
1. Maintain separation between auth and habits services
2. Keep frontend modules focused on single responsibilities
3. Add bilingual comments (English/Spanish) for clarity
4. Update documentation when adding features

## 📦 Git & Version Control

### .gitignore Configuration

This repository uses a comprehensive `.gitignore` to exclude:
- **Build artifacts**: `target/`, `__pycache__`, `dist/`, `build/`
- **IDE files**: `.idea/`, `.vscode/`, `*.iml`, `.settings/`
- **Virtual environments**: `venv/`, `.venv/`, `env/`
- **Environment files**: `.env`, `.env.*` (never commit secrets!)
- **OS files**: `.DS_Store`, `Thumbs.db`, `desktop.ini`
- **Python virtual env at root**: `Include/`, `Lib/`, `Scripts/`, `pyvenv.cfg`

### For Contributors

**Before committing:**
1. Never commit sensitive information (passwords, API keys, tokens)
2. Never commit build artifacts or IDE-specific files
3. Use `.env.example` files to document required environment variables
4. If you accidentally committed a file that should be ignored:
   ```bash
   git rm --cached <file-or-directory>
   git commit -m "Remove accidentally tracked file"
   ```

**Recommended Git workflow:**
```bash
# Check what will be committed
git status

# Review your changes
git diff

# Add only the files you intend to commit
git add <specific-files>

# Commit with a descriptive message
git commit -m "feat: add user profile editing"
```

### Already Tracked Files

Some files may already be tracked by Git before `.gitignore` was configured. To check:
```bash
# See if any ignored files are still tracked
git ls-files -i --exclude-standard
```

Common files to remove if tracked:
- Virtual environment: `git rm -r --cached Include/ Lib/ Scripts/ pyvenv.cfg`
- IDE files: `git rm -r --cached .vscode/ .idea/`
- Test outputs: `git rm --cached test_output.txt verify_output.txt`

## 📝 License

This project is for educational purposes as part of a Software Engineering course.

---

**Built with** ❤️ **as a demonstration of full-stack architecture and clean code principles**
