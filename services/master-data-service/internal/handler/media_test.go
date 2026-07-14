package handler

import (
	"strings"
	"testing"
)

func TestRandomMediaName(t *testing.T) {
	t.Parallel()

	first, err := randomMediaName(".png")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	second, err := randomMediaName(".png")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first == second {
		t.Fatal("expected unique media names")
	}
	if !strings.HasSuffix(first, ".png") || strings.ContainsAny(first, `/\\`) {
		t.Fatalf("expected safe PNG filename, got %q", first)
	}
}
