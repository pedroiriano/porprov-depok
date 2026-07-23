import type { Metadata } from "next";
import { VenueInteractivePage } from "@/components/VenueInteractivePage";

export const metadata: Metadata = {
  title: "Venue & Lokasi Pertandingan",
  description: "Informasi venue PORPROV XV Jawa Barat 2026 di Kota Depok, termasuk alamat, kapasitas, fasilitas, kesiapan arena, dan tautan rute.",
};

export default function VenuePage() {
  return <VenueInteractivePage />;
}
