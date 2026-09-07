package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

type cityGuidePinQueriesStub struct {
	guide    db.CityGuide
	getErr   error
	clearErr error
	pinErr   error
	calls    []string
}

func (s *cityGuidePinQueriesStub) GetCityGuideByID(context.Context, pgtype.UUID) (db.CityGuide, error) {
	s.calls = append(s.calls, "get")
	return s.guide, s.getErr
}

func (s *cityGuidePinQueriesStub) ClearPinnedCityGuideForVenues(context.Context) error {
	s.calls = append(s.calls, "clear")
	return s.clearErr
}

func (s *cityGuidePinQueriesStub) PinCityGuideForVenues(context.Context, pgtype.UUID) (db.CityGuide, error) {
	s.calls = append(s.calls, "pin")
	return s.guide, s.pinErr
}

func floatPointer(value float64) *float64 {
	return &value
}

func TestValidateCityGuideRequestAcceptsDepokCoordinates(t *testing.T) {
	req := cityGuideRequest{
		Title:     "  Situ Pengasinan  ",
		Category:  " Wisata Situ ",
		Latitude:  floatPointer(-6.402484),
		Longitude: floatPointer(106.742061),
	}
	if err := validateCityGuideRequest(&req); err != nil {
		t.Fatalf("validateCityGuideRequest() error = %v", err)
	}
	if req.Title != "Situ Pengasinan" || req.Category != "Wisata Situ" {
		t.Fatalf("request was not normalized: %#v", req)
	}
}

func TestValidateCityGuideRequestAcceptsOptionalGoogleMapsURL(t *testing.T) {
	tests := []string{
		"",
		"https://www.google.com/maps/dir/?api=1&destination=Margo%20City%20Depok",
		"https://maps.google.co.id/maps?q=Situ+Pengasinan",
		"https://maps.app.goo.gl/AbCdEf123456",
		"https://goo.gl/maps/AbCdEf123456",
		"https://maps.google.com/?q=Situ+Pengasinan",
	}
	for _, mapRouteURL := range tests {
		req := cityGuideRequest{
			Title:       "Lokasi",
			Category:    "Wisata",
			Latitude:    floatPointer(-6.4),
			Longitude:   floatPointer(106.8),
			MapRouteURL: mapRouteURL,
		}
		if err := validateCityGuideRequest(&req); err != nil {
			t.Fatalf("map URL %q rejected: %v", mapRouteURL, err)
		}
	}
}

func TestValidateCityGuideRequestRejectsUnsafeMapURL(t *testing.T) {
	tests := []string{
		"http://www.google.com/maps?q=Depok",
		"javascript:alert(1)",
		"https://google.com.evil.example/maps?q=Depok",
		"https://www.google.com/search?q=Depok",
		"https://www.google.com/maps-malicious?q=Depok",
	}
	for _, mapRouteURL := range tests {
		req := cityGuideRequest{
			Title:       "Lokasi",
			Category:    "Wisata",
			Latitude:    floatPointer(-6.4),
			Longitude:   floatPointer(106.8),
			MapRouteURL: mapRouteURL,
		}
		if err := validateCityGuideRequest(&req); err == nil {
			t.Fatalf("map URL %q expected validation error", mapRouteURL)
		}
	}
}

func TestValidateCityGuideRequestRejectsMissingOrOutOfRangeCoordinates(t *testing.T) {
	tests := []cityGuideRequest{
		{Title: "Lokasi", Category: "Wisata", Latitude: nil, Longitude: floatPointer(106.8)},
		{Title: "Lokasi", Category: "Wisata", Latitude: floatPointer(-91), Longitude: floatPointer(106.8)},
		{Title: "Lokasi", Category: "Wisata", Latitude: floatPointer(-6.4), Longitude: floatPointer(181)},
	}
	for index := range tests {
		if err := validateCityGuideRequest(&tests[index]); err == nil {
			t.Fatalf("case %d expected validation error", index)
		}
	}
}

func TestParseCityGuideListFiltersNormalizesValues(t *testing.T) {
	category, search, pagination, err := parseCityGuideListFilters(url.Values{
		"category": {"  Wisata Kuliner "},
		"q":        {"  soto depok  "},
		"page":     {"2"},
		"per_page": {"25"},
	})
	if err != nil {
		t.Fatalf("parseCityGuideListFilters() error = %v", err)
	}
	if category != "Wisata Kuliner" || search != "soto depok" || pagination.Page != 2 || pagination.PerPage != 25 || !pagination.Paginated {
		t.Fatalf("unexpected filters: category=%q search=%q pagination=%#v", category, search, pagination)
	}
}

func TestParseCityGuideListFiltersRejectsMultipleOrLongSearchValues(t *testing.T) {
	tests := []url.Values{
		{"q": {"hotel", "kuliner"}},
		{"category": {"Wisata", "Kuliner"}},
		{"q": {strings.Repeat("a", maxCityGuideSearchLength+1)}},
	}

	for index, values := range tests {
		if _, _, _, err := parseCityGuideListFilters(values); err == nil {
			t.Fatalf("case %d expected validation error", index)
		}
	}
}

