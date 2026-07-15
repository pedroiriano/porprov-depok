package router

import (
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/handler"
	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// setupProxy creates a reverse proxy to a target URL
func setupProxyWithHeaders(targetURL string, trustedHeaders map[string]string) http.HandlerFunc {
	url, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.FlushInterval = -1 // Ensure immediate flush for SSE
	proxy.ModifyResponse = func(response *http.Response) error {
		// SECURITY: API Gateway adalah satu-satunya pemilik kebijakan CORS untuk browser.
		// Header CORS dari service downstream akan menghasilkan nilai ganda yang ditolak browser.
		for headerName := range response.Header {
			if strings.HasPrefix(strings.ToLower(headerName), "access-control-") {
				response.Header.Del(headerName)
			}
		}
		return nil
	}

	// Modifikasi request agar path diteruskan dengan benar ke service downstream
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Set("X-Proxy", "API-Gateway")
		// SECURITY: Jangan percaya header actor dari klien; selalu turunkan dari JWT tervalidasi.
		req.Header.Del("X-Actor-ID")
		req.Header.Del("X-Actor-IP")
		req.Header.Del("X-Internal-Stream-Token")
		if actorID := customMiddleware.ActorIDFromContext(req.Context()); actorID != "" {
			req.Header.Set("X-Actor-ID", actorID)
		}
		if host, _, splitErr := net.SplitHostPort(req.RemoteAddr); splitErr == nil {
			req.Header.Set("X-Actor-IP", host)
		}
		if requestID := middleware.GetReqID(req.Context()); requestID != "" {
			req.Header.Set("X-Request-ID", requestID)
		}
		for name, value := range trustedHeaders {
			req.Header.Set(name, value)
		}
		// Host harus diset ke URL target agar request tidak ditolak
		req.Host = url.Host
	}

	return func(w http.ResponseWriter, r *http.Request) {
		proxy.ServeHTTP(w, r)
	}
}

func setupProxy(targetURL string) http.HandlerFunc {
	return setupProxyWithHeaders(targetURL, nil)
}

// SetupRouter mengonfigurasi dan mengembalikan Chi mux router
func SetupRouter(jwtMid *customMiddleware.JWTMiddleware, cfg *config.AppConfig) *chi.Mux {
	r := chi.NewRouter()

	// SECURITY: CORS strict setup
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Middlewares bawaan Chi
	r.Use(middleware.RequestID) // Men-generate request_id untuk tracing
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

			// Audit immutable hanya dapat dibaca role audit/super admin.
			r.With(jwtMid.RequireAnyRole("super_admin", "auditor")).Handle("/audit/*", http.StripPrefix("/api/v1/audit", setupProxy(cfg.AuditURL)))
			r.With(jwtMid.RequireAnyRole("super_admin", "auditor")).Handle("/audit", http.StripPrefix("/api/v1/audit", setupProxy(cfg.AuditURL)))

			// Livescore Service (Port 8083) - Hanya admin/koresponden yang boleh mengupdate skor
			r.With(jwtMid.RequireAnyRole("super_admin", "koresponden")).Handle("/livescore/*", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)))
			r.With(jwtMid.RequireAnyRole("super_admin", "koresponden")).Handle("/livescore", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)))

			// Workflow Medali: koresponden submit, verifikator memeriksa, super admin memublikasikan.
			r.With(jwtMid.RequireAnyRole("super_admin", "koresponden")).Post("/medals/add", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(jwtMid.RequireAnyRole("super_admin", "koresponden")).Post("/medals/submissions", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(jwtMid.RequireAnyRole("super_admin", "koresponden", "verifikator")).Get("/medals/submissions", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(jwtMid.RequireAnyRole("super_admin", "verifikator")).Post("/medals/submissions/{submissionID}/verify", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(jwtMid.RequireAnyRole("super_admin", "verifikator")).Post("/medals/submissions/{submissionID}/reject", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(jwtMid.RequireAnyRole("super_admin")).Post("/medals/submissions/{submissionID}/publish", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)

			// Private SSE memakai JWT di edge dan shared token hanya pada hop internal.
			privateStreamProxy := setupProxyWithHeaders(cfg.RealtimeURL, map[string]string{"X-Internal-Stream-Token": cfg.InternalStreamToken})
			r.With(jwtMid.RequireAnyRole("super_admin", "koresponden", "verifikator", "auditor")).Get("/stream/admin/events", http.StripPrefix("/api/v1/stream", privateStreamProxy).ServeHTTP)

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

		// Public Schedule Service (GET)
		// INFO: Jadwal aktif adalah data publik. Endpoint deleted tetap ditolak oleh
		// Schedule Service karena proxy publik tidak pernah menyuntikkan X-Actor-ID.
		r.Get("/schedule/*", http.StripPrefix("/api/v1/schedule", setupProxy(cfg.ScheduleURL)).ServeHTTP)
		r.Get("/schedule", http.StripPrefix("/api/v1/schedule", setupProxy(cfg.ScheduleURL)).ServeHTTP)

		// Public Medal Standing Service (GET)
		// SECURITY: Mutasi medali tetap melewati route terproteksi di atas.
		r.Get("/medals/*", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
		r.Get("/medals", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)

		// Public LiveScore projection tidak memuat actor, request ID, atau alasan koreksi.
		r.Get("/livescore/public", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)).ServeHTTP)
	})

	// Rute Static File Uploads (Public)
	masterDataOrigin, _ := url.Parse(cfg.MasterDataURL)
	masterDataOrigin.Path = ""
	r.Handle("/uploads/*", setupProxy(masterDataOrigin.String()))

	return r
}
