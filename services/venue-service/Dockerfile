FROM golang:1.26-alpine AS builder
WORKDIR /src
COPY packages/messaging/ packages/messaging/
COPY services/venue-service/go.mod services/venue-service/go.sum services/venue-service/
WORKDIR /src/services/venue-service
RUN go mod download
COPY services/venue-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/venue-service ./cmd/api

FROM alpine:3.21
RUN apk add --no-cache ca-certificates && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/venue-service /usr/local/bin/venue-service
USER porprov
EXPOSE 8087
ENTRYPOINT ["/usr/local/bin/venue-service"]
