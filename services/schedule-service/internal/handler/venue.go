package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/db"
)

type VenueHandler struct {
	queries *db.Queries
}

func NewVenueHandler(queries *db.Queries) *VenueHandler {
	return &VenueHandler{queries: queries}
}

func publishAudit(entityName, action, entityID string, payload interface{}) {
	event := map[string]interface{}{
		"service_name": "schedule-service",
		"entity_name":  entityName,
		"entity_id":    entityID,
		"action":       action,
		"payload":      payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.schedule."+action, data)
}

func (h *VenueHandler) CreateVenue(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Address  string `json:"address"`
		Capacity int32  `json:"capacity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	venue, err := h.queries.CreateVenue(r.Context(), db.CreateVenueParams{
		Name:     req.Name,
		Address:  pgtype.Text{String: req.Address, Valid: req.Address != ""},
		Capacity: pgtype.Int4{Int32: req.Capacity, Valid: req.Capacity > 0},
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var uuidStr string
	if venue.ID.Valid {
		b, _ := venue.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit("Venue", "CREATE", uuidStr, venue)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(venue)
}

func (h *VenueHandler) ListVenues(w http.ResponseWriter, r *http.Request) {
	venues, err := h.queries.ListVenues(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(venues)
}

func (h *VenueHandler) GetVenue(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	venue, err := h.queries.GetVenueByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "Venue not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(venue)
}

func (h *VenueHandler) UpdateVenue(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req struct {
		Name     string `json:"name"`
		Address  string `json:"address"`
		Capacity int32  `json:"capacity"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	venue, err := h.queries.UpdateVenue(r.Context(), db.UpdateVenueParams{
		ID:      uuid,
		Column2: req.Name,
		Column3: req.Address,
		Column4: req.Capacity,
	})
	if err != nil {
		http.Error(w, "Failed to update venue", http.StatusInternalServerError)
		return
	}

	publishAudit("Venue", "UPDATE", id, venue)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(venue)
}

func (h *VenueHandler) DeleteVenue(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteVenue(r.Context(), uuid); err != nil {
		http.Error(w, "Failed to delete venue", http.StatusInternalServerError)
		return
	}

	publishAudit("Venue", "DELETE", id, map[string]string{"id": id})
	w.WriteHeader(http.StatusNoContent)
}
