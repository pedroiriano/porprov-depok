package router

import (
	portal "github.com/porprov-xv/porprov-depok/packages/portal-config"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/master-data-service/internal/handler"
)

func SetupRouter(masterDataHandler *handler.MasterDataHandler, cityGuideHandler *handler.CityGuideHandler, cityGuideCategoryHandler *handler.CityGuideCategoryHandler, heroHandler *handler.HeroHandler, portalHandlers ...*handler.PortalHandler) *chi.Mux {
	r := chi.NewRouter()
	if len(portalHandlers) > 0 {
		h := portalHandlers[0]
		r.Use(portal.Guard(h.LoadPublished, func(r *http.Request) bool { return r.Header.Get("X-Actor-ID") != "" }, true))
	}

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
	if len(portalHandlers) > 0 {
		h := portalHandlers[0]
		r.Get("/api/v1/portal/public", h.Public)
		r.Get("/api/v1/portal/manage", h.Manage)
		r.Put("/api/v1/portal/manage", h.Change("SAVE_DRAFT"))
		r.Post("/api/v1/portal/publish", h.Change("PUBLISH"))
		r.Post("/api/v1/portal/restore", h.Change("RESTORE"))
		r.Get("/api/v1/portal/history", h.History)
		r.Get("/api/v1/portal/history/{id}", h.Revision)
	}

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status": "master-data-service is healthy"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/deleted", masterDataHandler.ListDeleted)
		r.Post("/deleted/{entity}/{id}/restore", masterDataHandler.RestoreDeleted)
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
		r.Route("/nomor-tandings", func(r chi.Router) {
			r.Post("/", masterDataHandler.CreateNomorTanding)
			r.Get("/", masterDataHandler.ListNomorTandings)
			r.Get("/{id}", masterDataHandler.GetNomorTanding)
			r.Put("/{id}", masterDataHandler.UpdateNomorTanding)
			r.Delete("/{id}", masterDataHandler.DeleteNomorTanding)
		})
		r.Route("/city-guides", func(r chi.Router) {
			r.Post("/", cityGuideHandler.CreateCityGuide)
			r.Get("/", cityGuideHandler.ListCityGuides)
			r.Get("/manage", cityGuideHandler.ListManagedCityGuides)
			r.Put("/{id}/venue-pin", cityGuideHandler.PinCityGuideForVenues)
			r.Get("/{id}", cityGuideHandler.GetCityGuide)
			r.Put("/{id}", cityGuideHandler.UpdateCityGuide)
			r.Delete("/{id}", cityGuideHandler.DeleteCityGuide)
		})
		r.Get("/city-guide-categories", cityGuideCategoryHandler.ListPublic)
		r.Route("/city-guide-categories/manage", func(r chi.Router) {
			r.Get("/", cityGuideCategoryHandler.List)
			r.Get("/deleted", cityGuideCategoryHandler.ListDeleted)
			r.Post("/", cityGuideCategoryHandler.Create)
			r.Put("/{id}", cityGuideCategoryHandler.Update)
			r.Put("/{id}/status", cityGuideCategoryHandler.SetStatus)
			r.Post("/{id}/restore", cityGuideCategoryHandler.Restore)
			r.Delete("/{id}", cityGuideCategoryHandler.Archive)
		})
		r.Route("/media", func(r chi.Router) {
			r.Get("/policy", masterDataHandler.GetMediaPolicy)
			r.Post("/upload", masterDataHandler.UploadMedia)
			r.Get("/", masterDataHandler.ListMedia)
			r.Delete("/{id}", masterDataHandler.DeleteMedia)
		})
		r.Route("/heroes", func(r chi.Router) {
			r.Get("/active", heroHandler.GetActiveHero)
			r.Post("/", heroHandler.CreateHero)
			r.Get("/", heroHandler.ListHeroes)
			r.Get("/{id}", heroHandler.GetHero)
			r.Put("/{id}", heroHandler.UpdateHero)
			r.Delete("/{id}", heroHandler.DeleteHero)
		})
	})

	// SECURITY: Delivery media harus memverifikasi tombstone sebelum melayani file.
	r.Get("/uploads/{fileName}", masterDataHandler.ServeMedia)

	return r
}
