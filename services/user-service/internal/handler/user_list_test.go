package handler

import (
	"net/url"
	"strings"
	"testing"
)

func TestParseUserListParams(t *testing.T) {
	tests := []struct {
		name      string
		query     url.Values
		want      userListParams
		wantError string
	}{
		{
			name:  "preserves legacy response without query parameters",
			query: url.Values{},
			want:  userListParams{Page: 1, Limit: 10, SortBy: "", SortOrder: "", LegacyMode: true},
		},
		{
			name:  "accepts canonical paging search and sort",
			query: url.Values{"page": {"2"}, "limit": {"25"}, "q": {" Depok "}, "sort": {"username"}, "order": {"ASC"}},
			want:  userListParams{Page: 2, Limit: 25, Search: "Depok", SortBy: "username", SortOrder: "asc", Status: "all"},
		},
		{
			name:      "rejects unsupported limit",
			query:     url.Values{"limit": {"500"}},
			wantError: "Limit must be one of 10, 25, 50, or 100",
		},
		{
			name:      "rejects unknown sort",
			query:     url.Values{"sort": {"password"}},
			wantError: "Invalid sort field",
		},
		{
			name:      "rejects oversized search",
			query:     url.Values{"q": {strings.Repeat("a", 81)}},
			wantError: "Search must contain at most 80 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, gotError := parseUserListParams(tt.query)
			if gotError != tt.wantError {
				t.Fatalf("parseUserListParams() error = %q, want %q", gotError, tt.wantError)
			}
			if tt.wantError == "" && got != tt.want {
				t.Fatalf("parseUserListParams() = %#v, want %#v", got, tt.want)
			}
		})
	}
}

func TestTotalUserPages(t *testing.T) {
	for _, tt := range []struct {
		total int64
		limit int32
		want  int32
	}{{0, 10, 1}, {1, 10, 1}, {10, 10, 1}, {11, 10, 2}, {101, 25, 5}} {
		if got := totalUserPages(tt.total, tt.limit); got != tt.want {
			t.Fatalf("totalUserPages(%d, %d) = %d, want %d", tt.total, tt.limit, got, tt.want)
		}
	}
}
