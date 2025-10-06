package repository

import (
	"context"
	"database/sql"
	"log"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type User struct {
	ID       int    `db:"user_id" json:"user_id"`
	Login    string `db:"login" json:"login"`
	Password string `db:"password" json:"-"`
	Nickname string `db:"nickname" json:"nickname"`
}

func CreateUser(ctx context.Context, db *sql.DB, login, password, nickname string) (int, error) {
	log.Printf("CreateUser: creating user with login %s", login)

	query := `
		INSERT INTO "user" (login, password, nickname)
		VALUES ($1, $2, $3)
		RETURNING user_id
	`
	var userID int
	err := db.QueryRowContext(ctx, query, login, password, nickname).Scan(&userID)
	if err != nil {
		log.Printf("CreateUser: failed to create user, error: %v", err)
		return 0, err
	}

	log.Printf("CreateUser: successfully created user with ID %d", userID)
	return userID, nil
}

func GetUserByLogin(ctx context.Context, db *sql.DB, login string) (*User, error) {
	log.Printf("GetUserByLogin: fetching user with login %s", login)

	query := `
		SELECT user_id, login, password, nickname
		FROM "user"
		WHERE login = $1
	`
	var user User
	err := db.QueryRowContext(ctx, query, login).Scan(&user.ID, &user.Login, &user.Password, &user.Nickname)
	if err != nil {
		log.Printf("GetUserByLogin: failed to fetch user with login %s, error: %v", login, err)
		return nil, err
	}

	log.Printf("GetUserByLogin: successfully fetched user with ID %d", user.ID)
	return &user, nil
}

func GetUserByID(ctx context.Context, db *sql.DB, userID int) (*User, error) {
	log.Printf("GetUserByID: fetching user with ID %d", userID)

	query := `
		SELECT user_id, login, password, nickname
		FROM "user"
		WHERE user_id = $1
	`
	var user User
	err := db.QueryRowContext(ctx, query, userID).Scan(&user.ID, &user.Login, &user.Password, &user.Nickname)
	if err != nil {
		log.Printf("GetUserByID: failed to fetch user with ID %d, error: %v", userID, err)
		return nil, err
	}

	log.Printf("GetUserByID: successfully fetched user with ID %d", user.ID)
	return &user, nil
}

func SaveSession(ctx context.Context, db *sql.DB, userID int, token string) error {
	log.Printf("SaveSession: saving session for userID %d", userID)

	// First, delete any existing session for this user
	deleteQuery := `DELETE FROM session WHERE user_id = $1`
	_, err := db.ExecContext(ctx, deleteQuery, userID)
	if err != nil {
		log.Printf("SaveSession: failed to delete existing session for userID %d, error: %v", userID, err)
		return err
	}

	// Then insert the new session
	insertQuery := `
		INSERT INTO session (user_id, token)
		VALUES ($1, $2)
	`
	_, err = db.ExecContext(ctx, insertQuery, userID, token)
	if err != nil {
		log.Printf("SaveSession: failed to save session for userID %d, error: %v", userID, err)
		return err
	}

	log.Printf("SaveSession: successfully saved session for userID %d", userID)
	return nil
}

func GetUserBySession(ctx context.Context, db *sql.DB, token string) (*User, error) {
	log.Printf("GetUserBySession: fetching user by session token")

	query := `
		SELECT u.user_id, u.login, u.password, u.nickname
		FROM "user" u
		JOIN session s ON u.user_id = s.user_id
		WHERE s.token = $1
	`
	var user User
	err := db.QueryRowContext(ctx, query, token).Scan(&user.ID, &user.Login, &user.Password, &user.Nickname)
	if err != nil {
		log.Printf("GetUserBySession: failed to fetch user by session token, error: %v", err)
		return nil, err
	}

	log.Printf("GetUserBySession: successfully fetched user with ID %d", user.ID)
	return &user, nil
}

func DeleteSession(ctx context.Context, db *sql.DB, token string) error {
	log.Printf("DeleteSession: deleting session token")
	query := `
		DELETE FROM session
		WHERE token = $1
	`
	_, err := db.ExecContext(ctx, query, token)
	if err != nil {
		log.Printf("DeleteSession: failed to delete session token, error: %v", err)
		return err
	}
	log.Printf("DeleteSession: successfully deleted session token")
	return nil
}

// UpdateUserProfile updates login, password, and/or nickname for a user.
func UpdateUserProfile(ctx context.Context, db *sql.DB, userID int, login, password, nickname string) error {
	log.Printf("UpdateUserProfile: updating profile for userID %d", userID)
	setParts := []string{}
	args := []interface{}{}
	argIdx := 1

	if login != "" {
		setParts = append(setParts, "login = $"+strconv.Itoa(argIdx))
		args = append(args, login)
		argIdx++
	}
	if password != "" {
		setParts = append(setParts, "password = $"+strconv.Itoa(argIdx))
		args = append(args, password)
		argIdx++
	}
	if nickname != "" {
		setParts = append(setParts, "nickname = $"+strconv.Itoa(argIdx))
		args = append(args, nickname)
		argIdx++
	}
	if len(setParts) == 0 {
		log.Printf("UpdateUserProfile: no fields to update for userID %d", userID)
		return nil
	}

	args = append(args, userID)
	query := `UPDATE "user" SET ` + strings.Join(setParts, ", ") + ` WHERE user_id = $` + strconv.Itoa(argIdx)
	res, err := db.ExecContext(ctx, query, args...)
	if err != nil {
		log.Printf("UpdateUserProfile: failed to update user %d, error: %v", userID, err)
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		log.Printf("UpdateUserProfile: no user found with ID %d", userID)
		return sql.ErrNoRows
	}
	log.Printf("UpdateUserProfile: successfully updated user %d", userID)
	return nil
}

func UserExists(ctx context.Context, db *sql.DB, login string) (bool, error) {
	query := `SELECT COUNT(1) FROM "user" WHERE login = $1`
	var count int
	err := db.QueryRowContext(ctx, query, login).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func DeleteUserAndData(ctx context.Context, db *sql.DB, userID int) error {
	log.Printf("DeleteUserAndData: deleting user %d and related data", userID)

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	// Delete in correct order to respect foreign key constraints
	queries := []string{
		`DELETE FROM session WHERE user_id = $1`,
		`DELETE FROM user_totals WHERE user_id = $1`,
		`DELETE FROM record WHERE user_id = $1`,
		`DELETE FROM "user" WHERE user_id = $1`,
	}

	for _, q := range queries {
		if _, err := tx.ExecContext(ctx, q, userID); err != nil {
			tx.Rollback()
			log.Printf("DeleteUserAndData: failed to execute query %s for user %d, error: %v", q, userID, err)
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("DeleteUserAndData: failed to commit transaction for user %d, error: %v", userID, err)
		return err
	}

// Add to repository/user_repo.go

type VKUser struct {
	ID        int       `db:"id"`
	VKUserID  int       `db:"vk_user_id"`
	Coins     int       `db:"coins"`
	CreatedAt time.Time `db:"created_at"`
}

// CreateVKUser creates a new VK user
func CreateVKUser(ctx context.Context, db *sql.DB, vkUserID int, initialCoins int) (int, error) {
	log.Printf("CreateVKUser: creating VK user with ID %d", vkUserID)

	query := `
		INSERT INTO vk_user (vk_user_id, coins)
		VALUES ($1, $2)
		RETURNING id
	`
	var userID int
	err := db.QueryRowContext(ctx, query, vkUserID, initialCoins).Scan(&userID)
	if err != nil {
		log.Printf("CreateVKUser: failed to create VK user: %v", err)
		return 0, err
	}

	log.Printf("CreateVKUser: successfully created VK user with ID %d", userID)
	return userID, nil
}

// GetVKUserByVKID finds user by VK user ID
func GetVKUserByVKID(ctx context.Context, db *sql.DB, vkUserID int) (*VKUser, error) {
	log.Printf("GetVKUserByVKID: fetching VK user with ID %d", vkUserID)

	query := `
		SELECT id, vk_user_id, coins, created_at
		FROM vk_user
		WHERE vk_user_id = $1
	`
	var user VKUser
	err := db.QueryRowContext(ctx, query, vkUserID).Scan(&user.ID, &user.VKUserID, &user.Coins, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("GetVKUserByVKID: VK user not found with ID %d", vkUserID)
			return nil, nil
		}
		log.Printf("GetVKUserByVKID: failed to fetch VK user: %v", err)
		return nil, err
	}

	log.Printf("GetVKUserByVKID: successfully fetched VK user with ID %d", user.ID)
	return &user, nil
}

// GetVKUserByID finds user by internal ID
func GetVKUserByID(ctx context.Context, db *sql.DB, userID int) (*VKUser, error) {
	log.Printf("GetVKUserByID: fetching VK user with internal ID %d", userID)

	query := `
		SELECT id, vk_user_id, coins, created_at
		FROM vk_user
		WHERE id = $1
	`
	var user VKUser
	err := db.QueryRowContext(ctx, query, userID).Scan(&user.ID, &user.VKUserID, &user.Coins, &user.CreatedAt)
	if err != nil {
		log.Printf("GetVKUserByID: failed to fetch VK user: %v", err)
		return nil, err
	}

	log.Printf("GetVKUserByID: successfully fetched VK user with VK ID %d", user.VKUserID)
	return &user, nil
}


// UpdateVKUserCoins updates user's coins balance
func UpdateVKUserCoins(ctx context.Context, db *sql.DB, userID int, coins int) error {
	log.Printf("UpdateVKUserCoins: updating coins for user %d to %d", userID, coins)

	query := `
		UPDATE vk_user 
		SET coins = $1 
		WHERE id = $2
	`
	_, err := db.ExecContext(ctx, query, coins, userID)
	if err != nil {
		log.Printf("UpdateVKUserCoins: failed to update user %d: %v", userID, err)
		return err
	}

	log.Printf("UpdateVKUserCoins: successfully updated coins for user %d", userID)
	return nil
}

// UpdateVKUserCoinsByVKID updates user's coins balance by VK user ID
func UpdateVKUserCoinsByVKID(ctx context.Context, db *sql.DB, vkUserID int, coins int) error {
	log.Printf("UpdateVKUserCoinsByVKID: updating coins for VK user %d to %d", vkUserID, coins)

	query := `
		UPDATE vk_user 
		SET coins = $1 
		WHERE vk_user_id = $2
	`
	_, err := db.ExecContext(ctx, query, coins, vkUserID)
	if err != nil {
		log.Printf("UpdateVKUserCoinsByVKID: failed to update VK user %d: %v", vkUserID, err)
		return err
	}

	log.Printf("UpdateVKUserCoinsByVKID: successfully updated coins for VK user %d", vkUserID)
	return nil
}

// Добавить в repository/user_repo.go
func GetUserByID(ctx context.Context, db *sql.DB, userID int) (*User, error) {
    log.Printf("GetUserByID: fetching user with ID %d", userID)

    query := `
        SELECT user_id, login, password, nickname, created_at
        FROM "user"
        WHERE user_id = $1
    `
    var user User
    err := db.QueryRowContext(ctx, query, userID).Scan(&user.ID, &user.Login, &user.Password, &user.Nickname)
    if err != nil {
        log.Printf("GetUserByID: failed to fetch user with ID %d, error: %v", userID, err)
        return nil, err
    }

    log.Printf("GetUserByID: successfully fetched user with ID %d", user.ID)
    return &user, nil
}