import { NextResponse } from "next/server";

/** أخطاء المتصفح (من شاشة «حدث خطأ» ومن window.onerror) ← سجل حاوية المتجر، لتشخيص أجهزة لا نملكها. */
export async function POST(req: Request) {
  const text = (await req.text().catch(() => "")).slice(0, 4000);
  console.error("[client-error]", text.replace(/\s+/g, " "), "| ua:", (req.headers.get("user-agent") ?? "").slice(0, 200));
  return new NextResponse(null, { status: 204 });
}
