# Habitus MVP Walkthrough

This guide explains how to run the full Habitus system (Database, Java Backend, Python Backend, Frontend) from scratch, including the new **User Profile** and **Habitus Integration**.

## Prerequisites

- **Docker** & **Docker Compose** (for the database)
- **Java 17+** (for the Auth Service)
- **Python 3.10+** (for the Habit Service)
- **Node.js** (optional, only if you want to use npm for frontend, but simple python server works too)

## 1. Start the Database

We use PostgreSQL via Docker.

1.  Open a terminal in the root `Habitus` directory.
2.  Run:
    ```bash
    docker-compose up -d
    ```
3.  Wait a few seconds. You can check if it's running with `docker ps`.

## 2. Initialize the Database

The database needs tables and seed data.

1.  We need to run the SQL scripts in `db/`.
2.  You can use a tool like DBeaver or the docker container itself.
    ```powershell
    # PowerShell
    Get-Content db/habitusTables.sql | docker exec -i habitus_db psql -U postgres -d habitus
    Get-Content db/seedData.sql | docker exec -i habitus_db psql -U postgres -d habitus
    ```
    *(On Bash/Linux, use `<` redirection)*

## 3. Run the Java Auth Backend

1.  Open a terminal in `Habitus` root.
2.  Build the project (if not already built):
    ```powershell
    cd backend-java/authservice
    .\mvnw.cmd clean package -DskipTests
    ```
3.  **Configure Environment**:
    Ensure a `.env` file exists in `backend-java/authservice/.env` with the following content:
    ```env
    DB_URL=jdbc:postgresql://localhost:5432/habitus
    DB_USERNAME=postgres
    DB_PASSWORD=password
    ```
4.  **Run the jar**:
    **IMPORTANT**: You must run the jar from the `backend-java/authservice` directory.
    ```powershell
    java -jar target/authservice-0.0.1-SNAPSHOT.jar
    ```
    The service will start on port **8080**.

## 4. Run the Python Backend

1.  Open a new terminal in `Habitus` root.
2.  **Fix Environment (if needed)**:
    If `pip` is not found, you may need to use the `py` launcher:
    ```bash
    py -m ensurepip --default-pip
    ```
3.  Install dependencies:
    ```bash
    py -m pip install -r backend_python/requirements.txt
    ```
4.  Run the server:
    ```bash
    # Default DB URL is: postgresql://postgres:password@localhost:5432/habitus
    py -m uvicorn backend_python.main:app --reload --port 8000
    ```
    The service will start on port **8000**.

## 5. Run the Frontend

1.  Open a new terminal in `frontend/`.
2.  Serve the static files. You can use Python:
    ```bash
    python -m http.server 8001
    ```
3.  Open your browser at `http://localhost:8001`.

## 6. Usage Flow

1.  **Register/Login**: Create an account or sign in.
2.  **Profile Setup**:
    -   You will be redirected to the **Profile** section.
    -   Here you can see your **Daily Checklist** and **Weekly Progress**.
    -   Click "Save Info" to update your Name, Avatar, and Timezone.
3.  **Select Habits**:
    -   Go to **Habit Catalog**.
    -   Select habits to track.
    -   **Look for "Use Habitus App"** - this is now a trackable habit!
4.  **Track Progress**:
    -   Go back to **Profile**.
    -   Mark habits as done in the **Daily Checklist**.
    -   Switch to the **Weekly Progress** tab to see your stats and achievements.

## Troubleshooting

-   **Java Backend Config**: If you see "Missing database configuration", ensure you are running the `java -jar` command *inside* the `backend-java/authservice` folder.
-   **CORS**: If you see CORS errors, ensure the backends are allowing the frontend origin.
    -   **Java**: `SecurityConfig.java` has been updated to allow all origins (`*`) for MVP.
    -   **Python**: `main.py` has CORS middleware enabled for all origins.
-   **DB Connection**: Ensure Docker is running and ports are not blocked.
