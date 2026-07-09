package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/handler"
)

func SetupRouter(masterDataHandler *handler.MasterDataHandler, cityGuideHandler *handler.CityGuideHandler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status": "master-data-service is healthy"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/cabors", func(r chi.Router) {
			r.Post("/", masterDataHandler.CreateCabor)
			r.Get("/", masterDataHandler.ListCabors)
			r.Get("/{id}", masterDataHandler.GetCabor)
			r.Put("/{id}", masterDataHandler.UpdateCabor)
			r.Delete("/{id}", masterDataHandler.DeleteCabor)
		})
		r.Route("/kontingens", func(r chi.Router) {
			r.Post("/", masterDataHandler.CreateKontingen)
			r.Get("/", masterDataHandler.ListKontingens)
			r.Get("/{id}", masterDataHandler.GetKontingen)
			r.Put("/{id}", masterDataHandler.UpdateKontingen)
			r.Delete("/{id}", masterDataHandler.DeleteKontingen)
		})
		r.Route("/city-guides", func(r chi.Router) {
			r.Post("/", cityGuideHandler.CreateCityGuide)
			r.Get("/", cityGuideHandler.ListCityGuides)
			r.Get("/{id}", cityGuideHandler.GetCityGuide)
			r.Put("/{id}", cityGuideHandler.UpdateCityGuide)
			r.Delete("/{id}", cityGuideHandler.DeleteCityGuide)
		})
		r.Route("/media", func(r chi.Router) {
			r.Post("/upload", masterDataHandler.UploadMedia)
			r.Get("/", masterDataHandler.ListMedia)
			r.Delete("/{id}", masterDataHandler.DeleteMedia)
		})
	})

	// Serve uploaded files statically
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	return r
}
