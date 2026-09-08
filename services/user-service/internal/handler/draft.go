package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
)

const (
	maxDraftPayloadBytes = 256 << 10
	draftRetentionDays   = 7
)

var (
	draftKeyPattern         = regexp.MustCompile(`^[A-Za-z0-9/_:.?=&-]{1,255}$`)
	formVersionPattern      = regexp.MustCompile(`^[A-Za-z0-9._-]{1,80}$`)
	errDraftNotFound        = errors.New("draft not found")
	errDraftVersionConflict = errors.New("draft version conflict")
	sensitiveDraftKey       = regexp.MustCompile(`(?i)(password|passphrase|secret|token|credential|authorization|cookie|private[_-]?key|file[_-]?(data|bytes|content|raw))`)
)

type FormDraft struct {
	ID          string          `json:"id"`
	RouteKey    string          `json:"route_key"`
	EntityKey   string          `json:"entity_key"`
	FormVersion string          `json:"form_version"`
	Payload     json.RawMessage `json:"payload"`
	Version     int64           `json:"version"`
	UpdatedAt   time.Time       `json:"updated_at"`
	ExpiresAt   time.Time       `json:"expires_at"`
}

type saveDraftRequest struct {
	RouteKey        string          `json:"route_key"`
	EntityKey       string          `json:"entity_key"`
	FormVersion     string          `json:"form_version"`
	Payload         json.RawMessage `json:"payload"`
	ExpectedVersion int64           `json:"expected_version"`
}

type draftStore interface {
	Get(context.Context, string, string, string, string) (FormDraft, error)
	Save(context.Context, string, saveDraftRequest, time.Time) (FormDraft, error)
	Delete(context.Context, string, string, string, string) (bool, error)
	DeleteExpired(context.Context) error
}

type pgxDraftStore struct{ pool *pgxpool.Pool }

func (s *pgxDraftStore) Get(ctx context.Context, actor, route, entity, formVersion string) (FormDraft, error) {
	var draft FormDraft
	err := s.pool.QueryRow(ctx, `
		SELECT id::text, route_key, entity_key, form_version, payload, version, updated_at, expires_at
		FROM form_drafts
		WHERE actor_id=$1 AND route_key=$2 AND entity_key=$3 AND form_version=$4 AND expires_at > NOW()`,
		actor, route, entity, formVersion,
	).Scan(&draft.ID, &draft.RouteKey, &draft.EntityKey, &draft.FormVersion, &draft.Payload, &draft.Version, &draft.UpdatedAt, &draft.ExpiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return FormDraft{}, errDraftNotFound
	}
	return draft, err
}

func (s *pgxDraftStore) Save(ctx context.Context, actor string, request saveDraftRequest, expiresAt time.Time) (FormDraft, error) {
	var draft FormDraft
	if request.ExpectedVersion == 0 {
		err := s.pool.QueryRow(ctx, `
			INSERT INTO form_drafts(actor_id,route_key,entity_key,form_version,payload,expires_at)
			VALUES($1,$2,$3,$4,$5,$6)
			ON CONFLICT (actor_id,route_key,entity_key,form_version) DO NOTHING
			RETURNING id::text,route_key,entity_key,form_version,payload,version,updated_at,expires_at`,
			actor, request.RouteKey, request.EntityKey, request.FormVersion, request.Payload, expiresAt,
		).Scan(&draft.ID, &draft.RouteKey, &draft.EntityKey, &draft.FormVersion, &draft.Payload, &draft.Version, &draft.UpdatedAt, &draft.ExpiresAt)
		if errors.Is(err, pgx.ErrNoRows) {
			return FormDraft{}, errDraftVersionConflict
		}
		return draft, err
	}
	err := s.pool.QueryRow(ctx, `
		UPDATE form_drafts SET payload=$5,version=version+1,updated_at=NOW(),expires_at=$6
		WHERE actor_id=$1 AND route_key=$2 AND entity_key=$3 AND form_version=$4 AND version=$7 AND expires_at > NOW()
		RETURNING id::text,route_key,entity_key,form_version,payload,version,updated_at,expires_at`,
		actor, request.RouteKey, request.EntityKey, request.FormVersion, request.Payload, expiresAt, request.ExpectedVersion,
	).Scan(&draft.ID, &draft.RouteKey, &draft.EntityKey, &draft.FormVersion, &draft.Payload, &draft.Version, &draft.UpdatedAt, &draft.ExpiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return FormDraft{}, errDraftVersionConflict
	}
	return draft, err
}

func (s *pgxDraftStore) Delete(ctx context.Context, actor, route, entity, formVersion string) (bool, error) {
	result, err := s.pool.Exec(ctx, `DELETE FROM form_drafts WHERE actor_id=$1 AND route_key=$2 AND entity_key=$3 AND form_version=$4`, actor, route, entity, formVersion)
	return result.RowsAffected() > 0, err
}

