package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/v9"
)

const (
	defaultListenAddr        = ":9002"
	defaultSecurityService   = "http://127.0.0.1:9001"
	defaultRedisAddr         = "127.0.0.1:6379"
	accessTokenExpirySeconds = 3600
)

type SecurityRequest struct {
	Password string `json:"password,omitempty"`
	Hash     string `json:"hash,omitempty"`
	Sub      string `json:"sub,omitempty"`
	Email    string `json:"email,omitempty"`
	Role     string `json:"role,omitempty"`
	Exp      int64  `json:"exp,omitempty"`
	Token    string `json:"token,omitempty"`
}

type SecurityResponse struct {
	Hash       string       `json:"hash,omitempty"`
	Valid      bool         `json:"valid,omitempty"`
	Token      string       `json:"token,omitempty"`
	Claims     *TokenClaims `json:"claims,omitempty"`
	Ciphertext string       `json:"ciphertext,omitempty"`
	Plaintext  string       `json:"plaintext,omitempty"`
	Error      string       `json:"error,omitempty"`
}

type TokenClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	Exp   int64  `json:"exp"`
}

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type VerifyEnterpriseRequest struct {
	Email string `json:"email"`
}

type VerifyEnterpriseResponse struct {
	IsEnterprise bool   `json:"is_enterprise"`
	Email        string `json:"email"`
	Provider     string `json:"provider,omitempty"`
	Error        string `json:"error,omitempty"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int64  `json:"expires_in"`
	User        User   `json:"user"`
}

type Server struct {
	db         *sql.DB
	redis      *redis.Client
	security   string
	httpClient *http.Client
}

// emailVerifierResult holds the common fields returned by the 3 verifier APIs.
type emailVerifierResult struct {
	IsFree       bool `json:"is_free"`
	HasMX        bool `json:"has_mx"`
	IsDisposable bool `json:"is_disposable"`
}

func main() {
	listenAddr := getEnv("LISTEN_ADDR", defaultListenAddr)
	securityService := getEnv("SECURITY_SERVICE_URL", defaultSecurityService)
	mysqlDSN := os.Getenv("MYSQL_DSN")
	if mysqlDSN == "" {
		log.Fatal("MYSQL_DSN must be set")
	}
	redisAddr := getEnv("REDIS_ADDR", defaultRedisAddr)
	redisPassword := os.Getenv("REDIS_PASSWORD")

	db, err := sql.Open("mysql", mysqlDSN)
	if err != nil {
		log.Fatalf("failed to open mysql: %v", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping mysql: %v", err)
	}
	if err := migrate(db); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPassword,
		DB:       0,
	})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("failed to ping redis: %v", err)
	}

	server := &Server{
		db:         db,
		redis:      rdb,
		security:   securityService,
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/auth/register", server.handleRegister)
	mux.HandleFunc("/api/v1/auth/login", server.handleLogin)
	mux.HandleFunc("/api/v1/auth/verify-enterprise-email", server.handleVerifyEnterpriseEmail)
	mux.HandleFunc("/api/v1/auth/logout", server.handleLogout)
	mux.HandleFunc("/api/v1/me", server.handleMe)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	handler := withCORS(mux)

	log.Printf("HerbTable API server listening on %s", listenAddr)
	if err := http.ListenAndServe(listenAddr, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func migrate(db *sql.DB) error {
	schema := `
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_encrypted TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'creator',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    avatar_url VARCHAR(512) NOT NULL DEFAULT '/Image.png',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`
	_, err := db.Exec(schema)
	return err
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	var existing string
	err := s.db.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&existing)
	if err == nil {
		respondError(w, http.StatusConflict, "email already registered")
		return
	}
	if err != sql.ErrNoRows {
		respondError(w, http.StatusInternalServerError, "database error")
		return
	}

	hashResp, err := s.callSecurity("/v1/hash", SecurityRequest{Password: req.Password})
	if err != nil || hashResp.Hash == "" {
		respondError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	encryptResp, err := s.callSecurity("/v1/encrypt", map[string]string{"plaintext": req.Email})
	if err != nil || encryptResp.Ciphertext == "" {
		respondError(w, http.StatusInternalServerError, "failed to encrypt email")
		return
	}

	userID := generateID()
	_, err = s.db.Exec(
		"INSERT INTO users (id, email, email_encrypted, full_name, password_hash, role, status, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		userID, req.Email, encryptResp.Ciphertext, req.FullName, hashResp.Hash, "creator", "active", "/Image.png",
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	token, expiresIn, err := s.createToken(userID, req.Email, "creator")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create token")
		return
	}

	respondJSON(w, http.StatusCreated, AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
		User: User{
			ID:        userID,
			Email:     req.Email,
			FullName:  req.FullName,
			Role:      "creator",
			Status:    "active",
			AvatarURL: "/Image.png",
		},
	})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	var user User
	var passwordHash string
	err := s.db.QueryRow("SELECT id, email, full_name, password_hash, role, status, avatar_url, created_at FROM users WHERE email = ?", req.Email).Scan(
		&user.ID, &user.Email, &user.FullName, &passwordHash, &user.Role, &user.Status, &user.AvatarURL, &user.CreatedAt,
	)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "database error")
		return
	}

	verifyResp, err := s.callSecurity("/v1/verify", SecurityRequest{Password: req.Password, Hash: passwordHash})
	if err != nil || !verifyResp.Valid {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, expiresIn, err := s.createToken(user.ID, user.Email, user.Role)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create token")
		return
	}

	respondJSON(w, http.StatusOK, AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
		User:        user,
	})
}

func (s *Server) handleVerifyEnterpriseEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req VerifyEnterpriseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		respondError(w, http.StatusBadRequest, "valid email is required")
		return
	}

	providers := []struct {
		name string
		url  string
	}{
		{
			name: "rapid-email-verifier",
			url:  "https://rapid-email-verifier.fly.dev/api/validate?email=" + req.Email,
		},
		{
			name: "free-email-validation-api",
			url:  "https://freeemailvalidationapi.deta.dev/validate-email?email=" + req.Email,
		},
		{
			name: "email-verify-vercel",
			url:  "https://email-verify-seven.vercel.app/verify?email=" + req.Email,
		},
	}

	var lastErr string
	for _, p := range providers {
		res, err := s.httpClient.Get(p.url)
		if err != nil {
			lastErr = err.Error()
			continue
		}
		body := res.Body
		if res.StatusCode != http.StatusOK {
			body.Close()
			lastErr = fmt.Sprintf("%s returned %d", p.name, res.StatusCode)
			continue
		}
		var result emailVerifierResult
		if err := json.NewDecoder(body).Decode(&result); err != nil {
			body.Close()
			lastErr = err.Error()
			continue
		}
		body.Close()

		isEnterprise := !result.IsFree && result.HasMX && !result.IsDisposable
		respondJSON(w, http.StatusOK, VerifyEnterpriseResponse{
			IsEnterprise: isEnterprise,
			Email:        req.Email,
			Provider:     p.name,
		})
		return
	}

	respondError(w, http.StatusServiceUnavailable, "Verification service temporarily unavailable. Please try again later. Last error: "+lastErr)
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	token := extractBearer(r)
	if token == "" {
		respondError(w, http.StatusUnauthorized, "missing token")
		return
	}
	verifyResp, err := s.callSecurity("/v1/token/verify", SecurityRequest{Token: token})
	if err != nil || !verifyResp.Valid {
		respondError(w, http.StatusUnauthorized, "invalid token")
		return
	}
	remaining := verifyResp.Claims.Exp - time.Now().Unix()
	if remaining > 0 {
		s.redis.Set(context.Background(), "blocklist:"+token, "1", time.Duration(remaining)*time.Second)
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	token := extractBearer(r)
	if token == "" {
		respondError(w, http.StatusUnauthorized, "missing token")
		return
	}
	blocked, err := s.redis.Exists(context.Background(), "blocklist:"+token).Result()
	if err == nil && blocked > 0 {
		respondError(w, http.StatusUnauthorized, "token revoked")
		return
	}
	verifyResp, err := s.callSecurity("/v1/token/verify", SecurityRequest{Token: token})
	if err != nil || !verifyResp.Valid {
		respondError(w, http.StatusUnauthorized, "invalid token")
		return
	}

	var user User
	err = s.db.QueryRow("SELECT id, email, full_name, role, status, avatar_url, created_at FROM users WHERE id = ?", verifyResp.Claims.Sub).Scan(
		&user.ID, &user.Email, &user.FullName, &user.Role, &user.Status, &user.AvatarURL, &user.CreatedAt,
	)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "database error")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (s *Server) createToken(userID, email, role string) (string, int64, error) {
	expiresIn := int64(accessTokenExpirySeconds)
	exp := time.Now().Unix() + expiresIn
	signResp, err := s.callSecurity("/v1/token/sign", SecurityRequest{
		Sub:   userID,
		Email: email,
		Role:  role,
		Exp:   exp,
	})
	if err != nil {
		return "", 0, err
	}
	return signResp.Token, expiresIn, nil
}

func (s *Server) callSecurity(endpoint string, payload interface{}) (*SecurityResponse, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	url := s.security + endpoint
	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result SecurityResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := []string{"http://herbtable.com", "https://herbtable.com", "http://localhost:5173", "http://localhost:4173"}
		for _, o := range allowed {
			if origin == o {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func extractBearer(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
