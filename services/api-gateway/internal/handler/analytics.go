package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/pkg/response"
)

type AnalyticsHandler struct {
	baseURL   string
	username  string
	password  string
	websiteID string
	client    *http.Client
	mu        sync.Mutex
	token     string
	tokenAt   time.Time
}

type analyticsLoginResponse struct {
	Token string `json:"token"`
}

type analyticsResult struct {
	name string
	data any
	err  error
}

// NewAnalyticsHandler membuat adapter read-only sehingga credential Umami tidak pernah masuk browser.
func NewAnalyticsHandler(baseURL, username, password, websiteID string) *AnalyticsHandler {
	return &AnalyticsHandler{
		baseURL:   strings.TrimRight(baseURL, "/"),
		username:  strings.TrimSpace(username),
		password:  password,
		websiteID: strings.TrimSpace(websiteID),
		client:    &http.Client{Timeout: 8 * time.Second},
	}
}

func (h *AnalyticsHandler) login(ctx context.Context) (string, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.token != "" && time.Since(h.tokenAt) < 10*time.Minute {
		return h.token, nil
	}
	payload, _ := json.Marshal(map[string]string{"username": h.username, "password": h.password})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, h.baseURL+"/api/auth/login", bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := h.client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, res.Body)
		return "", fmt.Errorf("umami authentication returned %d", res.StatusCode)
	}
	var session analyticsLoginResponse
	if err := json.NewDecoder(io.LimitReader(res.Body, 1<<20)).Decode(&session); err != nil || strings.TrimSpace(session.Token) == "" {
		return "", errors.New("umami authentication response is invalid")
	}
	h.token = session.Token
	h.tokenAt = time.Now()
	return h.token, nil
}

func (h *AnalyticsHandler) get(ctx context.Context, token, path string) (any, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, h.baseURL+path, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := h.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, res.Body)
		return nil, fmt.Errorf("umami endpoint returned %d", res.StatusCode)
	}
	var data any
	if err := json.NewDecoder(io.LimitReader(res.Body, 4<<20)).Decode(&data); err != nil {
		return nil, err
	}
	return data, nil
}

func analyticsRange(raw string) int {
	days, err := strconv.Atoi(raw)
	if err != nil {
		return 7
	}
	for _, allowed := range []int{1, 7, 30, 90} {
		if days == allowed {
			return days
		}
	}
	return 7
}

// Overview mengagregasi statistik yang dibutuhkan Dashboard Admin dalam satu request terproteksi.
func (h *AnalyticsHandler) Overview(w http.ResponseWriter, r *http.Request) {
	if h.baseURL == "" || h.username == "" || h.password == "" || h.websiteID == "" {
		response.Error(w, r, http.StatusServiceUnavailable, "Analytics belum dikonfigurasi", nil)
		return
	}
	days := analyticsRange(r.URL.Query().Get("days"))
	endAt := time.Now().UnixMilli()
	startAt := time.Now().Add(-time.Duration(days) * 24 * time.Hour).UnixMilli()
	token, err := h.login(r.Context())
	if err != nil {
		response.Error(w, r, http.StatusServiceUnavailable, "Statistik pengunjung tidak tersedia", nil)
		return
	}

	base := "/api/websites/" + url.PathEscape(h.websiteID)
	common := "?startAt=" + strconv.FormatInt(startAt, 10) + "&endAt=" + strconv.FormatInt(endAt, 10)
	unit := "day"
	if days == 1 {
		unit = "hour"
	}
	paths := map[string]string{
		"active":    base + "/active",
		"stats":     base + "/stats" + common,
		"pageviews": base + "/pageviews" + common + "&unit=" + unit,
		"top_pages": base + "/metrics" + common + "&type=path&limit=8",
		"referrers": base + "/metrics" + common + "&type=referrer&limit=8",
		"devices":   base + "/metrics" + common + "&type=device&limit=8",
		"browsers":  base + "/metrics" + common + "&type=browser&limit=8",
	}
	results := make(chan analyticsResult, len(paths))
	var wg sync.WaitGroup
	for name, path := range paths {
		wg.Add(1)
		go func(name, path string) {
			defer wg.Done()
			data, getErr := h.get(r.Context(), token, path)
			results <- analyticsResult{name: name, data: data, err: getErr}
		}(name, path)
	}
	wg.Wait()
	close(results)

	payload := map[string]any{"days": days, "timezone": "Asia/Jakarta"}
	for result := range results {
		if result.err != nil {
			response.Error(w, r, http.StatusServiceUnavailable, "Statistik pengunjung tidak tersedia", nil)
			return
		}
		payload[result.name] = result.data
	}
	response.JSON(w, r, http.StatusOK, "Statistik pengunjung berhasil dimuat", payload)
}
