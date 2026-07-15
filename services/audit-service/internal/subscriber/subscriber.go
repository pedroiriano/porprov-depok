package subscriber

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"regexp"
	"strings"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/audit-service/internal/db"
)

type AuditEvent struct {
	EventID      string          `json:"eventId"`
	EventVersion string          `json:"eventVersion"`
	EventType    string          `json:"eventType"`
	ServiceName  string          `json:"service_name"`
	EntityName   string          `json:"entity_name"`
	EntityID     string          `json:"entity_id"`
	Action       string          `json:"action"`
	Actor        string          `json:"actor"`
	RequestID    string          `json:"requestId"`
	IPAddress    string          `json:"ipAddress"`
	Payload      json.RawMessage `json:"payload"`
}

type Subscriber struct {
	queries *db.Queries
}

var auditUUIDPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

func deterministicEventID(data []byte) string {
	sum := sha256.Sum256(data)
	sum[6] = (sum[6] & 0x0f) | 0x50
	sum[8] = (sum[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", sum[0:4], sum[4:6], sum[6:8], sum[8:10], sum[10:16])
}

func normalizeAuditEvent(data []byte) (AuditEvent, error) {
	var event AuditEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return event, err
	}
	event.ServiceName = strings.TrimSpace(event.ServiceName)
	event.EntityName = strings.TrimSpace(event.EntityName)
	event.EntityID = strings.TrimSpace(event.EntityID)
	event.Action = strings.ToUpper(strings.TrimSpace(event.Action))
	event.Actor = strings.TrimSpace(event.Actor)
	event.RequestID = strings.TrimSpace(event.RequestID)
	if event.ServiceName == "" || event.EntityName == "" || event.Action == "" {
		return event, errors.New("service_name, entity_name, and action are required")
	}
	if !auditUUIDPattern.MatchString(event.EventID) {
		event.EventID = deterministicEventID(data)
	}
	if strings.TrimSpace(event.EventVersion) == "" {
		event.EventVersion = "legacy"
	}
	if strings.TrimSpace(event.EventType) == "" {
		event.EventType = event.Action
	}
	if net.ParseIP(strings.TrimSpace(event.IPAddress)) == nil {
		event.IPAddress = ""
	}
	if len(event.Payload) == 0 {
		event.Payload = json.RawMessage(`{}`)
	}
	return event, nil
}

func NewSubscriber(queries *db.Queries) *Subscriber {
	return &Subscriber{queries: queries}
}

func (s *Subscriber) Start() error {
	js := messaging.GetJetStream()
	_, err := js.QueueSubscribe("audit.>", "audit-workers", func(msg *nats.Msg) {
		event, normalizeErr := normalizeAuditEvent(msg.Data)
		if normalizeErr != nil {
			log.Printf("Menghentikan poison audit event pada %s: %v", msg.Subject, normalizeErr)
			_ = msg.Term()
			return
		}
		hash := sha256.Sum256(event.Payload)
		err := s.queries.InsertAuditEvent(context.Background(), db.InsertAuditEventParams{
			EventID: event.EventID, EventVersion: event.EventVersion, EventType: event.EventType,
			ServiceName: event.ServiceName, EntityName: event.EntityName, EntityID: event.EntityID,
			Action: event.Action, ActorID: event.Actor, RequestID: event.RequestID, IPAddress: event.IPAddress,
			Payload: event.Payload, PayloadHash: hex.EncodeToString(hash[:]),
		})
		if err != nil {
			log.Printf("Gagal menyimpan audit immutable: %v", err)
			_ = msg.Nak()
			return
		}
		_ = msg.Ack()
	}, nats.Durable("AUDIT_DURABLE_V2"), nats.ManualAck(), nats.AckWait(30*time.Second), nats.BindStream("AUDIT_EVENTS"))
	if err != nil {
		return err
	}
	log.Println("Audit Subscriber v2 mulai mendengarkan audit.>")
	return nil
}
