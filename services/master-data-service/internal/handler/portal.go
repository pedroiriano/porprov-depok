package handler

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

type portalDatabase interface {
	Begin(context.Context) (pgx.Tx, error)
	QueryRow(context.Context, string, ...any) pgx.Row
	Query(context.Context, string, ...any) (pgx.Rows, error)
}
type PortalHandler struct {
	pool  portalDatabase
	proof string
}
type portalState struct {
	Version          int64           `json:"version"`
	Draft            portal.Document `json:"draft"`
	Published        portal.Document `json:"published"`
	PublishedVersion int64           `json:"published_version"`
}

func NewPortalHandler(pool *pgxpool.Pool) *PortalHandler {
	return &PortalHandler{pool: pool, proof: portal.ManagementProof(os.Getenv("INTERNAL_STREAM_TOKEN"))}
}
func portalJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func portalFailure(w http.ResponseWriter, err error) {
	log.Printf("Portal operation failed: %v", err)
	portalJSON(w, 503, map[string]string{"message": "Pengelolaan portal sementara tidak tersedia"})
}
func (h *PortalHandler) authorized(w http.ResponseWriter, r *http.Request) bool {
	supplied := r.Header.Get("X-Portal-Authorization")
	if h.proof == "" || subtle.ConstantTimeCompare([]byte(supplied), []byte(h.proof)) != 1 || strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" || strings.TrimSpace(r.Header.Get("X-Actor-Username")) == "" {
		portalJSON(w, 403, map[string]string{"message": "Hanya Super Admin aktif yang dapat mengelola portal"})
		return false
	}
	return true
}
func (h *PortalHandler) read(ctx context.Context) (portalState, error) {
	s := portalState{Draft: portal.Default(), Published: portal.Default()}
	var draft, published []byte
	err := h.pool.QueryRow(ctx, "SELECT version,draft,published,published_version FROM portal_configuration WHERE id=1").Scan(&s.Version, &draft, &published, &s.PublishedVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		return s, nil
	}
	if err != nil {
		return s, err
	}
	if err = json.Unmarshal(draft, &s.Draft); err != nil {
		return s, err
	}
	err = json.Unmarshal(published, &s.Published)
	if err == nil {
		s.Draft.NormalizeLegacy()
		s.Published.NormalizeLegacy()
	}
	return s, err
}
func (h *PortalHandler) LoadPublished(ctx context.Context) (portal.Document, error) {
	s, err := h.read(ctx)
	d := s.Published.Public()
	d.Version = s.PublishedVersion
	return d, err
}
func (h *PortalHandler) Public(w http.ResponseWriter, r *http.Request) {
	d, err := h.LoadPublished(r.Context())
	if err != nil {
		portalFailure(w, err)
		return
	}
	portalJSON(w, 200, d)
}
func (h *PortalHandler) Manage(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(w, r) {
		return
	}
	s, err := h.read(r.Context())
	if err != nil {
		portalFailure(w, err)
		return
	}
	portalJSON(w, 200, s)
}

type portalChange struct {
	ExpectedVersion int64           `json:"expected_version"`
	Document        portal.Document `json:"document"`
	Reason          string          `json:"reason"`
	RevisionID      int64           `json:"revision_id"`
}

