# Runbook: Overhaul UI/UX Web Admin (Lokal)

## Ringkasan Eksekutif
Penyempurnaan visual, tata letak, stabilitas muat (*zero CLS*), dan ergonomi interaksi pada aplikasi Web Admin (`apps/admin-web-react`) dilakukan secara menyeluruh dalam 3 fase berbasis tema kanonikal **Cuba Admin Dashboard** (`docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md`, `ADR-0015`, dan `ADMIN_LANGUAGE_STYLE_GUIDE.md`). Seluruh implementasi bersifat *clean-room*, mempertahankan kontrak API, RBAC, dan audit outbox yang ada.

---

## Rincian Perubahan per Fase

### FASE 1: Estetika Dasbor, Stat Cards & Hirarki Ruang Kerja
- **File Terdampak:** `apps/admin-web-react/src/pages/DashboardOverview.tsx`, `apps/admin-web-react/src/components/cuba/CubaAdminShell.tsx`
- **Penyempurnaan:**
  1. `OverviewCard`: elevasi mikro saat hover (`hover:-translate-y-0.5 hover:shadow-md`), chip aksen kategori (`Cabor`, `Arena`, `Katalog`, `Daerah`), tipografi tabular numerik, dan skeleton shimmer saat `loading` untuk mencegah lonjakan tata letak (CLS).
  2. Tombol Perbarui: Ikon `RefreshCw` berputar (`animate-spin`) dinamis saat memuat data dengan label informatif `"Memperbarui..."` dan penguncian tombol (`disabled`) saat aktif.
  3. Jadwal Terdekat: 3-baris skeleton shimmer, pemisahan jelas antara Cabor tebal dan Nomor Pertandingan, chip tanggal dan jam pertandingan berikon `Clock` (`WIB`), serta status pill semantik (`finished`: emerald, `ongoing`: blue pulse, `delayed`: rose, `scheduled`: slate).
  4. Log Aktivitas Terkini: Ikon aksi tematik berbingkai (`Plus` hijau untuk buat, `Pencil` biru untuk ubah/koreksi, `ShieldCheck` royal untuk verifikasi/resmi, `Trash2` mawar untuk arsip/tolak, `RotateCcw` ungu untuk pulihkan), penanda aktor tegas (`Operator` vs `Sistem`), dan skeleton placeholder saat memuat.
  5. Shell Cuba: Penambahan emblem bawah ringkas (`XV`) saat sidebar diciutkan (84px) dan indikator denyut hijau hidup (`animate-pulse`) pada badge `"Sistem siap"`.

### FASE 2: Standardisasi Tabel Data, FilterBar & Skeleton Shimmer Anti-CLS
- **File Terdampak:** `apps/admin-web-react/src/components/cuba/AdminDataTable.tsx`, `apps/admin-web-react/src/components/cuba/AdminPrimitives.tsx`, `apps/admin-web-react/src/components/common/TableControls.tsx`, serta modul master data (`CabangOlahraga.tsx`, `VenueDepok.tsx`, `Kontingen.tsx`, `NomorTanding.tsx`, `JadwalPertandingan.tsx`, `CityGuide.tsx`).
- **Penyempurnaan:**
  1. `AdminDataTable`: Implementasi native **Skeleton Row Shimmer** langsung di dalam `<tbody>` yang mempertahankan `<table>`, `<caption>`, dan `<thead>` dengan kolom dan tombol pengurutan tetap di posisinya saat memuat data (`loading = true`). Seluruh 15 modul admin otomatis menikmati transisi loading yang mulus dan bebas hentakan.
  2. `AdminRowAction`: Komponen aksi baris terpadu berbingkai Cuba (`.admin-cuba-icon-button`), elevasi hover tactile, dan tone warna semantik (`default`, `primary`, `danger`, `warning`).
  3. `RowsPerPageSelector`: Penataan kontrol pemilih baris `min-h-11`, teks tebal `font-bold text-sm`, kontur border `rounded-xl`, dan ikon panah `ChevronDown` yang rapi.

### FASE 3: Harmonisasi Status Badges, Form Modal & Ergonomi Mobile Popover
- **File Terdampak:** `apps/admin-web-react/src/components/cuba/AdminPrimitives.tsx`, `apps/admin-web-react/src/hooks/useModalDialog.ts`, `apps/admin-web-react/src/components/cuba/cuba-admin.css`, `apps/admin-web-react/src/components/cuba/CubaAdminShell.tsx`, `ScoreWorkspace.tsx`, `RoleManagement.tsx`, `CityGuideCategories.tsx`, `CabangOlahraga.tsx`, `VenueDepok.tsx`, `JadwalPertandingan.tsx`.
- **Penyempurnaan:**
  1. `AdminBadge`: Primitif status pill semantik baku (`success`, `info`, `warning`, `danger`, `neutral`) dengan border halus, bobot `font-black`, dan radius kapsul penuh (`rounded-full px-2.5 py-0.5 text-xs`). Diterapkan konsisten di seluruh tabel modul admin.
  2. Auto-focus Form Modal: `useModalDialog` secara cerdas memprioritaskan fokus pada input isian pertama formulir (`form input, form select, form textarea`) saat modal dibuka, bukan tombol tutup silang (`&times;`), mempercepat alur pengetikan operator.
  3. Mobile Popovers: `.admin-cuba-popover` di layar ponsel (<640px) dilengkapi batas vertikal dinamis `max-height: calc(100dvh - 5.5rem)` dan `overflow-y: auto`, mencegah terpotong oleh notch layar atau URL bar browser.
  4. Popover Notifikasi: Penyediaan empty state ilustratif yang elegan berikon lonceng saat tidak ada notifikasi baru, serta skeleton shimmer saat daftar notifikasi dimuat ulang.

---

## Verifikasi Kualitas

Seluruh gate verifikasi kualitas lulus dengan exit code 0:
1. `npm run check:language --prefix apps/admin-web-react`: PASS (string antarmuka Admin mematuhi larangan istilah non-resmi).
2. `npm run check:contract --prefix apps/admin-web-react`: PASS (kontrak OpenAPI Web Platform valid).
3. `npm run build --prefix apps/admin-web-react`: PASS (TypeScript tsc -b dan Vite bundling selesai dalam ~6.8 detik).
4. `npm run test:session --prefix apps/admin-web-react`: 4 passed, 0 failed.
5. `npm run test:media-url --prefix apps/admin-web-react`: 3 passed, 0 failed.
