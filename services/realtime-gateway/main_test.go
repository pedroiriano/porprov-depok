//go:build !initstreams

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	for _, method := range []string{http.MethodGet, http.MethodHead} {
		t.Run(method, func(t *testing.T) {
			request := httptest.NewRequest(method, "/health", nil)
			response := httptest.NewRecorder()

			healthHandler(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d", response.Code)
			}
			if response.Header().Get("Cache-Control") != "no-store" {
				t.Fatalf("expected no-store cache policy")
			}
			if method == http.MethodGet {
				var payload map[string]string
				if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
					t.Fatalf("decode health response: %v", err)
				}
				if payload["status"] != "ok" {
					t.Fatalf("expected safe ok status, got %q", payload["status"])
				}
			}
		})
	}
}
