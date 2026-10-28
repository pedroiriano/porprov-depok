FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
COPY packages/portal-config/ /src/packages/portal-config/
WORKDIR /src/services/api-gateway
COPY services/api-gateway/go.mod services/api-gateway/go.sum ./
RUN go mod download
COPY services/api-gateway/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api-gateway .

FROM alpine:3.21
RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates \
    && addgroup -S porprov \
    && adduser -S porprov -G porprov
COPY --from=builder /out/api-gateway /usr/local/bin/api-gateway
USER porprov
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/api-gateway"]
