FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
COPY packages/portal-config/ /src/packages/portal-config/
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
