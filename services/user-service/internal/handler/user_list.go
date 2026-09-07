package handler

import (
	"net/url"
	"strconv"
	"strings"
	"unicode/utf8"
)

const (
	defaultUserPageLimit = int32(10)
	maxUserPage          = int32(1_000_000)
)

var allowedUserPageLimits = map[int32]struct{}{10: {}, 25: {}, 50: {}, 100: {}}
var allowedUserSortFields = map[string]struct{}{
	"username": {}, "full_name": {}, "email": {}, "role": {}, "created_at": {},
}

type userListParams struct {
	Page       int32
	Limit      int32
	Search     string
	SortBy     string
	SortOrder  string
	LegacyMode bool
}

func parseUserListParams(values url.Values) (userListParams, string) {
	params := userListParams{
		Page:       1,
		Limit:      defaultUserPageLimit,
		Search:     strings.TrimSpace(values.Get("q")),
		SortBy:     strings.TrimSpace(values.Get("sort")),
		SortOrder:  strings.ToLower(strings.TrimSpace(values.Get("order"))),
		LegacyMode: true,
	}

	for _, key := range []string{"page", "limit", "q", "sort", "order"} {
		if values.Has(key) {
			params.LegacyMode = false
			break
		}
	}
	if params.LegacyMode {
		return params, ""
	}

	if rawPage := strings.TrimSpace(values.Get("page")); rawPage != "" {
		page, err := strconv.ParseInt(rawPage, 10, 32)
		if err != nil || page < 1 || page > int64(maxUserPage) {
			return params, "Page must be an integer between 1 and 1000000"
		}
		params.Page = int32(page)
	}
	if rawLimit := strings.TrimSpace(values.Get("limit")); rawLimit != "" {
		limit, err := strconv.ParseInt(rawLimit, 10, 32)
		if err != nil {
			return params, "Limit must be one of 10, 25, 50, or 100"
		}
		params.Limit = int32(limit)
	}
	if _, allowed := allowedUserPageLimits[params.Limit]; !allowed {
		return params, "Limit must be one of 10, 25, 50, or 100"
	}
	if utf8.RuneCountInString(params.Search) > 80 {
		return params, "Search must contain at most 80 characters"
	}
	if params.SortBy == "" {
		params.SortBy = "created_at"
	}
	if _, allowed := allowedUserSortFields[params.SortBy]; !allowed {
		return params, "Invalid sort field"
	}
	if params.SortOrder == "" {
		params.SortOrder = "desc"
	}
	if params.SortOrder != "asc" && params.SortOrder != "desc" {
		return params, "Sort order must be asc or desc"
	}

	return params, ""
}

func totalUserPages(total int64, limit int32) int32 {
	if total <= 0 {
		return 1
	}
	return int32((total + int64(limit) - 1) / int64(limit))
}
