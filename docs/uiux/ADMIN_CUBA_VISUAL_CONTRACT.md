# Kontrak Visual Admin Cuba PORPROV v1

Status: **Normatif untuk pekerjaan Admin baru; implementasi `BLOCKED_LICENSE_EVIDENCE`**

Tanggal: **6 September 2026**

## 1. Tujuan dan Batas

Cuba Admin Dashboard adalah otoritas visual target untuk `apps/admin-web-react`. Dokumen ini tidak mengizinkan penyalinan aset vendor sebelum lisensi diverifikasi dan tidak mengubah Admin Techwind yang sedang berjalan. Cuba dibaca sebagai referensi anatomi/layout/interaksi, lalu diimplementasikan sebagai komponen React PORPROV dengan kontrak API, OIDC, RBAC, audit, dan route existing tetap utuh.

## 2. Pemetaan Canonical

| Kebutuhan PORPROV | Referensi Cuba |
|---|---|
| Shell, sidebar, topbar, dashboard KPI | `dashboard-12.html` |
| Validasi form | `form-validation.html` |
| Tanggal | `datepicker.html` |
| Select kompleks | `select2.html` |
| Autocomplete | `typeahead.html` |
| Tabel data | `datatable-basic-init.html` |
| Grafik | `chart-apex.html` |
| Login/feedback dialog | `login_with_sweetalert.html` |
| Knowledge/operational help | `knowledgebase.html`, `faq.html` |
| Media | `gallery-masonry.html` |
| Rich text | `quilleditor.html` |

Referensi ini menentukan struktur dan perilaku, bukan pilihan library runtime. React primitive yang aksesibel lebih diutamakan daripada plugin jQuery/vendor JavaScript.

## 3. Primitive Wajib

- `AdminShell`, `Sidebar`, `Topbar`, `Breadcrumb`, `PageHeader`;
- `StatCard`, `StatusBadge`, `Alert`, `Toast`, `Tabs`;
- `AdminDataTable`, `FilterBar`, `BulkActionBar`, `Pagination`;
- `FormField`, `DateField`, `Combobox`, `Autocomplete`, `RichTextEditor`;
- `Modal`, `ConfirmDialog`, `Drawer`, `EmptyState`, `ErrorState`, `Skeleton`;
- `MediaGrid`, `MediaPicker`, dan `RevisionTimeline`.

Semua primitive memakai design tokens PORPROV, TypeScript props yang terdokumentasi, keyboard navigation, visible focus, dan state lengkap. Dilarang mengimpor stylesheet global Cuba ke runtime.

## 4. Strategi Migrasi

1. Verifikasi lisensi dan buat snapshot vendor lokal read-only ber-checksum.
2. Definisikan token PORPROV untuk light/dark tanpa mengubah kontrak runtime.
3. Implementasikan shell Cuba di balik feature flag dengan route yang sama.
4. Migrasikan primitives bersama (`AdminDataTable`, modal, form, feedback).
5. Uji satu route representatif yang memuat form, tabel, modal, dan RBAC.
6. Luluskan lint/typecheck/test/build, accessibility, visual QA 390/1440 light/dark, browser smoke, dan diff review.
7. Migrasikan route tersisa per slice dan pertahankan rollback sampai parity penuh.

## 5. Acceptance Criteria

- struktur dan proporsi sesuai referensi Cuba yang dipetakan, tanpa brand/demo content Cuba;
- tidak ada campuran global CSS Techwind/Cuba atau dependency pada path luar root;
- light/dark tidak flash, kontras WCAG 2.2 AA, responsive tanpa overflow;
- focus order, focus trap modal, Escape/backdrop rules, dan target sentuh benar;
- tabel memakai pagination server-side dan bulk action aman;
- login OIDC, role menu, protected routes, API Gateway, audit, draft, dan revision contract tidak rusak;
- tidak ada Console error/warning, hydration issue, broken image, atau regresi route;
- baseline Admin Techwind dapat dipulihkan sampai rollout Cuba dinyatakan final.
