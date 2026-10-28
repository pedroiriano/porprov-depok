package router

import (
	"encoding/json"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TEST: Disabled Schedule editing/publication does not become a bypass or break scoped LiveScore references.
func TestIndependentScheduleFeaturesAndReadReferences(t *testing.T) {
	jwt, key, issuer := testJWTMiddleware(t)
	allowed, livePublic := true, true
	calls := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/portal/public" {
			d := portal.Default()
			d.Features[1].PublicEnabled = false
			d.Features[1].AdminEnabled = false
			for i := range d.Modules {
				if d.Modules[i].ID == "livescore" {
					d.Modules[i].PublicEnabled = livePublic
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
		if r.URL.Path != "/api/v1/matches/enriched" && r.URL.Path != "/api/v1/periods" {
			t.Errorf("unexpected dependency path %s", r.URL.Path)
		}
		calls++
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	router := SetupRouter(jwt, &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", ScheduleURL: upstream.URL + "/api/v1", UserURL: upstream.URL})
	request := func(path, token string, want int) {
		t.Helper()
		r := httptest.NewRequest("GET", path, nil)
		if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("%s got %d want %d", path, w.Code, want)
		}
	}
	request("/api/v1/schedule/matches/enriched", "", 403)
	request("/api/v1/schedule/periods", "", 204)
	request("/api/v1/livescore/schedule-projection", "", 204)
	request("/api/v1/portal/references/livescore-matches", "", 401)
	token := signedTestToken(t, key, issuer, "super_admin")
	request("/api/v1/schedule/matches/enriched", token, 403)
	request("/api/v1/portal/references/livescore-matches", token, 204)
	before := calls
	allowed = false
	request("/api/v1/portal/references/livescore-matches", token, 403)
	if calls != before {
		t.Fatal("revoked read permission reached Schedule")
	}
	livePublic = false
	request("/api/v1/livescore/schedule-projection", "", 403)
	if calls != before {
		t.Fatal("reference bypassed owning LiveScore module")
	}
}
