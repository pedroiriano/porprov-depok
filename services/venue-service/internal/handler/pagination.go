package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/db"
)

type venuePageRequest struct {
	query     string
	page      int
	perPage   int
	sort      string
	direction string
}

func parseVenuePageRequest(r *http.Request) (*venuePageRequest, error) {
	query := r.URL.Query()
	if query.Get("page") == "" && query.Get("per_page") == "" && query.Get("q") == "" && query.Get("sort") == "" && query.Get("direction") == "" {
		return nil, nil
	}
	request := &venuePageRequest{query: strings.ToLower(strings.TrimSpace(query.Get("q"))), page: 1, perPage: 10, sort: "name", direction: "asc"}
	if len(request.query) > 80 {
		return nil, errors.New("kata pencarian maksimal 80 karakter")
	}
	var err error
	if value := query.Get("page"); value != "" {
		request.page, err = strconv.Atoi(value)
		if err != nil || request.page < 1 {
			return nil, errors.New("page wajib berupa angka minimal 1")
		}
	}
	if value := query.Get("per_page"); value != "" {
		request.perPage, err = strconv.Atoi(value)
		if err != nil || request.perPage < 1 || request.perPage > 100 {
			return nil, errors.New("per_page wajib antara 1 dan 100")
		}
	}
	if value := query.Get("sort"); value != "" {
		request.sort = value
	}
	allowed := map[string]bool{"name": true, "address": true, "capacity": true, "readiness_status": true}
	if !allowed[request.sort] {
		return nil, errors.New("kolom pengurutan tidak didukung")
	}
	if value := query.Get("direction"); value != "" {
		request.direction = strings.ToLower(value)
	}
	if request.direction != "asc" && request.direction != "desc" {
		return nil, errors.New("arah pengurutan wajib asc atau desc")
	}
	return request, nil
}

func writeVenuePage(w http.ResponseWriter, items []db.Venue, request *venuePageRequest) {
	filtered := make([]db.Venue, 0, len(items))
	for _, item := range items {
		haystack := strings.ToLower(strings.Join([]string{item.Name, item.Address.String, item.ReadinessStatus.String, item.ContactPerson.String}, " "))
		if request.query == "" || strings.Contains(haystack, request.query) {
			filtered = append(filtered, item)
		}
	}
	sort.SliceStable(filtered, func(i, j int) bool {
		comparison := 0
		switch request.sort {
		case "address":
			comparison = strings.Compare(strings.ToLower(filtered[i].Address.String), strings.ToLower(filtered[j].Address.String))
		case "capacity":
			if filtered[i].Capacity.Int32 < filtered[j].Capacity.Int32 {
				comparison = -1
			} else if filtered[i].Capacity.Int32 > filtered[j].Capacity.Int32 {
				comparison = 1
			}
		case "readiness_status":
			comparison = strings.Compare(strings.ToLower(filtered[i].ReadinessStatus.String), strings.ToLower(filtered[j].ReadinessStatus.String))
		default:
			comparison = strings.Compare(strings.ToLower(filtered[i].Name), strings.ToLower(filtered[j].Name))
		}
		if request.direction == "desc" {
			return comparison > 0
		}
		return comparison < 0
	})

	total := len(filtered)
	totalPages := max(1, (total+request.perPage-1)/request.perPage)
	request.page = min(request.page, totalPages)
	start := min((request.page-1)*request.perPage, total)
	end := min(start+request.perPage, total)
	data := filtered[start:end]
	if data == nil {
		data = []db.Venue{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(struct {
		Data       []db.Venue `json:"data"`
		Total      int        `json:"total"`
		Page       int        `json:"page"`
		PerPage    int        `json:"per_page"`
		TotalPages int        `json:"total_pages"`
	}{data, total, request.page, request.perPage, totalPages})
}
