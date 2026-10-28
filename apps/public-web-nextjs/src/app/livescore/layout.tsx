import type { Metadata } from "next";
import { portalMetadata } from '@/lib/portal-config';

export function generateMetadata():Promise<Metadata>{return portalMetadata('livescore',baseMetadata);}
const baseMetadata: Metadata = {
  title: "LiveScore Pertandingan",
  description: "Pantau skor dan status pertandingan PORPROV XV Jawa Barat 2026 secara langsung dari data resmi panitia.",
  alternates: { canonical: "/livescore" },
};

export default function LiveScoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
