"use client";

import Image from "next/image";
import { useState } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import type { HeroContentModel } from "@/lib/public-models";

interface HeroSectionProps {
  hero: HeroContentModel;
}

function splitHeroTitle(title: string, highlightText: string) {
  if (!highlightText) return { base: title, highlight: "" };
  const index = title.toLocaleLowerCase("id-ID").lastIndexOf(highlightText.toLocaleLowerCase("id-ID"));
  if (index < 0) return { base: title, highlight: "" };
  return {
    base: `${title.slice(0, index)}${title.slice(index + highlightText.length)}`.trim(),
    highlight: title.slice(index, index + highlightText.length),
  };
}

export function HeroSection({ hero }: HeroSectionProps) {
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const title = splitHeroTitle(hero.title, hero.highlightText);

  return (
    <section className="hero-section relative isolate w-full overflow-hidden" aria-labelledby="hero-title">
      <div className="hero-parallax-media absolute -inset-[8%] -z-20" aria-hidden="true">
        <Image
          src={hero.backgroundImageUrl}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center motion-safe:scale-[1.08]"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(2,6,23,0.40)_0%,rgba(3,19,38,0.25)_48%,rgba(13,62,113,0.10)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-slate-950/70 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-slate-950 to-transparent" aria-hidden="true" />

      <div className="container relative flex min-h-[100svh] items-center pb-12 pt-28 sm:pt-32 md:h-full md:min-h-0">
        <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7 lg:col-span-8">
            <div className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold tracking-wide text-white backdrop-blur-md">
              <span className="size-2.5 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]" aria-hidden="true" />
              7 - 20 November 2026
            </div>

            <h1 id="hero-title" className="max-w-4xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-white drop-shadow-lg sm:text-5xl lg:text-7xl">
              {title.base || hero.title}
              {title.highlight && (
                <span className="block bg-gradient-to-r from-sky-300 via-white to-amber-300 bg-clip-text text-transparent">
                  {title.highlight}
                </span>
              )}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 drop-shadow-md sm:text-lg whitespace-pre-line">
              {hero.description}
            </p>

          </div>

          {/* Countdown Card (Hidden when finished) */}
          {!isCountdownFinished && (
            <div className="md:col-span-5 lg:col-span-4">
              <div className="rounded-2xl border border-white/15 bg-slate-950/55 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Hitung Mundur</p>
                    <h2 className="mt-1 text-lg font-bold text-white">Menuju Opening Ceremony</h2>
                  </div>
                  <i className="ri-trophy-line text-3xl text-amber-300" aria-hidden="true" />
                </div>
                <CountdownTimer 
                  targetDate="2026-11-07T00:00:00+07:00" 
                  onFinished={() => setIsCountdownFinished(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <a href="#tuan-rumah" className="absolute bottom-4 left-1/2 hidden min-h-11 -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex">
        Jelajahi
        <i className="ri-arrow-down-line animate-bounce text-lg" aria-hidden="true" />
      </a>
    </section>
  );
}
