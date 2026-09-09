import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { PublicPageHero } from "@/components/PublicPageHero";
import { loadDepokNewsBySlug, loadDepokNewsOverview, newsImageProxyPath } from "@/lib/depok-news";

const getArticle = cache(loadDepokNewsBySlug);

function formatDate(value: string): string {
  if (!value) return "Tanggal publikasi belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getArticle(slug);
  if (!result.article) return { title: "Berita Kota Depok" };
  return {
    title: result.article.title,
    description: result.article.summary,
    alternates: { canonical: `/berita/${result.article.slug}` },
    openGraph: { type: "article", title: result.article.title, description: result.article.summary, images: result.article.imageUrl ? [result.article.imageUrl] : undefined, publishedTime: result.article.publishedAt || undefined },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getArticle(slug);
  if (!result.article && result.status === "ready") notFound();
  const article = result.article;
  const overview = await loadDepokNewsOverview(5, 5);

  if (!article) {
    return (
      <main className="bg-slate-50 dark:bg-slate-950">
        <PublicPageHero eyebrow="Kabar Kota Tuan Rumah" title="Berita belum dapat dibuka" description="Sumber berita sedang tidak tersedia. Portal PORPROV dan informasi pertandingan tetap dapat digunakan." icon="ri-newspaper-line" breadcrumbs={[{ href: "/berita", label: "Berita" }, { label: "Tidak tersedia" }]} />
        <div className="container py-16 text-center"><Link href="/berita" className="inline-flex min-h-12 items-center rounded-lg bg-primary-600 px-6 font-black text-white"><i className="ri-arrow-left-line me-2" aria-hidden="true" />Kembali ke daftar berita</Link></div>
      </main>
    );
  }

  const paragraphs = article.content.split(/\n{2,}|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/).map((item) => item.trim()).filter(Boolean);
  const imageUrl = newsImageProxyPath(article.imageUrl);
  const nonce = (await headers()).get("x-nonce") || undefined;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.publishedAt || undefined,
    mainEntityOfPage: `${siteUrl}/berita/${article.slug}`,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "GovernmentOrganization", name: "Pemerintah Kota Depok" },
    inLanguage: "id-ID",
  }).replace(/</g, "\\u003c");
  return (
    <main className="bg-slate-50 dark:bg-slate-950">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <PublicPageHero eyebrow="Berita Kota Depok" title={article.title} description={`${formatDate(article.publishedAt)} · ${article.author}`} icon="ri-newspaper-line" breadcrumbs={[{ href: "/berita", label: "Berita" }, { label: article.title }]} />
      <div className="container grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,2fr)_320px]">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {imageUrl && (
            // SECURITY: Proxy same-origin menjaga CSP/COEP dan membatasi host sumber.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="max-h-[560px] w-full object-cover" />
          )}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">{article.tags.map((tag) => <Link key={tag} href={`/berita?tag=${encodeURIComponent(tag)}`} className="inline-flex min-h-11 items-center rounded-full bg-primary-500/10 px-4 text-sm font-black text-primary-700 dark:text-sky-300">{tag}</Link>)}</div>
            <div className="mt-7 space-y-5 text-base leading-8 text-slate-700 dark:text-slate-200">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div>
            <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
              <p className="text-sm text-slate-500">Sumber: Portal Berita Depok</p>
              {article.sourceUrl && <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center font-black text-primary-600 dark:text-sky-300">Buka artikel sumber <i className="ri-external-link-line ms-2" aria-hidden="true" /><span className="sr-only"> di tab baru</span></a>}
            </div>
          </div>
        </article>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="related-news-title">
          <h2 id="related-news-title" className="rounded-lg bg-slate-100 p-3 text-center text-lg font-black dark:bg-slate-800">Berita terbaru</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{overview.latest.filter((item) => item.slug !== article.slug).slice(0, 5).map((item) => <Link key={item.id} href={`/berita/${encodeURIComponent(item.slug)}`} className="block min-h-16 py-4 font-bold leading-snug hover:text-primary-600 dark:hover:text-sky-300">{item.title}<small className="mt-1 block font-normal text-slate-500">{formatDate(item.publishedAt)}</small></Link>)}</div>
        </aside>
      </div>
    </main>
  );
}
