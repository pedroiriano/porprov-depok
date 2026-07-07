package config

import (
	"os"
)

type AppConfig struct {
	Port   string
	Env    string
	DBConn string
}

func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "18003" // Port 18003 untuk Schedule Service
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://porprov_admin:porprov_secret@localhost:5433/schedule_db?sslmode=disable"
	}

	return &AppConfig{
		Port:   port,
		Env:    env,
		DBConn: dbConn,
	}
}
