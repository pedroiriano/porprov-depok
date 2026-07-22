package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

type CityGuideHandler struct {
	queries *db.Queries
}

type cityGuideRequest struct {
	Title       string   `json:"title"`
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Address     string   `json:"address"`
	ImageURL    string   `json:"image_url"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
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

func validateCityGuideRequest(req *cityGuideRequest) error {
	req.Title = strings.TrimSpace(req.Title)
	req.Category = strings.TrimSpace(req.Category)
	req.Description = strings.TrimSpace(req.Description)
	req.Address = strings.TrimSpace(req.Address)
	req.ImageURL = strings.TrimSpace(req.ImageURL)
	if req.Title == "" || req.Category == "" {
		return errors.New("title dan category wajib diisi")
	}
	if req.Latitude == nil || req.Longitude == nil {
		return errors.New("latitude dan longitude wajib diisi berpasangan")
	}
	if *req.Latitude < -90 || *req.Latitude > 90 {
		return errors.New("latitude harus berada pada rentang -90 sampai 90")
	}
	if *req.Longitude < -180 || *req.Longitude > 180 {
		return errors.New("longitude harus berada pada rentang -180 sampai 180")
	}
	return nil
}

func decodeCityGuideRequest(w http.ResponseWriter, r *http.Request) (cityGuideRequest, bool) {
	var req cityGuideRequest
	r.Body = http.MaxBytesReader(w, r.Body, 128<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Payload City Guide tidak valid", http.StatusBadRequest)
		return req, false
	}
	if err := validateCityGuideRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return req, false
	}
	return req, true
}

func (h *CityGuideHandler) CreateCityGuide(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeCityGuideRequest(w, r)
	if !ok {
		return
	}

	cg, err := h.queries.CreateCityGuide(r.Context(), db.CreateCityGuideParams{
		Title:       req.Title,
		Category:    req.Category,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Address:     pgtype.Text{String: req.Address, Valid: req.Address != ""},
		ImageUrl:    pgtype.Text{String: req.ImageURL, Valid: req.ImageURL != ""},
		Latitude:    pgtype.Float8{Float64: *req.Latitude, Valid: true},
		Longitude:   pgtype.Float8{Float64: *req.Longitude, Valid: true},
	})
	if err != nil {
		http.Error(w, "Gagal menyimpan City Guide", http.StatusInternalServerError)
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
	_ = json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) ListCityGuides(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	cgs, err := h.queries.ListCityGuides(r.Context(), category)
	if err != nil {
		http.Error(w, "Gagal membaca City Guide", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cgs)
}

func (h *CityGuideHandler) GetCityGuide(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "ID City Guide tidak valid", http.StatusBadRequest)
		return
	}

	cg, err := h.queries.GetCityGuideByID(r.Context(), uuid)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "City Guide tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal membaca City Guide", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) UpdateCityGuide(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "ID City Guide tidak valid", http.StatusBadRequest)
		return
	}
	req, ok := decodeCityGuideRequest(w, r)
	if !ok {
		return
	}

	cg, err := h.queries.UpdateCityGuide(r.Context(), db.UpdateCityGuideParams{
		ID:        uuid,
		Title:     req.Title,
		Category:  req.Category,
		Column4:   req.Description,
		Column5:   req.Address,
		Column6:   req.ImageURL,
		Latitude:  pgtype.Float8{Float64: *req.Latitude, Valid: true},
		Longitude: pgtype.Float8{Float64: *req.Longitude, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "City Guide tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memperbarui City Guide", http.StatusInternalServerError)
		return
	}

	publishAuditCityGuide("UPDATE", id, cg)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) DeleteCityGuide(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "city_guide", "City Guide")
}
