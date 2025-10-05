package service

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
)

type AchievementsService struct {
	db *sql.DB
}

func NewAchievementsService(db *sql.DB) *AchievementsService {
	return &AchievementsService{
		db: db,
	}
}

type Achievement struct {
	ID           int        `json:"id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Icon         string     `json:"icon"`
	Category     string     `json:"category"`
	CategoryIcon string     `json:"categoryIcon"`
	Rarity       string     `json:"rarity"`
	Unlocked     bool       `json:"unlocked"`
	Progress     int        `json:"progress"`
	Required     int        `json:"required"`
	DateUnlocked *time.Time `json:"dateUnlocked"`
}

func (s *AchievementsService) GetUserAchievements(ctx context.Context, userID int, userType string) ([]Achievement, error) {
    log.Printf("GetUserAchievements: fetching achievements for %s user %d", userType, userID)

    var records []repository.Record
    var err error

    // Получаем записи в зависимости от типа пользователя
    if userType == "vk" {
        records, err = repository.GetRecordsByVKUser(ctx, s.db, userID)
    } else {
        records, err = repository.GetRecordsByUser(ctx, s.db, userID)
    }
    
    if err != nil {
        return nil, err
    }

    // Получаем consecutive days в зависимости от типа пользователя
    var consecutiveDays int
    if userType == "vk" {
        consecutiveDays, _ = s.getConsecutiveRecordingDaysForVKUser(ctx, userID)
    } else {
        consecutiveDays, _ = repository.GetConsecutiveRecordingDays(ctx, s.db, userID)
    }

    // Calculate various statistics
    totalRecords := len(records)
    totalMinutes := s.calculateTotalMinutes(records)
    uniqueEmotions := s.getUniqueEmotions(records)
    positiveStreak := s.calculatePositiveStreak(records)

    // Define achievements template
    achievements := []Achievement{
        {
            ID:           1,
            Title:        "Первый шаг",
            Description:  "Сделал первую голосовую запись в дневнике",
            Icon:         "🎤",
            Category:     "voice",
            CategoryIcon: "🎤",
            Rarity:       "common",
            Required:     1,
        },
        {
            ID:           2,
            Title:        "7 дней подряд",
            Description:  "Вел голосовой дневник неделю без пропусков",
            Icon:         "🔥",
            Category:     "regularity",
            CategoryIcon: "📅",
            Rarity:       "rare",
            Required:     7,
        },
        {
            ID:           3,
            Title:        "Месячный марафон",
            Description:  "30 дней ведения голосового дневника",
            Icon:         "🏆",
            Category:     "regularity",
            CategoryIcon: "📅",
            Rarity:       "epic",
            Required:     30,
        },
        {
            ID:           4,
            Title:        "Радуга эмоций",
            Description:  "Выразил 5 или более разных эмоций в записях",
            Icon:         "🌈",
            Category:     "variety",
            CategoryIcon: "🎭",
            Rarity:       "rare",
            Required:     5,
        },
        {
            ID:           5,
            Title:        "Взгляд в прошлое",
            Description:  "Прослушал записи за другой день (месяц назад)",
            Icon:         "🔍",
            Category:     "reflection",
            CategoryIcon: "🤔",
            Rarity:       "rare",
            Required:     1,
        },
        {
            ID:           6,
            Title:        "Луч света",
            Description:  "Серия из 5 позитивных записей после грустной",
            Icon:         "✨",
            Category:     "positivity",
            CategoryIcon: "😊",
            Rarity:       "epic",
            Required:     5,
        },
        {
            ID:           7,
            Title:        "Эмоциональный детектив",
            Description:  "Проанализировал 50 различных записей",
            Icon:         "🕵️",
            Category:     "analysis",
            CategoryIcon: "📊",
            Rarity:       "legendary",
            Required:     50,
        },
        {
            ID:           8,
            Title:        "Голос сердца",
            Description:  "Записал 100 минут размышлений",
            Icon:         "💖",
            Category:     "voice",
            CategoryIcon: "🎤",
            Rarity:       "common",
            Required:     100,
        },
        {
            ID:           9,
            Title:        "Сердечный друг",
            Description:  "Поделился достижениями с друзьями",
            Icon:         "💖",
            Category:     "social",
            Rarity:       "common",
            Required:     1,
        },
    }

    // Calculate progress for each achievement
    for i := range achievements {
        progress, unlocked, dateUnlocked := s.calculateAchievementProgress(
            ctx, userID, &achievements[i], records, consecutiveDays, 
            totalRecords, totalMinutes, len(uniqueEmotions), positiveStreak,
        )
        
        achievements[i].Progress = progress
        achievements[i].Unlocked = unlocked
        achievements[i].DateUnlocked = dateUnlocked

        // Сохраняем прогресс в базу данных
        if progress > 0 || unlocked {
            if userType == "vk" {
                repository.SaveVKUserAchievement(ctx, s.db, userID, achievements[i].ID, progress, unlocked)
            } else {
                repository.SaveUserAchievement(ctx, s.db, userID, achievements[i].ID, progress, unlocked)
            }
        }
    }

    log.Printf("GetUserAchievements: successfully calculated %d achievements for %s user %d", len(achievements), userType, userID)
    return achievements, nil
}

// Временная реализация для VK пользователей (пока нет отдельного метода в репозитории)
func (s *AchievementsService) getConsecutiveRecordingDaysForVKUser(ctx context.Context, vkUserID int) (int, error) {
    // Используем ту же логику что и для обычных пользователей
    // В будущем можно добавить отдельный метод в репозитории
    return repository.GetConsecutiveRecordingDays(ctx, s.db, vkUserID)
}

func (s *AchievementsService) calculateAchievementProgress(
    ctx context.Context, 
    userID int, 
    achievement *Achievement, 
    records []repository.Record, 
    consecutiveDays, totalRecords, totalMinutes, uniqueEmotionsCount, positiveStreak int,
) (int, bool, *time.Time) {
    
    switch achievement.ID {
    case 1: // Первый шаг
        progress := s.min(totalRecords, 1)
        unlocked := totalRecords >= 1
        var dateUnlocked *time.Time
        if unlocked && len(records) > 0 {
            dateUnlocked = &records[0].RecordDate
        }
        log.Printf("Achievement 1: %s user %d has %d records, unlocked: %t", ctx.Value("userType"), userID, totalRecords, unlocked)
        return progress, unlocked, dateUnlocked

    case 2: // 7 дней подряд
        progress := s.min(consecutiveDays, 7)
        unlocked := consecutiveDays >= 7
        log.Printf("Achievement 2: %s user %d has %d consecutive days, unlocked: %t", ctx.Value("userType"), userID, consecutiveDays, unlocked)
        return progress, unlocked, nil

    case 3: // Месячный марафон
        progress := s.min(consecutiveDays, 30)
        unlocked := consecutiveDays >= 30
        log.Printf("Achievement 3: %s user %d has %d consecutive days, unlocked: %t", ctx.Value("userType"), userID, consecutiveDays, unlocked)
        return progress, unlocked, nil

    case 4: // Радуга эмоций
        progress := s.min(uniqueEmotionsCount, 5)
        unlocked := uniqueEmotionsCount >= 5
        log.Printf("Achievement 4: %s user %d has %d unique emotions, unlocked: %t", ctx.Value("userType"), userID, uniqueEmotionsCount, unlocked)
        return progress, unlocked, nil

    case 5: // Взгляд в прошлое
        // This would require additional logic to track if user listened to old records
        // For now, we'll set it as not unlocked
        return 0, false, nil

    case 6: // Луч света
        progress := s.min(positiveStreak, 5)
        unlocked := positiveStreak >= 5
        log.Printf("Achievement 6: %s user %d has %d positive streak, unlocked: %t", ctx.Value("userType"), userID, positiveStreak, unlocked)
        return progress, unlocked, nil

    case 7: // Эмоциональный детектив
        progress := s.min(totalRecords, 50)
        unlocked := totalRecords >= 50
        log.Printf("Achievement 7: %s user %d has %d total records, unlocked: %t", ctx.Value("userType"), userID, totalRecords, unlocked)
        return progress, unlocked, nil

    case 8: // Голос сердца
        progress := s.min(totalMinutes, 100)
        unlocked := totalMinutes >= 100
        log.Printf("Achievement 8: %s user %d has %d total minutes, unlocked: %t", ctx.Value("userType"), userID, totalMinutes, unlocked)
        return progress, unlocked, nil

    case 9: // Сердечный друг
        // This would require social sharing logic
        // For now, we'll set it as not unlocked
        return 0, false, nil

    default:
        return 0, false, nil
    }
}

func (s *AchievementsService) UpdateAchievementProgress(ctx context.Context, userID, achievementID, progress int, userType string) error {
    log.Printf("UpdateAchievementProgress: %s user %d, achievement %d, progress %d", userType, userID, achievementID, progress)
    
    // Сохраняем прогресс в базу данных
    if userType == "vk" {
        return repository.SaveVKUserAchievement(ctx, s.db, userID, achievementID, progress, progress >= getRequiredProgress(achievementID))
    } else {
        return repository.SaveUserAchievement(ctx, s.db, userID, achievementID, progress, progress >= getRequiredProgress(achievementID))
    }
}

// Helper functions
func (s *AchievementsService) calculateTotalMinutes(records []repository.Record) int {
    // Estimate 1 minute per record for now
    // In a real implementation, you would calculate actual audio duration
    return len(records)
}

func (s *AchievementsService) getUniqueEmotions(records []repository.Record) map[string]bool {
    emotions := make(map[string]bool)
    for _, record := range records {
        if record.Emotion != "" {
            emotions[record.Emotion] = true
        }
    }
    return emotions
}

func (s *AchievementsService) calculatePositiveStreak(records []repository.Record) int {
    // Simple implementation - count records with positive emotions
    positiveCount := 0
    positiveEmotions := map[string]bool{
        "happy":    true,
        "joy":      true,
        "excited":  true,
        "positive": true,
    }

    for _, record := range records {
        if positiveEmotions[record.Emotion] {
            positiveCount++
        } else {
            // Reset streak if negative emotion found
            positiveCount = 0
        }
    }

    return positiveCount
}

func (s *AchievementsService) min(a, b int) int {
    if a < b {
        return a
    }
    return b
}

// Helper function to get required progress for achievement
func getRequiredProgress(achievementID int) int {
    requirements := map[int]int{
        1: 1, 2: 7, 3: 30, 4: 5, 5: 1, 6: 5, 7: 50, 8: 100, 9: 1,
    }
    return requirements[achievementID]
}