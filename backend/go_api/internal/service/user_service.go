package service

import (
	"context"
	"database/sql"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{
		db: db,
	}
}

func (s *UserService) RegisterUser(ctx context.Context, login, password, nickname string) (int, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}
	return repository.CreateUser(ctx, s.db, login, string(hashedPassword), nickname)
}

func (s *UserService) GetUserByLogin(ctx context.Context, login string) (*repository.User, error) {
	return repository.GetUserByLogin(ctx, s.db, login)
}

func (s *UserService) SaveSession(ctx context.Context, userID int, token string) error {
    return repository.SaveSession(ctx, s.db, userID, token)
}

func (s *UserService) GetUserBySession(ctx context.Context, token string) (*repository.User, error) {
	return repository.GetUserBySession(ctx, s.db, token)
}

func (s *UserService) DeleteSession(ctx context.Context, token string) error {
	return repository.DeleteSession(ctx, s.db, token)
}

func (s *UserService) UpdateUserProfile(ctx context.Context, userID int, login, password, nickname string) error {
    var hashedPassword string
    if password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
        if err != nil {
            return err
        }
        hashedPassword = string(hash)
    }
    return repository.UpdateUserProfile(ctx, s.db, userID, login, hashedPassword, nickname)
}

func (s *UserService) UserExists(ctx context.Context, login string) (bool, error) {
    return repository.UserExists(ctx, s.db, login)
}

func (s *UserService) DeleteUserAccount(ctx context.Context, userID int) error {
    if err := repository.DeleteUserAndData(ctx, s.db, userID); err != nil {
        return err
    }
    return nil
}

// Add to service/user_service.go
func (s *UserService) DB() *sql.DB {
	return s.db
}