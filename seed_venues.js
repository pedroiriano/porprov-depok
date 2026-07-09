const API_BASE_URL = 'http://localhost:8087/api/v1';

const venues = [
  {
    name: "Lapangan Kukusan",
    image_url: "/assets/images/venue/Lapangan Kukusan-GATEBALL/Lapangan Kukusan.png",
    address: "Jl. Palakali, Kukusan, Kecamatan Beji, Kota Depok, Jawa Barat.",
    capacity: 500,
    readiness_status: "Persiapan",
    latitude: -6.3688,
    longitude: 106.8222
  },
  {
    name: "Depok Sport Hall",
    image_url: "/assets/images/venue/Depok Sport Hall-KARATE DAN BASKETBALL/DEPOK SPORT HALL 2.png",
    address: "Jl. Boulevard Grand Depok City, Tirtajaya, Kec. Sukmajaya, Kota Depok, Jawa Barat.",
    capacity: 2000,
    readiness_status: "Siap",
    latitude: -6.4025,
    longitude: 106.7942
  },
  {
    name: "Eden Sports Center",
    image_url: "/assets/images/venue/Eden Sport Centre-HOCKEY INDOOR DAN FLOORBALL/Eden Sports Center.png",
    address: "Jl. Raya Pengasinan, Pengasinan, Kec. Sawangan, Kota Depok, Jawa Barat.",
    capacity: 1000,
    readiness_status: "Persiapan",
    latitude: -6.4255,
    longitude: 106.7622
  },
  {
    name: "Lapangan Bola PSP",
    image_url: "/assets/images/venue/Lapangan Bola PSP-Hockey Outdoor/Lapangan Bola PSP.png",
    address: "Jl. Abdul Wahab No.19, Sawangan Lama, Kec. Sawangan, Kota Depok, Jawa Barat.",
    capacity: 800,
    readiness_status: "Siap",
    latitude: -6.4035,
    longitude: 106.7592
  },
  {
    name: "Stadion Merpati",
    image_url: "/assets/images/venue/Lapangan Merpati-Bola Putri/Stadion Merpati.png",
    address: "Jl. Gelatik Raya No.43, Depok Jaya, Kec. Pancoran Mas, Kota Depok, Jawa Barat.",
    capacity: 3000,
    readiness_status: "Siap",
    latitude: -6.3985,
    longitude: 106.8122
  },
  {
    name: "Stadion Mahakam",
    image_url: "/assets/images/venue/Stadion Mahakam-Bola Putri/STADION MAHAKAM.png",
    address: "Jalan Rasamala Raya No 1, Baktijaya, Kec. Sukmajaya, Kota Depok, Jawa Barat.",
    capacity: 1500,
    readiness_status: "Persiapan",
    latitude: -6.3885,
    longitude: 106.8322
  },
  {
    name: "Lap. Tembak Kostrad",
    image_url: "/assets/images/venue/Lapangan Tembak Kostrad-Tembak Outdoor/LAPANGAN TEMBAK KOSTRAD CILODONG.png",
    address: "KOSTRAD 328 (Cilodong), Kec. Cilodong, Kota Depok, Jawa Barat.",
    capacity: 500,
    readiness_status: "Siap",
    latitude: -6.4285,
    longitude: 106.8522
  },
  {
    name: "Emeralda Golf",
    image_url: "/assets/images/venue/Emeralda Golf/EMERALDA GOLF.png",
    address: "Jl. Emeralda Raya, Kec. Tapos, Kota Depok, Jawa Barat.",
    capacity: 1000,
    readiness_status: "Siap",
    latitude: -6.4385,
    longitude: 106.8822
  },
  {
    name: "GOR Kartika",
    image_url: "/assets/images/venue/Gor Kartika-Sepak Takraw/GOR KARTIKA.png",
    address: "Jl. Asrama Cilodong No.80, Cilodong, Kec. Cilodong, Kota Depok, Jawa Barat.",
    capacity: 800,
    readiness_status: "Siap",
    latitude: -6.4285,
    longitude: 106.8522
  },
  {
    name: "Pantai Cimaja",
    image_url: "/assets/images/venue/Pantai Cimaja-Selancar/PANTAI CIMAJA2.png",
    address: "Desa Cimaja, Kec. Cikakak, Kab. Sukabumi, Jawa Barat.",
    capacity: 5000,
    readiness_status: "Siap",
    latitude: -6.9585,
    longitude: 106.4622
  }
];

async function seedVenues() {
  console.log('Seeding venues...');
  
  try {
    const res = await fetch(`${API_BASE_URL}/venues`);
    const data = await res.json();
    for (const v of data) {
      console.log(`Deleting ${v.name}`);
      await fetch(`${API_BASE_URL}/venues/${v.id}`, { method: 'DELETE' });
    }
  } catch (err) {
    console.log('Could not fetch/delete existing venues', err.message);
  }

  for (const v of venues) {
    try {
      const payload = {
        name: v.name,
        image_url: v.image_url,
        address: v.address,
        capacity: v.capacity,
        readiness_status: v.readiness_status,
        latitude: v.latitude,
        longitude: v.longitude,
        map_route_url: "",
        city_guide_ids: [],
        cabor_ids: [],
        facilities: "",
        contact_person: ""
      };
      const res = await fetch(`${API_BASE_URL}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log(`Inserted ${v.name}`);
    } catch (err) {
      console.error(`Failed to insert ${v.name}:`, err.message);
    }
  }
  console.log('Seeding done.');
}

seedVenues();
