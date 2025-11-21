from fastapi import FastAPI
from .db import Base, engine
from .api import habits, user_habits, checkins, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Habitus API")

app.include_router(habits.router, prefix="/habits", tags=["habits"])
app.include_router(user_habits.router, prefix="/user-habits", tags=["user-habits"])
app.include_router(checkins.router, prefix="/checkins", tags=["checkins"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
