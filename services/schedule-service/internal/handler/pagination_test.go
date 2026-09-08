package handler

import (
	"net/http/httptest"
	"testing"
)

func TestParseMatchPageRequest(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/v1/matches/enriched?page=2&per_page=25&sort=venue&direction=desc", nil)
	page, err := parseMatchPageRequest(request)
	if err != nil {
		t.Fatal(err)
	}
	if page.page != 2 || page.perPage != 25 || page.sort != "venue" || page.direction != "desc" {
		t.Fatalf("unexpected page request: %#v", page)
	}
}

func TestParseMatchPageRequestRejectsUnknownSort(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/v1/matches/enriched?page=1&sort=raw_sql", nil)
	if _, err := parseMatchPageRequest(request); err == nil {
		t.Fatal("expected unknown sort to be rejected")
	}
}
