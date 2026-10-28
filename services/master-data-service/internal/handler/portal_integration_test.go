package handler

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

// TEST: Connection-local temporary tables shadow the real portal tables; all fixture state rolls back.
func TestPortalLifecycleIsolatedPostgres(t *testing.T) {
	connection := os.Getenv("PORTAL_TEST_DATABASE_URL")
	if connection == "" {
		t.Skip("isolated local PostgreSQL test not requested")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, connection)
	if err != nil {
		t.Fatal("local test database configuration invalid")
	}
	defer pool.Close()
	transaction, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal("local test database unavailable")
	}
	defer transaction.Rollback(ctx)
	migration, err := os.ReadFile("../../migrations/000016_create_portal_management.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	sql := strings.ReplaceAll(string(migration), "CREATE TABLE portal_", "CREATE TEMP TABLE portal_")
	sql = strings.ReplaceAll(sql, "CREATE FUNCTION prevent_portal_revision_mutation", "CREATE FUNCTION pg_temp.prevent_portal_revision_mutation")
	sql = strings.ReplaceAll(sql, "EXECUTE FUNCTION prevent_portal_revision_mutation()", "EXECUTE FUNCTION pg_temp.prevent_portal_revision_mutation()")
	if _, err = transaction.Exec(ctx, sql); err != nil {
		t.Fatal("temporary schema setup failed")
	}
	h := &PortalHandler{pool: transaction, proof: strings.Repeat("a", 64)}
	call := func(action string, version int64, document portal.Document, revision int64, want int) {
		t.Helper()
		body, _ := json.Marshal(portalChange{ExpectedVersion: version, Document: document, RevisionID: revision, Reason: "UAT konfigurasi terisolasi"})
		request := httptest.NewRequest("POST", "/api/v1/portal/manage", strings.NewReader(string(body)))
		request.Header.Set("X-Portal-Authorization", h.proof)
		request.Header.Set("X-Actor-ID", "00000000-0000-4000-8000-000000000001")
		request.Header.Set("X-Actor-Username", "uat-portal-isolated")
		response := httptest.NewRecorder()
		h.Change(action).ServeHTTP(response, request)
		if response.Code != want {
			t.Fatalf("%s: status=%d body=%s", action, response.Code, response.Body.String())
		}
	}
	base := portal.Default()
	base.Features[1].PublicEnabled = false
	call("SAVE_DRAFT", 0, base, 0, 200)
	draft := portal.Default()
	draft.Pages = append(draft.Pages, portal.Page{ID: "uat-page", Path: "/informasi/uat-portal", Title: "UAT Portal", Status: "published", Sections: []portal.Section{{ID: "uat-text", Type: "text", Enabled: true, Variant: "standard", Heading: "UAT", Body: "VISIBLE_AFTER_PUBLICATION"}}}, portal.Page{ID: "private-draft", Path: "/informasi/private-draft", Title: "Draf privat", Status: "draft", Sections: []portal.Section{{ID: "private-text", Type: "text", Enabled: true, Variant: "standard", Body: "NEVER_PUBLIC"}}})
	call("SAVE_DRAFT", 1, draft, 0, 200)
	call("SAVE_DRAFT", 1, base, 0, 409)
	public, err := h.LoadPublished(ctx)
	if err != nil {
		t.Fatal(err)
	}
	data, _ := json.Marshal(public)
	if strings.Contains(string(data), "VISIBLE_AFTER_PUBLICATION") {
		t.Fatal("global draft leaked before publish")
	}
	call("PUBLISH", 2, portal.Document{}, 0, 200)
	public, err = h.LoadPublished(ctx)
	if err != nil {
		t.Fatal(err)
	}
	data, _ = json.Marshal(public)
	if !strings.Contains(string(data), "VISIBLE_AFTER_PUBLICATION") || strings.Contains(string(data), "NEVER_PUBLIC") {
		t.Fatal("published projection incorrect")
	}
	call("RESTORE", 3, portal.Document{}, 1, 200)
	public, err = h.LoadPublished(ctx)
	if err != nil || public.Version != 3 {
		t.Fatal("restore must not immediately replace publication")
	}
	call("PUBLISH", 4, portal.Document{}, 0, 200)
	public, err = h.LoadPublished(ctx)
	if err != nil || public.Version != 5 || len(public.Pages) != len(base.Pages) {
		t.Fatal("restored publication does not match baseline")
	}
	var revisions, events int
	legacy := portal.Default()
	legacy.Features = nil
	for i := range legacy.Pages {
		if legacy.Pages[i].ID == "jadwal" {
			legacy.Pages[i].Sections = []portal.Section{{ID: "native", Type: "content", Enabled: false, Variant: "compact"}}
		}
	}
	call("SAVE_DRAFT", 5, legacy, 0, 200)
	current, err := h.read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if current.Draft.LocalFeature("schedule_matches", false) {
		t.Fatal("older client reactivated a locked feature flag")
	}
	for _, section := range current.Draft.PageFor("/jadwal").Sections {
		if section.Enabled {
			t.Fatal("hidden legacy slot was reactivated")
		}
	}
	if err = transaction.QueryRow(ctx, "SELECT count(*) FROM portal_revisions").Scan(&revisions); err != nil {
		t.Fatal(err)
	}
	if err = transaction.QueryRow(ctx, "SELECT count(*) FROM portal_outbox WHERE published_at IS NULL").Scan(&events); err != nil {
		t.Fatal(err)
	}
	if revisions != 6 || events != 6 {
		t.Fatal("snapshot or transactional outbox missing")
	}
	savepoint, err := transaction.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	_, err = savepoint.Exec(ctx, "UPDATE portal_revisions SET reason='tampered' WHERE id=1")
	if err == nil {
		t.Fatal("immutable revision could be changed")
	}
	_ = savepoint.Rollback(ctx)
}
