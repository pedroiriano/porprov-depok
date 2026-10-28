package handler

import (
	"encoding/json"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"net/http/httptest"
	"strings"
	"testing"
)

// TEST: Date-only inclusive ranges allow same-day, cross-month and cross-year events.
func TestSchedulePeriodValidation(t *testing.T) {
	valid := periodChange{CaborID: "00000000-0000-4000-8000-000000000001", StartsOn: "2026-10-31", EndsOn: "2026-11-05"}
	for _, pair := range [][2]string{{"2026-10-31", "2026-11-05"}, {"2026-11-02", "2026-11-13"}, {"2026-12-31", "2027-01-02"}, {"2028-02-29", "2028-02-29"}} {
		v := valid
		v.StartsOn = pair[0]
		v.EndsOn = pair[1]
		if err := validatePeriod(v); err != nil {
			t.Fatal(err)
		}
	}
	for _, pair := range [][2]string{{"2026-11-05", "2026-10-31"}, {"2026-02-29", "2026-03-01"}, {"2026-10-31T00:00:00Z", "2026-11-05"}, {"1999-01-01", "1999-01-02"}, {"2100-12-31", "2101-01-01"}} {
		v := valid
		v.StartsOn = pair[0]
		v.EndsOn = pair[1]
		if validatePeriod(v) == nil {
			t.Fatalf("invalid range accepted: %v", pair)
		}
	}
	valid.Label = strings.Repeat("a", 121)
	if validatePeriod(valid) == nil {
		t.Fatal("oversized label accepted")
	}
}

func TestSchedulePeriodProofAndInputBoundary(t *testing.T) {
	secret := strings.Repeat("s", 32)
	h := NewPeriodHandler(nil, "http://localhost", secret)
	for _, proof := range []string{"", "spoofed", portal.ManagementProof(secret)} {
		r := httptest.NewRequest("PUT", "/periods", strings.NewReader(`{}`))
		r.Header.Set("X-Schedule-Authorization", proof)
		r.Header.Set("X-Actor-ID", "actor")
		r.Header.Set("X-Actor-Username", "operator")
		w := httptest.NewRecorder()
		h.Change("UPDATE").ServeHTTP(w, r)
		if w.Code != 403 {
			t.Fatalf("untrusted proof status %d", w.Code)
		}
	}
	for _, body := range []string{`{"unknown":1}`, `{} {}`, `{"reason":"     "}`, strings.Repeat("x", 17000)} {
		r := httptest.NewRequest("POST", "/periods", strings.NewReader(body))
		w := httptest.NewRecorder()
		_, ok := decodePeriodChange(w, r)
		if ok {
			t.Fatal("invalid payload accepted")
		}
	}
	for _, query := range []string{"?per_page=101", "?page=0", "?sort=starts_on%3BDROP%20TABLE%20schedule_periods", "?direction=other", "?date=not-a-date", "?date=0000-01-01", "?cabor_id=invalid"} {
		r := httptest.NewRequest("GET", "/periods"+query, nil)
		w := httptest.NewRecorder()
		h.List(false).ServeHTTP(w, r)
		if w.Code != 400 {
			t.Fatalf("invalid query %s: %d", query, w.Code)
		}
	}
	// TEST: Machine JSON input does not gain permission through forged identity headers.
	r := httptest.NewRequest("GET", "/periods/manage", nil)
	r.Header.Set("X-Actor-ID", "forged")
	w := httptest.NewRecorder()
	h.List(true).ServeHTTP(w, r)
	var response map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &response)
	if w.Code != 403 || response["message"] == "" {
		t.Fatal("private listing boundary failed")
	}
}
