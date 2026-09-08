package handler

import "testing"

func TestCategorySlugIsStableAndNormalized(t *testing.T) {
	tests := map[string]string{
		"  Kuliner & UMKM  ": "kuliner-umkm",
		"Wisata   Keluarga":  "wisata-keluarga",
		"Olahraga 24 Jam":    "olahraga-24-jam",
	}
	for input, want := range tests {
		if got := categorySlug(input); got != want {
			t.Fatalf("categorySlug(%q) = %q, want %q", input, got, want)
		}
	}
}
