import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klasemen Medali",
  description: "Klasemen resmi perolehan medali PORPROV XV Jawa Barat 2026 berdasarkan emas, perak, dan perunggu.",
  alternates: { canonical: "/medali" },
};

export default function MedalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
