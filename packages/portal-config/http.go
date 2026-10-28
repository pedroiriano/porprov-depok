package portal

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// SECURITY: Purpose-bound internal credential; the root secret never crosses the public projection.
func ManagementProof(secret string) string {
	return managementProof(secret, "porprov:portal-management:v1")
}

// SECURITY: Distinct purpose prevents reuse of a portal proof for schedule mutations.
func SchedulePeriodsProof(secret string) string {
	return managementProof(secret, "porprov:schedule-periods:v1")
}

func managementProof(secret, purpose string) string {
	if len(secret) < 24 {
		return ""
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(purpose))
	return hex.EncodeToString(mac.Sum(nil))
}

type Loader func(context.Context) (Document, error)

func RemoteLoader(baseURL string) Loader {
	u, err := url.Parse(baseURL)
	if err == nil {
		host := strings.ToLower(u.Hostname())
		ip := net.ParseIP(host)
		if u.User != nil || (u.Scheme != "http" && u.Scheme != "https") || (host != "master-data-service" && host != "localhost" && (ip == nil || !ip.IsLoopback())) {
			err = errors.New("untrusted portal configuration origin")
		}
	}
	if err == nil {
		u.Path = "/api/v1/portal/public"
		u.RawQuery = ""
		u.Fragment = ""
	}
	client := &http.Client{Timeout: 3 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	return func(ctx context.Context) (Document, error) {
		if err != nil {
			return Document{}, errors.New("invalid portal origin")
		}
		req, e := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
		if e != nil {
			return Document{}, e
		}
		res, e := client.Do(req)
		if e != nil {
			return Document{}, e
		}
		defer res.Body.Close()
		if res.StatusCode != http.StatusOK {
			return Document{}, errors.New("portal configuration unavailable")
		}
		var d Document
		e = json.NewDecoder(io.LimitReader(res.Body, 1<<20)).Decode(&d)
		if e != nil || d.SchemaVersion != 1 || len(d.Modules) != len(Default().Modules) || len(d.Features) != len(Default().Features) {
			return Document{}, errors.New("invalid portal projection")
		}
		return d, nil
	}
}

func RequestModules(path string) []string {
	if path == "/api/v1/portal/references/livescore-matches" {
		return []string{"livescore"}
	}
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if part == "deleted" && i+1 < len(parts) {
			switch strings.ToLower(parts[i+1]) {
			case "cabor", "cabors", "nomortanding", "nomor-tanding", "nomor-tandings":
				return []string{"cabor"}
			case "kontingen", "kontingens":
				return []string{"kontingen"}
			case "cityguide", "city-guide", "city-guides":
				return []string{"city_guide"}
			}
		}
	}
	for _, p := range []struct{ prefix, id string }{
		{"/api/v1/master-data/cabors", "cabor"}, {"/api/v1/master-data/nomor-tandings", "cabor"}, {"/api/v1/master-data/kontingens", "kontingen"},
		{"/api/v1/master-data/heroes", "home"}, {"/api/v1/master-data/city-guide", "city_guide"},
		{"/api/v1/schedule", "jadwal"}, {"/api/v1/periods", "jadwal"}, {"/api/v1/matches", "jadwal"}, {"/api/v1/livescore", "livescore"}, {"/api/v1/medals", "medali"}, {"/api/v1/venues", "venue"},
		{"/api/v1/cabors", "cabor"}, {"/api/v1/nomor-tandings", "cabor"}, {"/api/v1/kontingens", "kontingen"}, {"/api/v1/city-guide", "city_guide"}, {"/api/v1/heroes", "home"},
	} {
		if path == p.prefix || strings.HasPrefix(path, p.prefix+"/") || p.id == "city_guide" && strings.HasPrefix(path, p.prefix) {
			if p.id == "jadwal" && strings.Contains(path, "/participants") {
				return []string{"jadwal", "atlet"}
			}
			return []string{p.id}
		}
	}
	return nil
}

func RequestFeature(path string) string {
	for _, prefix := range []string{"/api/v1/schedule/periods", "/api/v1/periods"} {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			return "schedule_periods"
		}
	}
	for _, prefix := range []string{"/api/v1/schedule/matches", "/api/v1/matches", "/api/v1/schedule/deleted"} {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			return "schedule_matches"
		}
	}
	return ""
}

// SECURITY: Reads configuration per request: a failed lookup never re-enables an unpublished module.
func Guard(load Loader, admin func(*http.Request) bool, internalReads bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			modules := RequestModules(r.URL.Path)
			// SECURITY: Participant replacement is a separate capability, including when embedded in a match update.
			if (strings.Contains(r.URL.Path, "/schedule/") || strings.HasPrefix(r.URL.Path, "/api/v1/matches")) && (r.Method == http.MethodPost || r.Method == http.MethodPut) && r.Body != nil {
				body, err := io.ReadAll(io.LimitReader(r.Body, (1<<20)+1))
				if err != nil || len(body) > 1<<20 {
					http.Error(w, "Permintaan jadwal terlalu besar atau tidak valid", http.StatusBadRequest)
					return
				}
				r.Body = io.NopCloser(bytes.NewReader(body))
				var fields map[string]json.RawMessage
				if len(body) > 0 && json.Unmarshal(body, &fields) == nil {
					if value, ok := fields["participants"]; ok && string(value) != "null" {
						modules = append(modules, "atlet")
					}
				}
			}
			if len(modules) == 0 || r.Method == http.MethodOptions || internalReads && (r.Method == http.MethodGet || r.Method == http.MethodHead) {
				next.ServeHTTP(w, r)
				return
			}
			d, err := load(r.Context())
			if err != nil {
				http.Error(w, "Konfigurasi portal sementara tidak tersedia", http.StatusServiceUnavailable)
				return
			}
			for _, id := range modules {
				if !d.Local(id, admin(r) || r.Method != http.MethodGet && r.Method != http.MethodHead) {
					w.Header().Set("Cache-Control", "no-store")
					http.Error(w, "Modul ini tidak dikelola atau tidak diaktifkan pada portal ini", http.StatusForbidden)
					return
				}
			}
			if feature := RequestFeature(r.URL.Path); feature != "" && !d.LocalFeature(feature, admin(r) || r.Method != http.MethodGet && r.Method != http.MethodHead) {
				w.Header().Set("Cache-Control", "no-store")
				http.Error(w, "Fitur ini tidak diaktifkan pada portal ini", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
