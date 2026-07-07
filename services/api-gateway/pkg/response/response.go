package response

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

// Meta API response metadata
type Meta struct {
	RequestID string `json:"request_id"`
	Timestamp string `json:"timestamp"`
}

// SuccessResponse format standar sukses
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Meta    Meta        `json:"meta"`
}

// ErrorResponse format standar error
type ErrorResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Errors  interface{} `json:"errors,omitempty"`
	Meta    Meta        `json:"meta"`
}

// JSON mengirimkan response dalam format JSON standar sukses
func JSON(w http.ResponseWriter, r *http.Request, status int, message string, data interface{}) {
	reqID := middleware.GetReqID(r.Context())
	if reqID == "" {
		reqID = "unknown"
	}

	res := SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta: Meta{
			RequestID: reqID,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(res)
}

// Error mengirimkan response dalam format JSON standar error
func Error(w http.ResponseWriter, r *http.Request, status int, message string, errors interface{}) {
	reqID := middleware.GetReqID(r.Context())
	if reqID == "" {
		reqID = "unknown"
	}

	res := ErrorResponse{
		Success: false,
		Message: message,
		Errors:  errors,
		Meta: Meta{
			RequestID: reqID,
			Timestamp: time.Now().Format(time.RFC3339),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(res)
}
