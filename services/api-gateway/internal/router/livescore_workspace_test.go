package router

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
)

// TEST: Recording eligibility is independent from date eligibility; recorded matches never re-enter the new-score picker.
func TestWorkspaceFilteringAndOrphans(t *testing.T) {
	matches := []workspaceMatch{{ID: "a", Cabor: "Golf", MatchDate: "2026-11-03T17:00:00Z", Participants: []workspaceParticipant{{Name: "Atlet Utama"}}}, {ID: "b", Cabor: "Basket", MatchDate: "2026-11-02T17:00:00Z"}}
	scores := []workspaceScore{{MatchID: "b", ScoreA: 0, ScoreB: 1}, {MatchID: "archived", ScoreA: 2}}
	available := workspaceRows(matches, scores, workspaceQuery{view: "available", sort: "date", direction: "asc"})
	if len(available) != 1 || available[0].Match.ID != "a" {
		t.Fatal("recorded option leaked")
	}
	recorded := workspaceRows(matches, scores, workspaceQuery{view: "recorded", sort: "date", direction: "asc"})
	if len(recorded) != 2 {
		t.Fatal("orphan score lost")
	}
	day := workspaceRows(matches, scores, workspaceQuery{view: "recorded", date: "2026-11-03", sort: "date", direction: "asc"})
	if len(day) != 1 || day[0].Score.ScoreA != 0 {
		t.Fatal("WIB filter or zero score lost")
	}
	if len(workspaceRows(matches, scores, workspaceQuery{view: "available", q: "atlet utama"})) != 1 {
		t.Fatal("participant search failed")
	}
	if len(workspaceRows(matches, scores, workspaceQuery{view: "recorded", q: "' OR 1=1 --"})) != 0 {
		t.Fatal("search was not literal")
	}
}

func TestWorkspaceQueryValidation(t *testing.T) {
	for _, raw := range []string{"page=0", "per_page=101", "page=1000001", "page=1&page=2", "date=2026-02-30", "month=2026-13", "match_id=bad", "match_id=", "view=private", "sort=password", "direction=other", "unknown=value", "q=" + strings.Repeat("a", 81)} {
		values, _ := url.ParseQuery(raw)
		if _, err := parseWorkspaceQuery(values); err == nil {
			t.Errorf("accepted %s", raw)
		}
	}
}

