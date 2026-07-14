package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

type CityGuideHandler struct {
	queries *db.Queries
}

func NewCityGuideHandler(queries *db.Queries) *CityGuideHandler {
	return &CityGuideHandler{queries: queries}
}

func publishAuditCityGuide(action, entityID string, payload interface{}) {
	event := map[string]interface{}{
		"service_name": "master-data-service",
		"entity_name":  "CityGuide",
		"entity_id":    entityID,
		"action":       action,
		"payload":      payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.master_data."+action, data)
}

func (h *CityGuideHandler) CreateCityGuide(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string `json:"title"`
		Category    string `json:"category"`
		Description string `json:"description"`
		Address     string `json:"address"`
		ImageUrl    string `json:"image_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cg, err := h.queries.CreateCityGuide(r.Context(), db.CreateCityGuideParams{
		Title:       req.Title,
		Category:    req.Category,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Address:     pgtype.Text{String: req.Address, Valid: req.Address != ""},
		ImageUrl:    pgtype.Text{String: req.ImageUrl, Valid: req.ImageUrl != ""},
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var uuidStr string
	if cg.ID.Valid {
		b, _ := cg.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAuditCityGuide("CREATE", uuidStr, cg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) ListCityGuides(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	cgs, err := h.queries.ListCityGuides(r.Context(), category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cgs)
}

func (h *CityGuideHandler) GetCityGuide(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	cg, err := h.queries.GetCityGuideByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "City Guide not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) UpdateCityGuide(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req struct {
		Title       string `json:"title"`
		Category    string `json:"category"`
		Description string `json:"description"`
		Address     string `json:"address"`
		ImageUrl    string `json:"image_url"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	cg, err := h.queries.UpdateCityGuide(r.Context(), db.UpdateCityGuideParams{
		ID:      uuid,
		Column2: req.Title,
		Column3: req.Category,
		Column4: req.Description,
		Column5: req.Address,
		Column6: req.ImageUrl,
	})
	if err != nil {
		http.Error(w, "Failed to update city guide", http.StatusInternalServerError)
		return
	}

	publishAuditCityGuide("UPDATE", id, cg)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) DeleteCityGuide(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "city_guide", "City Guide")
}
