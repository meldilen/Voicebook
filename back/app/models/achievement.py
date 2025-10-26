from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String, nullable=False)
    category = Column(String, nullable=False)
    category_icon = Column(String, nullable=False)
    rarity = Column(String, nullable=False)
    required_value = Column(Integer, nullable=False)
    
    user_achievements = relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Achievement(id={self.id}, title='{self.title}', description='{self.description}')>"