package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

type MasterDataHandler struct {
	queries *db.Queries
}

func NewMasterDataHandler(queries *db.Queries) *MasterDataHandler {
	return &MasterDataHandler{queries: queries}
}

// publishAudit is a helper to publish audit logs
func publishAudit(entityName, action, entityID string, payload interface{}) {
	event := map[string]interface{}{
		"service_name": "master-data-service",
		"entity_name":  entityName,
		"entity_id":    entityID,
		"action":       action,
		"payload":      payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.master."+action, data)
}

// ====================== CABOR ======================
func (h *MasterDataHandler) CreateCabor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		IconURL     string `json:"icon_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cabor, err := h.queries.CreateCabor(r.Context(), db.CreateCaborParams{
		Name:        req.Name,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		IconUrl:     pgtype.Text{String: req.IconURL, Valid: req.IconURL != ""},
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
	publishAudit("Cabor", "CREATE", uuidStr, cabor)

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
		Name        string `json:"name"`
		Description string `json:"description"`
		IconURL     string `json:"icon_url"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	cabor, err := h.queries.UpdateCabor(r.Context(), db.UpdateCaborParams{
		ID:      uuid,
		Column2: req.Name,
		Column3: req.Description,
		Column4: req.IconURL,
	})
	if err != nil {
		http.Error(w, "Failed to update cabor: "+err.Error(), http.StatusInternalServerError)
		return
	}

	publishAudit("Cabor", "UPDATE", id, cabor)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cabor)
}

func (h *MasterDataHandler) DeleteCabor(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteCabor(r.Context(), uuid); err != nil {
		http.Error(w, "Failed to delete cabor", http.StatusInternalServerError)
		return
	}

	publishAudit("Cabor", "DELETE", id, map[string]string{"id": id})
	w.WriteHeader(http.StatusNoContent)
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
	publishAudit("Kontingen", "CREATE", uuidStr, kontingen)

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

	publishAudit("Kontingen", "UPDATE", id, kontingen)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(kontingen)
}

func (h *MasterDataHandler) DeleteKontingen(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteKontingen(r.Context(), uuid); err != nil {
		http.Error(w, "Failed to delete kontingen", http.StatusInternalServerError)
		return
	}

	publishAudit("Kontingen", "DELETE", id, map[string]string{"id": id})
	w.WriteHeader(http.StatusNoContent)
}
