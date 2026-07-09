package router

import (
	"net/http"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/porprov-xv/porprov-depok/services/venue-service/internal/handler"
)

func New(venueHandler *handler.VenueHandler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
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
		r.Get("/{id}", venueHandler.GetVenue)
		r.Put("/{id}", venueHandler.UpdateVenue)
		r.Delete("/{id}", venueHandler.DeleteVenue)
	})

	return r
}
