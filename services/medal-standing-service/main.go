package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/medal-standing-service/internal/handler"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://porprov_admin:porprov_secret@localhost:15432/porprov_db?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	masterURL := os.Getenv("MASTER_DATA_SERVICE_URL")
	if strings.TrimSpace(masterURL) == "" {
		masterURL = "http://localhost:28081/api/v1"
	}
	medalHandler := handler.NewMedalHandler(pool, masterURL)

	// Initialize NATS through the shared package so every service uses the
	// same environment contract and local-development fallback.
	if err := messaging.InitNATS(); err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	log.Println("Connected to NATS")
	defer messaging.Close()
	go handler.StartOutboxWorker(ctx, pool, messaging.PublishEvent)

	// Setup Router
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://localhost:5174"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-Actor-ID", "X-Request-ID"},
	}))
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "medal-standing-service is healthy"})
	}
	r.Get("/health", healthHandler)
	r.Head("/health", healthHandler)

	r.Route("/api/v1/medals", func(r chi.Router) {
		r.Get("/standings", medalHandler.GetStandings)
		r.Post("/add", medalHandler.AddMedal)
		r.Get("/submissions", medalHandler.ListSubmissions)
		r.Post("/submissions", medalHandler.CreateSubmission)
		r.Post("/submissions/{submissionID}/verify", medalHandler.VerifySubmission)
		r.Post("/submissions/{submissionID}/reject", medalHandler.RejectSubmission)
		r.Post("/submissions/{submissionID}/publish", medalHandler.PublishSubmission)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "28086"
	}
	log.Printf("Medal Standing Service running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
