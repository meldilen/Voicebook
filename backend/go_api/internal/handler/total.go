package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
	"github.com/gin-gonic/gin"
)

type TotalHandler struct {
	svc      *service.TotalService
	recordSvc *service.RecordService
}

func NewTotalHandler(svc *service.TotalService, recordSvc *service.RecordService) *TotalHandler {
	return &TotalHandler{
		svc:      svc,
		recordSvc: recordSvc,
	}
}

// @Summary Get totals for date range
// @Description Get daily totals (emotion and summary) for a user within a date range
// @Tags totals
// @Accept json
// @Produce json
// @Param userID path int true "User ID"
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /totals/{userID} [get]
func (h *TotalHandler) GetTotals(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid start date format, use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid end date format, use YYYY-MM-DD",
		})
		return
	}

	if startDate.After(endDate) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Start date must be before or equal to end date",
		})
		return
	}

	if endDate.Sub(startDate) > 365*24*time.Hour {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Date range cannot exceed 1 year",
		})
		return
	}

	totals, err := h.svc.GetUserTotals(c.Request.Context(), userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get totals",
		})
		return
	}

	// Format response to include only daily emotion and summary
	dailyData := make([]map[string]interface{}, len(totals))
	for i, total := range totals {
		dailyData[i] = map[string]interface{}{
			"date":    total.Date.Format("2006-01-02"),
			"emotion": total.Emotion,
			"summary": total.Summary,
		}
	}

	response := gin.H{
		"success": true,
		"data":    dailyData,
	}

	if len(totals) == 0 {
		response["message"] = "No records found for the specified period"
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Recalculate daily total
// @Description Recalculate emotion and summary for a specific day
// @Tags totals
// @Accept json
// @Produce json
// @Param userID path int true "User ID"
// @Param date path string true "Date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /totals/{userID}/recalculate/{date} [post]
func (h *TotalHandler) RecalculateTotal(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}
	
	dateStr := c.Param("date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid date format, use YYYY-MM-DD",
		})
		return
	}
	
	// Calculate daily total using all records from that day
	err = h.svc.CalculateDailyTotal(c.Request.Context(), userID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to recalculate totals: " + err.Error(),
		})
		return
	}

	// Get the updated total
	totals, err := h.svc.GetUserTotals(c.Request.Context(), userID, date, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch updated totals",
		})
		return
	}

	var dailyData map[string]interface{}
	if len(totals) > 0 {
		total := totals[0]
		dailyData = map[string]interface{}{
			"date":    total.Date.Format("2006-01-02"),
			"emotion": total.Emotion,
			"summary": total.Summary,
		}
	}

	response := gin.H{
		"success": true,
		"data":    dailyData,
		"message": "Daily total recalculated successfully",
	}

	c.JSON(http.StatusOK, response)
}