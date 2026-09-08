package handler

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"io"
	"math"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
)

const (
	maxMediaSourceSize = 20 << 20
	maxMediaUploadSize = 3 << 20
	maxMediaDimension  = 8192
	maxMediaPixels     = 40_000_000
	multipartOverhead  = 1 << 20
)

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

type mediaPolicy struct {
	AllowedMIMETypes []string `json:"allowed_mime_types"`
	MaxSourceBytes   int64    `json:"max_source_bytes"`
	MaxFinalBytes    int64    `json:"max_final_bytes"`
	MaxWidth         int      `json:"max_width"`
	MaxHeight        int      `json:"max_height"`
	MaxPixels        int      `json:"max_pixels"`
}

type mediaListFilters struct {
	Search    string
	SortKey   string
	SortOrder string
	Page      int32
	PerPage   int32
	Paginated bool
}

type mediaListResponse struct {
	Data         []mediaView `json:"data"`
	Page         int32       `json:"page"`
	PerPage      int32       `json:"per_page"`
	TotalItems   int64       `json:"total_items"`
	TotalPages   int32       `json:"total_pages"`
	LibraryItems int64       `json:"library_items"`
	LibraryBytes int64       `json:"library_bytes"`
	TotalFormats int64       `json:"total_formats"`
}

type mediaView struct {
	db.MediaAsset
	Derivatives []db.MediaDerivative `json:"derivatives"`
}

type generatedDerivative struct {
	metadata db.MediaDerivative
	path     string
}

var derivativeWidths = []struct {
	variant string
	width   int
}{
	{variant: "thumbnail", width: 320},
	{variant: "list", width: 720},
	{variant: "detail", width: 1440},
}

func resizeBilinear(source image.Image, width int) image.Image {
	bounds := source.Bounds()
	if width >= bounds.Dx() {
		return source
	}
	height := bounds.Dy() * width / bounds.Dx()
	if height < 1 {
		height = 1
	}
	target := image.NewRGBA64(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		sourceY := (float64(y)+0.5)*float64(bounds.Dy())/float64(height) - 0.5
		y0 := int(math.Floor(sourceY))
		weightY := sourceY - float64(y0)
		if y0 < 0 {
			y0, weightY = 0, 0
		}
		y1 := min(y0+1, bounds.Dy()-1)
		for x := 0; x < width; x++ {
			sourceX := (float64(x)+0.5)*float64(bounds.Dx())/float64(width) - 0.5
			x0 := int(math.Floor(sourceX))
			weightX := sourceX - float64(x0)
			if x0 < 0 {
				x0, weightX = 0, 0
			}
			x1 := min(x0+1, bounds.Dx()-1)
			r00, g00, b00, a00 := source.At(bounds.Min.X+x0, bounds.Min.Y+y0).RGBA()
			r10, g10, b10, a10 := source.At(bounds.Min.X+x1, bounds.Min.Y+y0).RGBA()
			r01, g01, b01, a01 := source.At(bounds.Min.X+x0, bounds.Min.Y+y1).RGBA()
			r11, g11, b11, a11 := source.At(bounds.Min.X+x1, bounds.Min.Y+y1).RGBA()
			interpolate := func(topLeft, topRight, bottomLeft, bottomRight uint32) uint16 {
				top := float64(topLeft)*(1-weightX) + float64(topRight)*weightX
				bottom := float64(bottomLeft)*(1-weightX) + float64(bottomRight)*weightX
				return uint16(math.Round(top*(1-weightY) + bottom*weightY))
			}
			target.SetRGBA64(x, y, color.RGBA64{
				R: interpolate(r00, r10, r01, r11), G: interpolate(g00, g10, g01, g11),
				B: interpolate(b00, b10, b01, b11), A: interpolate(a00, a10, a01, a11),
			})
		}
	}
	return target
}

