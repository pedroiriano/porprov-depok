package router

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
)

// TEST: Fresh permission checks and owner-only policy edits precede all trusted service proofs.
func TestDocumentsGatewayBoundaries(t *testing.T) {
	jwt, key, issuer := testJWTMiddleware(t)
	allowed := true
	enabled := true
	calls := 0
	requested := ""
	proof := ""
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/portal/public":
			d := portal.Default()
			for i := range d.Modules {
				if d.Modules[i].ID == "documents" {
					d.Modules[i].AdminEnabled = enabled
				}
			}
			json.NewEncoder(w).Encode(d.Public())
			return
		case "/api/v1/authorization/session":
			json.NewEncoder(w).Encode(map[string]bool{"active": true})
			return
		case "/api/v1/authorization/check":
			requested = r.URL.Query().Get("permission")
			json.NewEncoder(w).Encode(map[string]bool{"active": true, "allowed": allowed})
			return
		}
		calls++
		proof = r.Header.Get("X-Document-Authorization")
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	cfg := &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", UserURL: upstream.URL, InternalStreamToken: strings.Repeat("d", 32)}
	router := SetupRouter(jwt, cfg)
	call := func(method, path, role string, want int) {
		t.Helper()
		request := httptest.NewRequest(method, path, nil)
		if role != "" {
			request.Header.Set("Authorization", "Bearer "+signedTestToken(t, key, issuer, role))
		}
		request.Header.Set("X-Document-Authorization", "forged")
		request.Header.Set("X-Actor-ID", "forged")
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != want {
			t.Fatalf("%s %s %s status=%d", method, path, role, response.Code)
		}
	}
	call("GET", "/api/v1/documents", "", 403)
	call("GET", "/api/v1/documents", "auditor", 204)
	if requested != "document.view" || proof != portal.DocumentsProof(cfg.InternalStreamToken, "document.view") {
		t.Fatal("view permission/proof mismatch")
	}
	before := calls
	call("PUT", "/api/v1/documents/policy", "auditor", 403)
	if calls != before {
		t.Fatal("non-owner modified policy")
	}
	call("PUT", "/api/v1/documents/policy", "super_admin", 204)
	if requested != "document.policy" || proof != portal.DocumentsProof(cfg.InternalStreamToken, "document.policy") {
		t.Fatal("policy proof mismatch")
	}
	allowed = false
	before = calls
	call("POST", "/api/v1/documents", "super_admin", 403)
	if calls != before {
		t.Fatal("revoked create permission bypassed")
	}
	allowed = true
	enabled = false
	call("GET", "/api/v1/documents", "super_admin", 403)
}

// TEST: Exercise the real HTTP transport and all global middleware, not only the service's upload handler.
func TestDocumentsUploadThroughGatewayBodyLimits(t *testing.T) {
	jwt, key, issuer := testJWTMiddleware(t)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if servePortalFixture(w, r) {
			return
		}
		if r.URL.Path == "/api/v1/authorization/check" {
			_ = json.NewEncoder(w).Encode(map[string]bool{"active": true, "allowed": true})
			return
		}
		if _, err := io.Copy(io.Discard, r.Body); err != nil {
			w.WriteHeader(400)
			return
		}
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	cfg := &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", UserURL: upstream.URL, InternalStreamToken: strings.Repeat("d", 32), AllowedOrigins: []string{"http://localhost:5173"}}
	server := httptest.NewServer(SetupRouter(jwt, cfg))
	defer server.Close()
	client := &http.Client{Timeout: 30 * time.Second}
	for _, test := range []struct {
		name, path string
		size       int64
		chunked    bool
		want       int
	}{
		{"PDF_29_MiB", "/api/v1/documents", 29 << 20, false, 204},
		{"PDF_50_MiB", "/api/v1/documents", 50 << 20, false, 204},
		{"Other_endpoint_keeps_12_MiB", "/api/v1/master-data/media/upload", 13 << 20, false, 413},
		{"Hard_limit_known_length", "/api/v1/documents", (100 << 20) + (64 << 10) + 1, false, 413},
		{"Hard_limit_chunked", "/api/v1/documents", (100 << 20) + (64 << 10) + 1, true, 413},
		{"Other_endpoint_chunked", "/api/v1/master-data/media/upload", 13 << 20, true, 413},
	} {
		t.Run(test.name, func(t *testing.T) {
			var header bytes.Buffer
			writer := multipart.NewWriter(&header)
			_ = writer.WriteField("title", "Fixture transport only; no database")
			if _, err := writer.CreateFormFile("file", "fixture.pdf"); err != nil {
				t.Fatal(err)
			}
			prefix := bytes.Clone(header.Bytes())
			header.Reset()
			_ = writer.Close()
			suffix := bytes.Clone(header.Bytes())
			body := io.MultiReader(bytes.NewReader(prefix), io.LimitReader(documentPaddingReader{}, test.size), bytes.NewReader(suffix))
			request, err := http.NewRequest("POST", server.URL+test.path, body)
			if err != nil {
				t.Fatal(err)
			}
			if !test.chunked {
				request.ContentLength = int64(len(prefix)+len(suffix)) + test.size
			}
			request.Header.Set("Content-Type", writer.FormDataContentType())
			request.Header.Set("Authorization", "Bearer "+signedTestToken(t, key, issuer, "super_admin"))
			request.Header.Set("Origin", "http://localhost:5173")
			response, err := client.Do(request)
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			raw, err := io.ReadAll(io.LimitReader(response.Body, 4096))
			if err != nil {
				t.Fatal(err)
			}
			if response.StatusCode != test.want {
				t.Fatalf("size=%d status=%d want=%d body=%s", test.size, response.StatusCode, test.want, raw)
			}
			if response.Header.Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
				t.Fatal("CORS error hides upload response")
			}
			if test.want == 413 && (!json.Valid(raw) || response.Header.Get("Cache-Control") != "no-store") {
				t.Fatal("oversize response must be stable JSON and no-store")
			}
		})
	}
}

