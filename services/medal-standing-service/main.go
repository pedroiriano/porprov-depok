package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/medal-standing-service/internal/db"
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

	queries := db.New(pool)
	medalHandler := handler.NewMedalHandler(queries)

	// Initialize NATS through the shared package so every service uses the
	// same environment contract and local-development fallback.
	if err := messaging.InitNATS(); err != nil {
		log.Printf("Failed to connect to NATS: %v", err)
	} else {
		log.Println("Connected to NATS")
		defer messaging.Close()
	}

	// Setup Router
	r := chi.NewRouter()
	r.Use(cors.AllowAll().Handler)
	r.Use(middleware.Logger)

	r.Route("/api/v1/medals", func(r chi.Router) {
		r.Get("/standings", medalHandler.GetStandings)
		r.Post("/add", medalHandler.AddMedal)
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
