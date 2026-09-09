import Link from "next/link";
import { loadDepokNewsOverview } from "@/lib/depok-news";
import { NewsCard } from "@/components/NewsCard";

export async function NewsSection() {
  const news = await loadDepokNewsOverview(6, 3);
  return (
    <section id="berita" className="relative scroll-mt-24 bg-slate-50 py-16 dark:bg-slate-950 md:py-24" aria-labelledby="featured-news-title">
      <div className="container relative">
        <div className="grid items-end gap-6 md:grid-cols-12">
          <div className="text-center md:col-span-8 md:text-start">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-primary-600 dark:text-sky-300">Kabar Kota Tuan Rumah</p>
            <h2 id="featured-news-title" className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Berita Pilihan Depok</h2>
            <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">Informasi terkini Kota Depok untuk menyertai perjalanan PORPROV XV Jawa Barat 2026.</p>
          </div>
          <div className="text-center md:col-span-4 md:text-end">
            <Link href="/berita" className="inline-flex min-h-11 items-center font-black text-primary-600 hover:text-primary-700 dark:text-sky-300">Lihat semua berita <i className="ri-arrow-right-line ms-2" aria-hidden="true" /></Link>
          </div>
        </div>

        {news.latest.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900" role={news.status === "unavailable" ? "alert" : "status"}>
            <i className="ri-newspaper-line text-4xl text-primary-500" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black">Berita Depok belum dapat ditampilkan</h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-500 dark:text-slate-400">Portal PORPROV tetap dapat digunakan. Berita akan muncul kembali setelah koneksi sumber berita tersedia.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <div className="grid gap-6 lg:col-span-8">
              {news.latest.map((article) => <NewsCard key={article.id} article={article} horizontal />)}
            </div>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-28 lg:col-span-4 lg:self-start" aria-labelledby="popular-news-title">
              <h3 id="popular-news-title" className="rounded-lg bg-slate-100 p-3 text-center text-lg font-black dark:bg-slate-800">Berita populer</h3>
              <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
                {news.popular.map((article, index) => (
                  <Link key={article.id} href={`/berita/${encodeURIComponent(article.slug)}`} className="group flex min-h-20 gap-4 py-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-500/10 font-black text-primary-600 dark:text-sky-300">{String(index + 1).padStart(2, "0")}</span>
                    <span><strong className="line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-sky-300">{article.title}</strong><small className="mt-1 block text-slate-500">Portal Berita Depok</small></span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
