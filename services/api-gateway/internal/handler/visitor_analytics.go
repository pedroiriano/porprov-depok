package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/pkg/response"
)

const (
	visitorAnalyticsBodyLimit     = 16 << 10
	visitorAnalyticsResponseLimit = 16 << 10
)

var (
	analyticsUUIDPattern   = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)
	analyticsScreenPattern = regexp.MustCompile(`^[0-9]{2,5}x[0-9]{2,5}$`)
	analyticsLocalePattern = regexp.MustCompile(`^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$`)
)

type visitorAnalyticsPayload struct {
	Website  string          `json:"website"`
	Screen   string          `json:"screen,omitempty"`
	Language string          `json:"language,omitempty"`
	Title    string          `json:"title,omitempty"`
	Hostname string          `json:"hostname"`
	URL      string          `json:"url"`
	Referrer string          `json:"referrer,omitempty"`
	Tag      string          `json:"tag,omitempty"`
	Name     string          `json:"name,omitempty"`
	Data     json.RawMessage `json:"data,omitempty"`
	LCP      *float64        `json:"lcp,omitempty"`
	INP      *float64        `json:"inp,omitempty"`
	CLS      *float64        `json:"cls,omitempty"`
	FCP      *float64        `json:"fcp,omitempty"`
	TTFB     *float64        `json:"ttfb,omitempty"`
}

type visitorAnalyticsEnvelope struct {
	Type    string                  `json:"type"`
	Payload visitorAnalyticsPayload `json:"payload"`
}

// VisitorAnalyticsHandler menjadi batas validasi same-origin sebelum data anonim diteruskan ke Umami.
type VisitorAnalyticsHandler struct {
	endpoint       string
	websiteID      string
	allowedOrigins map[string]struct{}
	allowedHosts   map[string]struct{}
	client         *http.Client
	configuration  error
}

func NewVisitorAnalyticsHandler(baseURL, websiteID string, allowedOrigins []string) *VisitorAnalyticsHandler {
	h := &VisitorAnalyticsHandler{
		websiteID:      strings.TrimSpace(websiteID),
		allowedOrigins: make(map[string]struct{}),
		allowedHosts:   make(map[string]struct{}),
		client:         &http.Client{Timeout: 4 * time.Second},
	}
	base, err := url.Parse(strings.TrimRight(strings.TrimSpace(baseURL), "/"))
	if err != nil || base.Scheme == "" || base.Host == "" {
		h.configuration = errors.New("invalid Umami internal URL")
		return h
	}
	base.Path = "/api/send"
	base.RawPath = ""
	base.RawQuery = ""
	base.Fragment = ""
	h.endpoint = base.String()

	if !analyticsUUIDPattern.MatchString(h.websiteID) {
		h.configuration = errors.New("invalid Umami website ID")
		return h
	}
	for _, rawOrigin := range allowedOrigins {
		origin, parseErr := canonicalAnalyticsOrigin(rawOrigin)
		if parseErr != nil {
			continue
		}
		h.allowedOrigins[origin] = struct{}{}
		parsed, _ := url.Parse(origin)
		h.allowedHosts[strings.ToLower(parsed.Hostname())] = struct{}{}
	}
	if len(h.allowedOrigins) == 0 {
		h.configuration = errors.New("analytics origin allowlist is empty")
	}
	return h
}

func canonicalAnalyticsOrigin(raw string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.User != nil || parsed.Path != "" || parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", errors.New("invalid origin")
	}
	return strings.ToLower(parsed.Scheme + "://" + parsed.Host), nil
}

func hasControlCharacters(value string) bool {
	return strings.IndexFunc(value, unicode.IsControl) >= 0
}

