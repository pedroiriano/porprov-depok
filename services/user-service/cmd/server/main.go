package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/db"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/handler"
	"github.com/porprov-xv/porprov-depok/services/user-service/internal/router"
)

func main() {
	// INFO: Memuat konfigurasi
	cfg := config.LoadConfig()

	// INFO: Inisiasi koneksi ke PostgreSQL
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL: %v", err)
	}
	defer conn.Close(ctx)
	log.Println("Berhasil terhubung ke database PostgreSQL user_service_db")

	// INFO: Menginisialisasi SQLC Queries
	queries := db.New(conn)

	// INFO: Init Messaging
	if err := messaging.InitNATS(); err != nil {
		log.Printf("Peringatan: Gagal inisialisasi NATS (Audit Trail offline): %v\n", err)
	} else {
		defer messaging.Close()
	}

	// INFO: Menginisialisasi Handler
	userHandler := handler.NewUserHandler(queries, cfg)

	// INFO: Setup Chi Router
	r := router.SetupRouter(userHandler)

	// INFO: Setup HTTP Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("User Service berjalan di port %s (Lingkungan: %s)\n", cfg.Port, cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Kesalahan saat menjalankan server: %v\n", err)
		}
	}()

	// INFO: Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Mematikan server User Service secara elegan...")
	ctxTimeout, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctxTimeout); err != nil {
		log.Fatalf("Server dipaksa mati: %v\n", err)
	}

	log.Println("User Service berhasil dihentikan.")
}
