package messaging

import (
	"log"
	"os"

	"github.com/nats-io/nats.go"
)

var nc *nats.Conn
var js nats.JetStreamContext

// InitNATS initializes a singleton NATS JetStream connection
func InitNATS() error {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:14222"
	}

	var err error
	nc, err = nats.Connect(natsURL)
	if err != nil {
		return err
	}

	js, err = nc.JetStream()
	if err != nil {
		return err
	}

	// Create stream if not exists
	_, err = js.AddStream(&nats.StreamConfig{
		Name:     "AUDIT_EVENTS",
		Subjects: []string{"audit.>"},
	})
	if err != nil {
		log.Printf("Catatan: %v (Diabaikan jika stream sudah ada)", err)
	}

	log.Println("Berhasil terhubung ke NATS JetStream")
	return nil
}

// PublishEvent sends a message to the specified subject
func PublishEvent(subject string, data []byte) error {
	if js == nil {
		log.Println("Peringatan: NATS JetStream belum diinisialisasi, pesan diabaikan.")
		return nil
	}
	_, err := js.Publish(subject, data)
	if err != nil {
		log.Printf("Gagal mem-publish event ke %s: %v", subject, err)
	}
	return err
}

// GetJetStream returns the initialized JetStream context for subscribing
func GetJetStream() nats.JetStreamContext {
	return js
}

// Close gracefully closes the NATS connection
func Close() {
	if nc != nil {
		nc.Close()
	}
}
