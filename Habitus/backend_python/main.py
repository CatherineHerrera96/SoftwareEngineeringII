from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
from api import habits, user_habits, checkins, stats, achievements, profile, streak_window

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Habitus API")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:3000", # Common React port just in case
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a main router for API endpoints
main_router = APIRouter()

main_router.include_router(habits.router, prefix="/habits")
main_router.include_router(user_habits.router, prefix="/user-habits")
main_router.include_router(checkins.router, prefix="/checkins")
main_router.include_router(stats.router, prefix="/stats")
main_router.include_router(achievements.router, prefix="/achievements")
main_router.include_router(profile.router, prefix="/profile")
main_router.include_router(streak_window.router, prefix="")

app.include_router(main_router, prefix="/api")