func traversalLikeTitle(value string) bool {
	normalized := strings.TrimSpace(value)
	for range 2 {
		decoded, err := url.QueryUnescape(normalized)
		if err != nil || decoded == normalized {
			break
		}
		normalized = decoded
	}
	normalized = strings.ToLower(strings.ReplaceAll(normalized, `\`, "/"))
	return strings.HasPrefix(normalized, "/") || strings.Contains(normalized, "../") || strings.Contains(normalized, "\x00")
}

func pathHasTraversal(path string) bool {
	decoded := path
	for range 2 {
		next, err := url.PathUnescape(decoded)
		if err != nil {
			return true
		}
		if next == decoded {
			break
		}
		decoded = next
	}
	for _, segment := range strings.Split(strings.ReplaceAll(decoded, `\`, "/"), "/") {
		if segment == ".." || strings.ContainsRune(segment, 0) {
			return true
		}
	}
	return false
}

func (h *VisitorAnalyticsHandler) validatePageURL(raw string) error {
	if len(raw) == 0 || len(raw) > 2048 || hasControlCharacters(raw) {
		return errors.New("invalid page URL")
	}
	parsed, err := url.Parse(raw)
	if err != nil || parsed.RawQuery != "" || parsed.Fragment != "" || parsed.User != nil || pathHasTraversal(parsed.EscapedPath()) {
		return errors.New("invalid page URL")
	}
	if parsed.IsAbs() {
		origin, originErr := canonicalAnalyticsOrigin(parsed.Scheme + "://" + parsed.Host)
		if originErr != nil {
			return errors.New("invalid page URL")
		}
		if _, ok := h.allowedOrigins[origin]; !ok {
			return errors.New("page URL origin is not allowed")
		}
		return nil
	}
	if !strings.HasPrefix(parsed.Path, "/") || strings.HasPrefix(parsed.Path, "//") || parsed.Host != "" {
		return errors.New("invalid page URL")
	}
	return nil
}

func sanitizeAnalyticsReferrer(raw string) (string, error) {
	if raw == "" {
		return "", nil
	}
	if len(raw) > 2048 || hasControlCharacters(raw) {
		return "", errors.New("invalid referrer")
	}
	parsed, err := url.Parse(raw)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.User != nil || pathHasTraversal(parsed.EscapedPath()) {
		return "", errors.New("invalid referrer")
	}
	// SECURITY: parameter pencarian dan fragmen tidak pernah diteruskan ke analitik.
	parsed.RawQuery = ""
	parsed.Fragment = ""
	return parsed.String(), nil
}

func validateAnalyticsMetric(value *float64) bool {
	return value == nil || (*value >= 0 && *value <= 3_600_000)
}

func (h *VisitorAnalyticsHandler) validate(envelope *visitorAnalyticsEnvelope) error {
	switch envelope.Type {
	case "event", "identify", "performance":
	default:
		return errors.New("unsupported analytics event type")
	}
	payload := &envelope.Payload
	if payload.Website != h.websiteID || !analyticsUUIDPattern.MatchString(payload.Website) {
		return errors.New("website is not allowed")
	}
	if _, ok := h.allowedHosts[strings.ToLower(strings.TrimSpace(payload.Hostname))]; !ok {
		return errors.New("hostname is not allowed")
	}
	if err := h.validatePageURL(payload.URL); err != nil {
		return err
	}
	if len(payload.Title) > 300 || hasControlCharacters(payload.Title) || traversalLikeTitle(payload.Title) {
		return errors.New("invalid page title")
	}
	if payload.Screen != "" && !analyticsScreenPattern.MatchString(payload.Screen) {
		return errors.New("invalid screen dimensions")
	}
	if payload.Language != "" && !analyticsLocalePattern.MatchString(payload.Language) {
		return errors.New("invalid language")
	}
	if len(payload.Name) > 100 || len(payload.Tag) > 100 || hasControlCharacters(payload.Name) || hasControlCharacters(payload.Tag) {
		return errors.New("invalid event metadata")
	}
	if len(payload.Data) > 8<<10 {
		return errors.New("analytics event data is too large")
	}
	if len(payload.Data) > 0 {
		var object map[string]any
		if err := json.Unmarshal(payload.Data, &object); err != nil || object == nil {
			return errors.New("analytics event data must be an object")
		}
	}
	if !validateAnalyticsMetric(payload.LCP) || !validateAnalyticsMetric(payload.INP) || !validateAnalyticsMetric(payload.FCP) || !validateAnalyticsMetric(payload.TTFB) || payload.CLS != nil && (*payload.CLS < 0 || *payload.CLS > 100) {
		return errors.New("invalid performance metric")
	}
	referrer, err := sanitizeAnalyticsReferrer(payload.Referrer)
	if err != nil {
		return err
	}
	payload.Referrer = referrer
	return nil
}

func firstForwardedIP(r *http.Request) string {
	for _, raw := range strings.Split(r.Header.Get("X-Forwarded-For"), ",") {
		if ip := net.ParseIP(strings.TrimSpace(raw)); ip != nil {
			return ip.String()
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		if ip := net.ParseIP(host); ip != nil {
			return ip.String()
		}
	}
	return ""
}

// Collect menolak payload di luar kontrak dan hanya meneruskan field analitik anonim yang dikenal.
func (h *VisitorAnalyticsHandler) Collect(w http.ResponseWriter, r *http.Request) {
	if h.configuration != nil {
		response.Error(w, r, http.StatusServiceUnavailable, "Analitik pengunjung belum siap", nil)
		return
	}
	origin, err := canonicalAnalyticsOrigin(r.Header.Get("Origin"))
	if err != nil {
		response.Error(w, r, http.StatusForbidden, "Origin analitik tidak diizinkan", nil)
		return
	}
	if _, ok := h.allowedOrigins[origin]; !ok {
		response.Error(w, r, http.StatusForbidden, "Origin analitik tidak diizinkan", nil)
		return
	}
	contentType := strings.ToLower(strings.TrimSpace(strings.Split(r.Header.Get("Content-Type"), ";")[0]))
	if contentType != "application/json" {
		response.Error(w, r, http.StatusUnsupportedMediaType, "Format analitik harus JSON", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, visitorAnalyticsBodyLimit)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var envelope visitorAnalyticsEnvelope
	if err := decoder.Decode(&envelope); err != nil {
		response.Error(w, r, http.StatusBadRequest, "Payload analitik tidak valid", nil)
		return
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		response.Error(w, r, http.StatusBadRequest, "Payload analitik tidak valid", nil)
		return
	}
	if err := h.validate(&envelope); err != nil {
		response.Error(w, r, http.StatusBadRequest, "Payload analitik ditolak", nil)
		return
	}
	body, err := json.Marshal(envelope)
	if err != nil {
		response.Error(w, r, http.StatusBadRequest, "Payload analitik tidak valid", nil)
		return
	}
	request, err := http.NewRequestWithContext(r.Context(), http.MethodPost, h.endpoint, bytes.NewReader(body))
	if err != nil {
		response.Error(w, r, http.StatusServiceUnavailable, "Analitik pengunjung tidak tersedia", nil)
		return
	}
	request.Header.Set("Content-Type", "application/json")
	if userAgent := strings.TrimSpace(r.UserAgent()); len(userAgent) <= 512 && !hasControlCharacters(userAgent) {
		request.Header.Set("User-Agent", userAgent)
	}
	if forwardedIP := firstForwardedIP(r); forwardedIP != "" {
		request.Header.Set("X-Forwarded-For", forwardedIP)
	}
	if cacheToken := strings.TrimSpace(r.Header.Get("X-Umami-Cache")); len(cacheToken) <= 4096 && !hasControlCharacters(cacheToken) {
		request.Header.Set("X-Umami-Cache", cacheToken)
	}

	upstream, err := h.client.Do(request)
	if err != nil {
		response.Error(w, r, http.StatusServiceUnavailable, "Analitik pengunjung tidak tersedia", nil)
		return
	}
	defer upstream.Body.Close()
	upstreamBody, err := io.ReadAll(io.LimitReader(upstream.Body, visitorAnalyticsResponseLimit+1))
	if err != nil || len(upstreamBody) > visitorAnalyticsResponseLimit || upstream.StatusCode >= http.StatusInternalServerError {
		response.Error(w, r, http.StatusBadGateway, "Analitik pengunjung tidak tersedia", nil)
		return
	}
	if !json.Valid(upstreamBody) {
		response.Error(w, r, http.StatusBadGateway, "Respons analitik tidak valid", nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(upstream.StatusCode)
	_, _ = w.Write(upstreamBody)
}
