#!/bin/bash

echo "Memulai layanan infrastruktur Docker (PostgreSQL, Keycloak, dll)..."
cd infra/docker
docker-compose up -d
cd ../..

echo "Menunggu 5 detik agar database dan Keycloak siap..."
sleep 5

echo "Membuka API Gateway..."
start "API Gateway" bash -c "cd services/api-gateway && go run cmd/server/main.go"

echo "Membuka Master Data Service..."
start "Master Data Service" bash -c "cd services/master-data-service && go run cmd/server/main.go"

echo "Membuka Schedule Service..."
start "Schedule Service" bash -c "cd services/schedule-service && go run cmd/server/main.go"

echo "Membuka Realtime Gateway..."
start "Realtime Gateway" bash -c "cd services/realtime-gateway && go run main.go"

echo "Membuka Venue Service..."
start "Venue Service" bash -c "cd services/venue-service && go run cmd/api/main.go"

echo "Membuka Public Web NextJS (Frontend Publik)..."
start "Public Web" bash -c "cd apps/public-web-nextjs && npm run dev"

echo "Membuka Admin Web React (Frontend Admin)..."
start "Admin Web" bash -c "cd apps/admin-web-react && npm run dev"

echo "Semua layanan telah diluncurkan pada jendela masing-masing!"
echo ""
echo "Anda dapat mengakses:"
echo "- Public Web: http://localhost:3000 atau http://localhost:3001"
echo "- Admin Web: http://localhost:5173"
echo "- API Gateway: http://localhost:8080"
echo "- Keycloak Admin: http://localhost:8081"
