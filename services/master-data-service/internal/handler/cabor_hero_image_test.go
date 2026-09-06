package handler

import "testing"

func TestValidateOptionalCaborHeroImageURL(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		value string
		valid bool
	}{
		{name: "empty fallback", value: "", valid: true},
		{name: "media library", value: "/uploads/cabor-basketball.webp", valid: true},
		{name: "external URL", value: "https://example.com/image.webp", valid: false},
		{name: "legacy asset", value: "/assets/images/hero.webp", valid: false},
		{name: "path traversal", value: "/uploads/../secret.webp", valid: false},
		{name: "backslash", value: `/uploads\\secret.webp`, valid: false},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if actual := validateOptionalCaborHeroImageURL(test.value) == nil; actual != test.valid {
				t.Fatalf("validation for %q = %t, want %t", test.value, actual, test.valid)
			}
		})
	}
}
