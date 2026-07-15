package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestRequireAnyRoleAllowsMatchingRealmRole(t *testing.T) {
	middleware := (&JWTMiddleware{}).RequireAnyRole("super_admin")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	request := httptest.NewRequest(http.MethodPost, "/secure", nil)
	claims := jwt.MapClaims{"realm_access": map[string]interface{}{"roles": []interface{}{"offline_access", "super_admin"}}}
	request = request.WithContext(context.WithValue(request.Context(), UserContextKey, claims))
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", response.Code)
	}
}

func TestRequireAnyRoleRejectsNonMatchingRealmRole(t *testing.T) {
	middleware := (&JWTMiddleware{}).RequireAnyRole("super_admin")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	request := httptest.NewRequest(http.MethodPost, "/secure", nil)
	claims := jwt.MapClaims{"realm_access": map[string]interface{}{"roles": []interface{}{"koresponden"}}}
	request = request.WithContext(context.WithValue(request.Context(), UserContextKey, claims))
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", response.Code)
	}
}

func TestAllowedClientAcceptsAuthorizedParty(t *testing.T) {
	middleware := &JWTMiddleware{allowedClients: map[string]struct{}{"porprov-admin-web": {}}}
	if !middleware.hasAllowedClient(jwt.MapClaims{"azp": "porprov-admin-web"}) {
		t.Fatal("expected configured authorized party to be accepted")
	}
}

func TestAllowedClientRejectsDifferentAuthorizedParty(t *testing.T) {
	middleware := &JWTMiddleware{allowedClients: map[string]struct{}{"porprov-admin-web": {}}}
	if middleware.hasAllowedClient(jwt.MapClaims{"azp": "different-client", "aud": []interface{}{"account"}}) {
		t.Fatal("expected unconfigured client to be rejected")
	}
}
