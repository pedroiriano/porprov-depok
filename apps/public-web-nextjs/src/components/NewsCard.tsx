import { PortalLink as Link } from './PortalProvider';
import { newsImageProxyPath, type DepokNewsArticle } from "@/lib/depok-news";

function formatDate(value: string): string {
  if (!value) return "Tanggal publikasi belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function NewsCard({ article, horizontal = false }: { article: DepokNewsArticle; horizontal?: boolean }) {
  const imageUrl = newsImageProxyPath(article.imageUrl);
  const primaryTag = article.tags && article.tags.length > 0 ? article.tags[0] : null;

  return (
    <article className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700 ${horizontal ? "lg:flex" : "flex h-full flex-col"}`}>
      <div className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-sky-500 ${horizontal ? "h-52 sm:h-56 lg:h-auto lg:w-64 xl:w-72 aspect-[16/10] lg:aspect-auto" : "aspect-[16/10] w-full"}`}>
        {primaryTag && (
          <span className="absolute start-3.5 top-3.5 z-10 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {primaryTag}
          </span>
        )}
        {imageUrl ? (
          // SECURITY: Gambar eksternal melewati proxy same-origin ber-allowlist agar CSP tetap ketat.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl text-white/75"><i className="ri-newspaper-line" aria-hidden="true" /></span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] text-primary-600 dark:text-sky-300">
          <i className="ri-calendar-line text-sm" aria-hidden="true" />
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </p>
        <h3 className="mt-2.5 text-lg sm:text-xl font-black leading-snug">
          <Link href={`/berita/${encodeURIComponent(article.slug)}`} className="line-clamp-2 transition hover:text-primary-600 dark:hover:text-sky-300">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2.5 line-clamp-2 sm:line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{article.summary}</p>
        <div className="mt-auto pt-5">
          <Link href={`/berita/${encodeURIComponent(article.slug)}`} className="inline-flex min-h-11 items-center text-sm font-black text-primary-600 transition hover:text-primary-700 dark:text-sky-300 dark:hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
            Baca selengkapnya <i className="ri-arrow-right-line ms-2 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
