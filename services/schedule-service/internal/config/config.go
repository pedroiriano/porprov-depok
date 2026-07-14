package config

import (
	"os"
)

type AppConfig struct {
	Port          string
	Env           string
	DBConn        string
	MasterDataURL string
	VenueURL      string
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "28082" // Local debug namespace; Docker overrides to 8082.
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://porprov_admin:porprov_secret@localhost:15432/schedule_db?sslmode=disable"
	}

	return &AppConfig{
		Port:          port,
		Env:           env,
		DBConn:        dbConn,
		MasterDataURL: envOrDefault("MASTER_DATA_SERVICE_URL", "http://localhost:28081/api/v1"),
		VenueURL:      envOrDefault("VENUE_SERVICE_URL", "http://localhost:28087/api/v1/venues"),
	}
}
