FROM nginx:alpine
# SECURITY: ambil patch keamanan Alpine terbaru saat image edge dibangun.
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_params /etc/nginx/proxy_params
COPY security_headers.conf /etc/nginx/security_headers.conf
