package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

type Record struct {
	ID int `json:"record_id"`
	UserID int `json:"user_id"`
	RecordDate time.Time `json:"record_date"`
	Emotion string `json:"emotion"`
	Summary string `json:"summary"`
	Feedback *int `json:"feedback"` 
	Insights sql.NullString `json:"insights"` 
}

const getRecordsByUserSQL = `
    SELECT record_id, user_id, record_date, emotion, summary, feedback, insights
	FROM record
	WHERE user_id = $1
	ORDER BY record_date DESC
`
func SaveRecord(ctx context.Context, db *sql.DB, userID int, emotion string, summary string) (int, error) {
	log.Printf("SaveRecord: saving record for userID %d with emotion %s", userID, emotion)

	query := `
	INSERT INTO record (user_id, emotion, summary)
	VALUES ($1, $2, $3)
	RETURNING record_id
	`
	var recordID int
	err := db.QueryRowContext(ctx, query, userID, emotion, summary).Scan(&recordID)
	if err != nil {
		log.Printf("SaveRecord: failed to save record, error: %v", err)
		return 0, err
	}

	log.Printf("SaveRecord: successfully saved record with ID %d for userID %d", recordID, userID)
	return recordID, nil
}

func SaveInsights(ctx context.Context, db *sql.DB, record_id int, insights string) error {
	log.Printf("SaveInsights: saving record for recordID %d", record_id)

	query := `
	    UPDATE record
	    SET insights = $2
	    WHERE record_id = $1
	`

	res, err := db.ExecContext(ctx, query, record_id, insights)
	if err != nil {
		log.Printf("SaveInsights: failed to save record, error: %v", err)
		return err
	}
    rowsAffected, err := res.RowsAffected()
    if err != nil {
        log.Printf("SaveInsights: failed to get rows affected for record %d", record_id)
        return err
    }
    if rowsAffected == 0 {
        log.Printf("SaveInsights: no record found with ID %d", record_id)
        return sql.ErrNoRows
    }

	log.Printf("SaveInsights: successfully saved insights for recordID %d", record_id)
	return nil
}

