package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/db"
)

type UserHandler struct {
	queries *db.Queries
}

func NewUserHandler(q *db.Queries) *UserHandler {
	return &UserHandler{queries: q}
}

// publishAudit is a helper to publish audit logs
func publishAudit(action, entityID string, payload interface{}) {
	event := map[string]interface{}{
		"service_name": "user-service",
		"entity_name":  "User",
		"entity_id":    entityID,
		"action":       action,
		"payload":      payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.user."+action, data)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		KeycloakID string `json:"keycloak_id"`
		Username   string `json:"username"`
		Email      string `json:"email"`
		FullName   string `json:"full_name"`
		Role       string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	fullName := pgtype.Text{String: req.FullName, Valid: req.FullName != ""}

	arg := db.CreateUserParams{
		KeycloakID: req.KeycloakID,
		Username:   req.Username,
		Email:      req.Email,
		FullName:   fullName,
		Role:       req.Role,
	}

	user, err := h.queries.CreateUser(r.Context(), arg)
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Publish Audit Event
	var uuidStr string
	if user.ID.Valid {
		b, _ := user.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit("CREATE", uuidStr, user)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.queries.ListUsers(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	user, err := h.queries.GetUserByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	arg := db.UpdateUserParams{
		ID:       uuid,
		Column2:  req.Username,
		Column3:  req.Email,
		Column4:  req.FullName,
		Column5:  req.Role,
	}

	user, err := h.queries.UpdateUser(r.Context(), arg)
	if err != nil {
		http.Error(w, "Failed to update user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	publishAudit("UPDATE", id, user)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteUser(r.Context(), uuid); err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	publishAudit("DELETE", id, map[string]string{"id": id})

	w.WriteHeader(http.StatusNoContent)
}
