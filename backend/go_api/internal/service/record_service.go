package service

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/client"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
)

type RecordService struct {
	db    *sql.DB
	mlURL string
}

func NewRecordService(db *sql.DB, mlURL string) *RecordService {
	return &RecordService{
		db:    db,
		mlURL: mlURL,
	}
}

func (s *RecordService) FetchUserRecords(ctx context.Context, userID int, date time.Time, limit int) ([]repository.Record, error) {
	if date.IsZero() {
		// Return latest records
		return repository.GetLatestRecords(ctx, s.db, userID, limit)
	} else {
		// Return records for the specified date
		return repository.GetRecordsByDate(ctx, s.db, userID, date, limit)
	}
}

func (s *RecordService) AnalyzeRawAudio(ctx context.Context, fileBytes []byte) (string, string, string, error) {
	log.Printf("AnalyzeRawAudio: sending file to ML service at %s", s.mlURL)
	result, err := client.CallMLService(ctx, s.mlURL, fileBytes)
	if err != nil {
		log.Printf("AnalyzeRawAudio: failed to call ML service, error: %v", err)
		return "", "", "", err
	}

	log.Printf("AnalyzeRawAudio: received response from ML service, Emotion: %s, Summary: %s, Text: %s", result.Emotion, result.Summary, result.Text)
	return result.Emotion, result.Summary, result.Text, nil
}

// GetFullAnalysis returns complete analysis including insights
func (s *RecordService) GetFullAnalysis(ctx context.Context, fileBytes []byte) (*client.AnalysisResult, error) {
	log.Printf("GetFullAnalysis: sending file to ML service at %s", s.mlURL)
	result, err := client.CallMLService(ctx, s.mlURL, fileBytes)
	if err != nil {
		log.Printf("GetFullAnalysis: failed to call ML service, error: %v", err)
		return nil, err
	}

	log.Printf("GetFullAnalysis: received complete analysis from ML service")
	return result, nil
}

func (s *RecordService) SaveRecord(ctx context.Context, userID int, emotion string, summary string) (int, error) {
	return repository.SaveRecord(ctx, s.db, userID, emotion, summary)
}

func (s *RecordService) SaveInsights(ctx context.Context, record_id int, insights string) error {
	return repository.SaveInsights(ctx, s.db, record_id, insights)
}

func (s *RecordService) FetchRecordByID(ctx context.Context, recordID int) (*repository.Record, error) {
	return repository.GetRecordByID(ctx, s.db, recordID)
}

func (s *RecordService) AnalyzeText(ctx context.Context, text string) (*client.AnalysisResult, error) {
	return client.CallMLServiceWithInsights(ctx, s.mlURL, text)
}

func (s *RecordService) DeleteRecordByID(ctx context.Context, recordID int) error {
	return repository.DeleteRecordByID(ctx, s.db, recordID)
}

func (s *RecordService) UpdateRecordFeedback(ctx context.Context, recordID int, feedback int) error {
	return repository.UpdateRecordFeedback(ctx, s.db, recordID, feedback)
}

func (s *RecordService) UpdateEmotion(ctx context.Context, recordID int, emotion string) error {
	return repository.UpdateRecordEmotion(ctx, s.db, recordID, emotion)
}

func (s *RecordService) GetConsecutiveRecordingDays(ctx context.Context, userID int) (int, error) {
	return repository.GetConsecutiveRecordingDays(ctx, s.db, userID)
}

// SaveRecordForVKUser saves record for VK user
func (s *RecordService) SaveRecordForVKUser(ctx context.Context, vkUserID int, emotion string, summary string) (int, error) {
	return repository.SaveRecordForVKUser(ctx, s.db, vkUserID, emotion, summary)
}