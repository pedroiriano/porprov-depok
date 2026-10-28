import type { MetadataRoute } from "next";
import { loadDepokNewsOverview } from "@/lib/depok-news";
import { loadPortalConfig,localModule } from '@/lib/portal-config';


// SEO: Feed berita berubah independen dari build aplikasi, sehingga sitemap
// dibentuk pada runtime dan tetap memiliki fallback rute statis saat API gagal.
export const dynamic = "force-dynamic";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://porprov.depok.go.id").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const portal=await loadPortalConfig();
  if(!portal)return [{url:siteUrl,changeFrequency:'daily',priority:1}];
  const news = localModule(portal,'berita')?await loadDepokNewsOverview(100, 0):{latest:[]};
  const articles = Array.from(
    new Map(news.latest.map((article) => [article.slug, article])).values(),
  );

  const routes=portal.pages.filter(p=>p.status==='published'&&(!p.module_id||localModule(portal,p.module_id))).map(p=>p.path==='/'?'':p.path);
  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
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
