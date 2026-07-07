package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/db"
)

type MatchHandler struct {
	queries *db.Queries
}

func NewMatchHandler(queries *db.Queries) *MatchHandler {
	return &MatchHandler{queries: queries}
}

func (h *MatchHandler) CreateMatch(w http.ResponseWriter, r *http.Request) {
	var req struct {
		NomorTandingID string `json:"nomor_tanding_id"`
		VenueID        string `json:"venue_id"`
		MatchDate      string `json:"match_date"` // RFC3339
		Status         string `json:"status"`
		Round          string `json:"round"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	t, err := time.Parse(time.RFC3339, req.MatchDate)
	if err != nil {
		http.Error(w, "Invalid match_date format, use RFC3339", http.StatusBadRequest)
		return
	}

	var nomorTandingUUID, venueUUID pgtype.UUID
	nomorTandingUUID.Scan(req.NomorTandingID)
	venueUUID.Scan(req.VenueID)

	match, err := h.queries.CreateMatch(r.Context(), db.CreateMatchParams{
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

	var uuidStr string
	if match.ID.Valid {
		b, _ := match.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit("Match", "CREATE", uuidStr, match)

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

	var req struct {
		NomorTandingID string `json:"nomor_tanding_id"`
		VenueID        string `json:"venue_id"`
		MatchDate      string `json:"match_date"` // RFC3339
		Status         string `json:"status"`
		Round          string `json:"round"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var t time.Time
	if req.MatchDate != "" {
		t, _ = time.Parse(time.RFC3339, req.MatchDate)
	}

	var nomorTandingUUID, venueUUID pgtype.UUID
	if req.NomorTandingID != "" {
		nomorTandingUUID.Scan(req.NomorTandingID)
	}
	if req.VenueID != "" {
		venueUUID.Scan(req.VenueID)
	}

	match, err := h.queries.UpdateMatch(r.Context(), db.UpdateMatchParams{
		ID:      uuid,
		Column2: nomorTandingUUID,
		Column3: venueUUID,
		Column4: pgtype.Timestamptz{Time: t, Valid: !t.IsZero()},
		Column5: req.Status,
		Column6: req.Round,
	})
	if err != nil {
		http.Error(w, "Failed to update match", http.StatusInternalServerError)
		return
	}

	publishAudit("Match", "UPDATE", id, match)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(match)
}

func (h *MatchHandler) DeleteMatch(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteMatch(r.Context(), uuid); err != nil {
		http.Error(w, "Failed to delete match", http.StatusInternalServerError)
		return
	}

	publishAudit("Match", "DELETE", id, map[string]string{"id": id})
	w.WriteHeader(http.StatusNoContent)
}
