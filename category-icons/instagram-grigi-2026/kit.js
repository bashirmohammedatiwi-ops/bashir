// بوست إنستغرام GRIGI — خصم 50% على كل المنتجات (1080×1350، يُصدَّر ×2).
// أسلوب «Black & Berry» من حملة GRIGI: أسود، توتي، وردي بودري، رقم Bodoni كبير، وألوان الدرجات الحقيقية من الكتالوج.
// كل شريحة: أيقونة التطبيق + «متوفر على App Store» + «العروض في محل ديما الحياة وعلى التطبيق».
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ASSETS = path.join(ROOT, 'assets');
const W = 1080, H = 1350;
const url = (p) => 'file:///' + p.replace(/\\/g, '/');
const photo = (f) => url(path.join(ASSETS, 'photos', f));
const PRODUCTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));
const P = (short) => {
  const p = PRODUCTS.find((x) => x.id.startsWith(short));
  if (!p) throw new Error('product not in products.json: ' + short);
  return { ...p, img: url(path.join(ASSETS, 'products', short + '.webp')) };
};
const money = (n) => Number(n || 0).toLocaleString('en-US');

const C = {
  noir: '#0D0A0C', wine: '#3A0614', berry: '#7E0F2C', crimson: '#A3173B', blush: '#F4D9D6', nude: '#E8CFC2',
  ink: '#1B1216', muted: '#8C7479', pink: '#E2336B', navy: '#151D36',
};

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..700&family=Montserrat:wght@300;400;500;600&family=Jost:wght@300;400;500&family=Inter:wght@500;600;700&display=block" rel="stylesheet">`;
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:${C.noir};font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased;color:#fff}
.a{position:absolute}
.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.caps{font-family:Jost;font-weight:400;letter-spacing:.42em;text-transform:uppercase}
.bod{font-family:'Bodoni Moda';font-weight:600}
.grain{inset:0;opacity:.07;mix-blend-mode:overlay;z-index:95;pointer-events:none;
 background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
`;

/** شعار GR\GI: حروف هندسية رفيعة، والـ I الوسطى خط مائل. */
function logo(size, color = '#fff', { box = false } = {}) {
  const word = `<span class="lat" style="display:inline-flex;align-items:center;font-family:Montserrat;font-weight:400;font-size:${size}px;line-height:1;letter-spacing:.09em;color:${color}">GR<span style="display:inline-block;width:${size * 0.075}px;height:${size * 0.74}px;background:${color};transform:skewX(24deg);margin:0 ${size * 0.11}px 0 ${size * 0.05}px"></span>GI</span>`;
  return box ? `<span style="display:inline-flex;padding:${size * 0.32}px ${size * 0.5}px;border:${Math.max(2, size * 0.04)}px solid ${color}">${word}</span>` : word;
}

const APPLE = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`;
function appStoreBadge(scale = 1, dark = true) {
  const h = 64 * scale;
  const bg = dark ? '#000' : '#fff', fg = dark ? '#fff' : '#000';
  return `<div style="display:inline-flex;align-items:center;gap:${12 * scale}px;height:${h}px;padding:0 ${20 * scale}px 0 ${22 * scale}px;border-radius:${14 * scale}px;background:${bg};color:${fg};direction:ltr;border:${1.5 * scale}px solid ${dark ? 'rgba(255,255,255,.55)' : '#fff'};box-shadow:0 ${6 * scale}px ${18 * scale}px rgba(0,0,0,.25)">
    <span style="width:${32 * scale}px;height:${38 * scale}px;display:block;margin-top:-${4 * scale}px">${APPLE}</span>
    <span style="display:flex;flex-direction:column;align-items:flex-end;line-height:1">
      <span style="font-family:'IBM Plex Sans Arabic';font-weight:500;font-size:${15 * scale}px;opacity:.9;margin-bottom:${4 * scale}px">متوفر على</span>
      <span style="font-family:Inter;font-weight:600;font-size:${27 * scale}px;letter-spacing:-.01em">App Store</span></span></div>`;
}
const appIcon = (size, glow) =>
  `<img src="${url(path.join(ASSETS, 'app_icon.png'))}" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;display:block;flex:none;box-shadow:0 ${size * 0.08}px ${size * 0.3}px rgba(0,0,0,.4)${glow ? `, 0 0 ${size * 0.8}px ${glow}` : ''};border:1px solid rgba(255,255,255,.18)">`;

const ICONS = {
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  crown: '<path d="m2 7 5 5 5-8 5 8 5-5-2 12H4Z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
};
const ICON = (name, size, color, sw = 1.8) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${ICONS[name]}</svg>`;

// ---------- إطار ثابت ----------
function topBar(ink = '#fff', accent = C.blush) {
  return `<div class="a" style="top:50px;right:60px;left:60px;z-index:80;display:flex;align-items:center;justify-content:space-between;color:${ink}">
    <div style="display:flex;align-items:center;gap:16px">${appIcon(62)}
      <div style="display:flex;flex-direction:column;gap:5px"><span style="font-weight:700;font-size:27px;line-height:1">ديما الحياة</span>
      <span class="lat" style="font-family:Jost;font-weight:400;font-size:13.5px;letter-spacing:.42em;opacity:.65;line-height:1">DEEMA ALHAYAT</span></div></div>
    <div style="display:flex;align-items:center;gap:16px">
      <span style="font-weight:700;font-size:21px;padding:6px 16px;border-radius:999px;background:${accent};color:${C.wine}">خصم <span class="lat">50%</span></span>
      ${logo(26, ink)}</div>
  </div>`;
}
function bottomBar(ink = '#fff', { text = 'العروض في محل ديما الحياة وعلى التطبيق', icon = 'store', dark = true, plate } = {}) {
  return `<div class="a" style="bottom:46px;right:60px;left:60px;z-index:80;display:flex;align-items:center;justify-content:space-between;color:${ink}">
    <div style="display:flex;align-items:center;gap:14px;${plate ? `background:${plate};padding:8px 22px 8px 8px;border-radius:999px;` : ''}">${appIcon(52)}<span style="display:flex;align-items:center;gap:10px;font-weight:500;font-size:25px">${ICON(icon, 26, ink)}${text}</span></div>
    ${appStoreBadge(1, dark)}
  </div>`;
}
const channels = (k = 1, { fg = '#fff', bg = 'rgba(255,255,255,.1)', bd = 'rgba(244,217,214,.55)', ic = C.blush } = {}) =>
  `<div style="display:flex;gap:${14 * k}px;justify-content:center;direction:rtl">${[['store', 'في محل ديما الحياة'], ['phone', 'وعلى التطبيق']].map(([i, t]) => `<span style="display:inline-flex;align-items:center;gap:${10 * k}px;padding:${10 * k}px ${24 * k}px;border-radius:999px;background:${bg};border:1.5px solid ${bd};font-weight:600;font-size:${25 * k}px;color:${fg};white-space:nowrap;backdrop-filter:blur(6px)">${ICON(i, 27 * k, ic)}${t}</span>`).join('')}</div>`;

/** «50%» بخط Bodoni مع «خصم». */
function bigPct(size = 300, { color = '#fff', grad, label = 'خصم', labelColor = '#fff' } = {}) {
  const fill = grad ? `background:${grad};-webkit-background-clip:text;color:transparent` : `color:${color}`;
  return `<div style="display:flex;align-items:flex-start;justify-content:center;gap:${size * 0.07}px;direction:rtl">
    <div style="display:flex;flex-direction:column;align-items:flex-start;padding-top:${size * 0.16}px;gap:${size * 0.04}px">
      <span style="font-weight:600;font-size:${size * 0.2}px;line-height:1;color:${labelColor}">${label}</span>
      <span style="width:${size * 0.26}px;height:${Math.max(2, size * 0.012)}px;background:${labelColor};opacity:.7"></span></div>
    <div class="lat bod" style="font-weight:600;font-size:${size}px;line-height:.8;letter-spacing:-.03em;${fill};padding:${size * 0.02}px 0 ${size * 0.05}px">50<span style="font-family:Montserrat;font-weight:300;font-size:.42em;vertical-align:top;position:relative;top:.2em;margin-left:.04em">%</span></div>
  </div>`;
}

/** السعر الجديد + القديم مشطوب. */
const priceLine = (p, { size = 32, color = '#fff', old = 'rgba(255,255,255,.5)', center = false } = {}) =>
  `<div style="display:flex;align-items:baseline;gap:${size * 0.4}px;${center ? 'justify-content:center' : ''};direction:rtl">
    <span style="font-weight:700;font-size:${size}px;color:${color}">${money(p.price)} <span style="font-size:.62em;font-weight:500">د.ع</span></span>
    <span style="font-weight:400;font-size:${size * 0.62}px;color:${old};text-decoration:line-through">${money(p.originalPrice)}</span></div>`;

/** دوائر الدرجات من الكتالوج. */
const swatches = (p, n = 8, d = 26, ring = 'rgba(255,255,255,.9)') => {
  const s = p.shades || [];
  const more = s.length > n ? `<span style="font:600 ${d * 0.62}px Inter;color:inherit;opacity:.75;margin-right:4px" class="lat">+${s.length - n}</span>` : '';
  return `<div style="display:flex;align-items:center;gap:${d * 0.28}px;direction:ltr">${s.slice(0, n).map((x) => `<span style="width:${d}px;height:${d}px;border-radius:50%;background:${x.hex};box-shadow:0 0 0 2px ${ring}, 0 3px 8px rgba(0,0,0,.25);flex:none"></span>`).join('')}${more}</div>`;
};

const pill = (bg = C.blush, fg = C.wine, size = 22) =>
  `<span class="lat" style="font-family:Montserrat;font-weight:600;font-size:${size}px;color:${fg};background:${bg};padding:${size * 0.28}px ${size * 0.55}px;border-radius:999px">-50%</span>`;

/** بطاقة منتج بيضاء. */
function card(p, name, { w = 300, imgH = 230, accent = C.crimson, shadesN = 0 } = {}) {
  return `<div style="width:${w}px;flex:none;background:#fff;border-radius:30px;padding:18px 16px 20px;display:flex;flex-direction:column;align-items:center;position:relative;box-shadow:0 22px 44px rgba(0,0,0,.3);color:${C.ink}">
    <span style="position:absolute;top:16px;left:16px">${pill(C.wine, '#fff', 19)}</span>
    <div style="height:${imgH}px;width:100%;display:grid;place-items:center"><img src="${p.img}" style="max-width:88%;max-height:${imgH}px;object-fit:contain"></div>
    ${shadesN ? `<div style="margin-top:8px;color:${C.ink}">${swatches(p, shadesN, 18, '#fff')}</div>` : ''}
    <div style="margin-top:10px;font-weight:600;font-size:22px;line-height:1.3;text-align:center;min-height:57px;display:flex;align-items:center;justify-content:center"><span>${name}</span></div>
    <div style="margin-top:6px">${priceLine(p, { size: 29, color: accent, old: '#A8979B', center: true })}</div></div>`;
}

/** صف منتج أفقي. */
function row(p, name, sub, { accent = C.crimson, bg = '#fff', ink = C.ink, imgS = 112, fs = 26, stack = false } = {}) {
  return `<div style="display:flex;align-items:center;gap:20px;background:${bg};border-radius:26px;padding:12px 24px 12px 12px;box-shadow:0 16px 34px rgba(0,0,0,.22);color:${ink}">
    <div style="width:${imgS}px;height:${imgS}px;flex:none;border-radius:20px;background:#fff;display:grid;place-items:center;overflow:hidden"><img src="${p.img}" style="width:${imgS * 0.92}px;height:${imgS * 0.92}px;object-fit:contain"></div>
    <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:${fs}px;line-height:1.25">${name}</div>${sub ? `<div style="font-size:20px;opacity:.6;margin-top:3px">${sub}</div>` : ''}</div>
    <div style="flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:4px">${pill(C.wine, '#fff', 17)}${stack ? `<span style="font-weight:700;font-size:29px;color:${accent}">${money(p.price)} <span style="font-size:.62em;font-weight:500">د.ع</span></span><span style="font-size:19px;color:#A8979B;text-decoration:line-through">${money(p.originalPrice)}</span>` : priceLine(p, { size: 30, color: accent, old: '#A8979B' })}</div></div>`;
}

// ---------- الهاتف ----------
function appScreen() {
  const g1 = '#8E3FB3', g2 = '#C16FD9';
  const chips = [['سحر الجمال', 1], ['طقوس العناية'], ['أناقة الرجل'], ['حكاية عطر']];
  const cards = [[P('c82948b9'), 'أحمر شفاه سائل Only Matte'], [P('9d301496'), 'كريم أساس Pro Luminous'], [P('1b1ec0fc'), 'ماسكارا Premium Pro']];
  const c = ([p, n]) => `<div style="width:112px;flex:none;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(30,20,40,.08)">
     <div style="height:108px;display:grid;place-items:center;position:relative"><img src="${p.img}" style="width:92px;height:92px;object-fit:contain">
       <span style="position:absolute;top:6px;right:6px;background:#E2336B;color:#fff;font:700 10.5px Inter;padding:2px 6px;border-radius:999px;direction:ltr">-50%</span></div>
     <div style="padding:5px 8px 9px;direction:rtl">
       <div style="font:500 10.5px/1.35 'IBM Plex Sans Arabic';color:#2A2433;height:28px;overflow:hidden">${n}</div>
       <div style="margin-top:3px;font:700 12.5px 'IBM Plex Sans Arabic';color:#E2336B">${money(p.price)} د.ع</div>
       <div style="font:400 10px 'IBM Plex Sans Arabic';color:#9A93A3;text-decoration:line-through">${money(p.originalPrice)}</div></div></div>`;
  return `<div style="width:390px;height:844px;background:#F7F5F9;position:relative;overflow:hidden;font-family:'IBM Plex Sans Arabic';direction:rtl">
    <div style="height:206px;background:linear-gradient(160deg, ${g1}, ${g2});border-radius:0 0 28px 28px;padding:54px 18px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;color:#fff">
        <div style="display:flex;align-items:center;gap:8px"><img src="${url(path.join(ASSETS, 'app_icon.png'))}" style="width:30px;height:30px;border-radius:8px"><div style="line-height:1.1"><div style="font:700 15px 'IBM Plex Sans Arabic'">ديما الحياة</div><div style="font:400 10px 'IBM Plex Sans Arabic';opacity:.85">مرحباً بكِ</div></div></div>
        <div style="display:flex;gap:8px">${['bell', 'heart', 'bag'].map((i) => `<span style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center">${ICON(i, 16, '#fff')}</span>`).join('')}</div></div>
      <div style="margin-top:14px;height:40px;border-radius:14px;background:#fff;display:flex;align-items:center;gap:8px;padding:0 14px;color:#9A93A3;font:400 12.5px 'IBM Plex Sans Arabic'">${ICON('search', 16, '#9A93A3')} ابحثي عن منتج، براند أو باركود…</div>
      <div style="display:flex;gap:8px;margin-top:14px">${chips.map(([n, on]) => `<span style="flex:none;padding:7px 12px;border-radius:12px;font:600 11.5px 'IBM Plex Sans Arabic';${on ? `background:#fff;color:${g1}` : 'background:rgba(255,255,255,.16);color:#fff'}">${n}</span>`).join('')}</div></div>
    <div style="margin:14px 14px 0;height:214px;border-radius:20px;overflow:hidden;box-shadow:0 10px 24px rgba(20,10,30,.18);position:relative;background:${C.wine}">
      <img src="${photo('model_berry.jpg')}" style="position:absolute;left:0;top:0;width:58%;height:100%;object-fit:cover;object-position:50% 22%">
      <div class="a" style="left:40%;top:0;bottom:0;width:22%;background:linear-gradient(90deg, rgba(58,6,20,0), ${C.wine})"></div>
      <div class="a" style="right:14px;top:22px;bottom:18px;width:150px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;color:#fff">
        ${logo(22, '#fff')}<div class="lat bod" style="font-size:66px;line-height:.85;color:${C.blush}">50<span style="font-family:Montserrat;font-weight:300;font-size:.42em">%</span></div>
        <div style="font:600 12px 'IBM Plex Sans Arabic';text-align:center;opacity:.9">على كل منتجات كريجي</div>
        <span style="background:#fff;color:${C.wine};font:700 11px 'IBM Plex Sans Arabic';padding:6px 14px;border-radius:999px">تسوّقي الآن ‹</span></div>
      <div style="position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:center;gap:4px">${[1, 0, 0, 0].map((a) => `<span style="height:5px;width:${a ? 16 : 5}px;border-radius:9px;background:rgba(255,255,255,${a ? 1 : 0.55})"></span>`).join('')}</div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 16px 10px">
      <div style="font:700 15.5px 'IBM Plex Sans Arabic';color:#1F1A26">كريجي — خصم 50%</div>
      <div style="font:600 11.5px 'IBM Plex Sans Arabic';color:${g1}">عرض الكل ‹</div></div>
    <div style="display:flex;gap:10px;padding:0 14px;direction:rtl">${cards.map(c).join('')}</div>
    <div style="position:absolute;bottom:22px;left:14px;right:14px;height:62px;border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(20,10,30,.14);display:flex;align-items:center;justify-content:space-around;padding:0 10px">
      <span style="background:${g1};color:#fff;font:600 12px 'IBM Plex Sans Arabic';padding:8px 14px;border-radius:16px;display:flex;align-items:center;gap:6px">${ICON('home', 15, '#fff')} الرئيسية</span>${['grid', 'crown', 'tag', 'cart', 'user'].map((i) => ICON(i, 20, '#8F879A')).join('')}</div>
  </div>`;
}
function iphone(screenHtml, { x, y, scale = 1, rotate = 0, z = 30 }) {
  const fw = 390 + 28, fh = 844 + 28;
  return `<div class="a" style="left:${x}px;top:${y}px;width:${fw}px;height:${fh}px;transform:scale(${scale}) rotate(${rotate}deg);transform-origin:top left;z-index:${z}">
    <div class="a" style="inset:0;border-radius:68px;background:linear-gradient(145deg,#5b5b60,#1c1c1f 30%,#3a3a3e 60%,#121214);box-shadow:0 60px 120px rgba(0,0,0,.65), 0 0 0 2px rgba(255,255,255,.08), inset 0 0 0 2px rgba(255,255,255,.12)"></div>
    <div class="a" style="inset:7px;border-radius:62px;background:#000"></div>
    <div class="a" style="left:14px;top:14px;width:390px;height:844px;border-radius:54px;overflow:hidden">${screenHtml}
      <div class="a" style="top:0;left:0;right:0;height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 30px;font:600 15px Inter;color:#fff;direction:ltr"><span>9:41</span><span style="display:flex;gap:6px;align-items:center">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".7" y=".7" width="22" height="10.6" rx="3" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><rect x="2.4" y="2.4" width="18.6" height="7.2" rx="1.8" fill="#fff"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="#fff" fill-opacity=".5"/></svg></span></div>
      <div class="a" style="top:11px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000"></div>
      <div class="a" style="inset:0;background:linear-gradient(115deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 38%);pointer-events:none"></div></div>
    <div class="a" style="right:-4px;top:200px;width:5px;height:96px;border-radius:3px;background:#2a2a2e"></div>
    <div class="a" style="left:-4px;top:170px;width:5px;height:60px;border-radius:3px;background:#2a2a2e"></div>
    <div class="a" style="left:-4px;top:250px;width:5px;height:60px;border-radius:3px;background:#2a2a2e"></div>
  </div>`;
}

/** بطاقة منتج مائلة (بولارويد). */
function floatCard(p, name, { x, y, w = 250, rotate = 0, z = 35 }) {
  return `<div class="a" style="left:${x}px;top:${y}px;width:${w}px;z-index:${z};transform:rotate(${rotate}deg);background:#fff;border-radius:26px;padding:14px 14px 18px;box-shadow:0 34px 60px rgba(0,0,0,.5);color:${C.ink};text-align:center">
    <div style="position:relative;height:${w * 0.86}px;display:grid;place-items:center"><img src="${p.img}" style="max-width:92%;max-height:100%;object-fit:contain">
      <span style="position:absolute;top:0;left:0">${pill(C.crimson, '#fff', 19)}</span></div>
    <div style="font-weight:600;font-size:20px;line-height:1.3;margin-top:6px">${name}</div>
    <div style="margin-top:4px">${priceLine(p, { size: 26, color: C.crimson, old: '#A8979B', center: true })}</div></div>`;
}

// ---------- الشرائح ----------
const SLIDES = [];

// 1 — الغلاف
SLIDES.push(() => {
  const sc = 0.64, pw = 418 * sc, ph = 872 * sc;
  return `
  <div class="a" style="inset:0;overflow:hidden"><img src="${photo('berry_swirl.jpg')}" style="width:100%;height:100%;object-fit:cover;filter:saturate(1.05) brightness(.9)"></div>
  <div class="a" style="inset:0;background:linear-gradient(180deg, rgba(20,2,8,.82) 0%, rgba(40,4,14,.35) 48%, rgba(20,2,8,.7) 82%, rgba(13,10,12,.95) 100%)"></div>
  ${topBar()}
  <div class="a" style="top:150px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
    ${logo(70, '#fff', { box: true })}
    <div class="lat caps" style="font-size:16px;margin-top:20px;color:${C.blush}">Professional make up · made in Greece</div>
    <div style="margin-top:14px">${bigPct(215, { grad: `linear-gradient(176deg, #fff 10%, ${C.blush} 60%, #E9A9B4 100%)` })}</div>
    <div style="margin-top:2px;font-weight:600;font-size:36px">على كل منتجات كريجي</div>
    <div style="margin-top:20px">${channels(0.9)}</div>
  </div>
  ${floatCard(P('c82948b9'), 'أحمر شفاه سائل<br><span class="lat">Only Matte</span>', { x: 46, y: 820, w: 250, rotate: -7 })}
  ${floatCard(P('9d301496'), 'كريم أساس<br><span class="lat">Pro Luminous</span>', { x: 784, y: 820, w: 250, rotate: 7 })}
  <div class="a" style="left:${W / 2 - 220}px;top:1215px;width:440px;height:40px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,0,0,.6), rgba(0,0,0,0));z-index:29"></div>
  ${iphone(appScreen(), { x: W / 2 - pw / 2, y: 1232 - ph, scale: sc })}
  ${bottomBar('#fff', { text: 'حمّلي تطبيق ديما الحياة الآن', icon: 'phone' })}
  <div class="a grain"></div>`;
});

// 2 — الموديل + نصف السعر
SLIDES.push(() => `
  <div class="a" style="inset:0;background:${C.noir}"></div>
  <div class="a" style="left:0;top:0;bottom:0;width:560px;overflow:hidden"><img src="${photo('model_berry.jpg')}" style="width:100%;height:100%;object-fit:cover;object-position:38% 30%"></div>
  <div class="a" style="left:380px;top:0;bottom:0;width:190px;background:linear-gradient(90deg, rgba(13,10,12,0), ${C.noir})"></div>
  <div class="a" style="left:0;top:0;width:560px;height:220px;background:linear-gradient(180deg, rgba(13,10,12,.6), rgba(13,10,12,0))"></div>
  ${topBar()}
  <div class="a" style="right:60px;top:210px;width:470px;z-index:40;text-align:right">
    <div class="lat caps" style="font-size:16px;color:${C.blush};text-align:right">Fall for black &amp; berry</div>
    <div style="margin-top:18px;font-weight:700;font-size:58px;line-height:1.15">نصف السعر<br>على كل كريجي</div>
    <div class="lat bod" style="margin-top:6px;font-size:230px;line-height:.9;letter-spacing:-.03em;text-align:right;background:linear-gradient(176deg, #F7C8D0 0%, #D24A6B 55%, ${C.crimson} 100%);-webkit-background-clip:text;color:transparent">50<span style="font-family:Montserrat;font-weight:300;font-size:.42em;vertical-align:top;position:relative;top:.2em;margin-left:.04em">%</span></div>
    <div style="font-size:25px;line-height:1.6;color:rgba(255,255,255,.75)">أحمر الشفاه، الماسكارا، كريم الأساس، البرايمر والباليتات — مكياج يوناني احترافي بنصف سعره.</div>
    <div style="margin-top:28px;display:flex;flex-direction:column;gap:14px">
      ${[[P('c82948b9'), 'أحمر شفاه سائل Only Matte'], [P('1b1ec0fc'), 'ماسكارا Premium Pro'], [P('54865083'), 'برايمر Perfect Pro']].map(([p, n]) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid rgba(244,217,214,.2)">
        <span style="font-weight:500;font-size:22px;color:rgba(255,255,255,.9)">${n.replace(/([A-Za-z][A-Za-z ]*[A-Za-z])/g, '<span class="lat">$1</span>')}</span>${priceLine(p, { size: 26, color: C.blush })}</div>`).join('')}
    </div></div>
  ${bottomBar()}
  <div class="a grain"></div>`);

// 3 — الشفاه
SLIDES.push(() => {
  const items = [[P('41294991'), 'أحمر شفاه ساتان <span class="lat">Pro</span>'], [P('6f868ba1'), 'أحمر شفاه سائل <span class="lat">Matte Pro</span>'], [P('572e09f9'), 'قلم شفاه مقاوم للماء'], [P('4862fc02'), 'كومبو مطفي + غلوس']];
  return `
  <div class="a" style="inset:0;background:radial-gradient(90% 70% at 50% 30%, #6E0C27 0%, ${C.wine} 60%, #1C030A 100%)"></div>
  <div class="a" style="right:-160px;top:-120px;width:620px;height:620px;border-radius:50%;overflow:hidden;opacity:.55;-webkit-mask-image:radial-gradient(closest-side,#000 55%,transparent);mask-image:radial-gradient(closest-side,#000 55%,transparent)"><img src="${photo('berry_swirl.jpg')}" style="width:100%;height:100%;object-fit:cover"></div>
  ${topBar()}
  <div class="a" style="right:60px;top:180px;z-index:40;text-align:right;width:960px">
    <div class="lat caps" style="font-size:16px;color:${C.blush};text-align:right">Lips · long stay colour</div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:12px">
      <div style="font-weight:700;font-size:60px;line-height:1.15">شفاه بلون<br>لا يُنسى</div>
      <div style="text-align:left">${bigPct(150, { color: C.blush, labelColor: C.blush })}</div></div>
    <div style="margin-top:10px;font-size:25px;color:rgba(255,255,255,.72)">أكثر من 100 درجة بين أحمر الشفاه والأقلام والغلوس</div></div>
  <div class="a" style="left:60px;right:60px;top:470px;z-index:40;display:grid;grid-template-columns:1fr 1fr;gap:20px">
    ${items.map(([p, n]) => card(p, n, { w: 470, imgH: 150, shadesN: 9 })).join('')}</div>
  ${bottomBar()}
  <div class="a grain"></div>`;
});

// 4 — نجم العرض: Only Matte مع حلقة الدرجات
SLIDES.push(() => {
  const p = P('c82948b9');
  const cx = W / 2, cy = 660, R = 330, s = p.shades;
  const dots = s.map((x, i) => {
    const a = (-90 + (360 / s.length) * i) * (Math.PI / 180);
    return `<span class="a" style="left:${cx + R * Math.cos(a) - 17}px;top:${cy + R * Math.sin(a) - 17}px;width:34px;height:34px;border-radius:50%;background:${x.hex};box-shadow:0 0 0 3px #fff, 0 6px 14px rgba(90,20,40,.3);z-index:30"></span>`;
  }).join('');
  return `
  <div class="a" style="inset:0;background:radial-gradient(80% 60% at 50% 45%, #FFF1EF 0%, ${C.blush} 60%, #E9B9B9 100%)"></div>
  ${topBar(C.ink, C.wine).replace(`color:${C.wine}">خصم`, `color:#fff">خصم`)}
  <div class="a" style="top:168px;left:0;right:0;text-align:center;z-index:40;color:${C.ink}">
    <div class="lat caps" style="font-size:16px;color:${C.crimson}">Only matte · long stay power</div>
    <div style="font-weight:700;font-size:44px;margin-top:8px">الأكثر طلباً: أحمر الشفاه السائل المطفي</div></div>
  <div class="a" style="left:${cx - 255}px;top:${cy - 255}px;width:510px;height:510px;border-radius:50%;background:#fff;box-shadow:0 40px 90px rgba(120,30,50,.28);z-index:20;display:grid;place-items:center">
    <img src="${p.img}" style="width:400px;height:400px;object-fit:contain"></div>
  <svg class="a" style="left:${cx - R}px;top:${cy - R}px;z-index:21" width="${2 * R}" height="${2 * R}"><circle cx="${R}" cy="${R}" r="${R}" fill="none" stroke="${C.crimson}" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="3 7"/></svg>
  ${dots}
  <div class="a" style="left:76px;top:${cy + 120}px;width:200px;height:200px;border-radius:50%;background:${C.wine};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:40;box-shadow:0 24px 50px rgba(90,10,30,.45);transform:rotate(-10deg)">
    <span style="font-weight:600;font-size:26px;line-height:1">خصم</span><span class="lat bod" style="font-size:84px;line-height:.95">50<span style="font-family:Montserrat;font-weight:300;font-size:.5em">%</span></span></div>
  <div class="a" style="right:70px;top:${cy - 300}px;z-index:40;text-align:center;color:${C.wine}">
    <div class="lat bod" style="font-size:72px;line-height:1">${s.length}</div><div style="font-weight:600;font-size:22px">درجة لون</div></div>
  <div class="a" style="left:0;right:0;top:1035px;z-index:40;text-align:center;color:${C.ink}">
    ${priceLine(p, { size: 62, color: C.crimson, old: '#9C7F84', center: true })}
    <div style="font-size:25px;color:${C.muted};margin-top:6px">ثبات طويل · لمسة مطفية مخملية · بدل ${money(p.originalPrice)} د.ع</div></div>
  ${bottomBar(C.ink)}
  <div class="a grain" style="opacity:.04"></div>`;
});

// 5 — العيون (أزرق ليلي)
SLIDES.push(() => {
  const items = [[P('1b1ec0fc'), 'ماسكارا <span class="lat">Premium Pro</span>', 'كثافة وطول بلمسة واحدة'], [P('9056a948'), 'قلم آيلاينر جل <span class="lat">Pro</span>', 'أسود عميق يدوم طويلاً'], [P('542bf9b4'), 'ظل عيون ستيك <span class="lat">Twist &amp; Go</span>', '4 درجات معدنية'], [P('6ed13437'), 'باليت 10 ألوان <span class="lat">Mocha Mousse</span>', 'ظلال مطفية ولامعة']];
  return `
  <div class="a" style="inset:0;background:linear-gradient(180deg, #1F2A4A 0%, ${C.navy} 55%, #0A0E1C 100%)"></div>
  <div class="a" style="left:60px;top:170px;width:420px;height:520px;border-radius:210px 210px 28px 28px;overflow:hidden;z-index:30;border:8px solid rgba(255,255,255,.9);box-shadow:0 40px 80px rgba(0,0,0,.5)">
    <img src="${photo('model_blue_wide.jpg')}" style="position:absolute;height:100%;left:-60px;top:0"></div>
  ${topBar('#fff', '#C9D3F2').replace(`color:${C.wine}">خصم`, `color:${C.navy}">خصم`)}
  <div class="a" style="right:60px;top:200px;width:460px;z-index:40;text-align:right">
    <div class="lat caps" style="font-size:16px;color:#AFC0EE;text-align:right">Eyes · fall for blue</div>
    <div style="margin-top:14px;font-weight:700;font-size:58px;line-height:1.15">نظرة<br>تأسر القلوب</div>
    <div style="margin-top:12px;font-size:25px;line-height:1.55;color:rgba(255,255,255,.72)">ماسكارا، آيلاينر، ظلال وباليتات — كلها بنصف السعر.</div>
    <div style="margin-top:22px">${bigPct(140, { color: '#C9D3F2', labelColor: '#C9D3F2' })}</div></div>
  <div class="a" style="left:60px;right:60px;top:716px;z-index:40;display:flex;flex-direction:column;gap:12px">
    ${items.map(([p, n, s]) => row(p, n, s, { accent: '#2B3E82', imgS: 84 })).join('')}</div>
  ${bottomBar()}
  <div class="a grain"></div>`;
});

// 6 — البشرة (كريم أساس على الأسود)
SLIDES.push(() => {
  const items = [[P('9d301496'), 'كريم أساس <span class="lat">Pro Luminous</span>'], [P('78ccf425'), 'كريم أساس <span class="lat">Matte Filler</span>'], [P('54865083'), 'برايمر <span class="lat">Perfect Pro</span>'], [P('8643da40'), 'مثبّت مكياج <span class="lat">Perfect Fixer</span>'], [P('63044ce9'), 'بودرة <span class="lat">Max Compact</span>'], [P('99b19423'), 'بلاشر <span class="lat">Max Blush On</span>']];
  const tones = [...P('78ccf425').shades, ...P('9d301496').shades];
  return `
  <div class="a" style="inset:0;background:#000"></div>
  <div class="a" style="left:0;top:0;width:620px;height:620px;overflow:hidden"><img src="${photo('foundation_swatch.jpg')}" style="width:100%;height:100%;object-fit:cover;object-position:30% 40%"></div>
  <div class="a" style="left:0;top:0;width:620px;height:620px;background:linear-gradient(90deg, rgba(0,0,0,0) 55%, #000), linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, #000 100%)"></div>
  ${topBar('#fff', C.nude)}
  <div class="a" style="right:60px;top:200px;width:470px;z-index:40;text-align:right">
    <div class="lat caps" style="font-size:16px;color:${C.nude};text-align:right">Face · flawless base</div>
    <div style="margin-top:14px;font-weight:700;font-size:58px;line-height:1.15">بشرة<br>بلا عيوب</div>
    <div style="margin-top:12px;font-size:25px;line-height:1.55;color:rgba(255,255,255,.72)">كريمات أساس، برايمر، بودرة ومثبّت — صُنعت في اليونان.</div>
    <div style="margin-top:18px;display:flex;gap:8px;direction:ltr;justify-content:flex-end">${tones.map((t) => `<span style="width:34px;height:34px;border-radius:50%;background:${t.hex};box-shadow:0 0 0 2px rgba(255,255,255,.85)"></span>`).join('')}</div>
    <div style="margin-top:18px;display:flex;justify-content:flex-end">${bigPct(120, { color: C.nude, labelColor: C.nude })}</div></div>
  <div class="a" style="left:60px;right:60px;top:660px;z-index:40;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    ${items.map(([p, n]) => `<div style="background:#fff;border-radius:24px;padding:12px 12px 14px;text-align:center;color:${C.ink};position:relative">
      <span style="position:absolute;top:10px;left:10px">${pill(C.wine, '#fff', 15)}</span>
      <div style="height:150px;display:grid;place-items:center"><img src="${p.img}" style="max-width:86%;max-height:150px;object-fit:contain"></div>
      <div style="font-weight:600;font-size:19px;line-height:1.3;margin-top:4px;min-height:50px;display:flex;align-items:center;justify-content:center"><span>${n}</span></div>
      <div style="margin-top:2px">${priceLine(p, { size: 25, color: C.crimson, old: '#A8979B', center: true })}</div></div>`).join('')}</div>
  ${bottomBar()}
  <div class="a grain"></div>`;
});

// 7 — توهّج طبيعي
SLIDES.push(() => {
  const items = [[P('10c66f9e'), 'بلاشر ستيك', 'بالببتيد · 4 درجات'], [P('597337ee'), 'بلسم شفاه ملوّن', 'Glow · لون نود'], [P('fd30f8d8'), 'برايمر مضيء', '3 في 1 · 30 مل']];
  return `
  <div class="a" style="inset:0;background:linear-gradient(180deg, #FFF6F3 0%, ${C.blush} 100%)"></div>
  <div class="a" style="right:0;top:0;bottom:0;width:470px;overflow:hidden"><img src="${photo('model_glow.jpg')}" style="width:100%;height:100%;object-fit:cover;object-position:40% 35%"></div>
  <div class="a" style="right:400px;top:0;bottom:0;width:90px;background:linear-gradient(270deg, rgba(244,217,214,0), #F9E6E3)"></div>
  <div class="a" style="right:0;top:0;width:520px;height:220px;background:linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,255,255,0))"></div>
  ${topBar(C.ink, C.wine).replace(`color:${C.wine}">خصم`, `color:#fff">خصم`)}
  <div class="a" style="left:60px;top:200px;width:520px;z-index:40;color:${C.ink}">
    <div class="lat caps" style="font-size:16px;color:${C.crimson};text-align:right">Glow · fresh &amp; natural</div>
    <div style="margin-top:14px;font-weight:700;font-size:58px;line-height:1.15">توهّج طبيعي<br>كل يوم</div>
    <div style="margin-top:12px;font-size:25px;line-height:1.55;color:${C.muted};max-width:470px">خدود وردية وشفاه لامعة وبشرة مضيئة — بنصف السعر.</div>
    <div style="margin-top:28px;display:flex;flex-direction:column;gap:16px">${items.map(([p, n, s]) => row(p, n, s, { imgS: 100, fs: 25, stack: true })).join('')}</div></div>
  <div class="a" style="left:300px;top:1000px;z-index:45;width:190px;height:190px;border-radius:50%;background:${C.wine};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg);box-shadow:0 24px 50px rgba(90,10,30,.4)">
    <span style="font-weight:600;font-size:25px;line-height:1">خصم</span><span class="lat bod" style="font-size:80px;line-height:.95">50<span style="font-family:Montserrat;font-weight:300;font-size:.5em">%</span></span></div>
  <div class="a" style="left:60px;top:1030px;width:230px;z-index:44;color:${C.ink};font-weight:700;font-size:30px;line-height:1.35;text-align:right">كل منتجات كريجي<br><span style="color:${C.crimson}">بنصف السعر</span></div>
  ${bottomBar(C.ink, { plate: 'rgba(255,255,255,.85)' })}
  <div class="a grain" style="opacity:.04"></div>`;
});

// 8 — حمّلي التطبيق
SLIDES.push(() => {
  const perks = [['shield', 'منتجات أصلية <span class="lat">100%</span>'], ['truck', 'توصيل لكل العراق'], ['tag', 'الدفع عند الاستلام']];
  const strip = ['c82948b9', '41294991', '1b1ec0fc', '9d301496', '6ed13437', '10c66f9e'].map(P);
  return `
  <div class="a" style="inset:0;overflow:hidden"><img src="${photo('berry_swirl.jpg')}" style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></div>
  <div class="a" style="inset:0;background:radial-gradient(70% 55% at 50% 45%, rgba(30,3,10,.62) 0%, rgba(20,2,8,.86) 70%, rgba(13,10,12,.96) 100%)"></div>
  ${topBar()}
  <div class="a" style="top:190px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
    ${appIcon(200, 'rgba(244,217,214,.35)')}
    <div style="margin-top:36px;font-weight:700;font-size:62px;line-height:1.2;text-align:center">حمّلي تطبيق ديما الحياة</div>
    <div style="margin-top:12px;font-size:30px;color:rgba(255,255,255,.8);text-align:center">واطلبي كل منتجات <span class="lat">GRIGI</span> بخصم <span class="lat">50%</span> بلمسة واحدة</div>
    <div style="margin-top:30px;display:flex;gap:12px">${strip.map((p) => `<div style="width:104px;height:104px;border-radius:22px;background:#fff;display:grid;place-items:center;box-shadow:0 12px 26px rgba(0,0,0,.35)"><img src="${p.img}" style="width:92px;height:92px;object-fit:contain"></div>`).join('')}</div>
    <div style="margin-top:32px">${channels(1.05)}</div>
    <div style="margin-top:36px">${appStoreBadge(1.6, false)}</div>
    <div style="margin-top:36px;display:flex;gap:14px">${perks.map(([i, t]) => `<span style="display:inline-flex;align-items:center;gap:10px;padding:13px 22px;border-radius:999px;border:1.5px solid rgba(244,217,214,.4);font-weight:500;font-size:23px;color:rgba(255,255,255,.9)">${ICON(i, 24, C.blush)}${t}</span>`).join('')}</div>
    <div class="lat" style="margin-top:36px;font-family:Jost;font-weight:400;font-size:24px;letter-spacing:.3em;color:${C.blush}">DEEMAALHAYAT.COM</div>
  </div>
  <div class="a grain"></div>`;
});

function page(i) {
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${SLIDES[i]()}</body></html>`;
}
module.exports = { page, count: SLIDES.length, W, H };
