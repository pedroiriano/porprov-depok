package portal

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestBaselineAndProjection(t *testing.T) {
	d := Default()
	if err := d.Validate(); err != nil {
		t.Fatal(err)
	}
	d.Pages[1].Status = "draft"
	d.Pages[1].Sections = []Section{{ID: "secret", Type: "text", Body: "UNPUBLISHED"}}
	data, _ := json.Marshal(d.Public())
	if strings.Contains(string(data), "UNPUBLISHED") {
		t.Fatal("draft content leaked")
	}
}
func TestValidateGuards(t *testing.T) {
	for _, test := range []struct {
		name string
		edit func(*Document)
	}{
		{"protected home", func(d *Document) { d.Modules[0].Mode = "disabled" }},
		{"unknown module", func(d *Document) { d.Modules[1].ID = "accounts" }},
		{"duplicate module", func(d *Document) { d.Modules[1].ID = "home" }},
		{"external missing URL", func(d *Document) { d.Modules[1].Mode = "external" }},
		{"unsafe external URL", func(d *Document) { d.Modules[1].ExternalURL = "https://127.0.0.1/" }},
		{"builtin path mutation", func(d *Document) { d.Pages[1].Path = "/admin" }},
		{"unsafe upload", func(d *Document) { d.Pages[0].Sections[0].ImageURL = "/uploads/../private" }},
		{"executable template", func(d *Document) { d.Pages[0].Sections[0].Type = "script" }},
		{"cyclic menu", func(d *Document) { d.Menus[0].ParentID = d.Menus[0].ID }},
		{"cross-location parent", func(d *Document) { d.Menus[7].ParentID = d.Menus[0].ID }},
	} {
		t.Run(test.name, func(t *testing.T) {
			d := Default()
			test.edit(&d)
			if d.Validate() == nil {
				t.Fatal("unsafe configuration accepted")
			}
		})
	}
}
func TestSafeLinks(t *testing.T) {
	for _, s := range []string{"javascript:alert(1)", "//evil.test", "https://user:pass@jabarprov.go.id/", "https://jabarprov.go.id.evil.test/", "https://127.0.0.1/", "/admin/../x", "/cabor?redirect=https://evil.test", "https://jabarprov.go.id:443/", "/cabor%2f..%2fadmin"} {
		if SafeTarget(s) {
			t.Errorf("unsafe target accepted: %s", s)
		}
	}
	for _, s := range []string{"/", "/cabor/golf", "/#maskot", "https://jabarprov.go.id/", "https://dispora.jabarprov.go.id/"} {
		if !SafeTarget(s) {
			t.Errorf("safe target rejected: %s", s)
		}
	}
}
func TestDecodeRejectsTrailingAndUnknown(t *testing.T) {
	data, _ := json.Marshal(Default())
	if _, e := Decode(append(data, []byte("{}")...)); e == nil {
		t.Fatal("trailing JSON accepted")
	}
	if _, e := Decode([]byte(`{"schema_version":1,"unknown":true}`)); e == nil {
		t.Fatal("unknown field accepted")
	}
}
func TestCapabilityGuards(t *testing.T) {
	for _, test := range []struct {
		name, path, method                 string
		admin, internal, disabled, offline bool
		want                               int
	}{
		{name: "public baseline", path: "/api/v1/medals/standings", method: "GET", want: 204},
		{name: "public disabled", path: "/api/v1/medals/standings", method: "GET", disabled: true, want: 403},
		{name: "admin disabled write", path: "/api/v1/medals/add", method: "POST", disabled: true, admin: true, want: 403},
		{name: "anonymous cannot select public capability for writes", path: "/api/v1/medals/add", method: "POST", disabled: true, want: 403},
		{name: "internal reference read preserved", path: "/api/v1/medals/standings", method: "GET", disabled: true, internal: true, want: 204},
		{name: "failed config lookup", path: "/api/v1/medals/add", method: "POST", offline: true, want: 503},
		{name: "health independent", path: "/health", method: "GET", offline: true, want: 204},
		{name: "portal control independent", path: "/api/v1/portal/manage", method: "PUT", offline: true, want: 204},
	} {
		t.Run(test.name, func(t *testing.T) {
			load := func(context.Context) (Document, error) {
				d := Default()
				if test.offline {
					return d, errors.New("offline")
				}
				if test.disabled {
					for i := range d.Modules {
						if d.Modules[i].ID == "medali" {
							d.Modules[i].PublicEnabled = false
							d.Modules[i].AdminEnabled = false
						}
					}
				}
				return d, nil
			}
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) })
			rec := httptest.NewRecorder()
			Guard(load, func(*http.Request) bool { return test.admin }, test.internal)(next).ServeHTTP(rec, httptest.NewRequest(test.method, test.path, nil))
			if rec.Code != test.want {
				t.Fatalf("got %d want %d", rec.Code, test.want)
			}
		})
	}
}
func TestManagementProofBounded(t *testing.T) {
	if ManagementProof("short") != "" {
		t.Fatal("weak secret accepted")
	}
	if ManagementProof(strings.Repeat("a", 32)) == ManagementProof(strings.Repeat("b", 32)) {
		t.Fatal("purpose proofs collided")
	}
}

func TestConfigurationOriginCannotBeExternal(t *testing.T) {
	for _, origin := range []string{"https://example.com", "http://169.254.169.254", "file:///etc/passwd", "http://user:pass@master-data-service:8081"} {
		if _, err := RemoteLoader(origin)(context.Background()); err == nil {
			t.Fatalf("untrusted origin accepted: %s", origin)
		}
	}
}

func TestParticipantCapabilityCannotBeBypassedInMatchBody(t *testing.T) {
	for _, path := range []string{"/api/v1/schedule/matches", "/api/v1/matches"} {
		d := Default()
		for i := range d.Modules {
			if d.Modules[i].ID == "atlet" {
				d.Modules[i].AdminEnabled = false
			}
		}
		load := func(context.Context) (Document, error) { return d, nil }
		guard := Guard(load, func(*http.Request) bool { return true }, true)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }))
		r := httptest.NewRequest("POST", path, strings.NewReader(`{"participants":[]}`))
		w := httptest.NewRecorder()
		guard.ServeHTTP(w, r)
		if w.Code != 403 {
			t.Fatalf("participant capability bypass: %d", w.Code)
		}
		r = httptest.NewRequest("POST", path, strings.NewReader(`{"status":"scheduled"}`))
		w = httptest.NewRecorder()
		guard.ServeHTTP(w, r)
		if w.Code != 204 {
			t.Fatalf("non-participant schedule update blocked: %d", w.Code)
		}
	}
}
