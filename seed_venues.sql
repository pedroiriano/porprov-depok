-- Clear existing test data
DELETE FROM venues;

INSERT INTO venues (
    id, name, image_url, address, latitude, longitude, 
    capacity, readiness_status
) VALUES 
    (gen_random_uuid(), 'Lapangan Kukusan', '/assets/images/venue/Lapangan Kukusan-GATEBALL/Lapangan Kukusan.png', 'Jl. Palakali, Kukusan, Kecamatan Beji, Kota Depok, Jawa Barat.', -6.3688, 106.8222, 500, 'Persiapan'),
    (gen_random_uuid(), 'Depok Sport Hall', '/assets/images/venue/Depok Sport Hall-KARATE DAN BASKETBALL/DEPOK SPORT HALL 2.png', 'Jl. Boulevard Grand Depok City, Tirtajaya, Kec. Sukmajaya, Kota Depok, Jawa Barat.', -6.4025, 106.7942, 2000, 'Siap'),
    (gen_random_uuid(), 'Eden Sports Center', '/assets/images/venue/Eden Sport Centre-HOCKEY INDOOR DAN FLOORBALL/Eden Sports Center.png', 'Jl. Raya Pengasinan, Pengasinan, Kec. Sawangan, Kota Depok, Jawa Barat.', -6.4255, 106.7622, 1000, 'Persiapan'),
    (gen_random_uuid(), 'Lapangan Bola PSP', '/assets/images/venue/Lapangan Bola PSP-Hockey Outdoor/Lapangan Bola PSP.png', 'Jl. Abdul Wahab No.19, Sawangan Lama, Kec. Sawangan, Kota Depok, Jawa Barat.', -6.4035, 106.7592, 800, 'Siap'),
    (gen_random_uuid(), 'Stadion Merpati', '/assets/images/venue/Lapangan Merpati-Bola Putri/Stadion Merpati.png', 'Jl. Gelatik Raya No.43, Depok Jaya, Kec. Pancoran Mas, Kota Depok, Jawa Barat.', -6.3985, 106.8122, 3000, 'Siap'),
    (gen_random_uuid(), 'Stadion Mahakam', '/assets/images/venue/Stadion Mahakam-Bola Putri/STADION MAHAKAM.png', 'Jalan Rasamala Raya No 1, Baktijaya, Kec. Sukmajaya, Kota Depok, Jawa Barat.', -6.3885, 106.8322, 1500, 'Persiapan'),
    (gen_random_uuid(), 'Lap. Tembak Kostrad', '/assets/images/venue/Lapangan Tembak Kostrad-Tembak Outdoor/LAPANGAN TEMBAK KOSTRAD CILODONG.png', 'KOSTRAD 328 (Cilodong), Kec. Cilodong, Kota Depok, Jawa Barat.', -6.4285, 106.8522, 500, 'Siap'),
    (gen_random_uuid(), 'Emeralda Golf', '/assets/images/venue/Emeralda Golf/EMERALDA GOLF.png', 'Jl. Emeralda Raya, Kec. Tapos, Kota Depok, Jawa Barat.', -6.4385, 106.8822, 1000, 'Siap'),
    (gen_random_uuid(), 'GOR Kartika', '/assets/images/venue/Gor Kartika-Sepak Takraw/GOR KARTIKA.png', 'Jl. Asrama Cilodong No.80, Cilodong, Kec. Cilodong, Kota Depok, Jawa Barat.', -6.4285, 106.8522, 800, 'Siap'),
    (gen_random_uuid(), 'Pantai Cimaja', '/assets/images/venue/Pantai Cimaja-Selancar/PANTAI CIMAJA2.png', 'Desa Cimaja, Kec. Cikakak, Kab. Sukabumi, Jawa Barat.', -6.9585, 106.4622, 5000, 'Siap');
