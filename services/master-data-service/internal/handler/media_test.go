package handler

import (
	"bytes"
	"image"
	"image/png"
	"net/url"
	"os"
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

func TestParseMediaListFilters(t *testing.T) {
	t.Parallel()
	filters, err := parseMediaListFilters(url.Values{"q": {"hero"}, "sort": {"name"}, "order": {"asc"}, "page": {"2"}, "per_page": {"25"}})
	if err != nil {
		t.Fatalf("parseMediaListFilters() error = %v", err)
	}
	if !filters.Paginated || filters.Search != "hero" || filters.SortKey != "name" || filters.SortOrder != "asc" || filters.Page != 2 || filters.PerPage != 25 {
		t.Fatalf("unexpected filters: %#v", filters)
	}
	if _, err := parseMediaListFilters(url.Values{"per_page": {"101"}}); err == nil {
		t.Fatal("expected oversized page to be rejected")
	}
}

func pngBytes(t *testing.T, width, height int) []byte {
	t.Helper()
	var buffer bytes.Buffer
	if err := png.Encode(&buffer, image.NewRGBA(image.Rect(0, 0, width, height))); err != nil {
		t.Fatalf("png.Encode() error = %v", err)
	}
	return buffer.Bytes()
}

func TestValidatedMediaMetadataAcceptsMatchingSignature(t *testing.T) {
	t.Parallel()
	data := pngBytes(t, 16, 12)
	mimeType, extension, width, height, err := validatedMediaMetadata(data, "image/png")
	if err != nil {
		t.Fatalf("validatedMediaMetadata() error = %v", err)
	}
	if mimeType != "image/png" || extension != ".png" || width != 16 || height != 12 {
		t.Fatalf("metadata = %q/%q/%dx%d", mimeType, extension, width, height)
	}
}

func TestValidatedMediaMetadataRejectsMIMEConfusionAndUnsafeDimensions(t *testing.T) {
	t.Parallel()
	if _, _, _, _, err := validatedMediaMetadata(pngBytes(t, 16, 12), "image/jpeg"); err == nil {
		t.Fatal("expected MIME confusion to be rejected")
	}
	if _, _, _, _, err := validatedMediaMetadata(pngBytes(t, maxMediaDimension+1, 1), "image/png"); err == nil {
		t.Fatal("expected unsafe dimensions to be rejected")
	}
}

func TestSafeOriginalMediaNameRemovesPathAndControls(t *testing.T) {
	t.Parallel()
	name := safeOriginalMediaName("../folder/hero\x00.png", ".png")
	if name != "hero.png" {
		t.Fatalf("safeOriginalMediaName() = %q, want hero.png", name)
	}
}

func TestGenerateMediaDerivativesPreservesOriginalAndCreatesVariants(t *testing.T) {
	t.Parallel()
	directory := t.TempDir()
	data := pngBytes(t, 1600, 900)
	items, err := generateMediaDerivatives(data, "image/png", ".png", directory, "original.png")
	if err != nil {
		t.Fatalf("generateMediaDerivatives() error = %v", err)
	}
	if len(items) != 3 {
		t.Fatalf("derivatives = %d, want 3", len(items))
	}
	expectedWidths := map[string]int32{"thumbnail": 320, "list": 720, "detail": 1440}
	for _, item := range items {
		if item.metadata.ChecksumSha256 == "" || item.metadata.FileSize <= 0 || item.metadata.Width <= 0 || item.metadata.Height <= 0 {
			t.Fatalf("incomplete derivative metadata: %#v", item.metadata)
		}
		if _, err := os.Stat(item.path); err != nil {
			t.Fatalf("derivative file missing: %v", err)
		}
		if item.metadata.Width != expectedWidths[item.metadata.Variant] {
			t.Fatalf("variant %s width = %d, want %d", item.metadata.Variant, item.metadata.Width, expectedWidths[item.metadata.Variant])
		}
	}
	if _, err := os.Stat(directory + string(os.PathSeparator) + "original.png"); !os.IsNotExist(err) {
		t.Fatal("generator must not overwrite or create the original file")
	}
}