func GetRecordsByUser(ctx context.Context, db *sql.DB, userID int) ([]Record, error) {
	log.Printf("GetRecordsByUser: fetching records for userID %d", userID)

	rows, err := db.QueryContext(ctx, getRecordsByUserSQL, userID)
	if err != nil {
		log.Printf("GetRecordsByUser: failed to fetch records for userID %d, error: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var records []Record
	for rows.Next() {
		var r Record
		if err := rows.Scan(&r.ID, &r.UserID, &r.RecordDate, &r.Emotion, &r.Summary, &r.Feedback, &r.Insights); err != nil {
			log.Printf("GetRecordsByUser: failed to scan record for userID %d, error: %v", userID, err)
			return nil, err
		}
		records = append(records, r)
	}

	if err := rows.Err(); err != nil {
		log.Printf("GetRecordsByUser: failed to iterate over rows for userID %d, error: %v", userID, err)
		return nil, err
	}

	log.Printf("GetRecordsByUser: successfully fetched %d records for userID %d", len(records), userID)
	return records, nil
}

func GetRecordByID(ctx context.Context, db *sql.DB, recordID int) (*Record, error) {
	log.Printf("GetRecordByID: fetching record with ID %d", recordID)

	query := `
	SELECT record_id, user_id, record_date, emotion, summary, feedback, insights 
	FROM record
	WHERE record_id = $1
	`
	var rec Record
	err := db.QueryRowContext(ctx, query, recordID).Scan(&rec.ID, &rec.UserID, &rec.RecordDate, &rec.Emotion, &rec.Summary, &rec.Feedback, &rec.Insights)
	if err != nil {
		log.Printf("GetRecordByID: failed to fetch record with ID %d, error: %v", recordID, err)
		return nil, err
	}
	log.Printf("GetRecordByID: successfully fetched record with ID %d", rec.ID)
	return &rec, nil
}

func GetLatestRecords(ctx context.Context, db *sql.DB, userID int, limit int) ([]Record, error) {
    query := `SELECT * FROM record WHERE user_id = $1 ORDER BY record_date DESC`
    var rows *sql.Rows
    var err error
    
    if limit > 0 {
        query += ` LIMIT $2`
        rows, err = db.QueryContext(ctx, query, userID, limit)
    } else {
        rows, err = db.QueryContext(ctx, query, userID)
    }

    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var records []Record
    for rows.Next() {
        var record Record
        err := rows.Scan(&record.ID, &record.UserID, &record.RecordDate, &record.Emotion, &record.Summary, &record.Feedback, &record.Insights)
        if err != nil {
            return nil, err
        }
        records = append(records, record)
    }

    return records, nil
}

func GetRecordsStartingFromDate(ctx context.Context, db *sql.DB, userID int, date time.Time, limit int) ([]Record, error) {
    query := `SELECT * FROM record WHERE user_id = $1 AND record_date >= $2 ORDER BY record_date DESC`
    if limit > 0 {
        query += ` LIMIT $3`
    }

    rows, err := db.QueryContext(ctx, query, userID, date, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var records []Record
    for rows.Next() {
        var record Record
        err := rows.Scan(&record.ID, &record.UserID, &record.RecordDate, &record.Emotion, &record.Summary, &record.Feedback, &record.Insights)
        if err != nil {
            return nil, err
        }
        records = append(records, record)
    }

    return records, nil
}

func GetRecordsByDate(ctx context.Context, db *sql.DB, userID int, date time.Time, limit int) ([]Record, error) {
    startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
    endOfDay := startOfDay.Add(24 * time.Hour)

    query := `SELECT * FROM record WHERE user_id = $1 AND record_date >= $2 AND record_date < $3 ORDER BY record_date DESC`
    if limit > 0 {
        query += ` LIMIT $4`
    }

    var rows *sql.Rows
    var err error
    
    if limit > 0 {
        rows, err = db.QueryContext(ctx, query, userID, startOfDay, endOfDay, limit)
    } else {
        rows, err = db.QueryContext(ctx, query, userID, startOfDay, endOfDay)
    }

    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var records []Record
    for rows.Next() {
        var record Record
        err := rows.Scan(&record.ID, &record.UserID, &record.RecordDate, &record.Emotion, &record.Summary, &record.Feedback, &record.Insights)
        if err != nil {
            return nil, err
        }
        records = append(records, record)
    }

    return records, nil
}

func DeleteRecordByID(ctx context.Context, db *sql.DB, recordID int) error {
    log.Printf("DeleteRecordByID: deleting record with ID %d", recordID)
    query := `DELETE FROM record WHERE record_id = $1`
    res, err := db.ExecContext(ctx, query, recordID)
    if err != nil {
        log.Printf("DeleteRecordByID: failed to delete record %d, error: %v", recordID, err)
        return err
    }
    rowsAffected, err := res.RowsAffected()
    if err != nil {
        log.Printf("DeleteRecordByID: failed to get rows affected for record %d, error: %v", recordID, err)
        return err
    }
    if rowsAffected == 0 {
        log.Printf("DeleteRecordByID: no record found with ID %d", recordID)
        return sql.ErrNoRows
    }
    log.Printf("DeleteRecordByID: successfully deleted record %d", recordID)
    return nil
}

func UpdateRecordFeedback(ctx context.Context, db *sql.DB, recordID int, feedback int) error {
    log.Printf("UpdateRecordFeedback: updating feedback for record ID %d", recordID)
    query := `UPDATE record SET feedback = $1 WHERE record_id = $2`
    res, err := db.ExecContext(ctx, query, feedback, recordID)
    if err != nil {
        log.Printf("UpdateRecordFeedback: failed to update feedback for record %d, error: %v", recordID, err)
        return err
    }
    rowsAffected, err := res.RowsAffected()
    if err != nil {
        log.Printf("UpdateRecordFeedback: failed to get rows affected for record %d, error: %v", recordID, err)
        return err
    }
    if rowsAffected == 0 {
        log.Printf("UpdateRecordFeedback: no record found with ID %d", recordID)
        return sql.ErrNoRows
    }
    log.Printf("UpdateRecordFeedback: successfully updated feedback for record %d", recordID)
    return nil
}

func UpdateRecordEmotion(ctx context.Context, db *sql.DB, recordID int, emotion string) error {
    query := `UPDATE record SET emotion = $1 WHERE record_id = $2`
    res, err := db.ExecContext(ctx, query, emotion, recordID)
    if err != nil {
        return err
    }
    if rows, _ := res.RowsAffected(); rows == 0 {
        return sql.ErrNoRows
    }
    return nil
}

func GetConsecutiveRecordingDays(ctx context.Context, db *sql.DB, userID int) (int, error) {
    query := `
        WITH dates AS (
            SELECT DISTINCT DATE(record_date) as day 
            FROM record 
            WHERE user_id = $1
            ORDER BY day DESC
        ),
        grouped_dates AS (
            SELECT 
                day,
                day - ROW_NUMBER() OVER (ORDER BY day) * INTERVAL '1 day' as grp
            FROM dates
        )
        SELECT COUNT(*) as consecutive_days
        FROM grouped_dates
        WHERE grp = (SELECT grp FROM grouped_dates LIMIT 1)
    `
    
    var count int
    err := db.QueryRowContext(ctx, query, userID).Scan(&count)
    if err != nil {
        return 0, fmt.Errorf("failed to get consecutive days: %w", err)
    }
    return count, nil
}

// SaveRecordForVKUser saves record for VK user
func SaveRecordForVKUser(ctx context.Context, db *sql.DB, vkUserID int, emotion string, summary string) (int, error) {
    log.Printf("SaveRecordForVKUser: saving record for VK user ID %d with emotion %s", vkUserID, emotion)

    query := `
        INSERT INTO record (user_id, emotion, summary, user_type)
        VALUES ($1, $2, $3, 'vk')
        RETURNING record_id
    `
    var recordID int
    err := db.QueryRowContext(ctx, query, vkUserID, emotion, summary).Scan(&recordID)
    if err != nil {
        log.Printf("SaveRecordForVKUser: failed to save record, error: %v", err)
        return 0, err
    }

    log.Printf("SaveRecordForVKUser: successfully saved record with ID %d for VK user ID %d", recordID, vkUserID)
    return recordID, nil
}

// GetRecordsByVKUser gets records for VK user
func GetRecordsByVKUser(ctx context.Context, db *sql.DB, vkUserID int) ([]Record, error) {
    log.Printf("GetRecordsByVKUser: fetching records for VK user ID %d", vkUserID)

    query := `
        SELECT record_id, user_id, record_date, emotion, summary, feedback, insights
        FROM record
        WHERE user_id = $1 AND user_type = 'vk'
        ORDER BY record_date DESC
    `
    
    rows, err := db.QueryContext(ctx, query, vkUserID)
    if err != nil {
        log.Printf("GetRecordsByVKUser: failed to fetch records for VK user ID %d, error: %v", vkUserID, err)
        return nil, err
    }
    defer rows.Close()

    var records []Record
    for rows.Next() {
        var r Record
        if err := rows.Scan(&r.ID, &r.UserID, &r.RecordDate, &r.Emotion, &r.Summary, &r.Feedback, &r.Insights); err != nil {
            log.Printf("GetRecordsByVKUser: failed to scan record for VK user ID %d, error: %v", vkUserID, err)
            return nil, err
        }
        records = append(records, r)
    }

    log.Printf("GetRecordsByVKUser: successfully fetched %d records for VK user ID %d", len(records), vkUserID)
    return records, nil
}