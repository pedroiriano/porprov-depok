# Gate Dependency Rilis Dokumen - 2 November 2026

Status source: TARGETED_PASS, CI final wajib PASS sebelum merge/deployment. Tidak ada exception, dismiss, penurunan threshold Low atau perubahan credential production.

## Remediasi

- GHSA-mrwp-f3q8-3g9p: follow-redirects 1.16.2 resmi pada empat aplikasi. Regresi cross-realm sensitiveHeaders dan redirect lintas origin melalui server loopback PASS.
- GHSA-3g3m-2fjr-6pw4: glob 14.0.2 resmi. Regresi abort pada readdir pertama membuktikan traversal anak tidak dilanjutkan.
- GHSA-g3hv-75wg-m249: seluruh matcher lama diganti adapter privat `packages/minimatch-compat`, yang menjalankan mesin resmi minimatch 11.0.4 melalui alias npm terpin dan integritas registry. Tidak ada kode matcher 3/10 yang disalin atau hanya diganti nama. Adapter menghubungkan callable CommonJS, namespace modern, Minimatch/match/defaults/filter/braceExpand dan kontrak `makeRe(...).test(...)` consumer lint saat ini. Predicate tersebut bukan RegExp terserialisasi; keterbatasan API serta cakupan consumer dijelaskan pada README paket. Tidak membangun kembali regex backtracking lama.

Npm install-links menyalin paket privat agar dependency engine ter-resolve konsisten pada Linux/Windows/Docker. Dua mobile memakai referensi langsung untuk deepmerge/decode; algoritme/provenance backport tetap sama. Lockfile mempertahankan dependency opsional lintas platform yang tidak terkait. Tidak memakai audit fix --force atau memperbarui framework.

## Bukti terarah

- Audit keempat aplikasi: nol Critical/High/Moderate/Low, tanpa exception.
- Lima regresi pada Public dan mobile Admin (sepuluh PASS): header lintas realm, graph engine patched/korporus pola, aturan ESLint impor/JSX aktual yang menolak pelanggaran dan menerima input normal, abort traversal, amplification worker berbatas memori/waktu.
- Public lint/typecheck/build serta mobile Admin lint/Expo compatibility/export PASS. Build-only proof pada standalone Public dan source map mobile PASS, mencakup matcher/adapter/engine. Regresi decoder dan deepmerge melalui consumer Expo aktual PASS.
- Hasil run awal a891687: 29 check PASS/4 audit FAIL; run 5a02ce0: tersisa tiga audit matcher legacy FAIL. Hasil historis tidak menggantikan required CI pada source final yang memuat adapter.
- SSH telah pulih: service ssh-agent lokal semula berhenti; aktivasi service yang sudah terpasang memuat key tersimpan dan canary host-key strict PASS. Tidak mengubah passphrase, password, authorized_keys, sshd, atau credential production. Registry tidak dibaca/didekripsi secara manual.
- Preflight: project production `docker`, 19 layanan aktif, Master v16/User v5/Schedule v6/Audit v3 clean; perubahan Nginx existing hanya dua rate directive (60r/s/burst100), ditambah line ending. Patch existing diamankan; kandidat mempertahankan baseline lebih ketat 10r/s/burst30. Backup baru/rehearsal/CI/reload/smoke tetap wajib.
- Browser lokal Work dinonaktifkan pada pemeriksaan sebelumnya; tidak mengklaim visual acceptance baru dari HTTP/source/build.

## Sumber primer

- https://github.com/advisories/GHSA-mrwp-f3q8-3g9p
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/advisories/GHSA-g3hv-75wg-m249
- Registry npm resmi: follow-redirects 1.16.2, glob 14.0.2, minimatch 11.0.4 (BlueOak-1.0.0); integritas tarball ada pada lockfile. Adapter sendiri MIT tanpa vendoring algoritme upstream.
