package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/porprov-xv/porprov-depok/services/user-service/internal/handler"
)

func SetupRouter(userHandler *handler.UserHandler, draftHandler *handler.DraftHandler, enterpriseHandler *handler.EnterpriseHandler) *chi.Mux {
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
		w.Write([]byte(`{"status": "user-service is healthy"}`))
	})

	r.Route("/api/v1/users", func(r chi.Router) {
		r.Post("/", userHandler.CreateUser)
		r.Get("/", userHandler.ListUsers)
		r.Get("/{id}", userHandler.GetUser)
		r.Put("/{id}", userHandler.UpdateUser)
		r.Delete("/{id}", userHandler.DeleteUser)
		r.Put("/{id}/status", enterpriseHandler.SetUserStatus)
		r.Post("/{id}/restore", enterpriseHandler.RestoreUser)
	})

	r.Get("/api/v1/roles", userHandler.GetRoles)
	r.Route("/api/v1/access-roles", func(r chi.Router) {
		r.Get("/", enterpriseHandler.ListRoles)
		r.Get("/permissions", enterpriseHandler.ListPermissions)
		r.Post("/", enterpriseHandler.CreateRole)
		r.Put("/{id}", enterpriseHandler.UpdateRole)
		r.Put("/{id}/status", enterpriseHandler.SetRoleStatus)
		r.Post("/{id}/restore", enterpriseHandler.RestoreRole)
		r.Delete("/{id}", enterpriseHandler.ArchiveRole)
	})
	r.Get("/api/v1/authorization/session", enterpriseHandler.Session)
	r.Get("/api/v1/authorization/check", enterpriseHandler.CheckPermission)
	r.Post("/api/v1/user-directory/lookup", enterpriseHandler.LookupUserDirectory)
	r.Route("/api/v1/notifications", func(r chi.Router) {
		r.Get("/", enterpriseHandler.ListNotifications)
		r.Put("/read-all", enterpriseHandler.MarkAllNotificationsRead)
		r.Put("/{id}/read", enterpriseHandler.MarkNotificationRead)
	})

	r.Route("/api/v1/drafts", func(r chi.Router) {
		r.Get("/", draftHandler.Get)
		r.Put("/", draftHandler.Save)
		r.Delete("/", draftHandler.Delete)
	})

	return r
}
