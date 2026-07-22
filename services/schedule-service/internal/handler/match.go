package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/db"
)

type MatchHandler struct {
	queries   *db.Queries
	txStarter interface {
		Begin(context.Context) (pgx.Tx, error)
	}
	masterDataURL string
	venueURL      string
	httpClient    *http.Client
}

func NewMatchHandler(queries *db.Queries, txStarter interface {
	Begin(context.Context) (pgx.Tx, error)
}, masterDataURL, venueURL string) *MatchHandler {
	return &MatchHandler{
		queries:       queries,
		txStarter:     txStarter,
		masterDataURL: strings.TrimRight(masterDataURL, "/"),
		venueURL:      strings.TrimRight(venueURL, "/"),
		httpClient:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (h *MatchHandler) referenceExists(ctx context.Context, endpoint string) (bool, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return false, err
	}
	response, err := h.httpClient.Do(request)
	if err != nil {
		return false, err
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, response.Body)
	if response.StatusCode == http.StatusNotFound {
		return false, nil
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return false, fmt.Errorf("reference service returned HTTP %d", response.StatusCode)
	}
	return true, nil
}

func (h *MatchHandler) CreateMatch(w http.ResponseWriter, r *http.Request) {
	var req matchRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.NomorTandingID == "" || req.VenueID == "" || req.Status == "" || req.Round == "" {
		http.Error(w, "nomor_tanding_id, venue_id, status, dan round wajib diisi", http.StatusUnprocessableEntity)
		return
	}

	t, err := time.Parse(time.RFC3339, req.MatchDate)
	if err != nil {
		http.Error(w, "Invalid match_date format, use RFC3339", http.StatusBadRequest)
		return
	}

	var nomorTandingUUID, venueUUID pgtype.UUID
	if err := nomorTandingUUID.Scan(req.NomorTandingID); err != nil {
		http.Error(w, "nomor_tanding_id tidak valid", http.StatusUnprocessableEntity)
		return
	}
	if err := venueUUID.Scan(req.VenueID); err != nil {
		http.Error(w, "venue_id tidak valid", http.StatusUnprocessableEntity)
		return
	}

	nomorExists, err := h.referenceExists(r.Context(), h.masterDataURL+"/nomor-tandings/"+req.NomorTandingID)
	if err != nil {
		http.Error(w, "Master Data Service tidak tersedia", http.StatusServiceUnavailable)
		return
	}
	venueExists, err := h.referenceExists(r.Context(), h.venueURL+"/"+req.VenueID)
	if err != nil {
		http.Error(w, "Venue Service tidak tersedia", http.StatusServiceUnavailable)
		return
	}
	if !nomorExists || !venueExists {
		http.Error(w, "Nomor pertandingan atau venue tidak ditemukan", http.StatusUnprocessableEntity)
		return
	}
	preparedParticipants, err := h.prepareParticipants(r.Context(), req.Participants)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	tx, err := h.txStarter.Begin(r.Context())
	if err != nil {
		http.Error(w, "Gagal memulai transaksi jadwal", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())
	txQueries := h.queries.WithTx(tx)
	match, err := txQueries.CreateMatch(r.Context(), db.CreateMatchParams{
		NomorTandingID: nomorTandingUUID,
		VenueID:        venueUUID,
		MatchDate:      pgtype.Timestamptz{Time: t, Valid: true},
		Status:         req.Status,
		Round:          req.Round,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if req.Participants != nil {
		if err := replaceMatchParticipants(r.Context(), txQueries, match.ID, preparedParticipants, actorID(r)); err != nil {
			http.Error(w, "Gagal menyimpan peserta pertandingan", http.StatusInternalServerError)
			return
		}
	}
	if err := tx.Commit(r.Context()); err != nil {
		http.Error(w, "Gagal menyelesaikan transaksi jadwal", http.StatusInternalServerError)
		return
	}

	var uuidStr string
	if match.ID.Valid {
		b, _ := match.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit("Match", "CREATE", uuidStr, map[string]interface{}{"match": match, "participant_count": len(preparedParticipants)})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(match)
}

func (h *MatchHandler) ListMatches(w http.ResponseWriter, r *http.Request) {
	matches, err := h.queries.ListMatches(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(matches)
}

func (h *MatchHandler) GetMatch(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	match, err := h.queries.GetMatchByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "Match not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(match)
}

func (h *MatchHandler) UpdateMatch(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req matchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Payload JSON tidak valid", http.StatusBadRequest)
		return
	}

	var t time.Time
	if req.MatchDate != "" {
		var err error
		t, err = time.Parse(time.RFC3339, req.MatchDate)
		if err != nil {
			http.Error(w, "Invalid match_date format, use RFC3339", http.StatusBadRequest)
			return
		}
	}

	var nomorTandingUUID, venueUUID pgtype.UUID
	if req.NomorTandingID != "" {
		if err := nomorTandingUUID.Scan(req.NomorTandingID); err != nil {
			http.Error(w, "nomor_tanding_id tidak valid", http.StatusUnprocessableEntity)
			return
		}
		exists, err := h.referenceExists(r.Context(), h.masterDataURL+"/nomor-tandings/"+req.NomorTandingID)
		if err != nil {
			http.Error(w, "Master Data Service tidak tersedia", http.StatusServiceUnavailable)
			return
		}
		if !exists {
			http.Error(w, "Nomor pertandingan tidak ditemukan", http.StatusUnprocessableEntity)
			return
		}
	}
	if req.VenueID != "" {
		if err := venueUUID.Scan(req.VenueID); err != nil {
			http.Error(w, "venue_id tidak valid", http.StatusUnprocessableEntity)
			return
		}
		exists, err := h.referenceExists(r.Context(), h.venueURL+"/"+req.VenueID)
		if err != nil {
			http.Error(w, "Venue Service tidak tersedia", http.StatusServiceUnavailable)
			return
		}
		if !exists {
			http.Error(w, "Venue tidak ditemukan", http.StatusUnprocessableEntity)
			return
		}
	}
	preparedParticipants, err := h.prepareParticipants(r.Context(), req.Participants)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	tx, err := h.txStarter.Begin(r.Context())
	if err != nil {
		http.Error(w, "Gagal memulai transaksi jadwal", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())
	txQueries := h.queries.WithTx(tx)
	match, err := txQueries.UpdateMatch(r.Context(), db.UpdateMatchParams{
		ID:      uuid,
		Column2: nomorTandingUUID,
		Column3: venueUUID,
		Column4: pgtype.Timestamptz{Time: t, Valid: !t.IsZero()},
		Column5: req.Status,
		Column6: req.Round,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Jadwal tidak ditemukan", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to update match", http.StatusInternalServerError)
		return
	}
	if req.Participants != nil {
		if err := replaceMatchParticipants(r.Context(), txQueries, uuid, preparedParticipants, actorID(r)); err != nil {
			http.Error(w, "Gagal memperbarui peserta pertandingan", http.StatusInternalServerError)
			return
		}
	}
	if err := tx.Commit(r.Context()); err != nil {
		http.Error(w, "Gagal menyelesaikan transaksi jadwal", http.StatusInternalServerError)
		return
	}

	publishAudit("Match", "UPDATE", id, map[string]interface{}{"match": match, "participant_count": len(preparedParticipants), "participants_replaced": req.Participants != nil})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(match)
}

func (h *MatchHandler) DeleteMatch(w http.ResponseWriter, r *http.Request) {
	id, idText, ok := matchID(w, r)
	if !ok {
		return
	}
	actor, reason, ok := matchDeletionMetadata(w, r)
	if !ok {
		return
	}
	record, changed, err := h.queries.SoftDeleteMatch(r.Context(), id, actor, reason)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Jadwal tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal mengarsipkan jadwal", http.StatusInternalServerError)
		return
	}
	if changed {
		publishAudit("Match", "SOFT_DELETE", idText, map[string]interface{}{"actor": actor, "reason": reason, "request_id": r.Header.Get("X-Request-ID"), "record": record})
	}
	w.WriteHeader(http.StatusNoContent)
}
