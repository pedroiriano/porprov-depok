package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/handler"
)

func SetupRouter(matchHandler *handler.MatchHandler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Actor-ID", "X-Request-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status": "schedule-service is healthy"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/references/venue/{id}", matchHandler.ActiveVenueReference)
		r.Get("/references/nomor-tanding/{id}", matchHandler.ActiveNomorTandingReference)
		r.Route("/matches", func(r chi.Router) {
			r.Post("/", matchHandler.CreateMatch)
			r.Get("/", matchHandler.ListMatches)
			r.Get("/enriched", matchHandler.ListEnrichedMatches)
			r.Get("/deleted", matchHandler.ListDeletedMatches)
			r.Post("/{id}/restore", matchHandler.RestoreMatch)
			r.Get("/{id}", matchHandler.GetMatch)
			r.Get("/{id}/participants", matchHandler.ListMatchParticipants)
			r.Put("/{id}", matchHandler.UpdateMatch)
			r.Delete("/{id}", matchHandler.DeleteMatch)
		})
	})

	return r
}
