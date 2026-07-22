import argparse
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

import fitz


PAGE_CATEGORIES = {
    21: "Coffee Shop",
    22: "Coffee Shop",
    23: "Coffee Shop",
    24: "Coffee Shop",
    25: "Wisata Kuliner",
    26: "Tempat Menginap",
    27: "Tempat Menginap",
    28: "Tempat Menginap",
    29: "Wisata Buatan",
    30: "Wisata Situ",
    31: "Pusat Perbelanjaan",
    32: "Rumah Sakit",
}

BOOKLET_TITLES = {
    21: [
        "Tamelo Rooftop Cafe", "Artivator", "JPW Cafe", "Louis Cafe", "Kopi Nako", "Starbucks",
        "Coffee Toffee", "D'Juntos Cafe", "D'Clan", "Kopi Bajawa Flores NTT Depok", "Kopitagram",
        "Tomoro Coffee", "Sedjuk Bakmi & Kopi", "Ol'Pops Coffee", "Dadi's Cafe", "A Lot of Coffee Depok",
    ],
    22: [
        "Coffith Coffee & Kitchen", "Roemah - Coffee, Eatery and Hub", "Titik Rindu Coffee & Venue",
        "Savio Coffee and Eatery", "Kopi Konnichiwa Siliwangi Depok", "Jacob Koffie Huis", "Bemo Cafe",
        "The Gade Coffee & Gold Depok", "Unclehouse.Depok", "Hype Cafe, Billiard & Live Music",
        "Temu Kamu Depok Coffee & Eatery", "Emily Listening Space",
        "Nationalism Coffee Brewers (Kedai Kopi Depok)", "Cornelis Koffie", "Saturday Coffee",
        "Naqy's Cafe & Bakery",
    ],
    23: [
        "Meet Up Cafe Sawangan", "Kopi Oey Margonda", "Ruangnamu", "Signal Coffee", "Oi Coffee & Eatery",
        "JPG Cafe & Eatery", "Walking Drums Margonda Depok", "The Coffee Bean & Tea Leaf",
        "Kopi Djoe Billiard & Meeting Margonda", "Serab Coffee Brewery", "Green Coffee House",
        "D'Jill Resto & Cafe", "Ouwie Coffee and Eatery", "Warung Kopi Tepi Sungai", "Sajun Cafe Depok",
        "Kalimulya Jati Cafe & Resto",
    ],
    24: [
        "Semusim Coffee", "Sapulidi Coffee", "Dream Coffee and Resto by LnaRayen", "Interaksi Margonda",
        "Mangata Coffee & Eatery", "3Sons Coffee", "Dinamis Cafe & Lounge", "Coffee Lovers Cafe Jatijajar",
        "Privilege Coffee Aceh & Cuisine", "Kongdjie Coffee", "Siliwangi Coffee Space", "Lekkers Cafe",
        "Boothcin Coffee", "KopiSatuBang Depok",
    ],
    25: [
        "Bakoel Samara Resto", "Pecak Bu Lilis", "Saung Gandasari", "Gabus Pucung Tapos",
        "RM. Kampung Kecil", "Betawi Ngoempoel", "Saung Telaga", "Pecak Hj. Sadiah", "Pecak Sawangan",
        "Sate Pribumi",
    ],
    26: [
        "Pondok Zidane", "Hotel Savero Depok", "Hotel Nonies Huis", "Favehotel Depok",
        "Apartemen Royal Garden", "The Margo Hotel", "Newly Hotel Indonesia", "Serua Green Village",
        "Daima Suites Margonda", "Graha Wisata Pramuka", "Taman Herbal Insani", "Hotel Uli Arta",
        "Hotel Santika Depok", "Hotel Bumi Wiyata",
    ],
    27: [
        "Taman Rekreasi Pramuka", "Wisma Hijau", "Pusdiklat Graha Insan Cita", "Sasono Mulyo",
        "Kinasih Resort Depok", "Wisma Anggrek", "Hotel Mutiara", "Wisma Anton Soedjarwo", "PT. Pakuan",
        "Wisma Kost Depok", "Hotel Sifaana", "Cinere Inn & Residence", "Wisma Semarang", "Casa Uno",
    ],
    28: [
        "Denz Syariah Depok / Urban 24 Depok", "NRR Margonda Residence 2 & 5", "Graha HSC",
        "Alin Apartemen", "RedLiving Apartemen Margonda Residence 5 - Ens Room with Netflix & Breakfast",
        "Grand Taman Melati 2", "Apartemen Margonda Residence 2 by Andrew", "Mares Premium",
        "RedLiving Apartemen Margonda Residence 2 - Pridama Room",
        "RedLiving Apartemen Cinere Resort - Gold Room", "Sartika Apartemen Harian Depok",
        "Cinere Resort Apartment", "Apartemen Margonda Residence 2 by Patrick", "Wendy Syariah Mansion",
    ],
    29: [
        "D'Kandang Amazing", "Taman Rekreasi & Edukasi Pondok Zidane", "Godong Ijo", "Waterpark Ceria",
        "Taman Herbal Insani", "Kolam Renang Paragon", "Telaga Arwana Cibubur", "Tropicana Waterpark",
        "Taman Rekreasi Wiladatika", "Cimanggis Golf Avenue", "Rumah Keramik F. Widayanto",
        "Masjid At-Thohir", "Kolam Renang Pasir Putih", "Masjid Kubah Emas Dian Al Mahri",
        "Kolam Renang Putri Duyung", "Taman Doa Rumah Pengorbanan", "Green Lake View Waterpark",
    ],
    30: [
        "Situ Jatijajar", "Situ Pengasinan", "Situ Cilodong", "Situ Citayam", "Situ Sidamukti",
        "Situ Bojongsari", "Situ Pedongkelan", "Situ Rawa Besar", "Situ Pulo Asih", "Situ Rawa Kalong",
        "Situ Sawangan", "Ekowisata Ciliwung",
    ],
    31: [
        "ITC Depok", "Depok Town Center", "Depok Mall", "Cinere Mall", "Depok Town Square",
        "Cinere Bellevue", "Margo City", "Trans Studio Mall Cibubur", "Pesona Square", "The Park Sawangan",
        "City Plaza",
    ],
    32: [
        "Rumah Sakit Brawijaya", "Eka Hospital Kota Depok", "Mitra Keluarga Cibubur",
        "Mitra Keluarga Kota Depok", "Rumah Sakit Universitas Indonesia", "Hermina Kota Depok",
        "Rumah Sakit Bunda Margonda", "Rumah Sakit Bhakti Yudha", "RSUD Khidmat Sehat Afiat (KiSA)",
        "Rumah Sakit Primaya", "RSUD Anugerah Sehat Afiat",
    ],
}

