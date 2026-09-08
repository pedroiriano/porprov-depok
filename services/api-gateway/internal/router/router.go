package router

import (
	"bytes"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/config"
	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/handler"
	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

const upstreamErrorBody = `{"error":{"code":"UPSTREAM_ERROR","message":"Layanan sementara tidak tersedia"}}`

var (
	httpRequestsTotal   = promauto.NewCounterVec(prometheus.CounterOpts{Name: "porprov_gateway_http_requests_total", Help: "Jumlah request API Gateway menurut route dan kelas status."}, []string{"method", "route", "status_class"})
	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{Name: "porprov_gateway_http_request_duration_seconds", Help: "Durasi request API Gateway.", Buckets: prometheus.DefBuckets}, []string{"method", "route"})
	uploadFailuresTotal = promauto.NewCounter(prometheus.CounterOpts{Name: "porprov_gateway_upload_failures_total", Help: "Jumlah unggahan media yang gagal pada API Gateway."})
)

func requestMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		wrapped := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(wrapped, r)
		route := chi.RouteContext(r.Context()).RoutePattern()
		if route == "" {
			route = "unmatched"
		}
		status := wrapped.Status()
		if status == 0 {
			status = http.StatusOK
		}
		statusClass := strconv.Itoa(status/100) + "xx"
		httpRequestsTotal.WithLabelValues(r.Method, route, statusClass).Inc()
		httpRequestDuration.WithLabelValues(r.Method, route).Observe(time.Since(started).Seconds())
		if r.URL.Path == "/api/v1/master-data/media/upload" && status >= http.StatusBadRequest {
			uploadFailuresTotal.Inc()
		}
	})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// SECURITY: API Gateway tetap aman ketika port diagnostik lokal dipakai
		// tanpa edge Nginx. Nginx production menormalisasi header yang sama.
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'none'; style-src 'none'; sandbox")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}

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
		// SECURITY: Detail error database/service tidak boleh melewati boundary
		// API Gateway; client hanya menerima kontrak error yang stabil.
		if response.StatusCode >= http.StatusInternalServerError {
			_ = response.Body.Close()
			body := []byte(upstreamErrorBody)
			response.Body = io.NopCloser(bytes.NewReader(body))
			response.ContentLength = int64(len(body))
			response.Header.Set("Content-Length", strconv.Itoa(len(body)))
			response.Header.Set("Content-Type", "application/json; charset=utf-8")
			response.Header.Set("Cache-Control", "no-store")
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
		actorUsername, actorDisplayName := customMiddleware.ActorIdentityFromContext(req.Context())
		if actorUsername != "" {
			req.Header.Set("X-Actor-Username", actorUsername)
		}
		if actorDisplayName != "" {
			req.Header.Set("X-Actor-Display-Name", actorDisplayName)
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

func serviceBaseURL(rawURL string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return rawURL
	}
	parsed.Path = ""
	parsed.RawPath = ""
	parsed.RawQuery = ""
	parsed.Fragment = ""
	return strings.TrimRight(parsed.String(), "/")
}

// SetupRouter mengonfigurasi dan mengembalikan Chi mux router
func SetupRouter(jwtMid *customMiddleware.JWTMiddleware, cfg *config.AppConfig) *chi.Mux {
	r := chi.NewRouter()
	analyticsHandler := handler.NewAnalyticsHandler(cfg.UmamiURL, cfg.UmamiUsername, cfg.UmamiPassword, cfg.UmamiWebsiteID)
	integrationHealthHandler := handler.NewIntegrationHealthHandler(cfg)
	permissionAuthorizer := customMiddleware.NewPermissionAuthorizer(cfg.UserURL)
	r.Use(securityHeaders)
	r.Use(middleware.RequestSize(12 << 20))

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
	r.Use(requestMetrics)
	r.Use(middleware.Logger)    // TODO: Ganti dengan Zap/Zerolog nanti
	r.Use(middleware.Recoverer) // Mencegah panic mematikan server

	// Endpoint publik
	r.Get("/health", handler.HealthCheckHandler)

	// Observability: Metrics Endpoint
	r.Handle("/metrics", promhttp.Handler())

	// API Versi 1
	r.Route("/api/v1", func(r chi.Router) {
		// INFO: Landing Page hanya membaca satu projection Hero aktif tanpa membuka endpoint mutasi.
		r.Get("/master-data/heroes/active", http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL)).ServeHTTP)

		// Rute terproteksi (butuh token JWT Keycloak)
		r.Group(func(r chi.Router) {
			r.Use(jwtMid.RequireAuth)
			permissionOnly := permissionAuthorizer.RequirePermission
			r.With(permissionAuthorizer.RequireActive).Get("/profile", handler.ProfileHandler)
			r.With(permissionOnly("dashboard.view")).Get("/analytics/overview", analyticsHandler.Overview)
			r.With(permissionOnly("integration.view")).Get("/integrations/health", integrationHealthHandler.ServeHTTP)

			// INFO: Draft form selalu dibatasi pada subject token oleh User Service.
			draftProxy := setupProxy(serviceBaseURL(cfg.UserURL))
			r.With(permissionAuthorizer.RequireActive).Handle("/drafts", draftProxy)

			// User Management Service: setiap mutasi diperiksa dengan izin aksi.
			userProxy := setupProxy(cfg.UserURL)
			r.With(permissionOnly("user.view")).Get("/users", userProxy.ServeHTTP)
			r.With(permissionOnly("user.view")).Get("/users/{id}", userProxy.ServeHTTP)
			r.With(permissionOnly("user.create")).Post("/users", userProxy.ServeHTTP)
			r.With(permissionOnly("user.update")).Put("/users/{id}", userProxy.ServeHTTP)
			r.With(permissionOnly("user.status")).Put("/users/{id}/status", userProxy.ServeHTTP)
			r.With(permissionOnly("user.restore")).Post("/users/{id}/restore", userProxy.ServeHTTP)
			r.With(permissionOnly("user.archive")).Delete("/users/{id}", userProxy.ServeHTTP)
			userBaseProxy := setupProxy(serviceBaseURL(cfg.UserURL))
			r.With(permissionOnly("role.view")).Get("/access-roles", userBaseProxy)
			r.With(permissionOnly("role.view")).Get("/access-roles/permissions", userBaseProxy)
			r.With(permissionOnly("role.create")).Post("/access-roles", userBaseProxy.ServeHTTP)
			r.With(permissionOnly("role.update")).Put("/access-roles/{id}", userBaseProxy.ServeHTTP)
			r.With(permissionOnly("role.status")).Put("/access-roles/{id}/status", userBaseProxy.ServeHTTP)
			r.With(permissionOnly("role.restore")).Post("/access-roles/{id}/restore", userBaseProxy.ServeHTTP)
			r.With(permissionOnly("role.archive")).Delete("/access-roles/{id}", userBaseProxy.ServeHTTP)
			r.Handle("/authorization/session", userBaseProxy)
			r.With(permissionOnly("audit.view")).Post("/user-directory/lookup", userBaseProxy.ServeHTTP)
			r.With(permissionOnly("notification.view")).Handle("/notifications", userBaseProxy)
			r.With(permissionOnly("notification.view")).Handle("/notifications/*", userBaseProxy)

			// SECURITY: Permission granular adalah otoritas final agar peran kustom
			// memiliki enforcement yang sama dengan peran bawaan.
			masterDataProxy := http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL))
			r.With(permissionOnly("city_guide.view")).Get("/master-data/city-guides/manage", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.view")).Get("/master-data/city-guide-categories/manage", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.view")).Get("/master-data/city-guide-categories/manage/deleted", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.create")).Post("/master-data/city-guide-categories/manage", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.update")).Put("/master-data/city-guide-categories/manage/{id}", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.update")).Put("/master-data/city-guide-categories/manage/{id}/status", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.restore")).Post("/master-data/city-guide-categories/manage/{id}/restore", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("city_guide.archive")).Delete("/master-data/city-guide-categories/manage/{id}", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("master_data.restore")).Get("/master-data/deleted", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("master_data.restore")).Post("/master-data/deleted/{entity}/{id}/restore", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("media.view")).Get("/master-data/media", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("media.view")).Get("/master-data/media/policy", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("media.create")).Post("/master-data/media/upload", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("media.archive")).Delete("/master-data/media/{id}", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("master_data.view")).Get("/master-data/heroes", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("master_data.view")).Get("/master-data/heroes/{id}", masterDataProxy.ServeHTTP)
			r.With(permissionOnly("master_data.create")).Method(http.MethodPost, "/master-data/*", masterDataProxy)
			r.With(permissionOnly("master_data.update")).Method(http.MethodPut, "/master-data/*", masterDataProxy)
			r.With(permissionOnly("master_data.archive")).Method(http.MethodDelete, "/master-data/*", masterDataProxy)

			scheduleProxy := http.StripPrefix("/api/v1/schedule", setupProxy(cfg.ScheduleURL))
			r.With(permissionOnly("master_data.restore")).Get("/schedule/deleted", scheduleProxy.ServeHTTP)
			r.With(permissionOnly("master_data.restore")).Get("/schedule/matches/deleted", scheduleProxy.ServeHTTP)
			r.With(permissionOnly("master_data.restore")).Post("/schedule/matches/{id}/restore", scheduleProxy.ServeHTTP)
			r.With(permissionOnly("master_data.create")).Method(http.MethodPost, "/schedule/*", scheduleProxy)
			r.With(permissionOnly("master_data.update")).Method(http.MethodPut, "/schedule/*", scheduleProxy)
			r.With(permissionOnly("master_data.archive")).Method(http.MethodDelete, "/schedule/*", scheduleProxy)

			// Audit immutable hanya dapat dibaca role audit/super admin.
			r.With(permissionOnly("audit.view")).Handle("/audit/*", http.StripPrefix("/api/v1/audit", setupProxy(cfg.AuditURL)))
			r.With(permissionOnly("audit.view")).Handle("/audit", http.StripPrefix("/api/v1/audit", setupProxy(cfg.AuditURL)))

			// Livescore Service (Port 8083) - Hanya admin/koresponden yang boleh mengupdate skor
			r.With(permissionOnly("livescore.view")).Get("/livescore/*", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)).ServeHTTP)
			r.With(permissionOnly("livescore.view")).Get("/livescore", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)).ServeHTTP)
			r.With(permissionOnly("livescore.manage")).Method(http.MethodPost, "/livescore/*", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)))
			r.With(permissionOnly("livescore.manage")).Method(http.MethodPut, "/livescore/*", http.StripPrefix("/api/v1/livescore", setupProxy(cfg.LivescoreURL)))

			// Workflow Medali: koresponden submit, verifikator memeriksa, super admin memublikasikan.
			r.With(permissionOnly("medal.create")).Post("/medals/add", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(permissionOnly("medal.create")).Post("/medals/submissions", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(permissionOnly("medal.view")).Get("/medals/submissions", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(permissionOnly("medal.verify")).Post("/medals/submissions/{submissionID}/verify", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(permissionOnly("medal.verify")).Post("/medals/submissions/{submissionID}/reject", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)
			r.With(permissionOnly("medal.publish")).Post("/medals/submissions/{submissionID}/publish", http.StripPrefix("/api/v1/medals", setupProxy(cfg.MedalsURL)).ServeHTTP)

			// Private SSE memakai JWT di edge dan shared token hanya pada hop internal.
			privateStreamProxy := setupProxyWithHeaders(cfg.RealtimeURL, map[string]string{"X-Internal-Stream-Token": cfg.InternalStreamToken})
			r.With(permissionOnly("dashboard.view")).Get("/stream/admin/events", http.StripPrefix("/api/v1/stream", privateStreamProxy).ServeHTTP)

			venueProxy := http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL))
			r.With(permissionOnly("venue.create")).Post("/venues", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.create")).Post("/venues/*", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.update")).Put("/venues", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.restore")).Post("/venues/{id}/restore", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.update")).Put("/venues/*", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.archive")).Delete("/venues", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.archive")).Delete("/venues/*", venueProxy.ServeHTTP)
			r.With(permissionOnly("venue.restore")).Get("/venues/deleted", venueProxy.ServeHTTP)
		})

		// Rute Terbuka (Public)
		// Realtime Gateway Service (Port 8085) - Penonton mengakses ini tanpa token

		r.Handle("/stream/*", http.StripPrefix("/api/v1/stream", setupProxy(cfg.RealtimeURL)))
		r.Handle("/stream", http.StripPrefix("/api/v1/stream", setupProxy(cfg.RealtimeURL)))

		// Public Venue Service (GET)
		r.Get("/venues/*", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)
		r.Get("/venues", http.StripPrefix("/api/v1/venues", setupProxy(cfg.VenueURL)).ServeHTTP)

		// Public Master Data Service (GET) memakai allowlist; endpoint editorial,
		// tombstone, Media Library, dan mutasi tidak boleh ikut terbuka oleh wildcard.
		publicMasterData := http.StripPrefix("/api/v1/master-data", setupProxy(cfg.MasterDataURL))
		r.Get("/master-data/cabors", publicMasterData.ServeHTTP)
		r.Get("/master-data/cabors/{id}", publicMasterData.ServeHTTP)
		r.Get("/master-data/nomor-tandings", publicMasterData.ServeHTTP)
		r.Get("/master-data/nomor-tandings/{id}", publicMasterData.ServeHTTP)
		r.Get("/master-data/kontingens", publicMasterData.ServeHTTP)
		r.Get("/master-data/kontingens/{id}", publicMasterData.ServeHTTP)
		r.Get("/master-data/city-guides", publicMasterData.ServeHTTP)
		r.Get("/master-data/city-guides/{id}", publicMasterData.ServeHTTP)
		r.Get("/master-data/city-guide-categories", publicMasterData.ServeHTTP)

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
