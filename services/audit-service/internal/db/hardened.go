package db

import (
	"context"
	"encoding/json"
	"time"
)

type InsertAuditEventParams struct {
	EventID          string
	EventVersion     string
	EventType        string
	ServiceName      string
	EntityName       string
	EntityID         string
	Action           string
	ActorID          string
	ActorUsername    string
	ActorDisplayName string
	RequestID        string
	IPAddress        string
	Payload          []byte
	PayloadHash      string
}

type AuditEventView struct {
	ID               string          `json:"id"`
	EventID          string          `json:"event_id"`
	EventVersion     string          `json:"event_version"`
	EventType        string          `json:"event_type"`
	ServiceName      string          `json:"service_name"`
	EntityName       string          `json:"entity_name"`
	EntityID         string          `json:"entity_id"`
	Action           string          `json:"action"`
	ActorID          string          `json:"actor_id"`
	ActorUsername    string          `json:"actor_username"`
	ActorDisplayName string          `json:"actor_display_name"`
	ActorKind        string          `json:"actor_kind"`
	RequestID        string          `json:"request_id"`
	IPAddress        string          `json:"ip_address"`
	Payload          json.RawMessage `json:"payload"`
	PayloadHash      string          `json:"payload_hash"`
	CreatedAt        time.Time       `json:"created_at"`
}

func (q *Queries) InsertAuditEvent(ctx context.Context, arg InsertAuditEventParams) error {
	_, err := q.db.Exec(ctx, `
		INSERT INTO audit_logs(event_id,event_version,event_type,service_name,entity_name,entity_id,action,actor_id,request_id,ip_address,payload,payload_hash,actor_username,actor_display_name,actor_kind)
		VALUES(COALESCE(NULLIF($1,'')::uuid,gen_random_uuid()),NULLIF($2,''),NULLIF($3,''),$4,$5,$6,$7,NULLIF($8,''),NULLIF($9,''),NULLIF($10,'')::inet,$11::jsonb,$12,NULLIF($13,''),NULLIF($14,''),CASE WHEN NULLIF($13,'') IS NOT NULL THEN 'user' WHEN NULLIF($8,'') IS NULL OR LOWER($8) IN ('system','legacy/system') THEN 'process' ELSE 'unknown' END)
		ON CONFLICT(event_id) DO NOTHING`, arg.EventID, arg.EventVersion, arg.EventType, arg.ServiceName, arg.EntityName, arg.EntityID, arg.Action, arg.ActorID, arg.RequestID, arg.IPAddress, arg.Payload, arg.PayloadHash, arg.ActorUsername, arg.ActorDisplayName)
	return err
}

func (q *Queries) ListAuditEvents(ctx context.Context, search, action, service string, limit, offset int) ([]AuditEventView, error) {
	rows, err := q.db.Query(ctx, `
		SELECT id::text,event_id::text,COALESCE(event_version,''),COALESCE(event_type,''),service_name,entity_name,entity_id,action,
			COALESCE(actor_id,''),COALESCE(actor_username,''),COALESCE(actor_display_name,''),COALESCE(actor_kind,'unknown'),COALESCE(request_id,''),COALESCE(ip_address::text,''),payload,COALESCE(payload_hash,''),created_at
		FROM audit_logs
		WHERE ($1='' OR actor_id ILIKE '%'||$1||'%' OR actor_username ILIKE '%'||$1||'%' OR actor_display_name ILIKE '%'||$1||'%' OR entity_id ILIKE '%'||$1||'%' OR entity_name ILIKE '%'||$1||'%')
		  AND ($2='' OR action=$2) AND ($3='' OR service_name=$3)
		ORDER BY created_at DESC LIMIT $4 OFFSET $5`, search, action, service, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]AuditEventView, 0)
	for rows.Next() {
		var item AuditEventView
		if err := rows.Scan(&item.ID, &item.EventID, &item.EventVersion, &item.EventType, &item.ServiceName, &item.EntityName, &item.EntityID, &item.Action, &item.ActorID, &item.ActorUsername, &item.ActorDisplayName, &item.ActorKind, &item.RequestID, &item.IPAddress, &item.Payload, &item.PayloadHash, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
