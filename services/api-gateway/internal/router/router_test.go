package router

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

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
