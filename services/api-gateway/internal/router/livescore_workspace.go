package router

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
)

type workspaceMatch struct {
	ID           string                 `json:"id"`
	MatchDate    string                 `json:"match_date"`
	Cabor        string                 `json:"cabor_name"`
	Nomor        string                 `json:"nomor_tanding_name"`
	Venue        string                 `json:"venue_name"`
	Round        string                 `json:"round"`
	Status       string                 `json:"status"`
	Participants []workspaceParticipant `json:"participants"`
}
type workspaceParticipant struct {
	Kind       string `json:"participant_type"`
	Contingent string `json:"kontingen_name"`
	Athlete    string `json:"athlete_name"`
	Team       string `json:"team_name"`
	Slot       int    `json:"slot"`
	Name       string `json:"display_name"`
}
type workspaceScore struct {
	MatchID          string  `json:"matchId"`
	RevisionID       string  `json:"revisionId"`
	RevisionNumber   int     `json:"revisionNumber"`
	Sequence         int     `json:"sequence"`
	ScoreA           int     `json:"scoreA"`
	ScoreB           int     `json:"scoreB"`
	Status           string  `json:"status"`
	Actor            string  `json:"actor"`
	Timestamp        string  `json:"timestamp"`
	CorrectionReason *string `json:"correctionReason,omitempty"`
}
type workspaceRow struct {
	Match workspaceMatch  `json:"match"`
	Score *workspaceScore `json:"score"`
}
type workspaceQuery struct {
	view, q, sort, direction, date, month, matchID string
	page, size                                     int
}

func parseWorkspaceQuery(values url.Values) (workspaceQuery, error) {
	q := workspaceQuery{view: "recorded", sort: "date", direction: "desc", page: 1, size: 10}
	for key, items := range values {
		if len(items) != 1 {
			return q, errors.New("parameter berulang")
		}
		switch key {
		case "view":
			q.view = items[0]
		case "q":
			q.q = strings.ToLower(strings.TrimSpace(items[0]))
		case "sort":
			q.sort = items[0]
		case "direction":
			q.direction = items[0]
		case "date":
			q.date = items[0]
		case "month":
			q.month = items[0]
		case "match_id":
			q.matchID = items[0]
		case "page", "per_page":
			n, err := strconv.Atoi(items[0])
			if err != nil || n < 1 || n > 1000000 {
				return q, errors.New("halaman tidak valid")
			}
			if key == "page" {
				q.page = n
			} else {
				q.size = n
			}
		default:
			return q, errors.New("parameter tidak dikenal")
		}
	}
	if q.size > 100 || utf8.RuneCountInString(q.q) > 80 || (q.view != "recorded" && q.view != "available") || (q.direction != "asc" && q.direction != "desc") || !map[string]bool{"date": true, "cabor": true, "status": true, "updated": true}[q.sort] {
		return q, errors.New("filter tidak valid")
	}
	for _, field := range []struct{ value, layout string }{{q.date, "2006-01-02"}, {q.month, "2006-01"}} {
		if field.value != "" {
			parsed, err := time.Parse(field.layout, field.value)
			if err != nil || parsed.Year() < 2000 || parsed.Year() > 2100 {
				return q, errors.New("tanggal tidak valid")
			}
		}
	}
	if q.matchID != "" && !regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).MatchString(q.matchID) {
		return q, errors.New("ID tidak valid")
	}
	if _, present := values["match_id"]; present && q.matchID == "" {
		return q, errors.New("ID kosong")
	}
	return q, nil
}

