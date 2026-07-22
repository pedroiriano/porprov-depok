# PORPROV XV JAWA BARAT 2026 - KOTA DEPOK
## Dokumen Blueprint Arsitektur, Analisis, dan Desain Terpadu (Enterprise Standard)

> **Dokumen ini dirancang sebagai Standar Arsitektur Enterprise (Enterprise Architecture Standard) sekaligus acuan rekayasa sistem (*Prompt Knowledge Base*) untuk diintegrasikan pada model AI (ChatGPT, Gemini, Claude, dll) atau tim developer yang akan melanjutkan pengembangan proyek ini.**

---

## 1. KONTEKS BISNIS & PRODUK (BRD & PRD)

### 1.1. Visi Produk
Portal PORPROV XV Jawa Barat 2026 adalah platform informasi olahraga *realtime* yang menggabungkan publikasi resmi, navigasi *venue*, *LiveScore*, *standings* medali, galeri, rekomendasi tempat, dan *backend* operasional panitia dalam satu ekosistem Web dan Mobile berbasis *Microservices*.

### 1.2. Kebutuhan Pengguna & Role System
Aplikasi ini melayani berbagai *persona* dengan *Role-Based Access Control* (RBAC) ketat yang dikelola melalui **Keycloak (OAuth2/OpenID Connect)**.
1. **Pengunjung Publik:** Mengakses jadwal, *venue*, rute, *LiveScore*, klasemen medali, dan galeri secara anonim.
2. **Atlet / Ofisial:** Memerlukan akses cepat ke jadwal spesifik, penginapan terdekat, dan fasilitas medis.
3. **Koresponden LiveScore (Operator):** Menginput data skor secara *realtime* di setiap *venue* menggunakan aplikasi *mobile/PWA* (mendukung antrean *offline* jika koneksi terputus).
4. **Verifikator Cabor:** Mengesahkan hasil pertandingan dan menyetujui koreksi skor (*approval workflow*).
5. **Admin Humas:** Mengelola berita, galeri, dan rekomendasi tempat (*Coffee Shop*, Kuliner, Wisata).
6. **Super Admin / Admin TI:** Mengelola infrastruktur, akses pengguna, dan *Audit Log*.

### 1.3. Modul Utama (Scope)
- **Modul Publik:** Beranda, Informasi PORPROV (Maskot Toca & Toci), Daftar Cabang Olahraga, Jadwal Pertandingan Terpadu, Daftar Venue & Peta, Galeri Media, dan Rekomendasi Depok.
- **Modul Olahraga Realtime:** *LiveScore Center* (*Event-Driven*), Tabel Klasemen Medali (Standings), *Bracket & Rundown* Cabor.
- **Modul Admin (Backend Dashboard):** Master Data Management, Verifikasi Hasil, *Audit Logging*, Manajemen Konten (CMS).

---

## 2. SPESIFIKASI ARSITEKTUR PERANGKAT LUNAK (SRS & SDD)

Aplikasi dibangun dengan prinsip **Enterprise Microservices**, *Event-Driven Architecture (EDA)*, dan *Database-per-Service* untuk memastikan skalabilitas, keamanan, dan keandalan tinggi.

### 2.1. Teknologi Stack Final
*   **Arsitektur:** Microservices + Event-Driven.
*   **Public Web:** Next.js (App Router), React, TypeScript, PWA, Tailwind CSS v4.x sebagai mesin implementasi; Techwind adalah tema tunggal wajib.
*   **Admin Web:** React (Vite), TypeScript, Tailwind CSS, Dashboard Layout.
*   **Mobile Apps:** React Native + TypeScript.
*   **Backend Services:** Golang (Go 1.22+).
*   **Database:** PostgreSQL (terisolasi per *service*, diakses menggunakan `sqlc` + `pgxpool`).
*   **Event Broker:** NATS JetStream (untuk *message queuing* yang *durable* dan distribusi skor realtime).
*   **Cache & State:** Redis (untuk *caching*, *rate limiting*, dan antrean *non-critical*).
*   **Authentication/IAM:** Keycloak (OIDC/OAuth2 + JWT).
*   **Infrastruktur & Deployment:** Docker Compose (Development), Nginx, Prometheus + Grafana (Observability). Server *deployment* di VM Diskominfo Kota Depok.

