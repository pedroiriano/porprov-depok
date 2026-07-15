package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MedalHandler struct {
	pool       *pgxpool.Pool
	masterURL  string
	httpClient *http.Client
}

type medalSubmissionRequest struct {
	KontingenID string `json:"kontingen_id"`
	Gold        int    `json:"gold"`
	Silver      int    `json:"silver"`
	Bronze      int    `json:"bronze"`
	EvidenceURL string `json:"evidence_url"`
	Notes       string `json:"notes"`
}

type transitionRequest struct {
	Reason string `json:"reason"`
}

type medalSubmission struct {
	ID                string  `json:"id"`
	KontingenID       string  `json:"kontingen_id"`
	Gold              int     `json:"gold"`
	Silver            int     `json:"silver"`
	Bronze            int     `json:"bronze"`
	EvidenceURL       *string `json:"evidence_url,omitempty"`
	Notes             *string `json:"notes,omitempty"`
	Status            string  `json:"status"`
	SubmittedBy       string  `json:"submitted_by"`
	VerifiedBy        *string `json:"verified_by,omitempty"`
	RejectedBy        *string `json:"rejected_by,omitempty"`
	PublishedBy       *string `json:"published_by,omitempty"`
	VerificationNotes *string `json:"verification_notes,omitempty"`
	SubmittedAt       string  `json:"submitted_at"`
	UpdatedAt         string  `json:"updated_at"`
}

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

func validateSubmissionRequest(request *medalSubmissionRequest) error {
	request.KontingenID = strings.TrimSpace(request.KontingenID)
	request.EvidenceURL = strings.TrimSpace(request.EvidenceURL)
	request.Notes = strings.TrimSpace(request.Notes)
	if !uuidPattern.MatchString(request.KontingenID) || request.Gold < 0 || request.Silver < 0 || request.Bronze < 0 || request.Gold+request.Silver+request.Bronze == 0 {
		return errors.New("kontingen_id must be a valid UUID and at least one non-negative medal is required")
	}
	if len(request.EvidenceURL) > 2048 || len(request.Notes) > 4000 {
		return errors.New("evidence_url or notes is too long")
	}
	if request.EvidenceURL != "" {
		parsed, err := url.ParseRequestURI(request.EvidenceURL)
		validRemote := err == nil && (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Host != ""
		validMediaPath := err == nil && parsed.Scheme == "" && strings.HasPrefix(parsed.Path, "/uploads/")
		if !validRemote && !validMediaPath {
			return errors.New("evidence_url must be an HTTP(S) URL or Media Library /uploads path")
		}
	}
	return nil
}

func workflowTransitionAllowed(fromStatus, target string) bool {
	return (target == "VERIFIED" && fromStatus == "PENDING") ||
		(target == "REJECTED" && (fromStatus == "PENDING" || fromStatus == "VERIFIED")) ||
		(target == "OFFICIAL" && fromStatus == "VERIFIED")
}

type medalStanding struct {
	ID          string `json:"id"`
	KontingenID string `json:"kontingen_id"`
	Gold        int    `json:"gold"`
	Silver      int    `json:"silver"`
	Bronze      int    `json:"bronze"`
	UpdatedAt   string `json:"updated_at"`
}

func NewMedalHandler(pool *pgxpool.Pool, masterURL string) *MedalHandler {
	return &MedalHandler{pool: pool, masterURL: strings.TrimRight(masterURL, "/"), httpClient: &http.Client{Timeout: 5 * time.Second}}
}

func (h *MedalHandler) validateKontingen(ctx context.Context, kontingenID string) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, h.masterURL+"/kontingens/"+kontingenID, nil)
	if err != nil {
		return err
	}
	response, err := h.httpClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusOK {
		return nil
	}
	if response.StatusCode == http.StatusNotFound {
		return pgx.ErrNoRows
	}
	return errors.New("master data service is unavailable")
}

