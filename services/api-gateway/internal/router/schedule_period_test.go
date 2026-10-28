package router

import (
	"encoding/json"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TEST: Public requests cannot smuggle the private proof; fresh permissions gate management separately.
func TestSchedulePeriodGatewayBoundaries(t *testing.T) {
	jwt, key, issuer := testJWTMiddleware(t)
	allowed := true
	calls := 0
	proof := ""
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if servePortalFixture(w, r) {
			return
		}
		if r.URL.Path == "/api/v1/authorization/check" {
			_ = json.NewEncoder(w).Encode(map[string]bool{"active": true, "allowed": allowed})
			return
		}
		calls++
		proof = r.Header.Get("X-Schedule-Authorization")
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	cfg := &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", ScheduleURL: upstream.URL + "/api/v1", UserURL: upstream.URL, InternalStreamToken: strings.Repeat("s", 32)}
	router := SetupRouter(jwt, cfg)
	request := func(path, token string, want int) {
		t.Helper()
		r := httptest.NewRequest("GET", path, nil)
		if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		r.Header.Set("X-Schedule-Authorization", "forged")
		r.Header.Set("X-Actor-ID", "forged")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("%s status %d, want %d", path, w.Code, want)
		}
	}
	request("/api/v1/schedule/periods", "", 204)
	if proof != "" {
		t.Fatal("client proof forwarded to public route")
	}
	request("/api/v1/schedule/periods/manage", "", 401)
	token := signedTestToken(t, key, issuer, "super_admin")
	request("/api/v1/schedule/periods/manage", token, 204)
	if proof != portal.SchedulePeriodsProof(cfg.InternalStreamToken) {
		t.Fatal("trusted schedule proof missing")
	}
	before := calls
	allowed = false
	request("/api/v1/schedule/periods/manage", token, 403)
	if calls != before {
		t.Fatal("revoked permission reached service")
	}
}
