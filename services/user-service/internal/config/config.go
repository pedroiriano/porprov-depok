package config

import (
	"os"
)

// AppConfig menyimpan konfigurasi untuk User Service
type AppConfig struct {
	Port                string
	Env                 string
	DBConn              string
	KeycloakServerURL   string
	KeycloakRealm       string
	KeycloakClientID    string
	KeycloakClientSecret string
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
		Port:                port,
		Env:                 env,
		DBConn:              dbConn,
		KeycloakServerURL:   kcURL,
		KeycloakRealm:       "porprov",
		KeycloakClientID:    "porprov-backend-service",
		KeycloakClientSecret: "backend_secret",
	}
}
