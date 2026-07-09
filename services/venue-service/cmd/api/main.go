package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/db"
	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/handler"
	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/router"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Connect to Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(ctx)

	// Initialize NATS messaging
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}
	messaging.InitNATS()
	defer messaging.Close()

	// Setup layers
	queries := db.New(conn)
	venueHandler := handler.NewVenueHandler(queries)
	r := router.New(venueHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8087"
	}

	log.Printf("Venue Service running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
