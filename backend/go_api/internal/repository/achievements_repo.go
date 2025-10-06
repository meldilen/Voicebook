package repository

import (
	"context"
	"database/sql"
	"log"
	"time"
)

type UserAchievement struct {
	ID            int       `json:"id"`
	UserType      string    `json:"user_type"` // Добавляем поле для типа пользователя
	UserID        int       `json:"user_id"`
	AchievementID int       `json:"achievement_id"`
	Progress      int       `json:"progress"`
	Unlocked      bool      `json:"unlocked"`
	DateUnlocked  time.Time `json:"date_unlocked"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// GetUserAchievements gets achievements for regular user
func GetUserAchievements(ctx context.Context, db *sql.DB, userID int) ([]UserAchievement, error) {
	log.Printf("GetUserAchievements: fetching achievements for regular user %d", userID)

	query := `
		SELECT id, user_type, user_id, achievement_id, progress, unlocked, date_unlocked, created_at, updated_at
		FROM user_achievements 
		WHERE user_type = 'regular' AND user_id = $1
		ORDER BY achievement_id
	`
	
	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		log.Printf("GetUserAchievements: failed to fetch achievements for regular user %d, error: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var achievements []UserAchievement
	for rows.Next() {
		var ach UserAchievement
		err := rows.Scan(&ach.ID, &ach.UserType, &ach.UserID, &ach.AchievementID, &ach.Progress, &ach.Unlocked, &ach.DateUnlocked, &ach.CreatedAt, &ach.UpdatedAt)
		if err != nil {
			log.Printf("GetUserAchievements: failed to scan achievement for regular user %d, error: %v", userID, err)
			return nil, err
		}
		achievements = append(achievements, ach)
	}

	log.Printf("GetUserAchievements: successfully fetched %d achievements for regular user %d", len(achievements), userID)
	return achievements, nil
}

// SaveUserAchievement saves achievement progress for regular user
func SaveUserAchievement(ctx context.Context, db *sql.DB, userID, achievementID, progress int, unlocked bool) error {
	log.Printf("SaveUserAchievement: saving achievement %d for regular user %d", achievementID, userID)

	query := `
		INSERT INTO user_achievements (user_type, user_id, achievement_id, progress, unlocked, date_unlocked)
		VALUES ('regular', $1, $2, $3, $4, CASE WHEN $4 = true THEN NOW() ELSE NULL END)
		ON CONFLICT (user_type, user_id, achievement_id) 
		DO UPDATE SET 
			progress = EXCLUDED.progress,
			unlocked = EXCLUDED.unlocked,
			date_unlocked = CASE WHEN EXCLUDED.unlocked = true AND user_achievements.unlocked = false THEN NOW() ELSE user_achievements.date_unlocked END,
			updated_at = NOW()
	`
	
	_, err := db.ExecContext(ctx, query, userID, achievementID, progress, unlocked)
	if err != nil {
		log.Printf("SaveUserAchievement: failed to save achievement %d for regular user %d, error: %v", achievementID, userID, err)
		return err
	}

	log.Printf("SaveUserAchievement: successfully saved achievement %d for regular user %d", achievementID, userID)
	return nil
}

// GetVKUserAchievements gets achievements for VK user
func GetVKUserAchievements(ctx context.Context, db *sql.DB, vkUserID int) ([]UserAchievement, error) {
    log.Printf("GetVKUserAchievements: fetching achievements for VK user %d", vkUserID)

    query := `
        SELECT id, user_type, user_id, achievement_id, progress, unlocked, date_unlocked, created_at, updated_at
        FROM user_achievements 
        WHERE user_type = 'vk' AND user_id = $1
        ORDER BY achievement_id
    `
    
    rows, err := db.QueryContext(ctx, query, vkUserID)
    if err != nil {
        log.Printf("GetVKUserAchievements: failed to fetch achievements for VK user %d, error: %v", vkUserID, err)
        return nil, err
    }
    defer rows.Close()

    var achievements []UserAchievement
    for rows.Next() {
        var ach UserAchievement
        err := rows.Scan(&ach.ID, &ach.UserType, &ach.UserID, &ach.AchievementID, &ach.Progress, &ach.Unlocked, &ach.DateUnlocked, &ach.CreatedAt, &ach.UpdatedAt)
        if err != nil {
            log.Printf("GetVKUserAchievements: failed to scan achievement for VK user %d, error: %v", vkUserID, err)
            return nil, err
        }
        achievements = append(achievements, ach)
    }

    log.Printf("GetVKUserAchievements: successfully fetched %d achievements for VK user %d", len(achievements), vkUserID)
    return achievements, nil
}

// SaveVKUserAchievement saves achievement progress for VK user
func SaveVKUserAchievement(ctx context.Context, db *sql.DB, vkUserID, achievementID, progress int, unlocked bool) error {
    log.Printf("SaveVKUserAchievement: saving achievement %d for VK user %d", achievementID, vkUserID)

    query := `
        INSERT INTO user_achievements (user_type, user_id, achievement_id, progress, unlocked, date_unlocked)
        VALUES ('vk', $1, $2, $3, $4, CASE WHEN $4 = true THEN NOW() ELSE NULL END)
        ON CONFLICT (user_type, user_id, achievement_id) 
        DO UPDATE SET 
            progress = EXCLUDED.progress,
            unlocked = EXCLUDED.unlocked,
            date_unlocked = CASE WHEN EXCLUDED.unlocked = true AND user_achievements.unlocked = false THEN NOW() ELSE user_achievements.date_unlocked END,
            updated_at = NOW()
    `
    
    _, err := db.ExecContext(ctx, query, vkUserID, achievementID, progress, unlocked)
    if err != nil {
        log.Printf("SaveVKUserAchievement: failed to save achievement %d for VK user %d, error: %v", achievementID, vkUserID, err)
        return err
    }

    log.Printf("SaveVKUserAchievement: successfully saved achievement %d for VK user %d", achievementID, vkUserID)
    return nil
}

// GetUserAchievementProgress gets specific achievement progress for any user type
func GetUserAchievementProgress(ctx context.Context, db *sql.DB, userType string, userID, achievementID int) (*UserAchievement, error) {
    query := `
        SELECT id, user_type, user_id, achievement_id, progress, unlocked, date_unlocked, created_at, updated_at
        FROM user_achievements 
        WHERE user_type = $1 AND user_id = $2 AND achievement_id = $3
    `
    
    var ach UserAchievement
    err := db.QueryRowContext(ctx, query, userType, userID, achievementID).Scan(
        &ach.ID, &ach.UserType, &ach.UserID, &ach.AchievementID, &ach.Progress, &ach.Unlocked, &ach.DateUnlocked, &ach.CreatedAt, &ach.UpdatedAt,
    )
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, nil
        }
        return nil, err
    }
    
    return &ach, nil
}