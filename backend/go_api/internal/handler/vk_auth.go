package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
	"github.com/gin-gonic/gin"
)

type VKAuthHandler struct {
	userService *service.UserService
}

func NewVKAuthHandler(userService *service.UserService) *VKAuthHandler {
	return &VKAuthHandler{
		userService: userService,
	}
}

type VKAuthRequest struct {
	VKUserID    int                    `json:"vkUserId" binding:"required"`
	LaunchParams map[string]string     `json:"launchParams" binding:"required"`
}

type VKAuthResponse struct {
	Success bool           `json:"success"`
	User    *VKUser        `json:"user"`
}

type VKUser struct {
	ID        int       `json:"id"`        // ← lowercase для фронтенда
	VKUserID  int       `json:"vkUserId"`  // ← добавил это поле
	Coins     int       `json:"coins"`
	CreatedAt time.Time `json:"createdAt"`
}

// @Summary VK Mini Apps authentication
// @Description Authenticate user via VK Mini Apps with signature validation
// @Tags auth
// @Accept json
// @Produce json
// @Param body body VKAuthRequest true "VK auth data"
// @Success 200 {object} VKAuthResponse
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /api/vk/auth [post]
func (h *VKAuthHandler) VKAuth(c *gin.Context) {
	log.Printf("VKAuth: received request")

	var req VKAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("VKAuth: invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate VK signature
	if err := h.validateVKSignature(req.LaunchParams); err != nil {
		log.Printf("VKAuth: signature validation failed: %v", err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	// Verify user ID matches
	launchUserID, err := strconv.Atoi(req.LaunchParams["vk_user_id"])
	if err != nil || launchUserID != req.VKUserID {
		log.Printf("VKAuth: user ID mismatch: request=%d, launch=%s", req.VKUserID, req.LaunchParams["vk_user_id"])
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID mismatch"})
		return
	}

	// Check timestamp (not older than 10 minutes)
	if err := h.validateTimestamp(req.LaunchParams["vk_ts"]); err != nil {
		log.Printf("VKAuth: timestamp validation failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Expired timestamp"})
		return
	}

	// Find or create user
	user, err := h.findOrCreateUser(c.Request.Context(), req.VKUserID)
	if err != nil {
		log.Printf("VKAuth: failed to find/create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process user"})
		return
	}

	response := VKAuthResponse{
		Success: true,
		User: &VKUser{
			ID:        user.ID,
			VKUserID:  user.VKUserID, // ← добавлено это поле
			Coins:     user.Coins,
			CreatedAt: user.CreatedAt,
		},
	}

	c.JSON(http.StatusOK, response)
	log.Printf("VKAuth: successfully authenticated user %d", req.VKUserID)
}

// validateVKSignature validates VK Mini Apps signature
func (h *VKAuthHandler) validateVKSignature(launchParams map[string]string) error {
	signature, exists := launchParams["sign"]
	if !exists {
		return fmt.Errorf("missing signature")
	}

	// Remove sign parameter from validation
	params := make(map[string]string)
	for k, v := range launchParams {
		if k != "sign" {
			params[k] = v
		}
	}

	// Sort parameters by key
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build query string
	var queryParts []string
	for _, k := range keys {
		queryParts = append(queryParts, fmt.Sprintf("%s=%s", k, params[k]))
	}
	queryString := strings.Join(queryParts, "&")


	vkSecretKey := os.Getenv("VK_SECRET_KEY") // Ваш защищенный ключ

	// Calculate HMAC-SHA256
	mac := hmac.New(sha256.New, []byte(vkSecretKey))
	mac.Write([]byte(queryString))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if signature != expectedSignature {
		log.Printf("VKAuth: signature mismatch. Expected: %s, Got: %s", expectedSignature, signature)
		log.Printf("VKAuth: query string: %s", queryString)
		return fmt.Errorf("signature mismatch")
	}

	return nil
}

// validateTimestamp checks if timestamp is not older than 10 minutes
func (h *VKAuthHandler) validateTimestamp(timestampStr string) error {
	timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid timestamp format")
	}

	// Check if timestamp is not older than 10 minutes
	now := time.Now().Unix()
	if now-timestamp > 600 { // 10 minutes in seconds
		return fmt.Errorf("timestamp expired")
	}

	return nil
}

// findOrCreateUser finds existing user or creates new one
func (h *VKAuthHandler) findOrCreateUser(ctx context.Context, vkUserID int) (*repository.VKUser, error) {
	// Try to find existing user
	user, err := repository.GetVKUserByVKID(ctx, h.userService.DB(), vkUserID)
	if err == nil && user != nil {
		log.Printf("VKAuth: found existing user %d", vkUserID)
		return user, nil
	}

	// Create new user with initial coins
	initialCoins := 100
	userID, err := repository.CreateVKUser(ctx, h.userService.DB(), vkUserID, initialCoins)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Get the created user
	user, err = repository.GetVKUserByID(ctx, h.userService.DB(), userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get created user: %w", err)
	}

	log.Printf("VKAuth: created new user %d with %d coins", vkUserID, initialCoins)
	return user, nil
}