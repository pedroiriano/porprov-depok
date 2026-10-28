package handler

import (
	"context"
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

// TEST: Temporary tables and outer rollback isolate lifecycle UAT from real schedules and audit data.
func TestSchedulePeriodLifecycleIsolatedPostgres(t *testing.T) {
	connection := os.Getenv("SCHEDULE_PERIOD_TEST_DATABASE_URL")
	if connection == "" {
		t.Skip("isolated local PostgreSQL UAT not requested")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, connection)
	if err != nil {
		t.Fatal("test database configuration invalid")
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal("test database unavailable")
	}
	defer tx.Rollback(ctx)
	sql, err := os.ReadFile("../../migrations/000006_create_schedule_periods.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	schema := strings.ReplaceAll(string(sql), "CREATE TABLE schedule_period", "CREATE TEMP TABLE schedule_period")
	schema = strings.ReplaceAll(schema, "CREATE FUNCTION prevent_schedule_period_revision_mutation", "CREATE FUNCTION pg_temp.prevent_schedule_period_revision_mutation")
	schema = strings.ReplaceAll(schema, "EXECUTE FUNCTION prevent_schedule_period_revision_mutation()", "EXECUTE FUNCTION pg_temp.prevent_schedule_period_revision_mutation()")
	if _, err = tx.Exec(ctx, schema); err != nil {
		t.Fatal("temporary schema setup failed")
	}
	cabor := "00000000-0000-4000-8000-000000000001"
	reference := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/cabors/"+cabor {
			w.WriteHeader(404)
			return
		}
		_ = json.NewEncoder(w).Encode(caborReference{ID: cabor, Name: "Bola Basket"})
	}))
	defer reference.Close()
	h := NewPeriodHandler(tx, reference.URL+"/api/v1", strings.Repeat("s", 32))
	call := func(action, id string, change periodChange, want int) schedulePeriod {
		t.Helper()
		change.Reason = "Uji rentang jadwal terisolasi"
		body, _ := json.Marshal(change)
		r := httptest.NewRequest("POST", "/periods", strings.NewReader(string(body)))
		r.Header.Set("X-Schedule-Authorization", h.proof)
		r.Header.Set("X-Actor-ID", cabor)
		r.Header.Set("X-Actor-Username", "uat-period-isolated")
		route := chi.NewRouteContext()
		route.URLParams.Add("id", id)
		r = r.WithContext(context.WithValue(ctx, chi.RouteCtxKey, route))
		w := httptest.NewRecorder()
		h.Change(action).ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("%s status %d: %s", action, w.Code, w.Body.String())
		}
		var p schedulePeriod
		_ = json.Unmarshal(w.Body.Bytes(), &p)
		return p
	}
	list := func(query string, manage bool, total, count int) {
		t.Helper()
		r := httptest.NewRequest("GET", "/periods"+query, nil).WithContext(ctx)
		if manage {
			r.Header.Set("X-Schedule-Authorization", h.proof)
			r.Header.Set("X-Actor-ID", cabor)
			r.Header.Set("X-Actor-Username", "uat-period-isolated")
		}
		w := httptest.NewRecorder()
		h.List(manage).ServeHTTP(w, r)
		if w.Code != 200 {
			t.Fatalf("list status %d: %s", w.Code, w.Body.String())
		}
		var result struct {
			Total int               `json:"total"`
			Data  []json.RawMessage `json:"data"`
		}
		if json.Unmarshal(w.Body.Bytes(), &result) != nil || result.Total != total || len(result.Data) != count {
			t.Fatalf("listing total/count incorrect: %s", w.Body.String())
		}
		if !manage && strings.Contains(w.Body.String(), "is_published") {
			t.Fatal("private metadata leaked")
		}
	}
	input := periodChange{CaborID: cabor, StartsOn: "2026-10-31", EndsOn: "2026-11-05"}
	created := call("CREATE", "", input, 200)
	list("", false, 0, 0)
	input.ExpectedVersion = created.Version
	input.Published = true
	published := call("UPDATE", created.ID, input, 200)
	list("?date=2026-10-31", false, 1, 1)
	list("?date=2026-11-05", false, 1, 1)
	list("?date=2026-11-06", false, 0, 0)
	list("?per_page=1&page=2", false, 1, 0)
	call("UPDATE", created.ID, input, 409)
	input.ExpectedVersion = 0
	call("CREATE", "", input, 409)
	draft := input
	draft.Label = "DRAF_PRIVAT"
	draft.Published = false
	call("CREATE", "", draft, 200)
	list("?q=DRAF_PRIVAT", false, 0, 0)
	archived := call("ARCHIVE", created.ID, periodChange{ExpectedVersion: published.Version}, 200)
	list("", false, 0, 0)
	list("?archived=true", true, 1, 1)
	restored := call("RESTORE", created.ID, periodChange{ExpectedVersion: archived.Version}, 200)
	if restored.Published {
		t.Fatal("archive restore must return as unpublished draft")
	}
	list("", false, 0, 0)
	var revision string
	if err = tx.QueryRow(ctx, "SELECT id::text FROM schedule_period_revisions WHERE period_id=$1 AND version=2", created.ID).Scan(&revision); err != nil {
		t.Fatal(err)
	}
	latest := call("RESTORE_REVISION", created.ID, periodChange{ExpectedVersion: restored.Version, RevisionID: revision}, 200)
	if latest.Version != 5 || !latest.Published {
		t.Fatal("revision restore did not append new published version")
	}
	list("", false, 1, 1)
	var history, events int
	_ = tx.QueryRow(ctx, "SELECT count(*) FROM schedule_period_revisions WHERE period_id=$1", created.ID).Scan(&history)
	_ = tx.QueryRow(ctx, "SELECT count(*) FROM schedule_period_outbox WHERE published_at IS NULL").Scan(&events)
	if history != 5 || events != 6 {
		t.Fatalf("revision/outbox mismatch %d/%d", history, events)
	}
	savepoint, err := tx.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	_, err = savepoint.Exec(ctx, "UPDATE schedule_period_revisions SET reason='tampered' WHERE id=$1", revision)
	if err == nil {
		t.Fatal("immutable history was mutable")
	}
	_ = savepoint.Rollback(ctx)
}
