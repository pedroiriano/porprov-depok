package handler

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

// TEST: Publication/privacy, pin replacement and ZIP use only temporary SQL tables and temporary files.
func TestDocumentPublicLifecycleIsolatedPostgres(t *testing.T) {
	url := os.Getenv("DOCUMENT_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("isolated fixture not requested")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	for _, name := range []string{"000016_create_portal_management.up.sql", "000017_create_document_management.up.sql", "000018_publish_documents.up.sql"} {
		data, err := os.ReadFile("../../migrations/" + name)
		if err != nil {
			t.Fatal(err)
		}
		sql := strings.ReplaceAll(string(data), "CREATE TABLE ", "CREATE TEMP TABLE ")
		for _, domain := range []string{"portal", "document"} {
			sql = strings.ReplaceAll(sql, "CREATE FUNCTION prevent_"+domain+"_revision_mutation", "CREATE FUNCTION pg_temp.prevent_"+domain+"_revision_mutation")
			sql = strings.ReplaceAll(sql, "EXECUTE FUNCTION prevent_"+domain+"_revision_mutation()", "EXECUTE FUNCTION pg_temp.prevent_"+domain+"_revision_mutation()")
		}
		if _, err = tx.Exec(ctx, sql); err != nil {
			t.Fatal(err)
		}
	}
	h := NewDocumentHandler(tx, strings.Repeat("s", 32))
	h.directory = t.TempDir()
	router := chi.NewRouter()
	h.Routes(router)
	call := func(method, path, permission, body string, want int) *httptest.ResponseRecorder {
		t.Helper()
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("X-Actor-ID", "00000000-0000-4000-8000-000000000001")
		r.Header.Set("X-Actor-Username", "isolated-owner")
		r.Header.Set("X-Document-Authorization", portal.DocumentsProof(h.secret, permission))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("%s %s %d want %d: %s", method, path, w.Code, want, w.Body.String())
		}
		return w
	}
	add := func(index int) string {
		t.Helper()
		id := fmt.Sprintf("00000000-0000-4000-8000-%012d", index)
		storage := fmt.Sprintf("%032x.bin", index)
		content := []byte("%PDF-1.7\n%%EOF")
		if err = os.WriteFile(filepath.Join(h.directory, storage), content, 0600); err != nil {
			t.Fatal(err)
		}
		_, err = tx.Exec(ctx, "INSERT INTO documents(id,title,description,original_name,storage_name,mime_type,file_bytes,checksum_sha256,created_by,created_username) VALUES($1,$2,'Keterangan','fixture.pdf',$3,'application/pdf',$4,'fixture','fixture','fixture')", id, "Panduan AND 1=1 -- "+fmt.Sprint(index), storage, len(content))
		if err != nil {
			t.Fatal(err)
		}
		return id
	}
	one, two := add(1), add(2)
	w := call("GET", "/api/v1/documents/public", "document.public", "", 200)
	if strings.Contains(w.Body.String(), one) {
		t.Fatal("private file listed")
	}
	call("GET", "/api/v1/documents/public/"+one+"/download", "document.public", "", 404)
	call("PUT", "/api/v1/documents/"+one+"/pin", "document.publish", `{"expected_version":1,"enabled":true,"reason":"Sematkan dokumen privat"}`, 409)
	call("PUT", "/api/v1/documents/"+one+"/publication", "document.update", `{"expected_version":1,"enabled":true,"reason":"Proof aksi salah ditolak"}`, 403)
	call("PUT", "/api/v1/documents/"+one+"/publication", "document.publish", `{"expected_version":1,"enabled":true,"reason":"Publikasi terisolasi"}`, 200)
	call("PUT", "/api/v1/documents/"+one+"/pin", "document.publish", `{"expected_version":2,"enabled":true,"reason":"Sematkan panduan pertama"}`, 200)
	w = call("GET", "/api/v1/documents/public/pinned", "document.public", "", 200)
	if !strings.Contains(w.Body.String(), one) {
		t.Fatal("pin not projected")
	}
	for _, private := range []string{"created_username", "storage_name", "checksum_sha256", "deleted_by", "actor"} {
		if strings.Contains(w.Body.String(), private) {
			t.Fatalf("private metadata exposed: %s", private)
		}
	}
	call("PUT", "/api/v1/documents/"+two+"/publication", "document.publish", `{"expected_version":1,"enabled":true,"reason":"Publikasi kedua terisolasi"}`, 200)
	call("PUT", "/api/v1/documents/"+two+"/pin", "document.publish", `{"expected_version":2,"enabled":true,"reason":"Ganti sematan panduan kedua"}`, 200)
	var count int
	tx.QueryRow(ctx, "SELECT count(*) FROM documents WHERE is_pinned").Scan(&count)
	if count != 1 {
		t.Fatal("multiple pins")
	}
	var version int64
	tx.QueryRow(ctx, "SELECT version FROM documents WHERE id=$1", one).Scan(&version)
	if version != 4 {
		t.Fatal("previous pin did not append revision")
	}
	call("PUT", "/api/v1/documents/"+one+"/pin", "document.publish", `{"expected_version":3,"enabled":true,"reason":"Versi lama ditolak"}`, 409)
	w = call("GET", "/api/v1/documents/public?per_page=1&page=2&q=AND+1%3D1+--&sort=title&order=asc", "document.public", "", 200)
	var page struct {
		Data  []publicDocument
		Total int
	}
	json.Unmarshal(w.Body.Bytes(), &page)
	if page.Total != 2 || len(page.Data) != 1 {
		t.Fatal("literal search/pagination failed")
	}
	call("GET", "/api/v1/documents/public?sort=title;drop", "document.public", "", 422)
	w = call("GET", "/api/v1/documents/public/bundle?ids="+one+","+two, "document.public", "", 200)
	archive, err := zip.NewReader(bytes.NewReader(w.Body.Bytes()), int64(w.Body.Len()))
	if err != nil || len(archive.File) != 2 {
		t.Fatal("ZIP invalid")
	}
	call("GET", "/api/v1/documents/public/bundle?ids="+one+","+one, "document.public", "", 422)
	// TEST: Database uniqueness is a second boundary even if application pin serialization regresses.
	nested, err := tx.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	_, err = nested.Exec(ctx, "UPDATE documents SET is_pinned=true WHERE id=$1", one)
	_ = nested.Rollback(ctx)
	if err == nil {
		t.Fatal("database allowed two pins")
	}
	// TEST: Sparse temporary file proves the 100 MiB bundle limit without materializing its bytes.
	large := add(3)
	largePath := filepath.Join(h.directory, fmt.Sprintf("%032x.bin", 3))
	if err = os.Truncate(largePath, (100<<20)+1); err != nil {
		t.Fatal(err)
	}
	if _, err = tx.Exec(ctx, "UPDATE documents SET file_bytes=$2 WHERE id=$1", large, (100<<20)+1); err != nil {
		t.Fatal(err)
	}
	call("PUT", "/api/v1/documents/"+large+"/publication", "document.publish", `{"expected_version":1,"enabled":true,"reason":"Fixture batas ukuran ZIP"}`, 200)
	call("GET", "/api/v1/documents/public/bundle?ids="+large, "document.public", "", 413)
	call("PUT", "/api/v1/documents/"+two+"/publication", "document.publish", `{"expected_version":3,"enabled":false,"reason":"Dokumen menjadi privat"}`, 200)
	call("GET", "/api/v1/documents/public/bundle?ids="+one+","+two, "document.public", "", 404)
	call("GET", "/api/v1/documents/public/"+two+"/download", "document.public", "", 404)
	w = call("GET", "/api/v1/documents/public/pinned", "document.public", "", 200)
	if !strings.Contains(w.Body.String(), `"data":null`) {
		t.Fatal("unpublished pin survived")
	}
	call("DELETE", "/api/v1/documents/"+one, "document.archive", `{"expected_version":4,"reason":"Arsipkan dokumen publik"}`, 200)
	call("POST", "/api/v1/documents/"+one+"/restore", "document.restore", `{"expected_version":5,"reason":"Pulihkan sebagai privat"}`, 200)
	call("GET", "/api/v1/documents/public/"+one+"/download", "document.public", "", 404)
	call("GET", "/api/v1/documents/public", "", "", 403)
	config := portal.Default()
	for i := range config.Modules {
		if config.Modules[i].ID == "downloads" {
			config.Modules[i].PublicEnabled = false
		}
	}
	raw, _ := json.Marshal(config)
	_, err = tx.Exec(ctx, "INSERT INTO portal_configuration(id,draft,published,updated_by) VALUES(1,$1,$1,'fixture')", raw)
	if err != nil {
		t.Fatal(err)
	}
	call("GET", "/api/v1/documents/public", "document.public", "", 403)
}

// TEST: Bulk parameter bounds are strict before any database/filesystem operation.
func TestDocumentBundleSelectionBounds(t *testing.T) {
	id := "00000000-0000-4000-8000-000000000001"
	for _, value := range []string{"", "../file", id + "," + id, strings.Repeat(id+",", 10) + id} {
		if _, err := parseDocumentBundleIDs(value); err == nil {
			t.Fatal("unsafe bundle selection accepted")
		}
	}
	if ids, err := parseDocumentBundleIDs(id); err != nil || len(ids) != 1 {
		t.Fatal("valid selection rejected")
	}
}
