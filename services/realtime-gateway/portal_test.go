//go:build !initstreams

package main

import (
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"testing"
)

// TEST: Publication capabilities also control replay and already-open public streams.
func TestPublicPortalEventCapabilities(t *testing.T) {
	defer publicPortalPolicy.Store(nil)
	event := []byte(`{"eventType":"LIVESCORE_UPDATED"}`)
	publicPortalPolicy.Store(nil)
	if publicEventEnabled(event) {
		t.Fatal("missing policy must not publish")
	}
	policy := portal.Default()
	publicPortalPolicy.Store(&policy)
	if !publicEventEnabled(event) {
		t.Fatal("baseline livescore unavailable")
	}
	for i := range policy.Modules {
		if policy.Modules[i].ID == "livescore" {
			policy.Modules[i].PublicEnabled = false
		}
	}
	publicPortalPolicy.Store(&policy)
	if publicEventEnabled(event) {
		t.Fatal("disabled livescore still published")
	}
	if !publicEventEnabled([]byte(`{"eventType":"MEDAL_STANDING_UPDATED"}`)) {
		t.Fatal("unrelated active module blocked")
	}
	if publicEventEnabled([]byte(`{"eventType":"AUDIT_CHANGED"}`)) {
		t.Fatal("private event published")
	}
}
