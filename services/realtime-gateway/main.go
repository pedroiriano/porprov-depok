//go:build !initstreams

package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log"
	"net"
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
	scope     string
	ip        string
}

var (
	clients     = make(map[*Client]bool)
	clientsMu   sync.Mutex
	clientsByIP = make(map[string]int)
)

var requiredStreams = []jetstream.StreamConfig{
	{Name: "LIVESCORE", Subjects: []string{"livescore.update.>"}},
	{Name: "MEDALS", Subjects: []string{"realtime.medals"}},
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func streamTokenFromEnvironment() (string, error) {
	token := envOrDefault("INTERNAL_STREAM_TOKEN", "local-development-stream-token")
	environment := strings.ToLower(envOrDefault("APP_ENV", "development"))
	if environment == "production" || environment == "staging" {
		if len(token) < 32 || token == "local-development-stream-token" || strings.HasPrefix(token, "replace-with-") {
			return "", fmt.Errorf("INTERNAL_STREAM_TOKEN must be an explicit secret of at least 32 characters outside development")
		}
	}
	return token, nil
}

func scanRedisKeys(ctx context.Context, rdb *redis.Client, pattern string) []string {
	keys := make([]string, 0)
	var cursor uint64
	for {
		batch, nextCursor, err := rdb.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return keys
		}
		keys = append(keys, batch...)
		cursor = nextCursor
		if cursor == 0 {
			return keys
		}
	}
}

// INFO: Gateway memastikan stream yang dikonsumsi tersedia agar startup tidak
// bergantung pada urutan livescore-service atau initializer terpisah.
func ensureRequiredStreams(ctx context.Context, js jetstream.JetStream) error {
	for _, config := range requiredStreams {
		if _, err := js.CreateOrUpdateStream(ctx, config); err != nil {
			return fmt.Errorf("ensure stream %s: %w", config.Name, err)
		}
	}
	return nil
}

func broadcastEvent(data []byte) {
	publicData, isPublic := sanitizePublicEvent(data)
	clientsMu.Lock()
	defer clientsMu.Unlock()
	for client := range clients {
		payload := data
		if client.scope == "public" {
			if !isPublic {
				continue
			}
			payload = publicData
		}
		select {
		case client.eventChan <- payload:
		default:
			// Client channel is full, drop to avoid blocking
		}
	}
}

func sanitizePublicEvent(data []byte) ([]byte, bool) {
	var event map[string]interface{}
	if err := json.Unmarshal(data, &event); err != nil {
		return nil, false
	}
	eventType, _ := event["eventType"].(string)
	allowed := eventType == "LIVESCORE_UPDATED" || eventType == "LIVESCORE_CORRECTED" || eventType == "MEDAL_STANDING_UPDATED"
	if !allowed {
		return nil, false
	}
	// SECURITY: Identitas operator, request correlation, dan alasan koreksi hanya untuk stream admin.
	delete(event, "actor")
	delete(event, "requestId")
	delete(event, "correctionReason")
	delete(event, "correctionOf")
	sanitized, err := json.Marshal(event)
	return sanitized, err == nil
}

func requestIP(r *http.Request) string {
	if r.Header.Get("X-Proxy") == "API-Gateway" {
		if forwarded := strings.TrimSpace(r.Header.Get("X-Actor-IP")); net.ParseIP(forwarded) != nil {
			return forwarded
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

func streamHandler(rdb *redis.Client, ctx context.Context, scope, internalToken string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if scope == "admin" {
			provided := r.Header.Get("X-Internal-Stream-Token")
			if internalToken == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(internalToken)) != 1 || strings.TrimSpace(r.Header.Get("X-Actor-ID")) == "" {
				http.Error(w, "private stream authentication failed", http.StatusUnauthorized)
				return
			}
		}
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}
		ip := requestIP(r)
		client := &Client{eventChan: make(chan []byte, 100), scope: scope, ip: ip}
		clientsMu.Lock()
		if len(clients) >= 500 || clientsByIP[ip] >= 5 {
			clientsMu.Unlock()
			http.Error(w, "stream connection limit reached", http.StatusTooManyRequests)
			return
		}
		clients[client] = true
		clientsByIP[ip]++
		clientsMu.Unlock()
		defer func() {
			clientsMu.Lock()
			delete(clients, client)
			clientsByIP[ip]--
			if clientsByIP[ip] <= 0 {
				delete(clientsByIP, ip)
			}
			clientsMu.Unlock()
			close(client.eventChan)
		}()

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache, no-transform")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")
		fmt.Fprintf(w, "event: ready\ndata: {\"scope\":%q}\n\n", scope)

		keys := scanRedisKeys(ctx, rdb, "livescore:*")
		for _, key := range keys {
			if data, err := rdb.Get(ctx, key).Bytes(); err == nil {
				if scope == "public" {
					if sanitized, allowed := sanitizePublicEvent(data); allowed {
						data = sanitized
					} else {
						continue
					}
				}
				fmt.Fprintf(w, "data: %s\n\n", data)
			}
		}
		if data, err := rdb.Get(ctx, "medals:latest").Bytes(); err == nil {
			if scope == "public" {
				if sanitized, allowed := sanitizePublicEvent(data); allowed {
					data = sanitized
				} else {
					data = nil
				}
			}
			if len(data) > 0 {
				fmt.Fprintf(w, "data: %s\n\n", data)
			}
		}
		flusher.Flush()
		heartbeat := time.NewTicker(20 * time.Second)
		defer heartbeat.Stop()
		for {
			select {
			case <-r.Context().Done():
				return
			case <-heartbeat.C:
				fmt.Fprint(w, ": heartbeat\n\n")
				flusher.Flush()
			case eventData, open := <-client.eventChan:
				if !open {
					return
				}
				fmt.Fprintf(w, "data: %s\n\n", eventData)
				flusher.Flush()
			}
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
		Password: os.Getenv("REDIS_PASSWORD"),
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
	if err := ensureRequiredStreams(ctx, js); err != nil {
		log.Fatalf("Failed to prepare JetStream streams: %v", err)
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
		cc, consumeErr := consumer.Consume(func(msg jetstream.Msg) {
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
		if consumeErr != nil {
			log.Printf("Failed to start livescore consumer: %v", consumeErr)
			return
		}
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
			cc, consumeErr := medalConsumer.Consume(func(msg jetstream.Msg) {
				data := msg.Data()

				// Cache in Redis for Medals (Optional, just keep latest)
				rdb.Set(ctx, "medals:latest", data, 24*time.Hour)

				// Broadcast to SSE clients
				broadcastEvent(data)
				msg.Ack()
			})
			if consumeErr != nil {
				log.Printf("Failed to start medal consumer: %v", consumeErr)
				return
			}
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
		AllowedOrigins: []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"},
		AllowedMethods: []string{"GET", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "Cache-Control"},
	}))

	internalStreamToken, err := streamTokenFromEnvironment()
	if err != nil {
		log.Fatalf("Unsafe realtime configuration: %v", err)
	}
	r.Get("/api/v1/stream/events", streamHandler(rdb, ctx, "public", internalStreamToken))
	r.Get("/api/v1/stream/admin/events", streamHandler(rdb, ctx, "admin", internalStreamToken))

	port := os.Getenv("PORT")
	if port == "" {
		port = "28085"
	}

	log.Printf("Realtime Gateway running on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
