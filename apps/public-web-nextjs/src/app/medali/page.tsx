import type { Metadata } from "next";
import { portalMetadata } from '@/lib/portal-config';
import { MedalStandings } from "@/components/MedalStandings";

export function generateMetadata():Promise<Metadata>{return portalMetadata('medali',baseMetadata);}
const baseMetadata: Metadata = {
  title: "Klasemen Medali | PORPROV Depok",
  description: "Klasemen perolehan medali resmi PORPROV XV Jawa Barat 2026 yang diperbarui secara realtime.",
};

export default function MedaliPage() {
  return <MedalStandings />;
}