func generateMediaDerivatives(data []byte, mimeType, extension, uploadDir, baseName string) ([]generatedDerivative, error) {
	var decoded image.Image
	if mimeType != "image/webp" {
		var err error
		decoded, _, err = image.Decode(bytes.NewReader(data))
		if err != nil {
			return nil, err
		}
	}
	items := make([]generatedDerivative, 0, len(derivativeWidths))
	cleanup := func() {
		for _, item := range items {
			_ = os.Remove(item.path)
		}
	}
	for _, spec := range derivativeWidths {
		var encoded bytes.Buffer
		width, height := 0, 0
		if mimeType == "image/webp" {
			encoded.Write(data)
			width, height, _ = webPDimensions(data)
		} else {
			variant := resizeBilinear(decoded, spec.width)
			width, height = variant.Bounds().Dx(), variant.Bounds().Dy()
			if mimeType == "image/png" {
				if err := png.Encode(&encoded, variant); err != nil {
					cleanup()
					return nil, err
				}
			} else if err := jpeg.Encode(&encoded, variant, &jpeg.Options{Quality: 88}); err != nil {
				cleanup()
				return nil, err
			}
		}
		name := strings.TrimSuffix(baseName, extension) + "-" + spec.variant + extension
		path := filepath.Join(uploadDir, name)
		if err := os.WriteFile(path, encoded.Bytes(), 0o640); err != nil {
			cleanup()
			return nil, err
		}
		checksum := sha256.Sum256(encoded.Bytes())
		items = append(items, generatedDerivative{path: path, metadata: db.MediaDerivative{Variant: spec.variant, FileURL: "/uploads/" + name, Width: int32(width), Height: int32(height), FileSize: int32(encoded.Len()), ChecksumSHA256: fmt.Sprintf("%x", checksum)}})
	}
	return items, nil
}

func (h *MasterDataHandler) mediaView(r *http.Request, item db.MediaAsset) mediaView {
	derivatives, err := h.queries.ListMediaDerivatives(r.Context(), item.ID)
	if err != nil {
		derivatives = []db.MediaDerivative{}
	}
	return mediaView{MediaAsset: item, Derivatives: derivatives}
}

func (h *MasterDataHandler) mediaViews(r *http.Request, items []db.MediaAsset) []mediaView {
	views := make([]mediaView, 0, len(items))
	for _, item := range items {
		views = append(views, h.mediaView(r, item))
	}
	return views
}

func currentMediaPolicy() mediaPolicy {
	return mediaPolicy{
		AllowedMIMETypes: []string{"image/jpeg", "image/png", "image/webp"},
		MaxSourceBytes:   maxMediaSourceSize,
		MaxFinalBytes:    maxMediaUploadSize,
		MaxWidth:         maxMediaDimension,
		MaxHeight:        maxMediaDimension,
		MaxPixels:        maxMediaPixels,
	}
}

func parseMediaListFilters(values url.Values) (mediaListFilters, error) {
	filters := mediaListFilters{SortKey: "created_at", SortOrder: "desc", Page: 1, PerPage: 25}
	for _, key := range []string{"q", "sort", "order", "page", "per_page"} {
		if len(values[key]) > 1 {
			return filters, errors.New("filter Media Library hanya boleh memiliki satu nilai")
		}
	}
	filters.Search = strings.TrimSpace(values.Get("q"))
	if len([]rune(filters.Search)) > 80 {
		return filters, errors.New("pencarian Media Library maksimal 80 karakter")
	}
	if value := strings.TrimSpace(values.Get("sort")); value != "" {
		if value != "created_at" && value != "name" {
			return filters, errors.New("sort Media Library tidak valid")
		}
		filters.SortKey = value
	}
	if value := strings.ToLower(strings.TrimSpace(values.Get("order"))); value != "" {
		if value != "asc" && value != "desc" {
			return filters, errors.New("order Media Library tidak valid")
		}
		filters.SortOrder = value
	}
	if value := strings.TrimSpace(values.Get("page")); value != "" {
		page, err := strconv.ParseInt(value, 10, 32)
		if err != nil || page < 1 {
			return filters, errors.New("page Media Library harus minimal 1")
		}
		filters.Page = int32(page)
	}
	if value := strings.TrimSpace(values.Get("per_page")); value != "" {
		perPage, err := strconv.ParseInt(value, 10, 32)
		if err != nil || perPage < 1 || perPage > 100 {
			return filters, errors.New("per_page Media Library harus antara 1 sampai 100")
		}
		filters.PerPage = int32(perPage)
	}
	filters.Paginated = len(values) > 0
	return filters, nil
}

func (h *MasterDataHandler) GetMediaPolicy(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(currentMediaPolicy())
}

func safeOriginalMediaName(value, extension string) string {
	name := strings.TrimSpace(filepath.Base(value))
	name = strings.Map(func(r rune) rune {
		if unicode.IsControl(r) || r == '/' || r == '\\' {
			return -1
		}
		return r
	}, name)
	if name == "" || name == "." {
		return "media" + extension
	}
	if len(name) > 180 {
		name = strings.TrimSpace(name[:180])
	}
	return name
}

