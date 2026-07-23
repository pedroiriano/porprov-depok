package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

type MasterDataHandler struct {
	queries     *db.Queries
	scheduleURL string
	httpClient  *http.Client
}

func NewMasterDataHandler(queries *db.Queries, scheduleURL string) *MasterDataHandler {
	return &MasterDataHandler{
		queries:     queries,
		scheduleURL: strings.TrimRight(scheduleURL, "/"),
		httpClient:  &http.Client{Timeout: 5 * time.Second},
	}
}

// publishAudit is a helper to publish audit logs
func publishAudit(r *http.Request, entityName, action, entityID string, payload interface{}) {
	actorID := r.Header.Get("X-User-Id")
	requestID := r.Header.Get("X-Request-Id")
	event := map[string]interface{}{
		"service_name": "master-data-service",
		"entity_name":  entityName,
		"entity_id":    entityID,
		"action":       action,
		"actor_id":     actorID,
		"request_id":   requestID,
		"payload":      payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.master."+action, data)
}

// ====================== CABOR ======================
func (h *MasterDataHandler) CreateCabor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name              string `json:"name"`
		Description       string `json:"description"`
		IconURL           string `json:"icon_url"`
		Kategori          string `json:"kategori"`
		TotalMedali       int32  `json:"total_medali"`
		TechnicalDelegate string `json:"technical_delegate"`
		Status            string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cabor, err := h.queries.CreateCabor(r.Context(), db.CreateCaborParams{
		Name:              req.Name,
		Description:       pgtype.Text{String: req.Description, Valid: req.Description != ""},
		IconUrl:           pgtype.Text{String: req.IconURL, Valid: req.IconURL != ""},
		Kategori:          pgtype.Text{String: req.Kategori, Valid: req.Kategori != ""},
		TotalMedali:       pgtype.Int4{Int32: req.TotalMedali, Valid: req.TotalMedali > 0},
		TechnicalDelegate: pgtype.Text{String: req.TechnicalDelegate, Valid: req.TechnicalDelegate != ""},
		Status:            pgtype.Text{String: req.Status, Valid: req.Status != ""},
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var uuidStr string
	if cabor.ID.Valid {
		b, _ := cabor.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit(r, "Cabor", "CREATE", uuidStr, cabor)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cabor)
}

func (h *MasterDataHandler) ListCabors(w http.ResponseWriter, r *http.Request) {
	cabors, err := h.queries.ListCabors(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cabors)
}

func (h *MasterDataHandler) GetCabor(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	cabor, err := h.queries.GetCaborByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "Cabor not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cabor)
}

func (h *MasterDataHandler) UpdateCabor(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req struct {
		Name              string `json:"name"`
		Description       string `json:"description"`
		IconURL           string `json:"icon_url"`
		Kategori          string `json:"kategori"`
		TotalMedali       int32  `json:"total_medali"`
		TechnicalDelegate string `json:"technical_delegate"`
		Status            string `json:"status"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	cabor, err := h.queries.UpdateCabor(r.Context(), db.UpdateCaborParams{
		ID:      uuid,
		Column2: req.Name,
		Column3: req.Description,
		Column4: req.IconURL,
		Column5: req.Kategori,
		Column6: req.TotalMedali,
		Column7: req.TechnicalDelegate,
		Column8: req.Status,
	})
	if err != nil {
		http.Error(w, "Failed to update cabor: "+err.Error(), http.StatusInternalServerError)
		return
	}

	publishAudit(r, "Cabor", "UPDATE", id, cabor)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cabor)
}

func (h *MasterDataHandler) DeleteCabor(w http.ResponseWriter, r *http.Request) {
	id, _, ok := resourceID(w, r)
	if !ok {
		return
	}
	hasChildren, err := h.queries.HasActiveNomorTandings(r.Context(), id)
	if err != nil {
		http.Error(w, "Gagal memvalidasi nomor pertandingan", http.StatusInternalServerError)
		return
	}
	if hasChildren {
		http.Error(w, "Arsipkan seluruh nomor pertandingan aktif pada cabor ini terlebih dahulu", http.StatusConflict)
		return
	}
	handleSoftDelete(w, r, h.queries, "cabor", "Cabor")
}

// ====================== KONTINGEN ======================
func (h *MasterDataHandler) CreateKontingen(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name       string `json:"name"`
		RegionType string `json:"region_type"`
		LogoURL    string `json:"logo_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	kontingen, err := h.queries.CreateKontingen(r.Context(), db.CreateKontingenParams{
		Name:       req.Name,
		RegionType: req.RegionType,
		LogoUrl:    pgtype.Text{String: req.LogoURL, Valid: req.LogoURL != ""},
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var uuidStr string
	if kontingen.ID.Valid {
		b, _ := kontingen.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit(r, "Kontingen", "CREATE", uuidStr, kontingen)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(kontingen)
}

func (h *MasterDataHandler) ListKontingens(w http.ResponseWriter, r *http.Request) {
	kontingens, err := h.queries.ListKontingens(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(kontingens)
}

func (h *MasterDataHandler) GetKontingen(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	kontingen, err := h.queries.GetKontingenByID(r.Context(), uuid)
	if err != nil {
		http.Error(w, "Kontingen not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(kontingen)
}

func (h *MasterDataHandler) UpdateKontingen(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	var req struct {
		Name       string `json:"name"`
		RegionType string `json:"region_type"`
		LogoURL    string `json:"logo_url"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	kontingen, err := h.queries.UpdateKontingen(r.Context(), db.UpdateKontingenParams{
		ID:      uuid,
		Column2: req.Name,
		Column3: req.RegionType,
		Column4: req.LogoURL,
	})
	if err != nil {
		http.Error(w, "Failed to update kontingen: "+err.Error(), http.StatusInternalServerError)
		return
	}

	publishAudit(r, "Kontingen", "UPDATE", id, kontingen)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(kontingen)
}

func (h *MasterDataHandler) DeleteKontingen(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "kontingen", "Kontingen")
}

// ====================== NOMOR TANDING ======================
type nomorTandingRequest struct {
	CaborID        string `json:"cabor_id"`
	Name           string `json:"name"`
	GenderCategory string `json:"gender_category"`
	MatchType      string `json:"match_type"`
}

func decodeNomorTandingRequest(w http.ResponseWriter, r *http.Request) (nomorTandingRequest, pgtype.UUID, bool) {
	var req nomorTandingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Payload JSON tidak valid", http.StatusBadRequest)
		return req, pgtype.UUID{}, false
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" || req.CaborID == "" || req.GenderCategory == "" || req.MatchType == "" {
		http.Error(w, "cabor_id, name, gender_category, dan match_type wajib diisi", http.StatusUnprocessableEntity)
		return req, pgtype.UUID{}, false
	}

	var caborID pgtype.UUID
	if err := caborID.Scan(req.CaborID); err != nil {
		http.Error(w, "cabor_id tidak valid", http.StatusUnprocessableEntity)
		return req, pgtype.UUID{}, false
	}
	return req, caborID, true
}

func (h *MasterDataHandler) CreateNomorTanding(w http.ResponseWriter, r *http.Request) {
	req, caborID, ok := decodeNomorTandingRequest(w, r)
	if !ok {
		return
	}
	if _, err := h.queries.GetCaborByID(r.Context(), caborID); err != nil {
		http.Error(w, "Cabang olahraga aktif tidak ditemukan", http.StatusUnprocessableEntity)
		return
	}

	item, err := h.queries.CreateNomorTanding(r.Context(), db.CreateNomorTandingParams{
		CaborID:        caborID,
		Name:           req.Name,
		GenderCategory: req.GenderCategory,
		MatchType:      req.MatchType,
	})
	if err != nil {
		http.Error(w, "Gagal membuat nomor pertandingan: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var id string
	if item.ID.Valid {
		encoded, _ := item.ID.MarshalJSON()
		id = strings.Trim(string(encoded), "\"")
	}
	publishAudit(r, "NomorTanding", "CREATE", id, item)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func (h *MasterDataHandler) ListNomorTandings(w http.ResponseWriter, r *http.Request) {
	items, err := h.queries.ListNomorTandings(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil nomor pertandingan", http.StatusInternalServerError)
		return
	}
	if items == nil {
		items = []db.NomorTanding{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *MasterDataHandler) GetNomorTanding(w http.ResponseWriter, r *http.Request) {
	var id pgtype.UUID
	if err := id.Scan(chi.URLParam(r, "id")); err != nil {
		http.Error(w, "ID tidak valid", http.StatusBadRequest)
		return
	}
	item, err := h.queries.GetNomorTandingByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Nomor pertandingan tidak ditemukan", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *MasterDataHandler) UpdateNomorTanding(w http.ResponseWriter, r *http.Request) {
	var id pgtype.UUID
	idText := chi.URLParam(r, "id")
	if err := id.Scan(idText); err != nil {
		http.Error(w, "ID tidak valid", http.StatusBadRequest)
		return
	}
	req, caborID, ok := decodeNomorTandingRequest(w, r)
	if !ok {
		return
	}
	if _, err := h.queries.GetCaborByID(r.Context(), caborID); err != nil {
		http.Error(w, "Cabang olahraga aktif tidak ditemukan", http.StatusUnprocessableEntity)
		return
	}
	item, err := h.queries.UpdateNomorTanding(r.Context(), db.UpdateNomorTandingParams{
		ID:             id,
		CaborID:        caborID,
		Name:           req.Name,
		GenderCategory: req.GenderCategory,
		MatchType:      req.MatchType,
	})
	if err != nil {
		http.Error(w, "Gagal memperbarui nomor pertandingan: "+err.Error(), http.StatusInternalServerError)
		return
	}
	publishAudit(r, "NomorTanding", "UPDATE", idText, item)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *MasterDataHandler) DeleteNomorTanding(w http.ResponseWriter, r *http.Request) {
	_, idText, ok := resourceID(w, r)
	if !ok {
		return
	}
	referenced, err := h.hasActiveScheduleReference(r.Context(), "nomor-tanding", idText)
	if err != nil {
		http.Error(w, "Schedule Service tidak tersedia untuk validasi referensi", http.StatusServiceUnavailable)
		return
	}
	if referenced {
		http.Error(w, "Arsipkan jadwal aktif yang menggunakan nomor pertandingan ini terlebih dahulu", http.StatusConflict)
		return
	}
	handleSoftDelete(w, r, h.queries, "nomor_tanding", "Nomor pertandingan")
}
