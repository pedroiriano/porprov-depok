package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/Nerzal/gocloak/v13"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/db"
)

type EnterpriseHandler struct {
	pool  *pgxpool.Pool
	users *UserHandler
}

type roleIdentityProvider interface {
	CreateRealmRole(context.Context, string, string, gocloak.Role) (string, error)
	DeleteRealmRole(context.Context, string, string, string) error
}

type accessRoleView struct {
	ID            string   `json:"id"`
	Slug          string   `json:"slug"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	IsSystem      bool     `json:"is_system"`
	IsActive      bool     `json:"is_active"`
	Permissions   []string `json:"permissions"`
	AssignedCount int64    `json:"assigned_count"`
	DeletedAt     *string  `json:"deleted_at,omitempty"`
}

type accessRolePage struct {
	Data       []accessRoleView `json:"data"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	Total      int64            `json:"total"`
	TotalPages int              `json:"total_pages"`
}

type roleMutationRequest struct {
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

type notificationView struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Message    string  `json:"message"`
	TargetPath string  `json:"target_path"`
	ReadAt     *string `json:"read_at"`
	CreatedAt  string  `json:"created_at"`
}

type userDirectoryEntry struct {
	KeycloakID string `json:"keycloak_id"`
	Username   string `json:"username"`
	FullName   string `json:"full_name"`
}

var customRoleSlugPattern = regexp.MustCompile(`^[a-z][a-z0-9_]{2,63}$`)

func NewEnterpriseHandler(pool *pgxpool.Pool, users *UserHandler) *EnterpriseHandler {
	return &EnterpriseHandler{pool: pool, users: users}
}

func enterpriseActor(r *http.Request) string { return strings.TrimSpace(r.Header.Get("X-Actor-ID")) }

func enterpriseAudit(r *http.Request, entity, action, entityID string, payload interface{}) {
	event := map[string]interface{}{
		"eventVersion": "1.1", "eventType": "audit.user." + strings.ToLower(action),
		"service_name": "user-service", "entity_name": entity, "entity_id": entityID,
		"action": action, "actor": enterpriseActor(r),
		"actor_username":     strings.TrimSpace(r.Header.Get("X-Actor-Username")),
		"actor_display_name": strings.TrimSpace(r.Header.Get("X-Actor-Display-Name")),
		"requestId":          strings.TrimSpace(r.Header.Get("X-Request-ID")),
		"ipAddress":          strings.TrimSpace(r.Header.Get("X-Actor-IP")), "payload": payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.user."+strings.ToLower(action), data)
}

func (h *EnterpriseHandler) activeUser(ctx context.Context, keycloakID string) (bool, string, []string, error) {
	var username, role string
	var active bool
	err := h.pool.QueryRow(ctx, `SELECT username, role, is_active FROM users WHERE keycloak_id=$1 AND deleted_at IS NULL`, keycloakID).Scan(&username, &role, &active)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, "", nil, nil
	}
	if err != nil {
		return false, "", nil, err
	}
	if !active {
		return false, username, []string{}, nil
	}
	rows, err := h.pool.Query(ctx, `SELECT permission.code FROM access_permissions permission
		JOIN access_role_permissions mapping ON mapping.permission_id=permission.id
		JOIN access_roles role_record ON role_record.id=mapping.role_id
		WHERE role_record.slug=$1 AND role_record.is_active AND role_record.deleted_at IS NULL ORDER BY permission.code`, role)
	if err != nil {
		return false, username, nil, err
	}
	defer rows.Close()
	permissions := make([]string, 0)
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return false, username, nil, err
		}
		permissions = append(permissions, code)
	}
	return true, username, permissions, rows.Err()
}

func (h *EnterpriseHandler) Session(w http.ResponseWriter, r *http.Request) {
	active, username, permissions, err := h.activeUser(r.Context(), enterpriseActor(r))
	if err != nil {
		http.Error(w, "Status akun belum dapat diperiksa", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"active": active, "username": username, "permissions": permissions})
}

