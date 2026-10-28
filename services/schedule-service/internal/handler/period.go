package handler

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nats-io/nats.go"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
)

type periodDatabase interface {
	Begin(context.Context) (pgx.Tx, error)
	QueryRow(context.Context, string, ...any) pgx.Row
	Query(context.Context, string, ...any) (pgx.Rows, error)
}
type PeriodHandler struct {
	pool             periodDatabase
	masterURL, proof string
	client           *http.Client
}

func NewPeriodHandler(pool periodDatabase, masterURL, secret string) *PeriodHandler {
	return &PeriodHandler{pool: pool, masterURL: strings.TrimRight(masterURL, "/"), proof: portal.SchedulePeriodsProof(secret), client: &http.Client{Timeout: 4 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}}
}

type schedulePeriod struct {
	ID        string `json:"id"`
	CaborID   string `json:"cabor_id"`
	CaborName string `json:"cabor_name"`
	Label     string `json:"label"`
	StartsOn  string `json:"starts_on"`
	EndsOn    string `json:"ends_on"`
	Notes     string `json:"notes"`
	Published bool   `json:"is_published"`
	Version   int64  `json:"version"`
	Archived  bool   `json:"archived"`
}
type periodChange struct {
	CaborID         string `json:"cabor_id"`
	Label           string `json:"label"`
	StartsOn        string `json:"starts_on"`
	EndsOn          string `json:"ends_on"`
	Notes           string `json:"notes"`
	Published       bool   `json:"is_published"`
	ExpectedVersion int64  `json:"expected_version"`
	Reason          string `json:"reason"`
	RevisionID      string `json:"revision_id"`
}

const periodColumns = "id::text,cabor_id::text,cabor_name,label,starts_on::text,ends_on::text,notes,is_published,version,(deleted_at IS NOT NULL)"

func scanPeriod(row pgx.Row) (p schedulePeriod, err error) {
	err = row.Scan(&p.ID, &p.CaborID, &p.CaborName, &p.Label, &p.StartsOn, &p.EndsOn, &p.Notes, &p.Published, &p.Version, &p.Archived)
	return
}
func periodJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func periodError(w http.ResponseWriter, status int, message string) {
	periodJSON(w, status, map[string]string{"message": message})
}
func periodFailure(w http.ResponseWriter, err error) {
	var conflict *pgconn.PgError
	if errors.As(err, &conflict) && conflict.Code == "23505" {
		periodError(w, 409, "Rentang jadwal yang sama sudah tersedia. Periksa daftar terbaru.")
		return
	}
	log.Printf("Schedule period operation failed: %v", err)
	periodError(w, 503, "Rentang jadwal belum dapat diproses. Silakan coba lagi.")
}
func canonicalPeriodID(id string) bool {
	var value pgtype.UUID
	return len(id) == 36 && value.Scan(id) == nil && uuidString(value) == id && id != "00000000-0000-0000-0000-000000000000"
}
func (h *PeriodHandler) authorized(w http.ResponseWriter, r *http.Request) bool {
	supplied := r.Header.Get("X-Schedule-Authorization")
	if h.proof == "" || subtle.ConstantTimeCompare([]byte(supplied), []byte(h.proof)) != 1 || strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" || strings.TrimSpace(r.Header.Get("X-Actor-Username")) == "" {
		periodError(w, 403, "Anda tidak memiliki akses pengelolaan rentang jadwal.")
		return false
	}
	return true
}
func validatePeriod(v periodChange) error {
	if !canonicalPeriodID(v.CaborID) {
		return errors.New("Pilih cabang olahraga yang valid.")
	}
	start, e1 := time.Parse("2006-01-02", v.StartsOn)
	end, e2 := time.Parse("2006-01-02", v.EndsOn)
	if e1 != nil || e2 != nil || start.Year() < 2000 || end.Year() > 2100 {
		return errors.New("Tanggal wajib valid pada tahun 2000–2100.")
	}
	if end.Before(start) {
		return errors.New("Tanggal selesai tidak boleh sebelum tanggal mulai.")
	}
	if len([]rune(v.Label)) > 120 || len([]rune(v.Notes)) > 1000 {
		return errors.New("Nama khusus maksimal 120 karakter dan keterangan maksimal 1.000 karakter.")
	}
	return nil
}
func decodePeriodChange(w http.ResponseWriter, r *http.Request) (v periodChange, ok bool) {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&v); err != nil {
		periodError(w, 400, "Isian rentang jadwal tidak valid.")
		return
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF {
		periodError(w, 400, "Kirim satu objek rentang jadwal.")
		return
	}
	v.Label = strings.TrimSpace(v.Label)
	v.Notes = strings.TrimSpace(v.Notes)
	v.Reason = strings.TrimSpace(v.Reason)
	if v.ExpectedVersion < 0 || len([]rune(v.Reason)) < 5 || len([]rune(v.Reason)) > 500 {
		periodError(w, 422, "Alasan perubahan wajib 5–500 karakter dan versi harus valid.")
		return
	}
	return v, true
}
func (h *PeriodHandler) caborName(ctx context.Context, id string) (string, int) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, h.masterURL+"/cabors/"+id, nil)
	if err != nil {
		return "", 503
	}
	response, err := h.client.Do(request)
	if err != nil {
		return "", 503
	}
	defer response.Body.Close()
	if response.StatusCode == 404 {
		return "", 422
	}
	if response.StatusCode != 200 {
		return "", 503
	}
	var ref caborReference
	if json.NewDecoder(io.LimitReader(response.Body, 64<<10)).Decode(&ref) != nil || ref.ID != id || strings.TrimSpace(ref.Name) == "" {
		return "", 503
	}
	return ref.Name, 0
}

