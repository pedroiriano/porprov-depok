package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/handler"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/router"
)

func main() {
	// INFO: Load configuration
	cfg := config.LoadConfig()

	// INFO: Connect to PostgreSQL using pgx
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL: %v\n", err)
	}
	defer conn.Close(ctx)

	log.Println("Berhasil terhubung ke database PostgreSQL master_data_db")

	// INFO: Initialize SQLC queries
	queries := db.New(conn)

	// INFO: Init Messaging
	if err := messaging.InitNATS(); err != nil {
		log.Printf("Peringatan: Gagal inisialisasi NATS (Audit Trail offline): %v\n", err)
	} else {
		defer messaging.Close()
	}

	// INFO: Initialize Handlers
	masterDataHandler := handler.NewMasterDataHandler(queries)

	// INFO: Setup Chi Router
	r := router.SetupRouter(masterDataHandler)

	// INFO: Start HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Menjalankan Master Data Service di port %s...\n", cfg.Port)
	if err := http.ListenAndServe(serverAddr, r); err != nil {
		log.Fatalf("Gagal menjalankan server: %v\n", err)
	}
}
