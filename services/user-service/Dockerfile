FROM golang:1.26-alpine AS builder
WORKDIR /src
COPY packages/messaging/ packages/messaging/
COPY services/user-service/go.mod services/user-service/go.sum services/user-service/
WORKDIR /src/services/user-service
RUN go mod download
COPY services/user-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/user-service ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/user-service /usr/local/bin/user-service
USER porprov
ENV PORT=8001
EXPOSE 8001
ENTRYPOINT ["/usr/local/bin/user-service"]
