package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

type matchPageRequest struct {
	query     string
	page      int
	perPage   int
	sort      string
	direction string
}

func parseMatchPageRequest(r *http.Request) (*matchPageRequest, error) {
	query := r.URL.Query()
	if query.Get("page") == "" && query.Get("per_page") == "" && query.Get("q") == "" && query.Get("sort") == "" && query.Get("direction") == "" {
		return nil, nil
	}
	request := &matchPageRequest{query: strings.ToLower(strings.TrimSpace(query.Get("q"))), page: 1, perPage: 10, sort: "match_date", direction: "asc"}
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
	allowed := map[string]bool{"match_date": true, "nomor_tanding": true, "venue": true, "round": true, "status": true}
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

func writeMatchPage(w http.ResponseWriter, matches []enrichedMatch, request *matchPageRequest) {
	filtered := make([]enrichedMatch, 0, len(matches))
	for _, match := range matches {
		parts := []string{match.NomorTandingName, match.CaborName, match.VenueName, match.Round, match.Status}
		for _, participant := range match.Participants {
			parts = append(parts, participant.DisplayName, participant.KontingenName)
		}
		if request.query == "" || strings.Contains(strings.ToLower(strings.Join(parts, " ")), request.query) {
			filtered = append(filtered, match)
		}
	}
	sort.SliceStable(filtered, func(i, j int) bool {
		comparison := 0
		switch request.sort {
		case "nomor_tanding":
			comparison = strings.Compare(strings.ToLower(filtered[i].NomorTandingName), strings.ToLower(filtered[j].NomorTandingName))
		case "venue":
			comparison = strings.Compare(strings.ToLower(filtered[i].VenueName), strings.ToLower(filtered[j].VenueName))
		case "round":
			comparison = strings.Compare(strings.ToLower(filtered[i].Round), strings.ToLower(filtered[j].Round))
		case "status":
			comparison = strings.Compare(strings.ToLower(filtered[i].Status), strings.ToLower(filtered[j].Status))
		default:
			left, leftErr := time.Parse(time.RFC3339, filtered[i].MatchDate)
			right, rightErr := time.Parse(time.RFC3339, filtered[j].MatchDate)
			if leftErr == nil && rightErr == nil {
				comparison = left.Compare(right)
			} else {
				comparison = strings.Compare(filtered[i].MatchDate, filtered[j].MatchDate)
			}
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
		data = []enrichedMatch{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(struct {
		Data       []enrichedMatch `json:"data"`
		Total      int             `json:"total"`
		Page       int             `json:"page"`
		PerPage    int             `json:"per_page"`
		TotalPages int             `json:"total_pages"`
	}{data, total, request.page, request.perPage, totalPages})
}
