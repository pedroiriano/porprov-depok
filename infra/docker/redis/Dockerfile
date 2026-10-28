FROM redis@sha256:e7723ff73d963f5cc6d9c4643ea3d989527a402a319239054e9472a7fb9219a2
# SECURITY: Preserve the Redis 7.4.10 binary/data format; patch only Alpine packages.
RUN sha256sum /usr/local/bin/redis-server > /tmp/redis-binary.sha256 \
    && apk upgrade --no-cache \
    && sha256sum -c /tmp/redis-binary.sha256 \
    && rm /tmp/redis-binary.sha256
LABEL org.opencontainers.image.version="7.4.10-porprov.1"
