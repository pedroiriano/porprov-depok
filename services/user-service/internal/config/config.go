package config

import (
	"errors"
	"os"
	"strings"
)

// AppConfig menyimpan konfigurasi untuk User Service
type AppConfig struct {
	Port                 string
	Env                  string
	DBConn               string
	KeycloakServerURL    string
	KeycloakRealm        string
	KeycloakClientID     string
	KeycloakClientSecret string
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

// Validate menolak credential development pada staging/production.
func (c *AppConfig) Validate() error {
	if !strings.EqualFold(c.Env, "production") && !strings.EqualFold(c.Env, "staging") {
		return nil
	}
	if strings.Contains(c.DBConn, "porprov_secret") {
		return errors.New("DATABASE_URL masih memakai credential development")
	}
	if len(c.KeycloakClientSecret) < 32 || c.KeycloakClientSecret == "backend_secret" || strings.HasPrefix(c.KeycloakClientSecret, "replace-with-") {
		return errors.New("KEYCLOAK_BACKEND_CLIENT_SECRET wajib berupa secret eksplisit minimal 32 karakter")
	}
	return nil
}

// LoadConfig memuat konfigurasi dari environment variables
func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "28001" // Local debug namespace; Docker/hosting wajib override.
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		// Menggunakan database user_service_db sesuai desain
		dbConn = "postgres://porprov_admin:porprov_secret@localhost:15432/user_service_db?sslmode=disable"
	}

	kcURL := os.Getenv("KEYCLOAK_SERVER_URL")
	if kcURL == "" {
		kcURL = "http://localhost:8080"
	}

	return &AppConfig{
		Port:                 port,
		Env:                  env,
		DBConn:               dbConn,
		KeycloakServerURL:    kcURL,
		KeycloakRealm:        envOrDefault("KEYCLOAK_REALM", "porprov"),
		KeycloakClientID:     envOrDefault("KEYCLOAK_BACKEND_CLIENT_ID", "porprov-backend-service"),
		KeycloakClientSecret: envOrDefault("KEYCLOAK_BACKEND_CLIENT_SECRET", "backend_secret"),
	}
}
