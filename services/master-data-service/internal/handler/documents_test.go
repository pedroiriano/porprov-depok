package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http/httptest"
	"net/textproto"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

// TEST: MIME settings cannot enable a type without a server-side validator.
func TestDocumentPolicyAndFileValidation(t *testing.T) {
	policy := documentPolicy{Allowed: []string{"application/pdf"}, MaxBytes: 50 << 20}
	if !validDocumentPolicy(policy) {
		t.Fatal("PDF 50 MiB must be allowed")
	}
	for _, types := range [][]string{nil, {"text/html"}, {"image/svg+xml"}, {"application/pdf", "application/pdf"}, {"application/octet-stream"}} {
		other := policy
		other.Allowed = types
		if validDocumentPolicy(other) {
			t.Fatalf("unsafe policy accepted: %v", types)
		}
	}
	for _, size := range []int64{0, (1 << 20) - 1, (100 << 20) + 1} {
		other := policy
		other.MaxBytes = size
		if validDocumentPolicy(other) {
			t.Fatal("invalid limit accepted")
		}
	}
	for _, test := range []struct {
		name, mime, body string
		ok               bool
	}{
		{"agenda.pdf", "application/pdf", "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF", true},
		{"agenda.pdf", "application/pdf", "<script>alert(1)</script>", false},
		{"agenda.pdf", "text/html", "%PDF-1.7\n%%EOF", false},
		{"agenda.html", "application/pdf", "%PDF-1.7\n%%EOF", false},
		{"agenda.pdf", "application/pdf", "%PDF-1.7\nunfinished", false},
		{"agenda.txt", "text/plain", "catatan", false},
	} {
		t.Run(test.name+test.mime+fmt.Sprint(test.ok), func(t *testing.T) {
			file, err := os.CreateTemp(t.TempDir(), "fixture")
			if err != nil {
				t.Fatal(err)
			}
			defer file.Close()
			file.WriteString(test.body)
			_, err = validateDocumentFile(file, test.name, test.mime, policy)
			if (err == nil) != test.ok {
				t.Fatalf("validation mismatch: %v", err)
			}
		})
	}
	if cleanDocumentName("..\\folder\\agenda.pdf") != "agenda.pdf" || cleanDocumentName("agenda\r\n.pdf") != "agenda.pdf" {
		t.Fatal("unsafe filename handling")
	}
	policy.Allowed = []string{"text/csv"}
	f, err := os.CreateTemp(t.TempDir(), "csv")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	f.WriteString("cabor,tanggal\nBola Basket,2026-11-01")
	if _, err = validateDocumentFile(f, "agenda.csv", "text/csv", policy); err != nil {
		t.Fatal(err)
	}
	f.Write([]byte{0})
	if _, err = validateDocumentFile(f, "agenda.csv", "text/csv", policy); err == nil {
		t.Fatal("binary CSV accepted")
	}
}

// TEST: Direct service access, forged proofs and cross-action proofs fail before DB/body reads.
func TestDocumentServiceAuthorization(t *testing.T) {
	h := NewDocumentHandler(nil, strings.Repeat("s", 32))
	for _, proof := range []string{"", "forged", portal.DocumentsProof(h.secret, "document.view")} {
		request := httptest.NewRequest("POST", "/api/v1/documents", strings.NewReader("not read"))
		request.Header.Set("X-Actor-ID", "actor")
		request.Header.Set("X-Actor-Username", "owner")
		request.Header.Set("X-Document-Authorization", proof)
		response := httptest.NewRecorder()
		h.Upload(response, request)
		if response.Code != 403 {
			t.Fatal("forged/wrong-action proof accepted")
		}
	}
}

