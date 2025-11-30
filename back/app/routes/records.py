from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Body, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
import os

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

@router.get("/limits", response_model=Dict[str, Any])
async def get_recording_limits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's recording limits and usage for today.
    """
    record_service = RecordService(db)
    limit_info = record_service.get_user_recording_limit(current_user.id)
    
    return limit_info

@router.post("/upload", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_audio_recording(
    file: UploadFile = File(...),
    duration: float = Form(0.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):    
    if not file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    processing_dir = os.path.join(project_root, "audio_processing")
    os.makedirs(processing_dir, exist_ok=True)
    
    # Сохраняем файл в папку обработки
    file_extension = os.path.splitext(file.filename)[1] or '.wav'
    filename = f"audio_{uuid.uuid4()}{file_extension}"
    filepath = os.path.join(processing_dir, filename)
    
    try:
        # Сохраняем файл в папку обработки
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
                
        record_name = f"Recording_{datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Передаем обработку в сервис
        record_service = RecordService(db)
        record = record_service.process_and_create_record(
            user_id=current_user.id,
            audio_file_path=filepath,  # Сервис сам удалит файл после обработки
            record_name=record_name,
            duration=duration
        )
        
        return record
    
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

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

@router.patch("/{record_id}/feedback", response_model=RecordResponse)
async def update_record_feedback(
    record_id: int,
    feedback: Optional[int] = Body(None, ge=1, le=5, description="Rating from 1 to 5"),
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
    
    updated_record = record_service.update_record_feedback(
        user_id=current_user.id,
        record_id=record_id,
        feedback=feedback
    )
    
    return updated_record

