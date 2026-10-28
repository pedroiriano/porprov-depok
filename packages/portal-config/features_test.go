package portal

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TEST: Legacy content order, visibility and parent-module decisions survive the additive registry change.
func TestLegacyScheduleFeatureNormalization(t *testing.T) {
	for _, enabled := range []bool{true, false} {
		d := Default()
		d.Features = nil
		for i := range d.Pages {
			if d.Pages[i].ID == "jadwal" {
				d.Pages[i].Sections = []Section{{ID: "before", Type: "text", Enabled: true, Variant: "standard"}, {ID: "native", Type: "content", Enabled: enabled, Variant: "compact"}, {ID: "after", Type: "text", Enabled: true, Variant: "standard"}}
			}
		}
		d.NormalizeLegacy()
		if err := d.Validate(); err != nil {
			t.Fatal(err)
		}
		page := d.PageFor("/jadwal")
		if len(d.Features) != 2 || len(page.Sections) != 4 || page.Sections[0].ID != "before" || page.Sections[3].ID != "after" || page.Sections[1].Type != "schedule_periods" || page.Sections[2].Type != "schedule_matches" {
			t.Fatal("legacy order or catalog changed")
		}
		for _, s := range page.Sections[1:3] {
			if s.Enabled != enabled || s.Variant != "compact" {
				t.Fatal("legacy visibility/density lost")
			}
		}
		snapshot, _ := json.Marshal(d)
		d.NormalizeLegacy()
		again, _ := json.Marshal(d)
		if string(snapshot) != string(again) {
			t.Fatal("normalization is not idempotent")
		}
	}
}

func TestScheduleFeatureProjectionAndValidation(t *testing.T) {
	d := Default()
	d.Features[1].PublicEnabled = false
	d.Features[0].AdminEnabled = false
	if !d.LocalFeature("schedule_periods", false) || d.LocalFeature("schedule_periods", true) || d.LocalFeature("schedule_matches", false) {
		t.Fatal("independent feature flags ignored")
	}
	projected := d.Public().PageFor("/jadwal")
	if len(projected.Sections) != 1 || projected.Sections[0].Type != "schedule_periods" {
		t.Fatal("disabled native feature escaped projection")
	}
	for i := range d.Modules {
		if d.Modules[i].ID == "jadwal" {
			d.Modules[i].PublicEnabled = false
		}
	}
	if d.LocalFeature("schedule_periods", false) {
		t.Fatal("feature bypassed parent module")
	}
	d = Default()
	d.Features[0].ModuleID = "home"
	if d.Validate() == nil {
		t.Fatal("feature parent editable")
	}
	d = Default()
	d.Features = []Feature{}
	if d.Validate() == nil {
		t.Fatal("empty catalog enabled implicitly")
	}
	d = Default()
	d.Pages[1].Sections = append(d.Pages[1].Sections, Section{ID: "bad-native", Type: "schedule_periods", Enabled: true, Variant: "standard"})
	if d.Validate() == nil {
		t.Fatal("schedule native accepted on another page")
	}
	d = Default()
	for i := range d.Pages {
		if d.Pages[i].ID == "jadwal" {
			d.Pages[i].Sections = d.Pages[i].Sections[:1]
		}
	}
	if d.Validate() == nil {
		t.Fatal("native slot removed instead of disabled")
	}
}

func TestScheduleFeatureRequestGuards(t *testing.T) {
	for _, test := range []struct {
		path, feature  string
		admin, enabled bool
		want           int
	}{
		{"/api/v1/schedule/periods", "schedule_periods", false, false, 403},
		{"/api/v1/schedule/matches/enriched", "schedule_matches", false, false, 403},
		{"/api/v1/periods", "schedule_periods", true, false, 403},
		{"/api/v1/matches", "schedule_matches", true, false, 403},
		{"/api/v1/schedule/periods", "schedule_matches", false, false, 204},
		{"/api/v1/livescore/schedule-projection", "schedule_matches", false, false, 204},
		{"/api/v1/portal/references/livescore-matches", "schedule_matches", true, false, 204},
	} {
		d := Default()
		for i := range d.Features {
			if d.Features[i].ID == test.feature {
				if test.admin {
					d.Features[i].AdminEnabled = test.enabled
				} else {
					d.Features[i].PublicEnabled = test.enabled
				}
			}
		}
		handler := Guard(func(context.Context) (Document, error) { return d, nil }, func(*http.Request) bool { return test.admin }, false)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(204) }))
		request := httptest.NewRequest("GET", test.path, nil)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != test.want {
			t.Fatalf("%s: %d want %d", test.path, response.Code, test.want)
		}
	}
}
