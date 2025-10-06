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
  db *sql.DB
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

func (s *TotalService) GetCombinedData(ctx context.Context, summaries []string) (*client.CombinedData, error) {
  log.Printf("GetCombinedSummary: sending %d summaries to ML service", len(summaries))

  // Объединяем все данные через разделитель
  combinedText := strings.Join(summaries, "\n")

  // Отправляем в ML-сервис
  result, err := client.CallMLServiceWithCombinedText(ctx, s.mlURL, combinedText)
  if err != nil {
    log.Printf("GetCombinedSummary: failed to get combined data, error: %v", err)
    return nil, err
  }

  log.Printf("GetCombinedSummary: successfully received combined data")
  return result, nil
}

func (s *TotalService) CalculateDailyTotal(ctx context.Context, userID int, date time.Time) error {
    log.Printf("CalculateDailyTotal: calculating for user %d on %s", userID, date.Format("2006-01-02"))
    
    records, err := repository.GetRecordsByDate(ctx, s.db, userID, date, 0)
    if err != nil {
        return fmt.Errorf("failed to get records: %w", err)
    }

    if len(records) == 0 {
        log.Printf("No records found for date %s, deleting total if exists", date.Format("2006-01-02"))
        if err := repository.DeleteUserTotal(ctx, s.db, userID, date); err != nil && err != sql.ErrNoRows {
            return fmt.Errorf("failed to delete total: %w", err)
        }
        return nil
    }

  summaries := make([]string, len(records))
  for i, record := range records {
    summaries[i] = record.Summary
  }

    // Получаем combinedData (эмоцию и саммари) из ML сервиса
    result, err := s.GetCombinedData(ctx, summaries)
    if err != nil {
        return fmt.Errorf("failed to get combined data from ML service: %w", err)
    }

    // Сохраняем результат в базу
    if err := repository.SaveOrUpdateUserTotal(ctx, s.db, userID, date, result.Emotion, result.Summary); err != nil {
        return fmt.Errorf("failed to save total: %w", err)
    }

    log.Printf("Successfully calculated total for user %d on %s", userID, date.Format("2006-01-02"))
    return nil
}