package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

const (
	maxCityGuideSearchLength = 80
	maxCityGuidePerPage      = 100
	travelCategory           = "Info Travel"
)

type CityGuideHandler struct {
	queries *db.Queries
}

type cityGuidePagination struct {
	Page      int32
	PerPage   int32
	Paginated bool
}

type cityGuideListResponse struct {
	Data       []db.CityGuide `json:"data"`
	Page       int32          `json:"page"`
	PerPage    int32          `json:"per_page"`
	TotalItems int64          `json:"total_items"`
	TotalPages int32          `json:"total_pages"`
}

type cityGuideRequest struct {
	Title          string   `json:"title"`
	Category       string   `json:"category"`
	Description    string   `json:"description"`
	Address        string   `json:"address"`
	ImageURL       string   `json:"image_url"`
	Latitude       *float64 `json:"latitude"`
	Longitude      *float64 `json:"longitude"`
	MapRouteURL    string   `json:"map_route_url"`
	ContactPhone   string   `json:"contact_phone"`
	WhatsApp       string   `json:"whatsapp"`
	Email          string   `json:"email"`
	WebsiteURL     string   `json:"website_url"`
	InstagramURL   string   `json:"instagram_url"`
	FacebookURL    string   `json:"facebook_url"`
	TikTokURL      string   `json:"tiktok_url"`
	ServiceTypes   []string `json:"service_types"`
	ServiceArea    string   `json:"service_area"`
	OperatingHours string   `json:"operating_hours"`
	PriceRange     string   `json:"price_range"`
	FleetTypes     []string `json:"fleet_types"`
	FleetCount     *int32   `json:"fleet_count"`
}

const maximumMapRouteURLLength = 2048

var contactNumberPattern = regexp.MustCompile(`^[0-9+() .-]{6,32}$`)

var allowedGoogleMapsHosts = map[string]struct{}{
	"google.com":        {},
	"google.co.id":      {},
	"goo.gl":            {},
	"maps.app.goo.gl":   {},
	"maps.google.co.id": {},
	"maps.google.com":   {},
	"www.google.co.id":  {},
	"www.google.com":    {},
}

func validateGoogleMapsRouteURL(value string) error {
	if value == "" {
		return nil
	}
	if len(value) > maximumMapRouteURLLength {
		return errors.New("URL Google Maps maksimal 2048 karakter")
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || parsed.Port() != "" {
		return errors.New("URL Google Maps harus berupa URL HTTPS yang valid")
	}
	host := strings.ToLower(parsed.Hostname())
	if _, allowed := allowedGoogleMapsHosts[host]; !allowed {
		return errors.New("URL Google Maps harus menggunakan domain resmi Google Maps")
	}
	standardMapsPath := parsed.Path == "/maps" || strings.HasPrefix(parsed.Path, "/maps/")
	isMapsPath := (host == "maps.app.goo.gl" && len(parsed.Path) > 1) ||
		host == "maps.google.com" ||
		host == "maps.google.co.id" ||
		standardMapsPath
	if !isMapsPath {
		return errors.New("URL harus mengarah ke halaman Google Maps")
	}
	return nil
}

func validateHTTPSURL(value, field string, allowedHosts map[string]struct{}) error {
	if value == "" {
		return nil
	}
	if len(value) > 2048 {
		return errors.New(field + " maksimal 2048 karakter")
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || parsed.User != nil || parsed.Port() != "" {
		return errors.New(field + " harus berupa URL HTTPS yang valid")
	}
	if allowedHosts != nil {
		host := strings.ToLower(parsed.Hostname())
		if _, allowed := allowedHosts[host]; !allowed {
			return errors.New(field + " menggunakan domain yang tidak diizinkan")
		}
	}
	return nil
}

func normalizeStringList(values []string) []string {
	normalized := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		key := strings.ToLower(value)
		if value == "" {
			continue
		}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, value)
	}
	return normalized
}

func nullableText(value string) pgtype.Text {
	return pgtype.Text{String: value, Valid: value != ""}
}

func nullableInt32(value *int32) pgtype.Int4 {
	if value == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *value, Valid: true}
}

func NewCityGuideHandler(queries *db.Queries) *CityGuideHandler {
	return &CityGuideHandler{queries: queries}
}

