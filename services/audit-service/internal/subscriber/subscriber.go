package subscriber

import (
	"context"
	"encoding/json"
	"log"

	"github.com/nats-io/nats.go"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/audit-service/internal/db"
)

type AuditEvent struct {
	ServiceName string      `json:"service_name"`
	EntityName  string      `json:"entity_name"`
	EntityID    string      `json:"entity_id"`
	Action      string      `json:"action"`
	Payload     interface{} `json:"payload"`
}

type Subscriber struct {
	queries *db.Queries
}

func NewSubscriber(queries *db.Queries) *Subscriber {
	return &Subscriber{queries: queries}
}

func (s *Subscriber) Start() error {
	js := messaging.GetJetStream()

	// Create durable consumer for audit events
	_, err := js.QueueSubscribe("audit.>", "audit-workers", func(msg *nats.Msg) {
		var event AuditEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			log.Printf("Gagal mem-parsing pesan audit: %v\n", err)
			msg.Nak() // Negative acknowledge
			return
		}

		payloadBytes, _ := json.Marshal(event.Payload)

		_, err := s.queries.InsertAuditLog(context.Background(), db.InsertAuditLogParams{
			ServiceName: event.ServiceName,
			EntityName:  event.EntityName,
			EntityID:    event.EntityID,
			Action:      event.Action,
			Payload:     payloadBytes,
		})

		if err != nil {
			log.Printf("Gagal menyimpan log audit ke DB: %v\n", err)
			msg.Nak()
			return
		}

		log.Printf("[AUDIT LOG] %s - %s %s ID: %s\n", event.ServiceName, event.Action, event.EntityName, event.EntityID)
		msg.Ack()
	}, nats.Durable("AUDIT_DURABLE"), nats.ManualAck())

	if err != nil {
		return err
	}

	log.Println("Audit Subscriber mulai mendengarkan event audit.>")
	return nil
}
