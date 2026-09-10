package handler

import "testing"

func TestKeycloakDisplayName(t *testing.T) {
	tests := []struct {
		name      string
		fullName  string
		wantFirst string
		wantLast  string
	}{
		{name: "dua kata", fullName: "Nia Depok", wantFirst: "Nia", wantLast: "Depok"},
		{name: "lebih dari dua kata", fullName: "Operator Venue Kota Depok", wantFirst: "Operator", wantLast: "Venue Kota Depok"},
		{name: "nama tunggal", fullName: "Pedro", wantFirst: "Pedro", wantLast: "Pedro"},
		{name: "spasi dinormalisasi", fullName: "  Admin   PORPROV  ", wantFirst: "Admin", wantLast: "PORPROV"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			first, last := keycloakDisplayName(test.fullName)
			if first != test.wantFirst || last != test.wantLast {
				t.Fatalf("keycloakDisplayName(%q) = %q, %q; want %q, %q", test.fullName, first, last, test.wantFirst, test.wantLast)
			}
		})
	}
}
