package handler

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestPortalManagementRequiresTrustedProofAndIdentity(t *testing.T) {
	h := &PortalHandler{proof: strings.Repeat("a", 64)}
	r := httptest.NewRequest("GET", "/api/v1/portal/manage", nil)
	w := httptest.NewRecorder()
	if h.authorized(w, r) || w.Code != 403 {
		t.Fatal("untrusted access allowed")
	}
	r.Header.Set("X-Portal-Authorization", h.proof)
	w = httptest.NewRecorder()
	if h.authorized(w, r) {
		t.Fatal("missing identity allowed")
	}
	r.Header.Set("X-Actor-ID", "actor")
	r.Header.Set("X-Actor-Username", "operator")
	if !h.authorized(httptest.NewRecorder(), r) {
		t.Fatal("trusted request rejected")
	}
}
func TestPortalChangeRejectsInvalidVersionReasonTrailingJSON(t *testing.T) {
	for _, body := range []string{`{"expected_version":-1,"reason":"valid reason"}`, `{"reason":"x"}`, `{"expected_version":0,"reason":"valid reason"}{}`, `{"unexpected":true}`} {
		r := httptest.NewRequest("PUT", "/api/v1/portal/manage", strings.NewReader(body))
		if _, ok := decodePortalChange(httptest.NewRecorder(), r); ok {
			t.Fatalf("invalid request accepted: %s", body)
		}
	}
}
