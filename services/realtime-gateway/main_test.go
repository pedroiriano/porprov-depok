package main

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
)

func TestSanitizePublicEventRemovesOperatorMetadata(t *testing.T) {
	raw := []byte(`{"eventType":"LIVESCORE_CORRECTED","matchId":"m1","scoreA":2,"scoreB":1,"actor":"user-1","requestId":"req-1","correctionReason":"official review"}`)
	sanitized, allowed := sanitizePublicEvent(raw)
	if !allowed {
		t.Fatal("expected event to be public")
	}
	var event map[string]interface{}
	if err := json.Unmarshal(sanitized, &event); err != nil {
		t.Fatal(err)
	}
	for _, forbidden := range []string{"actor", "requestId", "correctionReason", "correctionOf"} {
		if _, exists := event[forbidden]; exists {
			t.Fatalf("public event leaked %s", forbidden)
		}
	}
}

func TestRequestIPUsesOnlyGatewayStampedAddress(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/v1/stream/events", nil)
	request.RemoteAddr = "172.18.0.10:12345"
	request.Header.Set("X-Proxy", "API-Gateway")
	request.Header.Set("X-Actor-IP", "203.0.113.9")
	if got := requestIP(request); got != "203.0.113.9" {
		t.Fatalf("expected trusted gateway address, got %q", got)
	}
}

func TestRequestIPIgnoresUnstampedSpoofedAddress(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/v1/stream/events", nil)
	request.RemoteAddr = "172.18.0.10:12345"
	request.Header.Set("X-Actor-IP", "203.0.113.9")
	if got := requestIP(request); got != "172.18.0.10" {
		t.Fatalf("expected socket address, got %q", got)
	}
}

func TestProductionRejectsDevelopmentStreamToken(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("INTERNAL_STREAM_TOKEN", "local-development-stream-token")
	if _, err := streamTokenFromEnvironment(); err == nil {
		t.Fatal("expected weak production token to be rejected")
	}
}

func TestSanitizePublicEventRejectsPrivateDomainEvent(t *testing.T) {
	if _, allowed := sanitizePublicEvent([]byte(`{"eventType":"MEDAL_SUBMISSION_VERIFIED"}`)); allowed {
		t.Fatal("workflow event must not reach public stream")
	}
}
