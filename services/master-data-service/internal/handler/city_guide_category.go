package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

var categorySlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type CityGuideCategoryHandler struct{ queries *db.Queries }

type cityGuideCategoryRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type categoryStatusRequest struct {
	IsActive bool   `json:"is_active"`
	Reason   string `json:"reason"`
}

func NewCityGuideCategoryHandler(queries *db.Queries) *CityGuideCategoryHandler {
	return &CityGuideCategoryHandler{queries: queries}
}

func categorySlug(name string) string {
	var builder strings.Builder
	separator := false
	for _, r := range strings.ToLower(strings.TrimSpace(name)) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
			separator = false
		} else if builder.Len() > 0 && !separator {
			builder.WriteByte('-')
			separator = true
		}
	}
	return strings.Trim(builder.String(), "-")
}

func decodeCategoryRequest(w http.ResponseWriter, r *http.Request) (cityGuideCategoryRequest, bool) {
	var request cityGuideCategoryRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Data kategori tidak valid", http.StatusBadRequest)
		return request, false
	}
	request.Name = strings.TrimSpace(request.Name)
	request.Description = strings.TrimSpace(request.Description)
	if len([]rune(request.Name)) < 2 || len([]rune(request.Name)) > 100 {
		http.Error(w, "Nama kategori harus terdiri dari 2 sampai 100 karakter", http.StatusUnprocessableEntity)
		return request, false
	}
	if len([]rune(request.Description)) > 500 {
		http.Error(w, "Keterangan kategori maksimal 500 karakter", http.StatusUnprocessableEntity)
		return request, false
	}
	return request, true
}

func categoryIDFromRequest(w http.ResponseWriter, r *http.Request) (pgtype.UUID, bool) {
	var id pgtype.UUID
	if err := id.Scan(chi.URLParam(r, "id")); err != nil {
		http.Error(w, "Nomor kategori tidak valid", http.StatusBadRequest)
		return id, false
	}
	return id, true
}

func publishCategoryAudit(r *http.Request, action, entityID string, payload interface{}) {
	event := cityGuideAuditEvent{
		EventVersion: "1.0", EventType: "audit.master_data." + strings.ToLower(action),
		ServiceName: "master-data-service", EntityName: "CityGuideCategory", EntityID: entityID,
		Action: action, Actor: strings.TrimSpace(r.Header.Get("X-Actor-ID")),
		ActorUsername: strings.TrimSpace(r.Header.Get("X-Actor-Username")), ActorDisplayName: strings.TrimSpace(r.Header.Get("X-Actor-Display-Name")),
		RequestID: strings.TrimSpace(r.Header.Get("X-Request-ID")), IPAddress: strings.TrimSpace(r.Header.Get("X-Actor-IP")), Payload: payload,
	}
	data, _ := json.Marshal(event)
	messaging.PublishEvent("audit.master_data."+strings.ToLower(action), data)
}

func writeCategoryConflict(w http.ResponseWriter, err error) bool {
	var databaseError *pgconn.PgError
	if errors.As(err, &databaseError) && databaseError.Code == "23505" {
		http.Error(w, "Nama kategori sudah digunakan", http.StatusConflict)
		return true
	}
	return false
}

func (h *CityGuideCategoryHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	items, err := h.queries.ListPublicCityGuideCategories(r.Context())
	if err != nil {
		http.Error(w, "Kategori Panduan Kota belum dapat dimuat", http.StatusInternalServerError)
		return
	}
	if items == nil {
		items = []db.ListPublicCityGuideCategoriesRow{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(items)
}

func (h *CityGuideCategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := int32(1), int32(10)
	if value, err := strconv.ParseInt(r.URL.Query().Get("page"), 10, 32); err == nil && value > 0 {
		page = int32(value)
	}
	if value, err := strconv.ParseInt(r.URL.Query().Get("limit"), 10, 32); err == nil && (value == 10 || value == 25 || value == 50 || value == 100) {
		limit = int32(value)
	}
	search := strings.TrimSpace(r.URL.Query().Get("q"))
	status := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))
	sortKey := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("sort")))
	sortOrder := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("order")))
	if len([]rune(search)) > 80 || (status != "" && status != "active" && status != "inactive") {
		http.Error(w, "Filter kategori tidak valid", http.StatusUnprocessableEntity)
		return
	}
	if sortKey != "created_at" {
		sortKey = "name"
	}
	if sortOrder != "desc" {
		sortOrder = "asc"
	}
	params := db.ListCityGuideCategoriesParams{Status: status, Search: escapeLikePattern(search), SortKey: sortKey, SortOrder: sortOrder, PageOffset: (page - 1) * limit, PageLimit: limit}
	items, err := h.queries.ListCityGuideCategories(r.Context(), params)
	if err != nil {
		http.Error(w, "Kategori Panduan Kota belum dapat dimuat", http.StatusInternalServerError)
		return
	}
	total, err := h.queries.CountCityGuideCategories(r.Context(), db.CountCityGuideCategoriesParams{Status: status, Search: escapeLikePattern(search)})
	if err != nil {
		http.Error(w, "Jumlah kategori belum dapat dihitung", http.StatusInternalServerError)
		return
	}
	if items == nil {
		items = []db.ListCityGuideCategoriesRow{}
	}
	totalPages := int32(0)
	if total > 0 {
		totalPages = int32((total + int64(limit) - 1) / int64(limit))
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": items, "pagination": map[string]interface{}{"page": page, "limit": limit, "total": total, "total_pages": totalPages}})
}