// TEST: Generate large transport bodies in constant memory; never store a real document.
type documentPaddingReader struct{}

func (documentPaddingReader) Read(p []byte) (int, error) {
	for i := range p {
		p[i] = 'x'
	}
	return len(p), nil
}

// TEST: Anonymous publication is restricted to exact projection routes; publish/pin require fresh owner authorization.
func TestPublicDocumentsAndOwnerPublicationBoundaries(t *testing.T) {
	jwt, key, issuer := testJWTMiddleware(t)
	enabled := true
	allowed := true
	calls := 0
	proof := ""
	actor := ""
	permission := ""
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/portal/public" {
			d := portal.Default()
			for i := range d.Modules {
				if d.Modules[i].ID == "downloads" {
					d.Modules[i].PublicEnabled = enabled
				}
			}
			json.NewEncoder(w).Encode(d.Public())
			return
		}
		if r.URL.Path == "/api/v1/authorization/session" {
			json.NewEncoder(w).Encode(map[string]bool{"active": true})
			return
		}
		if r.URL.Path == "/api/v1/authorization/check" {
			permission = r.URL.Query().Get("permission")
			json.NewEncoder(w).Encode(map[string]bool{"active": true, "allowed": allowed})
			return
		}
		calls++
		proof = r.Header.Get("X-Document-Authorization")
		actor = r.Header.Get("X-Actor-ID")
		w.WriteHeader(204)
	}))
	defer upstream.Close()
	cfg := &config.AppConfig{MasterDataURL: upstream.URL + "/api/v1", UserURL: upstream.URL, InternalStreamToken: strings.Repeat("p", 32)}
	router := SetupRouter(jwt, cfg)
	call := func(method, path, role string, want int) {
		t.Helper()
		request := httptest.NewRequest(method, path, nil)
		request.Header.Set("X-Actor-ID", "spoofed")
		request.Header.Set("X-Document-Authorization", "spoofed")
		if role != "" {
			request.Header.Set("Authorization", "Bearer "+signedTestToken(t, key, issuer, role))
		}
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != want {
			t.Fatalf("%s %s %s status=%d want=%d", method, path, role, response.Code, want)
		}
	}
	id := "00000000-0000-4000-8000-000000000001"
	for _, path := range []string{"/documents/public", "/documents/public/pinned", "/documents/public/bundle", "/documents/public/" + id + "/download"} {
		call("GET", "/api/v1"+path, "", 204)
		if proof != portal.DocumentsProof(cfg.InternalStreamToken, "document.public") || actor != "" {
			t.Fatal("public header boundary bypass")
		}
	}
	before := calls
	call("GET", "/api/v1/documents/policy", "", 403)
	if calls != before {
		t.Fatal("private policy exposed")
	}
	call("PUT", "/api/v1/documents/"+id+"/publication", "auditor", 403)
	call("PUT", "/api/v1/documents/"+id+"/publication", "super_admin", 204)
	if proof != portal.DocumentsProof(cfg.InternalStreamToken, "document.publish") || permission != "document.update" {
		t.Fatal("publication proof/permission mismatch")
	}
	allowed = false
	call("PUT", "/api/v1/documents/"+id+"/pin", "super_admin", 403)
	allowed = true
	enabled = false
	call("GET", "/api/v1/documents/public", "", 403)
}
