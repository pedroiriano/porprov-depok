package handler

import "testing"

func TestIsVenueIdentifier(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		identifier string
		valid      bool
	}{
		{name: "slug", identifier: "lapangan-kukusan", valid: true},
		{name: "uuid", identifier: "bc02aaa2-f219-42ac-b850-7900be9e9381", valid: true},
		{name: "empty", identifier: "", valid: false},
		{name: "uppercase", identifier: "Lapangan-Kukusan", valid: false},
		{name: "leading hyphen", identifier: "-lapangan", valid: false},
		{name: "trailing hyphen", identifier: "lapangan-", valid: false},
		{name: "double hyphen", identifier: "lapangan--kukusan", valid: false},
		{name: "encoded path", identifier: "lapangan%2Fkukusan", valid: false},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if actual := isVenueIdentifier(test.identifier); actual != test.valid {
				t.Fatalf("isVenueIdentifier(%q) = %t, want %t", test.identifier, actual, test.valid)
			}
		})
	}
}
