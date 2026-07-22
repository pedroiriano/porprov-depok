package config

import (
	"errors"
	"os"
	"strings"
)

// AppConfig menyimpan konfigurasi untuk API Gateway
type AppConfig struct {
	Port                string
	Env                 string
	KeycloakJWKSURL     string
	KeycloakIssuer      string
	JWTAllowedClients   []string
	AllowedOrigins      []string
	MasterDataURL       string
	ScheduleURL         string
	VenueURL            string
	AuditURL            string
	LivescoreURL        string
	MedalsURL           string
	RealtimeURL         string
	InternalStreamToken string
	UserURL             string
}

func csvValues(value string, fallback []string) []string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	values := make([]string, 0)
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			values = append(values, item)
		}
	}
	return values
}

// Validate menolak konfigurasi production yang masih memakai secret development.
func (c *AppConfig) Validate() error {
	if strings.TrimSpace(c.KeycloakIssuer) == "" || len(c.JWTAllowedClients) == 0 {
		return errors.New("Keycloak issuer and at least one JWT client are required")
	}
	if strings.EqualFold(c.Env, "production") || strings.EqualFold(c.Env, "staging") {
		if len(c.InternalStreamToken) < 32 || c.InternalStreamToken == "local-development-stream-token" || strings.HasPrefix(c.InternalStreamToken, "replace-with-") {
			return errors.New("INTERNAL_STREAM_TOKEN must be an explicit secret of at least 32 characters outside development")
		}
		if len(c.AllowedOrigins) == 0 {
			return errors.New("CORS_ALLOWED_ORIGINS must be explicit outside development")
		}
		if !strings.HasPrefix(strings.ToLower(c.KeycloakIssuer), "https://") {
			return errors.New("KEYCLOAK_ISSUER must use HTTPS outside development")
		}
		for _, origin := range c.AllowedOrigins {
			if origin == "*" || strings.Contains(origin, "*") || !strings.HasPrefix(strings.ToLower(origin), "https://") {
				return errors.New("production CORS origins must be explicit HTTPS origins without wildcards")
			}
		}
	}
	return nil
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
		Port:                port,
		Env:                 env,
		KeycloakJWKSURL:     jwksURL,
		KeycloakIssuer:      envOrDefault("KEYCLOAK_ISSUER", "http://localhost:8080/realms/porprov"),
		JWTAllowedClients:   csvValues(os.Getenv("JWT_ALLOWED_CLIENTS"), []string{"porprov-admin-web", "porprov-mobile-admin"}),
		AllowedOrigins:      csvValues(os.Getenv("CORS_ALLOWED_ORIGINS"), []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"}),
		MasterDataURL:       envOrDefault("MASTER_DATA_SERVICE_URL", "http://localhost:28081/api/v1"),
		ScheduleURL:         envOrDefault("SCHEDULE_SERVICE_URL", "http://localhost:28082/api/v1"),
		VenueURL:            envOrDefault("VENUE_SERVICE_URL", "http://localhost:28087/api/v1/venues"),
		AuditURL:            envOrDefault("AUDIT_SERVICE_URL", "http://localhost:28084/api/v1"),
		LivescoreURL:        envOrDefault("LIVESCORE_SERVICE_URL", "http://localhost:28083/api/v1/livescore"),
		MedalsURL:           envOrDefault("MEDAL_SERVICE_URL", "http://localhost:28086/api/v1/medals"),
		RealtimeURL:         envOrDefault("REALTIME_GATEWAY_URL", "http://localhost:28085/api/v1/stream"),
		InternalStreamToken: envOrDefault("INTERNAL_STREAM_TOKEN", "local-development-stream-token"),
		UserURL:             envOrDefault("USER_SERVICE_URL", "http://localhost:28001/api/v1/users"),
	}
}
