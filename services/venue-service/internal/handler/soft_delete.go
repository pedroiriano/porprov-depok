package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *VenueHandler) hasActiveScheduleReference(ctx context.Context, id string) (bool, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, h.scheduleURL+"/references/venue/"+id, nil)
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

func venueDeletionMetadata(w http.ResponseWriter, r *http.Request) (actor, reason string, ok bool) {
	actor = strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return "", "", false
	}
	var request struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, "Payload alasan penghapusan tidak valid", http.StatusBadRequest)
		return "", "", false
	}
	reason = strings.TrimSpace(request.Reason)
	if reason == "" {
		reason = "Diarsipkan melalui Admin Web"
	}
	return actor, reason, true
}

func venueID(w http.ResponseWriter, r *http.Request) (pgtype.UUID, string, bool) {
	idText := chi.URLParam(r, "id")
	var id pgtype.UUID
	if err := id.Scan(idText); err != nil {
		http.Error(w, "ID venue tidak valid", http.StatusBadRequest)
		return pgtype.UUID{}, idText, false
	}
	return id, idText, true
}

func (h *VenueHandler) ListDeletedVenues(w http.ResponseWriter, r *http.Request) {
	if strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}
	records, err := h.queries.ListDeletedVenues(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil Recycle Bin venue", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(records)
}

func (h *VenueHandler) RestoreVenue(w http.ResponseWriter, r *http.Request) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}
	id, idText, ok := venueID(w, r)
	if !ok {
		return
	}
	record, changed, err := h.queries.RestoreVenue(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Venue tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memulihkan venue: "+err.Error(), http.StatusConflict)
		return
	}
	if changed {
		publishAudit("Venue", "RESTORE", idText, map[string]interface{}{"actor": actor, "request_id": r.Header.Get("X-Request-ID"), "tombstone": record})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"restored": changed, "data": record})
}