func actorFromRequest(r *http.Request) (string, error) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		return "", errors.New("authenticated actor is required")
	}
	return actor, nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func scanSubmission(row pgx.Row) (medalSubmission, error) {
	var item medalSubmission
	var submittedAt, updatedAt time.Time
	err := row.Scan(&item.ID, &item.KontingenID, &item.Gold, &item.Silver, &item.Bronze, &item.EvidenceURL, &item.Notes, &item.Status, &item.SubmittedBy, &item.VerifiedBy, &item.RejectedBy, &item.PublishedBy, &item.VerificationNotes, &submittedAt, &updatedAt)
	item.SubmittedAt = submittedAt.UTC().Format(time.RFC3339Nano)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339Nano)
	return item, err
}

func (h *MedalHandler) CreateSubmission(w http.ResponseWriter, r *http.Request) {
	actor, err := actorFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	var request medalSubmissionRequest
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	if err := validateSubmissionRequest(&request); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	if err := h.validateKontingen(r.Context(), request.KontingenID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "kontingen does not exist or is not active", http.StatusUnprocessableEntity)
			return
		}
		http.Error(w, "master data service is unavailable", http.StatusServiceUnavailable)
		return
	}
	tx, err := h.pool.BeginTx(r.Context(), pgx.TxOptions{})
	if err != nil {
		http.Error(w, "failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())
	item, err := scanSubmission(tx.QueryRow(r.Context(), `
		INSERT INTO medal_submissions(kontingen_id, gold, silver, bronze, evidence_url, notes, submitted_by)
		VALUES ($1::uuid,$2,$3,$4,NULLIF($5,''),NULLIF($6,''),$7)
		RETURNING id::text,kontingen_id::text,gold,silver,bronze,evidence_url,notes,status,submitted_by,verified_by,rejected_by,published_by,verification_notes,submitted_at,updated_at`, request.KontingenID, request.Gold, request.Silver, request.Bronze, request.EvidenceURL, request.Notes, actor))
	if err != nil {
		http.Error(w, "failed to create medal submission", http.StatusInternalServerError)
		return
	}
	_, err = tx.Exec(r.Context(), `INSERT INTO medal_submission_history(submission_id,from_status,to_status,actor_id,reason,request_id) VALUES($1::uuid,NULL,'PENDING',$2,'Submission created',$3)`, item.ID, actor, r.Header.Get("X-Request-ID"))
	if err == nil {
		err = insertAuditOutbox(r.Context(), tx, "MEDAL_SUBMISSION_CREATED", item.ID, actor, r.Header.Get("X-Request-ID"), r.Header.Get("X-Actor-IP"), item)
	}
	if err != nil || tx.Commit(r.Context()) != nil {
		http.Error(w, "failed to commit medal submission", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *MedalHandler) AddMedal(w http.ResponseWriter, r *http.Request) {
	// CHANGE: Endpoint kompatibilitas tidak lagi melewati workflow; request menjadi submission PENDING.
	w.Header().Set("Deprecation", "true")
	w.Header().Set("Sunset", "workflow-required")
	h.CreateSubmission(w, r)
}

func (h *MedalHandler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	status := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("status")))
	if status != "" && status != "PENDING" && status != "VERIFIED" && status != "REJECTED" && status != "OFFICIAL" {
		http.Error(w, "invalid submission status filter", http.StatusUnprocessableEntity)
		return
	}
	rows, err := h.pool.Query(r.Context(), `
		SELECT id::text,kontingen_id::text,gold,silver,bronze,evidence_url,notes,status,submitted_by,verified_by,rejected_by,published_by,verification_notes,submitted_at,updated_at
		FROM medal_submissions WHERE ($1='' OR status=$1) ORDER BY submitted_at DESC`, status)
	if err != nil {
		http.Error(w, "failed to read submissions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]medalSubmission, 0)
	for rows.Next() {
		item, scanErr := scanSubmission(rows)
		if scanErr != nil {
			http.Error(w, "failed to scan submissions", http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *MedalHandler) transition(w http.ResponseWriter, r *http.Request, target string) {
	actor, err := actorFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	var request transitionRequest
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if decodeErr := decoder.Decode(&request); decodeErr != nil && !errors.Is(decodeErr, io.EOF) {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	request.Reason = strings.TrimSpace(request.Reason)
	if !uuidPattern.MatchString(chi.URLParam(r, "submissionID")) {
		http.Error(w, "submission ID must be a valid UUID", http.StatusUnprocessableEntity)
		return
	}
	if len(request.Reason) > 4000 {
		http.Error(w, "workflow reason is too long", http.StatusUnprocessableEntity)
		return
	}
	if target == "REJECTED" && len(request.Reason) < 5 {
		http.Error(w, "rejection reason must contain at least 5 characters", http.StatusUnprocessableEntity)
		return
	}
	tx, err := h.pool.BeginTx(r.Context(), pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		http.Error(w, "failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())
	var fromStatus string
	var kontingenID string
	var gold, silver, bronze int
	err = tx.QueryRow(r.Context(), `SELECT status,kontingen_id::text,gold,silver,bronze FROM medal_submissions WHERE id=$1::uuid FOR UPDATE`, chi.URLParam(r, "submissionID")).Scan(&fromStatus, &kontingenID, &gold, &silver, &bronze)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "submission not found", http.StatusNotFound)
		return
	}
	allowed := workflowTransitionAllowed(fromStatus, target)
	if !allowed {
		http.Error(w, "invalid medal workflow transition", http.StatusConflict)
		return
	}
	_, err = tx.Exec(r.Context(), `UPDATE medal_submissions SET status=$2,
		verified_by=CASE WHEN $2='VERIFIED' THEN $3 ELSE verified_by END,
		rejected_by=CASE WHEN $2='REJECTED' THEN $3 ELSE rejected_by END,
		published_by=CASE WHEN $2='OFFICIAL' THEN $3 ELSE published_by END,
		verification_notes=CASE WHEN $2 IN ('VERIFIED','REJECTED') THEN NULLIF($4,'') ELSE verification_notes END,
		verified_at=CASE WHEN $2='VERIFIED' THEN NOW() ELSE verified_at END,
		rejected_at=CASE WHEN $2='REJECTED' THEN NOW() ELSE rejected_at END,
		published_at=CASE WHEN $2='OFFICIAL' THEN NOW() ELSE published_at END,updated_at=NOW() WHERE id=$1::uuid`, chi.URLParam(r, "submissionID"), target, actor, request.Reason)
	if err == nil && target == "OFFICIAL" {
		_, err = tx.Exec(r.Context(), `INSERT INTO medals(kontingen_id,gold,silver,bronze) VALUES($1::uuid,$2,$3,$4) ON CONFLICT(kontingen_id) DO UPDATE SET gold=medals.gold+EXCLUDED.gold,silver=medals.silver+EXCLUDED.silver,bronze=medals.bronze+EXCLUDED.bronze,updated_at=NOW()`, kontingenID, gold, silver, bronze)
	}
	if err == nil {
		_, err = tx.Exec(r.Context(), `INSERT INTO medal_submission_history(submission_id,from_status,to_status,actor_id,reason,request_id) VALUES($1::uuid,$2,$3,$4,NULLIF($5,''),$6)`, chi.URLParam(r, "submissionID"), fromStatus, target, actor, request.Reason, r.Header.Get("X-Request-ID"))
	}
	payload := map[string]any{"submissionId": chi.URLParam(r, "submissionID"), "kontingen_id": kontingenID, "gold": gold, "silver": silver, "bronze": bronze, "fromStatus": fromStatus, "status": target, "reason": request.Reason}
	if err == nil {
		err = insertAuditOutbox(r.Context(), tx, "MEDAL_SUBMISSION_"+target, chi.URLParam(r, "submissionID"), actor, r.Header.Get("X-Request-ID"), r.Header.Get("X-Actor-IP"), payload)
	}
	if err == nil && target == "OFFICIAL" {
		err = insertRealtimeOutbox(r.Context(), tx, actor, r.Header.Get("X-Request-ID"), payload)
	}
	if err != nil || tx.Commit(r.Context()) != nil {
		http.Error(w, "failed to persist workflow transition", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *MedalHandler) VerifySubmission(w http.ResponseWriter, r *http.Request) {
	h.transition(w, r, "VERIFIED")
}
func (h *MedalHandler) RejectSubmission(w http.ResponseWriter, r *http.Request) {
	h.transition(w, r, "REJECTED")
}
func (h *MedalHandler) PublishSubmission(w http.ResponseWriter, r *http.Request) {
	h.transition(w, r, "OFFICIAL")
}

func insertAuditOutbox(ctx context.Context, tx pgx.Tx, action, entityID, actor, requestID, actorIP string, payload any) error {
	event := map[string]any{"eventVersion": "1.0", "eventId": "", "eventType": action, "service_name": "medal-standing-service", "entity_name": "MedalSubmission", "entity_id": entityID, "action": action, "actor": actor, "requestId": requestID, "ipAddress": actorIP, "payload": payload, "timestamp": time.Now().UTC().Format(time.RFC3339Nano)}
	eventID := ""
	if err := tx.QueryRow(ctx, `SELECT gen_random_uuid()::text`).Scan(&eventID); err != nil {
		return err
	}
	event["eventId"] = eventID
	bytes, _ := json.Marshal(event)
	_, err := tx.Exec(ctx, `INSERT INTO outbox_events(event_id,subject,payload) VALUES($1::uuid,'audit.medals',$2::jsonb)`, eventID, bytes)
	return err
}

func insertRealtimeOutbox(ctx context.Context, tx pgx.Tx, actor, requestID string, payload any) error {
	eventID := ""
	if err := tx.QueryRow(ctx, `SELECT gen_random_uuid()::text`).Scan(&eventID); err != nil {
		return err
	}
	event := map[string]any{"eventVersion": "1.0", "eventId": eventID, "eventType": "MEDAL_STANDING_UPDATED", "sequence": time.Now().UnixNano(), "timestamp": time.Now().UTC().Format(time.RFC3339Nano), "actor": actor, "requestId": requestID, "data": payload}
	bytes, _ := json.Marshal(event)
	_, err := tx.Exec(ctx, `INSERT INTO outbox_events(event_id,subject,payload) VALUES($1::uuid,'realtime.medals',$2::jsonb)`, eventID, bytes)
	return err
}

func (h *MedalHandler) GetStandings(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(), `SELECT id::text,kontingen_id::text,gold,silver,bronze,updated_at FROM medals ORDER BY gold DESC,silver DESC,bronze DESC`)
	if err != nil {
		http.Error(w, "failed to get standings", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]medalStanding, 0)
	for rows.Next() {
		var item medalStanding
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.KontingenID, &item.Gold, &item.Silver, &item.Bronze, &updatedAt); err != nil {
			http.Error(w, "failed to scan standings", http.StatusInternalServerError)
			return
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339Nano)
		items = append(items, item)
	}
	writeJSON(w, http.StatusOK, items)
}

func StartOutboxWorker(ctx context.Context, pool *pgxpool.Pool, publish func(string, []byte) error) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rows, err := pool.Query(ctx, `
				UPDATE outbox_events SET next_attempt_at=NOW()+interval '30 seconds'
				WHERE id IN (SELECT id FROM outbox_events WHERE published_at IS NULL AND next_attempt_at<=NOW() ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED)
				RETURNING id::text,subject,payload::text`)
			if err != nil {
				continue
			}
			type pending struct{ id, subject, payload string }
			items := make([]pending, 0)
			for rows.Next() {
				var item pending
				if rows.Scan(&item.id, &item.subject, &item.payload) == nil {
					items = append(items, item)
				}
			}
			rows.Close()
			for _, item := range items {
				if err := publish(item.subject, []byte(item.payload)); err != nil {
					_, _ = pool.Exec(ctx, `UPDATE outbox_events SET attempts=attempts+1,last_error=$2,next_attempt_at=NOW() + LEAST(interval '5 minutes', interval '2 seconds' * power(2, LEAST(attempts, 7))) WHERE id=$1::uuid AND published_at IS NULL`, item.id, err.Error())
				} else {
					_, _ = pool.Exec(ctx, `UPDATE outbox_events SET published_at=NOW(),last_error=NULL WHERE id=$1::uuid AND published_at IS NULL`, item.id)
				}
			}
		}
	}
}
