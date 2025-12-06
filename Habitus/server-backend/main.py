from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
from routers import habits, user_habits, checkins, achievements, profile

# Create tables if they don't exist (though we used migration script)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Habitus Server Backend")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8001",
        "http://25.1.31.133:8001",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habits.router, prefix="/api/habits", tags=["habits"])
app.include_router(user_habits.router, prefix="/api/user-habits", tags=["user-habits"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["checkins"])
app.include_router(achievements.router, prefix="/api/achievements", tags=["achievements"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

@app.get("/")
def read_root():
    return {"message": "Habitus Server Backend is running"}
