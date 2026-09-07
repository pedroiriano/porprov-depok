package handler

import "testing"

func TestValidateUserMutation(t *testing.T) {
	tests := []struct {
		name             string
		request          userMutationRequest
		passwordRequired bool
		wantError        string
	}{
		{
			name: "valid create request",
			request: userMutationRequest{
				Username: "operator.depok",
				Email:    "operator@example.test",
				FullName: "Operator Depok",
				Role:     "koresponden",
				Password: "safe-password-2026",
			},
			passwordRequired: true,
		},
		{
			name: "valid update without password",
			request: userMutationRequest{
				Username: "auditor_depok",
				Email:    "auditor@example.test",
				FullName: "Auditor Depok",
				Role:     "auditor",
			},
		},
		{
			name: "reject invalid username",
			request: userMutationRequest{
				Username: "a b",
				Email:    "operator@example.test",
				FullName: "Operator Depok",
				Role:     "koresponden",
				Password: "safe-password-2026",
			},
			passwordRequired: true,
			wantError:        "Username must contain 3-64 letters, numbers, dots, underscores, or hyphens",
		},
		{
			name: "reject malformed email",
			request: userMutationRequest{
				Username: "operator",
				Email:    "not-an-email",
				FullName: "Operator Depok",
				Role:     "koresponden",
				Password: "safe-password-2026",
			},
			passwordRequired: true,
			wantError:        "Invalid email address",
		},
		{
			name: "reject short password",
			request: userMutationRequest{
				Username: "operator",
				Email:    "operator@example.test",
				FullName: "Operator Depok",
				Role:     "koresponden",
				Password: "short",
			},
			passwordRequired: true,
			wantError:        "Password must contain 12-128 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := tt.request
			if got := validateUserMutation(&request, tt.passwordRequired); got != tt.wantError {
				t.Fatalf("validateUserMutation() = %q, want %q", got, tt.wantError)
			}
		})
	}
}
