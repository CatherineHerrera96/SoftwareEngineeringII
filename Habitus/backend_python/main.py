from fastapi import FastAPI, APIRouter
from .db import Base, engine
from .api import habits, user_habits, checkins, stats, achievements

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Habitus API")

main_router = APIRouter()

main_router.include_router(habits.router        , prefix="/habits")
main_router.include_router(user_habits.router   , prefix="/user-habits")
main_router.include_router(checkins.router      , prefix="/checkins")
main_router.include_router(stats.router         , prefix="/stats")
main_router.include_router(achievements.router  , prefix="/achievements")

app.include_router(main_router)
