package handler

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/repository"
	"github.com/IU-Capstone-Project-2025/VoiceDiary/backend/go_api/internal/service"
)

type RecordHandler struct {
	svc *service.RecordService
    db  *sql.DB
}

func NewRecordHandler(db *sql.DB, mlURL string) *RecordHandler {
	return &RecordHandler{
		svc: service.NewRecordService(db, mlURL),
		db:  db, // Сохраняем соединение с БД
	}
}

// UploadRecord handles voice file upload, sends it to ML service, and saves record metadata.
// @Summary Upload  a new voice record
// @Description Uploads a voice file, sends it to the ML service for analysis, and saves the record.
// @Tags records
// @Accept  multipart/form-data
// @Produce json
// @Param userID formData int true "User ID"
// @Param file formData file true "Voice file"
// @Success 200 {object} map[string]int
// @Failure 400 {object} map[string]string
// @Router /records/upload [post]
func (h *RecordHandler) UploadRecord(c *gin.Context) {
	log.Printf("UploadRecord: received request")

	// Определяем тип пользователя из сессии/контекста
	userObj, exists := c.Get("user")
	if !exists {
		// Если нет пользователя в контексте, пробуем получить из формы (для обратной совместимости)
		userIDStr := c.PostForm("userID")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			log.Printf("UploadRecord: invalid userID %s, error: %v", userIDStr, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return 
		}
		
		// Для обратной совместимости создаем временный контекст
		userObj = &repository.User{ID: userID}
	}

	// Определяем тип пользователя и ID
	var userID int
	var userType string
	var vkUserID int

	switch user := userObj.(type) {
	case *repository.User: // Обычный пользователь
		userID = user.ID
		userType = "regular"
		log.Printf("UploadRecord: processing for regular user %d", userID)
	case *repository.VKUser: // VK пользователь
		userID = user.ID
		userType = "vk"
		vkUserID = user.VKUserID
		log.Printf("UploadRecord: processing for VK user %d (VK ID: %d)", userID, vkUserID)
	default:
		log.Printf("UploadRecord: unknown user type: %T", userObj)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unknown user type"})
		return
	}

	// Получаем файл
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("UploadRecord: failed to get file from form, error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return 
	}
	defer file.Close()

	// Read file into memory
	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		log.Printf("UploadRecord: failed to read file into buffer, error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Send file to ML service
	emotion, summary, text, err := h.svc.AnalyzeRawAudio(c.Request.Context(), buf.Bytes())
	if err != nil {
		log.Printf("UploadRecord: failed to analyze audio, error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze audio"})
		return
	}

	// Save record in DB в зависимости от типа пользователя
	var recordID int
	if userID != -1 {
		if userType == "vk" {
			// Сохраняем запись для VK пользователя
			recordID, err = h.svc.SaveRecordForVKUser(c.Request.Context(), userID, emotion, summary)
		} else {
			// Сохраняем запись для обычного пользователя
			recordID, err = h.svc.SaveRecord(c.Request.Context(), userID, emotion, summary)
		}
		
		if err != nil {
			log.Printf("UploadRecord: failed to save record for %s user %d, error: %v", userType, userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save record"})
			return
		}

		// ✅ АВТОМАТИЧЕСКАЯ ПРОВЕРКА ДОСТИЖЕНИЙ ПОСЛЕ СОХРАНЕНИЯ ЗАПИСИ
		go h.checkAchievementsAfterRecord(c.Request.Context(), userID, userType)
	} else {
		recordID = -1
	}

	// Формируем ответ
	response := gin.H{
		"user_id": userID,
		"record_id": recordID,
		"emotion": emotion,
		"summary": summary,
		"text": text,
	}

	// Добавляем VK user ID в ответ если это VK пользователь
	if userType == "vk" {
		response["vk_user_id"] = vkUserID
		response["user_type"] = "vk"
	} else {
		response["user_type"] = "regular"
	}

	c.JSON(http.StatusOK, response)

	log.Printf("UploadRecord: successfully processed record for %s user %d with ID %d", userType, userID, recordID)
}

// checkAchievementsAfterRecord автоматически проверяет достижения после создания записи
func (h *RecordHandler) checkAchievementsAfterRecord(ctx context.Context, userID int, userType string) {
	log.Printf("checkAchievementsAfterRecord: checking achievements for %s user %d", userType, userID)
	
	// Создаем новый контекст с таймаутом для фоновой задачи
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Получаем сервис достижений через существующее соединение с БД
	// Для этого нужно добавить поле db в RecordHandler
	achievementsService := service.NewAchievementsService(h.db)
	
	// Получаем и рассчитываем достижения
	achievements, err := achievementsService.GetUserAchievements(ctx, userID, userType)
	if err != nil {
		log.Printf("checkAchievementsAfterRecord: failed to get achievements for %s user %d: %v", userType, userID, err)
		return
	}

	// Логируем разблокированные достижения
	unlockedCount := 0
	for _, achievement := range achievements {
		if achievement.Unlocked {
			unlockedCount++
			log.Printf("checkAchievementsAfterRecord: %s user %d unlocked achievement: %s", 
				userType, userID, achievement.Title)
		}
	}

	log.Printf("checkAchievementsAfterRecord: completed for %s user %d, unlocked %d achievements", 
		userType, userID, unlockedCount)
}

// GetRecords returns all records for a given user.
// @Summary Get user records
// @Description  Returns a list of all diary records for a specific user.
// @Tags records
// @Accept json
// @Produce json
// @Param userID path int true "User ID"
// @Success 200 {array} repository.Record
// @Failure 400 {object} map[string]string
// @Router /users/{userID}/records [get]
func (h *RecordHandler) GetRecords(c *gin.Context) {
    log.Printf("GetRecords: received request")

    ctx := c.Request.Context()
    userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Printf("GetRecords: invalid userID %s, error: %v", userIDStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

    dateStr := c.Query("date")
    var date time.Time
    if dateStr != "" {
        var err error
        date, err = time.Parse("2006-01-02", dateStr)
        if err != nil {
            log.Printf("GetRecords: invalid date %s, error: %v", dateStr, err)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date"})
            return
        }
    }

    limitStr := c.Query("limit")
    var limit int
    if limitStr != "" {
        var err error
        limit, err = strconv.Atoi(limitStr)
        if err != nil {
            log.Printf("GetRecords: invalid limit %s, error: %v", limitStr, err)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
            return
        }
    }

    records, err := h.svc.FetchUserRecords(ctx, userID, date, limit)
    if err != nil {
        log.Printf("GetRecords: failed to fetch records for userID %d, error: %v", userID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, records)
    log.Printf("GetRecords: successfully fetched %d records for userID %d", len(records), userID)
}

// @Summary  Get analysis result for a record.
// @Description Returns emotion, summary, and feedback for a specific record.
// @Tags records
// @Produce json
// @Param recordID path int true "Record ID"
// @Success 200 {object} repository.Record
// @Failure 400 {object} map[string]string	
// @Router /records/{recordID} [get]
func (h *RecordHandler) GetRecordAnalysis(c *gin.Context) {
    log.Printf("GetRecordAnalysis: received request")

    recordIDStr := c.Param("recordID")
    recordID, err := strconv.Atoi(recordIDStr)
    if err != nil {
        log.Printf("GetRecordAnalysis: invalid recordID %s, error: %v", recordIDStr, err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
        return
    }
    record, err := h.svc.FetchRecordByID(c.Request.Context(), recordID)
    if err != nil {
        log.Printf("GetRecordAnalysis: failed to fetch record with ID %d, error: %v", recordID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Record not found"})
        return
    }

    var insightsMap map[string]any
    if record.Insights.Valid && record.Insights.String != "" {
        if err := json.Unmarshal([]byte(record.Insights.String), &insightsMap); err != nil {
            log.Printf("GetRecordAnalysis: failed to unmarshal insights for record %d, error: %v", recordID, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse insights"})
            return
        }
    }

    response := gin.H{
        "record_id":    record.ID,
        "user_id":     record.UserID,
        "record_date":  record.RecordDate,
        "emotion":      record.Emotion,
        "summary":      record.Summary,
        "feedback":     record.Feedback,
        "insights":    insightsMap["insights"].(map[string]any),
    }

    c.JSON(http.StatusOK, response)
    log.Printf("GetRecordAnalysis: successfully fetched record with ID %d", recordID)
}

type InsightsResponse struct {
    Insights map[string]any `json:"insights"`
}

// GetRecordInsights returns insights for a specific record.
// @Summary Get insights for a record.
// @Description Returns insights for a specific record.
// @Tags records
// @Produce json
// @Success 200 {object} handler.InsightsResponse
// @Failure 400 {object} map[string]string
// @Router /records/insights [post]
func (h *RecordHandler) GetRecordInsights(c *gin.Context) {
    log.Println("GetRecordInsights: received request")

    var input struct {
        Text     string `json:"text"`
        RecordID int    `json:"recordID"` 
    }
    
    if err := c.BindJSON(&input); err != nil {
        log.Printf("GetRecordInsights: invalid JSON body, error: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
        return
    }

    if input.Text == "" {
        log.Println("GetRecordInsights: empty text input")
        c.JSON(http.StatusBadRequest, gin.H{"error": "Text is required"})
        return
    }

    result, err := h.svc.AnalyzeText(c.Request.Context(), input.Text)
    if err != nil {
        log.Printf("GetRecordInsights: failed to analyze text, error: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze text"})
        return
    }

    
    if input.RecordID != -1 { 
        b, err := json.Marshal(result.Insights)
        if err != nil {
            log.Printf("GetRecordInsights: failed to marshal insights, error: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process insights"})
            return
        }
        
        err = h.svc.SaveInsights(c.Request.Context(), input.RecordID, string(b)) 
        if err != nil {
            log.Printf("GetRecordInsights: failed to save insights, error: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save insights"})
            return
        }
    }

    c.JSON(http.StatusOK, result.Insights)
    log.Println("GetRecordInsights: analysis completed successfully")
}

// DeleteRecord deletes a record by its ID.
// @Summary Delete a record
// @Description Deletes a record by its record_id.
// @Tags records
// @Param recordID path int true "Record ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /records/{recordID} [delete]
func (h *RecordHandler) DeleteRecord(c *gin.Context) {
    log.Printf("DeleteRecord: received request")

    recordIDStr := c.Param("recordID")
    recordID, err := strconv.Atoi(recordIDStr)
    if err != nil {
        log.Printf("DeleteRecord: invalid recordID %s, error: %v", recordIDStr, err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
        return
    }

    err = h.svc.DeleteRecordByID(c.Request.Context(), recordID)
    if err != nil {
        if err == sql.ErrNoRows {
            log.Printf("DeleteRecord: record with ID %d not found", recordID)
            c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
            return
        }
        log.Printf("DeleteRecord: failed to delete record with ID %d, error: %v", recordID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete record"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Record deleted successfully"})
    log.Printf("DeleteRecord: successfully deleted record with ID %d", recordID)
}

// SetRecordFeedback sets feedback for a record.
// @Summary Set feedback for a record
// @Description Sets feedback value for a specific record.
// @Tags records
// @Accept json
// @Produce json
// @Param recordID path int true "Record ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /records/{recordID}/feedback [post]
func (h *RecordHandler) SetRecordFeedback(c *gin.Context) {
    log.Printf("SetRecordFeedback: received request")

    recordIDStr := c.Param("recordID")
    recordID, err := strconv.Atoi(recordIDStr)
    if err != nil {
        log.Printf("SetRecordFeedback: invalid recordID %s, error: %v", recordIDStr, err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
        return
    }

    var req struct {
        Feedback int `json:"feedback"`
    }
    if err := c.BindJSON(&req); err != nil {
        log.Printf("SetRecordFeedback: invalid JSON body, error: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
        return
    }

    err = h.svc.UpdateRecordFeedback(c.Request.Context(), recordID, req.Feedback)
    if err != nil {
        if err == sql.ErrNoRows {
            log.Printf("SetRecordFeedback: record with ID %d not found", recordID)
            c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
            return
        }
        log.Printf("SetRecordFeedback: failed to update feedback for record %d, error: %v", recordID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update feedback"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Feedback set successfully"})
    log.Printf("SetRecordFeedback: successfully updated feedback for record %d", recordID)
}

// @Summary Update emotion for a record
// @Description Updates the emotion field of a record by ID
// @Tags records
// @Accept json
// @Produce json
// @Param recordID path int true "Record ID"
// @Param body body map[string]string true "Emotion payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /records/{recordID}/emotion [patch]
func (h *RecordHandler) UpdateEmotion(c *gin.Context) {
    recordIDStr := c.Param("recordID")
    recordID, err := strconv.Atoi(recordIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
        return
    }

    var payload struct {
        Emotion string `json:"emotion"`
    }
    if err := c.ShouldBindJSON(&payload); err != nil || payload.Emotion == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing emotion"})
        return
    }

    if err := h.svc.UpdateEmotion(c.Request.Context(), recordID, payload.Emotion); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update emotion"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Emotion updated successfully"})
}

// @Summary Get consecutive recording days
// @Description Returns how many days in a row the user has recorded voice messages
// @Tags totals
// @Accept json
// @Produce json
// @Param userID path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users/{userID}/consecutive-days [get]
func (h *RecordHandler) GetConsecutiveRecordingDays(c *gin.Context) {
    userIDStr := c.Param("userID")
    userID, err := strconv.Atoi(userIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "error":   "Invalid user ID",
        })
        return
    }

    days, err := h.svc.GetConsecutiveRecordingDays(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error":   "Failed to get consecutive days",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": gin.H{
            "consecutive_days": days,
        },
    })
}