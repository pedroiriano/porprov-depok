package config

import (
	"os"
)

type AppConfig struct {
	Port        string
	Env         string
	DBConn      string
	ScheduleURL string
}

func LoadConfig() *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "28081" // Local debug namespace; Docker overrides to 8081.
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	dbConn := os.Getenv("DATABASE_URL")
	if dbConn == "" {
		dbConn = "postgres://porprov_admin:porprov_secret@localhost:15432/master_data_db?sslmode=disable"
	}
	scheduleURL := os.Getenv("SCHEDULE_SERVICE_URL")
	if scheduleURL == "" {
		scheduleURL = "http://localhost:28082/api/v1"
	}

	return &AppConfig{
		Port:        port,
		Env:         env,
		DBConn:      dbConn,
		ScheduleURL: scheduleURL,
	}
}
