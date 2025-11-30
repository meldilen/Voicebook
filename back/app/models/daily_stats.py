from sqlalchemy import Column, Float, Integer, String, JSON, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class DailyStats(Base):
    __tablename__ = "daily_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    dominant_emotion = Column(String, nullable=True)
    daily_summary = Column(Text, nullable=True)
    emotion_distribution = Column(JSON)  # {"happy": 3, "sad": 1}
    records_count = Column(Integer, default=0)
    total_duration = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="daily_stats")
    
    def __repr__(self):
        return f"<DailyStats(user_id={self.user_id}, date={self.date}, emotion='{self.dominant_emotion}')>"