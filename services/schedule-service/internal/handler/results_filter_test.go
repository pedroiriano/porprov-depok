package handler

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
)

// TEST: A result deep link selects the exact match before pagination; malformed or repeated IDs fail closed.
func TestResultMatchFilter(t *testing.T) {
	id := "00000000-0000-4000-8000-000000000001"
	request, err := parseMatchPageRequest(httptest.NewRequest("GET", "/?match_id="+id+"&per_page=12", nil))
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	writeMatchPage(recorder, []enrichedMatch{{ID: "00000000-0000-4000-8000-000000000002"}, {ID: id}}, request)
	var data struct {
		Data  []enrichedMatch `json:"data"`
		Total int             `json:"total"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &data); err != nil {
		t.Fatal(err)
	}
	if data.Total != 1 || len(data.Data) != 1 || data.Data[0].ID != id {
		t.Fatal("deep link selected another match")
	}
	for _, query := range []string{"match_id=", "match_id=bad", "match_id=" + id + "&match_id=" + id, "match_id=&match_id=" + id} {
		if _, err := parseMatchPageRequest(httptest.NewRequest("GET", "/?"+query, nil)); err == nil {
			t.Fatal("invalid match filter accepted")
		}
	}
}
