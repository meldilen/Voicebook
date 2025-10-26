from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any

class RecordBase(BaseModel):
    name: str
    emotion: str
    summary: str
    feedback: Optional[int] = None
    insights: Dict[str, Any]
    duration: float

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    feedback: Optional[int] = None

class RecordResponse(RecordBase):
    id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class RecordWithUser(RecordResponse):
    user_username: str