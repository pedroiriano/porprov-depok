module github.com/porprov-xv/porprov-depok/services/user-service

go 1.22

require (
	github.com/Nerzal/gocloak/v13 v13.9.0
	github.com/go-chi/chi/v5 v5.0.12
	github.com/go-chi/cors v1.2.1
	github.com/jackc/pgx/v5 v5.5.5
	github.com/porprov-xv/porprov-depok/packages/messaging v0.0.0-00010101000000-000000000000
)

require (
	github.com/go-resty/resty/v2 v2.7.0 // indirect
	github.com/golang-jwt/jwt/v5 v5.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/klauspost/compress v1.17.2 // indirect
	github.com/nats-io/nats.go v1.34.1 // indirect
	github.com/nats-io/nkeys v0.4.7 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	github.com/opentracing/opentracing-go v1.2.0 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/segmentio/ksuid v1.0.4 // indirect
	golang.org/x/crypto v0.18.0 // indirect
	golang.org/x/net v0.17.0 // indirect
	golang.org/x/sys v0.16.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)

replace github.com/porprov-xv/porprov-depok/packages/messaging => ../../packages/messaging
