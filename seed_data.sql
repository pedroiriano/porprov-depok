-- Seed Data for Master Data (porprov_db)

-- 1. Insert Cabang Olahraga
INSERT INTO cabors (id, name, description, icon_url) VALUES 
('c0000000-0000-0000-0000-000000000001', 'Sepak Bola', 'Sepak Bola', '/assets/extracted/page8_img1.png'),
('c0000000-0000-0000-0000-000000000002', 'Selancar Ombak', 'Selancar Ombak', '/assets/extracted/page8_img2.png'),
('c0000000-0000-0000-0000-000000000003', 'Hockey Indoor & Outdoor', 'Hockey Indoor & Outdoor', '/assets/extracted/page8_img3.png'),
('c0000000-0000-0000-0000-000000000004', 'Sepak Takraw', 'Sepak Takraw', '/assets/extracted/page8_img4.png'),
('c0000000-0000-0000-0000-000000000005', 'Menembak Outdoor', 'Menembak Outdoor', '/assets/extracted/page8_img5.png'),
('c0000000-0000-0000-0000-000000000006', 'Golf', 'Golf', '/assets/extracted/page8_img6.png'),
('c0000000-0000-0000-0000-000000000007', 'Karate', 'Karate', '/assets/extracted/page8_img7.png'),
('c0000000-0000-0000-0000-000000000008', 'Floorball', 'Floorball', '/assets/extracted/page8_img8.png'),
('c0000000-0000-0000-0000-000000000009', 'Basketball', 'Bola Basket 5x5 dan 3x3', '/assets/extracted/page8_img9.png'),
('c0000000-0000-0000-0000-000000000010', 'Gateball', 'Gateball', '/assets/extracted/page8_img10.png')
ON CONFLICT (name) DO UPDATE SET icon_url = EXCLUDED.icon_url;

-- 2. Insert Venues (Wait, Venues are in Schedule Service. Assuming they share the same DB `porprov_db`)
INSERT INTO venues (id, name, address, capacity) VALUES 
('e0000000-0000-0000-0000-000000000001', 'Stadion Merpati', 'Jl. Gelatik Raya No.43, Depok Jaya, Kec. Pancoran Mas, Kota Depok, Jawa Barat', 5000),
('e0000000-0000-0000-0000-000000000002', 'Lapangan Bola PSP', 'Jl. Abdul Wahab No.19, Sawangan Lama, Kec. Sawangan, Kota Depok, Jawa Barat', 2000),
('e0000000-0000-0000-0000-000000000003', 'Eden Sports Center', 'Jl. Raya Pengasinan, Pengasinan, Kec. Sawangan, Kota Depok, Jawa Barat', 1500),
('e0000000-0000-0000-0000-000000000004', 'Depok Sport Hall', 'Jl. Boulevard Grand Depok City, Tirtajaya, Kec. Sukmajaya, Kota Depok, Jawa Barat', 3000),
('e0000000-0000-0000-0000-000000000005', 'Pantai Cimaja', 'Desa Cimaja, Kec. Cikakak, Kab. Sukabumi, Jawa Barat', 0),
('e0000000-0000-0000-0000-000000000006', 'Lapangan Kukusan', 'Jl. Palakali, Kukusan, Kecamatan Beji, Kota Depok, Jawa Barat', 1000),
('e0000000-0000-0000-0000-000000000007', 'Stadion Mahakam', 'Jalan Rasamala Raya No 1, Baktijaya, Kec. Sukmajaya, Kota Depok, Jawa Barat', 3000),
('e0000000-0000-0000-0000-000000000008', 'Lapangan Tembak Kostrad Cilodong', 'KOSTRAD 328 (Cilodong), Kec. Cilodong, Kota Depok, Jawa Barat', 500),
('e0000000-0000-0000-0000-000000000009', 'GOR Kartika', 'Jl. Asrama Cilodong No.80, Cilodong, Kec. Cilodong, Kota Depok, Jawa Barat', 2500),
('e0000000-0000-0000-0000-000000000010', 'Emeralda Golf Club', 'Jl. Emeralda Raya, Kec. Tapos, Kota Depok, Jawa Barat', 1000)
ON CONFLICT (id) DO UPDATE SET address = EXCLUDED.address;