func (h *EnterpriseHandler) CheckPermission(w http.ResponseWriter, r *http.Request) {
	permission := strings.TrimSpace(r.URL.Query().Get("permission"))
	domain := strings.SplitN(permission, ".", 2)[0]
	active, _, permissions, err := h.activeUser(r.Context(), enterpriseActor(r))
	if err != nil {
		http.Error(w, "Hak akses belum dapat diperiksa", http.StatusInternalServerError)
		return
	}
	allowed := false
	for _, candidate := range permissions {
		if candidate == permission || candidate == domain+".manage" {
			allowed = true
			break
		}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"active": active, "allowed": active && allowed})
}

// LookupUserDirectory resolves historical actor IDs in one bounded query. It
// intentionally includes archived accounts because audit history is immutable.
func (h *EnterpriseHandler) LookupUserDirectory(w http.ResponseWriter, r *http.Request) {
	var request struct {
		ActorIDs []string `json:"actor_ids"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil || len(request.ActorIDs) == 0 || len(request.ActorIDs) > 100 {
		http.Error(w, "Daftar pelaku harus berisi 1 sampai 100 nomor", http.StatusUnprocessableEntity)
		return
	}
	unique := make([]string, 0, len(request.ActorIDs))
	seen := make(map[string]struct{}, len(request.ActorIDs))
	for _, actorID := range request.ActorIDs {
		actorID = strings.TrimSpace(actorID)
		if actorID == "" || len(actorID) > 255 {
			http.Error(w, "Nomor pelaku tidak valid", http.StatusUnprocessableEntity)
			return
		}
		if _, exists := seen[actorID]; !exists {
			seen[actorID] = struct{}{}
			unique = append(unique, actorID)
		}
	}
	rows, err := h.pool.Query(r.Context(), `SELECT keycloak_id,username,COALESCE(full_name,'') FROM users WHERE keycloak_id=ANY($1::text[])`, unique)
	if err != nil {
		http.Error(w, "Data pelaku belum dapat dipetakan", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]userDirectoryEntry, 0, len(unique))
	for rows.Next() {
		var item userDirectoryEntry
		if rows.Scan(&item.KeycloakID, &item.Username, &item.FullName) != nil {
			http.Error(w, "Data pelaku belum dapat dipetakan", http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		http.Error(w, "Data pelaku belum dapat dipetakan", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(items)
}

func (h *EnterpriseHandler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(), `SELECT code, domain, action, name, COALESCE(description,'') FROM access_permissions ORDER BY domain, action`)
	if err != nil {
		http.Error(w, "Hak akses belum dapat dimuat", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]map[string]string, 0)
	for rows.Next() {
		var code, domain, action, name, description string
		if rows.Scan(&code, &domain, &action, &name, &description) != nil {
			http.Error(w, "Hak akses belum dapat dimuat", http.StatusInternalServerError)
			return
		}
		items = append(items, map[string]string{"code": code, "domain": domain, "action": action, "name": name, "description": description})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(items)
}

func (h *EnterpriseHandler) roleRows(ctx context.Context, includeDeleted bool) ([]accessRoleView, error) {
	rows, err := h.pool.Query(ctx, `SELECT role.id::text,role.slug,role.name,COALESCE(role.description,''),role.is_system,role.is_active,
		COALESCE(array_agg(permission.code ORDER BY permission.code) FILTER (WHERE permission.code IS NOT NULL),'{}'),
		(SELECT COUNT(*) FROM users account WHERE account.role=role.slug AND account.deleted_at IS NULL),
		CASE WHEN role.deleted_at IS NULL THEN NULL ELSE role.deleted_at::text END
		FROM access_roles role LEFT JOIN access_role_permissions mapping ON mapping.role_id=role.id
		LEFT JOIN access_permissions permission ON permission.id=mapping.permission_id
		WHERE ($1 OR role.deleted_at IS NULL) GROUP BY role.id ORDER BY role.is_system DESC,LOWER(role.name)`, includeDeleted)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]accessRoleView, 0)
	for rows.Next() {
		var item accessRoleView
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.IsSystem, &item.IsActive, &item.Permissions, &item.AssignedCount, &item.DeletedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (h *EnterpriseHandler) roleRowsPage(ctx context.Context, includeDeleted bool, search, sortKey, sortOrder string, limit, offset int) ([]accessRoleView, error) {
	rows, err := h.pool.Query(ctx, `WITH role_view AS (
		SELECT role.id::text AS id,role.slug,role.name,COALESCE(role.description,'') AS description,
			role.is_system,role.is_active,
			COALESCE(array_agg(permission.code ORDER BY permission.code) FILTER (WHERE permission.code IS NOT NULL),'{}') AS permissions,
			(SELECT COUNT(*) FROM users account WHERE account.role=role.slug AND account.deleted_at IS NULL) AS assigned_count,
			CASE WHEN role.deleted_at IS NULL THEN NULL ELSE role.deleted_at::text END AS deleted_at
		FROM access_roles role
		LEFT JOIN access_role_permissions mapping ON mapping.role_id=role.id
		LEFT JOIN access_permissions permission ON permission.id=mapping.permission_id
		WHERE ($1 OR role.deleted_at IS NULL)
		GROUP BY role.id
	)
	SELECT id,slug,name,description,is_system,is_active,permissions,assigned_count,deleted_at
	FROM role_view
	WHERE $2='' OR name ILIKE '%' || $2 || '%' OR slug ILIKE '%' || $2 || '%'
	ORDER BY
		CASE WHEN $5='name' AND $6='asc' THEN LOWER(name) END ASC,
		CASE WHEN $5='name' AND $6='desc' THEN LOWER(name) END DESC,
		CASE WHEN $5='permissions' AND $6='asc' THEN cardinality(permissions) END ASC,
		CASE WHEN $5='permissions' AND $6='desc' THEN cardinality(permissions) END DESC,
		CASE WHEN $5='assigned' AND $6='asc' THEN assigned_count END ASC,
		CASE WHEN $5='assigned' AND $6='desc' THEN assigned_count END DESC,
		CASE WHEN $5='status' AND $6='asc' THEN (deleted_at IS NULL)::int + is_active::int END ASC,
		CASE WHEN $5='status' AND $6='desc' THEN (deleted_at IS NULL)::int + is_active::int END DESC,
		is_system DESC,LOWER(name),id
	LIMIT $3 OFFSET $4`, includeDeleted, search, limit, offset, sortKey, sortOrder)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]accessRoleView, 0)
	for rows.Next() {
		var item accessRoleView
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.IsSystem, &item.IsActive, &item.Permissions, &item.AssignedCount, &item.DeletedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (h *EnterpriseHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	includeArchived := query.Get("include_archived") == "true"
	if query.Get("page") == "" && query.Get("limit") == "" && query.Get("q") == "" && query.Get("sort") == "" {
		items, err := h.roleRows(r.Context(), includeArchived)
		if err != nil {
			http.Error(w, "Peran belum dapat dimuat", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(items)
		return
	}
	page, pageErr := strconv.Atoi(query.Get("page"))
	limit, limitErr := strconv.Atoi(query.Get("limit"))
	if pageErr != nil || page < 1 || limitErr != nil || limit < 1 || limit > 100 {
		http.Error(w, "Halaman atau jumlah baris tidak valid", http.StatusBadRequest)
		return
	}
	search := strings.TrimSpace(query.Get("q"))
	if len([]rune(search)) > 80 {
		http.Error(w, "Kata pencarian maksimal 80 karakter", http.StatusBadRequest)
		return
	}
	sortKey, sortOrder := query.Get("sort"), query.Get("order")
	if sortKey == "" {
		sortKey = "name"
	}
	if sortOrder == "" {
		sortOrder = "asc"
	}
	validSort := map[string]bool{"name": true, "permissions": true, "assigned": true, "status": true}
	if !validSort[sortKey] || (sortOrder != "asc" && sortOrder != "desc") {
		http.Error(w, "Pengurutan peran tidak valid", http.StatusBadRequest)
		return
	}
	var total int64
	err := h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM access_roles WHERE ($1 OR deleted_at IS NULL) AND ($2='' OR name ILIKE '%' || $2 || '%' OR slug ILIKE '%' || $2 || '%')`, includeArchived, search).Scan(&total)
	if err != nil {
		http.Error(w, "Peran belum dapat dihitung", http.StatusInternalServerError)
		return
	}
	items, err := h.roleRowsPage(r.Context(), includeArchived, search, sortKey, sortOrder, limit, (page-1)*limit)
	if err != nil {
		http.Error(w, "Peran belum dapat dimuat", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(accessRolePage{Data: items, Page: page, Limit: limit, Total: total, TotalPages: int((total + int64(limit) - 1) / int64(limit))})
}

func decodeRoleMutation(w http.ResponseWriter, r *http.Request, creating bool) (roleMutationRequest, bool) {
	var request roleMutationRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil {
		http.Error(w, "Data peran tidak valid", http.StatusBadRequest)
		return request, false
	}
	request.Slug = strings.ToLower(strings.TrimSpace(request.Slug))
	request.Name = strings.TrimSpace(request.Name)
	request.Description = strings.TrimSpace(request.Description)
	if creating && !customRoleSlugPattern.MatchString(request.Slug) {
		http.Error(w, "Kode peran harus 3-64 karakter berupa huruf kecil, angka, atau garis bawah", http.StatusUnprocessableEntity)
		return request, false
	}
	if len([]rune(request.Name)) < 3 || len([]rune(request.Name)) > 100 {
		http.Error(w, "Nama peran harus terdiri dari 3 sampai 100 karakter", http.StatusUnprocessableEntity)
		return request, false
	}
	seen := map[string]struct{}{}
	normalized := make([]string, 0, len(request.Permissions))
	for _, code := range request.Permissions {
		code = strings.TrimSpace(code)
		if code != "" {
			if _, ok := seen[code]; !ok {
				seen[code] = struct{}{}
				normalized = append(normalized, code)
			}
		}
	}
	request.Permissions = normalized
	return request, true
}

func syncRolePermissions(ctx context.Context, tx pgx.Tx, roleID string, permissions []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM access_role_permissions WHERE role_id=$1`, roleID); err != nil {
		return err
	}
	if len(permissions) == 0 {
		return nil
	}
	command, err := tx.Exec(ctx, `INSERT INTO access_role_permissions(role_id,permission_id)
		SELECT $1,id FROM access_permissions WHERE code=ANY($2::text[]) ON CONFLICT DO NOTHING`, roleID, permissions)
	if err != nil {
		return err
	}
	if command.RowsAffected() != int64(len(permissions)) {
		return errors.New("terdapat kode hak akses yang tidak valid")
	}
	return nil
}

func (h *EnterpriseHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	request, ok := decodeRoleMutation(w, r, true)
	if !ok {
		return
	}
	token, err := h.users.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Penyedia identitas belum dapat dihubungi", http.StatusBadGateway)
		return
	}
	roleProvider, supported := h.users.kc.(roleIdentityProvider)
	if !supported {
		http.Error(w, "Penyedia identitas tidak mendukung pengelolaan peran", http.StatusBadGateway)
		return
	}
	_, err = roleProvider.CreateRealmRole(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, gocloak.Role{Name: gocloak.StringP(request.Slug), Description: gocloak.StringP(request.Description)})
	if err != nil {
		http.Error(w, "Kode peran sudah digunakan atau gagal dibuat", http.StatusConflict)
		return
	}
	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		_ = roleProvider.DeleteRealmRole(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, request.Slug)
		http.Error(w, "Peran gagal disimpan", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())
	var id string
	err = tx.QueryRow(r.Context(), `INSERT INTO access_roles(slug,name,description,created_by,updated_by) VALUES($1,$2,NULLIF($3,''),$4,$4) RETURNING id::text`, request.Slug, request.Name, request.Description, enterpriseActor(r)).Scan(&id)
	if err == nil {
		err = syncRolePermissions(r.Context(), tx, id, request.Permissions)
	}
	if err == nil {
		err = tx.Commit(r.Context())
	}
	if err != nil {
		_ = roleProvider.DeleteRealmRole(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, request.Slug)
		http.Error(w, "Peran gagal disimpan", http.StatusConflict)
		return
	}
	enterpriseAudit(r, "AccessRole", "CREATE", id, map[string]interface{}{"slug": request.Slug, "name": request.Name, "permissions": request.Permissions})
	w.WriteHeader(http.StatusCreated)
}

func (h *EnterpriseHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	request, ok := decodeRoleMutation(w, r, false)
	if !ok {
		return
	}
	id := chi.URLParam(r, "id")
	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		http.Error(w, "Peran gagal diperbarui", 500)
		return
	}
	defer tx.Rollback(r.Context())
	command, err := tx.Exec(r.Context(), `UPDATE access_roles SET name=$2,description=NULLIF($3,''),updated_by=$4,updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id, request.Name, request.Description, enterpriseActor(r))
	if err == nil && command.RowsAffected() == 0 {
		http.Error(w, "Peran tidak ditemukan", 404)
		return
	}
	if err == nil {
		err = syncRolePermissions(r.Context(), tx, id, request.Permissions)
	}
	if err == nil {
		err = tx.Commit(r.Context())
	}
	if err != nil {
		http.Error(w, "Peran gagal diperbarui", http.StatusConflict)
		return
	}
	enterpriseAudit(r, "AccessRole", "UPDATE", id, map[string]interface{}{"name": request.Name, "permissions": request.Permissions})
	w.WriteHeader(http.StatusNoContent)
}

func (h *EnterpriseHandler) SetRoleStatus(w http.ResponseWriter, r *http.Request) {
	var request struct {
		IsActive bool   `json:"is_active"`
		Reason   string `json:"reason"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&request) != nil {
		http.Error(w, "Perubahan status tidak valid", 400)
		return
	}
	request.Reason = strings.TrimSpace(request.Reason)
	if !request.IsActive && len([]rune(request.Reason)) < 3 {
		http.Error(w, "Alasan penonaktifan wajib diisi", 422)
		return
	}
	command, err := h.pool.Exec(r.Context(), `UPDATE access_roles role SET is_active=$2,deactivated_at=CASE WHEN $2 THEN NULL ELSE NOW() END,deactivated_by=CASE WHEN $2 THEN NULL ELSE $3 END,deactivation_reason=CASE WHEN $2 THEN NULL ELSE $4 END,updated_by=$3,updated_at=NOW() WHERE id=$1 AND NOT is_system AND deleted_at IS NULL AND ($2 OR NOT EXISTS(SELECT 1 FROM users WHERE users.role=role.slug AND users.deleted_at IS NULL))`, chi.URLParam(r, "id"), request.IsActive, enterpriseActor(r), request.Reason)
	if err != nil || command.RowsAffected() == 0 {
		http.Error(w, "Peran bawaan, peran terpakai, atau peran tidak ditemukan tidak dapat dinonaktifkan", http.StatusConflict)
		return
	}
	enterpriseAudit(r, "AccessRole", "STATUS_CHANGE", chi.URLParam(r, "id"), request)
	w.WriteHeader(204)
}

func (h *EnterpriseHandler) ArchiveRole(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&request)
	request.Reason = strings.TrimSpace(request.Reason)
	if len([]rune(request.Reason)) < 3 {
		http.Error(w, "Alasan pengarsipan wajib diisi", 422)
		return
	}
	command, err := h.pool.Exec(r.Context(), `UPDATE access_roles role SET deleted_at=NOW(),deleted_by=$2,delete_reason=$3,updated_by=$2,updated_at=NOW() WHERE id=$1 AND NOT is_system AND deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM users WHERE users.role=role.slug AND users.deleted_at IS NULL)`, chi.URLParam(r, "id"), enterpriseActor(r), request.Reason)
	if err != nil || command.RowsAffected() == 0 {
		http.Error(w, "Peran bawaan, peran terpakai, atau peran tidak ditemukan tidak dapat diarsipkan", 409)
		return
	}
	enterpriseAudit(r, "AccessRole", "DELETE", chi.URLParam(r, "id"), request)
	w.WriteHeader(204)
}

func (h *EnterpriseHandler) RestoreRole(w http.ResponseWriter, r *http.Request) {
	command, err := h.pool.Exec(r.Context(), `UPDATE access_roles SET deleted_at=NULL,deleted_by=NULL,delete_reason=NULL,is_active=TRUE,updated_by=$2,updated_at=NOW() WHERE id=$1 AND deleted_at IS NOT NULL`, chi.URLParam(r, "id"), enterpriseActor(r))
	if err != nil || command.RowsAffected() == 0 {
		http.Error(w, "Peran arsip tidak ditemukan atau kode sudah digunakan", 409)
		return
	}
	enterpriseAudit(r, "AccessRole", "RESTORE", chi.URLParam(r, "id"), map[string]string{"status": "active"})
	w.WriteHeader(204)
}

func (h *EnterpriseHandler) SetUserStatus(w http.ResponseWriter, r *http.Request) {
	var request struct {
		IsActive bool   `json:"is_active"`
		Reason   string `json:"reason"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&request) != nil {
		http.Error(w, "Perubahan status tidak valid", 400)
		return
	}
	request.Reason = strings.TrimSpace(request.Reason)
	if !request.IsActive && len([]rune(request.Reason)) < 3 {
		http.Error(w, "Alasan penonaktifan wajib diisi", 422)
		return
	}
	var id pgtype.UUID
	if id.Scan(chi.URLParam(r, "id")) != nil {
		http.Error(w, "Nomor pengguna tidak valid", 400)
		return
	}
	existing, err := h.users.queries.GetUserByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Pengguna tidak ditemukan", 404)
		return
	}
	if !request.IsActive && (existing.KeycloakID == enterpriseActor(r)) {
		http.Error(w, "Akun yang sedang digunakan tidak dapat dinonaktifkan", 409)
		return
	}
	if !request.IsActive && existing.Role == "super_admin" {
		count, err := h.users.queries.CountOtherActiveSuperAdmins(r.Context(), id)
		if err != nil || count == 0 {
			http.Error(w, "Pengelola Utama terakhir tidak dapat dinonaktifkan", 409)
			return
		}
	}
	token, err := h.users.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Penyedia identitas belum dapat dihubungi", 502)
		return
	}
	if err = h.users.kc.UpdateUser(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, gocloak.User{ID: gocloak.StringP(existing.KeycloakID), Enabled: gocloak.BoolP(request.IsActive)}); err != nil {
		http.Error(w, "Status pengguna gagal diterapkan pada penyedia identitas", 502)
		return
	}
	updated, err := h.users.queries.SetUserStatus(r.Context(), db.SetUserStatusParams{ID: id, IsActive: request.IsActive, Actor: enterpriseActor(r), Reason: request.Reason})
	if err != nil {
		_ = h.users.kc.UpdateUser(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, gocloak.User{ID: gocloak.StringP(existing.KeycloakID), Enabled: gocloak.BoolP(existing.IsActive)})
		http.Error(w, "Status pengguna gagal disimpan", 500)
		return
	}
	_ = h.createNotification(r.Context(), existing.KeycloakID, "status-"+strconv.FormatInt(time.Now().UnixNano(), 10), "Status akun diperbarui", "Status akun Anda telah diperbarui oleh pengelola.", "/profile")
	enterpriseAudit(r, "User", "STATUS_CHANGE", chi.URLParam(r, "id"), map[string]interface{}{"is_active": request.IsActive, "reason": request.Reason})
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *EnterpriseHandler) RestoreUser(w http.ResponseWriter, r *http.Request) {
	var id pgtype.UUID
	if id.Scan(chi.URLParam(r, "id")) != nil {
		http.Error(w, "Nomor pengguna tidak valid", 400)
		return
	}
	var keycloakID string
	err := h.pool.QueryRow(r.Context(), `SELECT keycloak_id FROM users WHERE id=$1 AND deleted_at IS NOT NULL`, id).Scan(&keycloakID)
	if err != nil {
		http.Error(w, "Pengguna arsip tidak ditemukan", 404)
		return
	}
	token, err := h.users.getAdminToken(r.Context())
	if err != nil {
		http.Error(w, "Penyedia identitas belum dapat dihubungi", 502)
		return
	}
	if err = h.users.kc.UpdateUser(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, gocloak.User{ID: gocloak.StringP(keycloakID), Enabled: gocloak.BoolP(true)}); err != nil {
		http.Error(w, "Pengguna gagal diaktifkan pada penyedia identitas", 502)
		return
	}
	updated, err := h.users.queries.RestoreUser(r.Context(), db.RestoreUserParams{ID: id, Actor: enterpriseActor(r)})
	if err != nil {
		_ = h.users.kc.UpdateUser(r.Context(), token.AccessToken, h.users.cfg.KeycloakRealm, gocloak.User{ID: gocloak.StringP(keycloakID), Enabled: gocloak.BoolP(false)})
		http.Error(w, "Pengguna gagal dipulihkan", 500)
		return
	}
	enterpriseAudit(r, "User", "RESTORE", chi.URLParam(r, "id"), updated)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *EnterpriseHandler) createNotification(ctx context.Context, recipient, key, title, message, target string) error {
	_, err := h.pool.Exec(ctx, `INSERT INTO user_notifications(recipient_keycloak_id,notification_key,title,message,target_path) VALUES($1,$2,$3,$4,NULLIF($5,'')) ON CONFLICT(recipient_keycloak_id,notification_key) DO NOTHING`, recipient, key, title, message, target)
	return err
}