// SECURITY: Legacy projections stay internal; browser responses contain only the requested page. No browser header can supply the actor.
func scoreWorkspace(scheduleURL, scoreURL string) http.HandlerFunc {
	return scoreReadModel(scheduleURL, scoreURL, false)
}
func publicScoreResults(scheduleURL, scoreURL string) http.HandlerFunc {
	return scoreReadModel(scheduleURL, scoreURL, true)
}
func scoreReadModel(scheduleURL, scoreURL string, public bool) http.HandlerFunc {
	client := &http.Client{Timeout: 8 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		actor := customMiddleware.ActorIDFromContext(r.Context())
		if !public && actor == "" {
			http.Error(w, "Autentikasi diperlukan.", 401)
			return
		}
		q, err := parseWorkspaceQuery(r.URL.Query())
		if public && q.view != "recorded" {
			err = errors.New("projection privée")
		}
		if err != nil {
			http.Error(w, "Filter hasil pertandingan tidak valid.", 400)
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
		defer cancel()
		read := func(target string, out any) error {
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
			if err != nil {
				return err
			}
			if !public {
				req.Header.Set("X-Actor-ID", actor)
				req.Header.Set("Authorization", r.Header.Get("Authorization"))
			}
			req.Header.Set("X-Proxy", "API-Gateway")
			response, err := client.Do(req)
			if err != nil {
				return err
			}
			defer response.Body.Close()
			if response.StatusCode != 200 {
				return errors.New("projection unavailable")
			}
			body, err := io.ReadAll(io.LimitReader(response.Body, (16<<20)+1))
			if err != nil || len(body) > 16<<20 {
				return errors.New("projection exceeds safe limit")
			}
			return json.Unmarshal(body, out)
		}
		var matches []workspaceMatch
		var scores []workspaceScore
		suffix := "/"
		if public {
			suffix = "/public"
		}
		if err = read(strings.TrimRight(scheduleURL, "/")+"/matches/enriched", &matches); err == nil {
			err = read(strings.TrimRight(scoreURL, "/")+suffix, &scores)
		}
		if err != nil {
			http.Error(w, "Hasil pertandingan belum dapat dimuat. Silakan coba lagi.", 503)
			return
		}
		rows := workspaceRows(matches, scores, q)
		if public {
			day := time.Now().In(time.FixedZone("WIB", 7*60*60)).Format("2006-01-02")
			visible := rows[:0]
			for _, row := range rows {
				date, err := time.Parse(time.RFC3339Nano, row.Match.MatchDate)
				if err == nil && date.In(time.FixedZone("WIB", 7*60*60)).Format("2006-01-02") <= day && workspaceSidesReady(row.Match.Participants) && row.Score != nil && row.Score.ScoreA >= 0 && row.Score.ScoreB >= 0 {
					visible = append(visible, row)
				}
			}
			rows = visible
		}
		total := len(rows)
		start := (q.page - 1) * q.size
		if start > total {
			start = total
		}
		end := start + q.size
		if end > total {
			end = total
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		var data any = rows[start:end]
		if public {
			safe := []map[string]any{}
			for _, row := range rows[start:end] {
				safe = append(safe, map[string]any{"match": row.Match, "score": map[string]any{"matchId": row.Score.MatchID, "scoreA": row.Score.ScoreA, "scoreB": row.Score.ScoreB, "status": row.Score.Status, "timestamp": row.Score.Timestamp, "sequence": row.Score.Sequence}})
			}
			data = safe
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"data": data, "total": total, "page": q.page, "per_page": q.size})
	}
}

func workspaceSidesReady(sides []workspaceParticipant) bool {
	if len(sides) != 2 || sides[0].Slot+sides[1].Slot != 3 || sides[0].Slot == sides[1].Slot || sides[0].Kind != sides[1].Kind {
		return false
	}
	for _, side := range sides {
		if side.Slot < 1 || side.Slot > 2 || strings.TrimSpace(side.Name) == "" || side.Name == "Peserta menunggu konfirmasi" {
			return false
		}
		if side.Kind != "individual" && side.Kind != "team" && side.Kind != "contingent" {
			return false
		}
	}
	return true
}

func workspaceRows(matches []workspaceMatch, scores []workspaceScore, q workspaceQuery) []workspaceRow {
	byID := map[string]workspaceMatch{}
	for _, match := range matches {
		byID[match.ID] = match
	}
	seen := map[string]bool{}
	rows := []workspaceRow{}
	for _, score := range scores {
		seen[score.MatchID] = true
		if q.view != "recorded" {
			continue
		}
		match, ok := byID[score.MatchID]
		if !ok {
			match = workspaceMatch{ID: score.MatchID, Cabor: "Jadwal tidak tersedia", Participants: []workspaceParticipant{}}
		}
		copy := score
		rows = append(rows, workspaceRow{match, &copy})
	}
	if q.view == "available" {
		for _, match := range matches {
			if !seen[match.ID] {
				rows = append(rows, workspaceRow{match, nil})
			}
		}
	}
	filtered := rows[:0]
	for _, row := range rows {
		status := ""
		if row.Score != nil {
			status = row.Score.Status
		}
		// INFO: Search remains literal, including participant names; it never forms SQL or HTML.
		words := []string{row.Match.Cabor, row.Match.Nomor, row.Match.Venue, row.Match.Round, status}
		if strings.EqualFold(status, "Official") {
			words = append(words, "resmi")
		}
		for _, participant := range row.Match.Participants {
			words = append(words, participant.Name, participant.Team, participant.Athlete, participant.Contingent)
		}
		haystack := strings.ToLower(strings.Join(words, " "))
		date := ""
		if parsed, err := time.Parse(time.RFC3339Nano, row.Match.MatchDate); err == nil {
			date = parsed.In(time.FixedZone("WIB", 7*60*60)).Format("2006-01-02")
		}
		if q.matchID != "" && !strings.EqualFold(q.matchID, row.Match.ID) {
			continue
		}
		if q.matchID == "" && ((q.date != "" && date != q.date) || (q.month != "" && !strings.HasPrefix(date, q.month+"-"))) {
			continue
		}
		if q.q == "" || strings.Contains(haystack, q.q) {
			filtered = append(filtered, row)
		}
	}
	key := func(row workspaceRow) string {
		switch q.sort {
		case "cabor":
			return strings.ToLower(row.Match.Cabor)
		case "status":
			if row.Score != nil {
				return row.Score.Status
			}
		case "updated":
			if row.Score != nil {
				return row.Score.Timestamp
			}
		}
		return row.Match.MatchDate
	}
	sort.SliceStable(filtered, func(i, k int) bool {
		a, b := key(filtered[i]), key(filtered[k])
		if a == b {
			return filtered[i].Match.ID < filtered[k].Match.ID
		}
		if q.direction == "desc" {
			return a > b
		}
		return a < b
	})
	return filtered
}