func TestWorkspaceProjectionPrivacyPaginationAndFailure(t *testing.T) {
	private := true
	fail := false
	calls := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if fail {
			http.Error(w, "postgres password=never-expose", 500)
			return
		}
		if private {
			if r.Header.Get("X-Actor-ID") != "verified-user" {
				t.Error("actor not derived from context")
			}
		} else if r.Header.Get("X-Actor-ID") != "" || r.Header.Get("Authorization") != "" {
			t.Error("anonymous projection forwarded identity")
		}
		if r.URL.Path == "/matches/enriched" {
			_ = json.NewEncoder(w).Encode([]map[string]any{{"id": "11111111-1111-4111-8111-111111111111", "match_date": time.Now().Add(-time.Hour).UTC().Format(time.RFC3339), "cabor_name": "Golf", "participants": []map[string]any{{"slot": 1, "participant_type": "individual", "display_name": "Atlet A", "private_notes": "private"}, {"slot": 2, "participant_type": "individual", "display_name": "Atlet B"}}}})
			return
		}
		_ = json.NewEncoder(w).Encode([]map[string]any{{"matchId": "11111111-1111-4111-8111-111111111111", "scoreA": 0, "scoreB": 1, "sequence": 2, "revisionNumber": 2, "revisionId": "private-revision", "actor": "private-actor", "correctionReason": "private-correction", "status": "Official"}, {"matchId": "22222222-2222-4222-8222-222222222222", "scoreA": 7, "scoreB": 4}, {"matchId": "33333333-3333-4333-8333-333333333333", "scoreA": 0, "scoreB": 0}})
	}))
	defer upstream.Close()
	request := func(handler http.HandlerFunc, path string, authenticated bool) *httptest.ResponseRecorder {
		r := httptest.NewRequest("GET", path, nil)
		r.Header.Set("X-Actor-ID", "forged")
		r.Header.Set("Authorization", "Bearer browser-token")
		if authenticated {
			r = r.WithContext(context.WithValue(r.Context(), customMiddleware.UserContextKey, jwt.MapClaims{"sub": "verified-user"}))
		}
		w := httptest.NewRecorder()
		handler(w, r)
		return w
	}
	h := scoreWorkspace(upstream.URL, upstream.URL)
	w := request(h, "/?view=recorded&per_page=1", false)
	if w.Code != 401 || calls != 0 {
		t.Fatal("forged identity reached dependency")
	}
	w = request(h, "/?view=recorded&per_page=1", true)
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"total":3`) {
		t.Fatalf("page failed: %d", w.Code)
	}
	w = request(h, "/?per_page=1&page=2", true)
	var page struct {
		Data  []workspaceRow `json:"data"`
		Total int            `json:"total"`
	}
	if json.Unmarshal(w.Body.Bytes(), &page) != nil || page.Total != 3 || len(page.Data) != 1 || page.Data[0].Score.MatchID != "22222222-2222-4222-8222-222222222222" {
		t.Fatal("server pagination/count lost an archived score")
	}
	before := calls
	w = request(h, "/?per_page=101", true)
	if w.Code != 400 || calls != before {
		t.Fatal("invalid query reached dependency")
	}
	private = false
	pub := publicScoreResults(upstream.URL, upstream.URL)
	w = request(pub, "/?per_page=1", false)
	if w.Code != 200 {
		t.Fatalf("public failed %d", w.Code)
	}
	for _, secret := range []string{"actor", "revisionId", "correctionReason", "private_notes", "private-"} {
		if strings.Contains(w.Body.String(), secret) {
			t.Errorf("private projection field leaked: %s", secret)
		}
	}
	if !strings.Contains(w.Body.String(), `"scoreA":0`) {
		t.Fatal("zero became absent")
	}
	fail = true
	w = request(pub, "/", false)
	if w.Code != 503 || strings.Contains(w.Body.String(), "password") {
		t.Fatal("upstream error leaked")
	}
}

func TestWorkspaceRouteRequiresCurrentPermission(t *testing.T) {
	mid, key, issuer := testJWTMiddleware(t)
	allowed := true
	published := true
	calls := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/portal/public" {
			d := portal.Default()
			for i := range d.Modules {
				if d.Modules[i].ID == "livescore" {
					d.Modules[i].PublicEnabled = published
				}
			}
			_ = json.NewEncoder(w).Encode(d.Public())
			return
		}
		if servePortalFixture(w, r) {
			return
		}
		if r.URL.Path == "/api/v1/authorization/check" {
			_ = json.NewEncoder(w).Encode(map[string]bool{"active": true, "allowed": allowed})
			return
		}
		calls++
		_ = json.NewEncoder(w).Encode([]any{})
	}))
	defer upstream.Close()
	router := SetupRouter(mid, &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", ScheduleURL: upstream.URL, UserURL: upstream.URL, LivescoreURL: upstream.URL})
	request := func(token string, want int) {
		r := httptest.NewRequest("GET", "/api/v1/livescore/workspace", nil)
		if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("status %d want %d", w.Code, want)
		}
	}
	request("", 401)
	token := signedTestToken(t, key, issuer, "super_admin")
	request(token, 200)
	before := calls
	allowed = false
	request(token, 403)
	if calls != before {
		t.Fatal("revoked view permission reached upstream")
	}
	published = false
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("GET", "/api/v1/livescore/results", nil))
	if w.Code != 403 || calls != before {
		t.Fatal("disabled Public module bypassed")
	}
}

func TestWorkspaceDoesNotFollowCredentialRedirect(t *testing.T) {
	calls := 0
	other := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls++; t.Error("credential redirect followed") }))
	defer other.Close()
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, other.URL, 302) }))
	defer upstream.Close()
	r := httptest.NewRequest("GET", "/", nil).WithContext(context.WithValue(context.Background(), customMiddleware.UserContextKey, jwt.MapClaims{"sub": "real"}))
	r.Header.Set("Authorization", "Bearer private-token")
	w := httptest.NewRecorder()
	scoreWorkspace(upstream.URL, upstream.URL)(w, r)
	if w.Code != 503 || calls != 0 {
		t.Fatal("redirect was not rejected")
	}
}

func TestWorkspacePublicSides(t *testing.T) {
	for _, kind := range []string{"individual", "team", "contingent"} {
		sides := []workspaceParticipant{{Slot: 1, Kind: kind, Name: "A"}, {Slot: 2, Kind: kind, Name: "B"}}
		if !workspaceSidesReady(sides) {
			t.Fatal("valid kind rejected")
		}
		sides[1].Slot = 1
		if workspaceSidesReady(sides) {
			t.Fatal("duplicate slot accepted")
		}
		sides[1].Slot = 2
		sides[1].Kind = "unknown"
		if workspaceSidesReady(sides) {
			t.Fatal("invalid kind accepted")
		}
		sides[1].Kind = kind
		sides[1].Name = ""
		if workspaceSidesReady(sides) {
			t.Fatal("missing name accepted")
		}
	}
}
