import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";

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
    <html lang="id" className={`${inter.variable} antialiased h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background-base dark:bg-slate-950 text-text-primary dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Navbar />

          <main className="flex-grow flex flex-col">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-background-surface dark:bg-slate-900 py-8 mt-auto transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted dark:text-slate-400">
              <p>&copy; 2026 Pemerintah Kota Depok. Hak Cipta Dilindungi.</p>
              <p className="mt-2">Portal Resmi Pekan Olahraga Provinsi XV Jawa Barat</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
