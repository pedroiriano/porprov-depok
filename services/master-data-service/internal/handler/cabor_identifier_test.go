package handler

import "testing"

func TestIsCaborIdentifier(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		identifier string
		valid      bool
	}{
		{name: "slug", identifier: "hockey-indoor", valid: true},
		{name: "uuid", identifier: "78ad3fb9-ff39-4634-840c-10f85495a5ad", valid: true},
		{name: "empty", identifier: "", valid: false},
		{name: "uppercase", identifier: "Hockey-Indoor", valid: false},
		{name: "leading hyphen", identifier: "-karate", valid: false},
		{name: "trailing hyphen", identifier: "karate-", valid: false},
		{name: "double hyphen", identifier: "sepak--takraw", valid: false},
		{name: "encoded path", identifier: "sepak%2Ftakraw", valid: false},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if actual := isCaborIdentifier(test.identifier); actual != test.valid {
				t.Fatalf("isCaborIdentifier(%q) = %t, want %t", test.identifier, actual, test.valid)
			}
		})
	}
}
