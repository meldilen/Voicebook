package middleware

import (
	"net/http"
	"strconv"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
	"github.com/gin-gonic/gin"
)

// В middleware/auth.go добавляем поддержку VK пользователей
func AuthMiddleware(svc *service.UserService) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Сначала пробуем найти VK пользователя по сессии
        cookie, err := c.Request.Cookie("session_token")
        if err == nil {
            user, err := svc.GetUserBySession(c.Request.Context(), cookie.Value)
            if err == nil && user != nil {
                c.Set("user", user)
                c.Next()
                return
            }
        }

        // Если нет сессии, пробуем VK авторизацию через заголовки
        vkUserID := c.GetHeader("X-VK-User-ID")
        if vkUserID != "" {
            userID, _ := strconv.Atoi(vkUserID)
            vkUser, err := repository.GetVKUserByVKID(c.Request.Context(), svc.DB(), userID)
            if err == nil && vkUser != nil {
                c.Set("user", vkUser)
                c.Next()
                return
            }
        }

        c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
    }
}