# Standar Engineering, UI/UX, dan Nonfungsional PORPROV v5

Status: **Normatif**

Tanggal berlaku: **6 September 2026**

Sumber aturan tertinggi: [`RULES.md`](../../RULES.md)

Dokumen ini menjelaskan cara menerapkan aturan v5. Jika terjadi konflik, `RULES.md` menang. Status implementasi nyata tetap dibaca dari `FEATURES.md`; keberadaan aturan tidak berarti fiturnya sudah tersedia.

## 1. Pola Kerja dan Klaim Kualitas

- Gunakan `Explore → Analyze → Plan → Execute → Verify → Refine` dengan discovery tertarget dan perubahan koheren terkecil.
- Pertahankan perilaku, data, dan perubahan working tree yang tidak terkait. Dilarang menyimpulkan ulang atau menimpa pekerjaan existing tanpa perbandingan.
- Target kualitas adalah **tidak ada defect yang diketahui pada scope yang diubah**. Klaim “bebas bug” hanya boleh diganti dengan acceptance criteria dan bukti uji yang terukur.
- Quality gate standar selalu mencakup format, lint/typecheck, test terkait, build modul terdampak, diff check, dan secret scan dasar.
- Pengujian keamanan spesifik risiko tetap wajib untuk auth, authorization, SSO, SQL/migration, upload, secret, dependency, public API, container, redirect, dan permission.
- Full DevSecOps—broad SAST, SBOM, Trivy, CodeQL, `govulncheck`, audit dependency penuh, provenance, ZAP, dan suite release—dijalankan hanya atas instruksi eksplisit atau pada release gate final.
- Commit/push hanya boleh dilakukan setelah quality gate standar lulus dan pengguna memberi otorisasi delivery eksplisit. Merge hanya setelah protected CI lulus pada SHA final dan pengguna memberi instruksi merge eksplisit. Deploy selalu memerlukan instruksi terpisah.

## 2. Format Prompt Kerja

Prompt lanjutan harus singkat, terarah, dan dapat disalin sebagai satu blok. Minimal memuat: tujuan, scope/path, constraint, acceptance criteria, verifikasi, dan kondisi berhenti. Kata “masterpiece” atau “kualitas dewa” harus diterjemahkan menjadi kriteria yang dapat diuji; jangan memakai klaim subjektif sebagai bukti selesai.

## 3. Otoritas Visual Terpisah

| Produk | Otoritas visual | Status dan batas |
|---|---|---|
| Public Web | Techwind 3.3.0, snapshot lokal `theme-reference/HTML/Landing/dist/` | Aktif; `index-business.html` pada upstream lokal menjadi referensi hero, bukan runtime dependency |
| Admin Web | Cuba Admin Dashboard, target snapshot lokal `theme-reference/Cuba/template/` | Target v5; implementasi dan penyalinan vendor diblokir sampai bukti lisensi tersedia |
| Mobile | Design tokens PORPROV dan pola tugas dari produk web terdekat | Tidak boleh menjadi salinan desktop atau membuat tema ketiga |

Folder `C:\Datas\Proyek\UI\techwind-pembelajaran\source` dan `C:\Datas\Proyek\UI\cuba-pembelajaran\template` hanya upstream read-only pada mesin pengembangan saat ini. Build, test, Docker, dan runtime PORPROV tidak boleh bergantung pada path di luar root repository. Setelah bukti lisensi diverifikasi, snapshot yang diperlukan harus diimpor secara terkontrol ke root, dicatat checksum/versinya, dan dijaga sebagai referensi vendor read-only.

“Sama persis” berarti fidelity terhadap struktur komponen, proporsi, hierarchy, density, spacing, responsive behavior, dan interaction pattern yang relevan. Brand, logo, demo copy, data tiruan, HTML/Gulp/vendor JavaScript mentah, serta identitas template tidak boleh masuk produk. Implementasi tetap berupa React/Next.js yang aksesibel dengan data dan identitas PORPROV.

Admin Techwind yang saat ini berjalan adalah baseline transisi dan rollback, bukan otoritas untuk layar Admin baru. Migrasi Cuba wajib bertahap di balik feature flag: tokens → shell → primitives → satu route representatif → visual/accessibility regression → route tersisa. Dilarang mengimpor global CSS Cuba dan Techwind secara bersamaan.

Pemetaan Admin rinci berada di [`ADMIN_CUBA_VISUAL_CONTRACT.md`](../uiux/ADMIN_CUBA_VISUAL_CONTRACT.md), sedangkan keputusan arsitekturnya berada di [`ADR-0015`](../adr/ADR-0015-split-ui-authority-techwind-public-cuba-admin.md).