func declaredMediaType(value string) string {
	parsed, _, err := mime.ParseMediaType(strings.TrimSpace(value))
	if err != nil {
		return ""
	}
	return strings.ToLower(parsed)
}

func webPDimensions(data []byte) (int, int, error) {
	if len(data) < 30 || string(data[:4]) != "RIFF" || string(data[8:12]) != "WEBP" {
		return 0, 0, errors.New("invalid WebP container")
	}
	payload := data[20:]
	switch string(data[12:16]) {
	case "VP8X":
		width := 1 + int(payload[4]) + int(payload[5])<<8 + int(payload[6])<<16
		height := 1 + int(payload[7]) + int(payload[8])<<8 + int(payload[9])<<16
		return width, height, nil
	case "VP8L":
		if len(payload) < 5 || payload[0] != 0x2f {
			return 0, 0, errors.New("invalid lossless WebP header")
		}
		width := 1 + int(payload[1]) + (int(payload[2]&0x3f) << 8)
		height := 1 + int(payload[2]>>6) + (int(payload[3]) << 2) + (int(payload[4]&0x0f) << 10)
		return width, height, nil
	case "VP8 ":
		if len(payload) < 10 || payload[3] != 0x9d || payload[4] != 0x01 || payload[5] != 0x2a {
			return 0, 0, errors.New("invalid lossy WebP header")
		}
		width := (int(payload[6]) | int(payload[7])<<8) & 0x3fff
		height := (int(payload[8]) | int(payload[9])<<8) & 0x3fff
		return width, height, nil
	default:
		return 0, 0, errors.New("unsupported WebP encoding")
	}
}

func validatedMediaMetadata(data []byte, declaredType string) (mimeType, extension string, width, height int, err error) {
	if len(data) == 0 || len(data) > maxMediaUploadSize {
		return "", "", 0, 0, errors.New("ukuran gambar harus 1 byte sampai 3 MiB")
	}
	mimeType = http.DetectContentType(data)
	extension, allowed := allowedMediaTypes[mimeType]
	if !allowed {
		return "", "", 0, 0, errors.New("format harus JPG, PNG, atau WebP")
	}
	if declaredMediaType(declaredType) != mimeType {
		return "", "", 0, 0, errors.New("tipe file tidak sesuai dengan signature gambar")
	}
	if mimeType == "image/webp" {
		width, height, err = webPDimensions(data)
	} else {
		var config image.Config
		config, _, err = image.DecodeConfig(bytes.NewReader(data))
		width, height = config.Width, config.Height
	}
	if err != nil || width <= 0 || height <= 0 {
		return "", "", 0, 0, errors.New("struktur gambar tidak valid")
	}
	if width > maxMediaDimension || height > maxMediaDimension || int64(width)*int64(height) > maxMediaPixels {
		return "", "", 0, 0, errors.New("dimensi gambar melampaui batas aman")
	}
	return mimeType, extension, width, height, nil
}

