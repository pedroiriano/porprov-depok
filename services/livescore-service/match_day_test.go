package main

import (
	"context"
	"errors"
	"github.com/go-chi/chi/v5"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// TEST: WIB midnight is the boundary, not UTC midnight, browser time, or the scheduled starting hour.
func TestScoringMatchDayWIB(t *testing.T) {
	for _, tc := range []struct {
		name, date, now     string
		future, unavailable bool
	}{
		{"before day", "2026-11-03T09:00:00Z", "2026-11-02T16:59:59Z", true, false},
		{"WIB midnight", "2026-11-03T09:00:00Z", "2026-11-02T17:00:00Z", false, false},
		{"same day before start", "2026-11-03T09:00:00Z", "2026-11-03T01:00:00Z", false, false},
		{"past day", "2026-11-01T09:00:00Z", "2026-11-03T01:00:00Z", false, false},
		{"missing date", "", "2026-11-03T01:00:00Z", false, true},
		{"malformed date", "tomorrow", "2026-11-03T01:00:00Z", false, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if strings.HasSuffix(r.URL.Path, "/participants") {
					_, _ = w.Write([]byte(`[{"participant_type":"team","slot":1},{"participant_type":"team","slot":2}]`))
					return
				}
				_, _ = w.Write([]byte(`{"match_date":"` + tc.date + `"}`))
			}))
			defer upstream.Close()
			now, _ := time.Parse(time.RFC3339, tc.now)
			s := &server{scheduleURL: upstream.URL, httpClient: upstream.Client(), now: func() time.Time { return now }}
			err := s.validateActiveMatch(context.Background(), "00000000-0000-4000-8000-000000000001")
			if tc.future && !errors.Is(err, errMatchFuture) {
				t.Fatalf("future date accepted: %v", err)
			}
			if tc.unavailable && !errors.Is(err, errScheduleDown) {
				t.Fatalf("invalid date not fail-closed: %v", err)
			}
			if !tc.future && !tc.unavailable && err != nil {
				t.Fatal(err)
			}
		})
	}
}

// TEST: Both mutation handlers reject a future date before touching a database (pool intentionally nil).
func TestFutureScoreHandlersRejectBeforePersistence(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"match_date":"2099-11-03T01:00:00Z"}`))
	}))
	defer upstream.Close()
	s := &server{scheduleURL: upstream.URL, httpClient: upstream.Client()}
	for _, correction := range []bool{false, true} {
		request := httptest.NewRequest("POST", "/", strings.NewReader(`{"matchId":"00000000-0000-4000-8000-000000000001","scoreA":1,"scoreB":0,"status":"Selesai","correctionReason":"Koreksi resmi"}`))
		request.Header.Set("X-Actor-ID", "operator")
		route := chi.NewRouteContext()
		route.URLParams.Add("matchID", "00000000-0000-4000-8000-000000000001")
		request = request.WithContext(context.WithValue(request.Context(), chi.RouteCtxKey, route))
		response := httptest.NewRecorder()
		if correction {
			s.correctScore(response, request)
		} else {
			s.updateScore(response, request)
		}
		if response.Code != 422 || !strings.Contains(response.Body.String(), "tanggal pertandingan") {
			t.Fatalf("future score mutation not rejected: %d", response.Code)
		}
	}
}
