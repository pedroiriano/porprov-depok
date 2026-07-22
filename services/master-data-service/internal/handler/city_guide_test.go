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
