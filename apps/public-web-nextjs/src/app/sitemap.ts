import type { MetadataRoute } from "next";
import { loadDepokNewsOverview } from "@/lib/depok-news";

const PUBLIC_ROUTES = ["", "/berita", "/cabor", "/city-guide", "/jadwal", "/livescore", "/medali", "/venue"];

// SEO: Feed berita berubah independen dari build aplikasi, sehingga sitemap
// dibentuk pada runtime dan tetap memiliki fallback rute statis saat API gagal.
export const dynamic = "force-dynamic";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://porprov.depok.go.id").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const news = await loadDepokNewsOverview(48, 24);
  const articles = Array.from(
    new Map([...news.latest, ...news.popular].map((article) => [article.slug, article])).values(),
  );

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "hourly",
    priority: route === "" ? 1 : 0.8,
  }));

  const newsRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/berita/${article.slug}`,
    lastModified: article.publishedAt ? new Date(article.publishedAt) : lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...newsRoutes];
}
