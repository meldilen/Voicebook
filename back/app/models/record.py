from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    record_date = Column(DateTime, default=datetime.now(timezone.utc))
    emotion = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    feedback = Column(Integer, nullable=True)
    insights = Column(JSON)
    duration = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship("User", back_populates="records")

    def __repr__(self):
        return f"<Record(id={self.id}, user_id={self.user_id}, emotion='{self.emotion}')>"