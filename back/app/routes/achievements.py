from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from services.achievement_service import AchievementService
from app.schemas.achievement import AchievementResponse, UserAchievementResponse, AchievementProgress

router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.get("/", response_model=List[AchievementResponse])
async def get_all_achievements(
    db: Session = Depends(get_db),
):
    """Получить все доступные достижения"""
    return AchievementService.get_all_achievements(db)

@router.get("/my", response_model=List[UserAchievementResponse])
async def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AchievementService.get_user_achievements(db, current_user.id)

@router.get("/stats")
async def get_achievement_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AchievementService.get_achievement_stats(db, current_user.id)

@router.get("/{achievement_id}/progress", response_model=AchievementProgress)
async def get_achievement_progress(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = AchievementService.get_achievement_progress(db, current_user.id, achievement_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Achievement progress not found")
    return progress

@router.post("/{achievement_id}/progress")
async def update_achievement_progress(
    achievement_id: int,
    progress_increment: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = AchievementService.update_achievement_progress(
        db, current_user.id, achievement_id, progress_increment
    )
    if not result:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    return {"message": "Progress updated", "unlocked": result.unlocked}