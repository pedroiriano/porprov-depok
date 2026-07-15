FROM golang:1.26-alpine AS builder
WORKDIR /src/services/livescore-service
COPY services/livescore-service/go.mod services/livescore-service/go.sum ./
RUN go mod download
COPY services/livescore-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/livescore-service .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/livescore-service /usr/local/bin/livescore-service
USER porprov
EXPOSE 8083
ENTRYPOINT ["/usr/local/bin/livescore-service"]
