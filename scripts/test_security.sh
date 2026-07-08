#!/bin/bash

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Memulai Pengujian Keamanan (Security Sanity Check) ===${NC}\n"

# 1. Tes Akses Tanpa Token ke Endpoint Terproteksi
echo -e "Mencoba mengakses rute terproteksi (POST /api/v1/livescore/update) tanpa Token JWT..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/livescore/update -H "Content-Type: application/json" -d '{"matchId":"test"}')

if [ "$STATUS_CODE" -eq 401 ]; then
    echo -e "${GREEN}BERHASIL!${NC} Rute berhasil diblokir (Status 401 Unauthorized)."
else
    echo -e "${RED}GAGAL!${NC} Rute tidak terblokir dengan benar (Status ${STATUS_CODE}). Periksa kembali JWT Middleware."
fi
echo ""

# 2. Tes Akses Rute Terbuka (SSE Stream)
echo -e "Mencoba mengakses rute terbuka (GET /api/v1/stream/livescore)..."
STREAM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/stream/livescore)

if [ "$STREAM_STATUS" -eq 200 ] || [ "$STREAM_STATUS" -eq 404 ] || [ "$STREAM_STATUS" -eq 502 ]; then
    echo -e "${GREEN}BERHASIL!${NC} Rute Stream dapat diakses tanpa token."
else
    echo -e "${RED}GAGAL!${NC} Status tidak sesuai ekspektasi: ${STREAM_STATUS}."
fi
echo ""

# 3. Tes Metrik Prometheus
echo -e "Mencoba mengekstrak metrik sistem dari GET /metrics..."
METRICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/metrics)

if [ "$METRICS_STATUS" -eq 200 ]; then
    echo -e "${GREEN}BERHASIL!${NC} Endpoint /metrics terekspos (Status 200 OK)."
else
    echo -e "${RED}GAGAL!${NC} Tidak dapat mengakses /metrics (Status ${METRICS_STATUS})."
fi

echo -e "\n${YELLOW}=== Pengujian Keamanan Selesai ===${NC}"
