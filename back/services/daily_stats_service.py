import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Optional, Dict, Any
import logging

from app.models.daily_stats import DailyStats
from app.models.record import Record
from back.services.gpt_service import call_gpt
from back.services.utils.iam_token import get_iam_token

logger = logging.getLogger(__name__)

class DailyStatsService:
    def __init__(self, db: Session):
        self.db = db
        self.DAILY_SUMMARY_PROMPT = """Ты — внимательный и заботливый психолог. Твоя задача — проанализировать дневные записи пользователя и дать общую характеристику дня.

Проанализируй предоставленные тексты дневниковых записей за день и представь результат в формате JSON по указанной ниже структуре.

{
  "dominant_emotion": "",
  "summary": ""
}

В поле dominant_emotion укажи одну из эмоций, которая, по твоему мнению, преобладала у пользователя в течение дня на основе всех записей. Выбери из: angry, disgust, fearful, happy, neutral, sadness, surprised.
В поле summary напиши общее текстовое резюме дня, объединив все записи. Будь внимательным и заботливым, как психолог, который старается понять и поддержать. Длина summary не должна превышать 500 символов.
Если предоставленных текстов недостаточно для анализа, то в dominant_emotion укажи "neutral", а в summary - "Недостаточно данных для анализа"."""

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
            fallback_dominant_emotion = max(emotion_count.items(), key=lambda x: x[1])[0] if emotion_count else None
            
            iam_token = get_iam_token()
            # Инициализируем переменные для GPT-анализа
            gpt_dominant_emotion = None
            daily_summary_from_gpt = None

            # Вызываем GPT для анализа, если есть токен и саммари
            if iam_token and all_summaries:
                try:
                    # Объединяем все саммари в один текст для анализа
                    combined_summaries = "\n\n".join(all_summaries)

                    # Вызываем GPT для анализа дневных записей
                    gpt_response = call_gpt(
                        text=combined_summaries,
                        prompt=self.DAILY_SUMMARY_PROMPT,
                        model_name="yandexgpt",
                        iam_token=iam_token
                    )

                    # Парсим ответ GPT
                    gpt_data = json.loads(gpt_response.strip())
                    gpt_dominant_emotion = gpt_data.get("dominant_emotion")
                    daily_summary_from_gpt = gpt_data.get("summary")

                    logger.info(f"GPT анализ завершен для дня {target_date}. "
                              f"Эмоция от GPT: {gpt_dominant_emotion}, "
                              f"fallback эмоция: {fallback_dominant_emotion}")

                except json.JSONDecodeError as e:
                    logger.error(f"Ошибка парсинга JSON от GPT: {str(e)}. Ответ: {gpt_response}")
                except Exception as e:
                    logger.error(f"Ошибка при вызове GPT для анализа дневных записей: {str(e)}")
        
            # Выбираем доминирующую эмоцию: сначала от GPT, потом fallback
            final_dominant_emotion = gpt_dominant_emotion if gpt_dominant_emotion else fallback_dominant_emotion
            final_summary = daily_summary_from_gpt if daily_summary_from_gpt else None

            # Создаем или обновляем статистику
            existing_stat = self.get_daily_stats(user_id, target_date)
            
            if existing_stat:
                # Обновляем существующую запись
                existing_stat.dominant_emotion = final_dominant_emotion
                existing_stat.emotion_distribution = emotion_count
                existing_stat.records_count = len(records)
                existing_stat.total_duration = total_duration
                existing_stat.daily_summary = final_summary
                self.db.commit()
                self.db.refresh(existing_stat)
                return existing_stat
            else:
                daily_stat = DailyStats(
                    user_id=user_id,
                    date=target_date,
                    dominant_emotion=final_dominant_emotion,
                    emotion_distribution=emotion_count,
                    records_count=len(records),
                    total_duration=total_duration,
                    daily_summary=final_summary
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