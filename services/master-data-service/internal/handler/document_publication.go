package handler

import (
	"archive/zip"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

type publicDocument struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Name        string    `json:"original_name"`
	MIME        string    `json:"mime_type"`
	Bytes       int64     `json:"file_bytes"`
	Created     time.Time `json:"created_at"`
	Updated     time.Time `json:"updated_at"`
	Pinned      bool      `json:"is_pinned"`
}

const publicDocumentColumns = "id::text,title,description,original_name,mime_type,file_bytes,created_at,updated_at,is_pinned"

// SECURITY: Projection has its own proof and checks the published public module/page; no actor/history/storage is exposed.
func (h *DocumentHandler) publicAllowed(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Cache-Control", "no-store")
	expected := portal.DocumentsProof(h.secret, "document.public")
	if expected == "" || subtle.ConstantTimeCompare([]byte(expected), []byte(r.Header.Get("X-Document-Authorization"))) != 1 {
		portalJSON(w, 403, map[string]string{"message": "Akses unduhan tidak diizinkan"})
		return false
	}
	config, err := (&PortalHandler{pool: h.pool}).LoadPublished(r.Context())
	if err != nil {
		documentFailure(w, err)
		return false
	}
	page := config.PageFor("/unduhan")
	if !config.Local("downloads", false) || page == nil || page.Status != "published" {
		portalJSON(w, 403, map[string]string{"message": "Unduhan tidak ditampilkan di portal ini"})
		return false
	}
	return true
}
func (h *DocumentHandler) PublicList(w http.ResponseWriter, r *http.Request) {
	if !h.publicAllowed(w, r) {
		return
	}
	values, queryError := url.ParseQuery(r.URL.RawQuery)
	if queryError != nil {
		portalJSON(w, 422, map[string]string{"message": "Parameter pencarian tidak valid"})
		return
	}
	for key, items := range values {
		if len(items) != 1 || !slices.Contains([]string{"page", "per_page", "q", "sort", "order"}, key) {
			portalJSON(w, 422, map[string]string{"message": "Parameter pencarian tidak valid atau berulang"})
			return
		}
	}
	page, limit, err := documentPage(r)
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	sort := r.URL.Query().Get("sort")
	order := r.URL.Query().Get("order")
	if sort == "" {
		sort = "created_at"
	}
	if order == "" {
		order = "desc"
	}
	if err != nil || !documentText(q, 0, 80) || !slices.Contains([]string{"created_at", "title", "file_bytes"}, sort) || !slices.Contains([]string{"asc", "desc"}, order) {
		portalJSON(w, 422, map[string]string{"message": "Pencarian atau halaman tidak valid"})
		return
	}
	query := "WITH filtered AS MATERIALIZED (SELECT " + publicDocumentColumns + " FROM documents WHERE is_published AND deleted_at IS NULL AND ($1='' OR strpos(lower(title||' '||description||' '||original_name),lower($1))>0)) SELECT (SELECT count(*) FROM filtered),COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY " + sort + " " + order + ",id),'[]'::jsonb) FROM (SELECT * FROM filtered ORDER BY " + sort + " " + order + ",id LIMIT $2 OFFSET $3) paged"
	var total int64
	var raw []byte
	items := []publicDocument{}
	err = h.pool.QueryRow(r.Context(), query, q, limit, (page-1)*limit).Scan(&total, &raw)
	if err == nil {
		err = json.Unmarshal(raw, &items)
	}
	if err != nil {
		documentFailure(w, err)
		return
	}
	portalJSON(w, 200, map[string]any{"data": items, "page": page, "per_page": limit, "total": total, "total_pages": (total + int64(limit) - 1) / int64(limit), "bulk_max_files": 10, "bulk_max_bytes": 100 << 20})
}
func (h *DocumentHandler) PublicPinned(w http.ResponseWriter, r *http.Request) {
	if !h.publicAllowed(w, r) {
		return
	}
	var raw []byte
	err := h.pool.QueryRow(r.Context(), "SELECT to_jsonb(p) FROM (SELECT "+publicDocumentColumns+" FROM documents WHERE is_pinned AND is_published AND deleted_at IS NULL LIMIT 1) p").Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		portalJSON(w, 200, map[string]any{"data": nil})
		return
	}
	if err != nil {
		documentFailure(w, err)
		return
	}
	var d publicDocument
	if err = json.Unmarshal(raw, &d); err != nil {
		documentFailure(w, err)
		return
	}
	portalJSON(w, 200, map[string]any{"data": d})
}
func (h *DocumentHandler) PublicDownload(w http.ResponseWriter, r *http.Request) {
	if h.publicAllowed(w, r) {
		h.serveDocument(w, r, true)
	}
}

