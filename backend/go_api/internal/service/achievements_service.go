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

func (s *AchievementsService) GetUserAchievements(ctx context.Context, userID int) ([]Achievement, error) {
	log.Printf("GetUserAchievements: fetching achievements for user %d", userID)

	// Get user statistics
	records, err := repository.GetRecordsByUser(ctx, s.db, userID)
	if err != nil {
		return nil, err
	}

	// Get consecutive days
	consecutiveDays, _ := repository.GetConsecutiveRecordingDays(ctx, s.db, userID)

	// Calculate various statistics
	totalRecords := len(records)
	totalMinutes := calculateTotalMinutes(records)
	uniqueEmotions := getUniqueEmotions(records)
	positiveStreak := calculatePositiveStreak(records)

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
	}

	return achievements, nil
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
		progress := min(totalRecords, 1)
		unlocked := totalRecords >= 1
		var dateUnlocked *time.Time
		if unlocked && len(records) > 0 {
			dateUnlocked = &records[0].RecordDate
		}
		return progress, unlocked, dateUnlocked

	case 2: // 7 дней подряд
		progress := min(consecutiveDays, 7)
		unlocked := consecutiveDays >= 7
		return progress, unlocked, nil

	case 3: // Месячный марафон
		progress := min(consecutiveDays, 30)
		unlocked := consecutiveDays >= 30
		return progress, unlocked, nil

	case 4: // Радуга эмоций
		progress := min(uniqueEmotionsCount, 5)
		unlocked := uniqueEmotionsCount >= 5
		return progress, unlocked, nil

	case 5: // Взгляд в прошлое
		// This would require additional logic to track if user listened to old records
		// For now, we'll set it as not unlocked
		return 0, false, nil

	case 6: // Луч света
		progress := min(positiveStreak, 5)
		unlocked := positiveStreak >= 5
		return progress, unlocked, nil

	case 7: // Эмоциональный детектив
		progress := min(totalRecords, 50)
		unlocked := totalRecords >= 50
		return progress, unlocked, nil

	case 8: // Голос сердца
		progress := min(totalMinutes, 100)
		unlocked := totalMinutes >= 100
		return progress, unlocked, nil

	case 9: // Сердечный друг
		// This would require social sharing logic
		// For now, we'll set it as not unlocked
		return 0, false, nil

	default:
		return 0, false, nil
	}
}

func (s *AchievementsService) UpdateAchievementProgress(ctx context.Context, userID, achievementID, progress int) error {
	// This would update the progress in the database
	// For now, we'll just log it
	log.Printf("UpdateAchievementProgress: user %d, achievement %d, progress %d", userID, achievementID, progress)
	return nil
}

// Helper functions
func calculateTotalMinutes(records []repository.Record) int {
	// Estimate 1 minute per record for now
	// In a real implementation, you would calculate actual audio duration
	return len(records)
}

func getUniqueEmotions(records []repository.Record) map[string]bool {
	emotions := make(map[string]bool)
	for _, record := range records {
		if record.Emotion != "" {
			emotions[record.Emotion] = true
		}
	}
	return emotions
}

func calculatePositiveStreak(records []repository.Record) int {
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

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}