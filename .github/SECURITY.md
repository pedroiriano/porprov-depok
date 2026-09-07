# Kebijakan Keamanan Portal PORPROV

## Versi yang Didukung

Branch `main` dan deployment production aktif adalah satu-satunya versi yang
menerima perbaikan keamanan. Branch eksperimen tidak boleh digunakan untuk
deployment.

## Melaporkan Kerentanan

Jangan membuat issue publik untuk kerentanan, credential, token, private key,
data pribadi, atau detail infrastruktur. Gunakan **Private vulnerability
reporting / Security Advisory** pada repository GitHub ini dan sertakan:

- endpoint/komponen terdampak;
- prasyarat dan langkah reproduksi minimal;
- dampak yang telah dikonfirmasi;
- bukti yang sudah disanitasi;
- saran mitigasi bila tersedia.

Jangan melakukan denial-of-service, brute force, pengambilan data, perubahan
data, atau pemindaian aktif terhadap production tanpa surat tugas dan scope
tertulis. Tim proyek akan melakukan triage, menyiapkan perbaikan di staging,
dan mengoordinasikan publikasi setelah deployment tervalidasi.

## Penanganan Secret

Secret yang pernah masuk Git harus dianggap bocor: rotasi/revoke lebih dahulu,
hapus dari source, lalu bersihkan histori secara terkoordinasi. Menambahkan file
ke `.gitignore` tidak menghapus secret dari commit lama.
