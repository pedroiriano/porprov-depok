import type { Metadata } from "next";
import { portalMetadata } from '@/lib/portal-config';

export function generateMetadata():Promise<Metadata>{return portalMetadata('jadwal',baseMetadata);}
const baseMetadata: Metadata = {
  title: "Jadwal Pertandingan",
  description: "Jadwal resmi pertandingan PORPROV XV Jawa Barat 2026 berdasarkan tanggal, cabang olahraga, venue, dan status.",
  alternates: { canonical: "/jadwal" },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
