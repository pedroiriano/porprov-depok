import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Portal PORPROV XV Jawa Barat 2026",
    template: "%s | PORPROV XV 2026",
  },
  description: "Portal resmi Pekan Olahraga Provinsi (PORPROV) XV Jawa Barat 2026 di Kota Depok. Pantau klasemen medali, jadwal, venue, dan berita terkini secara real-time.",
  keywords: ["PORPROV XV", "PORPROV 2026", "Jawa Barat", "Kota Depok", "Olahraga", "Klasemen Medali", "LiveScore", "Toca", "Toci"],
  authors: [{ name: "Diskominfo Kota Depok" }],
  creator: "Pemerintah Kota Depok",
  publisher: "KONI Jawa Barat",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://porprov2026.depok.go.id",
    title: "Portal PORPROV XV Jawa Barat 2026",
    description: "Pantau klasemen medali, jadwal, venue, dan berita terkini secara real-time di Portal resmi PORPROV XV Jawa Barat 2026.",
    siteName: "PORPROV XV 2026",
    images: [
      {
        url: "/assets/images/logo-porprov.png",
        width: 1200,
        height: 630,
        alt: "Logo PORPROV XV Jawa Barat 2026",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal PORPROV XV Jawa Barat 2026",
    description: "Pantau klasemen medali, jadwal, venue, dan berita terkini secara real-time.",
    images: ["/assets/images/logo-porprov.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: '/icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="antialiased h-full" suppressHydrationWarning dir="ltr">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/assets/libs/remixicon/fonts/remixicon.css" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/assets/css/tailwind.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background-base dark:bg-slate-950 text-text-primary dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Navbar />

          <main className="flex-1 flex flex-col relative w-full h-full">
            {children}
          </main>
          
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
