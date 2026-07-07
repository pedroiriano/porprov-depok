package config

import (
	"os"
)

// AppConfig menyimpan konfigurasi untuk API Gateway
type AppConfig struct {
	Port            string
	Env             string
	KeycloakJWKSURL string
}

// LoadConfig memuat konfigurasi dari environment variables
func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000" // Default port untuk API Gateway
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
	}
}
