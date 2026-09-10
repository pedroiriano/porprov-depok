package router

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSAllowsCanonicalLocalOriginAndRejectsOtherOrigins(t *testing.T) {
	router := SetupRouter(nil, nil, nil, nil)
	for _, testCase := range []struct {
		origin string
		want   string
	}{{"http://localhost:5173", "http://localhost:5173"}, {"https://malicious.example", ""}} {
		request := httptest.NewRequest(http.MethodOptions, "/health", nil)
		request.Header.Set("Origin", testCase.origin)
		request.Header.Set("Access-Control-Request-Method", http.MethodGet)
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if got := response.Header().Get("Access-Control-Allow-Origin"); got != testCase.want {
			t.Fatalf("origin %q menghasilkan Allow-Origin %q, ingin %q", testCase.origin, got, testCase.want)
		}
	}
}
