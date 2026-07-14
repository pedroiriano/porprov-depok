FROM golang:1.26-alpine AS builder
WORKDIR /src/services/api-gateway
COPY services/api-gateway/go.mod services/api-gateway/go.sum ./
RUN go mod download
COPY services/api-gateway/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api-gateway .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/api-gateway /usr/local/bin/api-gateway
USER porprov
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/api-gateway"]
