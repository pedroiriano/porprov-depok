import type { Metadata } from "next";
import { VenueShowcase } from "@/components/VenueShowcase";

export const metadata: Metadata = {
  title: "Venue & Lokasi Pertandingan",
  description: "Informasi venue PORPROV XV Jawa Barat 2026 di Kota Depok, termasuk alamat, kapasitas, fasilitas, kesiapan arena, dan tautan rute.",
};

export default function VenuePage() {
  return <VenueShowcase displayMode="page" />;
}
