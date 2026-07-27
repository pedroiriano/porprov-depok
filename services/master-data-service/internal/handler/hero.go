package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

const (
	maximumHeroTitleLength       = 180
	maximumHeroHighlightLength   = 100
	maximumHeroDescriptionLength = 1200
	maximumHeroImageURLLength    = 2048
)

type HeroHandler struct {
	queries *db.Queries
}

type heroRequest struct {
	Title              string `json:"title"`
	HighlightText      string `json:"highlight_text"`
	Description        string `json:"description"`
	BackgroundImageURL string `json:"background_image_url"`
	IsActive           bool   `json:"is_active"`
}

func NewHeroHandler(queries *db.Queries) *HeroHandler {
	return &HeroHandler{queries: queries}
}

func validateHeroImageURL(value string) error {
	if value == "" {
		return errors.New("gambar latar Hero wajib dipilih dari Media Library")
	}
	if len(value) > maximumHeroImageURLLength {
		return errors.New("URL gambar Hero maksimal 2048 karakter")
	}
	if strings.Contains(value, "\\") || strings.Contains(value, "..") {
		return errors.New("URL gambar Hero tidak valid")
	}
	if strings.HasPrefix(value, "/uploads/") || strings.HasPrefix(value, "/assets/images/") {
		return nil
	}
	return errors.New("gambar Hero wajib berasal dari Media Library")
}

func validateHeroRequest(request *heroRequest) error {
	request.Title = strings.TrimSpace(request.Title)
	request.HighlightText = strings.TrimSpace(request.HighlightText)
	request.Description = strings.TrimSpace(request.Description)
	request.BackgroundImageURL = strings.TrimSpace(request.BackgroundImageURL)

	if request.Title == "" {
		return errors.New("judul Hero wajib diisi")
	}
	if len([]rune(request.Title)) > maximumHeroTitleLength {
		return errors.New("judul Hero maksimal 180 karakter")
	}
	if len([]rune(request.HighlightText)) > maximumHeroHighlightLength {
		return errors.New("teks sorotan Hero maksimal 100 karakter")
	}
	if request.HighlightText != "" && !strings.Contains(strings.ToLower(request.Title), strings.ToLower(request.HighlightText)) {
		return errors.New("teks sorotan harus merupakan bagian dari judul Hero")
	}
	if request.Description == "" {
		return errors.New("isi Hero wajib diisi")
	}
	if len([]rune(request.Description)) > maximumHeroDescriptionLength {
		return errors.New("isi Hero maksimal 1200 karakter")
	}
	return validateHeroImageURL(request.BackgroundImageURL)
}

func decodeHeroRequest(w http.ResponseWriter, r *http.Request) (heroRequest, bool) {
	var request heroRequest
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Payload Hero tidak valid", http.StatusBadRequest)
		return request, false
	}
	if err := validateHeroRequest(&request); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return request, false
	}
	return request, true
}

func heroActor(w http.ResponseWriter, r *http.Request) (pgtype.Text, bool) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return pgtype.Text{}, false
	}
	return pgtype.Text{String: actor, Valid: true}, true
}

func (h *HeroHandler) validateMediaReference(w http.ResponseWriter, r *http.Request, imageURL string, allowLegacyAsset bool) bool {
	if strings.HasPrefix(imageURL, "/assets/images/") {
		if !allowLegacyAsset {
			http.Error(w, "Gambar Hero baru wajib dipilih dari Media Library", http.StatusUnprocessableEntity)
			return false
		}
		return true
	}
	if !strings.HasPrefix(imageURL, "/uploads/") {
		http.Error(w, "Gambar Hero wajib berasal dari Media Library", http.StatusUnprocessableEntity)
		return false
	}
	active, err := h.queries.IsActiveMediaURL(r.Context(), imageURL)
	if err != nil {
		http.Error(w, "Gagal memverifikasi Media Library", http.StatusInternalServerError)
		return false
	}
	if !active {
		http.Error(w, "Gambar Media Library tidak ditemukan atau sudah diarsipkan", http.StatusUnprocessableEntity)
		return false
	}
	return true
}

func writeHeroJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (h *HeroHandler) CreateHero(w http.ResponseWriter, r *http.Request) {
	actor, ok := heroActor(w, r)
	if !ok {
		return
	}
	request, ok := decodeHeroRequest(w, r)
	if !ok || !h.validateMediaReference(w, r, request.BackgroundImageURL, false) {
		return
	}

	hero, err := h.queries.CreateHero(r.Context(), db.CreateHeroParams{
		Title:              request.Title,
		HighlightText:      request.HighlightText,
		Description:        request.Description,
		BackgroundImageUrl: request.BackgroundImageURL,
		IsActive:           request.IsActive,
		Actor:              actor,
	})
	if err != nil {
		http.Error(w, "Gagal menyimpan Hero", http.StatusInternalServerError)
		return
	}
	publishAudit(r, "Hero", "CREATE", uuidText(hero.ID), hero)
	writeHeroJSON(w, http.StatusCreated, hero)
}

func (h *HeroHandler) ListHeroes(w http.ResponseWriter, r *http.Request) {
	heroes, err := h.queries.ListHeroes(r.Context())
	if err != nil {
		http.Error(w, "Gagal membaca Hero", http.StatusInternalServerError)
		return
	}
	writeHeroJSON(w, http.StatusOK, heroes)
}

func (h *HeroHandler) GetActiveHero(w http.ResponseWriter, r *http.Request) {
	hero, err := h.queries.GetActiveHero(r.Context())
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Hero aktif tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal membaca Hero aktif", http.StatusInternalServerError)
		return
	}
	writeHeroJSON(w, http.StatusOK, hero)
}

func (h *HeroHandler) GetHero(w http.ResponseWriter, r *http.Request) {
	id, _, ok := resourceID(w, r)
	if !ok {
		return
	}
	hero, err := h.queries.GetHeroByID(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Hero tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal membaca Hero", http.StatusInternalServerError)
		return
	}
	writeHeroJSON(w, http.StatusOK, hero)
}

func (h *HeroHandler) UpdateHero(w http.ResponseWriter, r *http.Request) {
	id, idText, ok := resourceID(w, r)
	if !ok {
		return
	}
	actor, ok := heroActor(w, r)
	if !ok {
		return
	}
	request, ok := decodeHeroRequest(w, r)
	if !ok {
		return
	}
	existing, err := h.queries.GetHeroByID(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Hero tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal membaca Hero", http.StatusInternalServerError)
		return
	}
	allowLegacyAsset := strings.HasPrefix(existing.BackgroundImageUrl, "/assets/images/") && existing.BackgroundImageUrl == request.BackgroundImageURL
	if !h.validateMediaReference(w, r, request.BackgroundImageURL, allowLegacyAsset) {
		return
	}

	hero, err := h.queries.UpdateHero(r.Context(), db.UpdateHeroParams{
		ID:                 id,
		Title:              request.Title,
		HighlightText:      request.HighlightText,
		Description:        request.Description,
		BackgroundImageUrl: request.BackgroundImageURL,
		IsActive:           request.IsActive,
		Actor:              actor,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Hero tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memperbarui Hero", http.StatusInternalServerError)
		return
	}
	publishAudit(r, "Hero", "UPDATE", idText, hero)
	writeHeroJSON(w, http.StatusOK, hero)
}

func (h *HeroHandler) DeleteHero(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "hero", "Hero")
}

func uuidText(id pgtype.UUID) string {
	if !id.Valid {
		return ""
	}
	bytes, err := id.MarshalJSON()
	if err != nil {
		return ""
	}
	return strings.Trim(string(bytes), `"`)
}
