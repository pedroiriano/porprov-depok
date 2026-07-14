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

// INFO: JWTMiddleware memvalidasi token menggunakan JWKS Keycloak.
type JWTMiddleware struct {
	jwks *keyfunc.JWKS
}

// INFO: NewJWTMiddleware membuat instance baru dengan JWKS Keycloak.
func NewJWTMiddleware(jwksURL string) (*JWTMiddleware, error) {
	// SECURITY: JWKS dimuat dari Keycloak dan diperbarui secara berkala.
	options := keyfunc.Options{
		RefreshInterval: time.Hour,
	}
	jwks, err := keyfunc.Get(jwksURL, options)
	if err != nil {
		return nil, err
	}

	return &JWTMiddleware{
		jwks: jwks,
	}, nil
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
		token, err := jwt.Parse(tokenString, m.jwks.Keyfunc)
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

		// INFO: Klaim tersedia bagi proxy untuk menurunkan actor audit.
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
