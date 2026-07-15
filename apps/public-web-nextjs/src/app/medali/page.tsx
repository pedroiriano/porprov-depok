import type { Metadata } from "next";
import { MedalStandings } from "@/components/MedalStandings";

export const metadata: Metadata = {
  title: "Klasemen Medali | PORPROV Depok",
  description: "Klasemen perolehan medali resmi PORPROV XV Jawa Barat 2026 yang diperbarui secara realtime.",
};

export default function MedaliPage() {
  return <MedalStandings />;
}
