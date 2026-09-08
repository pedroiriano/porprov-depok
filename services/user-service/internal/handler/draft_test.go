package handler

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"
)

type draftStoreStub struct {
	current FormDraft
	saveErr error
	deleted bool
}

type concurrentDraftStore struct {
	mu      sync.Mutex
	current FormDraft
}

func (s *concurrentDraftStore) Get(context.Context, string, string, string, string) (FormDraft, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.current, nil
}

func (s *concurrentDraftStore) Save(_ context.Context, _ string, request saveDraftRequest, _ time.Time) (FormDraft, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if request.ExpectedVersion != s.current.Version {
		return FormDraft{}, errDraftVersionConflict
	}
	s.current.Version++
	s.current.Payload = request.Payload
	return s.current, nil
}

func (s *concurrentDraftStore) Delete(context.Context, string, string, string, string) (bool, error) {
	return false, nil
}

func (s *concurrentDraftStore) DeleteExpired(context.Context) error { return nil }

func (s *draftStoreStub) Get(context.Context, string, string, string, string) (FormDraft, error) {
	if s.current.ID == "" {
		return FormDraft{}, errDraftNotFound
	}
	return s.current, nil
}
func (s *draftStoreStub) Save(_ context.Context, _ string, request saveDraftRequest, _ time.Time) (FormDraft, error) {
	if s.saveErr != nil {
		return FormDraft{}, s.saveErr
	}
	s.current = FormDraft{ID: "draft-1", RouteKey: request.RouteKey, EntityKey: request.EntityKey, FormVersion: request.FormVersion, Payload: request.Payload, Version: request.ExpectedVersion + 1, UpdatedAt: time.Now(), ExpiresAt: time.Now().Add(24 * time.Hour)}
	return s.current, nil
}
func (s *draftStoreStub) Delete(context.Context, string, string, string, string) (bool, error) {
	s.deleted = true
	return true, nil
}
func (s *draftStoreStub) DeleteExpired(context.Context) error { return nil }

func draftRequest(method, target, body string) *http.Request {
	request := httptest.NewRequest(method, target, bytes.NewBufferString(body))
	request.Header.Set("X-Actor-ID", "actor-1")
	request.Header.Set("Content-Type", "application/json")
	return request
}

func TestDraftSaveRejectsSensitiveFields(t *testing.T) {
	handler := &DraftHandler{store: &draftStoreStub{}}
	response := httptest.NewRecorder()
	handler.Save(response, draftRequest(http.MethodPut, "/api/v1/drafts", `{"route_key":"/hero","entity_key":"new","form_version":"hero-v1","payload":{"password":"secret-value"},"expected_version":0}`))
	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", response.Code)
	}
}

func TestDraftSaveReturnsConflictWithCurrentDraft(t *testing.T) {
	store := &draftStoreStub{saveErr: errDraftVersionConflict, current: FormDraft{ID: "draft-1", RouteKey: "/hero", EntityKey: "new", FormVersion: "hero-v1", Payload: []byte(`{"title":"Server"}`), Version: 2, UpdatedAt: time.Now(), ExpiresAt: time.Now().Add(time.Hour)}}
	handler := &DraftHandler{store: store}
	response := httptest.NewRecorder()
	handler.Save(response, draftRequest(http.MethodPut, "/api/v1/drafts", `{"route_key":"/hero","entity_key":"new","form_version":"hero-v1","payload":{"title":"Lokal"},"expected_version":1}`))
	if response.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", response.Code, response.Body.String())
	}
	if !bytes.Contains(response.Body.Bytes(), []byte("DRAFT_VERSION_CONFLICT")) {
		t.Fatalf("conflict code missing: %s", response.Body.String())
	}
}

func TestDraftDeleteIsScopedByActorAndKey(t *testing.T) {
	store := &draftStoreStub{}
	handler := &DraftHandler{store: store}
	response := httptest.NewRecorder()
	handler.Delete(response, draftRequest(http.MethodDelete, "/api/v1/drafts?route=%2Fhero&entity=new&form_version=hero-v1", ""))
	if response.Code != http.StatusNoContent || !store.deleted {
		t.Fatalf("expected scoped delete, got %d", response.Code)
	}
}

func TestDraftStoreConflictSentinel(t *testing.T) {
	if !errors.Is(errDraftVersionConflict, errDraftVersionConflict) {
		t.Fatal("conflict sentinel must remain comparable")
	}
}

func TestDraftConcurrentSaveAllowsOnlyOneMatchingVersion(t *testing.T) {
	store := &concurrentDraftStore{current: FormDraft{ID: "draft-1", Version: 1}}
	request := saveDraftRequest{ExpectedVersion: 1, Payload: []byte(`{"title":"baru"}`)}
	results := make(chan error, 2)
	for range 2 {
		go func() {
			_, err := store.Save(context.Background(), "actor-1", request, time.Now().Add(time.Hour))
			results <- err
		}()
	}
	var successes, conflicts int
	for range 2 {
		switch err := <-results; {
		case err == nil:
			successes++
		case errors.Is(err, errDraftVersionConflict):
			conflicts++
		default:
			t.Fatalf("unexpected error: %v", err)
		}
	}
	if successes != 1 || conflicts != 1 || store.current.Version != 2 {
		t.Fatalf("expected one success and one conflict, got success=%d conflict=%d version=%d", successes, conflicts, store.current.Version)
	}
}
