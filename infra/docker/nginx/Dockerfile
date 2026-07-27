FROM nginx:alpine
RUN apk add --no-cache openssl
RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/key.pem \
    -out /etc/nginx/certs/cert.pem \
    -subj "/C=ID/ST=Jawa Barat/L=Depok/O=Diskominfo/CN=10.11.5.80"
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_params /etc/nginx/proxy_params
