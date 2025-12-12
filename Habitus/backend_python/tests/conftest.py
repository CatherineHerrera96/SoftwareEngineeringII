import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from ..db import Base, get_db
from ..main import app
from ..models import User

# Use an in-memory SQLite database shared across connections
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # una sola conexión para todos
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """
    Override the app's get_db dependency to use the test database.
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Make ALL endpoints use the test database
app.dependency_overrides[get_db] = override_get_db


def override_get_current_user():
    """
    Override auth dependency for tests.
    Create/fetch a test user and return it as the current user.
    """
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(email="test@example.com", name="Test User", password_hash="test")
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()

from ..auth_deps import get_current_user
app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(autouse=True)
def prepare_database():
    """
    Runs BEFORE each test:
    - Drops all tables (if they exist)
    - Recreates them
    Ensures every test starts with a clean database.
    """
    from backend_python import models  # asegura que los modelos están registrados en Base.metadata

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # No need to drop_all here; the next test will do it at start.


@pytest.fixture
def client():
    """
    Return a TestClient bound to the app using the test database.
    """
    return TestClient(app)
