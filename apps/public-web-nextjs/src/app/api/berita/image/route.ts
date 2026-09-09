import { NextRequest, NextResponse } from "next/server";
import { isAllowedNewsAssetUrl } from "@/lib/depok-news";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url") || "";
  if (!isAllowedNewsAssetUrl(sourceUrl)) {
    return NextResponse.json({ message: "Sumber gambar tidak diizinkan." }, { status: 400 });
  }

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "error",
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
      signal: AbortSignal.timeout(5_000),
    });
    const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() || "";
    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (!response.ok || !ALLOWED_IMAGE_TYPES.has(contentType) || declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ message: "Gambar tidak dapat diproses." }, { status: 422 });
    }
    const body = await response.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ message: "Ukuran gambar tidak valid." }, { status: 422 });
    }
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Content-Type": contentType,
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Gambar sedang tidak tersedia." }, { status: 502 });
  }
}
