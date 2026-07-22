package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestValidateScoreRequestRejectsNegativeScore(t *testing.T) {
	payload := scoreRequest{MatchID: "00000000-0000-4000-8000-000000000001", ScoreA: -1, Status: "Berlangsung"}
	if err := validateScoreRequest(&payload, false); err == nil {
		t.Fatal("expected negative score validation error")
	}
}

func TestValidateActiveMatchRejectsMissingSchedule(t *testing.T) {
	upstream := httptest.NewServer(http.NotFoundHandler())
	defer upstream.Close()
	service := &server{scheduleURL: upstream.URL, httpClient: &http.Client{Timeout: time.Second}}
	if err := service.validateActiveMatch(context.Background(), "00000000-0000-4000-8000-000000000001"); !errors.Is(err, errMatchNotActive) {
		t.Fatalf("expected inactive match error, got %v", err)
	}
}

func TestValidateActiveMatchRequiresTwoParticipantSlots(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if strings.HasSuffix(r.URL.Path, "/participants") {
			_, _ = w.Write([]byte(`[{"participant_type":"individual","slot":1}]`))
			return
		}
		_, _ = w.Write([]byte(`{"id":"00000000-0000-4000-8000-000000000001"}`))
	}))
	defer upstream.Close()
	service := &server{scheduleURL: upstream.URL, httpClient: &http.Client{Timeout: time.Second}}
	if err := service.validateActiveMatch(context.Background(), "00000000-0000-4000-8000-000000000001"); !errors.Is(err, errParticipantsOpen) {
		t.Fatalf("expected incomplete participant error, got %v", err)
	}
}

func TestValidateActiveMatchAcceptsTwoOrderedParticipants(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if strings.HasSuffix(r.URL.Path, "/participants") {
			_, _ = w.Write([]byte(`[{"participant_type":"individual","slot":1},{"participant_type":"team","slot":2}]`))
			return
		}
		_, _ = w.Write([]byte(`{"id":"00000000-0000-4000-8000-000000000001"}`))
	}))
	defer upstream.Close()
	service := &server{scheduleURL: upstream.URL, httpClient: &http.Client{Timeout: time.Second}}
	if err := service.validateActiveMatch(context.Background(), "00000000-0000-4000-8000-000000000001"); err != nil {
		t.Fatalf("expected ready match, got %v", err)
	}
}

func TestValidateCorrectionRequiresReason(t *testing.T) {
	payload := scoreRequest{MatchID: "00000000-0000-4000-8000-000000000001", Status: "Selesai", CorrectionReason: "x"}
	if err := validateScoreRequest(&payload, true); err == nil {
		t.Fatal("expected correction reason validation error")
	}
}

func TestTrustedActorRejectsDirectAnonymousMutation(t *testing.T) {
	request := httptest.NewRequest("POST", "/api/v1/livescore/update", nil)
	if _, err := trustedActor(request); err == nil {
		t.Fatal("expected anonymous mutation to be rejected")
	}
}

func TestValidateScoreRequestRejectsInvalidMatchUUID(t *testing.T) {
	payload := scoreRequest{MatchID: "smoke-test", Status: "Berlangsung"}
	if err := validateScoreRequest(&payload, false); err == nil {
		t.Fatal("expected invalid match UUID to be rejected")
	}
}

func TestValidateScoreRequestRejectsNegativeExpectedRevision(t *testing.T) {
	revision := int64(-1)
	payload := scoreRequest{MatchID: "00000000-0000-4000-8000-000000000001", Status: "Berlangsung", ExpectedRevision: &revision}
	if err := validateScoreRequest(&payload, false); err == nil {
		t.Fatal("expected negative expected revision to be rejected")
	}
}
