package config

import (
	"os"
)

type AppConfig struct {
	Port    string
	Env     string
	DBConn  string
	NatsURL string
}

func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "18004"
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://porprov_admin:porprov_secret@localhost:5433/audit_db?sslmode=disable"
	}

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}

	return &AppConfig{
		Port:    port,
		Env:     env,
		DBConn:  dbConn,
		NatsURL: natsURL,
	}
}
