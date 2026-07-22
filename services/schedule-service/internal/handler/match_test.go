package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReferenceExists(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/exists" {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	handler := NewMatchHandler(nil, nil, server.URL, server.URL)
	exists, err := handler.referenceExists(context.Background(), server.URL+"/exists")
	if err != nil || !exists {
		t.Fatalf("expected existing reference, exists=%v err=%v", exists, err)
	}

	exists, err = handler.referenceExists(context.Background(), server.URL+"/missing")
	if err != nil {
		t.Fatalf("expected no transport error, got %v", err)
	}
	if exists {
		t.Fatal("expected missing reference")
	}
}
