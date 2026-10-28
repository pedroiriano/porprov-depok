# Backport privat deepmerge untuk tooling Expo

Paket ini mempertahankan API CommonJS/TypeScript deepmerge 4.3.1 untuk dua consumer Expo SDK 57. Ini bukan release upstream atau exception audit.

Asal source: https://github.com/TehShrike/deepmerge/tree/5b87756a5671635679001cbac72aa42f23472c81. Hash SHA256 dist/cjs.js upstream sebelum modifikasi: 2e5160f84a1141bd927264afe4d15766f1e6cf07daef182b37ff53fea121de7d. Lisensi MIT upstream disertakan.

GHSA-gcqx-w48m-w2h4 tidak memiliki patched version upstream ketika backport disiapkan. Tiga penulisan properti destination diubah menjadi definisi own data property; hal ini mencegah pemanggilan setter __proto__ pada target null-prototype, primitive/placeholder, maupun target yang sudah mempunyai own __proto__. Nilai data/simbol, urutan properti, clone, arrayMerge/customMerge, .all, dan penanganan Date/RegExp/React tetap dipertahankan. Tidak mengubah Object.prototype global, membuang field konfigurasi biasa, atau mengklaim CVE upstream telah diterbitkan ulang.

Consumer harus benar-benar me-resolve paket privat ini melalui override; regression test wajib membuktikan prototype aman dan kompatibilitas modifikasi konfigurasi/plugin Expo aktual. Paket tidak dipakai oleh image VPS dan tidak boleh ditambahkan ke bundle aplikasi mobile tanpa kebutuhan baru.

Pemeliharaan: tinjau patch upstream ketika tersedia, verifikasi perilaku/security, lalu hapus backport melalui perubahan terarah. Jangan mengganti nama/version paket rentan semata-mata untuk menghilangkan alert tanpa pembuktian patch.
