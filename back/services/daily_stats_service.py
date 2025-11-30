from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Optional, Dict, Any
import logging

from app.models.daily_stats import DailyStats
from app.models.record import Record

logger = logging.getLogger(__name__)

class DailyStatsService:
    def __init__(self, db: Session):
        self.db = db

    def get_daily_stats(self, user_id: int, target_date: date) -> Optional[DailyStats]:
        return self.db.query(DailyStats).filter(
            DailyStats.user_id == user_id,
            DailyStats.date == target_date
        ).first()

    def get_calendar_data(
        self, 
        user_id: int, 
        year: int, 
        month: int
    ) -> List[Dict[str, Any]]:
        """Получить данные для календаря за конкретный месяц"""
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        # Получаем статистику за месяц
        stats = self.db.query(DailyStats).filter(
            DailyStats.user_id == user_id,
            DailyStats.date >= start_date,
            DailyStats.date < end_date
        ).all()
        
        # Создаем словарь для быстрого доступа
        stats_dict = {stat.date: stat for stat in stats}
        
        # Формируем ответ для календаря
        calendar_data = []
        current_date = start_date
        
        while current_date < end_date:
            stat = stats_dict.get(current_date)
            calendar_data.append({
                "date": current_date,
                "dominant_emotion": stat.dominant_emotion if stat else None,
                "records_count": stat.records_count if stat else 0,
                "has_records": stat.records_count > 0 if stat else False
            })
            current_date += timedelta(days=1)
        
        return calendar_data

    def generate_daily_stats(self, user_id: int, target_date: date) -> Optional[DailyStats]:
        """Генерация статистики за день на основе записей"""
        try:
            # Получаем все записи пользователя за указанный день
            records = self.db.query(Record).filter(
                Record.user_id == user_id,
                func.date(Record.created_at) == target_date
            ).all()
            
            if not records:
                return None
            
            # Анализируем записи
            emotion_count = {}
            total_duration = 0
            all_summaries = []
            
            for record in records:
                # Считаем эмоции
                emotion_count[record.emotion] = emotion_count.get(record.emotion, 0) + 1
                total_duration += record.duration
                if record.summary:
                    all_summaries.append(record.summary)
            
            # Определяем доминирующую эмоцию
            dominant_emotion = max(emotion_count.items(), key=lambda x: x[1])[0] if emotion_count else None
            
            # Создаем или обновляем статистику
            existing_stat = self.get_daily_stats(user_id, target_date)
            
            if existing_stat:
                # Обновляем существующую запись
                existing_stat.dominant_emotion = dominant_emotion
                existing_stat.emotion_distribution = emotion_count
                existing_stat.records_count = len(records)
                existing_stat.total_duration = total_duration
                # daily_summary будет заполнено позже через LLM
                self.db.commit()
                self.db.refresh(existing_stat)
                return existing_stat
            else:
                daily_stat = DailyStats(
                    user_id=user_id,
                    date=target_date,
                    dominant_emotion=dominant_emotion,
                    emotion_distribution=emotion_count,
                    records_count=len(records),
                    total_duration=total_duration,
                    # daily_summary будет заполнено позже
                )
                self.db.add(daily_stat)
                self.db.commit()
                self.db.refresh(daily_stat)
                return daily_stat
                
        except Exception as e:
            logger.error(f"Error generating daily stats for user {user_id} on {target_date}: {str(e)}")
            self.db.rollback()
            return None

    def update_daily_summary(
        self, 
        user_id: int, 
        target_date: date, 
        summary: str
    ) -> Optional[DailyStats]:
        """Обновление саммари дня (будет вызываться после обработки LLM)"""
        try:
            daily_stat = self.get_daily_stats(user_id, target_date)
            if not daily_stat:
                return None
            
            daily_stat.daily_summary = summary
            self.db.commit()
            self.db.refresh(daily_stat)
            return daily_stat
            
        except Exception as e:
            logger.error(f"Error updating daily summary for user {user_id} on {target_date}: {str(e)}")
            self.db.rollback()
            return None

    def get_calendar_detail(self, user_id: int, target_date: date) -> Optional[DailyStats]:
        """Получить детальную информацию для дня в календаре"""
        return self.get_daily_stats(user_id, target_date)