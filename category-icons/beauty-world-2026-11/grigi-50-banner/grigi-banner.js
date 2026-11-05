// بنر «عالم الجمال» الأول: GRIGI خصم 50% — بأسلوب حملة Black & Berry (نفس بوست الإنستغرام).
// usage: node grigi-banner.js  → out_photo/h_grigi50.jpg
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const G = 'D:/alhayat-app/category-icons/instagram-grigi-2026/assets';
const url = (p) => 'file:///' + p.replace(/\\/g, '/');
const photo = (f) => url(path.join(G, 'photos', f));
const prod = (f) => url(path.join(G, 'products', f + '.webp'));
const W = 2150, H = 1000;
const C = { noir: '#0D0A0C', wine: '#3A0614', berry: '#7E0F2C', crimson: '#A3173B', blush: '#F4D9D6' };

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,500..800&family=Montserrat:wght@300;400;500;600&family=Jost:wght@400;500&display=block" rel="stylesheet">`;
const logo = (size, color = '#fff', box = false) => {
  const w = `<span class="lat" style="display:inline-flex;align-items:center;font-family:Montserrat;font-weight:400;font-size:${size}px;line-height:1;letter-spacing:.09em;color:${color}">GR<span style="display:inline-block;width:${size * 0.075}px;height:${size * 0.74}px;background:${color};transform:skewX(24deg);margin:0 ${size * 0.11}px 0 ${size * 0.05}px"></span>GI</span>`;
  return box ? `<span style="display:inline-flex;padding:${size * 0.3}px ${size * 0.48}px;border:${Math.max(2, size * 0.04)}px solid ${color}">${w}</span>` : w;
};
const ICONS = {
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
};
const ICON = (n, s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${ICONS[n]}</svg>`;

// بطاقة منتج بيضاء صغيرة (صورة الكتالوج كما هي — بلا قص)
const card = (f, name, rot, x, y) => `<div class="a" style="left:${x}px;top:${y}px;width:220px;z-index:30;transform:rotate(${rot}deg);background:#fff;border-radius:26px;padding:14px 12px 16px;box-shadow:0 26px 50px rgba(0,0,0,.45);text-align:center;color:#1B1216">
  <span class="lat" style="position:absolute;top:12px;left:12px;font-family:Montserrat;font-weight:600;font-size:19px;color:#fff;background:${C.wine};padding:5px 11px;border-radius:999px">-50%</span>
  <div style="height:200px;display:grid;place-items:center"><img src="${prod(f)}" style="max-width:86%;max-height:196px;object-fit:contain"></div>
  <div style="margin-top:6px;font-weight:600;font-size:22px;line-height:1.25">${name}</div></div>`;

const body = `
<div class="a" style="inset:0;background:radial-gradient(120% 140% at 78% 40%, ${C.berry} 0%, ${C.wine} 45%, ${C.noir} 100%)"></div>
<div class="a" style="right:0;top:0;bottom:0;width:1350px;overflow:hidden;opacity:.38;mix-blend-mode:screen;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 40%);mask-image:linear-gradient(90deg,transparent 0%,#000 40%)"><img src="${photo('berry_swirl.jpg')}" style="width:100%;height:100%;object-fit:cover;filter:blur(2px) saturate(1.1)"></div>
<div class="a" style="left:0;top:0;bottom:0;width:980px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 58%,rgba(0,0,0,.6) 76%,transparent 100%);mask-image:linear-gradient(90deg,#000 0%,#000 58%,rgba(0,0,0,.6) 76%,transparent 100%)"><img src="${photo('model_berry.jpg')}" style="width:100%;height:100%;object-fit:cover;object-position:40% 24%"><div class="a" style="inset:0;background:linear-gradient(90deg, rgba(40,4,14,.6) 0%, rgba(40,4,14,0) 26%), linear-gradient(0deg, rgba(40,4,14,.7) 0%, rgba(40,4,14,0) 30%)"></div></div>
<div class="a" style="right:120px;top:0;height:${H}px;width:1000px;z-index:40;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right">
  <div style="display:flex;align-items:center;gap:26px">
    <span class="lat" style="font-family:Jost;font-weight:500;font-size:28px;letter-spacing:.4em;color:${C.blush}">MADE IN GREECE</span>${logo(64, '#fff', true)}</div>
  <div style="margin-top:26px;display:flex;align-items:flex-start;gap:26px;direction:rtl">
    <div style="display:flex;flex-direction:column;align-items:flex-start;padding-top:62px;gap:14px">
      <span style="font-weight:700;font-size:80px;line-height:1;color:#fff">خصم</span>
      <span style="width:96px;height:4px;background:${C.blush};opacity:.8"></span></div>
    <div class="lat" style="font-family:'Bodoni Moda';font-weight:600;font-size:380px;line-height:.8;letter-spacing:-.03em;background:linear-gradient(176deg, #fff 8%, ${C.blush} 55%, #E9A9B4 100%);-webkit-background-clip:text;color:transparent;padding:8px 0 18px">50<span style="font-family:Montserrat;font-weight:300;font-size:.42em;vertical-align:top;position:relative;top:.2em;margin-left:.04em">%</span></div>
  </div>
  <div style="margin-top:4px;font-weight:700;font-size:76px;line-height:1.15;color:#fff">على كل منتجات كريجي</div>
  <div style="margin-top:28px;display:flex;gap:18px;direction:rtl">${[['store', 'في محل ديما الحياة'], ['phone', 'وعلى التطبيق']].map(([i, t]) => `<span style="display:inline-flex;align-items:center;gap:14px;padding:14px 32px;border-radius:999px;background:rgba(255,255,255,.1);border:2px solid rgba(244,217,214,.6);font-weight:600;font-size:42px;color:#fff;white-space:nowrap">${ICON(i, 42, C.blush)}${t}</span>`).join('')}</div>
  <div style="margin-top:34px;display:inline-flex;align-items:center;gap:18px;height:118px;padding:0 60px;border-radius:999px;background:${C.blush};color:${C.wine};font-weight:700;font-size:52px">تسوّقي العرض <span style="font-family:Jost;font-weight:400">←</span></div>
</div>
<div class="a" style="inset:0;z-index:95;opacity:.06;mix-blend-mode:overlay;pointer-events:none;background:url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>&quot;)"></div>`;

const html = `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden}body{position:relative;background:${C.noir};font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased;color:#fff}.a{position:absolute}.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}</style></head><body>${body}</body></html>`;
const hp = path.join(__dirname, 'html_photo', 'h_grigi50.html');
fs.writeFileSync(hp, html);
execFileSync('node', [path.join(__dirname, '..', 'pw', 'shot.js'), hp, path.join(__dirname, 'out_photo', 'h_grigi50.jpg'), String(W), String(H), 'view', '1'], { stdio: 'inherit' });
console.log('rendered h_grigi50');
