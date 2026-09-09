import Link from "next/link";
import { newsImageProxyPath, type DepokNewsArticle } from "@/lib/depok-news";

function formatDate(value: string): string {
  if (!value) return "Tanggal publikasi belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function NewsCard({ article, horizontal = false }: { article: DepokNewsArticle; horizontal?: boolean }) {
  const imageUrl = newsImageProxyPath(article.imageUrl);
  return (
    <article className={`group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${horizontal ? "lg:flex" : "flex h-full flex-col"}`}>
      <div className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-sky-500 ${horizontal ? "h-52 lg:h-auto lg:w-52" : "h-52"}`}>
        {imageUrl ? (
          // SECURITY: Gambar eksternal melewati proxy same-origin ber-allowlist agar CSP tetap ketat.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl text-white/75"><i className="ri-newspaper-line" aria-hidden="true" /></span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-primary-600 dark:text-sky-300">{formatDate(article.publishedAt)}</p>
        <h3 className="mt-3 text-xl font-black leading-snug"><Link href={`/berita/${encodeURIComponent(article.slug)}`} className="transition hover:text-primary-600 dark:hover:text-sky-300">{article.title}</Link></h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{article.summary}</p>
        <Link href={`/berita/${encodeURIComponent(article.slug)}`} className="mt-auto inline-flex min-h-11 items-center pt-5 text-sm font-black text-primary-600 dark:text-sky-300">Baca selengkapnya <i className="ri-arrow-right-line ms-2 transition group-hover:translate-x-1" aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
