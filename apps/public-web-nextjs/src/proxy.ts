import { NextRequest, NextResponse } from "next/server";

function buildContentSecurityPolicy(nonce: string) {
  const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const developmentStylePolicy = process.env.NODE_ENV === "development" ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptPolicy}`,
    "script-src-attr 'none'",
    `style-src 'self'${developmentStylePolicy}`,
    `style-src-elem 'self'${developmentStylePolicy}`,
    // SECURITY: Next Image, next-themes, dan Leaflet masih memerlukan style
    // attribute dinamis. Scope ini lebih sempit daripada unsafe-inline pada
    // seluruh style-src.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  // SECURITY: Nonce unik per response memungkinkan hydration Next.js tanpa
  // unsafe-inline pada script production. Request header diperlukan agar
  // renderer Next.js menerapkan nonce yang sama pada script framework.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|robots.txt|sitemap.xml|sw.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
