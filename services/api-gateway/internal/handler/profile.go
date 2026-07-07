package handler

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/pkg/response"
)

// ProfileHandler mengembalikan profil user yang sedang login berdasarkan JWT
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Mengambil klaim user dari context
	claims, ok := r.Context().Value(middleware.UserContextKey).(jwt.MapClaims)
	if !ok {
		response.Error(w, r, http.StatusUnauthorized, "User claims not found in context", nil)
		return
	}

	// INFO: Mendapatkan data penting dari JWT Keycloak
	data := map[string]interface{}{
		"user_id":  claims["sub"],
		"username": claims["preferred_username"],
		"email":    claims["email"],
		"roles":    claims["realm_access"],
	}

	response.JSON(w, r, http.StatusOK, "User profile retrieved successfully", data)
}
