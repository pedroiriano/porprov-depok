@echo off
echo Memulai layanan infrastruktur Docker (PostgreSQL, Keycloak, dll)...
cd infra\docker
docker-compose up -d
cd ..\..

echo Menunggu 5 detik agar database dan Keycloak siap...
timeout /t 5 /nobreak

echo Membuka API Gateway...
start "API Gateway" cmd /k "cd services\api-gateway && go run main.go"

echo Membuka Master Data Service...
start "Master Data Service" cmd /k "cd services\master-data-service && go run main.go"

echo Membuka Schedule Service...
start "Schedule Service" cmd /k "cd services\schedule-service && go run main.go"

echo Membuka Realtime Gateway...
start "Realtime Gateway" cmd /k "cd services\realtime-gateway && go run main.go"

echo Membuka Venue Service...
start "Venue Service" cmd /k "cd services\venue-service && go run cmd\api\main.go"

echo Membuka Public Web NextJS (Frontend Publik)...
start "Public Web" cmd /k "cd apps\public-web-nextjs && npm run dev"

echo Membuka Admin Web React (Frontend Admin)...
start "Admin Web" cmd /k "cd apps\admin-web-react && npm run dev"

echo Semua layanan telah diluncurkan pada jendela masing-masing!
echo.
echo Anda dapat mengakses:
echo - Public Web: http://localhost:3000 atau http://localhost:3001
echo - Admin Web: http://localhost:5173
echo - API Gateway: http://localhost:8080
echo - Keycloak Admin: http://localhost:8081
echo.
echo Jangan tutup jendela terminal baru yang terbuka jika ingin layanan tetap berjalan.
pause
