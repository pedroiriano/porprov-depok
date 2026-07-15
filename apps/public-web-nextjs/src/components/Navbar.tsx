"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Techwind original scroll logic for sticky navbar
  useEffect(() => {
    const mountedTimer = window.setTimeout(() => setMounted(true), 0);
    const windowScroll = () => {
      const navbar = document.getElementById("topnav");
      if (navbar != null) {
        if (
          document.body.scrollTop >= 50 ||
          document.documentElement.scrollTop >= 50
        ) {
          setIsSticky(true);
          navbar.classList.add("nav-sticky");
        } else {
          setIsSticky(false);
          navbar.classList.remove("nav-sticky");
        }
      }
    };
    
    window.addEventListener("scroll", windowScroll);
    return () => {
      window.clearTimeout(mountedTimer);
      window.removeEventListener("scroll", windowScroll);
    };
  }, []);

  const toggleMenu = () => setIsOpen((current) => !current);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav id="topnav" className={`defaultscroll is-sticky ${isSticky ? 'nav-sticky' : ''}`}>
      <div className="container relative">
        {/* Logo container*/}
        <Link className="logo" href="/">
          <span className="inline-block dark:hidden">
            <Image src="/assets/images/logo-porprov-dan-tulisan.png" className="l-dark h-[40px] w-auto object-contain mt-3" width={200} height={40} alt="PORPROV XV Jawa Barat 2026" priority />
            <Image src="/assets/images/logo-porprov-dan-tulisan.png" className="l-light h-[40px] w-auto object-contain mt-3 brightness-0 invert" width={200} height={40} alt="" priority />
          </span>
          <Image src="/assets/images/logo-porprov-dan-tulisan.png" width={200} height={40} className="hidden dark:inline-block h-[40px] w-auto object-contain mt-3 brightness-0 invert" alt="PORPROV XV Jawa Barat 2026" priority />
        </Link>

        {/* End Logo container*/}
        <div className="menu-extras">
          <div className="menu-item">
            {/* Mobile menu toggle*/}
            <button type="button" className={`navbar-toggle ${isOpen ? 'open' : ''}`} id="isToggle" onClick={toggleMenu} aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} aria-expanded={isOpen} aria-controls="navigation">
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
            <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="min-h-11 min-w-11 focus:outline-none" aria-label={mounted && theme === 'dark' ? "Aktifkan tema terang" : "Aktifkan tema gelap"}>
              <span className="login-btn-primary"><span className="size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-indigo-600/5 hover:bg-indigo-600 border border-indigo-600/10 hover:border-indigo-600 text-indigo-600 hover:text-white"><i className={mounted && theme === 'dark' ? "ri-sun-line" : "ri-moon-line"} aria-hidden="true"></i></span></span>
              <span className="login-btn-light"><span className="size-11 inline-flex items-center justify-center tracking-wide border border-gray-50 align-middle duration-500 text-base text-center rounded-full bg-gray-50 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-gray-700 hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-700"><i className={mounted && theme === 'dark' ? "ri-sun-line" : "ri-moon-line"} aria-hidden="true"></i></span></span>
            </button>
          </li>
  
          <li className="inline ps-1 mb-0">
            <Link href="/livescore" className="inline-flex min-h-11 min-w-11 items-center justify-center" aria-label="Buka LiveScore Center" onClick={closeMenu}>
              <span className="login-btn-primary"><span className="size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 hover:border-indigo-700 text-white"><i className="ri-live-line" aria-hidden="true"></i></span></span>
              <span className="login-btn-light"><span className="size-11 inline-flex items-center justify-center tracking-wide border border-gray-50 align-middle duration-500 text-base text-center rounded-full bg-gray-50 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-gray-700 hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-700"><i className="ri-live-line text-red-500" aria-hidden="true"></i></span></span>
            </Link>
          </li>
        </ul>
        {/*Login button End*/}

        <div id="navigation" style={{ display: isOpen ? 'block' : '' }}>
          {/* Navigation Menu*/}   
          <ul className="navigation-menu nav-light font-bold">
            <li><Link href="/" className="sub-menu-item" onClick={closeMenu}>Beranda</Link></li>
            <li><Link href="/cabor" className="sub-menu-item" onClick={closeMenu}>Cabor</Link></li>
            <li><Link href="/venue" className="sub-menu-item" onClick={closeMenu}>Venue</Link></li>
            <li><Link href="/jadwal" className="sub-menu-item" onClick={closeMenu}>Jadwal</Link></li>
            <li><Link href="/medali" className="sub-menu-item" onClick={closeMenu}>Klasemen</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