// SECURITY: One query contract, bounded pagination and SQL ordering from an allowlist only.
func (h *PeriodHandler) List(manage bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if manage && !h.authorized(w, r) {
			return
		}
		q := r.URL.Query()
		page, perPage := 1, 12
		if manage {
			perPage = 10
		}
		for key, target := range map[string]*int{"page": &page, "per_page": &perPage} {
			if value := q.Get(key); value != "" {
				n, err := strconv.Atoi(value)
				if err != nil || n < 1 || n > 100000 || key == "per_page" && n > 100 {
					periodError(w, 400, "Nomor halaman atau jumlah baris tidak valid.")
					return
				}
				*target = n
			}
		}
		search := strings.TrimSpace(q.Get("q"))
		if len([]rune(search)) > 80 {
			periodError(w, 400, "Pencarian maksimal 80 karakter.")
			return
		}
		cabor, date := q.Get("cabor_id"), q.Get("date")
		if cabor != "" && !canonicalPeriodID(cabor) {
			periodError(w, 400, "Cabang olahraga tidak valid.")
			return
		}
		if date != "" {
			if parsed, err := time.Parse("2006-01-02", date); err != nil || parsed.Year() < 2000 || parsed.Year() > 2100 {
				periodError(w, 400, "Tanggal pencarian tidak valid.")
				return
			}
		}
		order := map[string]string{"starts_on": "starts_on", "ends_on": "ends_on", "cabor_name": "lower(cabor_name)", "label": "lower(label)", "is_published": "is_published"}[q.Get("sort")]
		if order == "" {
			if q.Get("sort") != "" {
				periodError(w, 400, "Pengurutan tidak valid.")
				return
			}
			order = "starts_on"
		}
		direction := "ASC"
		if q.Get("direction") == "desc" {
			direction = "DESC"
		} else if q.Get("direction") != "" && q.Get("direction") != "asc" {
			periodError(w, 400, "Arah pengurutan tidak valid.")
			return
		}
		archived := manage && q.Get("archived") == "true"
		where := ` WHERE (deleted_at IS NOT NULL)=$1 AND ($2 OR is_published) AND ($3='' OR strpos(lower(cabor_name||' '||label||' '||notes),lower($3))>0) AND ($4='' OR cabor_id::text=$4) AND ($5='' OR (starts_on<=NULLIF($5,'')::date AND ends_on>=NULLIF($5,'')::date))`
		args := []any{archived, manage, search, cabor, date}
		var total int
		// RELIABILITY: Count and bounded page share one statement snapshot.
		columns := "id::text AS id,cabor_id::text AS cabor_id,cabor_name,label,starts_on::text AS starts_on,ends_on::text AS ends_on,notes,is_published,version,(deleted_at IS NOT NULL) AS archived"
		statement := "WITH filtered AS MATERIALIZED (SELECT " + columns + " FROM schedule_periods" + where + "), page_rows AS (SELECT * FROM filtered ORDER BY " + order + " " + direction + ",id LIMIT $6 OFFSET $7) SELECT (SELECT count(*) FROM filtered),(SELECT COALESCE(jsonb_agg(to_jsonb(page_rows) ORDER BY " + order + " " + direction + ",id),'[]'::jsonb) FROM page_rows)"
		var raw []byte
		err := h.pool.QueryRow(r.Context(), statement, append(args, perPage, (page-1)*perPage)...).Scan(&total, &raw)
		if err != nil {
			periodFailure(w, err)
			return
		}
		var records []schedulePeriod
		if err = json.Unmarshal(raw, &records); err != nil {
			periodFailure(w, err)
			return
		}
		items := []any{}
		for _, p := range records {
			if manage {
				items = append(items, p)
			} else {
				items = append(items, map[string]any{"id": p.ID, "cabor_id": p.CaborID, "cabor_name": p.CaborName, "label": p.Label, "starts_on": p.StartsOn, "ends_on": p.EndsOn, "notes": p.Notes})
			}
		}
		periodJSON(w, 200, map[string]any{"data": items, "total": total, "page": page, "per_page": perPage})
	}
}

