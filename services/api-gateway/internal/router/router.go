package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/api-gateway/internal/handler"
	customMiddleware "github.com/porprov-xv/porprov-depok/services/api-gateway/internal/middleware"
)

// SetupRouter mengonfigurasi dan mengembalikan Chi mux router
func SetupRouter(jwtMid *customMiddleware.JWTMiddleware) *chi.Mux {
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

	// API Versi 1
	r.Route("/api/v1", func(r chi.Router) {
		// Rute terproteksi (butuh token JWT Keycloak)
		r.Group(func(r chi.Router) {
			r.Use(jwtMid.RequireAuth)
			r.Get("/profile", handler.ProfileHandler)
		})
	})

	return r
}
