FROM golang:1.26.6-alpine3.24 AS gosu-builder

RUN apk add --no-cache git
WORKDIR /src
RUN git init \
    && git remote add origin https://github.com/tianon/gosu.git \
    && git fetch --depth 1 origin refs/tags/1.19 \
    && test "$(git rev-parse FETCH_HEAD)" = "6456aaa0f3c854d199d0f037f068eb97515b7513" \
    && git checkout --detach FETCH_HEAD \
    && go get golang.org/x/sys@v0.47.0 \
    && go mod tidy \
    && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/gosu .

FROM postgis/postgis:15-3.5-alpine
RUN apk upgrade --no-cache
COPY --from=gosu-builder /out/gosu /usr/local/bin/gosu
COPY infra/docker/postgres/init-multiple-databases.sh /docker-entrypoint-initdb.d/10-init-multiple-databases.sh
