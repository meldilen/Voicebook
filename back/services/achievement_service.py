from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.models.user import User
from app.schemas.achievement import AchievementResponse, UserAchievementResponse, AchievementProgress
from datetime import datetime

class AchievementService:
    
    @staticmethod
    def get_all_achievements(db: Session) -> List[AchievementResponse]:
        achievements = db.query(Achievement).all()
        return [AchievementResponse.model_validate(achievement) for achievement in achievements]
    
    @staticmethod
    def get_user_achievements(db: Session, user_id: int) -> List[UserAchievementResponse]:
        user_achievements = (
            db.query(UserAchievement)
            .filter(UserAchievement.user_id == user_id)
            .all()
        )
        
        result = []
        for ua in user_achievements:
            user_achievement_data = UserAchievementResponse(
                id=ua.id,
                unlocked=ua.unlocked,
                progress=ua.progress,
                date_unlocked=ua.date_unlocked,
                achievement=AchievementResponse.model_validate(ua.achievement)
            )
            result.append(user_achievement_data)
        
        return result
    
    @staticmethod
    def get_achievement_progress(db: Session, user_id: int, achievement_id: int) -> Optional[AchievementProgress]:
        user_achievement = (
            db.query(UserAchievement)
            .filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement_id
            )
            .first()
        )
        
        if not user_achievement:
            return None
            
        return AchievementProgress(
            achievement_id=achievement_id,
            progress=user_achievement.progress,
            required_value=user_achievement.achievement.required_value,
            unlocked=user_achievement.unlocked
        )
    
    @staticmethod
    def update_achievement_progress(
        db: Session, 
        user_id: int, 
        achievement_id: int, 
        progress_increment: int = 1
    ) -> Optional[UserAchievement]:
        # Находим или создаем запись о достижении пользователя
        user_achievement = (
            db.query(UserAchievement)
            .filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement_id
            )
            .first()
        )
        
        if not user_achievement:
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement_id,
                progress=0,
                unlocked=False
            )
            db.add(user_achievement)
            db.flush()  # Получаем ID без коммита
        
        if not user_achievement.unlocked:
            user_achievement.progress += progress_increment
            
            # Проверяем, достигнут ли требуемый прогресс
            achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
            if achievement and user_achievement.progress >= achievement.required_value:
                user_achievement.unlocked = True
                user_achievement.date_unlocked = datetime.now()
                user_achievement.progress = achievement.required_value
        
        db.commit()
        return user_achievement
    
    @staticmethod
    def initialize_user_achievements(db: Session, user_id: int):
        achievements = db.query(Achievement).all()
        
        for achievement in achievements:
            existing = (
                db.query(UserAchievement)
                .filter(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_id == achievement.id
                )
                .first()
            )
            
            if not existing:
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    progress=0,
                    unlocked=False
                )
                db.add(user_achievement)
        
        db.commit()
    
    @staticmethod
    def get_achievement_stats(db: Session, user_id: int) -> dict:
        """Получить статистику по достижениям пользователя"""
        user_achievements = (
            db.query(UserAchievement)
            .filter(UserAchievement.user_id == user_id)
            .all()
        )
        
        total_achievements = db.query(Achievement).count()
        unlocked_count = sum(1 for ua in user_achievements if ua.unlocked)
        completion_percentage = round((unlocked_count / total_achievements) * 100) if total_achievements > 0 else 0
        
        # Группировка по категориям
        categories = {}
        for ua in user_achievements:
            category = ua.achievement.category
            if category not in categories:
                categories[category] = {
                    'total': 0,
                    'unlocked': 0,
                    'icon': ua.achievement.category_icon
                }
            
            categories[category]['total'] += 1
            if ua.unlocked:
                categories[category]['unlocked'] += 1
        
        return {
            'total_count': total_achievements,
            'unlocked_count': unlocked_count,
            'completion_percentage': completion_percentage,
            'categories': categories
        }