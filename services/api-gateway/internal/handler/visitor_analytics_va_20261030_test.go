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

// TEST: Replay the exact VA fields against an isolated upstream; rejected probes must never reach analytics storage.
func TestVisitorAnalyticsVARejectsInvalidMetadata(t *testing.T) {
	var calls atomic.Int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		if r.URL.Path != "/api/send" {
			t.Errorf("unexpected collector destination %q", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer upstream.Close()
	handler := NewVisitorAnalyticsHandler(upstream.URL, analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})
	cases := []struct{ field, value string }{
		{"language", "collect"}, {"language", "collect-collect"}, {"language", "../etc/passwd"},
		{"language", "%252e%252e%252fetc"}, {"language", "en--US"}, {"language", "en_US"},
		{"language", "en-" + strings.Repeat("a-", 128)},
		{"hostname", "porprov.depok.go.id AND 1=1 --"}, {"hostname", "porprov.depok.go.id OR 1=1 --"},
		{"screen", "800x600' OR '1'='1' --"}, {"screen", "800x600' AND '1'='2' --"},
	}
	var first string
	for _, test := range cases {
		t.Run(test.field+"/"+test.value, func(t *testing.T) {
			payload := map[string]string{"website": analyticsTestWebsiteID, "hostname": "porprov.depok.go.id", "url": "/", "title": "Beranda", "screen": "1440x900", "language": "id-ID"}
			payload[test.field] = test.value
			body, _ := json.Marshal(map[string]any{"type": "event", "payload": payload})
			recorder := httptest.NewRecorder()
			handler.Collect(recorder, analyticsRequest(string(body)))
			if recorder.Code != http.StatusBadRequest || recorder.Header().Get("Cache-Control") != "no-store" {
				t.Errorf("invalid metadata returned %d, expected uncached 400", recorder.Code)
			}
			if first == "" {
				first = recorder.Body.String()
			} else if recorder.Body.String() != first {
				t.Error("rejected probes must have identical deterministic responses")
			}
		})
	}
	if calls.Load() != 0 {
		t.Errorf("rejected VA probes reached upstream %d times", calls.Load())
	}
}

// TEST: Locale hardening preserves real browser languages, script/region/Unicode extensions and valid legacy/private tags.
func TestVisitorAnalyticsVALegitimateLocales(t *testing.T) {
	for _, locale := range []string{"", "id", "id-ID", "en-US", "fil-PH", "zh-Hans-CN", "es-419", "en-US-u-hc-h23", "x-private", "i-klingon", "pt-BR", "sr-Latn-RS"} {
		t.Run(locale, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				var event visitorAnalyticsEnvelope
				if json.NewDecoder(r.Body).Decode(&event) != nil || event.Payload.Language != locale {
					t.Error("valid locale was changed or lost")
				}
				_, _ = w.Write([]byte(`{"cache":"opaque-cache"}`))
			}))
			defer upstream.Close()
			handler := NewVisitorAnalyticsHandler(upstream.URL, analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})
			body := fmt.Sprintf(`{"type":"event","payload":{"website":%q,"hostname":"porprov.depok.go.id","url":"/","title":"Beranda","language":%q}}`, analyticsTestWebsiteID, locale)
			recorder := httptest.NewRecorder()
			handler.Collect(recorder, analyticsRequest(body))
			if recorder.Code != 200 || recorder.Body.String() != `{"cache":"opaque-cache"}` || recorder.Header().Get("Cache-Control") != "no-store" {
				t.Fatalf("legitimate locale failed transparent uncached collection: %d", recorder.Code)
			}
		})
	}
}

// SECURITY: Upstream validation errors must not expose reflected input, request IDs or changing internals as a scanner oracle.
func TestVisitorAnalyticsVAUpstreamClientErrorIsStable(t *testing.T) {
	var calls atomic.Int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(400)
		id := calls.Add(1)
		if id%2 == 0 {
			_, _ = w.Write([]byte("private upstream validation in a non-JSON error"))
			return
		}
		_, _ = fmt.Fprintf(w, `{"error":"private upstream validation","requestId":%d}`, id)
	}))
	defer upstream.Close()
	handler := NewVisitorAnalyticsHandler(upstream.URL, analyticsTestWebsiteID, []string{"https://porprov.depok.go.id"})
	body := fmt.Sprintf(`{"type":"event","payload":{"website":%q,"hostname":"porprov.depok.go.id","url":"/","title":"Beranda","language":"id-ID"}}`, analyticsTestWebsiteID)
	var first string
	for range 2 {
		w := httptest.NewRecorder()
		handler.Collect(w, analyticsRequest(body))
		if w.Code != 400 || w.Header().Get("Cache-Control") != "no-store" || strings.Contains(w.Body.String(), "private upstream") || strings.Contains(w.Body.String(), "requestId") {
			t.Error("upstream client error leaked internals or was cacheable")
		}
		if first != "" && first != w.Body.String() {
			t.Error("upstream validation errors were not deterministic")
		}
		first = w.Body.String()
	}
}
