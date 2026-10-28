FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
COPY packages/portal-config/ /src/packages/portal-config/
WORKDIR /src
COPY packages/messaging/ packages/messaging/
COPY services/medal-standing-service/go.mod services/medal-standing-service/go.sum services/medal-standing-service/
WORKDIR /src/services/medal-standing-service
RUN go mod download
COPY services/medal-standing-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/medal-service .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget && addgroup -S porprov && adduser -S porprov -G porprov
COPY --from=builder /out/medal-service /usr/local/bin/medal-service
USER porprov
EXPOSE 8086
ENTRYPOINT ["/usr/local/bin/medal-service"]
