package portal

import (
	"slices"
	"testing"
)

// TEST: Older portal configurations gain only the new private workspace; explicit owner choices remain intact.
func TestDocumentsLegacyAndPrivateModule(t *testing.T) {
	d := Default()
	d.Modules = slices.DeleteFunc(d.Modules, func(m Module) bool { return m.ID == "documents" || m.ID == "downloads" })
	d.NormalizeLegacy()
	if !d.Local("documents", true) || d.Local("documents", false) {
		t.Fatal("document workspace must be private")
	}
	for i := range d.Modules {
		if d.Modules[i].ID == "documents" {
			d.Modules[i].AdminEnabled = false
		}
	}
	d.NormalizeLegacy()
	if d.Local("documents", true) {
		t.Fatal("disabled module was reactivated")
	}
	if len(RequestModules("/api/v1/documents/policy")) != 1 {
		t.Fatal("document API not covered by module guard")
	}
	if DocumentsProof("short", "document.view") != "" || DocumentsProof("123456789012345678901234", "document.view") == DocumentsProof("123456789012345678901234", "document.policy") {
		t.Fatal("proofs not purpose-bound")
	}
}
