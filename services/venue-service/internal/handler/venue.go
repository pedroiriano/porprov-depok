package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/db"
)

type VenueHandler struct {
	queries     *db.Queries
	scheduleURL string
	httpClient  *http.Client
}

func NewVenueHandler(queries *db.Queries, scheduleURL string) *VenueHandler {
	return &VenueHandler{queries: queries, scheduleURL: strings.TrimRight(scheduleURL, "/"), httpClient: &http.Client{Timeout: 5 * time.Second}}
}

func publishAudit(entityName, action, entityID string, payload interface{}) {
	event := map[string]interface{}{
		"service_name": "venue-service",
		"entity_name":  entityName,
		"entity_id":    entityID,
		"action":       action,
		"payload":      payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.venue."+action, data)
}

func (h *VenueHandler) CreateVenue(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name            string   `json:"name"`
		ImageUrl        string   `json:"image_url"`
		Address         string   `json:"address"`
		Latitude        float64  `json:"latitude"`
		Longitude       float64  `json:"longitude"`
		MapRouteUrl     string   `json:"map_route_url"`
		CityGuideIds    []string `json:"city_guide_ids"`
		CaborIds        []string `json:"cabor_ids"`
		Capacity        int32    `json:"capacity"`
		Facilities      string   `json:"facilities"`
		ReadinessStatus string   `json:"readiness_status"`
		ContactPerson   string   `json:"contact_person"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var lat, lng pgtype.Numeric
	lat.Scan(strconv.FormatFloat(req.Latitude, 'f', -1, 64))
	lng.Scan(strconv.FormatFloat(req.Longitude, 'f', -1, 64))

	var cityGuideUUIDs []pgtype.UUID
	for _, id := range req.CityGuideIds {
		var u pgtype.UUID
		u.Scan(id)
		cityGuideUUIDs = append(cityGuideUUIDs, u)
	}

	var caborUUIDs []pgtype.UUID
	for _, id := range req.CaborIds {
		var u pgtype.UUID
		u.Scan(id)
		caborUUIDs = append(caborUUIDs, u)
	}

	venue, err := h.queries.CreateVenue(r.Context(), db.CreateVenueParams{
		Name:            req.Name,
		ImageUrl:        pgtype.Text{String: req.ImageUrl, Valid: req.ImageUrl != ""},
		Address:         pgtype.Text{String: req.Address, Valid: req.Address != ""},
		Latitude:        lat,
		Longitude:       lng,
		MapRouteUrl:     pgtype.Text{String: req.MapRouteUrl, Valid: req.MapRouteUrl != ""},
		CityGuideIds:    cityGuideUUIDs,
		CaborIds:        caborUUIDs,
		Capacity:        pgtype.Int4{Int32: req.Capacity, Valid: req.Capacity > 0},
		Facilities:      pgtype.Text{String: req.Facilities, Valid: req.Facilities != ""},
		ReadinessStatus: pgtype.Text{String: req.ReadinessStatus, Valid: req.ReadinessStatus != ""},
		ContactPerson:   pgtype.Text{String: req.ContactPerson, Valid: req.ContactPerson != ""},
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

	// Ensure JSON returns empty array not null
	if venues == nil {
		venues = []db.Venue{}
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
		Name            string   `json:"name"`
		ImageUrl        string   `json:"image_url"`
		Address         string   `json:"address"`
		Latitude        float64  `json:"latitude"`
		Longitude       float64  `json:"longitude"`
		MapRouteUrl     string   `json:"map_route_url"`
		CityGuideIds    []string `json:"city_guide_ids"`
		CaborIds        []string `json:"cabor_ids"`
		Capacity        int32    `json:"capacity"`
		Facilities      string   `json:"facilities"`
		ReadinessStatus string   `json:"readiness_status"`
		ContactPerson   string   `json:"contact_person"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var lat, lng pgtype.Numeric
	lat.Scan(strconv.FormatFloat(req.Latitude, 'f', -1, 64))
	lng.Scan(strconv.FormatFloat(req.Longitude, 'f', -1, 64))

	var cityGuideUUIDs []pgtype.UUID
	for _, cid := range req.CityGuideIds {
		var u pgtype.UUID
		u.Scan(cid)
		cityGuideUUIDs = append(cityGuideUUIDs, u)
	}

	var caborUUIDs []pgtype.UUID
	for _, cid := range req.CaborIds {
		var u pgtype.UUID
		u.Scan(cid)
		caborUUIDs = append(caborUUIDs, u)
	}

	venue, err := h.queries.UpdateVenue(r.Context(), db.UpdateVenueParams{
		ID:       uuid,
		Column2:  req.Name,
		Column3:  req.ImageUrl,
		Column4:  req.Address,
		Column5:  lat,
		Column6:  lng,
		Column7:  req.MapRouteUrl,
		Column8:  cityGuideUUIDs,
		Column9:  caborUUIDs,
		Column10: req.Capacity,
		Column11: req.Facilities,
		Column12: req.ReadinessStatus,
		Column13: req.ContactPerson,
	})

	if err != nil {
		http.Error(w, "Failed to update venue: "+err.Error(), http.StatusInternalServerError)
		return
	}

	publishAudit("Venue", "UPDATE", id, venue)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(venue)
}

func (h *VenueHandler) DeleteVenue(w http.ResponseWriter, r *http.Request) {
	id, idText, ok := venueID(w, r)
	if !ok {
		return
	}
	referenced, err := h.hasActiveScheduleReference(r.Context(), idText)
	if err != nil {
		http.Error(w, "Schedule Service tidak tersedia untuk validasi referensi", http.StatusServiceUnavailable)
		return
	}
	if referenced {
		http.Error(w, "Arsipkan jadwal aktif pada venue ini terlebih dahulu", http.StatusConflict)
		return
	}
	actor, reason, ok := venueDeletionMetadata(w, r)
	if !ok {
		return
	}
	record, changed, err := h.queries.SoftDeleteVenue(r.Context(), id, actor, reason)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Venue tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal mengarsipkan venue", http.StatusInternalServerError)
		return
	}
	if changed {
		publishAudit("Venue", "SOFT_DELETE", idText, map[string]interface{}{"actor": actor, "reason": reason, "request_id": r.Header.Get("X-Request-ID"), "record": record})
	}
	w.WriteHeader(http.StatusNoContent)
}
