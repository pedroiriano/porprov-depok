package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/Nerzal/gocloak/v13"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/db"
)

type UserHandler struct {
	queries db.Querier
	cfg     *config.AppConfig
	kc      identityProvider
}

type identityProvider interface {
	LoginClient(context.Context, string, string, string, ...string) (*gocloak.JWT, error)
	GetRealmRoles(context.Context, string, string, gocloak.GetRoleParams) ([]*gocloak.Role, error)
	CreateUser(context.Context, string, string, gocloak.User) (string, error)
	GetUserByID(context.Context, string, string, string) (*gocloak.User, error)
	DeleteUser(context.Context, string, string, string) error
	UpdateUser(context.Context, string, string, gocloak.User) error
	SetPassword(context.Context, string, string, string, string, bool) error
	AddRealmRoleToUser(context.Context, string, string, string, []gocloak.Role) error
	DeleteRealmRoleFromUser(context.Context, string, string, string, []gocloak.Role) error
}

type userAuditEvent struct {
	EventVersion string      `json:"eventVersion"`
	EventType    string      `json:"eventType"`
	ServiceName  string      `json:"service_name"`
	EntityName   string      `json:"entity_name"`
	EntityID     string      `json:"entity_id"`
	Action       string      `json:"action"`
	Actor        string      `json:"actor"`
	RequestID    string      `json:"requestId"`
	IPAddress    string      `json:"ipAddress"`
	Payload      interface{} `json:"payload"`
}

type userUpdateMutationState struct {
	identityUpdated bool
	newRoleAdded    bool
	oldRoleRemoved  bool
	databaseUpdated bool
}

var errRealmRoleNotFound = errors.New("realm role not found")

func NewUserHandler(q *db.Queries, cfg *config.AppConfig) *UserHandler {
	kc := gocloak.NewClient(cfg.KeycloakServerURL)
	return &UserHandler{
		queries: q,
		cfg:     cfg,
		kc:      kc,
	}
}

func buildUserAuditEvent(r *http.Request, action, entityID string, payload interface{}) userAuditEvent {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		actor = "system"
	}
	return userAuditEvent{
		EventVersion: "1.0",
		EventType:    "audit.user." + action,
		ServiceName:  "user-service",
		EntityName:   "User",
		EntityID:     entityID,
		Action:       action,
		Actor:        actor,
		RequestID:    strings.TrimSpace(r.Header.Get("X-Request-ID")),
		IPAddress:    strings.TrimSpace(r.Header.Get("X-Actor-IP")),
		Payload:      payload,
	}
}

// SECURITY: Publish only canonical, gateway-validated audit identity and tracing fields.
func publishAudit(r *http.Request, action, entityID string, payload interface{}) {
	event := buildUserAuditEvent(r, action, entityID, payload)
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.user."+action, data)
}

func actorIDFromRequest(r *http.Request) string {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		return "system"
	}
	return actor
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

func (h *UserHandler) getExactRealmRole(ctx context.Context, accessToken, roleName string) (*gocloak.Role, error) {
	roles, err := h.kc.GetRealmRoles(ctx, accessToken, h.cfg.KeycloakRealm, gocloak.GetRoleParams{Search: gocloak.StringP(roleName)})
	if err != nil {
		return nil, err
	}
	for _, role := range roles {
		if role != nil && role.Name != nil && *role.Name == roleName {
			return role, nil
		}
	}
	return nil, errRealmRoleNotFound
}

