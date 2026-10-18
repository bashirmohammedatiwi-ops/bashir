// عامل خدمة بسيط: لا يخزّن صفحات المتجر (الأسعار والمخزون تتغيّر)،
// فقط صفحة «لا يوجد اتصال» حين تنقطع الشبكة أثناء التنقل.
const OFFLINE = "dh-offline-v1";
const PAGE = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>لا يوجد اتصال</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F8F6FB;font-family:system-ui,sans-serif;color:#1A1426;text-align:center;padding:24px}
.c{max-width:340px}.e{font-size:64px}h1{font-size:22px;margin:12px 0 6px}p{color:#655F72;line-height:1.8}button{margin-top:16px;border:0;border-radius:999px;padding:12px 28px;font-weight:700;color:#fff;background:linear-gradient(90deg,#6E45B0,#9B6BD8);font-size:15px}</style></head>
<body><div class="c"><div class="e">📶</div><h1>لا يوجد اتصال بالإنترنت</h1><p>تأكدي من الشبكة وحاولي مرة أخرى — سلّتكِ محفوظة ولن تضيع.</p><button onclick="location.reload()">إعادة المحاولة</button></div></body></html>`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(OFFLINE).then((c) => c.put("/__offline", new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } }))));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => caches.match("/__offline")));
});
