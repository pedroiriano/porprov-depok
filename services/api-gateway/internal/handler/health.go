package handler

import (
	"net/http"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/pkg/response"
)

// HealthCheckHandler menangani endpoint /health
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	// INFO: Endpoint ini untuk Liveness dan Readiness probe (Kubernetes/Docker)
	data := map[string]string{
		"service": "api-gateway",
		"status":  "healthy",
	}
	response.JSON(w, r, http.StatusOK, "Service is running optimally", data)
}
