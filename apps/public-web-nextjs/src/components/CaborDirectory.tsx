"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { publicCaborPath, type CaborModel } from "@/lib/public-models";

export function CaborDirectory({ cabors }: { cabors: CaborModel[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("semua");
  const categories = useMemo(
    () => ["semua", ...Array.from(new Set(cabors.map((item) => item.category))).sort((a, b) => a.localeCompare(b, "id"))],
    [cabors],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id");
    return cabors.filter((item) => {
      const categoryMatches = category === "semua" || item.category === category;
      const queryMatches = !normalizedQuery || `${item.name} ${item.description}`.toLocaleLowerCase("id").includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [cabors, category, query]);

  return (
    <section className="container py-14 md:py-20" aria-labelledby="cabor-directory-title">
      <h2 id="cabor-directory-title" className="sr-only">Daftar cabang olahraga</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_2fr] lg:items-center">
          <label className="relative block" htmlFor="cabor-search">
            <span className="sr-only">Cari cabang olahraga</span>
            <i className="ri-search-line pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="cabor-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari cabang olahraga…" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-4 ps-11 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <div className="flex flex-wrap justify-center gap-2 lg:justify-end" aria-label="Filter kategori cabang olahraga">
            {categories.map((item) => {
              const active = category === item;
              return (
                <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={active} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-black transition ${active ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>
                  {item === "semua" ? "Semua" : item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-7 text-sm font-bold text-slate-500" aria-live="polite">Menampilkan {filtered.length} dari {cabors.length} cabang olahraga.</p>
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
          <i className="ri-search-eye-line text-4xl text-slate-400" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-black">Cabang olahraga tidak ditemukan</h3>
          <p className="mt-2 text-slate-500">Ubah kata pencarian atau pilih kategori lain.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-[30px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((cabor) => (
            <Link key={cabor.id} href={publicCaborPath(cabor)} className="group relative flex min-h-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-sky-500 p-7">
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true" />
                <span className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/95 text-4xl text-primary-700 shadow-lg">
                  {cabor.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cabor.iconUrl} alt="" className="size-16 object-contain" />
                  ) : <i className="ri-medal-fill" aria-hidden="true" />}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">{cabor.category}</p>
                <h3 className="mt-2 text-xl font-black transition group-hover:text-primary-600 dark:group-hover:text-primary-300">{cabor.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{cabor.description}</p>
                <span className="mt-auto inline-flex min-h-11 items-center pt-5 text-sm font-black text-primary-600 dark:text-primary-300">Lihat detail <i className="ri-arrow-right-line ms-2 transition group-hover:translate-x-1" aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
