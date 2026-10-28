FROM nginx:alpine
# SECURITY: ambil patch keamanan Alpine terbaru saat image edge dibangun.
RUN apk upgrade --no-cache \
    && apk add --no-cache 'curl>=8.23.0-r0' 'libcurl>=8.23.0-r0'
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_params /etc/nginx/proxy_params
COPY security_headers.conf /etc/nginx/security_headers.conf
