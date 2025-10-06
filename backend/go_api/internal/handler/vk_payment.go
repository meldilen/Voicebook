package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
	"github.com/gin-gonic/gin"
)

type VKPaymentsHandler struct {
	userService *service.UserService
}

func NewVKPaymentsHandler(userService *service.UserService) *VKPaymentsHandler {
	return &VKPaymentsHandler{
		userService: userService,
	}
}

// VK Secret Key (из ваших настроек VK Mini App)
const VK_SECRET = "00Az3wTs1tFYUOdaZuHQ"

// Item структура товара
type VKItem struct {
	Title    string `json:"title"`
	Price    int    `json:"price"`
	PhotoURL string `json:"photo_url"`
	ItemID   string `json:"item_id"`
}

// Available items
var vkItems = map[string]VKItem{
	"sale_item_id_50": {
		Title:    "50 монет",
		Price:    50,
		PhotoURL: "https://example.com/coin50.png",
		ItemID:   "sale_item_id_50",
	},
	"sale_item_id_100": {
		Title:    "100 монет",
		Price:    100,
		PhotoURL: "https://example.com/coin100.png",
		ItemID:   "sale_item_id_100",
	},
}

// VKPaymentRequest представляет запрос от VK Payments
type VKPaymentRequest struct {
	Type    string                 `json:"type"`
	Secret  string                 `json:"secret"`
	Item    string                 `json:"item,omitempty"`
	ItemID  string                 `json:"item_id,omitempty"`
	OrderID int                    `json:"order_id,omitempty"`
	Status  string                 `json:"status,omitempty"`
	UserID  int                    `json:"user_id,omitempty"`
	Extra   map[string]interface{} `json:"extra,omitempty"`
}

// VKPaymentResponse представляет ответ для VK Payments
type VKPaymentResponse struct {
	Response interface{} `json:"response"`
}

// @Summary VK Payments webhook
// @Description Handle VK Payments notifications (get_item, order_status_change)
// @Tags payments
// @Accept json
// @Produce json
// @Param body body VKPaymentRequest true "VK payment data"
// @Success 200 {object} VKPaymentResponse
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /api/vk/payments [post]
func (h *VKPaymentsHandler) HandlePayments(c *gin.Context) {
	log.Printf("VKPayments: received payment notification")

	var req VKPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("VKPayments: invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate VK signature
	if req.Secret != VK_SECRET {
		log.Printf("VKPayments: invalid secret key")
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	switch req.Type {
	case "get_item":
		h.handleGetItem(c, req)
	case "order_status_change":
		h.handleOrderStatusChange(c, req)
	default:
		log.Printf("VKPayments: unknown type: %s", req.Type)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown type"})
	}
}

// handleGetItem returns item information
func (h *VKPaymentsHandler) handleGetItem(c *gin.Context, req VKPaymentRequest) {
	log.Printf("VKPayments: handling get_item request")

	itemID := req.Item
	if itemID == "" {
		itemID = req.ItemID
	}

	item, exists := vkItems[itemID]
	if !exists {
		log.Printf("VKPayments: item not found: %s", itemID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	response := VKPaymentResponse{
		Response: item,
	}

	c.JSON(http.StatusOK, response)
	log.Printf("VKPayments: returned item info for %s", itemID)
}

// handleOrderStatusChange processes order status changes
func (h *VKPaymentsHandler) handleOrderStatusChange(c *gin.Context, req VKPaymentRequest) {
	log.Printf("VKPayments: handling order_status_change, order_id=%d, status=%s, user_id=%d", 
		req.OrderID, req.Status, req.UserID)

	if req.UserID == 0 {
		log.Printf("VKPayments: user_id is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	item, exists := vkItems[req.ItemID]
	if !exists {
		log.Printf("VKPayments: item not found: %s", req.ItemID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	switch req.Status {
	case "chargeable", "paid":
		// Add coins to user
		err := h.addCoinsToUser(c.Request.Context(), req.UserID, item.Price)
		if err != nil {
			log.Printf("VKPayments: failed to add coins to user %d: %v", req.UserID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process payment"})
			return
		}
		log.Printf("VKPayments: added %d coins to user %d, order_id=%d", item.Price, req.UserID, req.OrderID)

	case "refunded":
		// Remove coins from user
		err := h.removeCoinsFromUser(c.Request.Context(), req.UserID, item.Price)
		if err != nil {
			log.Printf("VKPayments: failed to remove coins from user %d: %v", req.UserID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process refund"})
			return
		}
		log.Printf("VKPayments: removed %d coins from user %d, order_id=%d", item.Price, req.UserID, req.OrderID)

	default:
		log.Printf("VKPayments: unknown status: %s", req.Status)
	}

	response := VKPaymentResponse{
		Response: "ok",
	}

	c.JSON(http.StatusOK, response)
	log.Printf("VKPayments: successfully processed order %d", req.OrderID)
}

// addCoinsToUser adds coins to user's balance
func (h *VKPaymentsHandler) addCoinsToUser(ctx context.Context, vkUserID int, coins int) error {
	// Get user by VK ID
	user, err := repository.GetVKUserByVKID(ctx, h.userService.DB(), vkUserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		// Create new user if not exists
		_, err = repository.CreateVKUser(ctx, h.userService.DB(), vkUserID, coins)
		if err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
	} else {
		// Update existing user's coins
		newCoins := user.Coins + coins
		err = repository.UpdateVKUserCoins(ctx, h.userService.DB(), user.ID, newCoins)
		if err != nil {
			return fmt.Errorf("failed to update user coins: %w", err)
		}
	}

	return nil
}

// removeCoinsFromUser removes coins from user's balance
func (h *VKPaymentsHandler) removeCoinsFromUser(ctx context.Context, vkUserID int, coins int) error {
	// Get user by VK ID
	user, err := repository.GetVKUserByVKID(ctx, h.userService.DB(), vkUserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return fmt.Errorf("user not found")
	}

	// Calculate new coins balance (minimum 0)
	newCoins := user.Coins - coins
	if newCoins < 0 {
		newCoins = 0
	}

	err = repository.UpdateVKUserCoins(ctx, h.userService.DB(), user.ID, newCoins)
	if err != nil {
		return fmt.Errorf("failed to update user coins: %w", err)
	}

	return nil
}

// @Summary Get user balance
// @Description Get coins balance for VK user
// @Tags payments
// @Produce json
// @Param userID path int true "VK User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /api/vk/balance/{userID} [get]
func (h *VKPaymentsHandler) GetUserBalance(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Printf("GetUserBalance: invalid user ID %s: %v", userIDStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	log.Printf("GetUserBalance: fetching balance for user %d", userID)

	// Get user from database
	user, err := repository.GetVKUserByVKID(c.Request.Context(), h.userService.DB(), userID)
	if err != nil {
		log.Printf("GetUserBalance: failed to get user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user balance"})
		return
	}

	coins := 0
	if user != nil {
		coins = user.Coins
	} else {
		// Create user with 0 coins if not exists
		_, err = repository.CreateVKUser(c.Request.Context(), h.userService.DB(), userID, 0)
		if err != nil {
			log.Printf("GetUserBalance: failed to create user %d: %v", userID, err)
		}
	}

	response := map[string]interface{}{
		"user_id": userID,
		"coins":   coins,
	}

	c.JSON(http.StatusOK, response)
	log.Printf("GetUserBalance: returned balance for user %d: %d coins", userID, coins)
}