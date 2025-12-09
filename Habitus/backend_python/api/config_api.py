
from fastapi import APIRouter
from seasonal_config import CURRENT_SEASON

router = APIRouter(tags=["config"])

@router.get("/season")
def get_current_season():
    """
    Returns the current seasonal configuration of the backend.
    """
    return {"season": CURRENT_SEASON}
