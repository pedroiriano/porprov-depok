package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/router"
)

func main() {
	// INFO: Memuat konfigurasi
	cfg := config.LoadConfig()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Konfigurasi API Gateway tidak aman: %v", err)
	}

	// INFO: Setup JWT Middleware
	jwtMid, err := middleware.NewJWTMiddleware(cfg.KeycloakJWKSURL, cfg.KeycloakIssuer, cfg.JWTAllowedClients)
	if err != nil {
		log.Fatalf("Gagal menginisialisasi JWT Middleware: %v", err)
	}

	// INFO: Inisialisasi Chi Router
	r := router.SetupRouter(jwtMid, cfg)

	// INFO: Setup HTTP Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
		// SECURITY: Timeout per request untuk mencegah slowloris attack
		ReadTimeout: 10 * time.Second,
		// INFO: WriteTimeout dinonaktifkan karena Gateway melayani koneksi SSE.
		// Deadline koneksi idle tetap dikendalikan heartbeat dan proxy edge.
		WriteTimeout:      0,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// PERFORMANCE: Menjalankan server di goroutine agar tidak blocking saat menunggu sinyal shutdown
	go func() {
		log.Printf("API Gateway berjalan di port %s (Lingkungan: %s)\n", cfg.Port, cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Kesalahan saat menjalankan server: %v\n", err)
		}
	}()

	// INFO: Menangani Graceful Shutdown
	quit := make(chan os.Signal, 1)
	// Menerima sinyal SIGINT (Ctrl+C) dan SIGTERM (Docker/Kubernetes shutdown)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Mematikan server API Gateway secara elegan (Graceful Shutdown)...")

	// Memberikan waktu maksimal 10 detik untuk menyelesaikan request yang sedang berjalan
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server dipaksa mati: %v\n", err)
	}

	log.Println("API Gateway berhasil dihentikan.")
}
