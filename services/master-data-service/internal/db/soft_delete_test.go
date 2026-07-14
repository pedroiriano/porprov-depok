package db

import "testing"

func TestSoftDeleteEntityWhitelist(t *testing.T) {
	t.Parallel()
	if _, err := softDeleteEntity("cabor"); err != nil {
		t.Fatalf("expected cabor to be supported: %v", err)
	}
	if _, err := softDeleteEntity("cabors; DROP TABLE cabors"); err == nil {
		t.Fatal("expected unknown entity to be rejected")
	}
}