func TestParseCityGuideListFiltersRejectsInvalidPagination(t *testing.T) {
	tests := []url.Values{
		{"page": {"0"}},
		{"page": {"dua"}},
		{"per_page": {"0"}},
		{"per_page": {"101"}},
	}
	for index, values := range tests {
		if _, _, _, err := parseCityGuideListFilters(values); err == nil {
			t.Fatalf("case %d expected validation error", index)
		}
	}
}

func TestValidateCityGuideTravelRequiresFleetDetails(t *testing.T) {
	fleetCount := int32(4)
	valid := cityGuideRequest{
		Title:      "Depok Shuttle",
		Category:   travelCategory,
		Address:    "Kota Depok",
		WhatsApp:   "+62 812 3456 7890",
		Latitude:   floatPointer(-6.4),
		Longitude:  floatPointer(106.8),
		FleetTypes: []string{"HiAce", " HiAce ", "Bus Medium"},
		FleetCount: &fleetCount,
	}
	if err := validateCityGuideRequest(&valid); err != nil {
		t.Fatalf("valid travel request rejected: %v", err)
	}
	if len(valid.FleetTypes) != 2 {
		t.Fatalf("fleet types were not normalized: %#v", valid.FleetTypes)
	}

	invalid := valid
	invalid.FleetTypes = nil
	if err := validateCityGuideRequest(&invalid); err == nil {
		t.Fatal("travel request without fleet types should be rejected")
	}
}

func TestEscapeLikePatternTreatsWildcardsAsLiterals(t *testing.T) {
	input := `50%_promo\depok`
	want := `50\%\_promo\\depok`
	if got := escapeLikePattern(input); got != want {
		t.Fatalf("escapeLikePattern(%q) = %q, want %q", input, got, want)
	}
}

func TestBuildCityGuideAuditEventUsesCanonicalIdentityAndTracing(t *testing.T) {
	request := httptest.NewRequest("PUT", "/api/v1/master-data/city-guide/guide-id/venue-pin", nil)
	request.Header.Set("X-Actor-ID", "actor-id")
	request.Header.Set("X-Request-ID", "request-id")
	request.Header.Set("X-Actor-IP", "127.0.0.1")

	event := buildCityGuideAuditEvent(request, "PIN_VENUE_RECOMMENDATION", "guide-id", map[string]string{"title": "Department Sports Lab"})
	if event.Actor != "actor-id" || event.RequestID != "request-id" || event.IPAddress != "127.0.0.1" {
		t.Fatalf("canonical audit context was not preserved: %#v", event)
	}
	encoded, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	if strings.Contains(string(encoded), `"actor_id"`) || strings.Contains(string(encoded), `"request_id"`) {
		t.Fatalf("legacy audit keys must not be emitted: %s", encoded)
	}
}

func TestCityGuideCanBeArchivedRejectsPinnedRecommendation(t *testing.T) {
	if cityGuideCanBeArchived(db.CityGuide{IsPinnedVenueRecommendation: true}) {
		t.Fatal("pinned venue recommendation must not be archived")
	}
	if !cityGuideCanBeArchived(db.CityGuide{}) {
		t.Fatal("un-pinned City Guide should remain archivable")
	}
}

func TestReplacePinnedCityGuideUsesAtomicMutationOrder(t *testing.T) {
	queries := &cityGuidePinQueriesStub{guide: db.CityGuide{Title: "Department Sports Lab"}}
	var id pgtype.UUID
	if err := id.Scan("c9ba7575-956d-47c7-a502-78e55507ce97"); err != nil {
		t.Fatal(err)
	}

	pinned, err := replacePinnedCityGuide(context.Background(), queries, id)
	if err != nil {
		t.Fatalf("replacePinnedCityGuide() error = %v", err)
	}
	if pinned.Title != "Department Sports Lab" || strings.Join(queries.calls, ",") != "get,clear,pin" {
		t.Fatalf("unexpected pin result or mutation order: pinned=%#v calls=%v", pinned, queries.calls)
	}
}

func TestReplacePinnedCityGuideStopsBeforePinWhenClearFails(t *testing.T) {
	queries := &cityGuidePinQueriesStub{clearErr: errors.New("clear failed")}
	var id pgtype.UUID
	if err := id.Scan("c9ba7575-956d-47c7-a502-78e55507ce97"); err != nil {
		t.Fatal(err)
	}

	if _, err := replacePinnedCityGuide(context.Background(), queries, id); err == nil {
		t.Fatal("replacePinnedCityGuide() expected clear error")
	}
	if strings.Join(queries.calls, ",") != "get,clear" {
		t.Fatalf("pin must not run after clear failure: calls=%v", queries.calls)
	}
}
