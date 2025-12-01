# Database Setup Guide

This folder contains the SQL and instructions to create, seed, and work with the project's PostgreSQL database.

**Overview**

- **Purpose:** Create the schema and load sample data for the Habitus application.
- **Files:** Schema and seed scripts plus notes for running them locally or via Docker.

**Files in this folder**

- `schema.sql`: Creates tables, primary/foreign keys, UNIQUE constraints, and indexes.
- `seed.sql`: Inserts sample data (users, habits, check-ins, achievements) for development/testing.

**Prerequisites**

- **PostgreSQL** installed and running (locally or in a container).
- A PostgreSQL database and user with privileges to create tables and insert data.

**Quick setup (local psql)**

1. Create the database (if not exists):

```bash
createdb habitus_db
```

2. Apply the schema:

```bash
psql -d habitus_db -f path/to/Habitus/db/schema.sql
```

3. Load seed data:

```bash
psql -d habitus_db -f path/to/Habitus/db/seed.sql
```

Replace `path/to/Habitus/db/` with the actual path to this folder if you run commands from elsewhere.

**Using Docker (recommended for isolated environments)**

1. Start a PostgreSQL container:

```bash
docker run --name habitus-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=habitus_db -p 5432:5432 -d postgres:15
```

2. Copy and run the SQL files inside the container (one way):

```bash
docker cp schema.sql habitus-postgres:/schema.sql
docker cp seed.sql habitus-postgres:/seed.sql
docker exec -it habitus-postgres psql -U postgres -d habitus_db -f /schema.sql
docker exec -it habitus-postgres psql -U postgres -d habitus_db -f /seed.sql
```

**Environment variables / connection example**

Set these in your app's environment (example names):

- `DB_HOST` — hostname (e.g., `localhost`)
- `DB_PORT` — port (default `5432`)
- `DB_NAME` — database name (e.g., `habitus_db`)
- `DB_USER` — database user (e.g., `postgres`)
- `DB_PASSWORD` — user's password

Connection string example:

```text
postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

**File descriptions & order**

- `schema.sql`: Run first — defines all tables, constraints, and indexes.
- `seed.sql`: Run after `schema.sql` — inserts sample data used by the frontend/backend during development.

**Common commands / checks**

- List databases:

```bash
psql -l
```

- Connect to the database using psql:

```bash
psql -h localhost -U postgres -d habitus_db
```

- Verify tables exist:

```sql
\dt
```

**Troubleshooting**

- Permission errors: ensure the connecting user has `CREATE` and `INSERT` privileges or run as `postgres` superuser during setup.
- Port conflicts: verify `5432` is available or map a different host port when using Docker.
- Encoding issues: ensure your database encoding is `UTF8` if you encounter character problems.

**Next steps / integration**

- Point your backend app's DB config to the `DB_*` values above.
- If using migrations in the future, keep `schema.sql` as a canonical reference and add migration scripts to the repo.

---

If you'd like, I can also:

- add a tiny shell script to run schema + seed in one command, or
- add a Docker Compose file to start Postgres and run initialization automatically.