## 4. Light/Dark, Aksesibilitas, dan Visual QA

- Class `.dark` adalah satu-satunya pemicu theme utility; preferensi sistem hanya menentukan nilai awal. Theme bootstrap harus berjalan sebelum render agar tidak terjadi flash tema.
- Kontras minimum WCAG 2.2 AA: 4,5:1 untuk teks normal dan 3:1 untuk teks besar atau grafis esensial.
- Semua komponen harus memiliki state loading, empty, error/retry, success, disabled, permission denied, offline/reconnect, dan destructive confirmation bila relevan.
- Keyboard, visible focus, semantic HTML, nama aksesibel, target sentuh minimal 44px, dan `prefers-reduced-motion` wajib dipertahankan.
- Perubahan visual diuji minimal pada viewport 390px dan 1440px, mode terang/gelap, tanpa horizontal overflow, gambar rusak, error Console, hydration mismatch, atau layout shift baru.

## 5. Kontrak `AdminDataTable`

Semua tabel operasional Admin harus memakai primitive React bersama, bukan ketergantungan wajib pada plugin jQuery DataTables. Kapabilitas minimum:

- pencarian/filter, sorting aksesibel dengan `aria-sort`, pagination server-side, dan pilihan 10/25/50/100 baris;
- checkbox per baris, select current page, multi-select lintas halaman yang eksplisit, serta state indeterminate;
- bulk action terotorisasi, idempotent, teraudit, dan untuk delete selalu soft delete;
- loading/empty/error/permission state, sticky header, overflow responsif, serta total/filter metadata stabil;
- density dan column visibility bersifat opsional serta tidak boleh menyembunyikan informasi kritis tanpa affordance.

Browser dilarang mengambil seluruh dataset hanya untuk melakukan pagination lokal. Selection lintas halaman harus memakai identitas stabil dan menampilkan jumlah target sebelum bulk action.

## 6. Kontrak Modal dan Form

- Modal form berada di tengah layar; pada mobile boleh full-screen. Gunakan portal, backdrop blur, body scroll lock, focus trap, initial focus, return focus, background inert, `aria-labelledby`, dan `aria-describedby`.
- Escape dan klik backdrop dapat menutup modal hanya saat aman. Modal tidak boleh tertutup ketika submit berjalan, dan form kotor harus memiliki guard kehilangan perubahan.
- Modal bertumpuk harus dikelola satu modal manager dengan z-index dan focus ownership deterministik.
- Validasi client memberi umpan balik cepat; server tetap menjadi otoritas untuk authorization, uniqueness, state transition, file policy, dan optimistic version. Error server memakai kode stabil yang dapat dipetakan ke field/form.
- Aksi submit harus tahan double-submit, menampilkan progress, dan mempunyai success/error recovery yang jelas.

## 7. Media, Draft, dan Riwayat Perubahan

### 7.1 Gambar Media Library

- Batas file sumber default 20 MiB; server memvalidasi ukuran, ekstensi, magic bytes, MIME, dimensi, dan decompression bomb.
- Pipeline mencoba optimasi lossless terlebih dahulu. Hasil final gambar baru maksimal **3.145.728 byte (3 MiB)**.
- Jika lossless tidak dapat memenuhi batas, UI harus meminta pengguna memilih kompresi lossy berkualitas tinggi atau membatalkan; sistem dilarang diam-diam menurunkan kualitas.
- Metadata minimal: checksum, MIME canonical, dimensi, ukuran, actor/ownership, waktu, dan relasi varian. Kebijakan media harus dapat dibaca UI dari API, bukan di-hardcode terpisah.
- Upload mengikuti quarantine/scan bila tersedia; nama file dan path tidak boleh dipercaya dari client.

### 7.2 Autosave Draft

- Draft memakai dua lapis: server draft berdasarkan `OIDC sub + resource/form key`, dengan IndexedDB terenkripsi-at-rest oleh platform browser sebagai fallback lokal yang tidak memuat secret/token.
- Autosave memakai debounce, status `Menyimpan/Tersimpan/Gagal`, retention, cleanup setelah submit sukses, dan audit lifecycle.
- Konflik antarperangkat menghasilkan `409` dengan pilihan compare/restore, bukan last-write-wins diam-diam.
- Data rahasia, credential, payment, dan token dilarang masuk draft.

### 7.3 Revision History

- Konten mutable yang penting menyimpan revision immutable berisi actor, waktu, alasan, nomor versi, dan snapshot atau diff terverifikasi.
- Restore selalu membuat revision baru; history lama tidak diubah atau dihapus.
- Update memakai optimistic locking. Audit security/operation dipisahkan dari revision history konten.
- Perubahan lintas service yang kritis memakai transaksi state + outbox dan consumer idempotent.

