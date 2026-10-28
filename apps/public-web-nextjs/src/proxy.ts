import { NextRequest, NextResponse } from "next/server";
import { loadPortalConfig, portalPageFor, defaultPortalConfig } from './lib/portal-config';

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
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  // SECURITY: Nonce unik per response memungkinkan hydration Next.js tanpa
  // unsafe-inline pada script production. Request header diperlukan agar
  // renderer Next.js menerapkan nonce yang sama pada script framework.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  let destination: URL | null=null;
  let status=200;
  const path=request.nextUrl.pathname;
  // RELIABILITY: Authorized for local implementation; managed feature routes only. Root, recovery and assets are not guarded.
  const builtin=portalPageFor(defaultPortalConfig,path);
  if (builtin && path!=='/' || path.startsWith('/informasi/')) {
    const portal=await loadPortalConfig();
    if(!portal){destination=new URL('/portal-unavailable',request.url);status=503;}
    else {
      const page=portalPageFor(portal,path);
      const portalModule=page&&portal.modules.find(m=>m.id===page.module_id);
      if(!page || page.status!=='published' || portalModule&&(!portalModule.public_enabled||portalModule.mode==='disabled')){destination=new URL('/portal-unavailable',request.url);status=404;}
      else if(portalModule?.mode==='external')destination=new URL(`/rujukan/${portalModule.id}`,request.url);
    }
  }
  const response = destination ? NextResponse.rewrite(destination,{status,request:{headers:requestHeaders}}) : NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  if (builtin || path.startsWith('/informasi/')) response.headers.set('Cache-Control','no-store');
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|robots.txt|sitemap.xml|sw.js).*)",
    },
  ],
};
