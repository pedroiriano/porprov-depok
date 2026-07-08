package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type LiveScoreUpdate struct {
	MatchID string `json:"matchId"`
	ScoreA  int    `json:"scoreA"`
	ScoreB  int    `json:"scoreB"`
	Status  string `json:"status"` // e.g., "Berlangsung", "Selesai"
}

func main() {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer nc.Close()

	js, err := jetstream.New(nc)
	if err != nil {
		log.Fatalf("Failed to create JetStream context: %v", err)
	}

	// Create stream if it doesn't exist
	_, err = js.CreateOrUpdateStream(context.Background(), jetstream.StreamConfig{
		Name:     "LIVESCORE",
		Subjects: []string{"livescore.update.>"},
	})
	if err != nil {
		log.Fatalf("Failed to create stream: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
	}))

	r.Post("/api/v1/livescore/update", func(w http.ResponseWriter, r *http.Request) {
		var payload LiveScoreUpdate
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if payload.MatchID == "" {
			http.Error(w, "matchId is required", http.StatusBadRequest)
			return
		}

		// Save to DB would be here (skipped for simplicity in this phase)

		// Publish to NATS JetStream
		eventData, _ := json.Marshal(payload)
		subject := "livescore.update." + payload.MatchID
		_, err = js.Publish(context.Background(), subject, eventData)
		if err != nil {
			log.Printf("Failed to publish event: %v", err)
			http.Error(w, "Failed to publish event", http.StatusInternalServerError)
			return
		}

		log.Printf("Published score update for match %s: %d - %d", payload.MatchID, payload.ScoreA, payload.ScoreB)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Score updated and published"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}

	log.Printf("Livescore Service running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
