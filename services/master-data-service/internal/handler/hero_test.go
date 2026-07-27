package handler

import "testing"

func TestValidateHeroRequestAcceptsCanonicalContent(t *testing.T) {
	request := heroRequest{
		Title:              "  Panggung Juara Jawa Barat. ",
		HighlightText:      " Jawa Barat. ",
		Description:        " Portal resmi PORPROV XV Jawa Barat 2026. ",
		BackgroundImageURL: "/uploads/hero-depok.webp",
		IsActive:           true,
	}
	if err := validateHeroRequest(&request); err != nil {
		t.Fatalf("validateHeroRequest() error = %v", err)
	}
	if request.Title != "Panggung Juara Jawa Barat." || request.HighlightText != "Jawa Barat." {
		t.Fatalf("request was not normalized: %#v", request)
	}
}

func TestValidateHeroRequestRejectsUnsafeOrIncompleteContent(t *testing.T) {
	tests := []heroRequest{
		{Description: "Isi", BackgroundImageURL: "/uploads/hero.webp"},
		{Title: "Judul", BackgroundImageURL: "/uploads/hero.webp"},
		{Title: "Judul", HighlightText: "Bukan bagian judul", Description: "Isi", BackgroundImageURL: "/uploads/hero.webp"},
		{Title: "Judul", Description: "Isi", BackgroundImageURL: "javascript:alert(1)"},
		{Title: "Judul", Description: "Isi", BackgroundImageURL: "https://example.com/hero.jpg"},
		{Title: "Judul", Description: "Isi", BackgroundImageURL: "/uploads/../secret.jpg"},
	}
	for index := range tests {
		if err := validateHeroRequest(&tests[index]); err == nil {
			t.Fatalf("case %d expected validation error", index)
		}
	}
}