// TEST: All state is in temporary tables inside one rolled-back transaction; only t.TempDir receives files.
func TestDocumentsLifecycleIsolatedPostgres(t *testing.T) {
	connection := os.Getenv("DOCUMENT_TEST_DATABASE_URL")
	if connection == "" {
		t.Skip("isolated PostgreSQL fixture not requested")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, connection)
	if err != nil {
		t.Fatal("test DB configuration invalid")
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal("test DB unavailable")
	}
	defer tx.Rollback(ctx)
	raw, err := os.ReadFile("../../migrations/000017_create_document_management.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	sql := strings.ReplaceAll(string(raw), "CREATE TABLE ", "CREATE TEMP TABLE ")
	sql = strings.ReplaceAll(sql, "CREATE FUNCTION prevent_document_revision_mutation", "CREATE FUNCTION pg_temp.prevent_document_revision_mutation")
	sql = strings.ReplaceAll(sql, "EXECUTE FUNCTION prevent_document_revision_mutation()", "EXECUTE FUNCTION pg_temp.prevent_document_revision_mutation()")
	if _, err = tx.Exec(ctx, sql); err != nil {
		t.Fatal(err)
	}
	publicationSQL, err := os.ReadFile("../../migrations/000018_publish_documents.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = tx.Exec(ctx, string(publicationSQL)); err != nil {
		t.Fatal(err)
	}
	h := NewDocumentHandler(tx, strings.Repeat("s", 32))
	h.directory = t.TempDir()
	router := chi.NewRouter()
	h.Routes(router)
	call := func(method, path, permission string, body io.Reader, contentType string, want int) *httptest.ResponseRecorder {
		t.Helper()
		request := httptest.NewRequest(method, path, body)
		request.Header.Set("X-Actor-ID", "00000000-0000-4000-8000-000000000001")
		request.Header.Set("X-Actor-Username", "document-isolated-uat")
		request.Header.Set("X-Document-Authorization", portal.DocumentsProof(h.secret, permission))
		if contentType != "" {
			request.Header.Set("Content-Type", contentType)
		}
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != want {
			t.Fatalf("%s %s status=%d body=%s", method, path, response.Code, response.Body.String())
		}
		return response
	}
	jsonCall := func(method, path, permission, body string, want int) *httptest.ResponseRecorder {
		return call(method, path, permission, strings.NewReader(body), "application/json", want)
	}
	response := call("GET", "/api/v1/documents/policy", "document.view", nil, "", 200)
	var policy struct {
		Policy documentPolicy `json:"policy"`
	}
	json.Unmarshal(response.Body.Bytes(), &policy)
	if policy.Policy.MaxBytes != 50<<20 || len(policy.Policy.Allowed) != 1 || policy.Policy.Allowed[0] != "application/pdf" {
		t.Fatal("wrong defaults")
	}
	upload := func(body, filename, kind string, want int) documentItem {
		t.Helper()
		var buffer bytes.Buffer
		writer := multipart.NewWriter(&buffer)
		writer.WriteField("title", "Agenda AND 1=1 --")
		writer.WriteField("description", "Dokumen UAT terisolasi")
		header := textproto.MIMEHeader{}
		header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, filename))
		header.Set("Content-Type", kind)
		part, _ := writer.CreatePart(header)
		io.WriteString(part, body)
		writer.Close()
		response := call("POST", "/api/v1/documents", "document.create", &buffer, writer.FormDataContentType(), want)
		var item documentItem
		if want == 201 {
			if err = json.Unmarshal(response.Body.Bytes(), &item); err != nil {
				t.Fatal(err)
			}
		}
		return item
	}
	streamUpload := func(size int64, want int) {
		t.Helper()
		pipe, writerPipe := io.Pipe()
		writer := multipart.NewWriter(writerPipe)
		done := make(chan struct{})
		go func() {
			defer close(done)
			defer writerPipe.Close()
			writer.WriteField("title", "Dokumen batas ukuran")
			header := textproto.MIMEHeader{}
			header.Set("Content-Disposition", `form-data; name="file"; filename="limit.pdf"`)
			header.Set("Content-Type", "application/pdf")
			part, e := writer.CreatePart(header)
			if e != nil {
				return
			}
			prefix, tail := "%PDF-1.7\n", "\n%%EOF"
			io.WriteString(part, prefix)
			io.CopyN(part, documentSpaceReader{}, size-int64(len(prefix)+len(tail)))
			io.WriteString(part, tail)
			writer.Close()
		}()
		call("POST", "/api/v1/documents", "document.create", pipe, writer.FormDataContentType(), want)
		pipe.Close()
		<-done
	}
	streamUpload((50<<20)+1, 413)
	item := upload("%PDF-1.7\n<<>>\n%%EOF", "agenda.pdf", "application/pdf", 201)
	files, _ := os.ReadDir(h.directory)
	if len(files) != 1 {
		t.Fatal("expected one private file")
	}
	storedPath := filepath.Join(h.directory, files[0].Name())
	upload("<html>not a PDF</html>", "forged.pdf", "application/pdf", 422)
	files, _ = os.ReadDir(h.directory)
	if len(files) != 1 {
		t.Fatal("rejected upload leaked a pending file")
	}
	response = call("GET", "/api/v1/documents?q=AND+1%3D1+--", "document.view", nil, "", 200)
	if !strings.Contains(response.Body.String(), item.ID) {
		t.Fatal("literal search failed")
	}
	response = call("GET", "/api/v1/documents?q=OR+1%3D1+--", "document.view", nil, "", 200)
	if !strings.Contains(response.Body.String(), `"total":0`) {
		t.Fatal("SQL-looking input was interpreted")
	}
	response = call("GET", "/api/v1/documents/"+item.ID+"/download", "document.view", nil, "", 200)
	if !strings.HasPrefix(response.Header().Get("Content-Disposition"), "attachment;") || response.Header().Get("Cache-Control") != "no-store" || response.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal("unsafe document delivery")
	}
	jsonCall("PUT", "/api/v1/documents/"+item.ID, "document.update", `{"expected_version":1,"title":"Agenda terbaru","reason":"Keterangan diperbaiki"}`, 200)
	jsonCall("PUT", "/api/v1/documents/"+item.ID, "document.update", `{"expected_version":1,"title":"stale","reason":"Versi lama ditolak"}`, 409)
	jsonCall("DELETE", "/api/v1/documents/"+item.ID, "document.archive", `{"expected_version":2,"reason":"Diarsipkan untuk UAT"}`, 200)
	call("GET", "/api/v1/documents/"+item.ID+"/download", "document.view", nil, "", 404)
	if _, err = os.Stat(storedPath); err != nil {
		t.Fatal("archive removed the stored file")
	}
	jsonCall("POST", "/api/v1/documents/"+item.ID+"/restore", "document.restore", `{"expected_version":3,"reason":"Dipulihkan untuk UAT"}`, 200)
	var rid int64
	if err = tx.QueryRow(ctx, "SELECT id FROM document_revisions WHERE document_id=$1 AND version=1", item.ID).Scan(&rid); err != nil {
		t.Fatal(err)
	}
	jsonCall("POST", "/api/v1/documents/"+item.ID+"/restore-revision", "document.update", fmt.Sprintf(`{"expected_version":4,"revision_id":%d,"reason":"Pulihkan riwayat pertama"}`, rid), 200)
	response = call("GET", "/api/v1/documents/"+item.ID+"/history", "document.view", nil, "", 200)
	if !strings.Contains(response.Body.String(), "RESTORE_REVISION") {
		t.Fatal("restore did not append revision")
	}
	jsonCall("PUT", "/api/v1/documents/policy", "document.policy", `{"expected_version":1,"allowed_mime_types":["text/html"],"max_file_bytes":52428800,"reason":"Jenis berbahaya ditolak"}`, 422)
	jsonCall("PUT", "/api/v1/documents/policy", "document.policy", `{"expected_version":1,"allowed_mime_types":["text/plain"],"max_file_bytes":1048576,"reason":"Ubah kebijakan untuk UAT"}`, 200)
	jsonCall("PUT", "/api/v1/documents/policy", "document.policy", `{"expected_version":1,"allowed_mime_types":["text/plain"],"max_file_bytes":1048576,"reason":"Konflik kebijakan UAT"}`, 409)
	upload("%PDF-1.7\n%%EOF", "blocked.pdf", "application/pdf", 422)
	upload("Catatan aman", "catatan.txt", "text/plain", 201)
	// SECURITY: Existing documents remain available when a type is disabled for new uploads.
	call("GET", "/api/v1/documents/"+item.ID+"/download", "document.view", nil, "", 200)
	jsonCall("PUT", "/api/v1/documents/policy", "document.policy", `{"expected_version":2,"allowed_mime_types":["application/pdf"],"max_file_bytes":52428800,"reason":"Pulihkan batas awal untuk UAT"}`, 200)
	streamUpload(50<<20, 201)
	var count int
	tx.QueryRow(ctx, "SELECT count(*) FROM document_outbox").Scan(&count)
	if count != 9 {
		t.Fatalf("missing transactional audit events: %d", count)
	}
	// TEST: Rejected revision mutations are rolled back to a savepoint, not the surrounding fixture.
	nested, _ := tx.Begin(ctx)
	_, err = nested.Exec(ctx, "DELETE FROM document_revisions WHERE document_id=$1", item.ID)
	nested.Rollback(ctx)
	if err == nil {
		t.Fatal("immutable history accepted deletion")
	}
	// TEST: Old clients and old revisions cannot silently reactivate a disabled document module.
	portalMigration, err := os.ReadFile("../../migrations/000016_create_portal_management.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	portalSQL := strings.ReplaceAll(string(portalMigration), "CREATE TABLE portal_", "CREATE TEMP TABLE portal_")
	portalSQL = strings.ReplaceAll(portalSQL, "CREATE FUNCTION prevent_portal_revision_mutation", "CREATE FUNCTION pg_temp.prevent_portal_revision_mutation")
	portalSQL = strings.ReplaceAll(portalSQL, "EXECUTE FUNCTION prevent_portal_revision_mutation()", "EXECUTE FUNCTION pg_temp.prevent_portal_revision_mutation()")
	if _, err = tx.Exec(ctx, portalSQL); err != nil {
		t.Fatal(err)
	}
	ph := &PortalHandler{pool: tx, proof: strings.Repeat("p", 64)}
	portalCall := func(action string, version int64, document portal.Document, revisionID int64) {
		t.Helper()
		data, _ := json.Marshal(portalChange{ExpectedVersion: version, Document: document, RevisionID: revisionID, Reason: "Compatibilitas dokumen terisolasi"})
		r := httptest.NewRequest("POST", "/api/v1/portal/manage", bytes.NewReader(data))
		r.Header.Set("X-Portal-Authorization", ph.proof)
		r.Header.Set("X-Actor-ID", "00000000-0000-4000-8000-000000000001")
		r.Header.Set("X-Actor-Username", "document-isolated-uat")
		w := httptest.NewRecorder()
		ph.Change(action)(w, r)
		if w.Code != 200 {
			t.Fatalf("portal compatibility status=%d body=%s", w.Code, w.Body.String())
		}
	}
	document := portal.Default()
	for i := range document.Modules {
		if document.Modules[i].ID == "documents" {
			document.Modules[i].AdminEnabled = false
		}
	}
	portalCall("SAVE_DRAFT", 0, document, 0)
	legacy := portal.Default()
	legacy.Modules = slices.DeleteFunc(legacy.Modules, func(m portal.Module) bool { return m.ID == "documents" || m.ID == "downloads" })
	portalCall("SAVE_DRAFT", 1, legacy, 0)
	state, err := ph.read(ctx)
	if err != nil || state.Draft.Local("documents", true) {
		t.Fatal("legacy client reactivated document module")
	}
	oldJSON, _ := json.Marshal(legacy)
	err = tx.QueryRow(ctx, "INSERT INTO portal_revisions(version,action,document,actor_id,actor_username,reason) VALUES(99,'SAVE_DRAFT',$1,'fixture','fixture','Riwayat sebelum modul dokumen') RETURNING id", oldJSON).Scan(&rid)
	if err != nil {
		t.Fatal(err)
	}
	portalCall("RESTORE", 2, portal.Document{}, rid)
	state, err = ph.read(ctx)
	if err != nil || state.Draft.Local("documents", true) {
		t.Fatal("legacy revision reactivated document module")
	}
}

// TEST: Constant-memory PDF padding for the real upload boundary.
type documentSpaceReader struct{}

func (documentSpaceReader) Read(p []byte) (int, error) {
	for i := range p {
		p[i] = ' '
	}
	return len(p), nil
}
