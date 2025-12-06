from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
import os

# Add project root to path so we can import server_backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server-backend')))

from models import User
from db import Base, DATABASE_URL, engine
SessionLocal = sessionmaker(bind=engine)

def create_user():
    db = SessionLocal()
    email = "test@example.com"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"Creating user {email}")
        user = User(
            email=email,
            password_hash="hashed_password", # Dummy hash
            name="Test User",
            timezone="UTC"
        )
        db.add(user)
        db.commit()
    else:
        print(f"User {email} already exists")
    db.close()

if __name__ == "__main__":
    create_user()
