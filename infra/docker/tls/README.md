# Sertifikat TLS Intranet

Folder ini adalah mount point sertifikat Nginx untuk deployment VPS.

- `server.crt` dan `server.key` dibuat di VPS, tidak pernah masuk Git.
- CA privat harus disimpan dan didistribusikan melalui kanal resmi Diskominfo.
- Untuk produksi dengan nama domain resmi, ganti sertifikat privat dengan sertifikat PKI resmi.
- File `*.crt`, `*.key`, `*.csr`, dan `*.srl` di folder ini diabaikan Git.
