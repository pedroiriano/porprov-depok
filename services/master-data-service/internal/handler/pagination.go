package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

const maximumAdminPageSize = 100

type listPageRequest struct {
	Query     string
	Page      int
	PerPage   int
	Sort      string
	Direction string
}

type listPageResponse[T any] struct {
	Data       []T `json:"data"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	TotalPages int `json:"total_pages"`
}

func parseListPageRequest(r *http.Request, allowedSorts map[string]bool, defaultSort string) (*listPageRequest, error) {
	query := r.URL.Query()
	if query.Get("page") == "" && query.Get("per_page") == "" && query.Get("q") == "" && query.Get("sort") == "" && query.Get("direction") == "" {
		return nil, nil
	}

	request := &listPageRequest{
		Query:     strings.ToLower(strings.TrimSpace(query.Get("q"))),
		Page:      1,
		PerPage:   10,
		Sort:      defaultSort,
		Direction: "asc",
	}
	if len(request.Query) > 80 {
		return nil, errors.New("kata pencarian maksimal 80 karakter")
	}
	var err error
	if value := query.Get("page"); value != "" {
		request.Page, err = strconv.Atoi(value)
		if err != nil || request.Page < 1 {
			return nil, errors.New("page wajib berupa angka minimal 1")
		}
	}
	if value := query.Get("per_page"); value != "" {
		request.PerPage, err = strconv.Atoi(value)
		if err != nil || request.PerPage < 1 || request.PerPage > maximumAdminPageSize {
			return nil, fmt.Errorf("per_page wajib antara 1 dan %d", maximumAdminPageSize)
		}
	}
	if value := query.Get("sort"); value != "" {
		request.Sort = value
	}
	if !allowedSorts[request.Sort] {
		return nil, errors.New("kolom pengurutan tidak didukung")
	}
	if value := query.Get("direction"); value != "" {
		request.Direction = strings.ToLower(value)
	}
	if request.Direction != "asc" && request.Direction != "desc" {
		return nil, errors.New("arah pengurutan wajib asc atau desc")
	}
	return request, nil
}

func writeListPage[T any](w http.ResponseWriter, items []T, request *listPageRequest) {
	total := len(items)
	totalPages := max(1, (total+request.PerPage-1)/request.PerPage)
	if request.Page > totalPages {
		request.Page = totalPages
	}
	start := min((request.Page-1)*request.PerPage, total)
	end := min(start+request.PerPage, total)
	data := items[start:end]
	if data == nil {
		data = []T{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(listPageResponse[T]{
		Data: data, Total: total, Page: request.Page, PerPage: request.PerPage, TotalPages: totalPages,
	})
}

func containsFold(query string, values ...string) bool {
	if query == "" {
		return true
	}
	return strings.Contains(strings.ToLower(strings.Join(values, " ")), query)
}

func paginateCabors(items []db.Cabor, request *listPageRequest) []db.Cabor {
	filtered := make([]db.Cabor, 0, len(items))
	for _, item := range items {
		if containsFold(request.Query, item.Name, item.Kategori.String, item.TechnicalDelegate.String, item.Status.String) {
			filtered = append(filtered, item)
		}
	}
	sort.SliceStable(filtered, func(i, j int) bool {
		var comparison int
		switch request.Sort {
		case "kategori":
			comparison = strings.Compare(strings.ToLower(filtered[i].Kategori.String), strings.ToLower(filtered[j].Kategori.String))
		case "total_medali":
			if filtered[i].TotalMedali.Int32 < filtered[j].TotalMedali.Int32 {
				comparison = -1
			} else if filtered[i].TotalMedali.Int32 > filtered[j].TotalMedali.Int32 {
				comparison = 1
			}
		case "technical_delegate":
			comparison = strings.Compare(strings.ToLower(filtered[i].TechnicalDelegate.String), strings.ToLower(filtered[j].TechnicalDelegate.String))
		case "status":
			comparison = strings.Compare(strings.ToLower(filtered[i].Status.String), strings.ToLower(filtered[j].Status.String))
		default:
			comparison = strings.Compare(strings.ToLower(filtered[i].Name), strings.ToLower(filtered[j].Name))
		}
		if request.Direction == "desc" {
			return comparison > 0
		}
		return comparison < 0
	})
	return filtered
}

func paginateKontingens(items []db.Kontingen, request *listPageRequest) []db.Kontingen {
	filtered := make([]db.Kontingen, 0, len(items))
	for _, item := range items {
		if containsFold(request.Query, item.Name, item.RegionType) {
			filtered = append(filtered, item)
		}
	}
	sort.SliceStable(filtered, func(i, j int) bool {
		left, right := filtered[i].Name, filtered[j].Name
		if request.Sort == "region_type" {
			left, right = filtered[i].RegionType, filtered[j].RegionType
		}
		comparison := strings.Compare(strings.ToLower(left), strings.ToLower(right))
		if request.Direction == "desc" {
			return comparison > 0
		}
		return comparison < 0
	})
	return filtered
}

func paginateNomorTandings(items []db.NomorTanding, request *listPageRequest) []db.NomorTanding {
	filtered := make([]db.NomorTanding, 0, len(items))
	for _, item := range items {
		if containsFold(request.Query, item.Name, item.GenderCategory, item.MatchType) {
			filtered = append(filtered, item)
		}
	}
	sort.SliceStable(filtered, func(i, j int) bool {
		left, right := filtered[i].Name, filtered[j].Name
		switch request.Sort {
		case "gender_category":
			left, right = filtered[i].GenderCategory, filtered[j].GenderCategory
		case "match_type":
			left, right = filtered[i].MatchType, filtered[j].MatchType
		}
		comparison := strings.Compare(strings.ToLower(left), strings.ToLower(right))
		if request.Direction == "desc" {
			return comparison > 0
		}
		return comparison < 0
	})
	return filtered
}