// INFO: Every mutation persists state, immutable revision and durable audit event atomically.
func (h *PeriodHandler) Change(action string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.authorized(w, r) {
			return
		}
		change, ok := decodePeriodChange(w, r)
		if !ok {
			return
		}
		id := chi.URLParam(r, "id")
		if action != "CREATE" && !canonicalPeriodID(id) {
			periodError(w, 400, "Identitas rentang jadwal tidak valid.")
			return
		}
		if action == "CREATE" || action == "UPDATE" {
			if err := validatePeriod(change); err != nil {
				periodError(w, 422, err.Error())
				return
			}
		}
		if action == "CREATE" && change.ExpectedVersion != 0 {
			periodError(w, 409, "Rentang baru harus menggunakan versi awal.")
			return
		}
		tx, err := h.pool.Begin(r.Context())
		if err != nil {
			periodFailure(w, err)
			return
		}
		defer tx.Rollback(r.Context())
		var previous schedulePeriod
		if action != "CREATE" {
			previous, err = scanPeriod(tx.QueryRow(r.Context(), "SELECT "+periodColumns+" FROM schedule_periods WHERE id=$1 FOR UPDATE", id))
			if errors.Is(err, pgx.ErrNoRows) {
				periodError(w, 404, "Rentang jadwal tidak ditemukan.")
				return
			}
			if err != nil {
				periodFailure(w, err)
				return
			}
			if previous.Version != change.ExpectedVersion {
				periodError(w, 409, "Rentang jadwal berubah di sesi lain. Muat data terbaru sebelum menyimpan.")
				return
			}
			if action == "RESTORE" && !previous.Archived || action != "RESTORE" && previous.Archived {
				periodError(w, 409, "Status arsip berubah. Muat daftar terbaru.")
				return
			}
		}
		if action == "RESTORE_REVISION" {
			if !canonicalPeriodID(change.RevisionID) {
				periodError(w, 422, "Pilih riwayat yang valid.")
				return
			}
			var raw []byte
			err = tx.QueryRow(r.Context(), "SELECT snapshot FROM schedule_period_revisions WHERE id=$1 AND period_id=$2", change.RevisionID, id).Scan(&raw)
			if errors.Is(err, pgx.ErrNoRows) {
				periodError(w, 404, "Riwayat tidak ditemukan untuk rentang ini.")
				return
			}
			if err != nil {
				periodFailure(w, err)
				return
			}
			var saved schedulePeriod
			if json.Unmarshal(raw, &saved) != nil {
				periodError(w, 503, "Riwayat belum dapat dibaca.")
				return
			}
			change.CaborID = saved.CaborID
			change.Label = saved.Label
			change.StartsOn = saved.StartsOn
			change.EndsOn = saved.EndsOn
			change.Notes = saved.Notes
			change.Published = saved.Published
			if err = validatePeriod(change); err != nil {
				periodError(w, 422, err.Error())
				return
			}
		}
		if action == "RESTORE" {
			change.CaborID = previous.CaborID
		}
		caborName := ""
		if action != "ARCHIVE" {
			var status int
			caborName, status = h.caborName(r.Context(), change.CaborID)
			if status != 0 {
				periodError(w, status, "Cabang olahraga tidak aktif atau referensinya belum tersedia.")
				return
			}
		}
		var result schedulePeriod
		switch action {
		case "CREATE":
			result, err = scanPeriod(tx.QueryRow(r.Context(), "INSERT INTO schedule_periods(cabor_id,cabor_name,label,starts_on,ends_on,notes,is_published) VALUES($1,$2,$3,$4::date,$5::date,$6,$7) RETURNING "+periodColumns, change.CaborID, caborName, change.Label, change.StartsOn, change.EndsOn, change.Notes, change.Published))
		case "UPDATE", "RESTORE_REVISION":
			result, err = scanPeriod(tx.QueryRow(r.Context(), "UPDATE schedule_periods SET cabor_id=$2,cabor_name=$3,label=$4,starts_on=$5::date,ends_on=$6::date,notes=$7,is_published=$8,version=version+1,updated_at=now() WHERE id=$1 RETURNING "+periodColumns, id, change.CaborID, caborName, change.Label, change.StartsOn, change.EndsOn, change.Notes, change.Published))
		case "ARCHIVE":
			result, err = scanPeriod(tx.QueryRow(r.Context(), "UPDATE schedule_periods SET deleted_at=now(),deleted_by=$2,delete_reason=$3,version=version+1,updated_at=now() WHERE id=$1 RETURNING "+periodColumns, id, r.Header.Get("X-Actor-ID"), change.Reason))
		case "RESTORE":
			result, err = scanPeriod(tx.QueryRow(r.Context(), "UPDATE schedule_periods SET deleted_at=NULL,deleted_by=NULL,delete_reason=NULL,cabor_name=$2,is_published=false,version=version+1,updated_at=now() WHERE id=$1 RETURNING "+periodColumns, id, caborName))
		default:
			periodError(w, 400, "Aksi tidak dikenal.")
			return
		}
		if err != nil {
			periodFailure(w, err)
			return
		}
		snapshot, _ := json.Marshal(result)
		var eventID string
		err = tx.QueryRow(r.Context(), "INSERT INTO schedule_period_revisions(period_id,version,action,snapshot,actor_id,actor_username,reason) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id::text", result.ID, result.Version, action, snapshot, r.Header.Get("X-Actor-ID"), r.Header.Get("X-Actor-Username"), change.Reason).Scan(&eventID)
		if err != nil {
			periodFailure(w, err)
			return
		}
		payload, _ := json.Marshal(map[string]any{"eventId": eventID, "eventVersion": "1.0", "eventType": "audit.schedule.period", "service_name": "schedule-service", "entity_name": "SchedulePeriod", "entity_id": result.ID, "action": action, "actor": r.Header.Get("X-Actor-ID"), "actor_id": r.Header.Get("X-Actor-ID"), "actor_username": r.Header.Get("X-Actor-Username"), "requestId": r.Header.Get("X-Request-ID"), "payload": map[string]any{"period": result, "reason": change.Reason}})
		if _, err = tx.Exec(r.Context(), "INSERT INTO schedule_period_outbox(event_id,payload) VALUES($1,$2)", eventID, payload); err != nil {
			periodFailure(w, err)
			return
		}
		if err = tx.Commit(r.Context()); err != nil {
			periodFailure(w, err)
			return
		}
		periodJSON(w, 200, result)
	}
}

