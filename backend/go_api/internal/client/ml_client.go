package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"time"
)

type AnalysisResult struct {
	Emotion   string         `json:"emotion"`
	Summary   string         `json:"summary"`
	Text      string         `json:"transcript"`
	Insights  map[string]any `json:"insights"`
	Transcript string        `json:"transcript"`
}

type CombinedData struct {
	Emotion string `json:"emotion"`
	Summary string `json:"summary"`
}

// CallMLService sends audio file to ML service for processing
func CallMLService(ctx context.Context, mlURL string, fileBytes []byte) (*AnalysisResult, error) {
	log.Printf("CallMLService: sending audio to ML service at %s", mlURL)

	// Create a new multipart writer
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	// CHANGE: Use "file" instead of "audio" to match ML service expectation
	part, err := writer.CreateFormFile("file", "audio.wav")
	if err != nil {
		log.Printf("CallMLService: failed to create form file, error: %v", err)
		return nil, err
	}
	
	if _, err := io.Copy(part, bytes.NewReader(fileBytes)); err != nil {
		log.Printf("CallMLService: failed to copy file bytes, error: %v", err)
		return nil, err
	}
	
	if err := writer.Close(); err != nil {
		log.Printf("CallMLService: failed to close writer, error: %v", err)
		return nil, err
	}
	log.Printf("CallMLService: created multipart form with audio file")

	// Create HTTP POST request to process_audio endpoint
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, mlURL+"/process_audio", body)
	if err != nil {
		log.Printf("CallMLService: failed to create request, error: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	log.Printf("CallMLService: set request headers")

	// Create client with timeout
	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("CallMLService: failed to send request, error: %v", err)
		return nil, err
	}
	defer resp.Body.Close()
	
	log.Printf("CallMLService: received response with status code %d", resp.StatusCode)

	// Handle non-200 responses
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("CallMLService: ML service returned error: %s", string(bodyBytes))
		return nil, fmt.Errorf("ML service error: %s", string(bodyBytes))
	}

	// Decode JSON response
	var result AnalysisResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("CallMLService: failed to decode response, error: %v", err)
		return nil, err
	}
	
	// Map transcript to text for backward compatibility
	if result.Text == "" && result.Transcript != "" {
		result.Text = result.Transcript
	}
	
	log.Printf("CallMLService: successfully processed audio, emotion: %s, summary length: %d, transcript length: %d", 
		result.Emotion, len(result.Summary), len(result.Text))
	return &result, nil
}

// CallMLServiceWithInsights sends text to ML service for insights analysis
func CallMLServiceWithInsights(ctx context.Context, mlURL string, text string) (*AnalysisResult, error) {
	log.Printf("CallMLServiceWithInsights: sending text to ML service at %s", mlURL)

	payload := map[string]string{"text": text}
	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("CallMLServiceWithInsights: failed to marshal payload, error: %v", err)
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, mlURL+"/analyze_text", bytes.NewBuffer(jsonBytes))
	if err != nil {
		log.Printf("CallMLServiceWithInsights: failed to create request, error: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("CallMLServiceWithInsights: failed to send request, error: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("CallMLServiceWithInsights: ML service returned error: %s", string(bodyBytes))
		return nil, err
	}

	var result AnalysisResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("CallMLServiceWithInsights: failed to decode response, error: %v", err)
		return nil, err
	}

	log.Printf("CallMLServiceWithInsights: successfully analyzed text, emotion: %s", result.Emotion)
	return &result, nil
}

// CallMLServiceWithCombinedText sends combined text for summary generation
func CallMLServiceWithCombinedText(ctx context.Context, mlURL string, combinedText string) (*CombinedData, error) {
	log.Printf("CallMLServiceWithCombinedText: sending combined text to ML service, text length: %d", len(combinedText))

	payload := map[string]string{"text": combinedText}
	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("CallMLServiceWithCombinedText: failed to marshal payload, error: %v", err)
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, mlURL+"/summarize", bytes.NewBuffer(jsonBytes))
	if err != nil {
		log.Printf("CallMLServiceWithCombinedText: failed to create request, error: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("CallMLServiceWithCombinedText: failed to send request, error: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("CallMLServiceWithCombinedText: ML service returned error: %s", string(bodyBytes))
		return nil, err
	}

	var result CombinedData
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("CallMLServiceWithCombinedText: failed to decode response, error: %v", err)
		return nil, err
	}

	log.Printf("CallMLServiceWithCombinedText: successfully generated summary, emotion: %s, summary length: %d", 
		result.Emotion, len(result.Summary))
	return &result, nil
}