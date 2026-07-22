package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type scoreRequest struct {
	MatchID          string `json:"matchId"`
	ScoreA           int    `json:"scoreA"`
	ScoreB           int    `json:"scoreB"`
	Status           string `json:"status"`
	CorrectionReason string `json:"correctionReason,omitempty"`
	ExpectedRevision *int64 `json:"expectedRevision,omitempty"`
}

type scoreRecord struct {
	MatchID          string  `json:"matchId"`
	RevisionID       string  `json:"revisionId"`
	RevisionNumber   int64   `json:"revisionNumber"`
	ScoreA           int     `json:"scoreA"`
	ScoreB           int     `json:"scoreB"`
	Status           string  `json:"status"`
	CorrectionOf     *string `json:"correctionOf,omitempty"`
	CorrectionReason *string `json:"correctionReason,omitempty"`
	Actor            string  `json:"actor"`
	Timestamp        string  `json:"timestamp"`
}

type liveScoreEvent struct {
	EventVersion     string  `json:"eventVersion"`
	EventID          string  `json:"eventId"`
	EventType        string  `json:"eventType"`
	Sequence         int64   `json:"sequence"`
	Timestamp        string  `json:"timestamp"`
	Actor            string  `json:"actor"`
	RequestID        string  `json:"requestId,omitempty"`
	MatchID          string  `json:"matchId"`
	RevisionID       string  `json:"revisionId"`
	ScoreA           int     `json:"scoreA"`
	ScoreB           int     `json:"scoreB"`
	Status           string  `json:"status"`
	IsCorrection     bool    `json:"isCorrection"`
	CorrectionOf     *string `json:"correctionOf,omitempty"`
	CorrectionReason *string `json:"correctionReason,omitempty"`
}

type server struct {
	pool        *pgxpool.Pool
	scheduleURL string
	httpClient  *http.Client
}

var (
	uuidPattern         = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)
	errRevisionConflict = errors.New("score revision has changed; reload before submitting")
	errMatchNotActive   = errors.New("match does not exist or is not active")
	errParticipantsOpen = errors.New("match participants A/B are incomplete")
	errScheduleDown     = errors.New("schedule service is unavailable")
)

func isRevisionConflict(err error) bool {
	var databaseError *pgconn.PgError
	return errors.As(err, &databaseError) && (databaseError.Code == "23505" || databaseError.Code == "40001")
}

func (s *server) validateActiveMatch(ctx context.Context, matchID string) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, s.scheduleURL+"/matches/"+matchID, nil)
	if err != nil {
		return fmt.Errorf("%w: %v", errScheduleDown, err)
	}
	response, err := s.httpClient.Do(request)
	if err != nil {
		return fmt.Errorf("%w: %v", errScheduleDown, err)
	}
	response.Body.Close()
	if response.StatusCode == http.StatusNotFound {
		return errMatchNotActive
	}
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("%w: HTTP %d", errScheduleDown, response.StatusCode)
	}

	// INFO: Scoring A/B hanya boleh dimulai ketika Schedule memiliki dua sisi
	// terurut. Validasi server ini melengkapi guard UI Admin.
	participantRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, s.scheduleURL+"/matches/"+matchID+"/participants", nil)
	if err != nil {
		return fmt.Errorf("%w: %v", errScheduleDown, err)
	}
	participantResponse, err := s.httpClient.Do(participantRequest)
	if err != nil {
		return fmt.Errorf("%w: %v", errScheduleDown, err)
	}
	defer participantResponse.Body.Close()
	if participantResponse.StatusCode != http.StatusOK {
		return fmt.Errorf("%w: participants HTTP %d", errScheduleDown, participantResponse.StatusCode)
	}
	var participants []struct {
		ParticipantType string `json:"participant_type"`
		Slot            int16  `json:"slot"`
	}
	if err := json.NewDecoder(participantResponse.Body).Decode(&participants); err != nil {
		return fmt.Errorf("%w: invalid participant response", errScheduleDown)
	}
	if len(participants) != 2 {
		return errParticipantsOpen
	}
	validSlots := map[int16]bool{1: false, 2: false}
	for _, participant := range participants {
		if _, validType := map[string]struct{}{"individual": {}, "team": {}, "contingent": {}}[participant.ParticipantType]; !validType {
			return errParticipantsOpen
		}
		if _, validSlot := validSlots[participant.Slot]; !validSlot || validSlots[participant.Slot] {
			return errParticipantsOpen
		}
		validSlots[participant.Slot] = true
	}
	return nil
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func trustedActor(r *http.Request) (string, error) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		return "", errors.New("authenticated actor is required")
	}
	return actor, nil
}

