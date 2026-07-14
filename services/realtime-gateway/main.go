//go:build !initstreams

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/redis/go-redis/v9"
)

type LiveScoreUpdate struct {
	MatchID string `json:"matchId"`
	ScoreA  int    `json:"scoreA"`
	ScoreB  int    `json:"scoreB"`
	Status  string `json:"status"`
}

type Client struct {
	eventChan chan []byte
}

var (
	clients   = make(map[*Client]bool)
	clientsMu sync.Mutex
)

func broadcastEvent(data []byte) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	for client := range clients {
		select {
		case client.eventChan <- data:
		default:
			// Client channel is full, drop to avoid blocking
		}
	}
}

func main() {
	// Redis setup
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:16379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisURL,
		Password: "", // Set via env if needed
		DB:       0,
	})
	ctx := context.Background()

	// NATS setup
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:14222"
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

	// Consume messages from JetStream
	consumer, err := js.CreateOrUpdateConsumer(ctx, "LIVESCORE", jetstream.ConsumerConfig{
		Durable:       "realtime_gateway",
		FilterSubject: "livescore.update.>",
		AckPolicy:     jetstream.AckExplicitPolicy,
	})
	if err != nil {
		log.Fatalf("Failed to create consumer: %v", err)
	}

	go func() {
		cc, _ := consumer.Consume(func(msg jetstream.Msg) {
			data := msg.Data()
			subject := msg.Subject()

			// e.g. "livescore.update.m1"
			parts := strings.Split(subject, ".")
			if len(parts) >= 3 {
				matchID := parts[2]
				// Cache in Redis
				err := rdb.Set(ctx, "livescore:"+matchID, data, 24*time.Hour).Err()
				if err != nil {
					log.Printf("Failed to cache in Redis: %v", err)
				}
			}

			// Broadcast to SSE clients
			broadcastEvent(data)
			msg.Ack()
		})
		defer cc.Stop()
		select {}
	}()

	// Consume messages from JetStream for Medals
	medalConsumer, err := js.CreateOrUpdateConsumer(ctx, "MEDALS", jetstream.ConsumerConfig{
		Durable:       "realtime_gateway_medals",
		FilterSubject: "realtime.medals",
		AckPolicy:     jetstream.AckExplicitPolicy,
	})
	if err == nil {
		go func() {
			cc, _ := medalConsumer.Consume(func(msg jetstream.Msg) {
				data := msg.Data()

				// Cache in Redis for Medals (Optional, just keep latest)
				rdb.Set(ctx, "medals:latest", data, 24*time.Hour)

				// Broadcast to SSE clients
				broadcastEvent(data)
				msg.Ack()
			})
			defer cc.Stop()
			select {}
		}()
	} else {
		log.Printf("Warning: Failed to create medal consumer: %v", err)
	}

	// HTTP Server
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "Cache-Control"},
	}))

	r.Get("/api/v1/stream/events", func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		client := &Client{
			eventChan: make(chan []byte, 100),
		}

		clientsMu.Lock()
		clients[client] = true
		clientsMu.Unlock()

		defer func() {
			clientsMu.Lock()
			delete(clients, client)
			clientsMu.Unlock()
			close(client.eventChan)
		}()

		// Send initial state from Redis
		keys, _ := rdb.Keys(ctx, "livescore:*").Result()
		for _, key := range keys {
			data, err := rdb.Get(ctx, key).Bytes()
			if err == nil {
				fmt.Fprintf(w, "data: %s\n\n", data)
			}
		}

		medalData, err := rdb.Get(ctx, "medals:latest").Bytes()
		if err == nil {
			fmt.Fprintf(w, "data: %s\n\n", medalData)
		}

		flusher.Flush()

		// Listen for new events
		notify := r.Context().Done()
		for {
			select {
			case <-notify:
				return
			case eventData := <-client.eventChan:
				fmt.Fprintf(w, "data: %s\n\n", eventData)
				flusher.Flush()
			}
		}
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "28085"
	}

	log.Printf("Realtime Gateway running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
