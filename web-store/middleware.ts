import { NextResponse, type NextRequest } from "next/server";

const LEGACY = new Set(["/product", "/category", "/brand", "/package"]);

/**
 * - روابط الموقع القديم (/product/?slug=x) ← /product/x
 * - ?world=x يحفظ العالم في الكوكي ليتلوّن كل الموقع به.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const slug = searchParams.get("slug");
  if (LEGACY.has(pathname) && slug) {
    const url = req.nextUrl.clone();
    url.pathname = `${pathname}/${encodeURIComponent(slug)}`;
    url.searchParams.delete("slug");
    return NextResponse.redirect(url, 308);
  }
  const world = searchParams.get("world");
  if (world && /^[a-z0-9-]{1,40}$/i.test(world) && req.cookies.get("world")?.value !== world) {
    // نفس الطلب يرى العالم الجديد (الهيدر واللون) — لا ينتظر الطلب التالي.
    req.cookies.set("world", world);
    const headers = new Headers(req.headers);
    headers.set("cookie", req.cookies.toString());
    const res = NextResponse.next({ request: { headers } });
    res.cookies.set("world", world, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|media|.*\\..*).*)"] };