func (h *PeriodHandler) History(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(w, r) {
		return
	}
	id := chi.URLParam(r, "id")
	if !canonicalPeriodID(id) {
		periodError(w, 400, "Identitas rentang jadwal tidak valid.")
		return
	}
	page := 1
	if raw := r.URL.Query().Get("page"); raw != "" {
		var err error
		page, err = strconv.Atoi(raw)
		if err != nil || page < 1 || page > 100000 {
			periodError(w, 400, "Halaman riwayat tidak valid.")
			return
		}
	}
	var total int
	if err := h.pool.QueryRow(r.Context(), "SELECT count(*) FROM schedule_period_revisions WHERE period_id=$1", id).Scan(&total); err != nil {
		periodFailure(w, err)
		return
	}
	rows, err := h.pool.Query(r.Context(), "SELECT id::text,version,action,snapshot,actor_username,reason,created_at FROM schedule_period_revisions WHERE period_id=$1 ORDER BY version DESC LIMIT 20 OFFSET $2", id, (page-1)*20)
	if err != nil {
		periodFailure(w, err)
		return
	}
	defer rows.Close()
	items := []any{}
	for rows.Next() {
		var revisionID, action, actor, reason string
		var version int64
		var raw json.RawMessage
		var created time.Time
		if err = rows.Scan(&revisionID, &version, &action, &raw, &actor, &reason, &created); err != nil {
			periodFailure(w, err)
			return
		}
		items = append(items, map[string]any{"id": revisionID, "version": version, "action": action, "snapshot": raw, "actor_username": actor, "reason": reason, "created_at": created})
	}
	if err = rows.Err(); err != nil {
		periodFailure(w, err)
		return
	}
	periodJSON(w, 200, map[string]any{"data": items, "total": total, "page": page, "per_page": 20})
}