## 8. Keamanan

- Terapkan least privilege, deny-by-default RBAC, MFA Admin, OIDC Authorization Code + PKCE, session/cookie aman, CSRF sesuai model auth, CORS allowlist, rate limit, validation, encoding, parameterized query, dan secret manager.
- Setiap endpoint object-level memverifikasi actor terhadap resource; role saja tidak cukup bila ownership/scope berlaku.
- Upload, redirect, URL eksternal, webhook, dan rich text memiliki allowlist/policy server-side serta sanitasi yang diuji.
- Audit kritis append-only dan privacy-aware. Jangan mencatat token, password, connection string, private key, payload sensitif, atau data personal berlebih.
- Dependency dan image harus dipin, provenance dicatat pada release, serta credential historis dirotasi sebelum klaim aman.
- Threat model ringkas wajib dibuat untuk fitur auth, upload, SQL/migration, integrasi eksternal, realtime, dan bulk action.

## 9. Kecepatan dan Efisiensi

- Target Public: LCP ≤2,5 detik, INP ≤200 ms, CLS ≤0,1 pada p75; budget route harus dimonitor, bukan hanya diuji manual.
- Optimalkan image responsif, font self-hosted, code splitting, caching sesuai data, compression, query/index, connection pool, dan read-model lintas domain.
- Admin memprioritaskan time-to-task: server pagination, debounce/cancel request, optimistic UI hanya bila aman, dan virtualization untuk dataset besar.
- Dilarang menambah dependency besar, fetch N+1, polling agresif, atau bundle vendor hanya demi satu interaksi sederhana tanpa bukti kebutuhan.

## 10. Keandalan dan Operabilitas

- Timeout, retry ber-backoff+jitter, circuit breaker, idempotency key, graceful shutdown, health/readiness, dan bounded queue diterapkan sesuai dependency.
- Operasi panjang berjalan sebagai job server-side yang dapat dilanjutkan dan diamati; browser reconnect tidak boleh membatalkan pekerjaan.
- Backup/restore harus memiliki RPO/RTO yang disepakati dan drill berkala. Backup tanpa restore test bukan bukti pemulihan.
- Observability menautkan log, metric, dan trace memakai correlation/request ID. Target bertahap adalah OpenTelemetry + Prometheus/Grafana + Loki + Tempo.
- Integration Health Center bersifat read-only dan menampilkan status dependency tanpa membuka credential atau menjadi control plane tersembunyi.
- Release evidence mengikat commit SHA, image digest, migration version, checksum backup, dan hasil smoke/rollback.

## 11. SEO Public

- Gunakan SSR/SSG/ISR sesuai data, canonical URL, robots, sitemap, metadata unik, Open Graph/Twitter, structured data yang valid, semantic heading, alt text, dan internal linking.
- Tetapkan taxonomy dan slug canonical; perubahan slug mempertahankan history dan redirect permanen untuk mencegah link mati.
- Filter/search tidak boleh menciptakan index bloat. Thin/duplicate pages harus `noindex` atau dikonsolidasikan secara canonical.
- Preview/editorial workflow harus mencegah konten draft terindeks dan tidak boleh menampilkan data dummy sebagai fakta.

## 12. Praktik yang Diadopsi dari Teman Belajar

Praktik berikut menjadi arah PORPROV, tetapi status implementasinya harus dinilai terpisah di `FEATURES.md`:

1. source-of-truth matrix untuk UI, API, schema, runtime, dan deployment;
2. OpenAPI root contract-first serta contract compatibility test;
3. security matrix per environment dan threat model per fitur berisiko;
4. authoring draft recovery, revision history, dan unified data table;
5. media policy endpoint dan checksum/varian terkelola;
6. backup/restore drill dengan RPO/RTO;
7. evidence release berdasarkan commit SHA dan image digest;
8. OpenTelemetry, Loki, Tempo, dan Integration Health Center read-only;
9. centralized platform config dan notification center;
10. SEO taxonomy, slug history, thin-page policy, dan vendor regression test.

## 13. Definition of Done

Sebuah slice hanya selesai jika acceptance criteria terbukti, tidak ada defect diketahui pada scope, status `FEATURES.md` akurat, dokumentasi/ADR tersinkron, test proporsional lulus, tidak ada secret baru, data dan rollback terlindungi, dan bukti menyebut exact commit hanya bila benar-benar ada. Aturan ini tidak memberi izin otomatis untuk commit, push, merge, deploy, migrasi, atau akses VPS.
