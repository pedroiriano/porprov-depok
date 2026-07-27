package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/db"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/handler"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/router"
)

func main() {
	// INFO: Load configuration
	cfg := config.LoadConfig()

	// INFO: Use a PostgreSQL pool because HTTP handlers execute concurrently.
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("Gagal membuat pool database PostgreSQL: %v\n", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL: %v\n", err)
	}

	log.Println("Berhasil terhubung ke database PostgreSQL schedule_db")

	// INFO: Initialize SQLC queries
	queries := db.New(pool)

	// INFO: Init Messaging
	if err := messaging.InitNATS(); err != nil {
		log.Printf("Peringatan: Gagal inisialisasi NATS (Audit Trail offline): %v\n", err)
	} else {
		defer messaging.Close()
	}

	// INFO: Initialize Handlers
	matchHandler := handler.NewMatchHandler(queries, pool, cfg.MasterDataURL, cfg.VenueURL)

	// INFO: Setup Chi Router
	r := router.SetupRouter(matchHandler)

	// INFO: Start HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Menjalankan Schedule Service di port %s...\n", cfg.Port)
	if err := http.ListenAndServe(serverAddr, r); err != nil {
		log.Fatalf("Gagal menjalankan server: %v\n", err)
	}
}
