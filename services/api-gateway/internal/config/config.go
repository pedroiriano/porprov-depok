package config

import (
	"os"
)

// AppConfig menyimpan konfigurasi untuk API Gateway
type AppConfig struct {
	Port            string
	Env             string
	KeycloakJWKSURL string
	MasterDataURL   string
	ScheduleURL     string
	VenueURL        string
	AuditURL        string
	LivescoreURL    string
	MedalsURL       string
	RealtimeURL     string
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

// LoadConfig memuat konfigurasi dari environment variables
func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "28000" // Local debug namespace; Docker overrides to 8000.
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	jwksURL := os.Getenv("KEYCLOAK_JWKS_URL")
	if jwksURL == "" {
		jwksURL = "http://localhost:8080/realms/porprov/protocol/openid-connect/certs"
	}

	return &AppConfig{
		Port:            port,
		Env:             env,
		KeycloakJWKSURL: jwksURL,
		MasterDataURL:   envOrDefault("MASTER_DATA_SERVICE_URL", "http://localhost:28081/api/v1"),
		ScheduleURL:     envOrDefault("SCHEDULE_SERVICE_URL", "http://localhost:28082/api/v1"),
		VenueURL:        envOrDefault("VENUE_SERVICE_URL", "http://localhost:28087/api/v1/venues"),
		AuditURL:        envOrDefault("AUDIT_SERVICE_URL", "http://localhost:28084/api/v1"),
		LivescoreURL:    envOrDefault("LIVESCORE_SERVICE_URL", "http://localhost:28083/api/v1/livescore"),
		MedalsURL:       envOrDefault("MEDAL_SERVICE_URL", "http://localhost:28086/api/v1/medals"),
		RealtimeURL:     envOrDefault("REALTIME_GATEWAY_URL", "http://localhost:28085/api/v1/stream"),
	}
}
