package middleware

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/pkg/response"
)

type authorizationResponse struct {
	Active  bool `json:"active"`
	Allowed bool `json:"allowed"`
}

// PermissionAuthorizer memusatkan pemeriksaan status akun dan hak akses pada User Service.
type PermissionAuthorizer struct {
	baseURL string
	client  *http.Client
}

func NewPermissionAuthorizer(userServiceURL string) *PermissionAuthorizer {
	parsed, err := url.Parse(userServiceURL)
	if err == nil && parsed.Scheme != "" && parsed.Host != "" {
		parsed.Path, parsed.RawQuery, parsed.Fragment = "", "", ""
		userServiceURL = strings.TrimRight(parsed.String(), "/")
	}
	return &PermissionAuthorizer{baseURL: strings.TrimRight(userServiceURL, "/"), client: &http.Client{Timeout: 3 * time.Second}}
}

func (a *PermissionAuthorizer) authorize(r *http.Request, permission string) (authorizationResponse, error) {
	endpoint := a.baseURL + "/api/v1/authorization/session"
	if permission != "" {
		endpoint = a.baseURL + "/api/v1/authorization/check?permission=" + url.QueryEscape(permission)
	}
	request, err := http.NewRequestWithContext(r.Context(), http.MethodGet, endpoint, nil)
	if err != nil {
		return authorizationResponse{}, err
	}
	request.Header.Set("X-Actor-ID", ActorIDFromContext(r.Context()))
	result, err := a.client.Do(request)
	if err != nil {
		return authorizationResponse{}, err
	}
	defer result.Body.Close()
	if result.StatusCode != http.StatusOK {
		return authorizationResponse{}, &authorizationStatusError{status: result.StatusCode}
	}
	var payload authorizationResponse
	err = json.NewDecoder(io.LimitReader(result.Body, 64<<10)).Decode(&payload)
	return payload, err
}

type authorizationStatusError struct{ status int }

func (e *authorizationStatusError) Error() string { return http.StatusText(e.status) }

func (a *PermissionAuthorizer) RequireActive(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		result, err := a.authorize(r, "")
		if err != nil {
			response.Error(w, r, http.StatusServiceUnavailable, "Account status is temporarily unavailable", nil)
			return
		}
		if !result.Active {
			response.Error(w, r, http.StatusForbidden, "Account is inactive or archived", nil)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *PermissionAuthorizer) RequirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			result, err := a.authorize(r, permission)
			if err != nil {
				response.Error(w, r, http.StatusServiceUnavailable, "Authorization is temporarily unavailable", nil)
				return
			}
			if !result.Active || !result.Allowed {
				response.Error(w, r, http.StatusForbidden, "Insufficient permission", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