func (h *EnterpriseHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(), `SELECT id::text,title,message,COALESCE(target_path,''),CASE WHEN read_at IS NULL THEN NULL ELSE read_at::text END,created_at::text FROM user_notifications WHERE recipient_keycloak_id=$1 AND (expires_at IS NULL OR expires_at>NOW()) ORDER BY created_at DESC LIMIT 30`, enterpriseActor(r))
	if err != nil {
		http.Error(w, "Notifikasi belum dapat dimuat", 500)
		return
	}
	defer rows.Close()
	items := make([]notificationView, 0)
	for rows.Next() {
		var item notificationView
		if rows.Scan(&item.ID, &item.Title, &item.Message, &item.TargetPath, &item.ReadAt, &item.CreatedAt) != nil {
			http.Error(w, "Notifikasi belum dapat dimuat", 500)
			return
		}
		items = append(items, item)
	}
	var unread int64
	_ = h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM user_notifications WHERE recipient_keycloak_id=$1 AND read_at IS NULL AND (expires_at IS NULL OR expires_at>NOW())`, enterpriseActor(r)).Scan(&unread)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": items, "unread_count": unread})
}

func (h *EnterpriseHandler) MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	command, err := h.pool.Exec(r.Context(), `UPDATE user_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND recipient_keycloak_id=$2`, chi.URLParam(r, "id"), enterpriseActor(r))
	if err != nil || command.RowsAffected() == 0 {
		http.Error(w, "Notifikasi tidak ditemukan", 404)
		return
	}
	w.WriteHeader(204)
}
func (h *EnterpriseHandler) MarkAllNotificationsRead(w http.ResponseWriter, r *http.Request) {
	_, err := h.pool.Exec(r.Context(), `UPDATE user_notifications SET read_at=COALESCE(read_at,NOW()) WHERE recipient_keycloak_id=$1`, enterpriseActor(r))
	if err != nil {
		http.Error(w, "Notifikasi gagal ditandai", 500)
		return
	}
	w.WriteHeader(204)
}

func isUniqueViolation(err error) bool {
	var databaseError *pgconn.PgError
	return errors.As(err, &databaseError) && databaseError.Code == "23505"
}
