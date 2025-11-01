from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from ..auth import (
    authenticate_user, 
    create_session_tokens, 
    get_current_user,
    get_current_session,
    verify_refresh_token,
    refresh_access_token,
    set_refresh_token_cookie,
    delete_refresh_token_cookie,
    logout_session,
    logout_all_sessions
)
from ..schemas.user import UserCreate, UserLogin, UserResponse
from ..schemas.common import LoginResponse, RegisterResponse, Token, RefreshResponse, LogoutResponse
from services.user_service import UserService
from ..models.user import User
from ..models.session import UserSession

router = APIRouter(prefix="/auth", tags=["authentication"])

logger = logging.getLogger(__name__)

@router.post("/register", response_model=RegisterResponse)
async def register(
    response: Response,
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):    
    user_service = UserService(db)
    
    if user_service.get_user_by_email(user_data.email):
        logger.warning(f"Registration failed - email already registered: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if user_service.get_user_by_username(user_data.username):
        logger.warning(f"Registration failed - username already taken: {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    user = user_service.create_user(user_data)
    
    access_token, refresh_token, session = create_session_tokens(db, user, request)
    logger.info(f"Session created for new user: {session.id}")
    
    set_refresh_token_cookie(response, refresh_token)
    
    user_response = UserResponse.model_validate(user)
    
    logger.info(f"Registration completed for user: {user.id}")
    return RegisterResponse(
        user=user_response.model_dump(),
        tokens=Token(
            access_token=access_token,
            expires_at=session.expires_at
        ),
        message="Account created successfully! Welcome to Voice Diary!"
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    response: Response,
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):    
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        logger.warning(f"Login failed - incorrect credentials for: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        logger.warning(f"Login failed - inactive user: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    logger.info(f"Authentication successful for user: {user.id}")
    
    access_token, refresh_token, session = create_session_tokens(db, user, request)
    logger.info(f"Session created for login: {session.id}")
    
    set_refresh_token_cookie(response, refresh_token)
    
    user_response = UserResponse.model_validate(user)
    
    logger.info(f"Login completed for user: {user.id}")
    return LoginResponse(
        user=user_response.model_dump(),
        tokens=Token(
            access_token=access_token,
            expires_at=session.expires_at
        )
    )

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )
    
    session = verify_refresh_token(db, refresh_token)
    if not session:
        delete_refresh_token_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    new_access_token, new_expires = refresh_access_token(db, session)
    
    return RefreshResponse(
        access_token=new_access_token,
        expires_at=new_expires
    )

@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    current_session: UserSession = Depends(get_current_session),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):  
    logout_session(db, current_session.id)
    
    delete_refresh_token_cookie(response)
    
    remaining_sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).count()
    
    return LogoutResponse(
        message="Successfully logged out",
        sessions_remaining=remaining_sessions
    )

@router.post("/logout-all", response_model=LogoutResponse)
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions_closed = logout_all_sessions(db, current_user.id)
    
    delete_refresh_token_cookie(response)
    
    return LogoutResponse(
        message=f"Logged out from {sessions_closed} sessions",
        sessions_remaining=0
    )