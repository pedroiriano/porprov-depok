package handler

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/medal-standing-service/internal/db"
)

type MedalHandler struct {
	queries *db.Queries
}

func NewMedalHandler(queries *db.Queries) *MedalHandler {
	return &MedalHandler{queries: queries}
}

func (h *MedalHandler) AddMedal(w http.ResponseWriter, r *http.Request) {
	var req struct {
		KontingenID string `json:"kontingen_id"`
		Gold        int32  `json:"gold"`
		Silver      int32  `json:"silver"`
		Bronze      int32  `json:"bronze"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var kontingenUUID pgtype.UUID
	if err := kontingenUUID.Scan(req.KontingenID); err != nil {
		http.Error(w, "Invalid kontingen_id", http.StatusBadRequest)
		return
	}

	medal, err := h.queries.AddMedal(r.Context(), db.AddMedalParams{
		KontingenID: kontingenUUID,
		Gold:        pgtype.Int4{Int32: req.Gold, Valid: true},
		Silver:      pgtype.Int4{Int32: req.Silver, Valid: true},
		Bronze:      pgtype.Int4{Int32: req.Bronze, Valid: true},
	})
	if err != nil {
		http.Error(w, "Failed to add medal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Publish realtime event
	event := map[string]interface{}{
		"action": "MEDAL_UPDATE",
		"data":   medal,
	}
	eventBytes, _ := json.Marshal(event)
	messaging.PublishEvent("realtime.medals", eventBytes)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(medal)
}

func (h *MedalHandler) GetStandings(w http.ResponseWriter, r *http.Request) {
	standings, err := h.queries.GetMedalStandings(r.Context())
	if err != nil {
		http.Error(w, "Failed to get standings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(standings)
}
