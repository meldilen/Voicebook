package service

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/client"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
)

type TotalService struct {
	db    *sql.DB
	mlURL string
}

func NewTotalService(db *sql.DB, mlURL string) *TotalService {
	return &TotalService{
		db:    db,
		mlURL: mlURL,
	}
}

func (s *TotalService) UpdateUserTotal(ctx context.Context, userID int, date time.Time, emotion, summary string) error {
	return repository.SaveOrUpdateUserTotal(ctx, s.db, userID, date, emotion, summary)
}

func (s *TotalService) GetUserTotals(ctx context.Context, userID int, startDate, endDate time.Time) ([]repository.UserTotal, error) {
	return repository.GetUserTotalsByDateRange(ctx, s.db, userID, startDate, endDate)
}

func (s *TotalService) GetCombinedData(ctx context.Context, summaries []string, emotions []string) (*client.CombinedData, error) {
	log.Printf("GetCombinedData: processing %d summaries and %d emotions", len(summaries), len(emotions))

	// Combine summaries for ML processing
	combinedText := strings.Join(summaries, "\n\n")
	
	// If we have emotions, include them in the context for better analysis
	if len(emotions) > 0 {
		emotionContext := "Emotions detected today: " + strings.Join(emotions, ", ")
		combinedText = emotionContext + "\n\n" + combinedText
	}

	log.Printf("GetCombinedData: sending combined text to ML service, length: %d", len(combinedText))

	// Send to ML service for combined analysis
	result, err := client.CallMLServiceWithCombinedText(ctx, s.mlURL, combinedText)
	if err != nil {
		log.Printf("GetCombinedData: failed to get combined data, error: %v", err)
		return nil, err
	}

	log.Printf("GetCombinedData: successfully received combined data - emotion: %s, summary length: %d", 
		result.Emotion, len(result.Summary))
	return result, nil
}

// CalculateDominantEmotion calculates the most frequent emotion from a list
func (s *TotalService) CalculateDominantEmotion(emotions []string) string {
	if len(emotions) == 0 {
		return "neutral"
	}

	emotionCount := make(map[string]int)
	for _, emotion := range emotions {
		emotionCount[emotion]++
	}

	maxCount := 0
	dominantEmotion := "neutral"
	for emotion, count := range emotionCount {
		if count > maxCount {
			maxCount = count
			dominantEmotion = emotion
		}
	}

	return dominantEmotion
}

func (s *TotalService) CalculateDailyTotal(ctx context.Context, userID int, date time.Time) error {
	log.Printf("CalculateDailyTotal: calculating for user %d on %s", userID, date.Format("2006-01-02"))
	
	// Get all records for the specified date
	records, err := repository.GetRecordsByDate(ctx, s.db, userID, date, 0)
	if err != nil {
		return fmt.Errorf("failed to get records: %w", err)
	}

	if len(records) == 0 {
		log.Printf("CalculateDailyTotal: no records found for date %s, deleting total if exists", date.Format("2006-01-02"))
		if err := repository.DeleteUserTotal(ctx, s.db, userID, date); err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("failed to delete total: %w", err)
		}
		return nil
	}

	log.Printf("CalculateDailyTotal: processing %d records for user %d", len(records), userID)

	// Extract summaries and emotions from records
	summaries := make([]string, 0, len(records))
	emotions := make([]string, 0, len(records))
	
	for _, record := range records {
		if record.Summary != "" {
			summaries = append(summaries, record.Summary)
		}
		if record.Emotion != "" {
			emotions = append(emotions, record.Emotion)
		}
	}

	var dailyEmotion string
	var dailySummary string

	if len(summaries) == 0 {
		// If no summaries, use dominant emotion from individual records
		dailyEmotion = s.CalculateDominantEmotion(emotions)
		dailySummary = "No summary available for today's records."
	} else if len(summaries) == 1 {
		// If only one record, use its emotion and summary directly
		dailyEmotion = emotions[0]
		dailySummary = summaries[0]
	} else {
		// Multiple records - get combined analysis from ML service
		result, err := s.GetCombinedData(ctx, summaries, emotions)
		if err != nil {
			log.Printf("CalculateDailyTotal: falling back to dominant emotion due to ML error: %v", err)
			// Fallback: use dominant emotion and combine summaries manually
			dailyEmotion = s.CalculateDominantEmotion(emotions)
			dailySummary = "Combined insights from " + fmt.Sprintf("%d", len(summaries)) + " recordings: " + strings.Join(summaries, " ")
			if len(dailySummary) > 500 {
				dailySummary = dailySummary[:500] + "..."
			}
		} else {
			dailyEmotion = result.Emotion
			dailySummary = result.Summary
			
			// If ML didn't return emotion, use dominant emotion as fallback
			if dailyEmotion == "" {
				dailyEmotion = s.CalculateDominantEmotion(emotions)
			}
		}
	}

	// Ensure we have valid values
	if dailyEmotion == "" {
		dailyEmotion = s.CalculateDominantEmotion(emotions)
	}
	if dailySummary == "" {
		dailySummary = "Daily summary based on " + fmt.Sprintf("%d", len(records)) + " recording(s)"
	}

	log.Printf("CalculateDailyTotal: saving daily total - emotion: %s, summary length: %d", 
		dailyEmotion, len(dailySummary))

	// Save the result
	if err := repository.SaveOrUpdateUserTotal(ctx, s.db, userID, date, dailyEmotion, dailySummary); err != nil {
		return fmt.Errorf("failed to save total: %w", err)
	}

	log.Printf("CalculateDailyTotal: successfully calculated total for user %d on %s", userID, date.Format("2006-01-02"))
	return nil
}

// CalculateAllDailyTotals recalculates totals for all days with records
func (s *TotalService) CalculateAllDailyTotals(ctx context.Context, userID int) error {
	log.Printf("CalculateAllDailyTotals: recalculating all daily totals for user %d", userID)
	
	// Get all unique dates with records
	dates, err := repository.GetRecordDatesForUser(ctx, s.db, userID)
	if err != nil {
		return fmt.Errorf("failed to get record dates: %w", err)
	}

	log.Printf("CalculateAllDailyTotals: found %d unique dates with records", len(dates))
	
	for _, date := range dates {
		if err := s.CalculateDailyTotal(ctx, userID, date); err != nil {
			log.Printf("CalculateAllDailyTotals: failed to calculate total for date %s: %v", date.Format("2006-01-02"), err)
			// Continue with other dates even if one fails
		}
	}

	log.Printf("CalculateAllDailyTotals: completed processing %d dates", len(dates))
	return nil
}