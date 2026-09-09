"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 560);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke bagian atas halaman"
      className={`fixed bottom-5 end-5 z-50 inline-flex size-12 items-center justify-center rounded-full border border-white/20 bg-primary-600 text-xl text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <i className="ri-arrow-up-line" aria-hidden="true" />
    </button>
  );
}
