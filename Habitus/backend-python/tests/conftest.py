import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app

# Usamos SQLite en memoria compartida entre conexiones
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # una sola conexión para todos
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """
    Sustituye la dependencia get_db de la app para usar la DB de pruebas.
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Hacemos que TODOS los endpoints usen la DB de pruebas
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def prepare_database():
    """
    Se ejecuta ANTES de cada test:
    - Borra todas las tablas (si existen)
    - Las vuelve a crear
    Así cada test arranca con una BD limpia.
    """
    from app import models  # asegura que los modelos están registrados en Base.metadata

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # No hace falta drop_all aquí; el siguiente test lo hará al empezar.


@pytest.fixture
def client():
    """
    Devuelve un TestClient que usa la app con la BD de pruebas.
    """
    return TestClient(app)
