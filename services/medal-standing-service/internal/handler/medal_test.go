package handler

import "testing"

func TestValidateSubmissionRejectsInvalidKontingenID(t *testing.T) {
	request := medalSubmissionRequest{KontingenID: "not-a-uuid", Gold: 1}
	if err := validateSubmissionRequest(&request); err == nil {
		t.Fatal("expected invalid kontingen UUID to be rejected")
	}
}

func TestValidateSubmissionRequiresPositiveMedalDelta(t *testing.T) {
	request := medalSubmissionRequest{KontingenID: "00000000-0000-4000-8000-000000000001"}
	if err := validateSubmissionRequest(&request); err == nil {
		t.Fatal("expected zero-medal submission to be rejected")
	}
}

func TestWorkflowRequiresVerificationBeforeOfficial(t *testing.T) {
	if workflowTransitionAllowed("PENDING", "OFFICIAL") {
		t.Fatal("pending submission must not become official directly")
	}
	if !workflowTransitionAllowed("VERIFIED", "OFFICIAL") {
		t.Fatal("verified submission should be publishable")
	}
}

func TestOfficialSubmissionCannotBePublishedTwice(t *testing.T) {
	if workflowTransitionAllowed("OFFICIAL", "OFFICIAL") {
		t.Fatal("official submission must be idempotently protected from double counting")
	}
}

func TestValidateSubmissionRejectsUnsafeEvidenceURL(t *testing.T) {
	request := medalSubmissionRequest{KontingenID: "00000000-0000-4000-8000-000000000001", Gold: 1, EvidenceURL: "javascript:alert(1)"}
	if err := validateSubmissionRequest(&request); err == nil {
		t.Fatal("expected unsafe evidence URL to be rejected")
	}
}
