package router

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/handler"
	"net/http"
)

func New(venueHandler *handler.VenueHandler) *chi.Mux {
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

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	r.Route("/api/v1/venues", func(r chi.Router) {
		r.Post("/", venueHandler.CreateVenue)
		r.Get("/", venueHandler.ListVenues)
		r.Get("/deleted", venueHandler.ListDeletedVenues)
		r.Post("/{id}/restore", venueHandler.RestoreVenue)
		r.Get("/{id}", venueHandler.GetVenue)
		r.Put("/{id}", venueHandler.UpdateVenue)
		r.Delete("/{id}", venueHandler.DeleteVenue)
	})

	return r
}
