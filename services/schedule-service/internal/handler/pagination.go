package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5/pgtype"
)

type matchPageRequest struct {
	query                             string
	page                              int
	perPage                           int
	sort                              string
	direction                         string
	month, date, cabor, venue, status string
	matchID                           string
}

func parseMatchPageRequest(r *http.Request) (*matchPageRequest, error) {
	query := r.URL.Query()
	if values, present := query["match_id"]; present && (len(values) != 1 || values[0] == "") {
		return nil, errors.New("ID pertandingan wajib tunggal dan terisi")
	}
	if query.Get("match_id") == "" && query.Get("page") == "" && query.Get("per_page") == "" && query.Get("q") == "" && query.Get("sort") == "" && query.Get("direction") == "" && query.Get("month") == "" && query.Get("date") == "" && query.Get("cabor") == "" && query.Get("venue") == "" && query.Get("status") == "" {
		return nil, nil
	}
	request := &matchPageRequest{query: strings.ToLower(strings.TrimSpace(query.Get("q"))), page: 1, perPage: 10, sort: "match_date", direction: "asc"}
	if utf8.RuneCountInString(request.query) > 80 {
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
	request.month, request.date = query.Get("month"), query.Get("date")
	for _, field := range []struct{ value, layout string }{{request.month, "2006-01"}, {request.date, "2006-01-02"}} {
		if field.value == "" {
			continue
		}
		parsed, err := time.Parse(field.layout, field.value)
		if err != nil || parsed.Year() < 2000 || parsed.Year() > 2100 {
			return nil, errors.New("bulan atau tanggal tidak valid")
		}
	}
	request.cabor, request.venue, request.status = query.Get("cabor"), query.Get("venue"), query.Get("status")
	request.matchID = strings.ToLower(query.Get("match_id"))
	if len(query["match_id"]) > 1 {
		return nil, errors.New("ID pertandingan wajib tunggal")
	}
	for _, value := range []string{request.cabor, request.venue, request.matchID} {
		var id pgtype.UUID
		if value != "" && (len(value) != 36 || id.Scan(value) != nil) {
			return nil, errors.New("ID filter tidak valid")
		}
	}
	if request.status != "" {
		if _, err := normalizeMatchRound(request.status); err != nil {
			return nil, errors.New("status filter tidak valid")
		}
	}
	return request, nil
}

// INFO: A fixed UTC+7 offset keeps competition dates consistent with the Public calendar on every host.
var matchTimeZone = time.FixedZone("Asia/Jakarta", 7*60*60)

type matchCalendarCabor struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Total     int            `json:"total"`
	DayCounts map[string]int `json:"day_counts"`
}

type matchFacetOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type matchFacets struct {
	Cabors   []matchFacetOption `json:"cabors"`
	Venues   []matchFacetOption `json:"venues"`
	Statuses []string           `json:"statuses"`
}

func buildMatchFacets(matches []enrichedMatch) matchFacets {
	cabors, venues, statuses := map[string]string{}, map[string]string{}, map[string]bool{}
	for _, match := range matches {
		if match.CaborID != "" {
			cabors[match.CaborID] = match.CaborName
		}
		if match.VenueID != "" {
			venues[match.VenueID] = match.VenueName
		}
		if match.Status != "" {
			statuses[match.Status] = true
		}
	}
	options := func(values map[string]string) []matchFacetOption {
		result := []matchFacetOption{}
		for id, name := range values {
			result = append(result, matchFacetOption{id, name})
		}
		sort.Slice(result, func(i, j int) bool {
			if result[i].Name == result[j].Name {
				return result[i].ID < result[j].ID
			}
			return result[i].Name < result[j].Name
		})
		return result
	}
	result := matchFacets{Cabors: options(cabors), Venues: options(venues), Statuses: []string{}}
	for status := range statuses {
		result.Statuses = append(result.Statuses, status)
	}
	sort.Strings(result.Statuses)
	return result
}

func writeMatchPage(w http.ResponseWriter, matches []enrichedMatch, request *matchPageRequest) {
	filtered := make([]enrichedMatch, 0, len(matches))
	dayCounts := map[string]int{}
	caborSummaries := map[string]*matchCalendarCabor{}
	for _, match := range matches {
		day := ""
		if date, err := time.Parse(time.RFC3339, match.MatchDate); err == nil {
			day = date.In(matchTimeZone).Format("2006-01-02")
		}
		if (request.matchID != "" && request.matchID != strings.ToLower(match.ID)) || (request.month != "" && !strings.HasPrefix(day, request.month+"-")) || (request.date != "" && day != request.date) || (request.cabor != "" && request.cabor != match.CaborID) || (request.venue != "" && request.venue != match.VenueID) || (request.status != "" && request.status != match.Status) {
			continue
		}
		parts := []string{match.NomorTandingName, match.CaborName, match.VenueName, match.Round, match.Status}
		for _, participant := range match.Participants {
			parts = append(parts, participant.DisplayName, participant.KontingenName)
		}
		if request.query == "" || strings.Contains(strings.ToLower(strings.Join(parts, " ")), request.query) {
			filtered = append(filtered, match)
			if day != "" {
				dayCounts[day]++
				if match.CaborID != "" || match.CaborName != "" {
					key := match.CaborID
					if key == "" {
						key = match.CaborName
					}
					entry, exists := caborSummaries[key]
					if !exists {
						entry = &matchCalendarCabor{
							ID:        match.CaborID,
							Name:      match.CaborName,
							DayCounts: map[string]int{},
						}
						caborSummaries[key] = entry
					}
					entry.Total++
					entry.DayCounts[day]++
				}
			}
		}
	}
	caborsList := make([]matchCalendarCabor, 0, len(caborSummaries))
	for _, entry := range caborSummaries {
		caborsList = append(caborsList, *entry)
	}
	sort.Slice(caborsList, func(i, j int) bool {
		if caborsList[i].Name == caborsList[j].Name {
			return caborsList[i].ID < caborsList[j].ID
		}
		return caborsList[i].Name < caborsList[j].Name
	})
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
			if comparison == 0 {
				return filtered[i].ID < filtered[j].ID
			}
			return comparison > 0
		}
		if comparison == 0 {
			return filtered[i].ID < filtered[j].ID
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
		Facets     matchFacets     `json:"facets"`
		Calendar   struct {
			Month     string               `json:"month"`
			DayCounts map[string]int       `json:"day_counts"`
			Cabors    []matchCalendarCabor `json:"cabors"`
		} `json:"calendar"`
	}{data, total, request.page, request.perPage, totalPages, buildMatchFacets(matches), struct {
		Month     string               `json:"month"`
		DayCounts map[string]int       `json:"day_counts"`
		Cabors    []matchCalendarCabor `json:"cabors"`
	}{request.month, dayCounts, caborsList}})
}
