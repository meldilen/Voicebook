package service

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// ✅ Существующие методы для обычных пользователей
func (s *UserService) RegisterUser(ctx context.Context, login, password, nickname string) (int, error) {
	return repository.CreateUser(ctx, s.db, login, password, nickname)
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
    return repository.UpdateUserProfile(ctx, s.db, userID, login, password, nickname)
}

func (s *UserService) UserExists(ctx context.Context, login string) (bool, error) {
    return repository.UserExists(ctx, s.db, login)
}

func (s *UserService) DeleteUserAccount(ctx context.Context, userID int) error {
    return repository.DeleteUserAndData(ctx, s.db, userID)
}

// ✅ НОВЫЕ МЕТОДЫ ДЛЯ VK ПОЛЬЗОВАТЕЛЕЙ
func (s *UserService) CreateVKUser(ctx context.Context, vkUserID int, initialCoins int) (int, error) {
	return repository.CreateVKUser(ctx, s.db, vkUserID, initialCoins)
}

func (s *UserService) GetVKUserByVKID(ctx context.Context, vkUserID int) (*repository.VKUser, error) {
	return repository.GetVKUserByVKID(ctx, s.db, vkUserID)
}

func (s *UserService) GetVKUserByID(ctx context.Context, userID int) (*repository.VKUser, error) {
	return repository.GetVKUserByID(ctx, s.db, userID)
}

func (s *UserService) UpdateVKUserCoins(ctx context.Context, userID int, coins int) error {
	return repository.UpdateVKUserCoins(ctx, s.db, userID, coins)
}

// ✅ УНИВЕРСАЛЬНЫЙ МЕТОД ДЛЯ ПОЛУЧЕНИЯ ЛЮБОГО ТИПА ПОЛЬЗОВАТЕЛЯ
func (s *UserService) GetUserByID(ctx context.Context, userID int, userType string) (interface{}, error) {
	switch userType {
	case "vk":
		return repository.GetVKUserByID(ctx, s.db, userID)
	case "regular":
		return repository.GetUserByID(ctx, s.db, userID)
	default:
		return nil, fmt.Errorf("unknown user type: %s", userType)
	}
}

func (s *UserService) DB() *sql.DB {
	return s.db
}