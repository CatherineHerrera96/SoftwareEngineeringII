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


