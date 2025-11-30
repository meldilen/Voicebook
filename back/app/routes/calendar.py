from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from ..database import get_db
from ..auth import get_current_user
from ..models.user import User
from ..schemas.daily_stats import CalendarResponse, CalendarDetailResponse
from services.daily_stats_service import DailyStatsService

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/{year}/{month}", response_model=List[CalendarResponse])
async def get_calendar_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Валидация даты
    try:
        target_date = date(year, month, 1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year or month"
        )
    
    daily_stats_service = DailyStatsService(db)
    calendar_data = daily_stats_service.get_calendar_data(current_user.id, year, month)
    
    return calendar_data

@router.get("/day/{target_date}", response_model=CalendarDetailResponse)
async def get_calendar_day_detail(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить детальную информацию за конкретный день
    """
    daily_stats_service = DailyStatsService(db)
    
    # Генерируем/получаем статистику за день
    daily_stat = daily_stats_service.generate_daily_stats(current_user.id, target_date)
    
    if not daily_stat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No records found for this date"
        )
    
    return daily_stat

@router.post("/generate/{target_date}")
async def generate_daily_stats(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Принудительная генерация статистики за день
    """
    daily_stats_service = DailyStatsService(db)
    result = daily_stats_service.generate_daily_stats(current_user.id, target_date)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No records found for this date"
        )
    
    return {"message": "Daily stats generated successfully", "stats": result}