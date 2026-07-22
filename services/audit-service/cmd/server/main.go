package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

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
		if err := conn.Ping(r.Context()); err != nil {
			log.Printf("Ping failed: %v", err)
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "audit-service is running and listening for events"}`))
	})
	http.HandleFunc("/api/v1/logs", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		// SECURITY: Endpoint hanya boleh dicapai setelah JWT diverifikasi API Gateway.
		if strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" {
			http.Error(w, "authenticated actor is required", http.StatusUnauthorized)
			return
		}
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
		if limit <= 0 || limit > 200 {
			limit = 50
		}
		if offset < 0 {
			offset = 0
		}
		items, err := queries.ListAuditEvents(r.Context(), strings.TrimSpace(r.URL.Query().Get("search")), strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("action"))), strings.TrimSpace(r.URL.Query().Get("service")), limit, offset)
		if err != nil {
			http.Error(w, "failed to read audit logs", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(items)
	})

	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	server := &http.Server{Addr: serverAddr, Handler: http.DefaultServeMux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 120 * time.Second}
	log.Printf("Menjalankan Audit Service HTTP di port %s...\n", cfg.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Gagal menjalankan server: %v\n", err)
	}
}
