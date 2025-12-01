from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List

from ..database import get_db
from ..auth import get_current_user
from ..models.user import User
from ..schemas.daily_stats import CalendarResponse, CalendarDetailResponse
from services.daily_stats_service import DailyStatsService

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/day/{target_date}", response_model=CalendarDetailResponse)
async def get_calendar_day_detail(
    target_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить детальную информацию за конкретный день
    """
    try:
        # Преобразуем строку в date
        date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    daily_stats_service = DailyStatsService(db)
    
    # Получаем статистику
    daily_stat = daily_stats_service.generate_daily_stats(current_user.id, date_obj)
    
    if not daily_stat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No records found for this date"
        )
    
    return CalendarDetailResponse.from_orm(daily_stat)


@router.post("/generate/{target_date}")
async def generate_daily_stats(
    target_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Принудительная генерация статистики за день
    """
    try:
        date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    daily_stats_service = DailyStatsService(db)
    result = daily_stats_service.generate_daily_stats(current_user.id, date_obj)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No records found for this date"
        )
    
    return {
        "message": "Daily stats generated successfully", 
        "stats": CalendarDetailResponse.from_orm(result)
    }


@router.get("/{year}/{month}", response_model=List[CalendarResponse])
async def get_calendar_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить данные календаря за месяц
    """
    # Валидация даты
    try:
        date(year, month, 1)  # Просто проверяем, что дата валидна
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year or month"
        )
    
    daily_stats_service = DailyStatsService(db)
    calendar_data = daily_stats_service.get_calendar_data(current_user.id, year, month)
    
    return calendar_data