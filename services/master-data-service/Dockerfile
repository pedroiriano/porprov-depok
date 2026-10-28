FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
WORKDIR /src
COPY packages/portal-config/ packages/portal-config/
COPY packages/messaging/ packages/messaging/
COPY services/master-data-service/go.mod services/master-data-service/go.sum services/master-data-service/
WORKDIR /src/services/master-data-service
RUN go mod download
COPY services/master-data-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/master-data-service .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates && addgroup -S porprov && adduser -S porprov -G porprov
WORKDIR /app
RUN mkdir -p /app/uploads && chown -R porprov:porprov /app
COPY --from=builder /out/master-data-service /usr/local/bin/master-data-service
USER porprov
EXPOSE 8081
ENTRYPOINT ["/usr/local/bin/master-data-service"]
