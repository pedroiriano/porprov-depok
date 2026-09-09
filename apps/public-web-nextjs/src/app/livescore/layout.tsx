import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LiveScore Pertandingan",
  description: "Pantau skor dan status pertandingan PORPROV XV Jawa Barat 2026 secara langsung dari data resmi panitia.",
  alternates: { canonical: "/livescore" },
};

export default function LiveScoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
