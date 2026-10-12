package main

import (
	"context"
	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestNormalizeEmailPreservesPlusAndRejectsDisplayName(t *testing.T) {
	email, e := normalizeEmail("Person+tag@example.com")
	if e != nil || email != "person+tag@example.com" {
		t.Fatal(email, e)
	}
	for _, v := range []string{"Person <person@example.com>", "bad", "x@y\nother"} {
		if _, e := normalizeEmail(v); e == nil {
			t.Fatal(v)
		}
	}
}
func TestCaptchaIsRequiredAndInternalCallAuthenticated(t *testing.T) {
	count := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count++
		if r.Header.Get("X-Internal-Key") != "service-key" || r.URL.Path != "/internal/consume" {
			t.Fatal("wrong internal request")
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"valid":true}`))
	}))
	defer server.Close()
	s := Server{captchaURL: server.URL, captchaKey: "service-key", httpClient: server.Client()}
	r := httptest.NewRequest("POST", "/", nil)
	if s.consumeCaptcha(r, "proof") {
		t.Fatal("missing session accepted")
	}
	r.AddCookie(&http.Cookie{Name: "herb_captcha_session", Value: "session"})
	if !s.consumeCaptcha(r, "proof") || count != 1 {
		t.Fatal("valid proof not consumed")
	}
	if s.consumeCaptcha(r, "") {
		t.Fatal("empty proof accepted")
	}
}
func TestRegisterAndLoginRejectMissingCaptcha(t *testing.T) {
	s := Server{}
	for _, handler := range []http.HandlerFunc{s.handleRegister, s.handleLogin} {
		r := httptest.NewRequest("POST", "/", strings.NewReader(`{"email":"a+b@example.com","password":"!valid-pass"}`))
		w := httptest.NewRecorder()
		handler(w, r)
		if w.Code != 403 {
			t.Fatalf("missing captcha accepted: %d", w.Code)
		}
	}
}
func TestRevocationFailureAndNilClaimsFailClosed(t *testing.T) {
	m := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: m.Addr(), MaxRetries: -1})
	defer client.Close()
	security := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"valid":true,"claims":null}`))
	}))
	defer security.Close()
	s := Server{redis: client, security: security.URL, httpClient: security.Client()}
	r := httptest.NewRequest("GET", "/api/v1/me", nil)
	r.Header.Set("Authorization", "Bearer token")
	w := httptest.NewRecorder()
	s.handleMe(w, r)
	if w.Code != 401 {
		t.Fatal("nil claims", w.Code)
	}
	m.Close()
	w = httptest.NewRecorder()
	s.handleMe(w, r)
	if w.Code != 503 {
		t.Fatal("Redis failure", w.Code)
	}
}
func TestRequestLimits(t *testing.T) {
	handler := withLimits(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		deadline, ok := r.Context().Deadline()
		if !ok || time.Until(deadline) > 16*time.Second {
			t.Fatal("no deadline")
		}
		var body [70000]byte
		_, err := r.Body.Read(body[:])
		if err == nil {
			_, err = r.Body.Read(body[:])
		}
		if err == nil {
			t.Fatal("unbounded body")
		}
		w.WriteHeader(400)
	}))
	r := httptest.NewRequest("POST", "/", strings.NewReader(strings.Repeat("x", 70000))).WithContext(context.Background())
	handler.ServeHTTP(httptest.NewRecorder(), r)
}

func TestEmailLookupIsKeyedAndNeverPlaintext(t *testing.T) {
	s := Server{emailLookupKey: "test-secret-one"}
	a := s.emailLookup("private@example.com")
	if strings.Contains(a, "private") || len(a) != 74 {
		t.Fatal(a)
	}
	if a != s.emailLookup("private@example.com") {
		t.Fatal("not stable")
	}
	s.emailLookupKey = "test-secret-two"
	if a == s.emailLookup("private@example.com") {
		t.Fatal("not keyed")
	}
}
