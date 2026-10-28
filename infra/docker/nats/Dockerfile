FROM golang:1.26.10-alpine3.24@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS builder
RUN apk add --no-cache git
WORKDIR /src
RUN git init \
    && git remote add origin https://github.com/nats-io/nats-server.git \
    && git fetch --depth 1 origin refs/tags/v2.10.29 \
    && test "$(git rev-parse FETCH_HEAD)" = f207139f7b9ba0cf3982da9b1db6af0af32bb445 \
    && test "$(git rev-parse 'FETCH_HEAD^{commit}')" = f91ddd892565760834f27404a92b80a57b8ec149 \
    && git checkout --detach f91ddd892565760834f27404a92b80a57b8ec149 \
    && go get golang.org/x/crypto@v0.56.0 github.com/klauspost/compress@v1.18.7 \
    && go mod tidy \
    && CGO_ENABLED=0 go build -trimpath -buildvcs=false -ldflags="-s -w" -o /out/nats-server .
FROM nats@sha256:b83efabe3e7def1e0a4a31ec6e078999bb17c80363f881df35edc70fcb6bb927
# SECURITY: Keep NATS server 2.10.29 and storage format; patch compiler/libraries and Alpine only.
RUN apk upgrade --no-cache
COPY --from=builder /out/nats-server /usr/local/bin/nats-server
LABEL org.opencontainers.image.version="2.10.29-porprov.1" \
      org.opencontainers.image.revision="f91ddd892565760834f27404a92b80a57b8ec149"
