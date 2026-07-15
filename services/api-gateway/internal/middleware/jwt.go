package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/pkg/response"
)

type contextKey string

const (
	// INFO: UserContextKey menyimpan klaim JWT tervalidasi pada context request.
	UserContextKey contextKey = "user_claims"
)

// SECURITY: ActorIDFromContext mengembalikan subject JWT tervalidasi untuk audit downstream.
func ActorIDFromContext(ctx context.Context) string {
	claims, ok := ctx.Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		return ""
	}
	subject, _ := claims["sub"].(string)
	return strings.TrimSpace(subject)
}

// RolesFromContext membaca realm roles hanya dari JWT yang sudah tervalidasi.
func RolesFromContext(ctx context.Context) []string {
	claims, ok := ctx.Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		return nil
	}
	realmAccess, ok := claims["realm_access"].(map[string]interface{})
	if !ok {
		return nil
	}
	rawRoles, ok := realmAccess["roles"].([]interface{})
	if !ok {
		return nil
	}
	roles := make([]string, 0, len(rawRoles))
	for _, rawRole := range rawRoles {
		if role, ok := rawRole.(string); ok {
			roles = append(roles, strings.ToLower(strings.TrimSpace(role)))
		}
	}
	return roles
}

// INFO: JWTMiddleware memvalidasi token menggunakan JWKS Keycloak.
type JWTMiddleware struct {
	jwks           *keyfunc.JWKS
	issuer         string
	allowedClients map[string]struct{}
}

// INFO: NewJWTMiddleware membuat instance baru dengan JWKS Keycloak.
func NewJWTMiddleware(jwksURL, issuer string, allowedClients []string) (*JWTMiddleware, error) {
	// SECURITY: JWKS dimuat dari Keycloak dan diperbarui secara berkala.
	options := keyfunc.Options{
		RefreshInterval: time.Hour,
	}
	jwks, err := keyfunc.Get(jwksURL, options)
	if err != nil {
		return nil, err
	}

	allowed := make(map[string]struct{}, len(allowedClients))
	for _, client := range allowedClients {
		if client = strings.TrimSpace(client); client != "" {
			allowed[client] = struct{}{}
		}
	}
	return &JWTMiddleware{jwks: jwks, issuer: strings.TrimRight(strings.TrimSpace(issuer), "/"), allowedClients: allowed}, nil
}

func (m *JWTMiddleware) hasAllowedClient(claims jwt.MapClaims) bool {
	if authorizedParty, _ := claims["azp"].(string); authorizedParty != "" {
		if _, ok := m.allowedClients[authorizedParty]; ok {
			return true
		}
	}
	audiences, err := claims.GetAudience()
	if err != nil {
		return false
	}
	for _, audience := range audiences {
		if _, ok := m.allowedClients[audience]; ok {
			return true
		}
	}
	return false
}

// SECURITY: RequireAuth memastikan request memiliki JWT yang valid.
func (m *JWTMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Error(w, r, http.StatusUnauthorized, "Missing Authorization header", nil)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Error(w, r, http.StatusUnauthorized, "Invalid Authorization header format", nil)
			return
		}

		tokenString := parts[1]

		// SECURITY: Parse dan validasi token menggunakan JWKS.
		token, err := jwt.Parse(tokenString, m.jwks.Keyfunc,
			jwt.WithIssuer(m.issuer),
			jwt.WithExpirationRequired(),
			jwt.WithLeeway(30*time.Second),
		)
		if err != nil || !token.Valid {
			// SECURITY: Pastikan kita tidak membocorkan detail internal error token kepada klien
			response.Error(w, r, http.StatusUnauthorized, "Invalid or expired token", nil)
			return
		}

		// SECURITY: Ekstrak klaim hanya dari token yang telah tervalidasi.
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Error(w, r, http.StatusUnauthorized, "Invalid token claims", nil)
			return
		}
		if subject, _ := claims["sub"].(string); strings.TrimSpace(subject) == "" || !m.hasAllowedClient(claims) {
			response.Error(w, r, http.StatusUnauthorized, "Token subject or client is not allowed", nil)
			return
		}

		// INFO: Klaim tersedia bagi proxy untuk menurunkan actor audit.
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAnyRole membatasi operasi sensitif pada sedikitnya satu realm role.
func (m *JWTMiddleware) RequireAnyRole(allowed ...string) func(http.Handler) http.Handler {
	allowedSet := make(map[string]struct{}, len(allowed))
	for _, role := range allowed {
		allowedSet[strings.ToLower(strings.TrimSpace(role))] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			for _, role := range RolesFromContext(r.Context()) {
				if _, ok := allowedSet[role]; ok {
					next.ServeHTTP(w, r)
					return
				}
			}
			response.Error(w, r, http.StatusForbidden, "Insufficient role", nil)
		})
	}
}