func validateScoreRequest(payload *scoreRequest, correction bool) error {
	payload.MatchID = strings.TrimSpace(payload.MatchID)
	payload.Status = strings.TrimSpace(payload.Status)
	payload.CorrectionReason = strings.TrimSpace(payload.CorrectionReason)
	if !uuidPattern.MatchString(payload.MatchID) || payload.Status == "" {
		return errors.New("matchId must be a valid UUID and status is required")
	}
	if len(payload.Status) > 50 || len(payload.CorrectionReason) > 1000 {
		return errors.New("status or correctionReason is too long")
	}
	if payload.ExpectedRevision != nil && *payload.ExpectedRevision < 0 {
		return errors.New("expectedRevision cannot be negative")
	}
	if payload.ScoreA < 0 || payload.ScoreB < 0 {
		return errors.New("score cannot be negative")
	}
	if correction && len(payload.CorrectionReason) < 5 {
		return errors.New("correctionReason must contain at least 5 characters")
	}
	return nil
}

func (s *server) persistScore(ctx context.Context, payload scoreRequest, actor, requestID, actorIP string, correction bool) (liveScoreEvent, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		return liveScoreEvent{}, err
	}
	defer tx.Rollback(ctx)

	var currentRevisionID string
	var currentRevision int64
	err = tx.QueryRow(ctx, `SELECT revision_id::text, revision_number FROM livescore_current WHERE match_id = $1::uuid FOR UPDATE`, payload.MatchID).Scan(&currentRevisionID, &currentRevision)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return liveScoreEvent{}, err
	}
	if correction && errors.Is(err, pgx.ErrNoRows) {
		return liveScoreEvent{}, errors.New("score cannot be corrected before the first update")
	}
	if payload.ExpectedRevision != nil && *payload.ExpectedRevision != currentRevision {
		return liveScoreEvent{}, errRevisionConflict
	}

	revisionNumber := currentRevision + 1
	var revisionID string
	var createdAt time.Time
	var correctionOf any
	var correctionReason any
	if correction {
		correctionOf = currentRevisionID
		correctionReason = payload.CorrectionReason
	}
	err = tx.QueryRow(ctx, `
		INSERT INTO livescore_revisions(match_id, revision_number, score_a, score_b, status, correction_of, correction_reason, actor_id, request_id)
		VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, $7, $8, $9)
		RETURNING id::text, created_at`, payload.MatchID, revisionNumber, payload.ScoreA, payload.ScoreB, payload.Status, correctionOf, correctionReason, actor, requestID).Scan(&revisionID, &createdAt)
	if err != nil {
		if isRevisionConflict(err) {
			return liveScoreEvent{}, errRevisionConflict
		}
		return liveScoreEvent{}, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO livescore_current(match_id, revision_id, revision_number, score_a, score_b, status, actor_id, updated_at)
		VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (match_id) DO UPDATE SET revision_id=EXCLUDED.revision_id, revision_number=EXCLUDED.revision_number,
			score_a=EXCLUDED.score_a, score_b=EXCLUDED.score_b, status=EXCLUDED.status, actor_id=EXCLUDED.actor_id, updated_at=EXCLUDED.updated_at`,
		payload.MatchID, revisionID, revisionNumber, payload.ScoreA, payload.ScoreB, payload.Status, actor, createdAt)
	if err != nil {
		return liveScoreEvent{}, err
	}

	eventID := ""
	if err := tx.QueryRow(ctx, `SELECT gen_random_uuid()::text`).Scan(&eventID); err != nil {
		return liveScoreEvent{}, err
	}
	var correctionOfPointer *string
	var correctionReasonPointer *string
	if correction {
		correctionOfPointer = &currentRevisionID
		correctionReasonPointer = &payload.CorrectionReason
	}
	eventType := "LIVESCORE_UPDATED"
	if correction {
		eventType = "LIVESCORE_CORRECTED"
	}
	event := liveScoreEvent{
		EventVersion: "1.0", EventID: eventID, EventType: eventType, Sequence: revisionNumber,
		Timestamp: createdAt.UTC().Format(time.RFC3339Nano), Actor: actor, RequestID: requestID,
		MatchID: payload.MatchID, RevisionID: revisionID, ScoreA: payload.ScoreA, ScoreB: payload.ScoreB,
		Status: payload.Status, IsCorrection: correction, CorrectionOf: correctionOfPointer, CorrectionReason: correctionReasonPointer,
	}
	eventJSON, _ := json.Marshal(event)
	auditPayload := map[string]any{
		"eventVersion": "1.0", "eventId": eventID, "service_name": "livescore-service", "entity_name": "LiveScore",
		"entity_id": payload.MatchID, "action": eventType, "actor": actor, "requestId": requestID, "ipAddress": actorIP, "payload": event,
	}
	auditJSON, _ := json.Marshal(auditPayload)
	_, err = tx.Exec(ctx, `INSERT INTO outbox_events(event_id, subject, payload) VALUES ($1::uuid, $2, $3::jsonb), (gen_random_uuid(), $4, $5::jsonb)`,
		eventID, "livescore.update."+payload.MatchID, eventJSON, "audit.livescore", auditJSON)
	if err != nil {
		return liveScoreEvent{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		if isRevisionConflict(err) {
			return liveScoreEvent{}, errRevisionConflict
		}
		return liveScoreEvent{}, err
	}
	return event, nil
}

func (s *server) updateScore(w http.ResponseWriter, r *http.Request) {
	actor, err := trustedActor(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	var payload scoreRequest
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&payload); err != nil {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	if err := validateScoreRequest(&payload, false); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	if err := s.validateActiveMatch(r.Context(), payload.MatchID); err != nil {
		if errors.Is(err, errMatchNotActive) || errors.Is(err, errParticipantsOpen) {
			http.Error(w, err.Error(), http.StatusUnprocessableEntity)
			return
		}
		http.Error(w, errScheduleDown.Error(), http.StatusServiceUnavailable)
		return
	}
	event, err := s.persistScore(r.Context(), payload, actor, r.Header.Get("X-Request-ID"), r.Header.Get("X-Actor-IP"), false)
	if err != nil {
		if errors.Is(err, errRevisionConflict) {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "failed to persist score", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func (s *server) correctScore(w http.ResponseWriter, r *http.Request) {
	actor, err := trustedActor(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	var payload scoreRequest
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&payload); err != nil {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	payload.MatchID = chi.URLParam(r, "matchID")
	if err := validateScoreRequest(&payload, true); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	if err := s.validateActiveMatch(r.Context(), payload.MatchID); err != nil {
		if errors.Is(err, errMatchNotActive) || errors.Is(err, errParticipantsOpen) {
			http.Error(w, err.Error(), http.StatusUnprocessableEntity)
			return
		}
		http.Error(w, errScheduleDown.Error(), http.StatusServiceUnavailable)
		return
	}
	event, err := s.persistScore(r.Context(), payload, actor, r.Header.Get("X-Request-ID"), r.Header.Get("X-Actor-IP"), true)
	if err != nil {
		if strings.Contains(err.Error(), "before the first") || errors.Is(err, errRevisionConflict) {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "failed to persist correction", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func scanScore(row pgx.Row) (scoreRecord, error) {
	var item scoreRecord
	var timestamp time.Time
	err := row.Scan(&item.MatchID, &item.RevisionID, &item.RevisionNumber, &item.ScoreA, &item.ScoreB, &item.Status, &item.CorrectionOf, &item.CorrectionReason, &item.Actor, &timestamp)
	item.Timestamp = timestamp.UTC().Format(time.RFC3339Nano)
	return item, err
}

func (s *server) currentScore(w http.ResponseWriter, r *http.Request) {
	item, err := scanScore(s.pool.QueryRow(r.Context(), `
		SELECT c.match_id::text, r.id::text, r.revision_number, r.score_a, r.score_b, r.status,
			r.correction_of::text, r.correction_reason, r.actor_id, r.created_at
		FROM livescore_current c JOIN livescore_revisions r ON r.id=c.revision_id WHERE c.match_id=$1::uuid`, chi.URLParam(r, "matchID")))
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "score not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "failed to read score", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *server) scoreHistory(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `SELECT match_id::text, id::text, revision_number, score_a, score_b, status, correction_of::text, correction_reason, actor_id, created_at FROM livescore_revisions WHERE match_id=$1::uuid ORDER BY revision_number DESC`, chi.URLParam(r, "matchID"))
	if err != nil {
		http.Error(w, "failed to read score history", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]scoreRecord, 0)
	for rows.Next() {
		item, scanErr := scanScore(rows)
		if scanErr != nil {
			http.Error(w, "failed to scan score history", http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read score history", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *server) listCurrentScores(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `SELECT c.match_id::text, r.id::text, r.revision_number, r.score_a, r.score_b, r.status, r.correction_of::text, r.correction_reason, r.actor_id, r.created_at FROM livescore_current c JOIN livescore_revisions r ON r.id=c.revision_id ORDER BY c.updated_at DESC`)
	if err != nil {
		http.Error(w, "failed to read scores", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]scoreRecord, 0)
	for rows.Next() {
		item, scanErr := scanScore(rows)
		if scanErr != nil {
			http.Error(w, "failed to scan scores", http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read scores", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *server) listPublicScores(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `SELECT match_id::text,revision_number,score_a,score_b,status,updated_at FROM livescore_current ORDER BY updated_at DESC`)
	if err != nil {
		http.Error(w, "failed to read public scores", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]map[string]any, 0)
	for rows.Next() {
		var matchID, status string
		var sequence int64
		var scoreA, scoreB int
		var timestamp time.Time
		if err := rows.Scan(&matchID, &sequence, &scoreA, &scoreB, &status, &timestamp); err != nil {
			http.Error(w, "failed to scan public scores", http.StatusInternalServerError)
			return
		}
		items = append(items, map[string]any{"matchId": matchID, "sequence": sequence, "scoreA": scoreA, "scoreB": scoreB, "status": status, "timestamp": timestamp.UTC().Format(time.RFC3339Nano)})
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "failed to read public scores", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func startOutboxWorker(ctx context.Context, pool *pgxpool.Pool, js jetstream.JetStream) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			publishOutboxBatch(ctx, pool, js)
		}
	}
}

func publishOutboxBatch(ctx context.Context, pool *pgxpool.Pool, js jetstream.JetStream) {
	rows, err := pool.Query(ctx, `
		UPDATE outbox_events SET next_attempt_at=NOW()+interval '30 seconds'
		WHERE id IN (SELECT id FROM outbox_events WHERE published_at IS NULL AND next_attempt_at<=NOW() ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED)
		RETURNING id::text,subject,payload::text`)
	if err != nil {
		log.Printf("outbox query failed: %v", err)
		return
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
		_, publishErr := js.Publish(ctx, item.subject, []byte(item.payload))
		if publishErr != nil {
			_, _ = pool.Exec(ctx, `UPDATE outbox_events SET attempts=attempts+1, last_error=$2, next_attempt_at=NOW() + LEAST(interval '5 minutes', interval '2 seconds' * power(2, LEAST(attempts, 7))) WHERE id=$1::uuid AND published_at IS NULL`, item.id, publishErr.Error())
			continue
		}
		_, _ = pool.Exec(ctx, `UPDATE outbox_events SET published_at=NOW(), last_error=NULL WHERE id=$1::uuid AND published_at IS NULL`, item.id)
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	dbURL := envOrDefault("DATABASE_URL", "postgres://porprov_admin:porprov_secret@localhost:15432/livescore_db?sslmode=disable")
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to configure PostgreSQL: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	nc, err := nats.Connect(envOrDefault("NATS_URL", "nats://localhost:14222"))
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer nc.Close()
	js, err := jetstream.New(nc)
	if err != nil {
		log.Fatalf("Failed to create JetStream context: %v", err)
	}
	for _, config := range []jetstream.StreamConfig{{Name: "LIVESCORE", Subjects: []string{"livescore.update.>"}}, {Name: "AUDIT_EVENTS", Subjects: []string{"audit.>"}}} {
		if _, err := js.CreateOrUpdateStream(ctx, config); err != nil {
			log.Fatalf("Failed to ensure stream %s: %v", config.Name, err)
		}
	}
	go startOutboxWorker(ctx, pool, js)

	service := &server{
		pool:        pool,
		scheduleURL: strings.TrimRight(envOrDefault("SCHEDULE_SERVICE_URL", "http://localhost:28082/api/v1"), "/"),
		httpClient:  &http.Client{Timeout: 5 * time.Second},
	}
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.Logger, middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{AllowedOrigins: []string{"http://localhost:5173", "http://localhost:5174"}, AllowedMethods: []string{"GET", "POST", "OPTIONS"}, AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-Actor-ID", "X-Request-ID"}}))
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "livescore-service is healthy"})
	}
	r.Get("/health", healthHandler)
	r.Head("/health", healthHandler)
	r.Route("/api/v1/livescore", func(r chi.Router) {
		r.Get("/", service.listCurrentScores)
		r.Get("/public", service.listPublicScores)
		r.Post("/update", service.updateScore)
		r.Get("/matches/{matchID}", service.currentScore)
		r.Get("/matches/{matchID}/history", service.scoreHistory)
		r.Post("/matches/{matchID}/correct", service.correctScore)
	})
	port := envOrDefault("PORT", "28083")
	log.Printf("Livescore Service running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
