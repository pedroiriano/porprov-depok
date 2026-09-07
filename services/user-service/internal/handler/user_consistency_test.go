package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Nerzal/gocloak/v13"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/db"
)

type userStoreStub struct {
	user          db.User
	deleteErr     error
	updateErr     error
	deleteArg     db.DeleteUserParams
	updateCalls   []db.UpdateUserParams
	updateErrors  []error
	updatedResult db.User
}

func (s *userStoreStub) CountUsersPage(context.Context, string) (int64, error) { return 0, nil }
func (s *userStoreStub) CreateUser(context.Context, db.CreateUserParams) (db.User, error) {
	return db.User{}, nil
}
func (s *userStoreStub) DeleteUser(_ context.Context, arg db.DeleteUserParams) error {
	s.deleteArg = arg
	return s.deleteErr
}
func (s *userStoreStub) GetUserByID(context.Context, pgtype.UUID) (db.User, error) {
	return s.user, nil
}
func (s *userStoreStub) GetUserByKeycloakID(context.Context, string) (db.User, error) {
	return s.user, nil
}
func (s *userStoreStub) ListUsers(context.Context) ([]db.User, error) { return nil, nil }
func (s *userStoreStub) ListUsersPage(context.Context, db.ListUsersPageParams) ([]db.User, error) {
	return nil, nil
}
func (s *userStoreStub) UpdateUser(_ context.Context, arg db.UpdateUserParams) (db.User, error) {
	s.updateCalls = append(s.updateCalls, arg)
	if len(s.updateErrors) > 0 {
		err := s.updateErrors[0]
		s.updateErrors = s.updateErrors[1:]
		if err != nil {
			return db.User{}, err
		}
	}
	if s.updateErr != nil {
		return db.User{}, s.updateErr
	}
	return s.updatedResult, nil
}

type identityProviderStub struct {
	updatedUsers  []gocloak.User
	existingUser  *gocloak.User
	roles         map[string]*gocloak.Role
	roleActions   []string
	passwordCalls int
	passwordErr   error
}

func (s *identityProviderStub) LoginClient(context.Context, string, string, string, ...string) (*gocloak.JWT, error) {
	return &gocloak.JWT{AccessToken: "test-token"}, nil
}
func (s *identityProviderStub) GetRealmRoles(_ context.Context, _, _ string, params gocloak.GetRoleParams) ([]*gocloak.Role, error) {
	if params.Search != nil {
		if role := s.roles[*params.Search]; role != nil {
			return []*gocloak.Role{role}, nil
		}
	}
	return []*gocloak.Role{}, nil
}
func (s *identityProviderStub) CreateUser(context.Context, string, string, gocloak.User) (string, error) {
	return "keycloak-id", nil
}
func (s *identityProviderStub) GetUserByID(context.Context, string, string, string) (*gocloak.User, error) {
	if s.existingUser != nil {
		return s.existingUser, nil
	}
	enabled := true
	return &gocloak.User{Enabled: &enabled}, nil
}
func (s *identityProviderStub) DeleteUser(context.Context, string, string, string) error { return nil }
func (s *identityProviderStub) UpdateUser(_ context.Context, _, _ string, user gocloak.User) error {
	s.updatedUsers = append(s.updatedUsers, user)
	return nil
}
func (s *identityProviderStub) SetPassword(context.Context, string, string, string, string, bool) error {
	s.passwordCalls++
	return s.passwordErr
}

func (s *identityProviderStub) AddRealmRoleToUser(_ context.Context, _, _, _ string, roles []gocloak.Role) error {
	name := ""
	if len(roles) > 0 && roles[0].Name != nil {
		name = *roles[0].Name
	}
	s.roleActions = append(s.roleActions, "add:"+name)
	return nil
}
func (s *identityProviderStub) DeleteRealmRoleFromUser(_ context.Context, _, _, _ string, roles []gocloak.Role) error {
	name := ""
	if len(roles) > 0 && roles[0].Name != nil {
		name = *roles[0].Name
	}
	s.roleActions = append(s.roleActions, "delete:"+name)
	return nil
}

