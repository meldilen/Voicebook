package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
	"github.com/gin-gonic/gin"
)

type AchievementsHandler struct {
	svc *service.AchievementsService
}

func NewAchievementsHandler(svc *service.AchievementsService) *AchievementsHandler {
	return &AchievementsHandler{
		svc: svc,
	}
}

// @Summary Get user achievements
// @Description Returns all achievements for the current user with their progress
// @Tags achievements
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /achievements [get]
func (h *AchievementsHandler) GetAchievements(c *gin.Context) {
    userObj, exists := c.Get("user")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
        return
    }

    // Автоматически определяем тип пользователя
    var userID int
    var userType string
    
    switch user := userObj.(type) {
    case *repository.User: // Обычный пользователь (логин/пароль)
        userID = user.ID
        userType = "regular"
        log.Printf("GetAchievements: regular user %d", userID)
    case *repository.VKUser: // VK пользователь
        userID = user.ID
        userType = "vk" 
        log.Printf("GetAchievements: VK user %d (VK ID: %d)", userID, user.VKUserID)
    default:
        log.Printf("GetAchievements: unknown user type: %T", userObj)
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unknown user type"})
        return
    }

    achievements, err := h.svc.GetUserAchievements(c.Request.Context(), userID, userType)
    if err != nil {
        log.Printf("GetAchievements: failed to get achievements for %s user %d: %v", userType, userID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get achievements"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "achievements": achievements,
        "userType": userType, // для дебага
    })
}

// @Summary Update achievement progress
// @Description Updates progress for a specific achievement
// @Tags achievements
// @Accept json
// @Produce json
// @Param achievementID path int true "Achievement ID"
// @Param body body map[string]int true "Progress data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /achievements/{achievementID}/progress [post]
func (h *AchievementsHandler) UpdateAchievementProgress(c *gin.Context) {
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
		return
	}

	// Определяем тип пользователя
	var userID int
	var userType string
	
	switch user := userObj.(type) {
	case *repository.User: // Обычный пользователь
		userID = user.ID
		userType = "regular"
	case *repository.VKUser: // VK пользователь
		userID = user.ID
		userType = "vk"
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unknown user type"})
		return
	}

	achievementIDStr := c.Param("achievementID")
	achievementID, err := strconv.Atoi(achievementIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid achievement ID"})
		return
	}

	var req struct {
		Progress int `json:"progress"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid progress data"})
		return
	}

	// ✅ ИСПРАВЛЕНИЕ: Добавляем userType параметр
	err = h.svc.UpdateAchievementProgress(c.Request.Context(), userID, achievementID, req.Progress, userType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update achievement progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Achievement progress updated"})
}