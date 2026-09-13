FROM golang:1.26.6-alpine3.24 AS builder

RUN apk add --no-cache git
WORKDIR /src
RUN git init \
    && git remote add origin https://github.com/prometheus/prometheus.git \
    && git fetch --depth 1 origin refs/tags/v3.13.3 \
    && test "$(git rev-parse FETCH_HEAD)" = "b48aa66338a457726cfb7db6455fbbe175d27ba9" \
    && test "$(git rev-parse 'FETCH_HEAD^{commit}')" = "b273ae3adeb64ad630d65ef7f16440df95658410" \
    && git checkout --detach b273ae3adeb64ad630d65ef7f16440df95658410 \
    && go get google.golang.org/grpc@v1.83.2 \
    && git config user.name porprov-build \
    && git config user.email build@porprov.invalid \
    && git add go.mod go.sum \
    && git commit -m "build: patch dependencies for PORPROV image" \
    && git tag v0.313.3-porprov.1 \
    && CGO_ENABLED=0 GOOS=linux go build -trimpath -tags "netgo,stringlabels,remove_all_sd" \
       -ldflags="-s -w -X github.com/prometheus/common/version.Version=3.13.3-porprov.1 -X github.com/prometheus/common/version.Revision=b273ae3adeb64ad630d65ef7f16440df95658410" \
       -o /out/prometheus ./cmd/prometheus \
    && CGO_ENABLED=0 GOOS=linux go build -trimpath -tags "netgo,stringlabels,remove_all_sd" \
       -ldflags="-s -w -X github.com/prometheus/common/version.Version=3.13.3-porprov.1 -X github.com/prometheus/common/version.Revision=b273ae3adeb64ad630d65ef7f16440df95658410" \
       -o /out/promtool ./cmd/promtool

FROM prom/prometheus:v3.13.3-distroless
LABEL org.opencontainers.image.version="3.13.3-porprov.1" \
      org.opencontainers.image.revision="b273ae3adeb64ad630d65ef7f16440df95658410"
COPY --from=builder /out/prometheus /bin/prometheus
COPY --from=builder /out/promtool /bin/promtool
COPY infra/docker/prometheus/prometheus.yml /etc/prometheus/prometheus.yml
