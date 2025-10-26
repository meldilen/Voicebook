from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..auth import get_current_user
from ..models.user import User
from ..schemas.record import RecordCreate, RecordUpdate, RecordResponse
from ..schemas.common import Message
from services.record_service import RecordService

router = APIRouter(prefix="/records", tags=["records"])

@router.get("/", response_model=List[RecordResponse])
async def get_user_records(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    emotion: Optional[str] = Query(None, description="Filter by emotion"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_service = RecordService(db)
    
    records = record_service.get_user_records(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        emotion=emotion,
        start_date=start_date,
        end_date=end_date
    )
    
    return records

@router.get("/stats", response_model=dict)
async def get_records_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_service = RecordService(db)
    stats = record_service.get_user_records_stats(current_user.id)
    
    return stats

@router.get("/timeline", response_model=List[dict])
async def get_emotion_timeline(
    days: int = Query(30, ge=1, le=365, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get emotion timeline for the specified number of days.
    """
    record_service = RecordService(db)
    timeline = record_service.get_emotion_timeline(current_user.id, days)
    
    return timeline

@router.post("/", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    record_data: RecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_service = RecordService(db)
    
    record = record_service.create_record(current_user.id, record_data)
    
    return record

@router.get("/{record_id}", response_model=RecordResponse)
async def get_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_service = RecordService(db)
    
    record = record_service.get_user_record(current_user.id, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    return record

@router.put("/{record_id}", response_model=RecordResponse)
async def update_record(
    record_id: int,
    record_update: RecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_service = RecordService(db)
    
    record = record_service.update_record(current_user.id, record_id, record_update)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    return record

@router.delete("/{record_id}", response_model=Message)
async def delete_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_service = RecordService(db)
    
    success = record_service.delete_record(current_user.id, record_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
    
    return Message(message="Record deleted successfully")