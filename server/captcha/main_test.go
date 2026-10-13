package main

import (
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func setupCaptcha() tokenClaims {
	secretKey = strings.Repeat("test-key-", 8)
	c := tokenClaims{ID: "unique-challenge", Exp: time.Now().Add(time.Minute).Unix(), Purpose: "captcha", Session: strings.Repeat("a", 64)}
	mu.Lock()
	challenges = map[string]challenge{}
	rates = map[string]rateEntry{}
	mu.Unlock()
	return c
}
func TestCaptchaTokenSignatureAndSession(t *testing.T) {
	c := setupCaptcha()
	token := signClaims(c)
	parsed, ok := parseToken(token)
	if !ok || parsed != c {
		t.Fatal("server-generated token does not verify")
	}
	if _, ok := parseToken(token + "00"); ok {
		t.Fatal("tamper accepted")
	}
}
func TestCaptchaTokenExpiry(t *testing.T) {
	c := setupCaptcha()
	c.Exp = time.Now().Add(-time.Second).Unix()
	if _, ok := parseToken(signClaims(c)); ok {
		t.Fatal("expired")
	}
}
func TestIPRateBudgetAndOversize(t *testing.T) {
	setupCaptcha()
	r := httptest.NewRequest("POST", "/api/captcha/verify", strings.NewReader(strings.Repeat("x", 70000)))
	r.RemoteAddr = "127.0.0.1:1234"
	w := httptest.NewRecorder()
	handleCaptchaVerify(w, r)
	if w.Code != 400 {
		t.Fatal(w.Code)
	}
	for i := 0; i < 59; i++ {
		if !limiter(r) {
			t.Fatal("early rate reject")
		}
	}
	if limiter(r) {
		t.Fatal("rate budget exceeded")
	}
}
