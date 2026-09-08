package subscriber

import "testing"

func TestNormalizeLegacyEventCreatesStableID(t *testing.T) {
	raw := []byte(`{"service_name":"master-data-service","entity_name":"Cabor","entity_id":"1","action":"create","payload":{"name":"Basket"}}`)
	first, err := normalizeAuditEvent(raw)
	if err != nil {
		t.Fatal(err)
	}
	second, err := normalizeAuditEvent(raw)
	if err != nil {
		t.Fatal(err)
	}
	if first.EventID == "" || first.EventID != second.EventID {
		t.Fatal("expected deterministic event ID for legacy event")
	}
	if first.Action != "CREATE" || first.EventVersion != "legacy" {
		t.Fatalf("unexpected normalized metadata: %#v", first)
	}
}

func TestNormalizeAuditEventDropsInvalidIPAddress(t *testing.T) {
	event, err := normalizeAuditEvent([]byte(`{"service_name":"svc","entity_name":"Entity","action":"UPDATE","ipAddress":"spoofed"}`))
	if err != nil {
		t.Fatal(err)
	}
	if event.IPAddress != "" {
		t.Fatal("expected invalid IP address to be removed")
	}
}

func TestNormalizeAuditEventRejectsMissingMetadata(t *testing.T) {
	if _, err := normalizeAuditEvent([]byte(`{"payload":{}}`)); err == nil {
		t.Fatal("expected missing audit metadata to be rejected")
	}
}

func TestNormalizeAuditEventPreservesActorSnapshot(t *testing.T) {
	event, err := normalizeAuditEvent([]byte(`{"service_name":"user-service","entity_name":"User","entity_id":"u1","action":"UPDATE","actor":"keycloak-id","actor_username":"pedro","actor_display_name":"Pedro Iriano","payload":{}}`))
	if err != nil {
		t.Fatalf("normalizeAuditEvent() error = %v", err)
	}
	if event.Actor != "keycloak-id" || event.ActorUsername != "pedro" || event.ActorDisplayName != "Pedro Iriano" {
		t.Fatalf("actor snapshot was not preserved: %#v", event)
	}
}
