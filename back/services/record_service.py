from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import logging

from app.models.record import Record
from app.models.user import User
from app.schemas.record import RecordCreate, RecordUpdate, RecordResponse, RecordWithUser
from .audio_processor import AudioProcessor

logger = logging.getLogger(__name__)


class RecordService:
    def __init__(self, db: Session):
        self.db = db
        self.audio_processor = AudioProcessor()

    def get_record_by_id(self, record_id: int) -> Optional[Record]:
        return self.db.query(Record).filter(Record.id == record_id).first()

    def get_user_record(self, user_id: int, record_id: int) -> Optional[Record]:
        return self.db.query(Record).filter(
            Record.id == record_id,
            Record.user_id == user_id
        ).first()

    def process_and_create_record(self, user_id: int, audio_file_path: str, record_name: str, duration: float) -> Record:
        try:
            ml_result = self.audio_processor.process_audio(audio_file_path)

            record_data = RecordCreate(
                name=record_name,
                emotion=ml_result["emotion"],
                summary=ml_result["summary"],
                feedback=None,
                insights=ml_result["insights"],
                duration=duration
            )

            record = self.create_record(user_id, record_data)

            logger.info(
                f"Created record {record.id} from audio processing for user {user_id}")
            return record

        except Exception as e:
            logger.error(
                f"Error processing audio and creating record: {str(e)}")
            raise

    def get_user_records(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        emotion: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Record]:
        query = self.db.query(Record).filter(Record.user_id == user_id)

        if emotion:
            query = query.filter(Record.emotion == emotion)

        if start_date:
            query = query.filter(Record.created_at >= start_date)

        if end_date:
            query = query.filter(Record.created_at <= end_date)

        return query.order_by(desc(Record.created_at)).offset(skip).limit(limit).all()

    def create_record(self, user_id: int, record_data: RecordCreate) -> Record:
        try:
            record = Record(
                user_id=user_id,
                name=record_data.name,
                emotion=record_data.emotion,
                summary=record_data.summary,
                feedback=record_data.feedback,
                insights=record_data.insights,
                duration=record_data.duration,
                created_at=datetime.now(timezone.utc)
            )

            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)

            logger.info(f"Created record {record.id} for user {user_id}")
            return record

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating record for user {user_id}: {str(e)}")
            raise

    def update_record(
        self,
        user_id: int,
        record_id: int,
        record_update: RecordUpdate
    ) -> Optional[Record]:
        try:
            record = self.get_user_record(user_id, record_id)
            if not record:
                return None

            update_data = record_update.model_dump(exclude_unset=True)

            for field, value in update_data.items():
                if hasattr(record, field) and value is not None:
                    setattr(record, field, value)

            self.db.commit()
            self.db.refresh(record)

            logger.info(f"Updated record {record_id} for user {user_id}")
            return record

        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Error updating record {record_id} for user {user_id}: {str(e)}")
            raise

    def delete_record(self, user_id: int, record_id: int) -> bool:
        try:
            record = self.get_user_record(user_id, record_id)
            if not record:
                logger.warning(
                    f"Record {record_id} not found for user {user_id}")
                return False

            self.db.delete(record)
            self.db.commit()

            logger.info(f"Deleted record {record_id} for user {user_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Error deleting record {record_id} for user {user_id}: {str(e)}")
            return False

    def get_user_records_stats(self, user_id: int) -> Dict[str, Any]:
        total_records = self.db.query(Record).filter(
            Record.user_id == user_id).count()

        total_duration = self.db.query(func.coalesce(func.sum(Record.duration), 0)).filter(
            Record.user_id == user_id
        ).scalar()

        # Статистика по эмоциям
        emotion_stats = self.db.query(
            Record.emotion,
            func.count(Record.id).label('count'),
            func.avg(Record.duration).label('avg_duration')
        ).filter(
            Record.user_id == user_id
        ).group_by(Record.emotion).all()

        # Записи за последние 7 дней
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_records = self.db.query(Record).filter(
            Record.user_id == user_id,
            Record.created_at >= week_ago
        ).count()

        most_common_emotion = self.db.query(
            Record.emotion,
            func.count(Record.id).label('count')
        ).filter(
            Record.user_id == user_id
        ).group_by(Record.emotion).order_by(desc('count')).first()

        return {
            "total_records": total_records,
            "total_duration": float(total_duration),
            "recent_records_7d": recent_records,
            "emotion_stats": [
                {
                    "emotion": stat.emotion,
                    "count": stat.count,
                    "avg_duration": float(stat.avg_duration) if stat.avg_duration else 0
                } for stat in emotion_stats
            ],
            "most_common_emotion": most_common_emotion[0] if most_common_emotion else None,
            "emotion_count": most_common_emotion[1] if most_common_emotion else 0
        }

    def get_records_with_users(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[RecordWithUser]:
        """Получить записи с информацией о пользователях (для админа)"""
        records = self.db.query(Record, User.username).join(
            User, Record.user_id == User.id
        ).filter(
            User.is_active == True
        ).order_by(desc(Record.created_at)).offset(skip).limit(limit).all()

        record_list = []
        for record, username in records:
            record_dict = RecordResponse.model_validate(record).model_dump()
            record_dict['user_username'] = username
            record_list.append(RecordWithUser(**record_dict))

        return record_list

    def update_record_feedback(
        self,
        user_id: int,
        record_id: int,
        feedback: Optional[int]
    ) -> Optional[Record]:
        try:
            record = self.get_user_record(user_id, record_id)
            if not record:
                return None

            record.feedback = feedback
            self.db.commit()
            self.db.refresh(record)

            logger.info(f"Updated feedback for record {record_id} to {feedback}")
            return record

        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Error updating feedback for record {record_id}: {str(e)}")
            raise