func (s *pgxDraftStore) DeleteExpired(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM form_drafts WHERE expires_at <= NOW()`)
	return err
}

type DraftHandler struct{ store draftStore }

func NewDraftHandler(pool *pgxpool.Pool) *DraftHandler {
	return &DraftHandler{store: &pgxDraftStore{pool: pool}}
}

func validateDraftKey(value string, version bool) bool {
	if version {
		return formVersionPattern.MatchString(value)
	}
	return draftKeyPattern.MatchString(value)
}

func containsSensitiveDraftField(value any) bool {
	switch typed := value.(type) {
	case map[string]any:
		for key, nested := range typed {
			if sensitiveDraftKey.MatchString(key) || containsSensitiveDraftField(nested) {
				return true
			}
		}
	case []any:
		for _, nested := range typed {
			if containsSensitiveDraftField(nested) {
				return true
			}
		}
	}
	return false
}

func actorForDraft(r *http.Request) string { return strings.TrimSpace(r.Header.Get("X-Actor-ID")) }

func writeDraftJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func draftKeysFromQuery(r *http.Request) (string, string, string, bool) {
	route := strings.TrimSpace(r.URL.Query().Get("route"))
	entity := strings.TrimSpace(r.URL.Query().Get("entity"))
	version := strings.TrimSpace(r.URL.Query().Get("form_version"))
	return route, entity, version, validateDraftKey(route, false) && validateDraftKey(entity, false) && validateDraftKey(version, true)
}

func (h *DraftHandler) Get(w http.ResponseWriter, r *http.Request) {
	actor := actorForDraft(r)
	if actor == "" {
		http.Error(w, "authenticated actor is required", http.StatusUnauthorized)
		return
	}
	route, entity, version, valid := draftKeysFromQuery(r)
	if !valid {
		http.Error(w, "invalid draft key", http.StatusUnprocessableEntity)
		return
	}
	_ = h.store.DeleteExpired(r.Context())
	draft, err := h.store.Get(r.Context(), actor, route, entity, version)
	if errors.Is(err, errDraftNotFound) {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if err != nil {
		http.Error(w, "draft is temporarily unavailable", http.StatusInternalServerError)
		return
	}
	writeDraftJSON(w, http.StatusOK, draft)
}

func (h *DraftHandler) Save(w http.ResponseWriter, r *http.Request) {
	actor := actorForDraft(r)
	if actor == "" {
		http.Error(w, "authenticated actor is required", http.StatusUnauthorized)
		return
	}
	var request saveDraftRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxDraftPayloadBytes+4096))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "invalid draft payload", http.StatusBadRequest)
		return
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		http.Error(w, "invalid draft payload", http.StatusBadRequest)
		return
	}
	request.RouteKey = strings.TrimSpace(request.RouteKey)
	request.EntityKey = strings.TrimSpace(request.EntityKey)
	request.FormVersion = strings.TrimSpace(request.FormVersion)
	if !validateDraftKey(request.RouteKey, false) || !validateDraftKey(request.EntityKey, false) || !validateDraftKey(request.FormVersion, true) || request.ExpectedVersion < 0 || len(request.Payload) == 0 || len(request.Payload) > maxDraftPayloadBytes {
		http.Error(w, "invalid draft payload", http.StatusUnprocessableEntity)
		return
	}
	var decoded any
	if json.Unmarshal(request.Payload, &decoded) != nil || containsSensitiveDraftField(decoded) {
		http.Error(w, "sensitive or invalid draft fields are not allowed", http.StatusUnprocessableEntity)
		return
	}
	if _, objectPayload := decoded.(map[string]any); !objectPayload {
		http.Error(w, "draft payload must be an object", http.StatusUnprocessableEntity)
		return
	}
	// INFO: Baris yang kedaluwarsa dibersihkan sebelum INSERT agar kunci unik
	// lama tidak membuat draf baru terjebak dalam konflik permanen.
	_ = h.store.DeleteExpired(r.Context())
	draft, err := h.store.Save(r.Context(), actor, request, time.Now().UTC().Add(draftRetentionDays*24*time.Hour))
	if errors.Is(err, errDraftVersionConflict) {
		current, currentErr := h.store.Get(r.Context(), actor, request.RouteKey, request.EntityKey, request.FormVersion)
		if currentErr != nil {
			http.Error(w, "draft changed on another device", http.StatusConflict)
			return
		}
		writeDraftJSON(w, http.StatusConflict, map[string]any{"code": "DRAFT_VERSION_CONFLICT", "message": "Draft telah berubah di perangkat lain.", "current": current})
		return
	}
	if err != nil {
		http.Error(w, "draft could not be saved", http.StatusInternalServerError)
		return
	}
	publishDraftAudit(r, "SAVED", draft)
	writeDraftJSON(w, http.StatusOK, draft)
}

func (h *DraftHandler) Delete(w http.ResponseWriter, r *http.Request) {
	actor := actorForDraft(r)
	if actor == "" {
		http.Error(w, "authenticated actor is required", http.StatusUnauthorized)
		return
	}
	route, entity, version, valid := draftKeysFromQuery(r)
	if !valid {
		http.Error(w, "invalid draft key", http.StatusUnprocessableEntity)
		return
	}
	deleted, err := h.store.Delete(r.Context(), actor, route, entity, version)
	if err != nil {
		http.Error(w, "draft could not be removed", http.StatusInternalServerError)
		return
	}
	if deleted {
		publishDraftAudit(r, "DELETED", FormDraft{RouteKey: route, EntityKey: entity, FormVersion: version})
	}
	w.WriteHeader(http.StatusNoContent)
}

func publishDraftAudit(r *http.Request, action string, draft FormDraft) {
	event := buildUserAuditEvent(r, action, draft.EntityKey, map[string]any{"route_key": draft.RouteKey, "entity_key": draft.EntityKey, "form_version": draft.FormVersion, "version": draft.Version, "expires_at": draft.ExpiresAt})
	event.EventType = "audit.form_draft." + strings.ToLower(action)
	event.EntityName = "FormDraft"
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.form_draft."+strings.ToLower(action), data)
}
