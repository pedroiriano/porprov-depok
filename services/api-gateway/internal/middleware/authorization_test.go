package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestPermissionAuthorizerMatrix(t *testing.T) {
	tests := []struct {
		name, actor     string
		active, allowed bool
		want            int
	}{
		{name: "active and permitted", actor: "permitted", active: true, allowed: true, want: http.StatusNoContent},
		{name: "active but denied", actor: "denied", active: true, allowed: false, want: http.StatusForbidden},
		{name: "inactive account", actor: "inactive", active: false, allowed: true, want: http.StatusForbidden},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if got := r.Header.Get("X-Actor-ID"); got != test.actor {
					t.Fatalf("actor header = %q, want %q", got, test.actor)
				}
				_ = json.NewEncoder(w).Encode(map[string]bool{"active": test.active, "allowed": test.allowed})
			}))
			defer upstream.Close()
			authorizer := NewPermissionAuthorizer(upstream.URL)
			handler := authorizer.RequirePermission("user.update")(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
			request := httptest.NewRequest(http.MethodPut, "/users/id", nil)
			request = request.WithContext(context.WithValue(request.Context(), UserContextKey, jwt.MapClaims{"sub": test.actor}))
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != test.want {
				t.Fatalf("status = %d, want %d", response.Code, test.want)
			}
		})
	}
}
