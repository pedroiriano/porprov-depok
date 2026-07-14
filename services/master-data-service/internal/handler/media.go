package handler

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

const maxMediaUploadSize = 10 << 20

var allowedMediaTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

func randomMediaName(extension string) (string, error) {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return hex.EncodeToString(buffer) + extension, nil
}

func (h *MasterDataHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxMediaUploadSize+1024)
	if err := r.ParseMultipartForm(maxMediaUploadSize); err != nil {
		http.Error(w, "Ukuran gambar maksimal 10 MB", http.StatusRequestEntityTooLarge)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File gambar wajib disertakan", http.StatusBadRequest)
		return
	}
	defer file.Close()
	if header.Size <= 0 || header.Size > maxMediaUploadSize {
		http.Error(w, "Ukuran gambar tidak valid", http.StatusUnprocessableEntity)
		return
	}

	sniff := make([]byte, 512)
	bytesRead, readErr := io.ReadFull(file, sniff)
	if readErr != nil && !errors.Is(readErr, io.ErrUnexpectedEOF) {
		http.Error(w, "Gagal membaca file", http.StatusBadRequest)
		return
	}
	sniff = sniff[:bytesRead]
	mimeType := http.DetectContentType(sniff)
	extension, allowed := allowedMediaTypes[mimeType]
	if !allowed {
		http.Error(w, "Format harus JPG, PNG, atau WebP", http.StatusUnsupportedMediaType)
		return
	}

	filename, err := randomMediaName(extension)
	if err != nil {
		http.Error(w, "Gagal membuat nama file aman", http.StatusInternalServerError)
		return
	}
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0o750); err != nil {
		http.Error(w, "Gagal menyiapkan penyimpanan media", http.StatusInternalServerError)
		return
	}
	filePath := filepath.Join(uploadDir, filename)
	out, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
	if err != nil {
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}

	_, copyErr := io.Copy(out, io.MultiReader(bytes.NewReader(sniff), file))
	closeErr := out.Close()
	if copyErr != nil || closeErr != nil {
		_ = os.Remove(filePath)
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}

	media, err := h.queries.CreateMedia(r.Context(), db.CreateMediaParams{
		FileName: strings.TrimSpace(filepath.Base(header.Filename)),
		FileUrl:  "/uploads/" + filename,
		MimeType: pgtype.Text{String: mimeType, Valid: true},
		FileSize: pgtype.Int4{Int32: int32(header.Size), Valid: true},
	})
	if err != nil {
		_ = os.Remove(filePath)
		http.Error(w, "Gagal menyimpan metadata media", http.StatusInternalServerError)
		return
	}

	var id string
	if media.ID.Valid {
		encoded, _ := media.ID.MarshalJSON()
		id = strings.Trim(string(encoded), "\"")
	}
	publishAudit("Media", "UPLOAD", id, media)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(media)
}

func (h *MasterDataHandler) ListMedia(w http.ResponseWriter, r *http.Request) {
	media, err := h.queries.GetMedia(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil media", http.StatusInternalServerError)
		return
	}
	if media == nil {
		media = []db.MediaAsset{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

func (h *MasterDataHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "media", "Media")
}