func decodePortalChange(w http.ResponseWriter, r *http.Request) (portalChange, bool) {
	var v portalChange
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 768<<10))
	d.DisallowUnknownFields()
	if err := d.Decode(&v); err != nil {
		portalJSON(w, 400, map[string]string{"message": "Format perubahan portal tidak valid"})
		return v, false
	}
	var extra any
	if d.Decode(&extra) != io.EOF {
		portalJSON(w, 400, map[string]string{"message": "Hanya satu dokumen JSON diizinkan"})
		return v, false
	}
	v.Reason = strings.TrimSpace(v.Reason)
	if v.ExpectedVersion < 0 || len([]rune(v.Reason)) < 5 || len([]rune(v.Reason)) > 500 {
		portalJSON(w, 422, map[string]string{"message": "Alasan perubahan wajib 5–500 karakter dan versi harus valid"})
		return v, false
	}
	return v, true
}
func (h *PortalHandler) Change(action string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.authorized(w, r) {
			return
		}
		change, ok := decodePortalChange(w, r)
		if !ok {
			return
		}
		tx, err := h.pool.Begin(r.Context())
		if err != nil {
			portalFailure(w, err)
			return
		}
		defer tx.Rollback(r.Context())
		initial, _ := json.Marshal(portal.Default())
		_, err = tx.Exec(r.Context(), `INSERT INTO portal_configuration(id,version,draft,published,updated_by) VALUES(1,0,$1,$1,$2) ON CONFLICT(id) DO NOTHING`, initial, r.Header.Get("X-Actor-ID"))
		if err != nil {
			portalFailure(w, err)
			return
		}
		var current int64
		var raw []byte
		err = tx.QueryRow(r.Context(), "SELECT version,draft FROM portal_configuration WHERE id=1 FOR UPDATE").Scan(&current, &raw)
		if err != nil {
			portalFailure(w, err)
			return
		}
		if current != change.ExpectedVersion {
			portalJSON(w, 409, map[string]any{"message": "Konfigurasi berubah di sesi lain. Muat versi terbaru sebelum menyimpan.", "current_version": current})
			return
		}
		document := change.Document
		if action == "SAVE_DRAFT" && document.Features == nil {
			// SECURITY: Older clients preserve locked feature flags; omission cannot reactivate a disabled feature.
			var previous portal.Document
			if err = json.Unmarshal(raw, &previous); err != nil {
				portalFailure(w, err)
				return
			}
			previous.NormalizeLegacy()
			document.Features = previous.Features
		}
		if action == "PUBLISH" {
			if err = json.Unmarshal(raw, &document); err != nil {
				portalFailure(w, err)
				return
			}
		}
		if action == "RESTORE" {
			if change.RevisionID <= 0 {
				portalJSON(w, 422, map[string]string{"message": "Pilih riwayat yang akan dipulihkan"})
				return
			}
			err = tx.QueryRow(r.Context(), "SELECT document FROM portal_revisions WHERE id=$1", change.RevisionID).Scan(&raw)
			if errors.Is(err, pgx.ErrNoRows) {
				portalJSON(w, 404, map[string]string{"message": "Riwayat tidak ditemukan"})
				return
			}
			if err != nil {
				portalFailure(w, err)
				return
			}
			if err = json.Unmarshal(raw, &document); err != nil {
				portalFailure(w, err)
				return
			}
		}
		document.NormalizeLegacy()
		if err = document.Validate(); err != nil {
			portalJSON(w, 422, map[string]string{"message": err.Error()})
			return
		}
		// SECURITY: Every Media Library reference must still be active before draft/publication.
		for _, page := range document.Pages {
			for _, section := range page.Sections {
				if section.ImageURL != "" && section.Enabled && page.Status != "archived" {
					var exists bool
					err = tx.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM media_assets WHERE file_url=$1 AND deleted_at IS NULL AND mime_type LIKE 'image/%')", section.ImageURL).Scan(&exists)
					if err != nil {
						portalFailure(w, err)
						return
					}
					if !exists {
						portalJSON(w, 422, map[string]string{"message": "Gambar harus berasal dari Pustaka Media aktif"})
						return
					}
				}
			}
		}
		version := current + 1
		document.Version = version
		raw, _ = json.Marshal(document)
		query := `UPDATE portal_configuration SET version=$1,draft=$2,updated_by=$3,updated_at=now() WHERE id=1`
		if action == "PUBLISH" {
			query = `UPDATE portal_configuration SET version=$1,draft=$2,published=$2,published_version=$1,updated_by=$3,updated_at=now() WHERE id=1`
		}
		if _, err = tx.Exec(r.Context(), query, version, raw, r.Header.Get("X-Actor-ID")); err != nil {
			portalFailure(w, err)
			return
		}
		var revision int64
		err = tx.QueryRow(r.Context(), `INSERT INTO portal_revisions(version,action,document,actor_id,actor_username,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`, version, action, raw, r.Header.Get("X-Actor-ID"), r.Header.Get("X-Actor-Username"), change.Reason).Scan(&revision)
		if err != nil {
			portalFailure(w, err)
			return
		}
		randomID := make([]byte, 16)
		if _, err = rand.Read(randomID); err != nil {
			portalFailure(w, err)
			return
		}
		randomID[6] = (randomID[6] & 15) | 64
		randomID[8] = (randomID[8] & 63) | 128
		eventID := fmt.Sprintf("%x-%x-%x-%x-%x", randomID[:4], randomID[4:6], randomID[6:8], randomID[8:10], randomID[10:])
		event := map[string]any{"eventId": eventID, "eventVersion": "1.0", "eventType": "audit.portal." + strings.ToLower(action), "service_name": "master-data-service", "entity_name": "PortalConfiguration", "entity_id": "00000000-0000-0000-0000-000000000001", "action": action, "actor": r.Header.Get("X-Actor-ID"), "actor_id": r.Header.Get("X-Actor-ID"), "actor_username": r.Header.Get("X-Actor-Username"), "requestId": r.Header.Get("X-Request-ID"), "payload": map[string]any{"version": version, "revision_id": revision, "reason": change.Reason}}
		payload, _ := json.Marshal(event)
		if _, err = tx.Exec(r.Context(), "INSERT INTO portal_outbox(event_id,payload) VALUES($1,$2)", eventID, payload); err != nil {
			portalFailure(w, err)
			return
		}
		if err = tx.Commit(r.Context()); err != nil {
			portalFailure(w, err)
			return
		}
		portalJSON(w, 200, map[string]any{"version": version, "revision_id": revision, "message": "Perubahan portal tersimpan"})
	}
}
func (h *PortalHandler) History(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(w, r) {
		return
	}
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	if page > 100000 {
		portalJSON(w, 400, map[string]string{"message": "Halaman riwayat tidak valid"})
		return
	}
	var total int
	err := h.pool.QueryRow(r.Context(), "SELECT count(*) FROM portal_revisions").Scan(&total)
	if err != nil {
		portalFailure(w, err)
		return
	}
	rows, err := h.pool.Query(r.Context(), "SELECT id,version,action,actor_username,reason,created_at FROM portal_revisions ORDER BY id DESC LIMIT 20 OFFSET $1", (page-1)*20)
	if err != nil {
		portalFailure(w, err)
		return
	}
	defer rows.Close()
	data := []map[string]any{}
	for rows.Next() {
		var id, version int64
		var action, actor, reason string
		var at time.Time
		if err = rows.Scan(&id, &version, &action, &actor, &reason, &at); err != nil {
			portalFailure(w, err)
			return
		}
		data = append(data, map[string]any{"id": id, "version": version, "action": action, "actor_username": actor, "reason": reason, "created_at": at})
	}
	if err = rows.Err(); err != nil {
		portalFailure(w, err)
		return
	}
	portalJSON(w, 200, map[string]any{"data": data, "page": page, "per_page": 20, "total": total})
}
func (h *PortalHandler) Revision(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(w, r) {
		return
	}
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		portalJSON(w, 400, map[string]string{"message": "Identitas riwayat tidak valid"})
		return
	}
	var data []byte
	err = h.pool.QueryRow(r.Context(), "SELECT document FROM portal_revisions WHERE id=$1", id).Scan(&data)
	if errors.Is(err, pgx.ErrNoRows) {
		portalJSON(w, 404, map[string]string{"message": "Riwayat tidak ditemukan"})
		return
	}
	if err != nil {
		portalFailure(w, err)
		return
	}
	portalJSON(w, 200, json.RawMessage(data))
}

