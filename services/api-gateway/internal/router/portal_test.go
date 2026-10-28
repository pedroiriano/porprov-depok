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

func servePortalFixture(w http.ResponseWriter, r *http.Request) bool {
	if r.URL.Path == "/api/v1/portal/public" {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(portal.Default().Public())
		return true
	}
	if r.URL.Path == "/api/v1/authorization/session" {
		_ = json.NewEncoder(w).Encode(map[string]bool{"active": true})
		return true
	}
	return false
}
func TestPortalManagerRoleAndHeaderBoundary(t *testing.T) {
	jwt, key, issuer := testJWTMiddleware(t)
	calls := 0
	proof := ""
	freshAllowed := true
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if servePortalFixture(w, r) {
			return
		}
		if r.URL.Path == "/api/v1/authorization/check" {
			_ = json.NewEncoder(w).Encode(map[string]bool{"active": true, "allowed": freshAllowed})
			return
		}
		calls++
		proof = r.Header.Get("X-Portal-Authorization")
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	cfg := &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", UserURL: upstream.URL, InternalStreamToken: strings.Repeat("p", 32)}
	router := SetupRouter(jwt, cfg)
	for _, role := range []string{"auditor", "super_admin"} {
		request := httptest.NewRequest("GET", "/api/v1/portal/manage", nil)
		request.Header.Set("Authorization", "Bearer "+signedTestToken(t, key, issuer, role))
		request.Header.Set("X-Portal-Authorization", "spoofed")
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		want := 403
		if role == "super_admin" {
			want = 204
		}
		if response.Code != want {
			t.Fatalf("%s status=%d", role, response.Code)
		}
	}
	if calls != 1 || proof != portal.ManagementProof(cfg.InternalStreamToken) {
		t.Fatal("role or trusted proof was bypassed")
	}
	freshAllowed = false
	request := httptest.NewRequest("GET", "/api/v1/portal/manage", nil)
	request.Header.Set("Authorization", "Bearer "+signedTestToken(t, key, issuer, "super_admin"))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != 403 || calls != 1 {
		t.Fatal("revoked permissions bypassed by stale realm role")
	}
}
func TestDisabledModuleAndForgedAuthorizationAreBlocked(t *testing.T) {
	jwt, _, _ := testJWTMiddleware(t)
	dataCalls := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/portal/public" {
			d := portal.Default()
			for i := range d.Modules {
				if d.Modules[i].ID == "cabor" {
					d.Modules[i].PublicEnabled = false
				}
			}
			_ = json.NewEncoder(w).Encode(d.Public())
			return
		}
		dataCalls++
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	router := SetupRouter(jwt, &config.AppConfig{MasterDataURL: upstream.URL, UserURL: upstream.URL})
	for _, authorization := range []string{"", "Bearer forged"} {
		request := httptest.NewRequest("GET", "/api/v1/master-data/cabors", nil)
		request.Header.Set("Authorization", authorization)
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != 403 && response.Code != 401 {
			t.Fatalf("module bypass status=%d", response.Code)
		}
	}
	if dataCalls != 0 {
		t.Fatal("disabled data reached upstream")
	}
}
