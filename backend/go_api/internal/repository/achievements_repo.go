package repository

import (
	"context"
	"database/sql"
	"log"
	"time"
)

type UserAchievement struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	AchievementID int       `json:"achievement_id"`
	Progress      int       `json:"progress"`
	Unlocked      bool      `json:"unlocked"`
	DateUnlocked  time.Time `json:"date_unlocked"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func GetUserAchievements(ctx context.Context, db *sql.DB, userID int) ([]UserAchievement, error) {
	log.Printf("GetUserAchievements: fetching achievements for user %d", userID)

	query := `
		SELECT id, user_id, achievement_id, progress, unlocked, date_unlocked, created_at, updated_at
		FROM user_achievements 
		WHERE user_id = $1
		ORDER BY achievement_id
	`
	
	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		log.Printf("GetUserAchievements: failed to fetch achievements for user %d, error: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var achievements []UserAchievement
	for rows.Next() {
		var ach UserAchievement
		err := rows.Scan(&ach.ID, &ach.UserID, &ach.AchievementID, &ach.Progress, &ach.Unlocked, &ach.DateUnlocked, &ach.CreatedAt, &ach.UpdatedAt)
		if err != nil {
			log.Printf("GetUserAchievements: failed to scan achievement for user %d, error: %v", userID, err)
			return nil, err
		}
		achievements = append(achievements, ach)
	}

	log.Printf("GetUserAchievements: successfully fetched %d achievements for user %d", len(achievements), userID)
	return achievements, nil
}

func SaveUserAchievement(ctx context.Context, db *sql.DB, userID, achievementID, progress int, unlocked bool) error {
	log.Printf("SaveUserAchievement: saving achievement %d for user %d", achievementID, userID)

	query := `
		INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked, date_unlocked)
		VALUES ($1, $2, $3, $4, CASE WHEN $4 = true THEN NOW() ELSE NULL END)
		ON CONFLICT (user_id, achievement_id) 
		DO UPDATE SET 
			progress = EXCLUDED.progress,
			unlocked = EXCLUDED.unlocked,
			date_unlocked = CASE WHEN EXCLUDED.unlocked = true AND user_achievements.unlocked = false THEN NOW() ELSE user_achievements.date_unlocked END,
			updated_at = NOW()
	`
	
	_, err := db.ExecContext(ctx, query, userID, achievementID, progress, unlocked)
	if err != nil {
		log.Printf("SaveUserAchievement: failed to save achievement %d for user %d, error: %v", achievementID, userID, err)
		return err
	}

	log.Printf("SaveUserAchievement: successfully saved achievement %d for user %d", achievementID, userID)
	return nil
}