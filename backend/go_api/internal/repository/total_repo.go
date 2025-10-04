package repository

import (
	"context"
	"database/sql"
	"log"
	"time"

	_ "github.com/lib/pq"
)

type UserTotal struct {
	ID      int       `json:"id"`
	UserID  int       `json:"user_id"`
	Date    time.Time `json:"date"`
	Emotion string    `json:"emotion"`
	Summary string    `json:"summary"`
}

// SaveOrUpdateUserTotal saves or updates the daily total for a user
func SaveOrUpdateUserTotal(ctx context.Context, db *sql.DB, userID int, date time.Time, emotion, summary string) error {
	log.Printf("SaveOrUpdateUserTotal: saving daily total for user %d on %s", userID, date.Format("2006-01-02"))

	query := `
		INSERT INTO user_totals (user_id, date, emotion, summary)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, date) 
		DO UPDATE SET 
			emotion = EXCLUDED.emotion,
			summary = EXCLUDED.summary,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`

	var id int
	err := db.QueryRowContext(ctx, query, userID, date, emotion, summary).Scan(&id)
	if err != nil {
		log.Printf("SaveOrUpdateUserTotal: failed to save/update total for user %d, error: %v", userID, err)
		return err
	}

	log.Printf("SaveOrUpdateUserTotal: successfully saved/updated total with ID %d for user %d", id, userID)
	return nil
}

// GetUserTotalsByDateRange returns daily totals for a user within a date range
func GetUserTotalsByDateRange(ctx context.Context, db *sql.DB, userID int, startDate, endDate time.Time) ([]UserTotal, error) {
	log.Printf("GetUserTotalsByDateRange: fetching totals for user %d from %s to %s", 
		userID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))

	query := `
		SELECT id, user_id, date, emotion, summary
		FROM user_totals
		WHERE user_id = $1 
		AND date >= $2 
		AND date <= $3
		ORDER BY date DESC
	`

	rows, err := db.QueryContext(ctx, query, userID, startDate, endDate)
	if err != nil {
		log.Printf("GetUserTotalsByDateRange: failed to fetch totals for user %d, error: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var totals []UserTotal
	for rows.Next() {
		var total UserTotal
		if err := rows.Scan(&total.ID, &total.UserID, &total.Date, &total.Emotion, &total.Summary); err != nil {
			log.Printf("GetUserTotalsByDateRange: failed to scan total for user %d, error: %v", userID, err)
			return nil, err
		}
		totals = append(totals, total)
	}

	if err := rows.Err(); err != nil {
		log.Printf("GetUserTotalsByDateRange: error iterating rows for user %d, error: %v", userID, err)
		return nil, err
	}

	log.Printf("GetUserTotalsByDateRange: successfully fetched %d totals for user %d", len(totals), userID)
	return totals, nil
}

// DeleteUserTotal deletes the daily total for a user on a specific date
func DeleteUserTotal(ctx context.Context, db *sql.DB, userID int, date time.Time) error {
	log.Printf("DeleteUserTotal: deleting total for user %d on %s", userID, date.Format("2006-01-02"))

	query := `DELETE FROM user_totals WHERE user_id = $1 AND date = $2`
	res, err := db.ExecContext(ctx, query, userID, date)
	if err != nil {
		log.Printf("DeleteUserTotal: failed to delete total for user %d, error: %v", userID, err)
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		log.Printf("DeleteUserTotal: failed to get rows affected for user %d, error: %v", userID, err)
		return err
	}

	log.Printf("DeleteUserTotal: successfully deleted %d totals for user %d", rowsAffected, userID)
	return nil
}

// GetRecordDatesForUser returns all unique dates that have records for a user
func GetRecordDatesForUser(ctx context.Context, db *sql.DB, userID int) ([]time.Time, error) {
	log.Printf("GetRecordDatesForUser: fetching unique record dates for user %d", userID)

	query := `
		SELECT DISTINCT DATE(record_date) as record_day
		FROM record
		WHERE user_id = $1
		ORDER BY record_day DESC
	`

	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		log.Printf("GetRecordDatesForUser: failed to fetch dates for user %d, error: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var dates []time.Time
	for rows.Next() {
		var date time.Time
		if err := rows.Scan(&date); err != nil {
			log.Printf("GetRecordDatesForUser: failed to scan date for user %d, error: %v", userID, err)
			return nil, err
		}
		dates = append(dates, date)
	}

	if err := rows.Err(); err != nil {
		log.Printf("GetRecordDatesForUser: error iterating rows for user %d, error: %v", userID, err)
		return nil, err
	}

	log.Printf("GetRecordDatesForUser: found %d unique dates for user %d", len(dates), userID)
	return dates, nil
}

// GetUserTotalByDate returns the daily total for a user on a specific date
func GetUserTotalByDate(ctx context.Context, db *sql.DB, userID int, date time.Time) (*UserTotal, error) {
	log.Printf("GetUserTotalByDate: fetching total for user %d on %s", userID, date.Format("2006-01-02"))

	query := `
		SELECT id, user_id, date, emotion, summary
		FROM user_totals
		WHERE user_id = $1 AND date = $2
	`

	var total UserTotal
	err := db.QueryRowContext(ctx, query, userID, date).Scan(&total.ID, &total.UserID, &total.Date, &total.Emotion, &total.Summary)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("GetUserTotalByDate: no total found for user %d on %s", userID, date.Format("2006-01-02"))
			return nil, nil
		}
		log.Printf("GetUserTotalByDate: failed to fetch total for user %d, error: %v", userID, err)
		return nil, err
	}

	log.Printf("GetUserTotalByDate: successfully fetched total for user %d", userID)
	return &total, nil
}