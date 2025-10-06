package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"
)

type UserTotal struct {
	ID      int       `json:"id"`
	UserID  int       `json:"user_id"`
	Date    time.Time `json:"date"`
	Emotion *string   `json:"emotion"`
	Summary *string   `json:"summary"`
}

func SaveOrUpdateUserTotal(ctx context.Context, db *sql.DB, userID int, date time.Time, emotion, summary string) error {
	log.Printf("SaveOrUpdateUserTotal: saving totals for user %d on date %s", userID, date.Format("2006-01-02"))

	query := `
		INSERT INTO user_totals (user_id, date, emotion, summary)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, date) 
		DO UPDATE SET 
			emotion = EXCLUDED.emotion,
			summary = EXCLUDED.summary
	`
	_, err := db.ExecContext(ctx, query, userID, date, emotion, summary)
	if err != nil {
		log.Printf("SaveOrUpdateUserTotal: failed to save totals, error: %v", err)
		return err
	}

	log.Printf("SaveOrUpdateUserTotal: successfully saved totals for user %d", userID)
	return nil
}

func GetUserTotalsByDateRange(ctx context.Context, db *sql.DB, userID int, startDate, endDate time.Time) ([]UserTotal, error) {
    log.Printf("Querying totals for user %d between %s and %s (as dates)", 
        userID, 
        startDate.Format("2006-01-02"), 
        endDate.Format("2006-01-02"))

    query := `
        SELECT id, user_id, date, emotion, summary 
FROM user_totals
WHERE user_id = $1 
  AND date::date BETWEEN $2::date AND $3::date
ORDER BY date ASC`
    
    rows, err := db.QueryContext(ctx, query, userID, startDate, endDate)
    if err != nil {
        log.Printf("Query failed: %v", err)
        return nil, fmt.Errorf("failed to query user totals: %w", err)
    }
    defer rows.Close()
    
    var totals []UserTotal
    for rows.Next() {
        var t UserTotal
        err := rows.Scan(&t.ID, &t.UserID, &t.Date, &t.Emotion, &t.Summary)
        if err != nil {
            log.Printf("Row scan failed: %v", err)
            return nil, fmt.Errorf("failed to scan user total: %w", err)
        }
        t.Date = time.Date(t.Date.Year(), t.Date.Month(), t.Date.Day(), 0, 0, 0, 0, t.Date.Location())
        totals = append(totals, t)
    }
    
    log.Printf("Found %d totals for user %d", len(totals), userID)
    
    return totals, nil
}

func DeleteUserTotal(ctx context.Context, db *sql.DB, userID int, date time.Time) error {
	log.Printf("DeleteUserTotal: deleting total for user %d on date %s", userID, date.Format("2006-01-02"))

	query := `DELETE FROM user_totals WHERE user_id = $1 AND date = $2`
	_, err := db.ExecContext(ctx, query, userID, date)
	if err != nil {
		log.Printf("DeleteUserTotal: failed to delete total, error: %v", err)
		return err
	}

	log.Printf("DeleteUserTotal: successfully deleted total for user %d", userID)
	return nil
}