import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Pertandingan",
  description: "Jadwal resmi pertandingan PORPROV XV Jawa Barat 2026 berdasarkan tanggal, cabang olahraga, venue, dan status.",
  alternates: { canonical: "/jadwal" },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
