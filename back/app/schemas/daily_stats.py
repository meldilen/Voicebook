from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Dict, Any

class DailyStatsBase(BaseModel):
    date: date
    dominant_emotion: Optional[str] = None
    daily_summary: Optional[str] = None
    emotion_distribution: Optional[Dict[str, int]] = None
    records_count: int = 0
    total_duration: float = 0.0

class DailyStatsCreate(DailyStatsBase):
    user_id: int

class DailyStatsUpdate(BaseModel):
    dominant_emotion: Optional[str] = None
    daily_summary: Optional[str] = None
    emotion_distribution: Optional[Dict[str, int]] = None
    records_count: Optional[int] = None
    total_duration: Optional[float] = None

class DailyStatsResponse(DailyStatsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CalendarResponse(BaseModel):
    date: date
    dominant_emotion: Optional[str] = None
    records_count: int = 0
    has_records: bool = False
    
    class Config:
        from_attributes = True

class CalendarDetailResponse(DailyStatsResponse):
    pass