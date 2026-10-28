import type { Metadata } from "next";
import { portalMetadata } from '@/lib/portal-config';
import { VenueInteractivePage } from "@/components/VenueInteractivePage";

export function generateMetadata():Promise<Metadata>{return portalMetadata('venue',baseMetadata);}
const baseMetadata: Metadata = {
  title: "Venue & Lokasi Pertandingan",
  description: "Informasi venue PORPROV XV Jawa Barat 2026 di Kota Depok, termasuk alamat, kapasitas, fasilitas, kesiapan arena, dan tautan rute.",
};

export default function VenuePage() {
  return <VenueInteractivePage />;
}
