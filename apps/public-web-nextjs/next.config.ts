import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  output: "standalone",
  // SECURITY: CSP per-response beserta nonce diterbitkan oleh src/proxy.ts.
  // HSTS dan header defensif final hanya diterbitkan oleh Nginx edge agar
  // response production tidak pernah memiliki header ganda.
  poweredByHeader: false,
  generateEtags: false,
  async rewrites() {
    return [
      {
        // INFO: Menjaga API browser tetap same-origin pada akses diagnostik
        // langsung port 3000; tujuan tetap API Gateway di jaringan Compose.
        source: "/api/v1/:path*",
        destination: "http://api-gateway:8000/api/v1/:path*",
      },
      {
        // INFO: Media Library juga diproksikan same-origin agar kebijakan
        // Cross-Origin-Resource-Policy tidak memblokir gambar pada localhost.
        source: "/uploads/:path*",
        destination: "http://api-gateway:8000/uploads/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
