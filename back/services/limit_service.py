from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import logging
from app.models.user import User
from app.models.record import Record

logger = logging.getLogger(__name__)

class RecordLimitService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_limit_info(self, user_id: int) -> dict:
        """Получает информацию о лимитах пользователя"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        self._reset_if_needed(user)
                
        return {
            "used_today": user.daily_records_used,
            "max_daily": user.max_daily_records,
            "remaining": max(0, user.max_daily_records - user.daily_records_used),
            "reset_time": self._get_next_reset_time(user.last_record_reset)
        }
    
    def can_user_create_record(self, user_id: int) -> bool:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        self._reset_if_needed(user)
        return user.daily_records_used < user.max_daily_records
    
    def increment_record_count(self, user_id: int) -> bool:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        self._reset_if_needed(user)
        
        # Двойная проверка лимита
        if user.daily_records_used >= user.max_daily_records:
            logger.warning(f"User {user_id} attempted to exceed daily limit")
            return False
        
        user.daily_records_used += 1
        if not user.last_record_reset:
            user.last_record_reset = datetime.now(timezone.utc)
        
        try:
            self.db.commit()
            logger.info(f"Incremented record count for user {user_id}: {user.daily_records_used}/{user.max_daily_records}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error incrementing record count: {str(e)}")
            return False
    
    def _reset_if_needed(self, user: User):
        now = datetime.now(timezone.utc)
        
        if user.last_record_reset:
            if now.date() > user.last_record_reset.date():
                user.daily_records_used = 0
                user.last_record_reset = now
                logger.info(f"Reset daily counter for user {user.id}")
        else:
            user.last_record_reset = now
    
    def _get_actual_today_records_count(self, user_id: int) -> int:
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
        return self.db.query(Record).filter(
            Record.user_id == user_id,
            Record.created_at >= today_start
        ).count()
    
    def _get_next_reset_time(self, last_reset: datetime) -> datetime:
        next_reset = last_reset.replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)
        return next_reset