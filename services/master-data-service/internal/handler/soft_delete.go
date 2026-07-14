package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

const defaultDeleteReason = "Diarsipkan melalui Admin Web"

type softDeleteRequest struct {
	Reason string `json:"reason"`
}

func (h *MasterDataHandler) hasActiveScheduleReference(ctx context.Context, resource, id string) (bool, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, h.scheduleURL+"/references/"+resource+"/"+id, nil)
	if err != nil {
		return false, err
	}
	response, err := h.httpClient.Do(request)
	if err != nil {
		return false, err
	}
	defer response.Body.Close()
	var payload struct {
		Referenced bool `json:"referenced"`
	}
	if response.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, response.Body)
		return false, errors.New("schedule reference endpoint failed")
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return false, err
	}
	return payload.Referenced, nil
}

func deletionMetadata(w http.ResponseWriter, r *http.Request) (actor, reason string, ok bool) {
	actor = strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return "", "", false
	}

	var request softDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, "Payload alasan penghapusan tidak valid", http.StatusBadRequest)
		return "", "", false
	}
	reason = strings.TrimSpace(request.Reason)
	if reason == "" {
		reason = defaultDeleteReason
	}
	return actor, reason, true
}

func resourceID(w http.ResponseWriter, r *http.Request) (pgtype.UUID, string, bool) {
	idText := chi.URLParam(r, "id")
	var id pgtype.UUID
	if err := id.Scan(idText); err != nil {
		http.Error(w, "ID tidak valid", http.StatusBadRequest)
		return pgtype.UUID{}, idText, false
	}
	return id, idText, true
}

func handleSoftDelete(w http.ResponseWriter, r *http.Request, queries *db.Queries, entityType, entityName string) {
	id, idText, ok := resourceID(w, r)
	if !ok {
		return
	}
	actor, reason, ok := deletionMetadata(w, r)
	if !ok {
		return
	}

	record, changed, err := queries.SoftDeleteEntity(r.Context(), entityType, id, actor, reason)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, entityName+" tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal mengarsipkan "+entityName, http.StatusInternalServerError)
		return
	}
	if changed {
		publishAudit(entityName, "SOFT_DELETE", idText, map[string]interface{}{
			"actor": actor, "reason": reason, "request_id": r.Header.Get("X-Request-ID"), "record": record,
		})
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *MasterDataHandler) ListDeleted(w http.ResponseWriter, r *http.Request) {
	if strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}
	records, err := h.queries.ListDeletedEntities(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil Recycle Bin", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(records)
}

func (h *MasterDataHandler) RestoreDeleted(w http.ResponseWriter, r *http.Request) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}
	entityType := chi.URLParam(r, "entity")
	id, idText, ok := resourceID(w, r)
	if !ok {
		return
	}
	record, changed, err := h.queries.RestoreEntity(r.Context(), entityType, id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Data arsip tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memulihkan data: "+err.Error(), http.StatusConflict)
		return
	}
	if changed {
		publishAudit(entityType, "RESTORE", idText, map[string]interface{}{
			"actor": actor, "request_id": r.Header.Get("X-Request-ID"), "tombstone": record,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"restored": changed, "data": record})
}

// SECURITY: ServeMedia menolak file yang telah diarsipkan dari URL publik.
func (h *MasterDataHandler) ServeMedia(w http.ResponseWriter, r *http.Request) {
	fileName := chi.URLParam(r, "fileName")
	decodedName, err := url.PathUnescape(fileName)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	fileName = decodedName
	if fileName == "" || filepath.Base(fileName) != fileName || strings.ContainsAny(fileName, `/\`) {
		http.NotFound(w, r)
		return
	}
	fileURL := "/uploads/" + fileName
	active, err := h.queries.IsActiveMediaURL(r.Context(), fileURL)
	if err != nil || !active {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=300")
	http.ServeFile(w, r, filepath.Join("./uploads", fileName))
}
