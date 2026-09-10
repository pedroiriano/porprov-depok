package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
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

	// Connect to Database using pgxpool for concurrency safety
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://porprov_admin:porprov_secret@localhost:15432/venue_db?sslmode=disable"
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	conn, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close()

	// Initialize NATS messaging
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:14222"
	}
	messaging.InitNATS()
	defer messaging.Close()

	// Setup layers
	queries := db.New(conn)
	scheduleURL := os.Getenv("SCHEDULE_SERVICE_URL")
	if scheduleURL == "" {
		scheduleURL = "http://localhost:28082/api/v1"
	}
	venueHandler := handler.NewVenueHandler(queries, scheduleURL)
	r := router.New(venueHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "28087"
	}

	log.Printf("Venue Service running on port %s", port)
	// INFO: Timeout mencegah koneksi lambat menahan resource tanpa batas.
	server := &http.Server{Addr: ":" + port, Handler: r, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 30 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 120 * time.Second}
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()
	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Failed to stop Venue Service gracefully: %v", err)
	}
}
