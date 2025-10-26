from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..auth import get_current_user, get_current_session, logout_session, logout_all_sessions
from ..models.user import User
from ..models.session import UserSession
from ..schemas.user import UserResponse, UserUpdate, UserWithStats, SessionInfo
from ...services.user_service import UserService
from ..schemas.common import Message

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserWithStats)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.get_user_with_stats(current_user.id)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.update_user(current_user.id, user_update)

@router.get("/me/sessions", response_model=List[SessionInfo])
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.get_user_sessions(current_user.id)

@router.post("/me/logout")
async def logout_current_session(
    current_session: UserSession = Depends(get_current_session),
    db: Session = Depends(get_db)
):    
    logout_session(db, current_session.id)
    
    return {"message": "Successfully logged out"}

@router.post("/me/logout-all")
async def logout_all_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions_closed = logout_all_sessions(db, current_user.id)
    
    return {
        "message": f"Logged out from {sessions_closed} sessions",
        "sessions_closed": sessions_closed
    }

@router.delete("/me", response_model=Message)
async def delete_current_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    
    if user_service.delete_user(current_user.id):
        return Message(message="Account and all associated data have been permanently deleted")
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )