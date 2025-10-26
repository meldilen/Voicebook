from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import logging

from app.models.user import User
from app.models.record import Record
from app.models.session import UserSession
from app.schemas.user import UserCreate, UserUpdate, UserWithStats, SessionInfo
from app.auth import get_password_hash

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id, User.is_active == True).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email, User.is_active == True).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username, User.is_active == True).first()

    def create_user(self, user_data: UserCreate) -> User:
        try:
            hashed_password = get_password_hash(user_data.password)

            user = User(
                username=user_data.username,
                email=user_data.email,
                hashed_password=hashed_password,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )

            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

            logger.info(f"Created new user: {user.username} ({user.email})")
            return user

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating user {user_data.email}: {str(e)}")
            raise

    def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return None

            update_data = user_update.model_dump(exclude_unset=True)

            if 'password' in update_data and update_data['password']:
                update_data['hashed_password'] = get_password_hash(
                    update_data.pop('password'))

            for field, value in update_data.items():
                if hasattr(user, field) and value is not None:
                    setattr(user, field, value)

            self.db.commit()
            self.db.refresh(user)

            logger.info(f"Updated user: {user.username}")
            return user

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user {user_id}: {str(e)}")
            raise

    def delete_user(self, user_id: int) -> bool:
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                logger.warning(f"Attempted to delete non-existent user: {user_id}")
                return False
                
            self.db.delete(user)
            self.db.commit()
            
            logger.info(f"Successfully deleted user and all associated data: {user_id} (username: {user.username})")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting user {user_id}: {str(e)}", exc_info=True)
            return False

    def get_user_with_stats(self, user_id: int) -> Optional[UserWithStats]:
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        total_records = self.db.query(Record).filter(
            Record.user_id == user_id
        ).count()

        total_duration_result = self.db.query(func.coalesce(func.sum(Record.duration), 0)).filter(
            Record.user_id == user_id
        ).first()
        total_duration = float(
            total_duration_result[0]) if total_duration_result else 0.0

        consecutive_days = self._calculate_consecutive_days(user_id)

        user_response = UserWithStats(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
            total_records=total_records,
            total_duration=total_duration,
            consecutive_days=consecutive_days,
        )

        return user_response

    def _calculate_consecutive_days(self, user_id: int) -> int:
        record_dates = self.db.query(
            func.date(Record.created_at).label('record_date')
        ).filter(
            Record.user_id == user_id
        ).distinct().order_by(
            func.date(Record.created_at).desc()
        ).all()

        if not record_dates:
            return 0

        dates = [record[0] for record in record_dates]

        consecutive = 0
        current_date = datetime.now(timezone.utc).date()

        for i, record_date in enumerate(dates):
            if record_date == current_date - timedelta(days=i):
                consecutive += 1
            else:
                break

        return consecutive

    def get_user_sessions(self, user_id: int) -> List[SessionInfo]:
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).order_by(UserSession.created_at.desc()).all()

        session_info_list = []
        for session in sessions:
            session_info = SessionInfo(
                id=session.id,
                user_agent=session.user_agent,
                ip_address=session.ip_address,
                created_at=session.created_at,
                last_used=session.last_used,
                expires_at=session.expires_at
            )
            session_info_list.append(session_info)

        return session_info

    def get_active_users_count(self) -> int:
        return self.db.query(User).filter(User.is_active == True).count()

    def get_recent_users(self, days: int = 7) -> List[User]:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        return self.db.query(User).filter(
            User.created_at >= cutoff_date,
            User.is_active == True
        ).order_by(User.created_at.desc()).all()

    def update_last_login(self, user_id: int) -> bool:
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return False

            user.last_login = datetime.now(timezone.utc)
            self.db.commit()
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Error updating last login for user {user_id}: {str(e)}")
            return False

    def search_users(self, query: str, limit: int = 10) -> List[User]:
        if not query or len(query) < 2:
            return []

        search_pattern = f"%{query}%"

        return self.db.query(User).filter(
            User.is_active == True,
            or_(
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        ).limit(limit).all()
