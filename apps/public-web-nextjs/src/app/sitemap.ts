import type { MetadataRoute } from "next";

const PUBLIC_ROUTES = ["", "/cabor", "/city-guide", "/jadwal", "/livescore", "/medali", "/venue"];

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://porprov.depok.go.id").replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "hourly",
    priority: route === "" ? 1 : 0.8,
  }));
}
