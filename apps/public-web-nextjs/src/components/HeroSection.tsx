"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!section || !media || reducedMotion.matches) {
      return;
    }

    let frame = 0;

    // PERFORMANCE: Satu frame animasi cukup untuk menerapkan parallax 50% tanpa memicu React render.
    const updateParallax = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
        return;
      }

      const traveled = Math.max(0, -bounds.top);
      media.style.transform = `translate3d(0, ${traveled * 0.5}px, 0) scale(1.12)`;
    };

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero-section relative isolate w-full overflow-hidden" aria-labelledby="hero-title">
      <div ref={mediaRef} className="hero-parallax-media absolute -inset-[8%] -z-20" aria-hidden="true">
        <Image
          src="/assets/images/alun-alun.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(2,6,23,0.94)_0%,rgba(3,19,38,0.82)_48%,rgba(13,62,113,0.52)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-slate-950 to-transparent" aria-hidden="true" />

      <div className="container relative flex h-full items-center pt-24 pb-12 sm:pt-28">
        <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7 lg:col-span-8">
            <div className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold tracking-wide text-white backdrop-blur-md">
              <span className="size-2.5 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]" aria-hidden="true" />
              7 November 2026 · Kota Depok
            </div>

            <h1 id="hero-title" className="max-w-4xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-7xl">
              Panggung Juara
              <span className="block bg-gradient-to-r from-sky-300 via-white to-amber-300 bg-clip-text text-transparent">
                Jawa Barat.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Saksikan PORPROV XV Jawa Barat 2026 dari Kota Depok—jadwal, venue, LiveScore, dan perjalanan para atlet dalam satu portal resmi.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/jadwal" className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary-500 bg-primary-500 px-5 py-3 font-bold text-white shadow-lg shadow-primary-900/30 transition hover:-translate-y-0.5 hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                <i className="ri-calendar-event-line me-2 text-lg" aria-hidden="true" />
                Lihat Jadwal
              </Link>
              <Link href="/venue" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                <i className="ri-map-pin-user-line me-2 text-lg" aria-hidden="true" />
                Jelajahi Venue
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 lg:col-span-4">
            <div className="rounded-2xl border border-white/15 bg-slate-950/55 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Hitung Mundur</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Menuju Opening Ceremony</h2>
                </div>
                <i className="ri-trophy-line text-3xl text-amber-300" aria-hidden="true" />
              </div>
              <CountdownTimer targetDate="2026-11-07T00:00:00+07:00" />
            </div>
          </div>
        </div>
      </div>

      <a href="#tuan-rumah" className="absolute bottom-4 left-1/2 hidden min-h-11 -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex">
        Jelajahi
        <i className="ri-arrow-down-line animate-bounce text-lg" aria-hidden="true" />
      </a>
    </section>
  );
}
