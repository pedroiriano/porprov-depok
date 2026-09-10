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
ARG VITE_ADMIN_CUBA_PHASE_1=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_ADMIN_CUBA_PHASE_1=$VITE_ADMIN_CUBA_PHASE_1
RUN npm run build

# SECURITY: gunakan runtime Nginx Alpine aktif dan pasang patch OS terbaru.
FROM nginx:alpine
RUN apk upgrade --no-cache
COPY apps/admin-web-react/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
