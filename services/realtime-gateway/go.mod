module porprov.id/realtime-gateway

go 1.26.10

require (
	github.com/go-chi/chi/v5 v5.4.0
	github.com/go-chi/cors v1.2.2
	github.com/nats-io/nats.go v1.53.1
	github.com/porprov-xv/porprov-depok/packages/portal-config v0.0.0
	github.com/redis/go-redis/v9 v9.21.0
)

replace github.com/porprov-xv/porprov-depok/packages/portal-config => ../../packages/portal-config

require (
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/klauspost/compress v1.20.0 // indirect
	github.com/nats-io/nkeys v0.4.15 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	go.uber.org/atomic v1.11.0 // indirect
	golang.org/x/crypto v0.56.0 // indirect
	golang.org/x/sys v0.47.0 // indirect
)