// RELIABILITY: At-least-once durable audit outbox; broker failures remain queued with backoff.
func (h *PortalHandler) RunOutbox(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if messaging.GetJetStream() == nil {
				continue
			}
			tx, err := h.pool.Begin(ctx)
			if err != nil {
				continue
			}
			var id int64
			var eventID string
			var payload []byte
			err = tx.QueryRow(ctx, "SELECT id,event_id,payload FROM portal_outbox WHERE published_at IS NULL AND available_at<=now() ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED").Scan(&id, &eventID, &payload)
			if err != nil {
				_ = tx.Rollback(ctx)
				continue
			}
			message := &nats.Msg{Subject: "audit.portal.configuration", Data: payload, Header: nats.Header{}}
			message.Header.Set("Nats-Msg-Id", eventID)
			_, err = messaging.GetJetStream().PublishMsg(message, nats.Context(ctx))
			if err == nil {
				_, err = tx.Exec(ctx, "UPDATE portal_outbox SET published_at=now(),attempts=attempts+1 WHERE id=$1", id)
			} else {
				_, err = tx.Exec(ctx, "UPDATE portal_outbox SET attempts=attempts+1,available_at=now()+least(attempts+1,60)*interval '5 seconds' WHERE id=$1", id)
			}
			if err == nil {
				err = tx.Commit(ctx)
			} else {
				_ = tx.Rollback(ctx)
			}
			if err != nil {
				log.Printf("Portal outbox retry: %s", fmt.Sprint(err))
			}
		}
	}
}