// SECURITY: Explicit owner action is required for publication and pinning. Pin never implicitly publishes a private file.
func (h *DocumentHandler) Publication(pin bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.allow(w, r, "document.publish") {
			return
		}
		id := documentID(w, r)
		if id == "" {
			return
		}
		var input struct {
			Expected int64  `json:"expected_version"`
			Enabled  *bool  `json:"enabled"`
			Reason   string `json:"reason"`
		}
		if !documentDecode(w, r, &input) {
			return
		}
		if input.Expected < 1 || input.Enabled == nil || !documentText(input.Reason, 5, 500) {
			portalJSON(w, 422, map[string]string{"message": "Status, versi dan alasan 5–500 karakter wajib diisi"})
			return
		}
		tx, err := h.pool.Begin(r.Context())
		if err != nil {
			documentFailure(w, err)
			return
		}
		defer tx.Rollback(r.Context())
		if _, err = tx.Exec(r.Context(), "SELECT pg_advisory_xact_lock(18602026)"); err != nil {
			documentFailure(w, err)
			return
		}
		item, err := scanDocument(tx.QueryRow(r.Context(), "SELECT "+documentColumns+" FROM documents WHERE id=$1 FOR UPDATE", id))
		if errors.Is(err, pgx.ErrNoRows) {
			portalJSON(w, 404, map[string]string{"message": "Dokumen tidak ditemukan"})
			return
		}
		if err != nil {
			documentFailure(w, err)
			return
		}
		if item.Deleted != nil || item.Version != input.Expected {
			portalJSON(w, 409, map[string]string{"message": "Status atau versi dokumen berubah. Muat ulang daftar."})
			return
		}
		if pin && *input.Enabled && !item.Published {
			portalJSON(w, 409, map[string]string{"message": "Tayangkan dokumen sebelum menyematkannya"})
			return
		}
		action := "UNPUBLISH"
		if *input.Enabled {
			action = "PUBLISH"
		}
		if pin {
			action = "UNPIN"
			if *input.Enabled {
				action = "PIN"
			}
			if *input.Enabled {
				rows, e := tx.Query(r.Context(), "UPDATE documents SET is_pinned=false,version=version+1,updated_at=now() WHERE is_pinned AND id<>$1 RETURNING "+documentColumns, id)
				if e != nil {
					documentFailure(w, e)
					return
				}
				previous := []documentItem{}
				for rows.Next() {
					d, e := scanDocument(rows)
					if e != nil {
						rows.Close()
						documentFailure(w, e)
						return
					}
					previous = append(previous, d)
				}
				err = rows.Err()
				rows.Close()
				if err != nil {
					documentFailure(w, err)
					return
				}
				for _, d := range previous {
					if err = h.record(r.Context(), tx, r, d.ID, d.Version, "UNPIN", "Sematan diganti: "+input.Reason, d); err != nil {
						documentFailure(w, err)
						return
					}
				}
			}
			_, err = tx.Exec(r.Context(), "UPDATE documents SET is_pinned=$2,version=version+1,updated_at=now() WHERE id=$1", id, *input.Enabled)
		} else {
			_, err = tx.Exec(r.Context(), "UPDATE documents SET is_published=$2,is_pinned=CASE WHEN $2 THEN is_pinned ELSE false END,version=version+1,updated_at=now() WHERE id=$1", id, *input.Enabled)
		}
		if err == nil {
			item, err = scanDocument(tx.QueryRow(r.Context(), "SELECT "+documentColumns+" FROM documents WHERE id=$1", id))
		}
		if err == nil {
			err = h.record(r.Context(), tx, r, id, item.Version, action, input.Reason, item)
		}
		if err == nil {
			err = tx.Commit(r.Context())
		}
		if err != nil {
			documentFailure(w, err)
			return
		}
		portalJSON(w, 200, item)
	}
}

