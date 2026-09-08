package handler

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
)

type IntegrationStatus struct {
	Key                  string   `json:"key"`
	Available            bool     `json:"available"`
	LatencyMS            int64    `json:"latency_ms"`
	PendingItems         *int64   `json:"pending_items,omitempty"`
	RetryCount           *int64   `json:"retry_count,omitempty"`
	OldestPendingSeconds *float64 `json:"oldest_pending_seconds,omitempty"`
}

type integrationProbe struct {
	key     string
	target  string
	network bool
}

type IntegrationHealthHandler struct {
	probes []integrationProbe
	client *http.Client
}

func serviceHealthURL(rawURL, suffix string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}
	parsed.Path = suffix
	parsed.RawQuery = ""
	parsed.Fragment = ""
	return parsed.String()
}

func NewIntegrationHealthHandler(cfg *config.AppConfig) *IntegrationHealthHandler {
	return &IntegrationHealthHandler{
		client: &http.Client{Timeout: 2500 * time.Millisecond},
		probes: []integrationProbe{
			{key: "api", target: "local"},
			{key: "database", target: cfg.PostgresAddress, network: true},
			{key: "message_broker", target: cfg.NATSMonitorURL},
			{key: "cache", target: cfg.RedisAddress, network: true},
			{key: "identity", target: cfg.KeycloakJWKSURL},
			{key: "analytics", target: serviceHealthURL(cfg.UmamiURL, "/api/heartbeat")},
			{key: "users", target: serviceHealthURL(cfg.UserURL, "/health")},
			{key: "master_data", target: serviceHealthURL(cfg.MasterDataURL, "/health")},
			{key: "schedule", target: serviceHealthURL(cfg.ScheduleURL, "/health")},
			{key: "venues", target: serviceHealthURL(cfg.VenueURL, "/health")},
			{key: "live_scores", target: serviceHealthURL(cfg.LivescoreURL, "/health")},
			{key: "medals", target: serviceHealthURL(cfg.MedalsURL, "/health")},
			{key: "audit", target: serviceHealthURL(cfg.AuditURL, "/health")},
			{key: "realtime", target: serviceHealthURL(cfg.RealtimeURL, "/health")},
		},
	}
}

func (h *IntegrationHealthHandler) probe(ctx context.Context, probe integrationProbe) IntegrationStatus {
	started := time.Now()
	status := IntegrationStatus{Key: probe.key}
	if probe.target == "local" {
		status.Available = true
		return status
	}
	if strings.TrimSpace(probe.target) == "" {
		return status
	}
	if probe.network {
		connection, err := (&net.Dialer{Timeout: 2 * time.Second}).DialContext(ctx, "tcp", probe.target)
		if err == nil {
			status.Available = true
			_ = connection.Close()
		}
	} else {
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, probe.target, nil)
		if err == nil {
			response, requestErr := h.client.Do(request)
			if requestErr == nil {
				status.Available = response.StatusCode >= 200 && response.StatusCode < 400
				if status.Available && (probe.key == "live_scores" || probe.key == "medals") {
					var metrics struct {
						PendingItems         int64   `json:"pending_items"`
						RetryCount           int64   `json:"retry_count"`
						OldestPendingSeconds float64 `json:"oldest_pending_seconds"`
					}
					if json.NewDecoder(io.LimitReader(response.Body, 16<<10)).Decode(&metrics) == nil {
						status.PendingItems = &metrics.PendingItems
						status.RetryCount = &metrics.RetryCount
						status.OldestPendingSeconds = &metrics.OldestPendingSeconds
					}
				}
				_ = response.Body.Close()
			}
		}
	}
	status.LatencyMS = time.Since(started).Milliseconds()
	return status
}

func (h *IntegrationHealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 6*time.Second)
	defer cancel()
	results := make([]IntegrationStatus, len(h.probes))
	var group sync.WaitGroup
	for index, probe := range h.probes {
		group.Add(1)
		go func(i int, p integrationProbe) { defer group.Done(); results[i] = h.probe(ctx, p) }(index, probe)
	}
	group.Wait()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(map[string]any{"checked_at": time.Now().UTC(), "integrations": results})
}
