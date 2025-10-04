package handler

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{
		svc: svc,
	}
}

type RegisterRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
	Nickname string `json:"nickname" binding:"required"`
}

type LoginRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// @Summary Register a new user
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "User info"
// @Success 200 {object} map[string]int
// @Failure 400 {object} map[string]string
// @Router /users/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	log.Printf("Register: received request")

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Register: invalid input, error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Validate input lengths
	if len(req.Login) < 3 || len(req.Login) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Login must be between 3 and 50 characters"})
		return
	}
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
		return
	}
	if len(req.Nickname) < 1 || len(req.Nickname) > 30 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nickname must be between 1 and 30 characters"})
		return
	}

	exists, err := h.svc.UserExists(c.Request.Context(), req.Login)
	if err != nil {
		log.Printf("Register: failed to check user existence, error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user"})
		return
	}
	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Login/email already in use"})
		return
	}

	id, err := h.svc.RegisterUser(c.Request.Context(), req.Login, req.Password, req.Nickname)
	if err != nil {
		log.Printf("Register: failed to register user, error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userID": id,
		"message": "User registered successfully",
	})

	log.Printf("Register: user registered successfully, userID: %d", id)
}

// @Summary Login a user
// @Accept json
// @Produce json
// @Param user body LoginRequest true "User info"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /users/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	log.Printf("Login: received request")

	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login: invalid request, error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide both login and password"})
		return
	}

	user, err := h.svc.GetUserByLogin(c.Request.Context(), req.Login)
	if err != nil {
		log.Printf("Login: user not found for login %s, error: %v", req.Login, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account not found. Please check your login or register"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		log.Printf("Login: invalid password for user %d", user.ID)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password. Please try again"})
		return
	}

	sessionToken := uuid.NewString()
	err = h.svc.SaveSession(c.Request.Context(), user.ID, sessionToken)
	if err != nil {
		log.Printf("Login: failed to save session for user %d, error: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "We're having trouble signing you in. Please try again later"})
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		HttpOnly: true,
		Path:     "/",
		Expires:  time.Now().Add(30 * 24 * time.Hour), // 30 days session token expiration
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": gin.H{
			"user_id":  user.ID,
			"login":    user.Login,
			"nickname": user.Nickname,
		},
	})

	log.Printf("Login: user logged in successfully, userID: %d", user.ID)
}

// @Summary Get current user info
// @Description Returns the current user's info based on the session token.
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /users/me [get]
func (h *UserHandler) Me(c *gin.Context) {
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
		return
	}
	
	user, ok := userObj.(*repository.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user data"})
		return
	}

	// Return user info without password
	c.JSON(http.StatusOK, gin.H{
		"user_id":  user.ID,
		"login":    user.Login,
		"nickname": user.Nickname,
	})
}

// @Summary Logout a user
// @Description Logs out the user by deleting the session token.
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /users/logout [post]
func (h *UserHandler) Logout(c *gin.Context) {
	log.Printf("Logout: received request")

	cookie, err := c.Request.Cookie("session_token")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
		return
	}

	if err := h.svc.DeleteSession(c.Request.Context(), cookie.Value); err != nil {
		log.Printf("Logout: failed to delete session, error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not revoke session"})
		return
	}

	// Expire the cookie in the browser
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
	log.Printf("Logout: user logged out successfully")
}

type UpdateProfileRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
	Nickname string `json:"nickname"`
}

// @Summary Update user profile
// @Description Update the current user's profile (login, password, and/or nickname)
// @Tags users
// @Accept json
// @Produce json
// @Param body body UpdateProfileRequest true "Profile fields to update (any or all)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /users/me [patch]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
		return
	}
	user, ok := userObj.(*repository.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// If all fields are empty, do nothing
	if req.Login == "" && req.Password == "" && req.Nickname == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Validate input lengths if provided
	if req.Login != "" && (len(req.Login) < 3 || len(req.Login) > 50) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Login must be between 3 and 50 characters"})
		return
	}
	if req.Password != "" && len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
		return
	}
	if req.Nickname != "" && (len(req.Nickname) < 1 || len(req.Nickname) > 30) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nickname must be between 1 and 30 characters"})
		return
	}

	// Check if new login is already taken (if changing login)
	if req.Login != "" && req.Login != user.Login {
		exists, err := h.svc.UserExists(c.Request.Context(), req.Login)
		if err != nil {
			log.Printf("UpdateProfile: failed to check login availability, error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check login availability"})
			return
		}
		if exists {
			c.JSON(http.StatusConflict, gin.H{"error": "Login already in use"})
			return
		}
	}

	err := h.svc.UpdateUserProfile(c.Request.Context(), user.ID, req.Login, req.Password, req.Nickname)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		log.Printf("UpdateProfile: failed to update profile for user %d, error: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Fetch the updated user info
	var updatedUser *repository.User
	if req.Login != "" {
		updatedUser, err = h.svc.GetUserByLogin(c.Request.Context(), req.Login)
	}
	if updatedUser == nil || err != nil {
		updatedUser, _ = h.svc.GetUserByLogin(c.Request.Context(), user.Login)
	}

	// Return user info without password
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"user_id":  updatedUser.ID,
			"login":    updatedUser.Login,
			"nickname": updatedUser.Nickname,
		},
	})
}

// @Summary Delete current user account
// @Description Deletes the user, all their records, and session.
// @Tags users
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /users/me [delete]
func (h *UserHandler) DeleteAccount(c *gin.Context) {
	userObj, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
		return
	}
	user, ok := userObj.(*repository.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user object"})
		return
	}

	if err := h.svc.DeleteUserAccount(c.Request.Context(), user.ID); err != nil {
		log.Printf("DeleteAccount: failed to delete user %d, error: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	// Expire the session cookie
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
	log.Printf("DeleteAccount: successfully deleted user account %d", user.ID)
}