from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthOut

router = APIRouter()


@router.get("/health", response_model=HealthOut)
async def health():
    return HealthOut(
        status="ok",
        version="1.0.0",
        openai_configured=bool(settings.openai_api_key),
    )