// SECURITY: Compensate all reversible Keycloak and database mutations when a later update step fails.
func (h *UserHandler) rollbackUserUpdate(
	ctx context.Context,
	accessToken string,
	id pgtype.UUID,
	existing db.User,
	newRole *gocloak.Role,
	oldRole *gocloak.Role,
	state userUpdateMutationState,
) {
	if state.databaseUpdated {
		if _, err := h.queries.UpdateUser(ctx, db.UpdateUserParams{
			ID:       id,
			Username: existing.Username,
			Email:    existing.Email,
			FullName: existing.FullName.String,
			Role:     existing.Role,
		}); err != nil {
			log.Printf("Failed to rollback database user %s: %v", existing.KeycloakID, err)
		}
	}
	if state.oldRoleRemoved && oldRole != nil {
		if err := h.kc.AddRealmRoleToUser(ctx, accessToken, h.cfg.KeycloakRealm, existing.KeycloakID, []gocloak.Role{*oldRole}); err != nil {
			log.Printf("Failed to restore prior role for Keycloak user %s: %v", existing.KeycloakID, err)
		}
	}
	if state.newRoleAdded && newRole != nil {
		if err := h.kc.DeleteRealmRoleFromUser(ctx, accessToken, h.cfg.KeycloakRealm, existing.KeycloakID, []gocloak.Role{*newRole}); err != nil {
			log.Printf("Failed to remove compensating role for Keycloak user %s: %v", existing.KeycloakID, err)
		}
	}
	if state.identityUpdated {
		if err := h.kc.UpdateUser(ctx, accessToken, h.cfg.KeycloakRealm, gocloak.User{
			ID:        gocloak.StringP(existing.KeycloakID),
			Username:  gocloak.StringP(existing.Username),
			Email:     gocloak.StringP(existing.Email),
			FirstName: gocloak.StringP(existing.FullName.String),
		}); err != nil {
			log.Printf("Failed to restore identity for Keycloak user %s: %v", existing.KeycloakID, err)
		}
	}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req userMutationRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if validationError := validateUserMutation(&req, true); validationError != "" {
		http.Error(w, validationError, http.StatusUnprocessableEntity)
		return
	}

	// 1. Authenticate with Keycloak Admin API
	token, err := h.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Failed to authenticate with Identity Provider", http.StatusInternalServerError)
		return
	}
	role, err := h.getExactRealmRole(r.Context(), token.AccessToken, req.Role)
	if errors.Is(err, errRealmRoleNotFound) {
		http.Error(w, "Invalid role", http.StatusUnprocessableEntity)
		return
	}
	if err != nil {
		log.Printf("Failed to validate realm role %s: %v", req.Role, err)
		http.Error(w, "Failed to validate role in Identity Provider", http.StatusBadGateway)
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
		log.Printf("Failed to create user in Identity Provider: %v", err)
		http.Error(w, "Failed to create user in Identity Provider", http.StatusBadGateway)
		return
	}

	// 3. Assign the validated role. A failure must not leave an unmanaged account.
	if err := h.kc.AddRealmRoleToUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, keycloakID, []gocloak.Role{*role}); err != nil {
		if rollbackErr := h.kc.DeleteUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, keycloakID); rollbackErr != nil {
			log.Printf("Failed to rollback Keycloak user %s after role assignment failure: %v", keycloakID, rollbackErr)
		}
		log.Printf("Failed to assign role %s to Keycloak user %s: %v", req.Role, keycloakID, err)
		http.Error(w, "Failed to assign role in Identity Provider", http.StatusBadGateway)
		return
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
		if rollbackErr := h.kc.DeleteUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, keycloakID); rollbackErr != nil {
			log.Printf("Failed to rollback Keycloak user %s: %v", keycloakID, rollbackErr)
		}
		log.Printf("Failed to create user in database: %v", err)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Publish Audit Event
	var uuidStr string
	if user.ID.Valid {
		b, _ := user.ID.MarshalJSON()
		uuidStr = strings.Trim(string(b), `"`)
	}
	publishAudit(r, "CREATE", uuidStr, user)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	params, validationError := parseUserListParams(r.URL.Query())
	if validationError != "" {
		http.Error(w, validationError, http.StatusUnprocessableEntity)
		return
	}

	// INFO: Preserve the legacy array response for callers that have not opted into pagination.
	if params.LegacyMode {
		users, err := h.queries.ListUsers(r.Context())
		if err != nil {
			log.Printf("Failed to fetch users: %v", err)
			http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
		return
	}

	total, err := h.queries.CountUsersPage(r.Context(), params.Search)
	if err != nil {
		log.Printf("Failed to count users: %v", err)
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	totalPages := totalUserPages(total, params.Limit)
	if params.Page > totalPages {
		params.Page = totalPages
	}

	users, err := h.queries.ListUsersPage(r.Context(), db.ListUsersPageParams{
		Search:     params.Search,
		SortBy:     params.SortBy,
		SortOrder:  params.SortOrder,
		PageOffset: (params.Page - 1) * params.Limit,
		PageLimit:  params.Limit,
	})
	if err != nil {
		log.Printf("Failed to fetch user page: %v", err)
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	if users == nil {
		users = []db.User{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": users,
		"pagination": map[string]interface{}{
			"page":        params.Page,
			"limit":       params.Limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
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

	var req userMutationRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if validationError := validateUserMutation(&req, false); validationError != "" {
		http.Error(w, validationError, http.StatusUnprocessableEntity)
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
	var newRole *gocloak.Role
	var oldRole *gocloak.Role
	if req.Role != existingUser.Role {
		newRole, err = h.getExactRealmRole(r.Context(), token.AccessToken, req.Role)
		if errors.Is(err, errRealmRoleNotFound) {
			http.Error(w, "Invalid role", http.StatusUnprocessableEntity)
			return
		}
		if err != nil {
			log.Printf("Failed to validate realm role %s for user %s: %v", req.Role, id, err)
			http.Error(w, "Failed to validate role in Identity Provider", http.StatusBadGateway)
			return
		}
		if existingUser.Role != "" {
			oldRole, err = h.getExactRealmRole(r.Context(), token.AccessToken, existingUser.Role)
			if err != nil && !errors.Is(err, errRealmRoleNotFound) {
				log.Printf("Failed to resolve prior role %s for user %s: %v", existingUser.Role, id, err)
				http.Error(w, "Failed to validate prior role in Identity Provider", http.StatusBadGateway)
				return
			}
		}
	}

	// 2. Update reversible identity fields in Keycloak.
	var kcUser = gocloak.User{
		ID:        gocloak.StringP(existingUser.KeycloakID),
		Username:  gocloak.StringP(req.Username),
		Email:     gocloak.StringP(req.Email),
		FirstName: gocloak.StringP(req.FullName),
	}

	err = h.kc.UpdateUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, kcUser)
	if err != nil {
		log.Printf("Failed to update user %s in Identity Provider: %v", id, err)
		http.Error(w, "Failed to update user in Identity Provider", http.StatusBadGateway)
		return
	}
	state := userUpdateMutationState{identityUpdated: true}

	// 3. Sync Roles in Keycloak if role changed
	if newRole != nil {
		if err := h.kc.AddRealmRoleToUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, existingUser.KeycloakID, []gocloak.Role{*newRole}); err != nil {
			h.rollbackUserUpdate(r.Context(), token.AccessToken, uuid, existingUser, newRole, oldRole, state)
			log.Printf("Failed to add role %s to user %s: %v", req.Role, id, err)
			http.Error(w, "Failed to update role in Identity Provider", http.StatusBadGateway)
			return
		}
		state.newRoleAdded = true

		if oldRole != nil {
			if roleErr := h.kc.DeleteRealmRoleFromUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, existingUser.KeycloakID, []gocloak.Role{*oldRole}); roleErr != nil {
				h.rollbackUserUpdate(r.Context(), token.AccessToken, uuid, existingUser, newRole, oldRole, state)
				log.Printf("Failed to remove prior role %s from user %s: %v", existingUser.Role, id, roleErr)
				http.Error(w, "Failed to update role in Identity Provider", http.StatusBadGateway)
				return
			}
			state.oldRoleRemoved = true
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
		h.rollbackUserUpdate(r.Context(), token.AccessToken, uuid, existingUser, newRole, oldRole, state)
		log.Printf("Failed to update user %s in database: %v", id, err)
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}
	state.databaseUpdated = true

	// SECURITY: Password is deliberately last because the previous password cannot be restored.
	if req.Password != "" {
		if err := h.kc.SetPassword(r.Context(), token.AccessToken, existingUser.KeycloakID, h.cfg.KeycloakRealm, req.Password, false); err != nil {
			h.rollbackUserUpdate(r.Context(), token.AccessToken, uuid, existingUser, newRole, oldRole, state)
			log.Printf("Failed to update password for user %s: %v", existingUser.KeycloakID, err)
			http.Error(w, "Failed to update password in Identity Provider", http.StatusBadGateway)
			return
		}
	}
	publishAudit(r, "UPDATE", id, user)

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
	if err != nil {
		log.Printf("Failed to authenticate before disabling user %s: %v", id, err)
		http.Error(w, "Failed to authenticate with Identity Provider", http.StatusBadGateway)
		return
	}
	keycloakUser, err := h.kc.GetUserByID(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, existingUser.KeycloakID)
	if err != nil {
		log.Printf("Failed to read user %s in Identity Provider before disable: %v", id, err)
		http.Error(w, "Failed to read user in Identity Provider", http.StatusBadGateway)
		return
	}
	previouslyEnabled := true
	if keycloakUser.Enabled != nil {
		previouslyEnabled = *keycloakUser.Enabled
	}
	enabled := false
	kcUser := gocloak.User{
		ID:      gocloak.StringP(existingUser.KeycloakID),
		Enabled: &enabled,
	}
	// We only disable the user in Keycloak to maintain relational integrity and audit trails.
	if err := h.kc.UpdateUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, kcUser); err != nil {
		log.Printf("Failed to disable user %s in Identity Provider: %v", id, err)
		http.Error(w, "Failed to disable user in Identity Provider", http.StatusBadGateway)
		return
	}

	// 2. Soft Delete in Local Database
	actor := actorIDFromRequest(r)

	arg := db.DeleteUserParams{
		ID:           uuid,
		DeletedBy:    actor,
		DeleteReason: "Deleted by Super Admin via Admin Web",
	}

	if err := h.queries.DeleteUser(r.Context(), arg); err != nil {
		if rollbackErr := h.kc.UpdateUser(r.Context(), token.AccessToken, h.cfg.KeycloakRealm, gocloak.User{
			ID:      gocloak.StringP(existingUser.KeycloakID),
			Enabled: &previouslyEnabled,
		}); rollbackErr != nil {
			log.Printf("Failed to restore Keycloak user %s enabled state after database failure: %v", existingUser.KeycloakID, rollbackErr)
		}
		log.Printf("Failed to soft delete user %s: %v", id, err)
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	publishAudit(r, "DELETE", id, map[string]string{"id": id, "reason": arg.DeleteReason})

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
