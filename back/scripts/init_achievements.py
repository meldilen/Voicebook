import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.achievement import Achievement

def init_achievements():
    db = SessionLocal()
    
    try:
        existing = db.query(Achievement).count()
        if existing > 0:
            print("Achievements already exist, skipping initialization.")
            return

        achievements_data = [
            {
                "title": "Первый шаг",
                "description": "Сделал первую голосовую запись в дневнике",
                "icon": "🎤",
                "category": "voice",
                "category_icon": "🎤",
                "rarity": "common",
                "required_value": 1
            },
            {
                "title": "7 дней подряд",
                "description": "Вел голосовой дневник неделю без пропусков",
                "icon": "🔥",
                "category": "regularity", 
                "category_icon": "📅",
                "rarity": "rare",
                "required_value": 7
            },
            {
                "title": "Месячный марафон",
                "description": "30 дней ведения голосового дневника",
                "icon": "🏆",
                "category": "regularity",
                "category_icon": "📅", 
                "rarity": "epic",
                "required_value": 30
            },
            {
                "title": "Радуга эмоций",
                "description": "Выразил 5 или более разных эмоций в записях",
                "icon": "🌈",
                "category": "variety",
                "category_icon": "🎭",
                "rarity": "rare",
                "required_value": 5
            },
            {
                "title": "Луч света",
                "description": "Серия из 5 позитивных записей после грустной",
                "icon": "✨", 
                "category": "positivity",
                "category_icon": "😊",
                "rarity": "epic",
                "required_value": 5
            },
            {
                "title": "Эмоциональный детектив",
                "description": "Проанализировал 50 различных записей", 
                "icon": "🕵️",
                "category": "analysis",
                "category_icon": "📊",
                "rarity": "legendary",
                "required_value": 50
            },
            {
                "title": "Голос сердца",
                "description": "Записал 100 минут размышлений",
                "icon": "💖",
                "category": "voice",
                "category_icon": "🎤",
                "rarity": "common", 
                "required_value": 100
            }
        ]

        for achievement_data in achievements_data:
            achievement = Achievement(**achievement_data)
            db.add(achievement)

        db.commit()
        print(f"Successfully initialized {len(achievements_data)} achievements.")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing achievements: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_achievements()