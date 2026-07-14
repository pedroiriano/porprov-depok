package router

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
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
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedActor = r.Header.Get("X-Actor-ID")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()

	request := httptest.NewRequest(http.MethodDelete, "/resource-id", nil)
	request.Header.Set("X-Actor-ID", "spoofed-client")
	ctx := context.WithValue(request.Context(), customMiddleware.UserContextKey, jwt.MapClaims{"sub": "keycloak-user-id"})
	request = request.WithContext(ctx)
	response := httptest.NewRecorder()
	setupProxy(upstream.URL).ServeHTTP(response, request)

	if receivedActor != "keycloak-user-id" {
		t.Fatalf("expected trusted actor, got %q", receivedActor)
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
