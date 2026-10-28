FROM golang:1.26.10-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
COPY packages/portal-config/ /src/packages/portal-config/
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
