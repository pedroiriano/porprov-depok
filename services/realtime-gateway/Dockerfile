FROM golang:1.26-alpine AS builder
WORKDIR /src/services/realtime-gateway
COPY services/realtime-gateway/go.mod services/realtime-gateway/go.sum ./
RUN go mod download
COPY services/realtime-gateway/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/realtime-gateway .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/realtime-gateway /usr/local/bin/realtime-gateway
USER porprov
EXPOSE 8085
ENTRYPOINT ["/usr/local/bin/realtime-gateway"]
