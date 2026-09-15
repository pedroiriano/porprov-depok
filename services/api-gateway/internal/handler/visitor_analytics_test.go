package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

const analyticsTestWebsiteID = "e013f972-fc45-440c-a872-575545e6e65f"

func analyticsRequest(body string) *http.Request {
	request := httptest.NewRequest(http.MethodPost, "/analytics/api/collect", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Origin", "https://porprov.depok.go.id")
	request.Header.Set("User-Agent", "PORPROV analytics test")
	request.Header.Set("X-Umami-Cache", "signed-cache-token")
	request.Header.Set("X-Forwarded-For", "203.0.113.10")
	return request
}

func TestVisitorAnalyticsForwardsKnownPayloadAndSanitizesReferrer(t *testing.T) {
	t.Parallel()
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/api/send" {
			t.Fatalf("unexpected upstream path %q", request.URL.Path)
		}
		if request.Header.Get("X-Umami-Cache") != "signed-cache-token" || request.Header.Get("X-Forwarded-For") != "203.0.113.10" {
			t.Fatal("trusted analytics forwarding headers were not preserved")
		}
		var envelope visitorAnalyticsEnvelope
		if err := json.NewDecoder(request.Body).Decode(&envelope); err != nil {
			t.Fatalf("decode forwarded payload: %v", err)
		}
		if envelope.Payload.Referrer != "https://example.go.id/source" {
			t.Fatalf("referrer query or fragment leaked: %q", envelope.Payload.Referrer)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"cache":"trusted"}`))
	}))
	defer upstream.Close()

	handler := NewVisitorAnalyticsHandler(upstream.URL, analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})
	body := fmt.Sprintf(`{"type":"event","payload":{"website":%q,"screen":"1440x900","language":"id-ID","title":"Beranda PORPROV XV Jawa Barat 2026","hostname":"porprov.depok.go.id","url":"https://porprov.depok.go.id/","referrer":"https://example.go.id/source?token=private#section","name":"pageview","data":{"section":"home"}}}`, analyticsTestWebsiteID)
	recorder := httptest.NewRecorder()
	handler.Collect(recorder, analyticsRequest(body))

	if recorder.Code != http.StatusOK || recorder.Body.String() != `{"cache":"trusted"}` {
		t.Fatalf("expected transparent 200 response, got %d: %s", recorder.Code, recorder.Body.String())
	}
}

func TestVisitorAnalyticsAllowsSupportedEventTypes(t *testing.T) {
	t.Parallel()
	var calls atomic.Int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer upstream.Close()
	handler := NewVisitorAnalyticsHandler(upstream.URL, analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})

	for _, eventType := range []string{"event", "identify", "performance"} {
		body := fmt.Sprintf(`{"type":%q,"payload":{"website":%q,"hostname":"porprov.depok.go.id","url":"/jadwal","title":"Jadwal Pertandingan","lcp":1200,"cls":0.04}}`, eventType, analyticsTestWebsiteID)
		recorder := httptest.NewRecorder()
		handler.Collect(recorder, analyticsRequest(body))
		if recorder.Code != http.StatusOK {
			t.Fatalf("supported type %s returned %d: %s", eventType, recorder.Code, recorder.Body.String())
		}
	}
	if calls.Load() != 3 {
		t.Fatalf("expected 3 upstream calls, got %d", calls.Load())
	}
}

func TestVisitorAnalyticsRejectsTraversalAndUntrustedPayloads(t *testing.T) {
	t.Parallel()
	var calls atomic.Int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer upstream.Close()
	handler := NewVisitorAnalyticsHandler(upstream.URL, analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})

	validPayload := func(title, hostname, pageURL string) string {
		return fmt.Sprintf(`{"type":"event","payload":{"website":%q,"hostname":%q,"url":%q,"title":%q}}`, analyticsTestWebsiteID, hostname, pageURL, title)
	}
	tests := []struct {
		name   string
		body   string
		origin string
	}{
		{name: "ZAP attack value", body: validPayload("/collect", "porprov.depok.go.id", "/")},
		{name: "relative traversal", body: validPayload("../etc/passwd", "porprov.depok.go.id", "/")},
		{name: "double encoded traversal", body: validPayload("%252e%252e%252fetc", "porprov.depok.go.id", "/")},
		{name: "control character", body: validPayload("judul\x00rahasia", "porprov.depok.go.id", "/")},
		{name: "wrong host", body: validPayload("Beranda", "evil.example", "/")},
		{name: "query leakage", body: validPayload("Beranda", "porprov.depok.go.id", "/?token=secret")},
		{name: "unknown payload field", body: fmt.Sprintf(`{"type":"event","payload":{"website":%q,"hostname":"porprov.depok.go.id","url":"/","title":"Beranda","filesystem":"/etc/passwd"}}`, analyticsTestWebsiteID)},
		{name: "wrong origin", body: validPayload("Beranda", "porprov.depok.go.id", "/"), origin: "https://evil.example"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := analyticsRequest(test.body)
			if test.origin != "" {
				request.Header.Set("Origin", test.origin)
			}
			recorder := httptest.NewRecorder()
			handler.Collect(recorder, request)
			if recorder.Code < http.StatusBadRequest || recorder.Code >= http.StatusInternalServerError {
				t.Fatalf("expected deterministic 4xx, got %d: %s", recorder.Code, recorder.Body.String())
			}
		})
	}
	if calls.Load() != 0 {
		t.Fatalf("rejected payload reached upstream %d times", calls.Load())
	}
}

func TestVisitorAnalyticsRejectsOversizedBody(t *testing.T) {
	t.Parallel()
	handler := NewVisitorAnalyticsHandler("http://127.0.0.1:1", analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})
	body := `{"type":"event","payload":{"website":"` + analyticsTestWebsiteID + `","hostname":"porprov.depok.go.id","url":"/","title":"` + strings.Repeat("a", visitorAnalyticsBodyLimit) + `"}}`
	recorder := httptest.NewRecorder()
	handler.Collect(recorder, analyticsRequest(body))
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for oversized body, got %d", recorder.Code)
	}
}
