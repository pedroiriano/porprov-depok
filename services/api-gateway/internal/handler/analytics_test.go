package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAnalyticsOverviewAggregatesProtectedData(t *testing.T) {
	t.Parallel()
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/api/auth/login" {
			_ = json.NewEncoder(w).Encode(map[string]string{"token": "trusted-token"})
			return
		}
		if r.Header.Get("Authorization") != "Bearer trusted-token" {
			t.Fatalf("missing server-side bearer token")
		}
		if strings.HasSuffix(r.URL.Path, "/active") {
			_, _ = w.Write([]byte(`{"visitors":2}`))
			return
		}
		if strings.HasSuffix(r.URL.Path, "/stats") {
			_, _ = w.Write([]byte(`{"pageviews":12,"visitors":4,"visits":5,"bounces":2,"totaltime":120}`))
			return
		}
		_, _ = w.Write([]byte(`[]`))
	}))
	defer upstream.Close()

	handler := NewAnalyticsHandler(upstream.URL, "admin", "secret", "website-id")
	request := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/overview?days=30", nil)
	recorder := httptest.NewRecorder()
	handler.Overview(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"days":30`) || !strings.Contains(recorder.Body.String(), `"pageviews":12`) {
		t.Fatalf("unexpected aggregate: %s", recorder.Body.String())
	}
}

func TestAnalyticsRangeUsesAllowlist(t *testing.T) {
	t.Parallel()
	if analyticsRange("90") != 90 || analyticsRange("365") != 7 || analyticsRange("invalid") != 7 {
		t.Fatal("analytics range allowlist failed")
	}
}
