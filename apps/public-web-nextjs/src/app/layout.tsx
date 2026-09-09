import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "@fontsource-variable/nunito/wght.css";
import "@fontsource-variable/nunito/wght-italic.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

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
    url: "https://porprov.depok.go.id",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const websiteStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Portal PORPROV XV Jawa Barat 2026",
    url: siteUrl,
    inLanguage: "id-ID",
    publisher: {
      "@type": "GovernmentOrganization",
      name: "Pemerintah Kota Depok",
      url: "https://www.depok.go.id",
    },
  }).replace(/</g, "\\u003c");

  return (
    <html lang="id" className="antialiased h-full" suppressHydrationWarning dir="ltr">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/assets/libs/remixicon/fonts/remixicon.css" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/assets/css/tailwind.css?v=20260810-selfhosted-fonts" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background-base dark:bg-slate-950 text-text-primary dark:text-slate-100 transition-colors duration-300">
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteStructuredData }}
        />
        <a href="#main-content" className="fixed start-4 top-3 z-[1100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 font-black text-white shadow-xl transition focus:translate-y-0">Lewati ke konten utama</a>
        {umamiWebsiteId && (
          <Script
            nonce={nonce}
            src="/analytics/porprov-insight.js"
            data-website-id={umamiWebsiteId}
            data-host-url="/analytics"
            data-domains="porprov.depok.go.id"
            data-do-not-track="true"
            data-exclude-search="true"
            data-exclude-hash="true"
            strategy="afterInteractive"
          />
        )}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Navbar />

          <div id="main-content" tabIndex={-1} className="flex-1 flex flex-col relative w-full h-full outline-none">
            {children}
          </div>
          
          <Footer />
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