-- 3. Insert City Guides
INSERT INTO city_guides (title, category, address) VALUES 
('Tamelo Rooftop Cafe', 'Coffee Shop', 'Depok'),
('JPW Cafe', 'Coffee Shop', 'Depok'),
('Kopi Nako', 'Coffee Shop', 'Depok'),
('Coffee Toffee', 'Coffee Shop', 'Depok'),
('D''Clan', 'Coffee Shop', 'Depok'),
('Kopitagram', 'Coffee Shop', 'Depok'),
('Sedjuk Bakmi & Kopi', 'Coffee Shop', 'Depok'),
('Dadi''s Cafe', 'Coffee Shop', 'Depok'),
('Bakoel Samara Resto', 'Wisata Kuliner', 'Depok'),
('Saung Gandasari', 'Wisata Kuliner', 'Depok'),
('RM. Kampung Kecil', 'Wisata Kuliner', 'Depok'),
('Saung Telaga', 'Wisata Kuliner', 'Depok'),
('Pecak Sawangan', 'Wisata Kuliner', 'Depok'),
('Pondok Zidane', 'Tempat Menginap', 'Depok'),
('Hotel Nonies Huis', 'Tempat Menginap', 'Depok'),
('Apartemen Royal Garden', 'Tempat Menginap', 'Depok'),
('Newly Hotel Indonesia', 'Tempat Menginap', 'Depok'),
('Daima Suites Margonda', 'Tempat Menginap', 'Depok'),
('D''Kandang Amazing', 'Wisata Buatan', 'Depok'),
('Godong Ijo', 'Wisata Buatan', 'Depok'),
('Taman Herbal Insani', 'Wisata Buatan', 'Depok'),
('Telaga Arwana Cibubur', 'Wisata Buatan', 'Depok'),
('Situ Jatijajar', 'Wisata Situ', 'Depok'),
('Situ Cilodong', 'Wisata Situ', 'Depok'),
('Situ Sidamukti', 'Wisata Situ', 'Depok'),
('ITC Depok', 'Pusat Perbelanjaan', 'Depok'),
('Depok Mall', 'Pusat Perbelanjaan', 'Depok'),
('Depok Town Square', 'Pusat Perbelanjaan', 'Depok'),
('Margo City', 'Pusat Perbelanjaan', 'Depok'),
('Rumah Sakit Brawijaya', 'Rumah Sakit', 'Depok'),
('Mitra Keluarga Cibubur', 'Rumah Sakit', 'Depok'),
('Rumah Sakit Universitas Indonesia', 'Rumah Sakit', 'Depok')
ON CONFLICT DO NOTHING;

-- 4. Insert Matches (Sample data for schedule based on Excel)
-- We will just insert a few matches as representation
INSERT INTO nomor_tandings (id, cabor_id, name, gender_category, match_type) VALUES 
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'Bola Basket 5x5', 'putra', 'tanding'),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Hockey Indoor', 'putri', 'tanding'),
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Sepak Bola Putri', 'putri', 'tanding')
ON CONFLICT DO NOTHING;

INSERT INTO kontingens (id, name, region_type) VALUES 
('d0000000-0000-0000-0000-000000000001', 'Kota Depok', 'kota'),
('d0000000-0000-0000-0000-000000000002', 'Kota Bandung', 'kota'),
('d0000000-0000-0000-0000-000000000003', 'Kab. Bogor', 'kabupaten'),
('d0000000-0000-0000-0000-000000000004', 'Kota Bogor', 'kota')
ON CONFLICT (name) DO NOTHING;

INSERT INTO matches (id, nomor_tanding_id, venue_id, match_date, status, round) VALUES 
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', '2026-10-30 09:00:00+07', 'scheduled', 'penyisihan'),
('a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', '2026-11-01 10:00:00+07', 'scheduled', 'semifinal'),
('a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', '2026-11-09 15:00:00+07', 'scheduled', 'final')
ON CONFLICT (id) DO NOTHING;

INSERT INTO match_participants (match_id, kontingen_id) VALUES 
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003'),
('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002'),
('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;