func parseDocumentBundleIDs(value string) ([]string, error) {
	ids := strings.Split(value, ",")
	if len(ids) < 1 || len(ids) > 10 {
		return nil, errors.New("Pilih 1–10 dokumen untuk diunduh sekaligus")
	}
	seen := map[string]bool{}
	for _, id := range ids {
		if !documentIDPattern.MatchString(id) || seen[id] {
			return nil, errors.New("Pilihan dokumen tidak valid atau berulang")
		}
		seen[id] = true
	}
	return ids, nil
}

// PERFORMANCE: A bounded ZIP uses Store, one file descriptor per selected document, no full-file RAM or temporary archive.
func (h *DocumentHandler) PublicBundle(w http.ResponseWriter, r *http.Request) {
	if !h.publicAllowed(w, r) {
		return
	}
	ids, err := parseDocumentBundleIDs(r.URL.Query().Get("ids"))
	if err != nil {
		portalJSON(w, 422, map[string]string{"message": err.Error()})
		return
	}
	rows, err := h.pool.Query(r.Context(), "SELECT id::text,storage_name,original_name,file_bytes FROM documents WHERE id::text=ANY($1::text[]) AND is_published AND deleted_at IS NULL ORDER BY id", ids)
	if err != nil {
		documentFailure(w, err)
		return
	}
	type entry struct {
		name string
		file *os.File
		size int64
	}
	entries := []entry{}
	defer func() {
		for _, e := range entries {
			e.file.Close()
		}
	}()
	var total int64
	for rows.Next() {
		var id, storage, name string
		var size int64
		if err = rows.Scan(&id, &storage, &name, &size); err != nil {
			break
		}
		if !documentStoragePattern.MatchString(storage) {
			err = errors.New("invalid storage identifier")
			break
		}
		file, e := os.Open(filepath.Join(h.directory, storage))
		if e != nil {
			err = e
			break
		}
		info, e := file.Stat()
		if e != nil || !info.Mode().IsRegular() || info.Size() != size {
			file.Close()
			err = errors.New("document storage mismatch")
			break
		}
		entries = append(entries, entry{name: fmt.Sprintf("%02d-%s", len(entries)+1, cleanDocumentName(name)), file: file, size: size})
		total += size
	}
	if err == nil {
		err = rows.Err()
	}
	rows.Close()
	if err != nil {
		documentFailure(w, err)
		return
	}
	if len(entries) != len(ids) {
		portalJSON(w, 404, map[string]string{"message": "Sebagian dokumen tidak lagi ditayangkan. Muat ulang pilihan Anda."})
		return
	}
	if total > 100<<20 {
		portalJSON(w, 413, map[string]string{"message": "Jumlah ukuran pilihan melebihi 100 MiB. Kurangi dokumen yang dipilih."})
		return
	}
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(130 * time.Second))
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": "dokumen-porprov.zip"}))
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
	archive := zip.NewWriter(w)
	for _, e := range entries {
		entry, err := archive.CreateHeader(&zip.FileHeader{Name: e.name, Method: zip.Store})
		if err != nil {
			return
		}
		if _, err = io.CopyN(entry, e.file, e.size); err != nil {
			return
		}
	}
	_ = archive.Close()
}

// SECURITY: Storage names are server-generated and cannot escape the private directory.
var documentStoragePattern = regexp.MustCompile(`^[a-f0-9]{32}\.bin$`)
