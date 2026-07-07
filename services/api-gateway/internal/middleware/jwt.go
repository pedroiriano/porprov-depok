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
	// UserContextKey adalah kunci context untuk menyimpan klaim JWT
	UserContextKey contextKey = "user_claims"
)

// JWTMiddleware struktur untuk middleware JWT
type JWTMiddleware struct {
	jwks *keyfunc.JWKS
}

// NewJWTMiddleware membuat instance baru dengan JWKS Keycloak
func NewJWTMiddleware(jwksURL string) (*JWTMiddleware, error) {
	// Memuat JWKS dari Keycloak dan merefresh secara berkala
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

// RequireAuth adalah middleware untuk memastikan request memiliki JWT yang valid
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

		// Parse dan validasi token menggunakan JWKS
		token, err := jwt.Parse(tokenString, m.jwks.Keyfunc)
		if err != nil || !token.Valid {
			// SECURITY: Pastikan kita tidak membocorkan detail internal error token kepada klien
			response.Error(w, r, http.StatusUnauthorized, "Invalid or expired token", nil)
			return
		}

		// Ekstrak klaim (claims)
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Error(w, r, http.StatusUnauthorized, "Invalid token claims", nil)
			return
		}

		// Masukkan klaim ke dalam request context
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
