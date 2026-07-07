package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/audit-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/audit-service/internal/db"
	"github.com/porprov-xv/porprov-depok/services/audit-service/internal/subscriber"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Database Connection
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL audit_db: %v\n", err)
	}
	defer conn.Close(ctx)
	log.Println("Berhasil terhubung ke database PostgreSQL audit_db")

	queries := db.New(conn)

	// 2. Init Messaging
	if err := messaging.InitNATS(); err != nil {
		log.Fatalf("Gagal inisialisasi NATS: %v\n", err)
	}
	defer messaging.Close()

	// 3. Start Audit Subscriber (Background Worker)
	sub := subscriber.NewSubscriber(queries)
	if err := sub.Start(); err != nil {
		log.Fatalf("Gagal menjalankan subscriber audit: %v\n", err)
	}

	// 4. Start HTTP Server for Healthcheck/API
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status": "audit-service is running and listening for events"}`))
	})

	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Menjalankan Audit Service HTTP di port %s...\n", cfg.Port)
	if err := http.ListenAndServe(serverAddr, nil); err != nil {
		log.Fatalf("Gagal menjalankan server: %v\n", err)
	}
}
