package handler

import (
	"net/http/httptest"
	"testing"
)

func TestParseVenuePageRequest(t *testing.T) {
	t.Run("legacy", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/v1/venues", nil)
		page, err := parseVenuePageRequest(request)
		if err != nil || page != nil {
			t.Fatalf("expected legacy response, got page=%v err=%v", page, err)
		}
	})
	t.Run("maximum", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/v1/venues?page=1&per_page=100&sort=capacity&direction=desc", nil)
		page, err := parseVenuePageRequest(request)
		if err != nil || page.perPage != 100 || page.sort != "capacity" || page.direction != "desc" {
			t.Fatalf("unexpected page request: page=%#v err=%v", page, err)
		}
	})
	t.Run("too-large", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/v1/venues?page=1&per_page=101", nil)
		if _, err := parseVenuePageRequest(request); err == nil {
			t.Fatal("expected per_page above 100 to be rejected")
		}
	})
}
