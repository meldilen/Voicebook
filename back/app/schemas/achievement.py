from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AchievementBase(BaseModel):
    title: str
    description: str
    icon: str
    category: str
    category_icon: str
    rarity: str
    required_value: int

class AchievementResponse(AchievementBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class UserAchievementBase(BaseModel):
    unlocked: bool
    progress: int
    date_unlocked: Optional[datetime]

class UserAchievementResponse(UserAchievementBase):
    id: int
    achievement: AchievementResponse
    
    model_config = ConfigDict(from_attributes=True)

class AchievementProgress(BaseModel):
    achievement_id: int
    progress: int
    required_value: int
    unlocked: bool