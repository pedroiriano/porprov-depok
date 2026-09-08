package handler

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestServiceHealthURLRemovesInternalPath(t *testing.T) {
	got := serviceHealthURL("http://master-data-service:8081/api/v1", "/health")
	if got != "http://master-data-service:8081/health" {
		t.Fatalf("unexpected URL: %s", got)
	}
}

func TestIntegrationHealthDoesNotExposeTargets(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) }))
	defer server.Close()
	handler := &IntegrationHealthHandler{client: server.Client(), probes: []integrationProbe{{key: "api", target: "local"}, {key: "dependency", target: server.URL}}}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/v1/integrations/health", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	body := response.Body.String()
	if len(body) == 0 || contains(body, server.URL) {
		t.Fatalf("response must contain statuses without internal target: %s", body)
	}
}

func contains(value, target string) bool {
	if target == "" {
		return false
	}
	for index := 0; index+len(target) <= len(value); index++ {
		if value[index:index+len(target)] == target {
			return true
		}
	}
	return false
}

func TestNetworkProbeClosesConnection(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	go func() {
		connection, acceptErr := listener.Accept()
		if acceptErr == nil {
			_ = connection.Close()
		}
	}()
	handler := &IntegrationHealthHandler{client: http.DefaultClient}
	status := handler.probe(context.Background(), integrationProbe{key: "database", target: listener.Addr().String(), network: true})
	if !status.Available {
		t.Fatal("expected network dependency to be available")
	}
}

func TestOperationalProbeReturnsOnlyAggregateQueueMetrics(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"healthy","pending_items":2,"retry_count":1,"oldest_pending_seconds":4.5,"secret":"must-not-pass"}`))
	}))
	defer server.Close()
	handler := &IntegrationHealthHandler{client: server.Client()}
	status := handler.probe(context.Background(), integrationProbe{key: "live_scores", target: server.URL})
	if !status.Available || status.PendingItems == nil || *status.PendingItems != 2 || status.RetryCount == nil || *status.RetryCount != 1 {
		t.Fatalf("unexpected operational status: %#v", status)
	}
	encoded, err := json.Marshal(status)
	if err != nil {
		t.Fatal(err)
	}
	if contains(string(encoded), "secret") || contains(string(encoded), server.URL) {
		t.Fatalf("aggregate status leaked internal data: %s", encoded)
	}
}
