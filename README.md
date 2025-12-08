# 📚 Software Engineering II — 2025-2  
### National University of Colombia – Faculty of Engineering

---

## 👥 Team Members

| Member | Main role in the Habitus project |
|--------|----------------------------------|
| 🧑‍💻 **Alvaro Andrés Romero Castro** (`alromeroca@unal.edu.co`) | Python Backend Developer · Streak & Achievements Engine |
| 🧑‍💻 **Baruj Vladimir Ramírez Escalante** (`baramireze@unal.edu.co`) | Java Backend Developer · Auth Service & Security |
| 🧑‍💻 **Brayan Alejandro Muñoz Pérez** (`bmunozp@unal.edu.co`) | Full-Stack Developer · Front–Back Integration & UX |
| 👩‍💻 **Jenny Catherine Herrera Garzón** (`jcherreraga@unal.edu.co`) | Frontend Developer · UI, theming & responsive design |
| 🧑‍💻 **Juan David Ladino Triana** (`jladinot@unal.edu.co`) | Database & DevOps · PostgreSQL, Docker & pipelines |

> ℹ️ This README describes the **whole course repository** (workshops + main project).  
> The detailed documentation for the **Habitus** app lives in:  
> `Habitus/README.md`, `Habitus/WALKTHROUGH.md`, and `Habitus/ARCHITECTURE.md`.

---

## 📝 Repository Overview

This repository contains all the work developed for the course  
**Software Engineering II (2025-2)**, including:

- Course workshops and graded assignments.
- Analysis, design, and architecture documentation.
- The main project **“Habitus”**, a web application for habit tracking with:
  - A Duolingo-style streak system fully enforced in the backend.
  - Achievements based on streak length, completion milestones, and specific habits.
  - Weekly statistics and global streak days.
  - Seasonal themes (Christmas, New Year, etc.) and light/dark mode.
  - Profile panel with account CRUD (email, password, account deletion).

---

## 🗂️ Repository Structure

> Note: Folder names may vary slightly depending on the final version,  
> but the overall organization is as follows:

### 📁 `Documentation/`
Project and course documentation:

- User stories and use case models.
- UML diagrams (use case, class, sequence, etc.).
- Architecture and design documents.
- Meeting notes, design decisions, and team agreements.

### 📁 `Workshops/`
Practice material and hands-on exercises:

- Small practice projects or scripts.
- Supporting material to reinforce course concepts.

### 📁 `Project/` or `Habitus/`
Source code for the main project **Habitus**.  
Typical internal structure:

- `frontend/` – Web app using plain JavaScript (ES6+), HTML, and CSS.
- `backend-java/authservice/` – Authentication service built with **Java + Spring Boot**.
- `backend_python/` – Habits, streak engine, achievements and stats API using **Python + FastAPI**.
- `docker-compose.yml` – Orchestration for **PostgreSQL**, pgAdmin and services.
- Project-specific documentation:
  - `README.md` – Habitus overview.
  - `WALKTHROUGH.md` – Step-by-step guide to run the system.
  - `ARCHITECTURE.md` – Technical details, including streak engine & achievements.

---

## 🚀 Project Status

### Course (Global Repository)

| Phase                             | Status         |
|----------------------------------|----------------|
| ✅ Repository initialization     | Completed      |
| ✅ Requirements analysis         | Completed      |
| ✅ Design & architecture         | Completed      |
| ✅ Iterative development         | Near 1.0 – stable |
| 🔄 Testing & refinement          | In progress    |
| 🔄 Final documentation           | Being updated  |
| ⏳ External deployment (prod)    | To be defined  |

### Habitus Project (Summary)

- 🧱 **Functional MVP**: login, profile, habits, daily checklist working.
- 🔥 **Streak engine**: test mode and production mode implemented at backend level.
- 🏆 **Achievement system**: tiers (Bronze, Silver, Gold, Legendary) and statistics.
- 🎨 **Polished frontend**: dark mode, seasonal themes, and responsive layout.
- 🐞 Ongoing bug fixing and UX improvements.

> For technical details, see `Habitus/ARCHITECTURE.md`.  
> For how to run everything, see `Habitus/WALKTHROUGH.md`.

---

## 🛠️ Tools & Technologies

### Languages

- ☕ **Java 17** – Auth Service (login, register, password reset, account CRUD).
- 🐍 **Python 3.x** – Habits API, streak engine, achievements, stats.
- 🌐 **JavaScript (ES6+)** – Lightweight SPA-style frontend.
- 🗄️ **SQL (PostgreSQL)** – Persistent storage.

### Frameworks & Libraries

- **Spring Boot** – Authentication service, JWT, security.
- **FastAPI** – REST API for habits, streak engine, and achievements.
- **Alembic** – Database migrations for the Python backend.
- **JPA / Hibernate** – Persistence layer in the Java backend.

### Infra & DevOps

- 🐳 **Docker & Docker Compose** – Service orchestration (DB, pgAdmin, backends).
- 🐘 **PostgreSQL** + **pgAdmin** – Main database and DB management.
- ✉️ **Mailtrap / SMTP** – Email testing (password reset flow).
- 🧪 **Streak test environments**:
  - **Test mode**: 60-second streak windows.
  - **Production mode**: daily streak window until local midnight.

### Collaboration & Workflow

- 🧭 **Git & GitHub** – Version control and team collaboration.
- ✅ Issues / Pull Requests – Tracking tasks and code reviews.

---

## 📌 Team Guidelines

- Commits should be **clear and descriptive** (consistent language: English preferred).
- Keep branches up to date and resolve conflicts before merging.
- Any new feature added to Habitus should:
  - Respect the defined architecture.
  - Consider the streak engine and achievement system when relevant.
  - Match the existing visual language (themes, dark mode, etc.).

---

> ✨ _This README reflects the global state of the repository for the 2025-2 term._  
> As the project moves towards a final version, testing, deployment and technical documentation sections will be refined.  
> For more details about the **Habitus** app, please refer to the `Habitus/` folder.
