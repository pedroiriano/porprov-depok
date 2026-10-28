FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
COPY packages/portal-config/ /src/packages/portal-config/
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
