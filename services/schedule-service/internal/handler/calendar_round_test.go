package handler

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

// TEST: Exercise PostgreSQL's real varchar semantics in an isolated temporary table, with no domain fixture.
func TestMatchCustomRoundPostgres(t *testing.T) {
	dsn := os.Getenv("SCHEDULE_PERIOD_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("isolated PostgreSQL fixture not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	connection, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal("isolated database unavailable")
	}
	defer connection.Close(ctx)
	tx, err := connection.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, "CREATE TEMP TABLE round_storage_regression (round varchar(50) NOT NULL) ON COMMIT DROP"); err != nil {
		t.Fatal(err)
	}
	for _, value := range []string{"putaran_1", "Putaran 5 Golf", "Seri 2 — Penentuan Peringkat", strings.Repeat("é", 50), "Final ' OR 1=1 --"} {
		normalized, err := normalizeMatchRound(value)
		if err != nil {
			t.Fatal(err)
		}
		var stored string
		if err = tx.QueryRow(ctx, "INSERT INTO round_storage_regression(round) VALUES ($1) RETURNING round", normalized).Scan(&stored); err != nil || stored != value {
			t.Fatalf("round persistence changed: %v", err)
		}
	}
}

func TestMatchRoundPreservesSportSpecificAndLegacyValues(t *testing.T) {
	for _, value := range []string{"penyisihan", "perempat_final", "putaran_1", "Putaran 5 Golf", "Seri 2 — Penentuan Peringkat", strings.Repeat("é", 50)} {
		got, err := normalizeMatchRound(" " + value + " ")
		if err != nil || got != value {
			t.Fatalf("round was lost: %q %v", got, err)
		}
	}
	for _, value := range []string{" ", strings.Repeat("é", 51), "Putaran\n1", "Babak\u202e1", string([]byte{0xff})} {
		if _, err := normalizeMatchRound(value); err == nil {
			t.Fatalf("invalid round accepted: %q", value)
		}
	}
}

func TestMatchCalendarValidation(t *testing.T) {
	for _, query := range []string{"month=2026-13", "month=1999-12", "date=2026-02-29", "month=2026-11-01&date=2026-11-01", "cabor=not-an-id", "per_page=101", "page=0", "status=a%0Ab"} {
		if _, err := parseMatchPageRequest(httptest.NewRequest("GET", "/?"+query, nil)); err == nil {
			t.Fatal("invalid filter accepted: " + query)
		}
	}
	page, err := parseMatchPageRequest(httptest.NewRequest("GET", "/?month=2026-11", nil))
	if err != nil || page == nil || page.month != "2026-11" {
		t.Fatalf("month must enable pagination: %v", err)
	}
	page, err = parseMatchPageRequest(httptest.NewRequest("GET", "/", nil))
	if err != nil || page != nil {
		t.Fatal("legacy collection contract changed")
	}
}

func TestMatchCalendarCountsBeforePaginationAndUsesWIB(t *testing.T) {
	sport := "00000000-0000-4000-8000-000000000001"
	items := []enrichedMatch{
		{ID: "b", CaborID: sport, CaborName: "Golf", Status: "scheduled", Round: "putaran_1", MatchDate: "2026-10-31T17:00:00Z"},
		{ID: "a", CaborID: sport, CaborName: "Golf", Status: "scheduled", Round: "Putaran 5", MatchDate: "2026-10-31T17:00:00Z"},
		{ID: "c", CaborID: sport, CaborName: "Golf", Status: "scheduled", MatchDate: "2026-11-30T17:00:00Z"},
		{ID: "d", CaborID: "other", CaborName: "Basket", Status: "finished", MatchDate: "2026-11-01T12:00:00Z"},
	}
	page, err := parseMatchPageRequest(httptest.NewRequest("GET", "/?month=2026-11&per_page=1&cabor="+sport+"&status=scheduled", nil))
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	writeMatchPage(recorder, items, page)
	var body struct {
		Data                    []enrichedMatch
		Total, Page, TotalPages int
		Calendar                struct {
			Month     string
			DayCounts map[string]int `json:"day_counts"`
		}
		Facets matchFacets
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Total != 2 || len(body.Data) != 1 || body.Data[0].ID != "a" || body.Calendar.DayCounts["2026-11-01"] != 2 || len(body.Facets.Cabors) != 2 {
		t.Fatalf("incomplete/unstable calendar: %s", recorder.Body.String())
	}
	page.date = "2026-11-02"
	recorder = httptest.NewRecorder()
	writeMatchPage(recorder, items, page)
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil || body.Total != 0 || len(body.Data) != 0 {
		t.Fatal("date filter failed")
	}
}
