package handler

import "testing"

const (
	testKontingenA = "11111111-1111-4111-8111-111111111111"
	testKontingenB = "22222222-2222-4222-8222-222222222222"
)

func TestValidateParticipantRequestsSupportsAllIdentityTypes(t *testing.T) {
	tests := []struct {
		name     string
		requests []participantRequest
		wantType string
	}{
		{
			name: "individual",
			requests: []participantRequest{
				{ParticipantType: "individu", KontingenID: testKontingenA, AthleteName: "Atlet A", Slot: 1},
				{ParticipantType: "individual", KontingenID: testKontingenB, AthleteName: "Atlet B", Slot: 2},
			},
			wantType: "individual",
		},
		{
			name: "team",
			requests: []participantRequest{
				{ParticipantType: "tim", KontingenID: testKontingenA, TeamName: "Tim A", Slot: 1},
				{ParticipantType: "team", KontingenID: testKontingenB, TeamName: "Tim B", Slot: 2},
			},
			wantType: "team",
		},
		{
			name: "contingent",
			requests: []participantRequest{
				{ParticipantType: "kontingen", KontingenID: testKontingenA, Slot: 1},
				{ParticipantType: "contingent", KontingenID: testKontingenB, Slot: 2},
			},
			wantType: "contingent",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := validateParticipantRequests(tt.requests)
			if err != nil {
				t.Fatalf("validateParticipantRequests() error = %v", err)
			}
			if len(got) != 2 || got[0].ParticipantType != tt.wantType || got[1].ParticipantType != tt.wantType {
				t.Fatalf("validateParticipantRequests() = %#v, want two %s participants", got, tt.wantType)
			}
		})
	}
}

func TestValidateParticipantRequestsRejectsIncompleteOrAmbiguousMatchup(t *testing.T) {
	tests := []struct {
		name     string
		requests []participantRequest
	}{
		{
			name: "only one side",
			requests: []participantRequest{
				{ParticipantType: "contingent", KontingenID: testKontingenA, Slot: 1},
			},
		},
		{
			name: "individual without athlete",
			requests: []participantRequest{
				{ParticipantType: "individual", KontingenID: testKontingenA, Slot: 1},
				{ParticipantType: "individual", KontingenID: testKontingenB, AthleteName: "Atlet B", Slot: 2},
			},
		},
		{
			name: "duplicate slot",
			requests: []participantRequest{
				{ParticipantType: "contingent", KontingenID: testKontingenA, Slot: 1},
				{ParticipantType: "contingent", KontingenID: testKontingenB, Slot: 1},
			},
		},
		{
			name: "same participant",
			requests: []participantRequest{
				{ParticipantType: "team", KontingenID: testKontingenA, TeamName: "Tim Utama", Slot: 1},
				{ParticipantType: "team", KontingenID: testKontingenA, TeamName: "Tim Utama", Slot: 2},
			},
		},
		{
			name: "mixed participant types",
			requests: []participantRequest{
				{ParticipantType: "individual", KontingenID: testKontingenA, AthleteName: "Atlet A", Slot: 1},
				{ParticipantType: "team", KontingenID: testKontingenB, TeamName: "Tim B", Slot: 2},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := validateParticipantRequests(tt.requests); err == nil {
				t.Fatal("validateParticipantRequests() error = nil, want validation error")
			}
		})
	}
}
