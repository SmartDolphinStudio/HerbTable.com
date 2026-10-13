// Behavioral signals are a heuristic, not proof of identity.
package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type MousePoint struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	T float64 `json:"t"`
}
type CaptchaRequest struct {
	Challenge      string       `json:"challenge"`
	MouseMovements []MousePoint `json:"mouseMovements"`
	TimeOnPage     int64        `json:"timeOnPage"`
	UserAgent      string       `json:"userAgent"`
}
type tokenClaims struct {
	ID      string `json:"id"`
	Exp     int64  `json:"exp"`
	Purpose string `json:"purpose"`
	Session string `json:"session"`
}
type challenge struct {
	Created  time.Time
	Session  string
	Attempts int
}

var secretKey string
var mu sync.Mutex
var challenges = map[string]challenge{}

type rateEntry struct {
	Start time.Time
	Count int
}

var rates = map[string]rateEntry{}

func randomID() (string, error) {
	b := make([]byte, 32)
	_, e := rand.Read(b)
	return hex.EncodeToString(b), e
}
func getEnv(k, f string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return f
}
func response(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
func session(r *http.Request) string {
	c, e := r.Cookie("herb_captcha_session")
	if e != nil || len(c.Value) != 64 {
		return ""
	}
	if _, e := hex.DecodeString(c.Value); e != nil {
		return ""
	}
	return c.Value
}
func limiter(r *http.Request) bool {
	ip, _, e := net.SplitHostPort(r.RemoteAddr)
	if e != nil {
		return false
	}
	now := time.Now()
	mu.Lock()
	defer mu.Unlock()
	for k, v := range rates {
		if now.Sub(v.Start) > time.Minute {
			delete(rates, k)
		}
	}
	if len(rates) >= 10000 {
		return false
	}
	v := rates[ip]
	if now.Sub(v.Start) > time.Minute {
		v = rateEntry{Start: now}
	}
	v.Count++
	rates[ip] = v
	return v.Count <= 60
}
func sweep(now time.Time) {
	for k, v := range challenges {
		if now.Sub(v.Created) > 5*time.Minute {
			delete(challenges, k)
		}
	}
}
func handleChallenge(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		response(w, 405, map[string]any{"success": false})
		return
	}
	if !limiter(r) {
		response(w, 429, map[string]any{"error": "rate limit"})
		return
	}
	sid := session(r)
	if sid == "" {
		var e error
		sid, e = randomID()
		if e != nil {
			response(w, 503, map[string]any{"error": "random unavailable"})
			return
		}
		http.SetCookie(w, &http.Cookie{Name: "herb_captcha_session", Value: sid, Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: r.TLS != nil, MaxAge: 300})
	}
	id, e := randomID()
	if e != nil {
		response(w, 503, map[string]any{"error": "random unavailable"})
		return
	}
	mu.Lock()
	sweep(time.Now())
	if len(challenges) >= 10000 {
		mu.Unlock()
		response(w, 503, map[string]any{"error": "challenge capacity"})
		return
	}
	challenges[id] = challenge{Created: time.Now(), Session: sid}
	mu.Unlock()
	response(w, 200, map[string]any{"challenge": id, "expiresIn": 300})
}
func signClaims(c tokenClaims) string {
	b, _ := json.Marshal(c)
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write(b)
	return hex.EncodeToString(b) + "." + hex.EncodeToString(mac.Sum(nil))
}
func parseToken(token string) (tokenClaims, bool) {
	var c tokenClaims
	if len(token) > 2048 {
		return c, false
	}
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return c, false
	}
	payload, e := hex.DecodeString(parts[0])
	if e != nil {
		return c, false
	}
	signature, e := hex.DecodeString(parts[1])
	if e != nil || len(signature) != 32 {
		return c, false
	}
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write(payload)
	if !hmac.Equal(mac.Sum(nil), signature) || json.Unmarshal(payload, &c) != nil {
		return c, false
	}
	return c, c.ID != "" && c.Purpose == "captcha" && c.Exp > time.Now().Unix() && c.Exp <= time.Now().Add(5*time.Minute).Unix()
}
func handleCaptchaVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		response(w, 405, map[string]any{"success": false})
		return
	}
	if !limiter(r) {
		response(w, 429, map[string]any{"success": false, "error": "rate limit"})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	var req CaptchaRequest
	if json.NewDecoder(r.Body).Decode(&req) != nil {
		response(w, 400, map[string]any{"success": false, "error": "invalid body"})
		return
	}
	now := time.Now()
	sid := session(r)
	mu.Lock()
	sweep(now)
	c, ok := challenges[req.Challenge]
	if !ok || sid == "" || sid != c.Session {
		mu.Unlock()
		response(w, 400, map[string]any{"success": false, "error": "invalid challenge"})
		return
	}
	c.Attempts++
	challenges[req.Challenge] = c
	valid := c.Attempts <= 5 && now.Sub(c.Created) >= time.Second && len(req.MouseMovements) >= 5 && len(req.MouseMovements) <= 1000 && req.TimeOnPage >= 1000 && len(req.UserAgent) <= 1024
	if !valid {
		mu.Unlock()
		response(w, 400, map[string]any{"success": false, "error": "challenge not completed"})
		return
	}
	delete(challenges, req.Challenge)
	id, e := randomID()
	if e != nil {
		mu.Unlock()
		response(w, 503, map[string]any{"success": false})
		return
	}
	claims := tokenClaims{ID: id, Exp: now.Add(2 * time.Minute).Unix(), Purpose: "captcha", Session: sid}
	mu.Unlock()
	response(w, 200, map[string]any{"success": true, "token": signClaims(claims)})
}
func main() {
	secretKey = os.Getenv("CAPTCHA_SECRET")
	if len(secretKey) < 32 {
		log.Fatal("CAPTCHA_SECRET requires at least 32 random bytes")
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/captcha/challenge", handleChallenge)
	mux.HandleFunc("/api/captcha/verify", handleCaptchaVerify)
	server := &http.Server{Addr: getEnv("CAPTCHA_LISTEN_ADDR", "127.0.0.1:3001"), Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 30 * time.Second, MaxHeaderBytes: 16 << 10}
	log.Fatal(server.ListenAndServe())
}