func requestWithUserID(method, body, id string) *http.Request {
	request := httptest.NewRequest(method, "/api/v1/users/"+id, strings.NewReader(body))
	routeContext := chi.NewRouteContext()
	routeContext.URLParams.Add("id", id)
	return request.WithContext(context.WithValue(request.Context(), chi.RouteCtxKey, routeContext))
}

func TestBuildUserAuditEventUsesGatewayIdentity(t *testing.T) {
	request := httptest.NewRequest(http.MethodPut, "/api/v1/users/user-id", nil)
	request.Header.Set("X-Actor-ID", "actor-id")
	request.Header.Set("X-Request-ID", "request-id")
	request.Header.Set("X-Actor-IP", "127.0.0.1")

	event := buildUserAuditEvent(request, "UPDATE", "user-id", map[string]string{"role": "auditor"})
	if event.Actor != "actor-id" || event.RequestID != "request-id" || event.IPAddress != "127.0.0.1" {
		t.Fatalf("canonical audit context was not preserved: %#v", event)
	}
	encoded, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	if strings.Contains(string(encoded), `"username"`) || strings.Contains(string(encoded), `"actor_id"`) || strings.Contains(string(encoded), `"request_id"`) {
		t.Fatalf("legacy audit keys must not be emitted: %s", encoded)
	}
}

