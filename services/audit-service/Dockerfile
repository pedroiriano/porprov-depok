FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
WORKDIR /src
COPY packages/messaging/ packages/messaging/
COPY services/audit-service/go.mod services/audit-service/go.sum services/audit-service/
WORKDIR /src/services/audit-service
RUN go mod download
COPY services/audit-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/audit-service ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/audit-service /usr/local/bin/audit-service
USER porprov
EXPOSE 8084
ENTRYPOINT ["/usr/local/bin/audit-service"]
