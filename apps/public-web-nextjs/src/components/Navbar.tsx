"use client";

import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass dark:bg-slate-900/80 border-b border-white/10 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white shadow-neon">
            P
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            PORPROV XV
          </span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm text-text-secondary dark:text-slate-300">
            <a href="/" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Beranda</a>
            <a href="/cabor" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Cabor</a>
            <a href="/jadwal" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Jadwal</a>
            <a href="/livescore" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-subtle"></span>
              LiveScore
            </a>
            <a href="/medali" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Medali</a>
          </nav>
          
          <ThemeToggle />
          
          <button 
            className="md:hidden p-2 text-text-secondary dark:text-slate-300 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full glass dark:bg-slate-900/95 border-b border-white/10 dark:border-slate-800/50 flex flex-col px-4 py-6 gap-4 shadow-xl">
          <a href="/" className="text-text-primary dark:text-slate-200 font-medium text-lg hover:text-primary-500 transition-colors" onClick={() => setIsOpen(false)}>Beranda</a>
          <a href="/cabor" className="text-text-primary dark:text-slate-200 font-medium text-lg hover:text-primary-500 transition-colors" onClick={() => setIsOpen(false)}>Cabang Olahraga</a>
          <a href="/jadwal" className="text-text-primary dark:text-slate-200 font-medium text-lg hover:text-primary-500 transition-colors" onClick={() => setIsOpen(false)}>Jadwal Pertandingan</a>
          <a href="/livescore" className="text-text-primary dark:text-slate-200 font-medium text-lg hover:text-primary-500 transition-colors flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-subtle"></span>
            Live Score Real-time
          </a>
          <a href="/medali" className="text-text-primary dark:text-slate-200 font-medium text-lg hover:text-primary-500 transition-colors" onClick={() => setIsOpen(false)}>Klasemen Medali</a>
        </div>
      )}
    </header>
  );
}