func TestDeleteUserReEnablesKeycloakWhenDatabaseSoftDeleteFails(t *testing.T) {
	const id = "c9ba7575-956d-47c7-a502-78e55507ce97"
	store := &userStoreStub{
		user:      db.User{KeycloakID: "keycloak-id", Username: "operator", Email: "operator@example.test"},
		deleteErr: errors.New("database unavailable"),
	}
	identity := &identityProviderStub{}
	handler := &UserHandler{queries: store, cfg: &config.AppConfig{KeycloakRealm: "porprov"}, kc: identity}
	request := requestWithUserID(http.MethodDelete, "", id)
	request.Header.Set("X-Actor-ID", "super-admin-id")
	response := httptest.NewRecorder()

	handler.DeleteUser(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("DeleteUser() status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if store.deleteArg.DeletedBy != "super-admin-id" {
		t.Fatalf("DeletedBy = %q, want gateway actor ID", store.deleteArg.DeletedBy)
	}
	if len(identity.updatedUsers) != 2 || identity.updatedUsers[0].Enabled == nil || *identity.updatedUsers[0].Enabled || identity.updatedUsers[1].Enabled == nil || !*identity.updatedUsers[1].Enabled {
		t.Fatalf("Keycloak disable/re-enable compensation was not executed: %#v", identity.updatedUsers)
	}
}

func TestDeleteUserPreservesPreviouslyDisabledKeycloakStateOnDatabaseFailure(t *testing.T) {
	const id = "c9ba7575-956d-47c7-a502-78e55507ce97"
	previouslyEnabled := false
	store := &userStoreStub{
		user:      db.User{KeycloakID: "keycloak-id", Username: "operator", Email: "operator@example.test"},
		deleteErr: errors.New("database unavailable"),
	}
	identity := &identityProviderStub{existingUser: &gocloak.User{Enabled: &previouslyEnabled}}
	handler := &UserHandler{queries: store, cfg: &config.AppConfig{KeycloakRealm: "porprov"}, kc: identity}
	response := httptest.NewRecorder()

	handler.DeleteUser(response, requestWithUserID(http.MethodDelete, "", id))

	if len(identity.updatedUsers) != 2 || identity.updatedUsers[1].Enabled == nil || *identity.updatedUsers[1].Enabled {
		t.Fatalf("previous disabled state was not restored: %#v", identity.updatedUsers)
	}
}

func TestUpdateUserRestoresKeycloakIdentityWhenDatabaseUpdateFails(t *testing.T) {
	const id = "c9ba7575-956d-47c7-a502-78e55507ce97"
	store := &userStoreStub{
		user: db.User{
			KeycloakID: "keycloak-id",
			Username:   "old-user",
			Email:      "old@example.test",
			FullName:   pgtype.Text{String: "Old User", Valid: true},
			Role:       "auditor",
		},
		updateErr: errors.New("database unavailable"),
	}
	identity := &identityProviderStub{}
	handler := &UserHandler{queries: store, cfg: &config.AppConfig{KeycloakRealm: "porprov"}, kc: identity}
	body := `{"username":"new-user","email":"new@example.test","full_name":"New User","role":"auditor"}`
	request := requestWithUserID(http.MethodPut, body, id)
	response := httptest.NewRecorder()

	handler.UpdateUser(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("UpdateUser() status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if len(identity.updatedUsers) != 2 {
		t.Fatalf("Keycloak identity updates = %d, want update plus compensation", len(identity.updatedUsers))
	}
	restored := identity.updatedUsers[1]
	if restored.Username == nil || *restored.Username != "old-user" || restored.Email == nil || *restored.Email != "old@example.test" || restored.FirstName == nil || *restored.FirstName != "Old User" {
		t.Fatalf("Keycloak identity was not restored: %#v", restored)
	}
}

func TestUpdateUserCompensatesRoleChangesWhenDatabaseUpdateFails(t *testing.T) {
	const id = "c9ba7575-956d-47c7-a502-78e55507ce97"
	store := &userStoreStub{
		user: db.User{
			KeycloakID: "keycloak-id",
			Username:   "operator",
			Email:      "operator@example.test",
			FullName:   pgtype.Text{String: "Operator", Valid: true},
			Role:       "auditor",
		},
		updateErr: errors.New("database unavailable"),
	}
	identity := &identityProviderStub{roles: map[string]*gocloak.Role{
		"auditor":     {Name: gocloak.StringP("auditor")},
		"super_admin": {Name: gocloak.StringP("super_admin")},
	}}
	handler := &UserHandler{queries: store, cfg: &config.AppConfig{KeycloakRealm: "porprov"}, kc: identity}
	body := `{"username":"operator","email":"operator@example.test","full_name":"Operator","role":"super_admin"}`
	response := httptest.NewRecorder()

	handler.UpdateUser(response, requestWithUserID(http.MethodPut, body, id))

	wantActions := "add:super_admin,delete:auditor,add:auditor,delete:super_admin"
	if got := strings.Join(identity.roleActions, ","); got != wantActions {
		t.Fatalf("role compensation actions = %q, want %q", got, wantActions)
	}
}

func TestUpdateUserCompensatesDatabaseWhenPasswordUpdateFails(t *testing.T) {
	const id = "c9ba7575-956d-47c7-a502-78e55507ce97"
	existing := db.User{
		KeycloakID: "keycloak-id",
		Username:   "old-user",
		Email:      "old@example.test",
		FullName:   pgtype.Text{String: "Old User", Valid: true},
		Role:       "auditor",
	}
	store := &userStoreStub{user: existing, updatedResult: existing}
	identity := &identityProviderStub{passwordErr: errors.New("identity unavailable")}
	handler := &UserHandler{queries: store, cfg: &config.AppConfig{KeycloakRealm: "porprov"}, kc: identity}
	body := `{"username":"new-user","email":"new@example.test","full_name":"New User","role":"auditor","password":"safe-password-2026"}`
	response := httptest.NewRecorder()

	handler.UpdateUser(response, requestWithUserID(http.MethodPut, body, id))

	if response.Code != http.StatusBadGateway || identity.passwordCalls != 1 {
		t.Fatalf("password failure status/calls = %d/%d, want 502/1", response.Code, identity.passwordCalls)
	}
	if len(store.updateCalls) != 2 {
		t.Fatalf("database updates = %d, want update plus compensation", len(store.updateCalls))
	}
	rollback := store.updateCalls[1]
	if rollback.Username != existing.Username || rollback.Email != existing.Email || rollback.FullName != existing.FullName.String || rollback.Role != existing.Role {
		t.Fatalf("database rollback did not restore prior values: %#v", rollback)
	}
}