func (h *MasterDataHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		http.Error(w, "Identitas actor diperlukan", http.StatusUnauthorized)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxMediaUploadSize+multipartOverhead)
	if err := r.ParseMultipartForm(maxMediaUploadSize); err != nil {
		http.Error(w, "Ukuran hasil gambar maksimal 3 MiB", http.StatusRequestEntityTooLarge)
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
	data, readErr := io.ReadAll(io.LimitReader(file, maxMediaUploadSize+1))
	if readErr != nil {
		http.Error(w, "Gagal membaca file", http.StatusBadRequest)
		return
	}
	mimeType, extension, width, height, validationErr := validatedMediaMetadata(data, header.Header.Get("Content-Type"))
	if validationErr != nil {
		http.Error(w, validationErr.Error(), http.StatusUnprocessableEntity)
		return
	}
	checksum := fmt.Sprintf("%x", sha256.Sum256(data))
	if existing, lookupErr := h.queries.FindActiveMediaByChecksum(r.Context(), checksum); lookupErr == nil {
		publishAudit(r, "Media", "REUSE", checksum[:12], map[string]any{"media_id": existing.ID, "checksum_sha256": checksum})
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(h.mediaView(r, existing))
		return
	} else if !errors.Is(lookupErr, pgx.ErrNoRows) {
		http.Error(w, "Gagal memeriksa duplikasi media", http.StatusInternalServerError)
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

	_, copyErr := io.Copy(out, bytes.NewReader(data))
	closeErr := out.Close()
	if copyErr != nil || closeErr != nil {
		_ = os.Remove(filePath)
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}
	derivatives, derivativeErr := generateMediaDerivatives(data, mimeType, extension, uploadDir, filename)
	if derivativeErr != nil {
		_ = os.Remove(filePath)
		for _, item := range derivatives {
			_ = os.Remove(item.path)
		}
		http.Error(w, "Gagal menyiapkan ukuran gambar", http.StatusInternalServerError)
		return
	}

	media, err := h.queries.CreateMedia(r.Context(), db.CreateMediaParams{
		FileName:       safeOriginalMediaName(header.Filename, extension),
		FileUrl:        "/uploads/" + filename,
		MimeType:       pgtype.Text{String: mimeType, Valid: true},
		FileSize:       pgtype.Int4{Int32: int32(len(data)), Valid: true},
		ChecksumSha256: pgtype.Text{String: checksum, Valid: true},
		Width:          pgtype.Int4{Int32: int32(width), Valid: true},
		Height:         pgtype.Int4{Int32: int32(height), Valid: true},
		UploadedBy:     pgtype.Text{String: actor, Valid: true},
	})
	if err != nil {
		_ = os.Remove(filePath)
		for _, item := range derivatives {
			_ = os.Remove(item.path)
		}
		http.Error(w, "Gagal menyimpan metadata media", http.StatusInternalServerError)
		return
	}
	for _, item := range derivatives {
		if err := h.queries.CreateMediaDerivative(r.Context(), media.ID, item.metadata); err != nil {
			_ = h.queries.DeleteNewMedia(r.Context(), media.ID)
			_ = os.Remove(filePath)
			for _, generated := range derivatives {
				_ = os.Remove(generated.path)
			}
			http.Error(w, "Gagal menyimpan ukuran gambar", http.StatusInternalServerError)
			return
		}
	}

	var id string
	if media.ID.Valid {
		encoded, _ := media.ID.MarshalJSON()
		id = strings.Trim(string(encoded), "\"")
	}
	publishAudit(r, "Media", "UPLOAD", id, media)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(h.mediaView(r, media))
}

func (h *MasterDataHandler) ListMedia(w http.ResponseWriter, r *http.Request) {
	filters, parseErr := parseMediaListFilters(r.URL.Query())
	if parseErr != nil {
		http.Error(w, parseErr.Error(), http.StatusBadRequest)
		return
	}
	if filters.Paginated {
		search := escapeLikePattern(filters.Search)
		media, err := h.queries.ListMediaPaginated(r.Context(), db.ListMediaPaginatedParams{
			Search: search, SortKey: filters.SortKey, SortOrder: filters.SortOrder,
			PageOffset: (filters.Page - 1) * filters.PerPage, PageLimit: filters.PerPage,
		})
		if err != nil {
			http.Error(w, "Gagal mengambil media", http.StatusInternalServerError)
			return
		}
		totalItems, err := h.queries.CountMedia(r.Context(), search)
		if err != nil {
			http.Error(w, "Gagal menghitung media", http.StatusInternalServerError)
			return
		}
		stats, err := h.queries.GetMediaStats(r.Context())
		if err != nil {
			http.Error(w, "Gagal menghitung statistik media", http.StatusInternalServerError)
			return
		}
		if media == nil {
			media = []db.MediaAsset{}
		}
		totalPages := int32(0)
		if totalItems > 0 {
			totalPages = int32((totalItems + int64(filters.PerPage) - 1) / int64(filters.PerPage))
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(mediaListResponse{Data: h.mediaViews(r, media), Page: filters.Page, PerPage: filters.PerPage, TotalItems: totalItems, TotalPages: totalPages, LibraryItems: stats.TotalItems, LibraryBytes: stats.TotalBytes, TotalFormats: stats.TotalFormats})
		return
	}

	media, err := h.queries.GetMedia(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil media", http.StatusInternalServerError)
		return
	}
	if media == nil {
		media = []db.MediaAsset{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.mediaViews(r, media))
}

func (h *MasterDataHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	handleSoftDelete(w, r, h.queries, "media", "Media")
}
