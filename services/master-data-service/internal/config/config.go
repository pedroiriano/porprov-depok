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
		port = "18002" // Port 18002 untuk Master Data Service
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://porprov_admin:porprov_secret@localhost:5433/master_data_db?sslmode=disable"
	}

	return &AppConfig{
		Port:   port,
		Env:    env,
		DBConn: dbConn,
	}
}
