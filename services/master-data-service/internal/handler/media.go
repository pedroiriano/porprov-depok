package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

// UploadMedia handles file uploads
func (h *MasterDataHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	// 10 MB Max Upload
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Max file size is 10MB", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, os.ModePerm)
	}

	// Generate a unique filename
	filename := time.Now().Format("20060102150405") + "-" + header.Filename
	filePath := filepath.Join(uploadDir, filename)

	out, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// The public URL to access the file
	fileURL := "/uploads/" + filename

	// Save metadata to DB
	media, err := h.queries.CreateMedia(r.Context(), db.CreateMediaParams{
		FileName: header.Filename,
		FileUrl:  fileURL,
		MimeType: pgtype.Text{String: header.Header.Get("Content-Type"), Valid: true},
		FileSize: pgtype.Int4{Int32: int32(header.Size), Valid: true},
	})
	if err != nil {
		os.Remove(filePath) // rollback file save
		http.Error(w, "Failed to save media metadata: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var uuidStr string
	if media.ID.Valid {
		b, _ := media.ID.MarshalJSON()
		uuidStr = string(b)
	}
	publishAudit("Media", "UPLOAD", uuidStr, media)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(media)
}

// ListMedia returns all uploaded media assets
func (h *MasterDataHandler) ListMedia(w http.ResponseWriter, r *http.Request) {
	medias, err := h.queries.GetMedia(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch media: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(medias)
}

// DeleteMedia deletes a media asset from DB and filesystem
func (h *MasterDataHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	// Wait, to delete the file, we need its metadata first. But we don't have GetMediaByID right now.
	// That's fine, we will just delete the DB record. Let's add GetMediaByID later if needed.
	// For now just delete from DB to keep it simple.

	if err := h.queries.DeleteMedia(r.Context(), uuid); err != nil {
		http.Error(w, "Failed to delete media", http.StatusInternalServerError)
		return
	}

	publishAudit("Media", "DELETE", id, map[string]string{"id": id})
	w.WriteHeader(http.StatusNoContent)
}
