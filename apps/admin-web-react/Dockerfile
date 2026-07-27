FROM node:24-alpine AS builder
WORKDIR /app
COPY apps/admin-web-react/package.json apps/admin-web-react/package-lock.json ./
# INFO: npm install is used because npm 11 resolves platform-specific Rolldown optional packages differently between Windows and Linux lockfile generation.
RUN npm install --include=optional --no-audit --no-fund
COPY apps/admin-web-react/ ./
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_OIDC_AUTHORITY=http://localhost:8080/realms/porprov
ARG VITE_OIDC_CLIENT_ID=porprov-admin-web
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/key.pem \
    -out /etc/nginx/certs/cert.pem \
    -subj "/C=ID/ST=Jawa Barat/L=Depok/O=Diskominfo/CN=10.11.5.80"
COPY apps/admin-web-react/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80 443
