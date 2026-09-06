package handler

import (
	"net/url"
	"strings"
	"testing"
)

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
