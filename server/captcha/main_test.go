package main

import (
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func setupProof() tokenClaims {
	secretKey = strings.Repeat("test-key-", 8)
	serviceKey = strings.Repeat("service-", 8)
	c := tokenClaims{ID: "unique-challenge", Exp: time.Now().Add(time.Minute).Unix(), Purpose: "auth", Session: strings.Repeat("a", 64)}
	mu.Lock()
	proofs = map[string]tokenClaims{c.ID: c}
	rates = map[string]rateEntry{}
	mu.Unlock()
	return c
}
func TestProofSignatureAndOneTimeSessionBinding(t *testing.T) {
	c := setupProof()
	token := signClaims(c)
	if _, ok := parseToken(token); !ok {
		t.Fatal("server-generated token does not verify")
	}
	if consumeToken(token, "auth", "other-session") || consumeToken(token, "billing", c.Session) {
		t.Fatal("wrong context accepted")
	}
	if !consumeToken(token, "auth", c.Session) || consumeToken(token, "auth", c.Session) {
		t.Fatal("not single use")
	}
	if _, ok := parseToken(token + "00"); ok {
		t.Fatal("tamper accepted")
	}
}
func TestConcurrentProofConsumptionExactlyOnce(t *testing.T) {
	c := setupProof()
	token := signClaims(c)
	var successes atomic.Int32
	var group sync.WaitGroup
	for i := 0; i < 32; i++ {
		group.Add(1)
		go func() {
			defer group.Done()
			if consumeToken(token, "auth", c.Session) {
				successes.Add(1)
			}
		}()
	}
	group.Wait()
	if successes.Load() != 1 {
		t.Fatalf("accepted %d times", successes.Load())
	}
}
func TestExpiryAndInternalAuthentication(t *testing.T) {
	c := setupProof()
	c.Exp = time.Now().Add(-time.Second).Unix()
	if _, ok := parseToken(signClaims(c)); ok {
		t.Fatal("expired")
	}
	r := httptest.NewRequest("POST", "/internal/consume", strings.NewReader(`{}`))
	w := httptest.NewRecorder()
	handleConsume(w, r)
	if w.Code != 403 {
		t.Fatal(w.Code)
	}
}
func TestIPRateBudgetAndOversize(t *testing.T) {
	setupProof()
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
