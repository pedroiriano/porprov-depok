package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/handler"
)

func SetupRouter(matchHandler *handler.MatchHandler, periods ...*handler.PeriodHandler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		// SECURITY: Service domain hanya mengizinkan origin pengembangan kanonis;
		// production mengaksesnya melalui API Gateway same-origin.
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://localhost:5174"},
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
		if len(periods) > 0 {
			p := periods[0]
			r.Get("/periods", p.List(false))
			r.Get("/periods/manage", p.List(true))
			r.Get("/periods/{id}/history", p.History)
			r.Post("/periods", p.Change("CREATE"))
			r.Put("/periods/{id}", p.Change("UPDATE"))
			r.Delete("/periods/{id}", p.Change("ARCHIVE"))
			r.Post("/periods/{id}/restore", p.Change("RESTORE"))
			r.Post("/periods/{id}/restore-revision", p.Change("RESTORE_REVISION"))
		}
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