### 2.2. Standar Aturan Backend & Database (CRITICAL)
1.  **Connection Pooling:** Seluruh servis Go **WAJIB** menggunakan `pgxpool` (bukan `pgx.Connect` langsung) untuk menghindari *deadlock* dan koneksi yang hang saat menerima *concurrent request*.
2.  **Soft Delete:** Semua operasi penghapusan data persisten **WAJIB** menggunakan mekanisme *soft-delete* (`deleted_at`, `deleted_by`). Tidak boleh menggunakan `HARD DELETE`. Data pada REST API *query* secara normal harus mem-filter `deleted_at IS NULL`.
3.  **Transactional Outbox & Event Publishing:** Perubahan data yang *critical* (seperti pengesahan skor/medali) harus memanfaatkan *transactional outbox pattern* menggunakan NATS JetStream agar konsistensi data lintas-servis (*eventual consistency*) terjamin.
4.  **Audit Log:** Setiap operasi penulisan (*insert, update, delete*) yang berdampak pada domain olahraga harus menyertakan entri *Audit Trail* (mencatat *user ID*, IP, waktu, *action*, dan alasan koreksi).

### 2.3. Topologi & Alokasi Port (Namespace: 28xxx)
Untuk memudahkan *debugging* secara terisolasi via *local host*, alokasi port dibuat spesifik agar tidak bentrok dengan Docker network. **DILARANG mengubah namespace port tanpa updating `AGENTS.md` dan `.env`**.

| Komponen | Port Canonical (Docker/Compose) | Port Host Debugging (go run lokal) |
| :--- | :--- | :--- |
| **Public Web (Next.js)** | 3000 | 3000 |
| **Admin Web (React/Vite)** | 5173 | 5173 |
| **API Gateway (Golang)** | 8000 | 28000 |
| **User Service** | internal | 28001 |
| **Master Data Service** | internal | 28081 |
| **Schedule Service** | internal | 28082 |
| **LiveScore Service** | internal | 28083 |
| **Audit Service** | internal | 28084 |
| **Realtime Gateway (SSE/WS)**| internal | 28085 |
| **Medal Service** | internal | 28086 |
| **Venue Service** | internal | 28087 |
| **Keycloak (Auth)** | 8080 | 8080 |
| **PostgreSQL** | 5432 | 15432 (Exposed) |
| **Redis** | 6379 | 16379 (Exposed) |
| **NATS JetStream** | 4222 / 8222 | 14222 / 18222 (Exposed) |

---

## 3. STANDAR UI/UX DAN WIREFRAME KONSEP

### 3.1. Tema Tunggal UI/UX
*   **Tema UI Wajib:** Hanya menggunakan `Techwind`—`theme-reference/HTML/Landing/dist/` untuk *Public* dan `theme-reference/HTML/Dashboard/dist/` untuk *Admin*—yang diadaptasi menjadi identitas desain olahraga PORPROV (energik, dinamis, *SEO-ready*).
*   **Larangan Tema Ganda:** Tema, template, design system visual, layout, tipografi, komponen bergaya, atau interaction language dari sumber lain dilarang. Tailwind CSS dan library hanya alat teknis; seluruh tampilan akhirnya wajib mengikuti Techwind.
*   **Prinsip Desain:**
    *   *Mobile-First* & Responsif.
    *   Kepadatan data olahraga diwujudkan melalui pola card, table, tabs, filter, dan hierarchy Techwind.
    *   *Micro-animations* interaktif tanpa mengurangi performa (*Core Web Vitals*: LCP < 2.5s).
    *   Aksesibilitas (WCAG 2.2 AA).
