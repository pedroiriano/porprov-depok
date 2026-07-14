package router

import (
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/handler"
	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// setupProxy creates a reverse proxy to a target URL
func setupProxy(targetURL string) http.HandlerFunc {
	url, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.FlushInterval = -1 // Ensure immediate flush for SSE

	// Modifikasi request agar path diteruskan dengan benar ke service downstream
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Set("X-Proxy", "API-Gateway")
		// SECURITY: Jangan percaya header actor dari klien; selalu turunkan dari JWT tervalidasi.
		req.Header.Del("X-Actor-ID")
		if actorID := customMiddleware.ActorIDFromContext(req.Context()); actorID != "" {
			req.Header.Set("X-Actor-ID", actorID)
		}
		if requestID := middleware.GetReqID(req.Context()); requestID != "" {
			req.Header.Set("X-Request-ID", requestID)
		}
		// Host harus diset ke URL target agar request tidak ditolak
		req.Host = url.Host
	}

	return func(w http.ResponseWriter, r *http.Request) {
		proxy.ServeHTTP(w, r)
	}
}

// SetupRouter mengonfigurasi dan mengembalikan Chi mux router
func SetupRouter(jwtMid *customMiddleware.JWTMiddleware, cfg *config.AppConfig) *chi.Mux {
	r := chi.NewRouter()

	// SECURITY: CORS strict setup
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"}, // TODO: Batasi di production sesuai domain resmi
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Middlewares bawaan Chi
	r.Use(middleware.RequestID) // Men-generate request_id untuk tracing
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)    // TODO: Ganti dengan Zap/Zerolog nanti
	r.Use(middleware.Recoverer) // Mencegah panic mematikan server

	// Endpoint publik
	r.Get("/health", handler.HealthCheckHandler)

	// Observability: Metrics Endpoint
	r.Handle("/metrics", promhttp.Handler())

	// API Versi 1
	r.Route("/api/v1", func(r chi.Router) {
		// Rute terproteksi (butuh token JWT Keycloak)
		r.Group(func(r chi.Router) {
			r.Use(jwtMid.RequireAuth)
			r.Get("/profile", handler.ProfileHandler)

			// Reverse Proxy ke Microservices
			// Master Data Service melalui DNS dan port internal Docker.
			r.Handle("/master-data/*", http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL)))
			r.Handle("/master-data", http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL)))
			r.Get("/master-data/deleted", http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL)).ServeHTTP)

			// Schedule Service melalui DNS dan port internal Docker.
			r.Handle("/schedule/*", http.StripPrefix("/api/v1/schedule", setupProxy(cfg.ScheduleURL)))
			r.Handle("/schedule", http.StripPrefix("/api/v1/schedule", setupProxy(cfg.ScheduleURL)))

			// Audit Service (Port 8084)
			r.Handle("/audit/*", http.StripPrefix("/api/v1/audit", setupProxy(cfg.AuditURL)))
			r.Handle("/audit", http.StripPrefix("/api/v1/audit", setupProxy(cfg.AuditURL)))

			// Livescore Service (Port 8083) - Hanya admin/koresponden yang boleh mengupdate skor
			r.Handle("/livescore/*", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)))
			r.Handle("/livescore", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)))
			// Medal Standing Service (Port 8086)
			r.Handle("/medals/*", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)))
			r.Handle("/medals", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)))

			// Venue Service Protected Routes (POST, PUT, DELETE)
			r.Post("/venues", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
			r.Post("/venues/*", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
			r.Put("/venues", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
			r.Put("/venues/*", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
			r.Delete("/venues", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
			r.Delete("/venues/*", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
			r.Get("/venues/deleted", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
		})

		// Rute Terbuka (Public)
		// Realtime Gateway Service (Port 8085) - Penonton mengakses ini tanpa token

		r.Handle("/stream/*", http.StripPrefix("/api/v1/stream", setupProxy(cfg.RealtimeURL)))
		r.Handle("/stream", http.StripPrefix("/api/v1/stream", setupProxy(cfg.RealtimeURL)))

		// Public Venue Service (GET)
		r.Get("/venues/*", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
		r.Get("/venues", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)

		// Public Master Data Service (GET)
		r.Get("/master-data/*", http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL)).ServeHTTP)
	})

	// Rute Static File Uploads (Public)
	masterDataOrigin, _ := url.Parse(cfg.MasterDataURL)
	masterDataOrigin.Path = ""
	r.Handle("/uploads/*", setupProxy(masterDataOrigin.String()))

	return r
}