func publishAuditCityGuide(r *http.Request, action, entityID string, payload interface{}) {
	actorID := r.Header.Get("X-User-Id")
	requestID := r.Header.Get("X-Request-Id")
	event := map[string]interface{}{
		"service_name": "master-data-service",
		"entity_name":  "CityGuide",
		"entity_id":    entityID,
		"action":       action,
		"actor_id":     actorID,
		"request_id":   requestID,
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
	req.MapRouteURL = strings.TrimSpace(req.MapRouteURL)
	req.ContactPhone = strings.TrimSpace(req.ContactPhone)
	req.WhatsApp = strings.TrimSpace(req.WhatsApp)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.WebsiteURL = strings.TrimSpace(req.WebsiteURL)
	req.InstagramURL = strings.TrimSpace(req.InstagramURL)
	req.FacebookURL = strings.TrimSpace(req.FacebookURL)
	req.TikTokURL = strings.TrimSpace(req.TikTokURL)
	req.ServiceTypes = normalizeStringList(req.ServiceTypes)
	req.ServiceArea = strings.TrimSpace(req.ServiceArea)
	req.OperatingHours = strings.TrimSpace(req.OperatingHours)
	req.PriceRange = strings.TrimSpace(req.PriceRange)
	req.FleetTypes = normalizeStringList(req.FleetTypes)
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
	if err := validateGoogleMapsRouteURL(req.MapRouteURL); err != nil {
		return err
	}
	if req.ContactPhone != "" && !contactNumberPattern.MatchString(req.ContactPhone) {
		return errors.New("nomor telepon hanya boleh berisi angka dan karakter telepon umum")
	}
	if req.WhatsApp != "" && !contactNumberPattern.MatchString(req.WhatsApp) {
		return errors.New("nomor WhatsApp hanya boleh berisi angka dan karakter telepon umum")
	}
	if req.Email != "" {
		address, err := mail.ParseAddress(req.Email)
		if err != nil || address.Address != req.Email || len(req.Email) > 254 {
			return errors.New("email tidak valid")
		}
	}
	if err := validateHTTPSURL(req.WebsiteURL, "website", nil); err != nil {
		return err
	}
	socialHosts := []struct {
		value string
		field string
		hosts map[string]struct{}
	}{
		{req.InstagramURL, "Instagram", map[string]struct{}{"instagram.com": {}, "www.instagram.com": {}}},
		{req.FacebookURL, "Facebook", map[string]struct{}{"facebook.com": {}, "www.facebook.com": {}}},
		{req.TikTokURL, "TikTok", map[string]struct{}{"tiktok.com": {}, "www.tiktok.com": {}}},
	}
	for _, social := range socialHosts {
		if err := validateHTTPSURL(social.value, social.field, social.hosts); err != nil {
			return err
		}
	}
	if req.Category == "Catering" || req.Category == travelCategory {
		if req.Address == "" {
			return errors.New("alamat wajib diisi untuk usaha Catering dan Info Travel")
		}
		if req.ContactPhone == "" && req.WhatsApp == "" && req.Email == "" && req.WebsiteURL == "" && req.InstagramURL == "" && req.FacebookURL == "" && req.TikTokURL == "" {
			return errors.New("minimal satu kontak resmi wajib diisi")
		}
	}
	if req.Category == travelCategory {
		if len(req.FleetTypes) == 0 {
			return errors.New("jenis armada wajib diisi untuk Info Travel")
		}
		if req.FleetCount == nil || *req.FleetCount < 1 {
			return errors.New("jumlah armada minimal 1 untuk Info Travel")
		}
	} else {
		req.FleetTypes = []string{}
		req.FleetCount = nil
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
		Title:          req.Title,
		Category:       req.Category,
		Description:    nullableText(req.Description),
		Address:        nullableText(req.Address),
		ImageUrl:       nullableText(req.ImageURL),
		Latitude:       pgtype.Float8{Float64: *req.Latitude, Valid: true},
		Longitude:      pgtype.Float8{Float64: *req.Longitude, Valid: true},
		MapRouteUrl:    nullableText(req.MapRouteURL),
		ContactPhone:   nullableText(req.ContactPhone),
		Whatsapp:       nullableText(req.WhatsApp),
		Email:          nullableText(req.Email),
		WebsiteUrl:     nullableText(req.WebsiteURL),
		InstagramUrl:   nullableText(req.InstagramURL),
		FacebookUrl:    nullableText(req.FacebookURL),
		TiktokUrl:      nullableText(req.TikTokURL),
		ServiceTypes:   req.ServiceTypes,
		ServiceArea:    nullableText(req.ServiceArea),
		OperatingHours: nullableText(req.OperatingHours),
		PriceRange:     nullableText(req.PriceRange),
		FleetTypes:     req.FleetTypes,
		FleetCount:     nullableInt32(req.FleetCount),
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
	publishAuditCityGuide(r, "CREATE", uuidStr, cg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) ListCityGuides(w http.ResponseWriter, r *http.Request) {
	category, search, pagination, err := parseCityGuideListFilters(r.URL.Query())
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	escapedSearch := escapeLikePattern(search)

	if pagination.Paginated {
		params := db.ListCityGuidesPaginatedParams{
			Category:   category,
			Search:     escapedSearch,
			PageOffset: (pagination.Page - 1) * pagination.PerPage,
			PageLimit:  pagination.PerPage,
		}
		cgs, listErr := h.queries.ListCityGuidesPaginated(r.Context(), params)
		if listErr != nil {
			http.Error(w, "Gagal membaca City Guide", http.StatusInternalServerError)
			return
		}
		totalItems, countErr := h.queries.CountCityGuides(r.Context(), db.CountCityGuidesParams{
			Category: category,
			Search:   escapedSearch,
		})
		if countErr != nil {
			http.Error(w, "Gagal menghitung City Guide", http.StatusInternalServerError)
			return
		}
		totalPages := int32(0)
		if totalItems > 0 {
			totalPages = int32((totalItems + int64(pagination.PerPage) - 1) / int64(pagination.PerPage))
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(cityGuideListResponse{
			Data:       cgs,
			Page:       pagination.Page,
			PerPage:    pagination.PerPage,
			TotalItems: totalItems,
			TotalPages: totalPages,
		})
		return
	}

	cgs, err := h.queries.ListCityGuides(r.Context(), db.ListCityGuidesParams{
		Category: category,
		Search:   escapedSearch,
	})
	if err != nil {
		http.Error(w, "Gagal membaca City Guide", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cgs)
}

func parseCityGuideListFilters(values url.Values) (string, string, cityGuidePagination, error) {
	pagination := cityGuidePagination{Page: 1, PerPage: 10}
	if len(values["category"]) > 1 || len(values["q"]) > 1 || len(values["page"]) > 1 || len(values["per_page"]) > 1 {
		return "", "", pagination, errors.New("Filter City Guide hanya boleh memiliki satu nilai")
	}

	category := strings.TrimSpace(values.Get("category"))
	search := strings.TrimSpace(values.Get("q"))
	if len([]rune(search)) > maxCityGuideSearchLength {
		return "", "", pagination, errors.New("Kata pencarian City Guide maksimal 80 karakter")
	}
	pageValue := strings.TrimSpace(values.Get("page"))
	perPageValue := strings.TrimSpace(values.Get("per_page"))
	pagination.Paginated = pageValue != "" || perPageValue != ""
	if pageValue != "" {
		page, parseErr := strconv.ParseInt(pageValue, 10, 32)
		if parseErr != nil || page < 1 {
			return "", "", pagination, errors.New("page City Guide harus berupa bilangan bulat minimal 1")
		}
		pagination.Page = int32(page)
	}
	if perPageValue != "" {
		perPage, parseErr := strconv.ParseInt(perPageValue, 10, 32)
		if parseErr != nil || perPage < 1 || perPage > maxCityGuidePerPage {
			return "", "", pagination, errors.New("per_page City Guide harus antara 1 sampai 100")
		}
		pagination.PerPage = int32(perPage)
	}

	return category, search, pagination, nil
}

func escapeLikePattern(value string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return replacer.Replace(value)
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
		ID:           uuid,
		Title:        req.Title,
		Category:     req.Category,
		Column4:      req.Description,
		Column5:      req.Address,
		Column6:      req.ImageURL,
		Latitude:     pgtype.Float8{Float64: *req.Latitude, Valid: true},
		Longitude:    pgtype.Float8{Float64: *req.Longitude, Valid: true},
		Column9:      req.MapRouteURL,
		Column10:     req.ContactPhone,
		Column11:     req.WhatsApp,
		Column12:     req.Email,
		Column13:     req.WebsiteURL,
		Column14:     req.InstagramURL,
		Column15:     req.FacebookURL,
		Column16:     req.TikTokURL,
		ServiceTypes: req.ServiceTypes,
		Column18:     req.ServiceArea,
		Column19:     req.OperatingHours,
		Column20:     req.PriceRange,
		FleetTypes:   req.FleetTypes,
		FleetCount:   nullableInt32(req.FleetCount),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "City Guide tidak ditemukan", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Gagal memperbarui City Guide", http.StatusInternalServerError)
		return
	}

	publishAuditCityGuide(r, "UPDATE", id, cg)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cg)
}

func (h *CityGuideHandler) DeleteCityGuide(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "city_guide", "City Guide")
}
