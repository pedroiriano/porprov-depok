import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal PORPROV XV Jawa Barat 2026",
  description: "Portal resmi Pekan Olahraga Provinsi (PORPROV) XV Jawa Barat 2026 di Kota Depok.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PORPROV 2026",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col">
        {/* Navbar Placeholder */}
        <header className="sticky top-0 z-50 glass border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white shadow-neon">
                P
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                PORPROV XV
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 font-medium text-sm text-text-secondary">
              <a href="/" className="hover:text-primary-500 transition-colors">Beranda</a>
              <a href="/jadwal" className="hover:text-primary-500 transition-colors">Jadwal</a>
              <a href="/livescore" className="hover:text-primary-500 transition-colors flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-subtle"></span>
                LiveScore
              </a>
              <a href="/medali" className="hover:text-primary-500 transition-colors">Medali</a>
            </nav>
            <button className="md:hidden p-2 text-text-secondary">
              {/* Mobile menu icon placeholder */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Footer Placeholder */}
        <footer className="border-t border-white/10 bg-background-surface py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted">
            <p>&copy; 2026 Pemerintah Kota Depok. Hak Cipta Dilindungi.</p>
            <p className="mt-2">Portal Resmi Pekan Olahraga Provinsi XV Jawa Barat</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
