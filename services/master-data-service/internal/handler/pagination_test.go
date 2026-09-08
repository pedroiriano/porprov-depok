package handler

import (
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

func TestParseListPageRequestPreservesLegacyResponse(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/v1/cabors", nil)
	page, err := parseListPageRequest(request, map[string]bool{"name": true}, "name")
	if err != nil || page != nil {
		t.Fatalf("expected legacy request without page envelope, got page=%v err=%v", page, err)
	}
}

func TestParseListPageRequestRejectsOversizedPage(t *testing.T) {
	request := httptest.NewRequest("GET", "/api/v1/cabors?page=1&per_page=101", nil)
	if _, err := parseListPageRequest(request, map[string]bool{"name": true}, "name"); err == nil {
		t.Fatal("expected per_page above 100 to be rejected")
	}
}

func TestPaginateCaborsFiltersAndSorts(t *testing.T) {
	items := []db.Cabor{
		{Name: "Renang", Kategori: pgtype.Text{String: "Akuatik", Valid: true}},
		{Name: "Atletik", Kategori: pgtype.Text{String: "Lintasan", Valid: true}},
	}
	page := &listPageRequest{Query: "lintasan", Sort: "name", Direction: "asc"}
	got := paginateCabors(items, page)
	if len(got) != 1 || got[0].Name != "Atletik" {
		t.Fatalf("unexpected filtered result: %#v", got)
	}
}
