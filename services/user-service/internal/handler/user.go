package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Nerzal/gocloak/v13"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/db"
)

type UserHandler struct {
	queries *db.Queries
	cfg     *config.AppConfig
	kc      *gocloak.GoCloak
}

func NewUserHandler(q *db.Queries, cfg *config.AppConfig) *UserHandler {
	kc := gocloak.NewClient(cfg.KeycloakServerURL)
	return &UserHandler{
		queries: q,
		cfg:     cfg,
		kc:      kc,
	}
}

// publishAudit is a helper to publish audit logs
func publishAudit(action, entityID string, payload interface{}, username string) {
	event := map[string]interface{}{
		"service_name": "user-service",
		"entity_name":  "User",
		"entity_id":    entityID,
		"action":       action,
		"payload":      payload,
		"username":     username,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.user."+action, data)
}

// getAdminToken retrieves the service account token for Keycloak Admin API
func (h *UserHandler) getAdminToken(ctx context.Context) (*gocloak.JWT, error) {
	return h.kc.LoginClient(
		ctx,
		h.cfg.KeycloakClientID,
		h.cfg.KeycloakClientSecret,
		h.cfg.KeycloakRealm,
	)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Authenticate with Keycloak Admin API
	token, err := h.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Failed to authenticate with Identity Provider", http.StatusInternalServerError)
		return
	}

	// 2. Create User in Keycloak
	enabled := true
	emailVerified := true
	kcUser := gocloak.User{
		Username:      gocloak.StringP(req.Username),
		Email:         gocloak.StringP(req.Email),
		FirstName:     gocloak.StringP(req.FullName), // Mapping full name primarily to first name for simplicity
		Enabled:       &enabled,
		EmailVerified: &emailVerified,
		Credentials: &[]gocloak.CredentialRepresentation{
			{
				Type:      gocloak.StringP("password"),
				Value:     gocloak.StringP(req.Password),
				Temporary: gocloak.BoolP(false),
			},
		},
	}

	keycloakID, err := h.kc.CreateUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, kcUser)
	if err != nil {
		http.Error(w, "Failed to create user in Identity Provider: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Assign Role in Keycloak if specified
	if req.Role != "" {
		roles, err := h.kc.GetRealmRoles(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, gocloak.GetRoleParams{Search: gocloak.StringP(req.Role)})
		if err == nil && len(roles) > 0 {
			// Find exact match
			for _, rl := range roles {
				if *rl.Name == req.Role {
					h.kc.AddRealmRoleToUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, keycloakID, []gocloak.Role{*rl})
					break
				}
			}
		}
	}

	// 4. Create User in Local Database
	fullName := pgtype.Text{String: req.FullName, Valid: req.FullName != ""}
	arg := db.CreateUserParams{
		KeycloakID: keycloakID,
		Username:   req.Username,
		Email:      req.Email,
		FullName:   fullName,
		Role:       req.Role,
	}

	user, err := h.queries.CreateUser(r.Context(), arg)
	if err != nil {
		// Rollback in Keycloak (compensating transaction)
		h.kc.DeleteUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, keycloakID)
		http.Error(w, "Failed to create user in database: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Publish Audit Event
	var uuidStr string
	if user.ID.Valid {
		b, _ := user.ID.MarshalJSON()
		uuidStr = string(b)
	}
	
	actor := r.Header.Get("X-User-Username") // Dari API Gateway JWT
	if actor == "" {
		actor = "system"
	}
	
	publishAudit("CREATE", uuidStr, user, actor)

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
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if user exists in local DB to get Keycloak ID
	existingUser, err := h.queries.GetUserByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// 1. Authenticate with Keycloak
	token, err := h.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Failed to authenticate with Identity Provider", http.StatusInternalServerError)
		return
	}

	// 2. Update in Keycloak
	kcUser := gocloak.User{
		ID:        gocloak.StringP(existingUser.KeycloakID),
		Username:  gocloak.StringP(req.Username),
		Email:     gocloak.StringP(req.Email),
		FirstName: gocloak.StringP(req.FullName),
	}
	
	if req.Password != "" {
		kcUser.Credentials = &[]gocloak.CredentialRepresentation{
			{
				Type:      gocloak.StringP("password"),
				Value:     gocloak.StringP(req.Password),
				Temporary: gocloak.BoolP(false),
			},
		}
	}

	err = h.kc.UpdateUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, kcUser)
	if err != nil {
		http.Error(w, "Failed to update user in Identity Provider: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Sync Roles in Keycloak if role changed
	if req.Role != "" && req.Role != existingUser.Role {
		// We'll simplify and just add the new role. In a robust system, we should remove the old role.
		roles, err := h.kc.GetRealmRoles(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, gocloak.GetRoleParams{Search: gocloak.StringP(req.Role)})
		if err == nil && len(roles) > 0 {
			for _, rl := range roles {
				if *rl.Name == req.Role {
					h.kc.AddRealmRoleToUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, existingUser.KeycloakID, []gocloak.Role{*rl})
					break
				}
			}
		}
	}

	// 4. Update in Local Database
	arg := db.UpdateUserParams{
		ID:       uuid,
		Username: req.Username,
		Email:    req.Email,
		FullName: req.FullName,
		Role:     req.Role,
	}

	user, err := h.queries.UpdateUser(r.Context(), arg)
	if err != nil {
		http.Error(w, "Failed to update user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	actor := r.Header.Get("X-User-Username")
	if actor == "" {
		actor = "system"
	}
	publishAudit("UPDATE", id, user, actor)

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

	// Get user to find KeycloakID
	existingUser, err := h.queries.GetUserByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// 1. Soft Delete (Disable) in Keycloak
	token, err := h.getAdminToken(r.Context())
	if err == nil {
		enabled := false
		kcUser := gocloak.User{
			ID:      gocloak.StringP(existingUser.KeycloakID),
			Enabled: &enabled,
		}
		// We only disable the user in Keycloak to maintain relational integrity and audit trails
		h.kc.UpdateUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, kcUser)
	}

	// 2. Soft Delete in Local Database
	actor := r.Header.Get("X-User-Username")
	if actor == "" {
		actor = "system"
	}

	arg := db.DeleteUserParams{
		ID:           uuid,
		DeletedBy:    actor,
		DeleteReason: "Deleted by Super Admin via Admin Web",
	}

	if err := h.queries.DeleteUser(r.Context(), arg); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete user: %v", err), http.StatusInternalServerError)
		return
	}

	publishAudit("DELETE", id, map[string]string{"id": id, "reason": arg.DeleteReason}, actor)

	w.WriteHeader(http.StatusNoContent)
}

// GetRoles fetches available roles from Keycloak
func (h *UserHandler) GetRoles(w http.ResponseWriter, r *http.Request) {
	token, err := h.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Failed to authenticate with Identity Provider", http.StatusInternalServerError)
		return
	}

	roles, err := h.kc.GetRealmRoles(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, gocloak.GetRoleParams{})
	if err != nil {
		http.Error(w, "Failed to fetch roles", http.StatusInternalServerError)
		return
	}

	// Filter out default keycloak roles if necessary, or just return them all
	var roleNames []string
	for _, r := range roles {
		if r.Name != nil && *r.Name != "uma_authorization" && *r.Name != "offline_access" && *r.Name != "default-roles-porprov" {
			roleNames = append(roleNames, *r.Name)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roleNames)
}
