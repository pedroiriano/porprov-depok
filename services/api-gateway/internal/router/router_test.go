package router

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
)

func TestSetupProxyPreservesTargetBasePath(t *testing.T) {
	t.Parallel()

	var receivedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, `{"ok":true}`)
	}))
	defer upstream.Close()

	request := httptest.NewRequest(http.MethodGet, "/cabors", nil)
	response := httptest.NewRecorder()
	setupProxy(upstream.URL+"/api/v1").ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
	if receivedPath != "/api/v1/cabors" {
		t.Fatalf("expected upstream path /api/v1/cabors, got %q", receivedPath)
	}
}

func TestSetupProxyForwardsTrustedActorAndRejectsSpoofedActor(t *testing.T) {
	t.Parallel()

	var receivedActor string
	var receivedIP string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedActor = r.Header.Get("X-Actor-ID")
		receivedIP = r.Header.Get("X-Actor-IP")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()

	request := httptest.NewRequest(http.MethodDelete, "/resource-id", nil)
	request.Header.Set("X-Actor-ID", "spoofed-client")
	request.Header.Set("X-Actor-IP", "203.0.113.250")
	ctx := context.WithValue(request.Context(), customMiddleware.UserContextKey, jwt.MapClaims{"sub": "keycloak-user-id"})
	request = request.WithContext(ctx)
	response := httptest.NewRecorder()
	setupProxy(upstream.URL).ServeHTTP(response, request)

	if receivedActor != "keycloak-user-id" {
		t.Fatalf("expected trusted actor, got %q", receivedActor)
	}
	if receivedIP == "203.0.113.250" || receivedIP == "" {
		t.Fatalf("expected socket-derived actor IP, got %q", receivedIP)
	}
}

func TestSetupProxyInjectsTrustedInternalStreamToken(t *testing.T) {
	t.Parallel()
	var receivedToken string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedToken = r.Header.Get("X-Internal-Stream-Token")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()
	request := httptest.NewRequest(http.MethodGet, "/admin/events", nil)
	request.Header.Set("X-Internal-Stream-Token", "spoofed")
	response := httptest.NewRecorder()
	setupProxyWithHeaders(upstream.URL, map[string]string{"X-Internal-Stream-Token": "trusted"}).ServeHTTP(response, request)
	if receivedToken != "trusted" {
		t.Fatalf("expected trusted stream token, got %q", receivedToken)
	}
}

func TestSetupProxyKeepsSingleGatewayCORSOrigin(t *testing.T) {
	t.Parallel()

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TEST: Simulasikan service internal yang masih memasang middleware CORS sendiri.
		w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, `{"ok":true}`)
	}))
	defer upstream.Close()

	gatewayCORS := cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{http.MethodGet},
		AllowedHeaders:   []string{"Authorization"},
		AllowCredentials: true,
	})
	handler := gatewayCORS(http.HandlerFunc(setupProxy(upstream.URL)))

	request := httptest.NewRequest(http.MethodGet, "/media", nil)
	request.Header.Set("Origin", "http://localhost:5174")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	origins := response.Header().Values("Access-Control-Allow-Origin")
	if len(origins) != 1 {
		t.Fatalf("expected exactly one Access-Control-Allow-Origin value, got %v", origins)
	}
	if origins[0] != "http://localhost:5174" {
		t.Fatalf("expected gateway origin http://localhost:5174, got %q", origins[0])
	}
}

func TestSetupProxyScrubsInternalServerError(t *testing.T) {
	t.Parallel()

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = io.WriteString(w, "postgres password and internal query must not escape")
	}))
	defer upstream.Close()

	request := httptest.NewRequest(http.MethodGet, "/venues", nil)
	response := httptest.NewRecorder()
	setupProxy(upstream.URL).ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", response.Code)
	}
	if response.Body.String() != upstreamErrorBody {
		t.Fatalf("expected stable upstream error body, got %q", response.Body.String())
	}
	if response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("expected no-store error response")
	}
}

func TestGatewayAddsSecurityHeaders(t *testing.T) {
	t.Parallel()

	cfg := &config.AppConfig{AllowedOrigins: []string{"http://localhost:3000"}}
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()
	SetupRouter(nil, cfg).ServeHTTP(response, request)

	for _, header := range []string{"Cache-Control", "Content-Security-Policy", "Permissions-Policy", "Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options"} {
		if response.Header().Get(header) == "" {
			t.Fatalf("expected security header %s", header)
		}
	}

	policy := response.Header().Get("Content-Security-Policy")
	for _, directive := range []string{"default-src", "base-uri", "object-src", "frame-ancestors", "form-action"} {
		if !strings.Contains(policy, directive+" ") {
			t.Fatalf("expected explicit CSP directive %s in %q", directive, policy)
		}
	}
}

func TestPublicScheduleReadDoesNotRequireJWT(t *testing.T) {
	t.Parallel()

	var receivedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `[]`)
	}))
	defer upstream.Close()

	cfg := &config.AppConfig{
		MasterDataURL: upstream.URL,
		ScheduleURL:   upstream.URL + "/api/v1",
		VenueURL:      upstream.URL,
		AuditURL:      upstream.URL,
		LivescoreURL:  upstream.URL,
		MedalsURL:     upstream.URL,
		RealtimeURL:   upstream.URL,
	}

	request := httptest.NewRequest(http.MethodGet, "/api/v1/schedule/matches", nil)
	response := httptest.NewRecorder()
	SetupRouter(nil, cfg).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected public schedule status 200, got %d", response.Code)
	}
	if receivedPath != "/api/v1/matches" {
		t.Fatalf("expected upstream path /api/v1/matches, got %q", receivedPath)
	}
}

func TestPublicActiveHeroReadDoesNotRequireJWT(t *testing.T) {
	t.Parallel()
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/heroes/active" {
			t.Fatalf("unexpected upstream path %q", r.URL.Path)
		}
		_, _ = io.WriteString(w, `{"title":"Hero aktif"}`)
	}))
	defer upstream.Close()

	cfg := &config.AppConfig{
		MasterDataURL: upstream.URL,
		ScheduleURL:   upstream.URL,
		VenueURL:      upstream.URL,
		AuditURL:      upstream.URL,
		LivescoreURL:  upstream.URL,
		MedalsURL:     upstream.URL,
		RealtimeURL:   upstream.URL,
	}
	request := httptest.NewRequest(http.MethodGet, "/api/v1/master-data/heroes/active", nil)
	response := httptest.NewRecorder()
	SetupRouter(nil, cfg).ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected public active Hero status 200, got %d", response.Code)
	}
}

func TestPublicLivescoreProjectionDoesNotRequireJWT(t *testing.T) {
	t.Parallel()
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/livescore/public" {
			t.Fatalf("unexpected upstream path %q", r.URL.Path)
		}
		_, _ = io.WriteString(w, `[]`)
	}))
	defer upstream.Close()
	cfg := &config.AppConfig{MasterDataURL: upstream.URL, ScheduleURL: upstream.URL, VenueURL: upstream.URL, AuditURL: upstream.URL, LivescoreURL: upstream.URL + "/api/v1/livescore", MedalsURL: upstream.URL, RealtimeURL: upstream.URL, InternalStreamToken: "test"}
	request := httptest.NewRequest(http.MethodGet, "/api/v1/livescore/public", nil)
	response := httptest.NewRecorder()
	SetupRouter(nil, cfg).ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected public livescore status 200, got %d", response.Code)
	}
}