PLACE_PATTERN = re.compile(
    r'\[null,null,(?P<lat>-?\d+\.\d+),(?P<lon>-?\d+\.\d+)\],'
    r'"0x[^"]+","(?P<title>(?:\\.|[^"])*)",null,'
    r'\[(?P<categories>.*?)\],"(?P<region>(?:\\.|[^"])*)",'
    r'null,null,null,"(?P<address>(?:\\.|[^"])*)"',
    re.DOTALL,
)


def decode_json_string(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except json.JSONDecodeError:
        return value.replace(r"\/", "/")


def extract_inventory(pdf_path: Path) -> list[dict]:
    document = fitz.open(pdf_path)
    items: list[dict] = []
    for page_number, category in PAGE_CATEGORIES.items():
        page = document[page_number - 1]
        links = [link for link in page.get_links() if "/maps/search/" in link.get("uri", "")]
        titles = BOOKLET_TITLES[page_number]
        if len(links) != len(titles):
            raise ValueError(f"jumlah judul dan link halaman {page_number} tidak sama")
        for link_index, (link, booklet_title) in enumerate(zip(links, titles), start=1):
            uri = link.get("uri", "")
            marker = "/maps/search/"
            if marker not in uri:
                continue
            query = urllib.parse.unquote(uri.split(marker, 1)[1]).strip()
            if "Ã" in query:
                query = query.encode("latin-1").decode("utf-8")
            items.append(
                {
                    "source_page": page_number,
                    "source_link_order": link_index,
                    "source_query": query,
                    "booklet_title": booklet_title,
                    "category": category,
                    "booklet_maps_url": uri,
                }
            )
    return items


def request_text(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PORPROV-Depok-Research/1.0",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.6",
        },
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read().decode("utf-8", errors="replace")


def fetch_google_maps_result(query: str) -> dict:
    qualified_query = f"{query}, Depok, Jawa Barat"
    maps_url = "https://www.google.com/maps/search/" + urllib.parse.quote(qualified_query)
    landing = request_text(maps_url)
    link_match = re.search(r'<link href="([^"]*tbm=map[^"]*)"', landing)
    if not link_match:
        raise ValueError("respons Maps tidak memuat endpoint hasil pencarian")
    result_url = urllib.parse.urljoin("https://www.google.com", html.unescape(link_match.group(1)))
    payload = request_text(result_url)
    candidates = []
    for match in PLACE_PATTERN.finditer(payload):
        latitude = float(match.group("lat"))
        longitude = float(match.group("lon"))
        title = decode_json_string(match.group("title")).strip()
        address = decode_json_string(match.group("address")).strip()
        region = decode_json_string(match.group("region")).strip()
        try:
            categories = json.loads("[" + match.group("categories") + "]")
        except json.JSONDecodeError:
            categories = []
        if address.lower().startswith(title.lower() + ","):
            address = address[len(title) + 1 :].strip()
        candidates.append(
            {
                "title": title,
                "address": address,
                "region": region,
                "latitude": latitude,
                "longitude": longitude,
                "maps_categories": [str(item) for item in categories if item],
                "research_maps_url": maps_url,
            }
        )
    if not candidates:
        raise ValueError("detail tempat tidak ditemukan pada respons Maps")

    depok_candidates = [
        item
        for item in candidates
        if "depok" in (item["address"] + " " + item["region"]).lower()
        or (-6.55 <= item["latitude"] <= -6.25 and 106.68 <= item["longitude"] <= 106.98)
    ]
    return (depok_candidates or candidates)[0]


def build_description(category: str, maps_categories: list[str], page: int) -> str:
    category_details = {
        "Coffee Shop": "Pilihan tempat bersantai, menikmati minuman, atau bertemu selama rangkaian kegiatan PORPROV.",
        "Wisata Kuliner": "Pilihan kuliner lokal untuk pengunjung, atlet, dan kontingen selama berada di Kota Depok.",
        "Tempat Menginap": "Pilihan akomodasi bagi pengunjung dan pendukung kegiatan PORPROV di kawasan Depok dan sekitarnya.",
        "Wisata Buatan": "Destinasi rekreasi buatan yang dapat menjadi pilihan kegiatan di luar jadwal pertandingan.",
        "Wisata Situ": "Destinasi situ atau danau kecil sebagai ruang wisata alam dan rekreasi di wilayah Depok.",
        "Pusat Perbelanjaan": "Pusat perbelanjaan untuk kebutuhan harian, kuliner, dan rekreasi selama berada di Depok.",
        "Rumah Sakit": "Fasilitas kesehatan rujukan yang tercantum untuk mendukung kebutuhan pengunjung PORPROV.",
    }
    identified_as = ""
    if maps_categories:
        identified_as = " Kategori lokasi terverifikasi: " + ", ".join(maps_categories[:4]) + "."
    caution = " Informasi layanan dan jam operasional dapat berubah; konfirmasikan langsung sebelum berkunjung."
    return (
        f"Rekomendasi resmi Booklet PORPROV XV Jawa Barat 2026 halaman {page}. "
        f"{category_details[category]}{identified_as}{caution}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--count", type=int, default=20)
    args = parser.parse_args()

    inventory = extract_inventory(Path(args.pdf))
    output_path = Path(args.output)
    existing: dict[str, dict] = {}
    if output_path.exists():
        for item in json.loads(output_path.read_text(encoding="utf-8")):
            existing[f'{item["source_page"]}|{item["source_query"]}'] = item

    stop = min(len(inventory), args.start + args.count)
    for index in range(args.start, stop):
        source = inventory[index]
        key = f'{source["source_page"]}|{source["source_query"]}'
        if existing.get(key, {}).get("status") == "verified":
            continue
        try:
            result = fetch_google_maps_result(source["source_query"])
            result["verified_maps_title"] = result.pop("title")
            result["title"] = source["booklet_title"]
            result["description"] = build_description(
                source["category"], result["maps_categories"], source["source_page"]
            )
            result["image_url"] = ""
            result["status"] = "verified"
            existing[key] = {**source, **result}
            print(f'OK {index + 1:03d}/{len(inventory)} {result["title"]}')
        except Exception as error:
            existing[key] = {**source, "status": "unresolved", "error": str(error)}
            print(f'FAIL {index + 1:03d}/{len(inventory)} {source["source_query"]}: {error}')
        time.sleep(0.35)

    ordered = [
        existing.get(
            f'{source["source_page"]}|{source["source_query"]}',
            {**source, "status": "pending"},
        )
        for source in inventory
    ]
    output_path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    verified = sum(1 for item in ordered if item.get("status") == "verified")
    unresolved = sum(1 for item in ordered if item.get("status") == "unresolved")
    print(f"SUMMARY verified={verified} unresolved={unresolved} total={len(ordered)}")


if __name__ == "__main__":
    main()
