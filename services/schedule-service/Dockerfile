FROM golang:1.26-alpine AS builder
WORKDIR /src
COPY packages/messaging/ packages/messaging/
COPY services/schedule-service/go.mod services/schedule-service/go.sum services/schedule-service/
WORKDIR /src/services/schedule-service
RUN go mod download
COPY services/schedule-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/schedule-service .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/schedule-service /usr/local/bin/schedule-service
USER porprov
EXPOSE 8082
ENTRYPOINT ["/usr/local/bin/schedule-service"]
