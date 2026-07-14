package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDeletionMetadataRequiresActorAndNormalizesReason(t *testing.T) {
	t.Parallel()

	missingActor := httptest.NewRequest(http.MethodDelete, "/resource", strings.NewReader(`{"reason":"duplikat"}`))
	missingResponse := httptest.NewRecorder()
	if _, _, ok := deletionMetadata(missingResponse, missingActor); ok {
		t.Fatal("expected missing actor to be rejected")
	}
	if missingResponse.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", missingResponse.Code)
	}

	request := httptest.NewRequest(http.MethodDelete, "/resource", strings.NewReader(`{"reason":"  data duplikat  "}`))
	request.Header.Set("X-Actor-ID", "operator-id")
	response := httptest.NewRecorder()
	actor, reason, ok := deletionMetadata(response, request)
	if !ok || actor != "operator-id" || reason != "data duplikat" {
		t.Fatalf("unexpected metadata actor=%q reason=%q ok=%v", actor, reason, ok)
	}
}

func TestScheduleReferenceCheck(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/references/nomor-tanding/resource-id" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"referenced":true}`))
	}))
	defer server.Close()

	handler := NewMasterDataHandler(nil, server.URL+"/api/v1")
	referenced, err := handler.hasActiveScheduleReference(context.Background(), "nomor-tanding", "resource-id")
	if err != nil || !referenced {
		t.Fatalf("expected active reference, referenced=%v err=%v", referenced, err)
	}
}
