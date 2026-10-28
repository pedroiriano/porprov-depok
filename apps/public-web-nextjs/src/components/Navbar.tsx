"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { usePortalConfig, PortalLink } from './PortalProvider';
import { portalMenus, portalTarget } from '../../../../packages/portal-config/config';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { resolvedTheme: theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const config=usePortalConfig();
  const menuItems=config?portalMenus(config,'header'):[];
  const [openSubmenu,setOpenSubmenu]=useState<string|null>(null);
  
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
  const closeMenu = () => {setIsOpen(false);setOpenSubmenu(null);};

  useEffect(() => {
    if (!isOpen && !openSubmenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {setIsOpen(false);setOpenSubmenu(null);}
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen,openSubmenu]);

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
            <PortalLink href="/livescore" className="inline-flex min-h-11 min-w-11 items-center justify-center" aria-label="Buka LiveScore Center" onClick={closeMenu}>
              <span className={`${(!isHomePage || isSticky) ? 'inline-block' : 'hidden'}`}><span className="size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 hover:border-indigo-700 text-white"><i className="ri-live-line" aria-hidden="true"></i></span></span>
              <span className={`${(isHomePage && !isSticky) ? 'inline-block' : 'hidden'}`}><span className="size-11 inline-flex items-center justify-center tracking-wide border border-gray-50 align-middle duration-500 text-base text-center rounded-full bg-gray-50 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-gray-700 hover:border-gray-100 dark:border-gray-800 dark:hover:border-gray-700"><i className="ri-live-line text-red-500" aria-hidden="true"></i></span></span>
            </PortalLink>
          </li>
        </ul>
        {/*Login button End*/}

        {/* CHANGE: Techwind membuka menu mobile melalui selector
         * `#navigation.open`; utility `block` kalah spesifik dari CSS tema. */}
        <div id="navigation" className={isOpen ? "open" : undefined}>
          {/* Navigation Menu*/}   
          <ul className="navigation-menu font-bold">
            {!config&&<li><Link href="/" className="sub-menu-item">Beranda</Link></li>}
            {menuItems.filter(item=>!item.parent_id).map(item=>{
              const children=menuItems.filter(child=>child.parent_id===item.id);
              const target=portalTarget(config!,item.target)!;
              return <li key={item.id} className={`relative ${isCurrent(item.target)?'active':''}`}>
                <Link href={target} className="sub-menu-item" onClick={closeMenu} aria-current={isCurrent(item.target)?'page':undefined} rel={target.startsWith('https://')?'noopener noreferrer':undefined}>{item.label}</Link>
                {children.length>0&&<><button type="button" aria-label={`Submenu ${item.label}`} aria-expanded={openSubmenu===item.id} aria-controls={`submenu-${item.id}`} onClick={()=>setOpenSubmenu(value=>value===item.id?null:item.id)} className="absolute end-0 top-0 min-h-11 min-w-11 text-[var(--nav-text)]" onKeyDown={e=>{if(e.key==='Escape')setOpenSubmenu(null);}}>⌄</button><ul id={`submenu-${item.id}`} hidden={openSubmenu!==item.id} className="relative min-w-48 rounded-xl border border-slate-200 bg-white p-3 text-slate-950 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white lg:absolute lg:top-full">{children.map(child=><li key={child.id}><PortalLink href={child.target} onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-slate-950 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800">{child.label}</PortalLink></li>)}</ul></>}
              </li>;
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
