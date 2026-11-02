package handler

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/nats-io/nats.go"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

const documentHardLimit int64 = 100 << 20

// SECURITY: Policy selects from implemented validators, never arbitrary executable MIME types.
var documentFormats = []documentFormat{
	{"application/pdf", ".pdf", "PDF"}, {"text/plain", ".txt", "Teks"},
	{"text/csv", ".csv", "CSV"}, {"image/jpeg", ".jpg,.jpeg", "JPEG"},
	{"image/png", ".png", "PNG"}, {"image/webp", ".webp", "WebP"},
}

type documentFormat struct {
	MIME       string `json:"mime"`
	Extensions string `json:"extensions"`
	Label      string `json:"label"`
}
type documentPolicy struct {
	Version  int64    `json:"version"`
	Allowed  []string `json:"allowed_mime_types"`
	MaxBytes int64    `json:"max_file_bytes"`
}
type documentItem struct {
	ID           string     `json:"id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Name         string     `json:"original_name"`
	MIME         string     `json:"mime_type"`
	Bytes        int64      `json:"file_bytes"`
	Checksum     string     `json:"checksum_sha256"`
	Version      int64      `json:"version"`
	Creator      string     `json:"created_username"`
	Created      time.Time  `json:"created_at"`
	Updated      time.Time  `json:"updated_at"`
	Deleted      *time.Time `json:"deleted_at"`
	DeleteReason *string    `json:"delete_reason"`
	Published    bool       `json:"is_published"`
	Pinned       bool       `json:"is_pinned"`
}
type DocumentHandler struct {
	pool      portalDatabase
	secret    string
	directory string
}

func NewDocumentHandler(pool portalDatabase, secret string) *DocumentHandler {
	return &DocumentHandler{pool: pool, secret: secret, directory: filepath.Join("uploads", "documents")}
}

// SECURITY: A distinct proof for each action prevents header spoofing and privilege substitution.
func (h *DocumentHandler) allow(w http.ResponseWriter, r *http.Request, permission string) bool {
	expected := portal.DocumentsProof(h.secret, permission)
	supplied := r.Header.Get("X-Document-Authorization")
	if expected == "" || subtle.ConstantTimeCompare([]byte(expected), []byte(supplied)) != 1 || strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" || strings.TrimSpace(r.Header.Get("X-Actor-Username")) == "" {
		portalJSON(w, 403, map[string]string{"message": "Anda tidak memiliki hak akses dokumen ini"})
		return false
	}
	return true
}
func documentFailure(w http.ResponseWriter, err error) {
	log.Printf("Document operation failed: %v", err)
	portalJSON(w, 503, map[string]string{"message": "Pengelolaan dokumen sementara tidak tersedia"})
}
func (h *DocumentHandler) Routes(r chi.Router) {
	r.Route("/api/v1/documents", func(r chi.Router) {
		r.Get("/public", h.PublicList)
		r.Get("/public/pinned", h.PublicPinned)
		r.Get("/public/bundle", h.PublicBundle)
		r.Get("/public/{id}/download", h.PublicDownload)
		r.Get("/", h.List)
		r.Post("/", h.Upload)
		r.Get("/policy", h.Policy)
		r.Put("/policy", h.UpdatePolicy)
		r.Get("/policy/history", h.History)
		r.Get("/{id}/history", h.History)
		r.Get("/{id}/download", h.Download)
		r.Put("/{id}", h.Change("UPDATE"))
		r.Delete("/{id}", h.Change("ARCHIVE"))
		r.Post("/{id}/restore", h.Change("RESTORE"))
		r.Post("/{id}/restore-revision", h.Change("RESTORE_REVISION"))
		r.Put("/{id}/publication", h.Publication(false))
		r.Put("/{id}/pin", h.Publication(true))
	})
}

type documentRow interface{ Scan(...any) error }

func scanDocument(row documentRow) (documentItem, error) {
	var d documentItem
	err := row.Scan(&d.ID, &d.Title, &d.Description, &d.Name, &d.MIME, &d.Bytes, &d.Checksum, &d.Version, &d.Creator, &d.Created, &d.Updated, &d.Deleted, &d.DeleteReason, &d.Published, &d.Pinned)
	return d, err
}

const documentColumns = "id::text,title,description,original_name,mime_type,file_bytes,checksum_sha256,version,created_username,created_at,updated_at,deleted_at,delete_reason,is_published,is_pinned"

func readDocumentPolicy(ctx context.Context, p interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}, lock bool) (documentPolicy, error) {
	var v documentPolicy
	sql := "SELECT version,allowed_mime_types,max_file_bytes FROM document_policy WHERE id=1"
	if lock {
		sql += " FOR SHARE"
	}
	err := p.QueryRow(ctx, sql).Scan(&v.Version, &v.Allowed, &v.MaxBytes)
	return v, err
}
func validDocumentPolicy(v documentPolicy) bool {
	if v.MaxBytes < 1<<20 || v.MaxBytes > documentHardLimit || len(v.Allowed) == 0 || len(v.Allowed) > len(documentFormats) {
		return false
	}
	seen := map[string]bool{}
	for _, m := range v.Allowed {
		if seen[m] || !slices.ContainsFunc(documentFormats, func(f documentFormat) bool { return f.MIME == m }) {
			return false
		}
		seen[m] = true
	}
	return true
}
func (h *DocumentHandler) Policy(w http.ResponseWriter, r *http.Request) {
	if !h.allow(w, r, "document.view") {
		return
	}
	v, err := readDocumentPolicy(r.Context(), h.pool, false)
	if err != nil {
		documentFailure(w, err)
		return
	}
	portalJSON(w, 200, map[string]any{"policy": v, "formats": documentFormats, "hard_max_bytes": documentHardLimit})
}
func documentDecode(w http.ResponseWriter, r *http.Request, v any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10))
	decoder.DisallowUnknownFields()
	if decoder.Decode(v) != nil || decoder.Decode(new(any)) != io.EOF {
		portalJSON(w, 400, map[string]string{"message": "Format permintaan tidak valid"})
		return false
	}
	return true
}
func documentText(v string, min, max int) bool {
	return utf8.ValidString(v) && len([]rune(strings.TrimSpace(v))) >= min && len([]rune(v)) <= max && !strings.ContainsFunc(v, func(r rune) bool { return unicode.IsControl(r) && r != '\n' && r != '\r' && r != '\t' })
}
func (h *DocumentHandler) record(ctx context.Context, tx pgx.Tx, r *http.Request, id any, version int64, action, reason string, snapshot any) error {
	raw, err := json.Marshal(snapshot)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, "INSERT INTO document_revisions(document_id,version,action,snapshot,actor_id,actor_username,reason) VALUES($1,$2,$3,$4,$5,$6,$7)", id, version, action, raw, r.Header.Get("X-Actor-ID"), r.Header.Get("X-Actor-Username"), reason)
	if err != nil {
		return err
	}
	eventID, err := randomMediaName("")
	if err != nil {
		return err
	}
	eventID = fmt.Sprintf("%s-%s-%s-%s-%s", eventID[:8], eventID[8:12], eventID[12:16], eventID[16:20], eventID[20:])
	entity := "Document"
	if id == nil {
		entity = "DocumentPolicy"
		id = "00000000-0000-0000-0000-000000000001"
	}
	payload, err := json.Marshal(map[string]any{"eventId": eventID, "eventVersion": "1.0", "eventType": "audit.document." + strings.ToLower(action), "service_name": "master-data-service", "entity_name": entity, "entity_id": id, "action": action, "actor": r.Header.Get("X-Actor-ID"), "actor_id": r.Header.Get("X-Actor-ID"), "actor_username": r.Header.Get("X-Actor-Username"), "requestId": r.Header.Get("X-Request-ID"), "payload": map[string]any{"version": version, "reason": reason}})
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, "INSERT INTO document_outbox(event_id,payload) VALUES($1,$2)", eventID, payload)
	return err
}
func (h *DocumentHandler) UpdatePolicy(w http.ResponseWriter, r *http.Request) {
	if !h.allow(w, r, "document.policy") {
		return
	}
	var input struct {
		Expected int64    `json:"expected_version"`
		Allowed  []string `json:"allowed_mime_types"`
		MaxBytes int64    `json:"max_file_bytes"`
		Reason   string   `json:"reason"`
	}
	if !documentDecode(w, r, &input) {
		return
	}
	v := documentPolicy{Version: input.Expected + 1, Allowed: input.Allowed, MaxBytes: input.MaxBytes}
	if !validDocumentPolicy(v) || !documentText(input.Reason, 5, 500) {
		portalJSON(w, 422, map[string]string{"message": "Pilih jenis yang didukung, batas 1–100 MiB, dan alasan 5–500 karakter"})
		return
	}
	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		documentFailure(w, err)
		return
	}
	defer tx.Rollback(r.Context())
	result, err := tx.Exec(r.Context(), "UPDATE document_policy SET version=version+1,allowed_mime_types=$1,max_file_bytes=$2,updated_at=now(),updated_by=$3 WHERE id=1 AND version=$4", v.Allowed, v.MaxBytes, r.Header.Get("X-Actor-ID"), input.Expected)
	if err != nil {
		documentFailure(w, err)
		return
	}
	if result.RowsAffected() != 1 {
		portalJSON(w, 409, map[string]string{"message": "Pengaturan berubah. Muat ulang sebelum menyimpan."})
		return
	}
	if err = h.record(r.Context(), tx, r, nil, v.Version, "POLICY_UPDATE", input.Reason, v); err == nil {
		err = tx.Commit(r.Context())
	}
	if err != nil {
		documentFailure(w, err)
		return
	}
	portalJSON(w, 200, v)
}
func documentPage(r *http.Request) (int, int, error) {
	page, limit := 1, 10
	var err error
	if s := r.URL.Query().Get("page"); s != "" {
		page, err = strconv.Atoi(s)
		if err != nil {
			return 0, 0, err
		}
	}
	if s := r.URL.Query().Get("per_page"); s != "" {
		limit, err = strconv.Atoi(s)
		if err != nil {
			return 0, 0, err
		}
	}
	if page < 1 || page > 1000000 || limit < 1 || limit > 100 {
		return 0, 0, errors.New("invalid page")
	}
	return page, limit, nil
}
func (h *DocumentHandler) List(w http.ResponseWriter, r *http.Request) {
	if !h.allow(w, r, "document.view") {
		return
	}
	page, limit, err := documentPage(r)
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	state := r.URL.Query().Get("state")
	sort := r.URL.Query().Get("sort")
	order := r.URL.Query().Get("order")
	if sort == "" {
		sort = "created_at"
	}
	if order == "" {
		order = "desc"
	}
	if err != nil || len([]rune(q)) > 80 || !slices.Contains([]string{"", "active", "archived"}, state) || !slices.Contains([]string{"created_at", "title", "file_bytes"}, sort) || !slices.Contains([]string{"asc", "desc"}, order) {
		portalJSON(w, 422, map[string]string{"message": "Pencarian atau halaman tidak valid"})
		return
	}
	where := " WHERE (deleted_at IS NOT NULL)=$1 AND ($2='' OR strpos(lower(title||' '||description||' '||original_name),lower($2))>0)"
	// PERFORMANCE: Count and bounded page share one SQL snapshot; data never leaves the database unbounded.
	var total int64
	var raw []byte
	sql := "WITH filtered AS MATERIALIZED (SELECT * FROM documents" + where + ") SELECT (SELECT count(*) FROM filtered),COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY " + sort + " " + order + ",id),'[]'::jsonb) FROM (SELECT " + documentColumns + " FROM filtered ORDER BY " + sort + " " + order + ",id LIMIT $3 OFFSET $4) paged"
	err = h.pool.QueryRow(r.Context(), sql, state == "archived", q, limit, (page-1)*limit).Scan(&total, &raw)
	items := []documentItem{}
	if err == nil {
		err = json.Unmarshal(raw, &items)
	}
	if err != nil {
		documentFailure(w, err)
		return
	}

	portalJSON(w, 200, map[string]any{"data": items, "total": total, "page": page, "per_page": limit, "total_pages": (total + int64(limit) - 1) / int64(limit)})
}

var documentIDPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func documentID(w http.ResponseWriter, r *http.Request) string {
	id := chi.URLParam(r, "id")
	if !documentIDPattern.MatchString(id) {
		portalJSON(w, 404, map[string]string{"message": "Dokumen tidak ditemukan"})
		return ""
	}
	return id
}
func validateDocumentFile(f *os.File, name, declared string, policy documentPolicy) (string, error) {
	header := make([]byte, 512)
	n, err := f.ReadAt(header, 0)
	if err != nil && err != io.EOF {
		return "", err
	}
	header = header[:n]
	ext := strings.ToLower(filepath.Ext(name))
	canonical := ""
	for _, format := range documentFormats {
		if slices.Contains(strings.Split(format.Extensions, ","), ext) {
			canonical = format.MIME
			break
		}
	}
	if !slices.Contains(policy.Allowed, canonical) {
		return "", errors.New("Jenis berkas tidak diizinkan oleh pengaturan saat ini")
	}
	media, _, err := mime.ParseMediaType(declared)
	if err != nil || media != canonical {
		return "", errors.New("MIME dan ekstensi berkas tidak cocok")
	}
	detected := http.DetectContentType(header)
	if canonical == "application/pdf" {
		stat, err := f.Stat()
		if err != nil {
			return "", err
		}
		tail := make([]byte, min(stat.Size(), 1024))
		_, err = f.ReadAt(tail, stat.Size()-int64(len(tail)))
		if err != nil || len(header) < 8 || !regexp.MustCompile(`^%PDF-[12]\.[0-9]`).Match(header) || !bytes.Contains(tail, []byte("%%EOF")) {
			return "", errors.New("Isi berkas bukan PDF yang valid")
		}
	} else if strings.HasPrefix(canonical, "text/") {
		if !strings.HasPrefix(detected, "text/plain") {
			return "", errors.New("Isi berkas bukan teks UTF-8")
		}
		if _, err = f.Seek(0, io.SeekStart); err != nil {
			return "", err
		}
		reader := bufio.NewReader(f)
		for {
			c, size, e := reader.ReadRune()
			if e == io.EOF {
				break
			}
			if e != nil || c == utf8.RuneError && size == 1 || unicode.IsControl(c) && c != '\n' && c != '\r' && c != '\t' {
				return "", errors.New("Berkas teks mengandung data biner atau encoding tidak didukung")
			}
		}
	} else if canonical != detected {
		return "", errors.New("Tanda pengenal isi berkas tidak sesuai MIME")
	}
	return canonical, nil
}
func cleanDocumentName(name string) string {
	name = filepath.Base(strings.ReplaceAll(name, "\\", "/"))
	name = strings.Map(func(r rune) rune {
		if unicode.IsControl(r) || r == '"' {
			return -1
		}
		return r
	}, name)
	if len([]rune(name)) > 180 || !utf8.ValidString(name) {
		return ""
	}
	return name
}
func (h *DocumentHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if !h.allow(w, r, "document.create") {
		return
	}
	// SECURITY: Extend only this authenticated bounded upload, keeping general service deadlines unchanged.
	_ = http.NewResponseController(w).SetReadDeadline(time.Now().Add(120 * time.Second))
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(130 * time.Second))
	policy, err := readDocumentPolicy(r.Context(), h.pool, false)
	if err != nil {
		documentFailure(w, err)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, policy.MaxBytes+(64<<10))
	reader, err := r.MultipartReader()
	if err != nil {
		portalJSON(w, 400, map[string]string{"message": "Gunakan formulir unggah berkas"})
		return
	}
	if err = os.MkdirAll(h.directory, 0750); err != nil {
		documentFailure(w, err)
		return
	}
	var temp *os.File
	var name, declared, title, description, path string
	var size int64
	sum := sha256.New()
	seen := map[string]bool{}
	// SECURITY: Stream to private storage with a fixed-size buffer; never parse 50 MB into RAM.
	defer func() {
		if temp != nil {
			temp.Close()
			os.Remove(temp.Name())
		}
	}()
	bad := func(status int, message string) { portalJSON(w, status, map[string]string{"message": message}) }
	for {
		part, e := reader.NextPart()
		if e == io.EOF {
			break
		}
		if e != nil {
			bad(413, "Unggahan terpotong atau melebihi batas ukuran")
			return
		}
		key := part.FormName()
		if seen[key] || !slices.Contains([]string{"file", "title", "description"}, key) {
			part.Close()
			bad(422, "Kolom unggahan tidak valid atau berulang")
			return
		}
		seen[key] = true
		if key == "file" {
			name = cleanDocumentName(part.FileName())
			declared = part.Header.Get("Content-Type")
			if name == "" {
				bad(422, "Nama berkas tidak valid")
				return
			}
			temp, err = os.CreateTemp(h.directory, ".pending-")
			if err != nil {
				documentFailure(w, err)
				return
			}
			size, err = io.Copy(io.MultiWriter(temp, sum), io.LimitReader(part, policy.MaxBytes+1))
			if err != nil || size > policy.MaxBytes {
				bad(413, "Ukuran berkas melebihi batas yang diizinkan")
				return
			}
			if size == 0 {
				bad(422, "Berkas kosong tidak diizinkan")
				return
			}
		} else {
			raw, e := io.ReadAll(io.LimitReader(part, 8193))
			if e != nil || len(raw) > 8192 {
				bad(422, "Keterangan terlalu panjang")
				return
			}
			if key == "title" {
				title = strings.TrimSpace(string(raw))
			} else {
				description = strings.TrimSpace(string(raw))
			}
		}
		part.Close()
	}
	if temp == nil || !documentText(title, 2, 200) || !documentText(description, 0, 2000) {
		bad(422, "Judul wajib 2–200 karakter dan keterangan maksimal 2.000 karakter")
		return
	}
	canonical, err := validateDocumentFile(temp, name, declared, policy)
	if err != nil {
		var storageError *os.PathError
		if errors.As(err, &storageError) {
			documentFailure(w, err)
			return
		}
		bad(422, err.Error())
		return
	}
	if err = temp.Sync(); err != nil {
		documentFailure(w, err)
		return
	}
	storage, err := randomMediaName(".bin")
	if err != nil {
		documentFailure(w, err)
		return
	}
	path = filepath.Join(h.directory, storage)
	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		documentFailure(w, err)
		return
	}
	defer tx.Rollback(r.Context())
	current, err := readDocumentPolicy(r.Context(), tx, true)
	if err != nil {
		documentFailure(w, err)
		return
	}
	if current.Version != policy.Version {
		bad(409, "Pengaturan unggah berubah. Periksa batas terbaru lalu unggah kembali.")
		return
	}
	if err = temp.Close(); err == nil {
		err = os.Rename(temp.Name(), path)
	}
	if err != nil {
		documentFailure(w, err)
		return
	}
	committed := false
	defer func() {
		if !committed {
			os.Remove(path)
		}
	}()
	item, err := scanDocument(tx.QueryRow(r.Context(), "INSERT INTO documents(title,description,original_name,storage_name,mime_type,file_bytes,checksum_sha256,created_by,created_username) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "+documentColumns, title, description, name, storage, canonical, size, fmt.Sprintf("%x", sum.Sum(nil)), r.Header.Get("X-Actor-ID"), r.Header.Get("X-Actor-Username")))
	if err == nil {
		err = h.record(r.Context(), tx, r, item.ID, item.Version, "UPLOAD", "Dokumen diunggah", item)
	}
	if err == nil {
		err = tx.Commit(r.Context())
	}
	if err != nil {
		documentFailure(w, err)
		return
	}
	committed = true
	portalJSON(w, 201, item)
}

type documentChange struct {
	Expected    int64  `json:"expected_version"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Reason      string `json:"reason"`
	Revision    int64  `json:"revision_id"`
}