func (h *CityGuideCategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	request, ok := decodeCategoryRequest(w, r)
	if !ok {
		return
	}
	slug := categorySlug(request.Name)
	if !categorySlugPattern.MatchString(slug) {
		http.Error(w, "Nama kategori harus memuat huruf atau angka", http.StatusUnprocessableEntity)
		return
	}
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	item, err := h.queries.CreateCityGuideCategory(r.Context(), db.CreateCityGuideCategoryParams{Name: request.Name, Slug: slug, Column3: request.Description, Column4: actor})
	if writeCategoryConflict(w, err) {
		return
	}
	if err != nil {
		http.Error(w, "Kategori gagal disimpan", http.StatusInternalServerError)
		return
	}
	id, _ := item.ID.MarshalJSON()
	publishCategoryAudit(r, "CREATE", strings.Trim(string(id), `"`), item)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(item)
}

func (h *CityGuideCategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := categoryIDFromRequest(w, r)
	if !ok {
		return
	}
	request, ok := decodeCategoryRequest(w, r)
	if !ok {
		return
	}
	item, err := h.queries.UpdateCityGuideCategory(r.Context(), db.UpdateCityGuideCategoryParams{ID: id, Name: request.Name, Column3: request.Description, Column4: strings.TrimSpace(r.Header.Get("X-Actor-ID"))})
	if writeCategoryConflict(w, err) {
		return
	}
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Kategori tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Kategori gagal diperbarui", http.StatusInternalServerError)
		return
	}
	publishCategoryAudit(r, "UPDATE", chi.URLParam(r, "id"), item)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(item)
}

func (h *CityGuideCategoryHandler) SetStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := categoryIDFromRequest(w, r)
	if !ok {
		return
	}
	var request categoryStatusRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil {
		http.Error(w, "Perubahan status tidak valid", http.StatusBadRequest)
		return
	}
	request.Reason = strings.TrimSpace(request.Reason)
	if !request.IsActive && len([]rune(request.Reason)) < 3 {
		http.Error(w, "Alasan penonaktifan wajib diisi", http.StatusUnprocessableEntity)
		return
	}
	item, err := h.queries.SetCityGuideCategoryStatus(r.Context(), db.SetCityGuideCategoryStatusParams{ID: id, IsActive: request.IsActive, Column3: strings.TrimSpace(r.Header.Get("X-Actor-ID")), Column4: request.Reason})
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Kategori tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Status kategori gagal diubah", http.StatusInternalServerError)
		return
	}
	publishCategoryAudit(r, "STATUS_CHANGE", chi.URLParam(r, "id"), item)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(item)
}

func (h *CityGuideCategoryHandler) Archive(w http.ResponseWriter, r *http.Request) {
	id, ok := categoryIDFromRequest(w, r)
	if !ok {
		return
	}
	var request struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&request)
	request.Reason = strings.TrimSpace(request.Reason)
	if len([]rune(request.Reason)) < 3 {
		http.Error(w, "Alasan pengarsipan wajib diisi", http.StatusUnprocessableEntity)
		return
	}
	item, err := h.queries.ArchiveCityGuideCategory(r.Context(), db.ArchiveCityGuideCategoryParams{ID: id, Column2: strings.TrimSpace(r.Header.Get("X-Actor-ID")), Column3: request.Reason})
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Kategori masih digunakan atau tidak ditemukan", http.StatusConflict)
		return
	}
	if err != nil {
		http.Error(w, "Kategori gagal diarsipkan", http.StatusInternalServerError)
		return
	}
	publishCategoryAudit(r, "DELETE", chi.URLParam(r, "id"), item)
	w.WriteHeader(http.StatusNoContent)
}

func (h *CityGuideCategoryHandler) Restore(w http.ResponseWriter, r *http.Request) {
	id, ok := categoryIDFromRequest(w, r)
	if !ok {
		return
	}
	item, err := h.queries.RestoreCityGuideCategory(r.Context(), db.RestoreCityGuideCategoryParams{ID: id, Column2: strings.TrimSpace(r.Header.Get("X-Actor-ID"))})
	if writeCategoryConflict(w, err) {
		return
	}
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Kategori arsip tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Kategori gagal dipulihkan", http.StatusInternalServerError)
		return
	}
	publishCategoryAudit(r, "RESTORE", chi.URLParam(r, "id"), item)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(item)
}

func (h *CityGuideCategoryHandler) ListDeleted(w http.ResponseWriter, r *http.Request) {
	items, err := h.queries.ListDeletedCityGuideCategories(r.Context())
	if err != nil {
		http.Error(w, "Arsip kategori belum dapat dimuat", http.StatusInternalServerError)
		return
	}
	if items == nil {
		items = []db.ListDeletedCityGuideCategoriesRow{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(items)
}
