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

func matchDeletionMetadata(w http.ResponseWriter, r *http.Request) (actor, reason string, ok bool) {
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

func matchID(w http.ResponseWriter, r *http.Request) (pgtype.UUID, string, bool) {
	idText := chi.URLParam(r, "id")
	var id pgtype.UUID
	if err := id.Scan(idText); err != nil {
		http.Error(w, "ID jadwal tidak valid", http.StatusBadRequest)
		return pgtype.UUID{}, idText, false
	}
	return id, idText, true
}

func (h *MatchHandler) ListDeletedMatches(w http.ResponseWriter, r *http.Request) {
	if strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}
	records, err := h.queries.ListDeletedMatches(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil Recycle Bin jadwal", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(records)
}

func (h *MatchHandler) RestoreMatch(w http.ResponseWriter, r *http.Request) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}
	id, idText, ok := matchID(w, r)
	if !ok {
		return
	}
	nomorTandingID, venueID, err := h.queries.GetMatchReferencesIncludingDeleted(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Jadwal tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memvalidasi referensi jadwal", http.StatusInternalServerError)
		return
	}
	nomorText, _ := nomorTandingID.MarshalJSON()
	venueText, _ := venueID.MarshalJSON()
	nomorExists, nomorErr := h.referenceExists(r.Context(), h.masterDataURL+"/nomor-tandings/"+strings.Trim(string(nomorText), `"`))
	venueExists, venueErr := h.referenceExists(r.Context(), h.venueURL+"/"+strings.Trim(string(venueText), `"`))
	if nomorErr != nil || venueErr != nil {
		http.Error(w, "Service referensi tidak tersedia", http.StatusServiceUnavailable)
		return
	}
	if !nomorExists || !venueExists {
		http.Error(w, "Pulihkan nomor pertandingan dan venue terlebih dahulu", http.StatusConflict)
		return
	}
	record, changed, err := h.queries.RestoreMatch(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Jadwal tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memulihkan jadwal: "+err.Error(), http.StatusConflict)
		return
	}
	if changed {
		publishAudit("Match", "RESTORE", idText, map[string]interface{}{"actor": actor, "request_id": r.Header.Get("X-Request-ID"), "tombstone": record})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"restored": changed, "data": record})
}

func (h *MatchHandler) ActiveVenueReference(w http.ResponseWriter, r *http.Request) {
	h.activeReference(w, r, h.queries.HasActiveMatchForVenue)
}

func (h *MatchHandler) ActiveNomorTandingReference(w http.ResponseWriter, r *http.Request) {
	h.activeReference(w, r, h.queries.HasActiveMatchForNomorTanding)
}

func (h *MatchHandler) activeReference(w http.ResponseWriter, r *http.Request, check func(context.Context, pgtype.UUID) (bool, error)) {
	var id pgtype.UUID
	if err := id.Scan(chi.URLParam(r, "id")); err != nil {
		http.Error(w, "ID referensi tidak valid", http.StatusBadRequest)
		return
	}
	referenced, err := check(r.Context(), id)
	if err != nil {
		http.Error(w, "Gagal memeriksa referensi", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"referenced": referenced})
}