// RELIABILITY: Broker outages retain events for retry; no audit event is dropped on successful domain writes.
func (h *PeriodHandler) RunOutbox(ctx context.Context) {
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
			var eventID string
			var payload []byte
			err = tx.QueryRow(ctx, "SELECT id,event_id::text,payload FROM schedule_period_outbox WHERE published_at IS NULL AND available_at<=now() ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED").Scan(&id, &eventID, &payload)
			if err != nil {
				_ = tx.Rollback(ctx)
				continue
			}
			message := &nats.Msg{Subject: "audit.schedule.period", Data: payload, Header: nats.Header{}}
			message.Header.Set("Nats-Msg-Id", eventID)
			_, err = messaging.GetJetStream().PublishMsg(message, nats.Context(ctx))
			if err == nil {
				_, err = tx.Exec(ctx, "UPDATE schedule_period_outbox SET published_at=now(),attempts=attempts+1 WHERE id=$1", id)
			} else {
				_, err = tx.Exec(ctx, "UPDATE schedule_period_outbox SET attempts=attempts+1,available_at=now()+least(attempts+1,60)*interval '5 seconds' WHERE id=$1", id)
			}
			if err == nil {
				err = tx.Commit(ctx)
			} else {
				_ = tx.Rollback(ctx)
			}
			if err != nil {
				log.Printf("Schedule period outbox transaction failed: %v", err)
			}
		}
	}
}
