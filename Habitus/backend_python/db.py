from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import find_dotenv, load_dotenv

#search for .env file and load it's values
load_dotenv(find_dotenv())

_DB_USER     = os.getenv("DB_USER")
_DB_NAME     = os.getenv("DB_NAME")
_DB_PASSWORD = os.getenv("DB_PASSWORD")
_DB_HOST     = os.getenv("DB_HOST")
_DB_EXTRAS   = os.getenv("DB_EXTRAS", "")

# For production, set DATABASE_URL, e.g.:
DATABASE_URL = f"postgresql+psycopg2://{_DB_USER}:{_DB_PASSWORD}@{_DB_HOST}/{_DB_NAME}{_DB_EXTRAS}"
# DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./habitus.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
