package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
	"time"
)

// CaptchaRequest represents the behavioral data sent by the client
type CaptchaRequest struct {
	MouseMovements   []MousePoint `json:"mouseMovements"`
	TimeOnPage       int64        `json:"timeOnPage"`
	ScrollPositions  []int        `json:"scrollPositions"`
	UserAgent        string       `json:"userAgent"`
	ScreenResolution string       `json:"screenResolution"`
	Language         string       `json:"language"`
	Timezone         string       `json:"timezone"`
	AttemptNumber    int          `json:"attemptNumber"`
}

// MousePoint records a single mouse movement event
type MousePoint struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	T float64 `json:"t"`
}

// CaptchaResponse is returned to the client after verification
type CaptchaResponse struct {
	Success bool   `json:"success"`
	Token   string `json:"token,omitempty"`
	Error   string `json:"error,omitempty"`
}

var secretKey string

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// analyzeBehavior performs behavioral analysis on the captcha data
func analyzeBehavior(req CaptchaRequest) (bool, string) {
	// Check 1: Time on page - bots usually submit too fast
	if req.TimeOnPage < 1000 {
		return false, "Submission too fast"
	}

	// Check 2: Mouse movement analysis
	if len(req.MouseMovements) < 5 {
		return false, "Insufficient mouse data"
	}

	// Check 3: Mouse movement entropy - real humans have varied movement patterns
	entropy := calculateMouseEntropy(req.MouseMovements)
	if entropy < 0.3 {
		return false, "Mouse movement too uniform"
	}

	// Check 4: Mouse movement speed - bots often have superhuman speed
	maxSpeed := calculateMaxMouseSpeed(req.MouseMovements)
	if maxSpeed > 5000 { // pixels per second
		return false, "Mouse speed too high"
	}

	// Check 5: Check for common bot user agents
	botPatterns := []string{"bot", "crawler", "spider", "headless", "phantom", "selenium", "puppeteer"}
	uaLower := strings.ToLower(req.UserAgent)
	for _, pattern := range botPatterns {
		if strings.Contains(uaLower, pattern) {
			return false, "Bot user agent detected"
		}
	}

	// Check 6: Screen resolution - bots often use unusual resolutions
	if req.ScreenResolution == "" || req.ScreenResolution == "0x0" {
		return false, "Invalid screen resolution"
	}

	// Check 7: Attempt number - too many attempts from same session
	if req.AttemptNumber > 10 {
		return false, "Too many attempts"
	}

	return true, ""
}

// calculateMouseEntropy measures the randomness of mouse movements
func calculateMouseEntropy(points []MousePoint) float64 {
	if len(points) < 2 {
		return 0
	}

	var totalDistance float64
	var directionChanges int

	for i := 1; i < len(points); i++ {
		dx := points[i].X - points[i-1].X
		dy := points[i].Y - points[i-1].Y
		totalDistance += math.Sqrt(dx*dx + dy*dy)

		// Count direction changes
		if i > 1 {
			prevDx := points[i-1].X - points[i-2].X
			prevDy := points[i-1].Y - points[i-2].Y
			if (dx*prevDx + dy*prevDy) < 0 {
				directionChanges++
			}
		}
	}

	avgDistance := totalDistance / float64(len(points)-1)
	if avgDistance == 0 {
		return 0
	}

	// Normalize: higher direction changes = more human-like
	entropy := float64(directionChanges) / float64(len(points)-1)
	return entropy
}

// calculateMaxMouseSpeed finds the maximum mouse movement speed
func calculateMaxMouseSpeed(points []MousePoint) float64 {
	var maxSpeed float64

	for i := 1; i < len(points); i++ {
		dx := points[i].X - points[i-1].X
		dy := points[i].Y - points[i-1].Y
		dt := points[i].T - points[i-1].T

		if dt > 0 {
			distance := math.Sqrt(dx*dx + dy*dy)
			speed := distance / (dt / 1000.0) // pixels per second
			if speed > maxSpeed {
				maxSpeed = speed
			}
		}
	}

	return maxSpeed
}

// generateToken creates a signed verification token
func generateToken() string {
	// Generate random bytes
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		log.Printf("Error generating random bytes: %v", err)
		return ""
	}

	// Create HMAC signature
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write(bytes)
	signature := mac.Sum(nil)

	// Combine random bytes with signature
	token := hex.EncodeToString(bytes) + "." + hex.EncodeToString(signature)
	return token
}

// verifyToken validates a captcha token
func verifyToken(token string) bool {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(parts[0]))
	expectedSignature := mac.Sum(nil)

	actualSignature, err := hex.DecodeString(parts[1])
	if err != nil {
		return false
	}

	return hmac.Equal(expectedSignature, actualSignature)
}

// handleCaptchaVerify processes captcha verification requests
func handleCaptchaVerify(w http.ResponseWriter, r *http.Request) {
	// Only accept POST requests
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(CaptchaResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Parse request body
	var req CaptchaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(CaptchaResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Perform behavioral analysis
	isHuman, reason := analyzeBehavior(req)

	if !isHuman {
		log.Printf("Captcha failed: %s (attempts: %d)", reason, req.AttemptNumber)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(CaptchaResponse{
			Success: false,
			Error:   reason,
		})
		return
	}

	// Generate verification token
	token := generateToken()
	if token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(CaptchaResponse{
			Success: false,
			Error:   "Token generation failed",
		})
		return
	}

	log.Printf("Captcha verified successfully (attempts: %d)", req.AttemptNumber)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(CaptchaResponse{
		Success: true,
		Token:   token,
	})
}

// handleCaptchaVerifyToken validates an existing captcha token
func handleCaptchaVerifyToken(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid": false,
			"error": "Token required",
		})
		return
	}

	valid := verifyToken(token)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid": valid,
	})
}

func main() {
	port := getEnv("CAPTCHA_PORT", "3001")
	secretKey = os.Getenv("CAPTCHA_SECRET")
	if secretKey == "" {
		log.Fatal("CAPTCHA_SECRET must be set")
	}

	http.HandleFunc("/api/captcha/verify", handleCaptchaVerify)
	http.HandleFunc("/api/captcha/verify-token", handleCaptchaVerifyToken)

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Captcha server starting on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
