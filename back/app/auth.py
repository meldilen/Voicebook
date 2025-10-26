from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from jose import JWTError
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets
import uuid

from .config import settings
from .database import get_db
from .models.user import User
from .models.session import UserSession
from .schemas.common import TokenPayload


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password, hashed_password) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password) -> str:
    return pwd_context.hash(password)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_session_tokens(db: Session, user: User, request: Request = None) -> Tuple[str, str, UserSession]:
    # Генерируем уникальные токены
    session_token = str(uuid.uuid4())
    refresh_token = secrets.token_urlsafe(64)

    access_expires = datetime.now(
        timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_expires = datetime.now(
        timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    user_agent = request.headers.get("user-agent") if request else None
    ip_address = request.client.host if request else None

    session = UserSession(
        user_id=user.id,
        session_token=session_token,
        refresh_token=refresh_token,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=access_expires,
        refresh_expires_at=refresh_expires
    )

    db.add(session)

    user.last_login = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)

    access_token_payload = {
        "user_id": user.id,
        "session_id": session.id,
        "type": "access"
    }
    access_token = create_jwt_token(access_token_payload)

    return access_token, refresh_token, session


def create_jwt_token(payload: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = payload.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    payload.update({
        "exp": expire,
        "user_id": payload.get("user_id"),
        "session_id": payload.get("session_id"),
        "type": payload.get("type")
    })
    private_key = settings.get_private_key()

    return jwt.encode(payload, private_key, algorithm=settings.ALGORITHM)


def verify_jwt_token(token: str) -> Optional[TokenPayload]:
    try:
        public_key = settings.get_public_key()
        payload = jwt.decode(token, public_key, algorithms=[
                             settings.ALGORITHM])

        return TokenPayload(
            user_id=payload.get("user_id"),
            session_id=payload.get("session_id"),
            type=payload.get("type")
        )
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Верифицируем JWT токен
    token_payload = verify_jwt_token(credentials.credentials)
    if not token_payload or token_payload.type != "access":
        raise credentials_exception

    session = db.query(UserSession).filter(
        UserSession.id == token_payload.session_id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).first()

    if not session:
        raise credentials_exception

    session.last_used = datetime.now(timezone.utc)
    db.commit()

    user = db.query(User).filter(User.id == token_payload.user_id,
                                 User.is_active == True).first()
    if not user:
        raise credentials_exception

    return user

def set_refresh_token_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,  # True в production
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        domain=settings.COOKIE_DOMAIN
    )

def delete_refresh_token_cookie(response: Response):
    response.delete_cookie(
        key="refresh_token",
        domain=settings.COOKIE_DOMAIN
    )

def verify_refresh_token(db: Session, refresh_token: str) -> Optional[UserSession]:
    session = db.query(UserSession).filter(
        UserSession.refresh_token == refresh_token,
        UserSession.is_active == True,
        UserSession.refresh_expires_at > datetime.now(timezone.utc)
    ).first()
    
    return session

def refresh_access_token(db: Session, session: UserSession) -> Tuple[str, datetime]:
    new_expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    session.expires_at = new_expires
    session.last_used = datetime.now(timezone.utc)
    
    db.commit()
    
    access_token_payload = {
        "user_id": session.user_id,
        "session_id": session.id,
        "type": "access"
    }
    
    new_access_token = create_jwt_token(access_token_payload)
    
    return new_access_token, new_expires

def cleanup_expired_sessions(db: Session):
    db.query(UserSession).filter(
        UserSession.refresh_expires_at < datetime.now(timezone.utc)
    ).delete()

    cleanup_cutoff = datetime.now(timezone.utc) - \
        timedelta(days=settings.SESSION_CLEANUP_DAYS)

    db.query(UserSession).filter(
        UserSession.expires_at < cleanup_cutoff,
        UserSession.is_active == True
    ).update({"is_active": False})

    db.commit()

async def get_current_session(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserSession:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_payload = verify_jwt_token(credentials.credentials)
    if not token_payload or token_payload.type != "access":
        raise credentials_exception

    session = db.query(UserSession).filter(
        UserSession.id == token_payload.session_id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).first()

    if not session:
        raise credentials_exception

    session.last_used = datetime.now(timezone.utc)
    db.commit()

    user = db.query(User).filter(
        User.id == token_payload.user_id,
        User.is_active == True
    ).first()
    
    if not user:
        raise credentials_exception

    return session

def logout_session(db: Session, session_id: int) -> bool:
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.is_active == True
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
        return True
    return False

def logout_all_sessions(db: Session, user_id: int) -> int:
    result = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True
    ).update({"is_active": False})
    
    db.commit()
    return result
