from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    message: str
    details: Optional[dict] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime

class TokenPayload(BaseModel):
    user_id: int
    session_id: int
    type: str

class LoginResponse(BaseModel):
    user: dict
    tokens: Token

class LogoutResponse(BaseModel):
    message: str
    sessions_remaining: int

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime

class RegisterResponse(BaseModel):
    user: dict
    tokens: Token
    message: str = "Registration successful"