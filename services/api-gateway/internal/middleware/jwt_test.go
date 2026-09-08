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

func TestRoleCapabilityMatrix(t *testing.T) {
	tests := []struct {
		name       string
		role       string
		allowed    []string
		wantStatus int
	}{
		{name: "super admin manages master data", role: "super_admin", allowed: []string{"super_admin"}, wantStatus: http.StatusNoContent},
		{name: "koresponden updates scores", role: "koresponden", allowed: []string{"super_admin", "koresponden"}, wantStatus: http.StatusNoContent},
		{name: "verifikator verifies medals", role: "verifikator", allowed: []string{"super_admin", "verifikator"}, wantStatus: http.StatusNoContent},
		{name: "auditor reads audit", role: "auditor", allowed: []string{"super_admin", "auditor"}, wantStatus: http.StatusNoContent},
		{name: "auditor cannot mutate master data", role: "auditor", allowed: []string{"super_admin"}, wantStatus: http.StatusForbidden},
		{name: "verifikator cannot update scores", role: "verifikator", allowed: []string{"super_admin", "koresponden"}, wantStatus: http.StatusForbidden},
		{name: "unknown role has no privileged access", role: "tamu", allowed: []string{"super_admin", "koresponden", "verifikator", "auditor"}, wantStatus: http.StatusForbidden},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			guard := (&JWTMiddleware{}).RequireAnyRole(test.allowed...)
			handler := guard(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
			request := httptest.NewRequest(http.MethodPost, "/protected", nil)
			claims := jwt.MapClaims{"realm_access": map[string]interface{}{"roles": []interface{}{test.role}}}
			request = request.WithContext(context.WithValue(request.Context(), UserContextKey, claims))
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
		})
	}
}
