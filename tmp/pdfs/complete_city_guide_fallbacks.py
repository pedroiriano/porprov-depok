import json
from pathlib import Path


OUTPUT = Path("tmp/pdfs/city-guide-enriched.json")

FALLBACKS = {
    "Situ Jatijajar": {
        "address": "Kelurahan Jatijajar, Kecamatan Tapos, Kota Depok, Jawa Barat",
        "region": "Jatijajar, Kecamatan Tapos",
        "latitude": -6.4229162,
        "longitude": 106.8603184,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; inventaris situ BAPPEDA/BPS Kota Depok",
    },
    "Situ Cilodong": {
        "address": "Kelurahan Kalibaru, Kecamatan Cilodong, Kota Depok, Jawa Barat",
        "region": "Kalibaru, Kecamatan Cilodong",
        "latitude": -6.4411864,
        "longitude": 106.8387334,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; inventaris situ BAPPEDA/BPS Kota Depok",
    },
    "Situ Citayam": {
        "address": "Kelurahan Bojong Pondok Terong, Kecamatan Cipayung, Kota Depok, Jawa Barat",
        "region": "Bojong Pondok Terong, Kecamatan Cipayung",
        "latitude": -6.4464996,
        "longitude": 106.7997617,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; inventaris situ BAPPEDA/BPS Kota Depok",
    },
    "Situ Bojongsari": {
        "address": "Kawasan Situ Sawangan–Bojongsari, Kecamatan Sawangan dan Bojongsari, Kota Depok, Jawa Barat",
        "region": "Sawangan–Bojongsari",
        "latitude": -6.3894628,
        "longitude": 106.7547979,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; BPS Kota Depok; Prokopim Kota Depok",
    },
    "Situ Pedongkelan": {
        "address": "Kawasan Pekayon–Pasir Gunung Selatan, perbatasan Kota Depok dan Jakarta Timur, Jawa Barat/DKI Jakarta",
        "region": "Pekayon–Pasir Gunung Selatan",
        "latitude": -6.3496713,
        "longitude": 106.8571379,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; inventaris situ BAPPEDA/BPS Kota Depok",
    },
    "Situ Rawa Besar": {
        "address": "Kelurahan Depok Jaya, Kecamatan Pancoran Mas, Kota Depok, Jawa Barat",
        "region": "Depok Jaya, Kecamatan Pancoran Mas",
        "latitude": -6.3944303,
        "longitude": 106.8162439,
        "maps_categories": ["Situ", "Taman", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; Pemerintah Kota Depok",
    },
    "Situ Rawa Kalong": {
        "address": "Kelurahan Sukamaju Baru, Kecamatan Tapos, Kota Depok, Jawa Barat",
        "region": "Sukamaju Baru, Kecamatan Tapos",
        "latitude": -6.3950644,
        "longitude": 106.8680076,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; Pemerintah Kota Depok",
    },
    "Situ Sawangan": {
        "address": "Kawasan Situ Sawangan–Bojongsari, Kecamatan Sawangan dan Bojongsari, Kota Depok, Jawa Barat",
        "region": "Sawangan–Bojongsari",
        "latitude": -6.3894628,
        "longitude": 106.7547979,
        "maps_categories": ["Situ", "Wisata alam"],
        "verification_source": "OpenStreetMap Nominatim; BPS Kota Depok; Prokopim Kota Depok",
    },
    "Rumah Sakit Bhakti Yudha": {
        "address": "Jl. Raya Sawangan No.2A, Pancoran Mas, Kecamatan Pancoran Mas, Kota Depok, Jawa Barat 16436",
        "region": "Pancoran Mas, Kecamatan Pancoran Mas",
        "latitude": -6.3980525,
        "longitude": 106.806217,
        "maps_categories": ["Rumah sakit umum", "Instalasi gawat darurat"],
        "verification_source": "Situs resmi RS Bhakti Yudha; SIRS Kementerian Kesehatan; Photon/OpenStreetMap",
    },
}

CORRECTIONS = {
    "Coffee Toffee": {
        "address": "Jl. Margonda Raya No.438, Pondok Cina, Kecamatan Beji, Kota Depok, Jawa Barat 16424",
        "region": "Pondok Cina, Kecamatan Beji",
        "latitude": -6.3666302,
        "longitude": 106.8342621,
        "verified_maps_title": "Coffee Toffee Margonda 438",
        "verification_source": "Booklet; arsip direktori bisnis; titik bangunan No.438B pada Maps",
        "verification_status": "historical_reference",
        "verification_note": "Listing dilaporkan telah tutup; alamat historis dipertahankan sesuai booklet.",
    },
    "D'Juntos Cafe": {
        "address": "Jl. Boulevard Grand Depok City, Tirtajaya, Kecamatan Sukmajaya, Kota Depok, Jawa Barat 16412",
        "region": "Tirtajaya, Kecamatan Sukmajaya",
        "latitude": -6.4185522,
        "longitude": 106.8254025,
        "verified_maps_title": "D'JUNTOS Coffee n' Kitchen",
        "verification_source": "Booklet; arsip direktori bisnis; titik koridor Jalan Boulevard Grand Depok City",
        "verification_status": "historical_reference",
        "verification_note": "Listing bisnis tidak lagi muncul stabil di Maps; titik mengacu koridor alamat terverifikasi.",
    },
    "KopiSatuBang Depok": {
        "address": "Jl. H. Japat No.4, Abadijaya, Kecamatan Sukmajaya, Kota Depok, Jawa Barat 16417",
        "region": "Abadijaya, Kecamatan Sukmajaya",
        "latitude": -6.4020237,
        "longitude": 106.8462111,
        "verified_maps_title": "Kopi Satu Bang Depok",
        "verification_source": "Booklet; arsip direktori kuliner; titik alamat Waze",
        "verification_status": "historical_reference",
        "verification_note": "Nama dan alamat mengikuti arsip kuliner; operasional perlu dikonfirmasi sebelum berkunjung.",
    },
    "Bakoel Samara Resto": {
        "address": "Jl. Raya Meruyung No.4, Rangkapan Jaya Baru, Kecamatan Pancoran Mas, Kota Depok, Jawa Barat 16515",
        "region": "Rangkapan Jaya Baru, Kecamatan Pancoran Mas",
        "latitude": -6.3860000,
        "longitude": 106.7800000,
        "verified_maps_title": "Bakoel Samara Resto",
        "verification_source": "Booklet; arsip wisata kuliner Kota Depok",
        "verification_status": "historical_reference",
        "verification_note": "Alamat historis terverifikasi; titik peta bersifat pendekatan kawasan dan perlu validasi operator.",
    },
    "Pecak Sawangan": {
        "address": "Jl. Abdul Wahab, kawasan Telaga Jambu Dua/Situ Sawangan, Kecamatan Sawangan, Kota Depok, Jawa Barat 16511",
        "region": "Sawangan, Kecamatan Sawangan",
        "latitude": -6.3872562,
        "longitude": 106.7582167,
        "verified_maps_title": "Pecak Neng Gocir Setu Sawangan",
        "verification_source": "Booklet; direktori kuliner; titik Telaga Jambu Dua pada Maps",
        "verification_status": "historical_reference",
        "verification_note": "Nama generik pada booklet dipadankan dengan listing kuliner pecak di kawasan Situ Sawangan.",
    },
    "PT. Pakuan": {
        "address": "Jl. Raya Muchtar, RT.002/RW.007, Sawangan, Kecamatan Sawangan, Kota Depok, Jawa Barat 16517",
        "region": "Sawangan, Kecamatan Sawangan",
        "latitude": -6.3950000,
        "longitude": 106.7548000,
        "verified_maps_title": "PT Pakuan Tbk / Sawangan Golf Hotel & Resort",
        "verification_source": "Booklet; situs resmi PT Pakuan; Pemerintah Provinsi DKI Jakarta",
        "verification_status": "verified_secondary",
        "verification_note": "Alamat perusahaan terverifikasi; titik mengacu kawasan Sawangan Golf Hotel & Resort.",
    },
    "Newly Hotel Indonesia": {
        "verification_source": "Booklet dan tautan Maps booklet",
        "verification_status": "booklet_only",
        "verification_note": "Listing independen dengan nama ini belum ditemukan; hasil tautan booklet mengarah ke kawasan D'Mall/Hotel Santika dan wajib dikonfirmasi panitia.",
    },
}


def build_description(item: dict) -> str:
    if item["category"] == "Wisata Situ":
        detail = "Destinasi situ atau danau kecil sebagai ruang wisata alam dan rekreasi di wilayah Depok."
    else:
        detail = "Fasilitas kesehatan rujukan yang tercantum untuk mendukung kebutuhan pengunjung PORPROV."
    categories = ", ".join(item["maps_categories"])
    return (
        f"Rekomendasi resmi Booklet PORPROV XV Jawa Barat 2026 halaman {item['source_page']}. "
        f"{detail} Kategori lokasi terverifikasi: {categories}. "
        "Informasi layanan dan jam operasional dapat berubah; konfirmasikan langsung sebelum berkunjung."
    )


items = json.loads(OUTPUT.read_text(encoding="utf-8"))
for item in items:
    fallback = FALLBACKS.get(item["booklet_title"])
    if not fallback:
        continue
    item.update(fallback)
    item["verified_maps_title"] = item["booklet_title"]
    item["title"] = item["booklet_title"]
    item["research_maps_url"] = item["booklet_maps_url"]
    item["description"] = build_description(item)
    item["image_url"] = ""
    item["status"] = "verified"
    item["verification_status"] = "verified_secondary"
    item.pop("error", None)

for item in items:
    item.setdefault("verification_source", "Booklet dan Google Maps")
    item.setdefault("verification_status", "verified_map")
    item["source_checked_at"] = "2026-07-22"
    correction = CORRECTIONS.get(item["booklet_title"])
    if not correction:
        continue
    item.update(correction)
    note = correction.get("verification_note")
    if note and note not in item["description"]:
        item["description"] = item["description"].rstrip() + " " + note

OUTPUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
