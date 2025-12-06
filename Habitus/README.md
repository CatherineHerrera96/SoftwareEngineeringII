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
│             │     │ (Port 8000) │
│             │     └─────────────┘
└─────────────┘
```

## 🚀 Features

- **Authentication**: Secure JWT-based login/register (Java).
- **Habit Management**: 
  - Browse system catalog (Wellness, Health, etc.).
  - **Create Custom Habits**.
  - Track daily progress.
- **Gamification**:
  - **Streaks**: Track consecutive days.
  - **Achievements**: Unlock badges for milestones.
- **Profile**: 
  - Customizable user profile.
  - Visual dashboard of progress.
- **Architecture**: Microservices-ready (Java Auth + Python Core).

## 🚀 How to Run the MVP

### Prerequisites

- **Docker & Docker Compose** - For PostgreSQL database
- **Java 17+** - For the authentication service
- **Python 3.9+** - For the habits API service
- **pip** - Python package manager

### Setup Steps

1. **Start the Database**
   ```bash
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
   ./mvnw clean package -DskipTests
   java -jar target/authservice-0.0.1-SNAPSHOT.jar
   ```

4. **Start the Python Habits Service**
   ```bash
   pip install -r backend_python/requirements.txt
   python -m uvicorn backend_python.main:app --reload --port 8000
   ```

5. **Serve the Frontend**
   ```bash
   cd frontend
   python -m http.server 8001
   ```

> 💡 **Tip**: For detailed step-by-step instructions including troubleshooting, see [MVP_WALKTHROUGH.md](./MVP_WALKTHROUGH.md)

## 📧 Email Configuration

### Development (Current Setup - Mailtrap)

**Emails are configured for testing only and will NOT reach real inboxes.**

- All emails go to Mailtrap: https://mailtrap.io/inboxes
- Used for "Forgot Password" feature
- Current config in `backend-java/authservice/src/main/resources/application.properties`:
  ```properties
  spring.mail.host=sandbox.smtp.mailtrap.io
  spring.mail.port=587
  ```

### Production (Real Email Delivery)

To send to real addresses, update `application.properties` or use environment variables:

**Gmail Example:**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-gmail-app-password
```

> ⚠️ **Note**: Gmail requires 2FA enabled and an App Password (not your regular password). Generate at: https://myaccount.google.com/apppasswords

**Environment Variables (Recommended):**
```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
```

## 🤝 Contributing

This is an MVP project. When contributing:
1. Maintain separation between auth and habits services
2. Keep frontend modules focused on single responsibilities
3. Add bilingual comments (English/Spanish) for clarity
4. Update documentation when adding features

## 📦 Git & Version Control

### .gitignore Configuration

This repository uses a comprehensive `.gitignore` to exclude build artifacts, IDE files, and secrets.

### For Contributors

**Before committing:**
1. Never commit sensitive information (passwords, API keys, tokens)
2. Never commit build artifacts or IDE-specific files
3. Use `.env.example` files to document required environment variables

## 📝 License

This project is for educational purposes as part of a software architecture course.

---

**Built with** ❤️ **as a demonstration of full-stack architecture and clean code principles**
