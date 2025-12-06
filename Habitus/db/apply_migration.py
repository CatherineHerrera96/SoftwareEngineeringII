import os
from sqlalchemy import create_engine, text

# Use the same connection string as backend_python/db.py
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/habitus")

def apply_migration():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    migration_file = os.path.join(os.path.dirname(__file__), "migrate_to_server_backend.sql")
    
    with open(migration_file, "r") as f:
        sql_script = f.read()
        
    print("Applying migration...")
    with engine.connect() as connection:
        # Split by semicolon to execute statements individually if needed, 
        # but sqlalchemy text() might handle it. 
        # However, DO blocks and some statements might need special handling.
        # Let's try executing the whole script.
        # Note: sqlalchemy might not support multiple statements in one execute call depending on the driver.
        # But psycopg2 usually does.
        
        # Actually, let's split by simple rules or just try.
        # For safety with DO blocks, it's often better to send the whole thing if the driver supports it.
        try:
            connection.execute(text(sql_script))
            connection.commit()
            print("Migration applied successfully.")
        except Exception as e:
            print(f"Error applying migration: {e}")
            # Try splitting by statement if the above fails (naive split)
            # This is a fallback and might be brittle with DO blocks.

if __name__ == "__main__":
    apply_migration()
