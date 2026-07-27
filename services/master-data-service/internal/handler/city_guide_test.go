package handler

import "testing"

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