func (h *DocumentHandler) Change(action string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		permission := "document.update"
		if action == "ARCHIVE" {
			permission = "document.archive"
		}
		if action == "RESTORE" {
			permission = "document.restore"
		}
		if !h.allow(w, r, permission) {
			return
		}
		id := documentID(w, r)
		if id == "" {
			return
		}
		var input documentChange
		if !documentDecode(w, r, &input) {
			return
		}
		if input.Expected < 1 || !documentText(input.Reason, 5, 500) {
			portalJSON(w, 422, map[string]string{"message": "Versi dan alasan 5–500 karakter wajib diisi"})
			return
		}
		tx, err := h.pool.Begin(r.Context())
		if err != nil {
			documentFailure(w, err)
			return
		}
		defer tx.Rollback(r.Context())
		// RELIABILITY: Publication, replacement pin and archive share a lock before taking row locks.
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
		if item.Version != input.Expected {
			portalJSON(w, 409, map[string]string{"message": "Dokumen berubah. Muat ulang sebelum menyimpan."})
			return
		}
		if action == "RESTORE" && item.Deleted == nil || action != "RESTORE" && item.Deleted != nil {
			portalJSON(w, 409, map[string]string{"message": "Status dokumen tidak sesuai tindakan"})
			return
		}
		if action == "RESTORE_REVISION" {
			var raw []byte
			err = tx.QueryRow(r.Context(), "SELECT snapshot FROM document_revisions WHERE id=$1 AND document_id=$2", input.Revision, id).Scan(&raw)
			var old documentItem
			if err != nil || json.Unmarshal(raw, &old) != nil {
				portalJSON(w, 404, map[string]string{"message": "Riwayat tidak ditemukan"})
				return
			}
			input.Title = old.Title
			input.Description = old.Description
		}
		switch action {
		case "ARCHIVE":
			_, err = tx.Exec(r.Context(), "UPDATE documents SET deleted_at=now(),deleted_by=$2,delete_reason=$3,is_published=false,is_pinned=false,version=version+1,updated_at=now() WHERE id=$1", id, r.Header.Get("X-Actor-ID"), input.Reason)
		case "RESTORE":
			_, err = tx.Exec(r.Context(), "UPDATE documents SET deleted_at=NULL,deleted_by=NULL,delete_reason=NULL,is_published=false,is_pinned=false,version=version+1,updated_at=now() WHERE id=$1", id)
		default:
			if !documentText(input.Title, 2, 200) || !documentText(input.Description, 0, 2000) {
				portalJSON(w, 422, map[string]string{"message": "Judul atau keterangan tidak valid"})
				return
			}
			_, err = tx.Exec(r.Context(), "UPDATE documents SET title=$2,description=$3,version=version+1,updated_at=now() WHERE id=$1", id, strings.TrimSpace(input.Title), strings.TrimSpace(input.Description))
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
func (h *DocumentHandler) Download(w http.ResponseWriter, r *http.Request) {
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(130 * time.Second))
	if !h.allow(w, r, "document.view") {
		return
	}
	h.serveDocument(w, r, false)
}

func (h *DocumentHandler) serveDocument(w http.ResponseWriter, r *http.Request, public bool) {
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(130 * time.Second))
	id := documentID(w, r)
	if id == "" {
		return
	}
	var storage, name, kind string
	var size int64
	err := h.pool.QueryRow(r.Context(), "SELECT storage_name,original_name,mime_type,file_bytes FROM documents WHERE id=$1 AND deleted_at IS NULL AND (NOT $2::boolean OR is_published)", id, public).Scan(&storage, &name, &kind, &size)
	if errors.Is(err, pgx.ErrNoRows) {
		portalJSON(w, 404, map[string]string{"message": "Dokumen tidak ditemukan"})
		return
	}
	if err != nil {
		documentFailure(w, err)
		return
	}
	if !regexp.MustCompile(`^[a-f0-9]{32}\.bin$`).MatchString(storage) {
		documentFailure(w, errors.New("invalid document storage identifier"))
		return
	}
	file, err := os.Open(filepath.Join(h.directory, storage))
	if err != nil {
		portalJSON(w, 404, map[string]string{"message": "Berkas dokumen belum tersedia"})
		return
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() != size {
		documentFailure(w, errors.New("document storage mismatch"))
		return
	}
	// SECURITY: Never inline untrusted documents or expose storage paths/public URLs.
	w.Header().Set("Content-Type", kind)
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": name}))
	w.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
	http.ServeContent(w, r, name, info.ModTime(), file)
}
func (h *DocumentHandler) History(w http.ResponseWriter, r *http.Request) {
	permission := "document.view"
	id := chi.URLParam(r, "id")
	if id == "" {
		permission = "document.policy"
	} else if documentID(w, r) == "" {
		return
	}
	if !h.allow(w, r, permission) {
		return
	}
	page, limit, err := documentPage(r)
	if err != nil {
		portalJSON(w, 422, map[string]string{"message": "Halaman tidak valid"})
		return
	}
	var entity any
	if id != "" {
		entity = id
	}
	rows, err := h.pool.Query(r.Context(), "SELECT id,version,action,snapshot,actor_username,reason,created_at FROM document_revisions WHERE document_id IS NOT DISTINCT FROM $1::uuid ORDER BY id DESC LIMIT $2 OFFSET $3", entity, limit, (page-1)*limit)
	if err != nil {
		documentFailure(w, err)
		return
	}
	defer rows.Close()
	data := []any{}
	for rows.Next() {
		var rid, version int64
		var action, actor, reason string
		var created time.Time
		var snapshot json.RawMessage
		if err = rows.Scan(&rid, &version, &action, &snapshot, &actor, &reason, &created); err != nil {
			documentFailure(w, err)
			return
		}
		data = append(data, map[string]any{"id": rid, "version": version, "action": action, "snapshot": snapshot, "actor_username": actor, "reason": reason, "created_at": created})
	}
	if err = rows.Err(); err != nil {
		documentFailure(w, err)
		return
	}
	portalJSON(w, 200, map[string]any{"data": data, "page": page, "per_page": limit, "has_more": len(data) == limit})
}

// RELIABILITY: Audit delivery is retried from durable state, never dropped on a broker outage.
func (h *DocumentHandler) RunOutbox(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if messaging.GetJetStream() == nil {
				continue
			}
			tx, err := h.pool.Begin(ctx)
			if err != nil {
				continue
			}
			var id int64
			var event string
			var payload []byte
			err = tx.QueryRow(ctx, "SELECT id,event_id,payload FROM document_outbox WHERE published_at IS NULL AND available_at<=now() ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED").Scan(&id, &event, &payload)
			if err != nil {
				tx.Rollback(ctx)
				continue
			}
			message := &nats.Msg{Subject: "audit.document.change", Data: payload, Header: nats.Header{}}
			message.Header.Set("Nats-Msg-Id", event)
			if _, err = messaging.GetJetStream().PublishMsg(message, nats.Context(ctx)); err == nil {
				_, err = tx.Exec(ctx, "UPDATE document_outbox SET published_at=now(),attempts=attempts+1 WHERE id=$1", id)
			} else {
				_, err = tx.Exec(ctx, "UPDATE document_outbox SET attempts=attempts+1,available_at=now()+least(attempts+1,60)*interval '5 seconds' WHERE id=$1", id)
			}
			if err == nil {
				err = tx.Commit(ctx)
			}
			tx.Rollback(ctx)
			if err != nil {
				log.Print("Document outbox delivery will retry")
			}
		}
	}
}