*   **Warna Utama:** Menggunakan token warna resmi PORPROV Depok (Merah, Emas, dan warna sekunder kontras tinggi).

### 3.2. Struktur Tampilan (Wireframe Mental Model)

#### A. Public Web Homepage (`/`)
*   **Header:** Logo, Navigasi Utama, Search.
*   **Hero Section:** Countdown, Maskot, CTA LiveScore.
*   **Live Now (Ticker):** Widget menampilkan skor olahraga secara *real-time* tanpa *refresh*.
*   **Standings Preview:** Top 3 Kontingen Klasemen Medali.
*   **Jadwal Hari Ini:** List interaktif (*filter* berdasarkan cabor & venue).
*   **Footer:** Informasi Aksesibilitas, Media Center, Sitemap.

#### B. Halaman Cabang Olahraga (`/cabor/[id]`)
*   **Header:** Identitas Cabor, Tautan ke Venue.
*   **Tabs:** [Ringkasan] [Jadwal] [LiveScore] [Bracket] [Hasil Akhir] [Galeri].
*   Data di-load secara *Server-Side Rendered (SSR)* melalui Next.js untuk menjaga performa SEO.

#### C. LiveScore Center (`/livescore`)
*   **Konsep:** *Dashboard* Publik berkinerja tinggi. Menerima *streaming* dari *Realtime Gateway* (menggunakan Server-Sent Events/SSE atau WebSockets).
*   **Match Detail Drawer:** Timeline waktu (Gol, Pelanggaran, Timeout, dll), Statistik pertandingan.

#### D. Venue & Maps (`/venues`)
*   **Integrasi Peta:** Menggunakan penyedia Maps (Google Maps API / Mapbox).
*   **Info:** Rute lokasi, Jadwal cabor spesifik di lokasi tersebut, dan Rekomendasi Titik Sekitar (Rumah Sakit, Coffee Shop).

#### E. Admin Dashboard (`/admin`)
*   **Navigasi:** Sidebar kiri dengan menu (Master Data, Venue, Skor, Media, Log).
*   **Form Input:** Wajib menyertakan *feedback* status (Loading, Error, Success), pengelolaan media menggunakan modal `MediaLibrary`.

---

## 4. PEDOMAN PENGEMBANGAN AI (AI PROMPTING GUIDELINES)

Dokumen ini berfungsi sebagai pedoman mutlak untuk agen AI. Jika AI diinstruksikan untuk menambah fitur atau melakukan *bug-fixing* pada portal PORPROV XV ini, AI **WAJIB**:
1.  **Membaca `RULES.md` dan `AGENTS.md`**: Mematuhi aturan protokol *Enterprise* PORPROV, tahapan konfirmasi sebelum lanjut (tidak boleh sembarang membuat fitur masif secara otomatis), dan konvensi *namespace port*.
2.  **Menulis Kode Secara Penuh (Full Code)**: Tidak menggunakan *placeholder* (seperti `...` atau `// kode sebelumnya`).
3.  **Mengutamakan Sinkronisasi Dokumen**: Setiap kali arsitektur berubah (misal menambah *service* baru), perbarui file `.env`, `docker-compose.yml`, dan perbarui file ini (`PORPROV_ENTERPRISE_BLUEPRINT.md`).
4.  **Menjaga Data Integritas**: Semua tipe kembalian JSON dari database Go harus disamakan *interface* Typescript-nya di *frontend*. (Misal: Data JSON `pgtype` di Go harus dipetakan dengan hati-hati saat menjadi properti *Typescript*).

---
*Dokumen blueprint ini mengkonsolidasikan seluruh aspek arsitektur dan bisnis yang sebelumnya tersebar di berbagai draf awal. Segala pengembangan mulai saat ini menggunakan dokumen ini dan `RULES.md` sebagai rujukan.*
