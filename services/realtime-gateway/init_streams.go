//go:build initstreams

package main

import (
	"log"
	"os"

	"context"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

func main() {
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

	ctx := context.Background()

	// Create LIVESCORE
	_, err = js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     "LIVESCORE",
		Subjects: []string{"livescore.update.>"},
	})
	if err != nil {
		log.Printf("Failed to create LIVESCORE stream: %v", err)
	} else {
		log.Println("Created LIVESCORE stream")
	}

	// Create MEDALS
	_, err = js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     "MEDALS",
		Subjects: []string{"realtime.medals"},
	})
	if err != nil {
		log.Printf("Failed to create MEDALS stream: %v", err)
	} else {
		log.Println("Created MEDALS stream")
	}
}
