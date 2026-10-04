"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { resolvedTheme: theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // CHANGE: React owns sticky state, including a restored scroll on initial load.
  useEffect(() => {
    const windowScroll = () => {
      setIsSticky(window.scrollY >= 50);
    };
    const mountedTimer = window.setTimeout(() => {
      setMounted(true);
      windowScroll();
    }, 0);
    
    window.addEventListener("scroll", windowScroll, { passive: true });
    return () => {
      window.clearTimeout(mountedTimer);
      window.removeEventListener("scroll", windowScroll);
    };
  }, []);

  const toggleMenu = () => setIsOpen((current) => !current);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const isHomePage = pathname === '/';
  const isCurrent = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav id="topnav" className={`defaultscroll is-sticky ${isSticky ? 'nav-sticky' : ''}`} data-appearance={isHomePage && !isSticky ? 'overlay' : 'surface'} aria-label="Navigasi utama PORPROV">
      <div className="container relative">
        {/* Logo container*/}
        <Link className="logo" href="/" onClick={closeMenu}>
          <span className="inline-block dark:hidden">
            <Image src="/assets/images/logo-porprov-dan-tulisan.png" className={`${(!isHomePage || isSticky) ? 'inline-block' : 'hidden'} h-[40px] w-auto object-contain mt-3`} width={200} height={40} alt="PORPROV XV Jawa Barat 2026" priority />
            <Image src="/assets/images/logo-porprov-dan-tulisan.png" className={`${(isHomePage && !isSticky) ? 'inline-block' : 'hidden'} mt-3 h-[40px] w-auto object-contain lg:brightness-0 lg:invert`} width={200} height={40} alt="PORPROV XV Jawa Barat 2026" priority />
          </span>
          <Image src="/assets/images/logo-porprov-dan-tulisan.png" width={200} height={40} className="hidden dark:inline-block h-[40px] w-auto object-contain mt-3 brightness-0 invert" alt="PORPROV XV Jawa Barat 2026" priority />
        </Link>

        {/* End Logo container*/}
        <div className="menu-extras">
          <div className="menu-item">
            {/* Mobile menu toggle*/}
            <button type="button" className={`navbar-toggle min-h-11 min-w-11 ${isOpen ? 'open' : ''}`} id="isToggle" onClick={toggleMenu} aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} aria-expanded={isOpen} aria-controls="navigation">
              <div className="lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            {/* End mobile menu toggle*/}
          </div>
        </div>

        {/*Login button Start*/}
        <ul className="buy-button list-none mb-0">
          <li className="inline mb-0">
            <button type="button" disabled={!mounted} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="porprov-theme-toggle min-h-11 min-w-11" aria-label={mounted && theme === 'dark' ? "Aktifkan tema terang" : "Aktifkan tema gelap"}>
              <span className={`${(!isHomePage || isSticky) ? 'inline-block' : 'hidden'}`}><span className="size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-indigo-600/5 hover:bg-indigo-600 border border-indigo-600/10 hover:border-indigo-600 text-indigo-600 hover:text-white"><i className={mounted && theme === 'dark' ? "ri-sun-line" : "ri-moon-line"} aria-hidden="true"></i></span></span>
              <span className={`${(isHomePage && !isSticky) ? 'inline-block' : 'hidden'}`}><span className="size-11 inline-flex items-center justify-center tracking-wide border border-gray-50 align-middle duration-500 text-base text-center rounded-full bg-gray-50 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-gray-700 hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-700"><i className={mounted && theme === 'dark' ? "ri-sun-line" : "ri-moon-line"} aria-hidden="true"></i></span></span>
            </button>
          </li>
  
          <li className="inline ps-1 mb-0">
            <Link href="/livescore" className="inline-flex min-h-11 min-w-11 items-center justify-center" aria-label="Buka LiveScore Center" onClick={closeMenu}>
              <span className={`${(!isHomePage || isSticky) ? 'inline-block' : 'hidden'}`}><span className="size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 hover:border-indigo-700 text-white"><i className="ri-live-line" aria-hidden="true"></i></span></span>
              <span className={`${(isHomePage && !isSticky) ? 'inline-block' : 'hidden'}`}><span className="size-11 inline-flex items-center justify-center tracking-wide border border-gray-50 align-middle duration-500 text-base text-center rounded-full bg-gray-50 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-gray-700 hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-700"><i className="ri-live-line text-red-500" aria-hidden="true"></i></span></span>
            </Link>
          </li>
        </ul>
        {/*Login button End*/}

        {/* CHANGE: Techwind membuka menu mobile melalui selector
         * `#navigation.open`; utility `block` kalah spesifik dari CSS tema. */}
        <div id="navigation" className={isOpen ? "open" : undefined}>
          {/* Navigation Menu*/}   
          <ul className="navigation-menu font-bold">
            <li className={isCurrent('/') ? 'active' : ''}><Link href="/" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/') ? 'page' : undefined}>Beranda</Link></li>
            <li className={isCurrent('/cabor') ? 'active' : ''}><Link href="/cabor" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/cabor') ? 'page' : undefined}>Cabor</Link></li>
            <li className={isCurrent('/venue') ? 'active' : ''}><Link href="/venue" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/venue') ? 'page' : undefined}>Venue</Link></li>
            <li className={isCurrent('/jadwal') ? 'active' : ''}><Link href="/jadwal" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/jadwal') ? 'page' : undefined}>Jadwal</Link></li>
            <li className={isCurrent('/medali') ? 'active' : ''}><Link href="/medali" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/medali') ? 'page' : undefined}>Klasemen</Link></li>
            <li className={isCurrent('/city-guide') ? 'active' : ''}><Link href="/city-guide" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/city-guide') ? 'page' : undefined}>Jelajah</Link></li>
            <li className={isCurrent('/berita') ? 'active' : ''}><Link href="/berita" className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent('/berita') ? 'page' : undefined}>Berita</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
