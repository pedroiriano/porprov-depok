# Gate Dependency Rilis Dokumen - 2 November 2026

Status source: TARGETED_PASS, CI final wajib PASS sebelum merge/deployment. Tidak ada exception, dismiss, penurunan threshold Low atau perubahan credential production.

## Remediasi

- GHSA-mrwp-f3q8-3g9p: follow-redirects 1.16.2 resmi pada empat aplikasi. Regresi cross-realm sensitiveHeaders dan redirect lintas origin melalui server loopback PASS.
- GHSA-3g3m-2fjr-6pw4: glob 14.0.2 resmi. Regresi abort pada readdir pertama membuktikan traversal anak tidak dilanjutkan.
- GHSA-g3hv-75wg-m249: seluruh matcher lama diganti **paket registry minimatch 11.0.4 resmi dengan identitas dan integritas aslinya**. Adapter `@porprov/minimatch-compat` 1.0.0 terpisah hanya menghubungkan consumer lint legacy. Tidak ada kode matcher 3/10 yang disalin atau hanya diganti nama. Adapter menghubungkan callable CommonJS, namespace modern, Minimatch/match/defaults/filter/braceExpand dan kontrak `makeRe(...).test(...)` consumer lint saat ini. Predicate tersebut bukan RegExp terserialisasi; keterbatasan API serta cakupan consumer dijelaskan pada README paket. Tidak membangun kembali regex backtracking lama.

Npm install-links menyalin paket privat agar dependency engine ter-resolve konsisten pada Linux/Windows/Docker. Dua mobile memakai referensi langsung untuk deepmerge/decode; algoritme/provenance backport tetap sama. Lockfile mempertahankan dependency opsional lintas platform yang tidak terkait. Tidak memakai audit fix --force atau memperbarui framework.

## Bukti terarah

- Audit keempat aplikasi: nol Critical/High/Moderate/Low, tanpa exception.
- Lima regresi pada Public dan mobile Admin (sepuluh PASS): header lintas realm, graph engine patched/korporus pola, aturan ESLint impor/JSX aktual yang menolak pelanggaran dan menerima input normal, abort traversal, amplification worker berbatas memori/waktu.
- Public dan mobile Admin lint serta sepuluh regresi pada instalasi bersih canonical PASS. Build/export kandidat sebelumnya PASS; protected CI membangun ulang source canonical final. Build-only proof pada standalone Public dan source map mobile PASS, mencakup matcher/adapter/engine. Regresi decoder dan deepmerge melalui consumer Expo aktual PASS.
- Hasil run awal a891687: 29 check PASS/4 audit FAIL; run 5a02ce0: tersisa tiga audit matcher legacy FAIL. Hasil historis tidak menggantikan required CI pada source final yang memuat adapter.
- SSH telah pulih: service ssh-agent lokal semula berhenti; aktivasi service yang sudah terpasang memuat key tersimpan dan canary host-key strict PASS. Tidak mengubah passphrase, password, authorized_keys, sshd, atau credential production. Registry tidak dibaca/didekripsi secara manual.
- Preflight: project production `docker`, 19 layanan aktif, Master v16/User v5/Schedule v6/Audit v3 clean; perubahan Nginx existing hanya dua rate directive (60r/s/burst100), ditambah line ending. Patch existing diamankan; kandidat mempertahankan baseline lebih ketat 10r/s/burst30. Backup baru/rehearsal/CI/reload/smoke tetap wajib.
- Browser lokal Work dinonaktifkan pada pemeriksaan sebelumnya; tidak mengklaim visual acceptance baru dari HTTP/source/build.

## Sumber primer

- https://github.com/advisories/GHSA-mrwp-f3q8-3g9p
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/advisories/GHSA-g3hv-75wg-m249
- Registry npm resmi: follow-redirects 1.16.2, glob 14.0.2, minimatch 11.0.4 (BlueOak-1.0.0); integritas tarball ada pada lockfile. Adapter sendiri MIT tanpa vendoring algoritme upstream.

## Finalisasi identitas registry dan proses lint

Dependency review semula membaca alias file `node_modules/minimatch` versi adapter 1.0.0 sebagai package registry minimatch 1.0.0. Eksperimen menaikkan versi adapter dibatalkan setelah auto-review; tidak digunakan pada kandidat final. Solusi final memasang **minimatch resmi 11.0.4 dengan nama/versi/SRI registry asli**. Adapter tetap bernama `@porprov/minimatch-compat` 1.0.0 sebagai dependency terpisah dan memakai paket resmi tersebut.

Hook sinkron Node 24 hanya menghubungkan import minimatch dari consumer lint legacy yang telah diinventarisasi. `run-lint.mjs` menambahkan preload pada subprocess lint dan child-nya; build Next, export Expo serta runtime aplikasi tidak mengaktifkannya. Consumer modern menerima namespace upstream asli. Provenance dan regresi memeriksa hash adapter/hook, versi dan SRI registry serta batas scope. Tidak ada pengubahan metadata upstream, alias engine, exception, atau pemetaan vulnerability manual. Dokumentasi API primer: https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/module.md.
