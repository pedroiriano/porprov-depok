package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/porprov-xv/porprov-depok/packages/messaging"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/config"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/db"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/handler"
	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/router"
)

func main() {
	// INFO: Load configuration
	cfg := config.LoadConfig()

	// INFO: Connect to PostgreSQL using pgxpool for concurrency safety
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	conn, err := pgxpool.New(ctx, cfg.DBConn)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database PostgreSQL: %v\n", err)
	}
	defer conn.Close()

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
	masterDataHandler := handler.NewMasterDataHandler(queries, cfg.ScheduleURL)
	cityGuideHandler := handler.NewCityGuideHandler(queries, conn)
	cityGuideCategoryHandler := handler.NewCityGuideCategoryHandler(queries)
	heroHandler := handler.NewHeroHandler(queries)

	// INFO: Setup Chi Router
	r := router.SetupRouter(masterDataHandler, cityGuideHandler, cityGuideCategoryHandler, heroHandler)

	// INFO: Batasi waktu koneksi HTTP dan hentikan service secara elegan.
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	server := &http.Server{
		Addr:              serverAddr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	log.Printf("Menjalankan Master Data Service di port %s...\n", cfg.Port)
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Gagal menjalankan server: %v\n", err)
		}
	}()
	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Gagal menghentikan Master Data Service secara elegan: %v", err)
	}
}
