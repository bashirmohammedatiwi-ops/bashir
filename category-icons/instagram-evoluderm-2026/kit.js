// بوست إنستغرام إيفولوديرم — الوكيل الحصري (1080×1350، يُصدَّر ×2).
// أسلوب «Maison française»: ورق عاجي، حبر بنّي داكن، لمسة العلم الفرنسي، وعالم لوني لكل خط.
// كل شريحة: أيقونة التطبيق + «متوفر على App Store» + «في محل ديما الحياة وعلى التطبيق».
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
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const C = {
  ivory: '#F8F2EA', paper: '#EFE5D8', ink: '#2A211C', slate: '#333E48', muted: '#7F7268', line: '#DCCDBA',
  gold: '#B98A4E', blue: '#1D3E8F', red: '#D8232A',
};

// ---------- خطوط وأنماط عامة ----------
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=Jost:wght@300;400;500&family=Inter:wght@500;600;700&family=Nunito+Sans:opsz,wght@6..12,300;6..12,400&display=block" rel="stylesheet">`;
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:${C.ivory};font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased;color:${C.ink}}
.a{position:absolute}
.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.fr{font-family:'Cormorant Garamond';font-style:italic;font-weight:500}
.caps{font-family:Jost;font-weight:400;letter-spacing:.42em;text-transform:uppercase}
.paper{inset:0;opacity:.35;mix-blend-mode:multiply;pointer-events:none;z-index:90;
 background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
`;

/** الشعار: نسخة متجهة من شعار Evoluderm (خطّان منحنيان، PARIS عمودياً، TM). */
function logo(width, color = C.slate) {
  const h = width * (155 / 560);
  return `<svg width="${width}" height="${h}" viewBox="0 0 560 155" style="display:block;overflow:visible" direction="ltr">
    <path d="M22 9 Q 285 25 550 9" stroke="${color}" stroke-width="6.5" fill="none" stroke-linecap="round"/>
    <path d="M22 133 Q 285 153 550 133" stroke="${color}" stroke-width="6.5" fill="none" stroke-linecap="round"/>
    <text x="296" y="113" text-anchor="middle" font-family="Nunito Sans" font-weight="300" font-size="124" letter-spacing="-1.5" fill="${color}">Evoluderm</text>
    <text transform="translate(17 118) rotate(-90)" font-family="Jost" font-weight="500" font-size="15.5" letter-spacing="6.5" fill="${color}">PARIS</text>
    <text x="551" y="34" font-family="Jost" font-weight="400" font-size="16" fill="${color}">TM</text></svg>`;
}

/** شريط العلم الفرنسي الرفيع. */
const tricolor = (w = 54, h = 4) =>
  `<span style="direction:ltr;display:inline-flex;width:${w}px;height:${h}px;border-radius:${h}px;overflow:hidden;flex:none;box-shadow:0 0 0 .5px rgba(0,0,0,.08)"><i style="flex:1;background:${C.blue}"></i><i style="flex:1;background:#fff"></i><i style="flex:1;background:${C.red}"></i></span>`;

const APPLE = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`;

/** شارة «متوفر على App Store». dark=true: أسود (للخلفيات الفاتحة). */
function appStoreBadge(scale = 1, dark = true) {
  const h = 64 * scale;
  const bg = dark ? '#000' : '#fff', fg = dark ? '#fff' : '#000';
  return `<div style="display:inline-flex;align-items:center;gap:${12 * scale}px;height:${h}px;padding:0 ${20 * scale}px 0 ${22 * scale}px;border-radius:${14 * scale}px;background:${bg};color:${fg};direction:ltr;box-shadow:0 ${6 * scale}px ${18 * scale}px rgba(0,0,0,.18)">
    <span style="width:${32 * scale}px;height:${38 * scale}px;display:block;margin-top:-${4 * scale}px">${APPLE}</span>
    <span style="display:flex;flex-direction:column;align-items:flex-end;line-height:1">
      <span style="font-family:'IBM Plex Sans Arabic';font-weight:500;font-size:${15 * scale}px;opacity:.9;margin-bottom:${4 * scale}px">متوفر على</span>
      <span style="font-family:Inter;font-weight:600;font-size:${27 * scale}px;letter-spacing:-.01em">App Store</span>
    </span></div>`;
}

const appIcon = (size, glow) =>
  `<img src="${url(path.join(ASSETS, 'app_icon.png'))}" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;display:block;flex:none;box-shadow:0 ${size * 0.08}px ${size * 0.28}px rgba(60,30,10,.22)${glow ? `, 0 0 ${size * 0.7}px ${glow}` : ''};border:1px solid rgba(0,0,0,.06)">`;

// ---------- أيقونات خطية ----------
const ICONS = {
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  flask: '<path d="M10 2v7.5L4.5 19A2 2 0 0 0 6.3 22h11.4a2 2 0 0 0 1.8-3L14 9.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
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

// ---------- إطار ثابت لكل شريحة ----------
/** شريط علوي: التطبيق (يمين) و EVOLUDERM · PARIS مع العلم (يسار). */
function topBar(ink = C.ink, ink2 = ink) {
  return `<div class="a" style="top:50px;right:60px;left:60px;z-index:80;display:flex;align-items:center;justify-content:space-between;color:${ink}">
    <div style="display:flex;align-items:center;gap:16px">${appIcon(62)}
      <div style="display:flex;flex-direction:column;gap:5px"><span style="font-weight:700;font-size:27px;line-height:1">ديما الحياة</span>
      <span class="lat" style="font-family:Jost;font-weight:400;font-size:13.5px;letter-spacing:.42em;opacity:.65;line-height:1">DEEMA ALHAYAT</span></div></div>
    <div style="display:flex;align-items:center;gap:14px;color:${ink2}"><span style="font-weight:500;font-size:22px;opacity:.85">الوكيل الحصري</span>${tricolor(46, 4)}
      <span class="lat" style="font-family:Jost;font-weight:500;font-size:18px;letter-spacing:.42em">EVOLUDERM</span></div>
  </div>`;
}

/** شريط سفلي: «في محل ديما الحياة وعلى التطبيق» + App Store. */
function bottomBar(ink = C.ink, { text = 'في محل ديما الحياة وعلى التطبيق', icon = 'store', dark = true, plate } = {}) {
  return `<div class="a" style="bottom:46px;right:60px;left:60px;z-index:80;display:flex;align-items:center;justify-content:space-between;color:${ink}">
    <div style="display:flex;align-items:center;gap:14px;${plate ? `background:${plate};padding:8px 22px 8px 8px;border-radius:999px;` : ''}">${appIcon(52)}<span style="display:flex;align-items:center;gap:10px;font-weight:500;font-size:25px">${ICON(icon, 26, ink)}${text}</span></div>
    ${appStoreBadge(1, dark)}
  </div>`;
}

/** ختم دائري «الوكيل الحصري». */
function seal(size = 170, { bg = C.ink, fg = C.ivory, accent = C.gold, rotate = -8 } = {}) {
  const r = 50, id = 'sp' + Math.round(Math.random() * 1e6);
  return `<div style="width:${size}px;height:${size}px;position:relative;transform:rotate(${rotate}deg);flex:none">
    <svg viewBox="0 0 120 120" width="${size}" height="${size}" style="display:block" direction="ltr">
      <defs><path id="${id}" d="M60 60 m-${r - 7} 0 a ${r - 7} ${r - 7} 0 1 1 ${2 * (r - 7)} 0 a ${r - 7} ${r - 7} 0 1 1 -${2 * (r - 7)} 0"/></defs>
      <circle cx="60" cy="60" r="${r + 8}" fill="${bg}"/>
      <circle cx="60" cy="60" r="${r + 4.5}" fill="none" stroke="${accent}" stroke-width=".8"/>
      <circle cx="60" cy="60" r="${r - 14}" fill="none" stroke="${accent}" stroke-width=".8"/>
      <text font-family="Jost" font-weight="500" font-size="7.6" letter-spacing="2.55" fill="${fg}"><textPath href="#${id}">DISTRIBUTEUR EXCLUSIF · IRAQ · DEEMA ALHAYAT ·</textPath></text>
    </svg>
    <div class="a" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${fg};line-height:1.12;text-align:center">
      <span style="font-weight:700;font-size:${size * 0.125}px">الوكيل</span><span style="font-weight:700;font-size:${size * 0.125}px">الحصري</span>
      <span style="margin-top:${size * 0.03}px">${tricolor(size * 0.2, size * 0.022)}</span></div></div>`;
}

/** «في محل ديما الحياة» + «وعلى التطبيق». */
const channels = (k = 1, { fg = C.ink, bg = 'rgba(255,255,255,.7)', bd = C.line, ic = C.gold } = {}) =>
  `<div style="display:flex;gap:${14 * k}px;justify-content:center;direction:rtl">${[['store', 'في محل ديما الحياة'], ['phone', 'وعلى التطبيق']].map(([i, t]) => `<span style="display:inline-flex;align-items:center;gap:${10 * k}px;padding:${10 * k}px ${24 * k}px;border-radius:999px;background:${bg};border:1.5px solid ${bd};font-weight:600;font-size:${25 * k}px;color:${fg};white-space:nowrap">${ICON(i, 27 * k, ic)}${t}</span>`).join('')}</div>`;

/** صف منتج: صورة على بطاقة بيضاء + الاسم + السعر. */
function productRow(p, name, { accent, size = 118, ink = C.ink, sub } = {}) {
  return `<div style="display:flex;align-items:center;gap:22px">
    <div style="width:${size}px;height:${size}px;flex:none;border-radius:${size * 0.22}px;background:#fff;display:grid;place-items:center;box-shadow:0 10px 24px rgba(60,30,10,.12)">
      <img src="${p.img}" style="width:${size * 0.9}px;height:${size * 0.9}px;object-fit:contain"></div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:600;font-size:28px;line-height:1.25;color:${ink}">${name}</div>
      ${sub ? `<div style="font-weight:400;font-size:21px;color:${rgba(ink === C.ink ? '#2A211C' : '#FFFFFF', 0.62)};margin-top:3px">${sub}</div>` : ''}</div>
    <div style="flex:none;text-align:left;direction:rtl"><span style="font-weight:700;font-size:34px;color:${accent}">${money(p.price)}</span> <span style="font-weight:500;font-size:20px;color:${accent}">د.ع</span></div>
  </div>`;
}

/** بطاقة منتج عمودية. */
function productCard(p, name, { accent, w = 220, imgH = 190, bg = '#fff', ink = C.ink } = {}) {
  return `<div style="width:${w}px;flex:none;background:${bg};border-radius:30px;padding:16px 14px 18px;display:flex;flex-direction:column;align-items:center;box-shadow:0 16px 34px rgba(60,30,10,.14)">
    <div style="height:${imgH}px;width:100%;display:grid;place-items:center"><img src="${p.img}" style="max-width:100%;max-height:${imgH}px;object-fit:contain"></div>
    <div style="margin-top:8px;font-weight:600;font-size:22px;line-height:1.3;text-align:center;color:${ink};height:58px;display:flex;align-items:center">${name}</div>
    <div style="margin-top:6px;font-weight:700;font-size:28px;color:${accent}">${money(p.price)} <span style="font-size:.66em;font-weight:500">د.ع</span></div></div>`;
}

// ---------- شاشة التطبيق داخل iPhone ----------
function appScreen() {
  const g1 = '#1F8F74', g2 = '#5DBB9F';
  const chips = [['سحر الجمال'], ['طقوس العناية', 1], ['أناقة الرجل'], ['حكاية عطر']];
  const cards = [[P('48e2fd3a'), 'سيروم فيتامين C للإشراق'], [P('890a1a33'), 'ماسك شعر أرغان ديفان 1 لتر'], [P('2a5b76d5'), 'ماسك شعر مونوي آ لا فولي']];
  const card = ([p, n]) => `<div style="width:112px;flex:none;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(30,20,40,.08)">
     <div style="height:110px;display:grid;place-items:center"><img src="${p.img}" style="width:96px;height:96px;object-fit:contain"></div>
     <div style="padding:6px 8px 9px;direction:rtl">
       <div style="font:500 10.5px/1.35 'IBM Plex Sans Arabic';color:#2A2433;height:28px;overflow:hidden">${n}</div>
       <div style="margin-top:4px;font:700 12.5px 'IBM Plex Sans Arabic';color:${g1}">${money(p.price)} د.ع</div></div></div>`;
  return `<div style="width:390px;height:844px;background:#F7F5F2;position:relative;overflow:hidden;font-family:'IBM Plex Sans Arabic';direction:rtl">
    <div style="height:206px;background:linear-gradient(160deg, ${g1}, ${g2});border-radius:0 0 28px 28px;padding:54px 18px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;color:#fff">
        <div style="display:flex;align-items:center;gap:8px"><img src="${url(path.join(ASSETS, 'app_icon.png'))}" style="width:30px;height:30px;border-radius:8px"><div style="line-height:1.1"><div style="font:700 15px 'IBM Plex Sans Arabic'">ديما الحياة</div><div style="font:400 10px 'IBM Plex Sans Arabic';opacity:.85">مرحباً بكِ</div></div></div>
        <div style="display:flex;gap:8px">${['bell', 'heart', 'bag'].map((i) => `<span style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center">${ICON(i, 16, '#fff')}</span>`).join('')}</div></div>
      <div style="margin-top:14px;height:40px;border-radius:14px;background:#fff;display:flex;align-items:center;gap:8px;padding:0 14px;color:#9A93A3;font:400 12.5px 'IBM Plex Sans Arabic'">${ICON('search', 16, '#9A93A3')} ابحثي عن منتج، براند أو باركود…</div>
      <div style="display:flex;gap:8px;margin-top:14px">${chips.map(([n, on]) => `<span style="flex:none;padding:7px 12px;border-radius:12px;font:600 11.5px 'IBM Plex Sans Arabic';${on ? `background:#fff;color:${g1}` : 'background:rgba(255,255,255,.16);color:#fff'}">${n}</span>`).join('')}</div>
    </div>
    <div style="margin:14px 14px 0;height:214px;border-radius:20px;overflow:hidden;box-shadow:0 10px 24px rgba(20,10,30,.18);position:relative;background:#F4B24A">
      <img src="${photo('vitc_routine.png')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%">
      <div class="a" style="inset:0;background:linear-gradient(270deg, rgba(42,33,28,.0) 30%, rgba(42,33,28,.62) 100%)"></div>
      <div class="a" style="left:14px;top:18px;bottom:16px;width:170px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;direction:ltr;color:#fff">
        <div>${logo(140, '#fff')}<div style="direction:rtl;text-align:left;margin-top:10px;font:700 17px/1.3 'IBM Plex Sans Arabic'">جمال فرنسي<br>بين يديكِ</div></div>
        <span style="direction:rtl;background:#fff;color:${C.ink};font:600 11px 'IBM Plex Sans Arabic';padding:6px 12px;border-radius:999px">الوكيل الحصري ‹</span></div>
      <div style="position:absolute;bottom:8px;right:0;left:0;display:flex;justify-content:center;gap:4px">${[1, 0, 0, 0].map((a) => `<span style="height:5px;width:${a ? 16 : 5}px;border-radius:9px;background:rgba(255,255,255,${a ? 1 : 0.55})"></span>`).join('')}</div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 16px 10px">
      <div style="font:700 15.5px 'IBM Plex Sans Arabic';color:#1F1A26">إيفولوديرم · صنع في فرنسا</div>
      <div style="font:600 11.5px 'IBM Plex Sans Arabic';color:${g1}">عرض الكل ‹</div></div>
    <div style="display:flex;gap:10px;padding:0 14px;direction:rtl">${cards.map(card).join('')}</div>
    <div style="position:absolute;bottom:22px;left:14px;right:14px;height:62px;border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(20,10,30,.14);display:flex;align-items:center;justify-content:space-around;padding:0 10px">
      <span style="background:${g1};color:#fff;font:600 12px 'IBM Plex Sans Arabic';padding:8px 14px;border-radius:16px;display:flex;align-items:center;gap:6px">${ICON('home', 15, '#fff')} الرئيسية</span>${['grid', 'crown', 'tag', 'cart', 'user'].map((i) => ICON(i, 20, '#8F879A')).join('')}</div>
  </div>`;
}

function iphone(screenHtml, { x, y, scale = 1, rotate = 0 }) {
  const fw = 390 + 28, fh = 844 + 28;
  return `<div class="a" style="left:${x}px;top:${y}px;width:${fw}px;height:${fh}px;transform:scale(${scale}) rotate(${rotate}deg);transform-origin:top left;z-index:30">
    <div class="a" style="inset:0;border-radius:68px;background:linear-gradient(145deg,#d9d4ce,#8d8780 30%,#c9c3bc 60%,#77716b);box-shadow:0 70px 110px rgba(70,40,20,.35), 0 20px 40px rgba(70,40,20,.25), inset 0 0 0 2px rgba(255,255,255,.4)"></div>
    <div class="a" style="inset:7px;border-radius:62px;background:#000"></div>
    <div class="a" style="left:14px;top:14px;width:390px;height:844px;border-radius:54px;overflow:hidden">${screenHtml}
      <div class="a" style="top:0;left:0;right:0;height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 30px;font:600 15px Inter;color:#fff;direction:ltr"><span>9:41</span><span style="display:flex;gap:6px;align-items:center">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".7" y=".7" width="22" height="10.6" rx="3" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><rect x="2.4" y="2.4" width="18.6" height="7.2" rx="1.8" fill="#fff"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="#fff" fill-opacity=".5"/></svg></span></div>
      <div class="a" style="top:11px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000"></div>
      <div class="a" style="inset:0;background:linear-gradient(115deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 38%);pointer-events:none"></div></div>
    <div class="a" style="right:-4px;top:200px;width:5px;height:96px;border-radius:3px;background:#9a948d"></div>
    <div class="a" style="left:-4px;top:170px;width:5px;height:60px;border-radius:3px;background:#9a948d"></div>
    <div class="a" style="left:-4px;top:250px;width:5px;height:60px;border-radius:3px;background:#9a948d"></div>
  </div>`;
}

/** صورة بإطار قوس (عمارة باريسية). */
function arch(src, { x, y, w, h, pos = '50% 50%', rotate = 0, border = '#fff', z = 20, zoom = 1 }) {
  return `<div class="a" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z};transform:rotate(${rotate}deg);border-radius:${w / 2}px ${w / 2}px 26px 26px;padding:10px;background:${border};box-shadow:0 40px 70px rgba(70,40,20,.28), 0 10px 20px rgba(70,40,20,.12)">
    <div style="width:100%;height:100%;border-radius:${w / 2 - 10}px ${w / 2 - 10}px 18px 18px;overflow:hidden"><img src="${src}" style="width:100%;height:100%;object-fit:cover;object-position:${pos};transform:scale(${zoom});transform-origin:${pos}"></div></div>`;
}

// ---------- الشرائح ----------
const SLIDES = [];

// 1 — الغلاف: البراند + الهاتف + قوسان (أرغان ومونوي)
SLIDES.push(() => {
  const sc = 0.68, pw = 418 * sc, ph = 872 * sc;
  return `
  <div class="a" style="inset:0;background:radial-gradient(80% 60% at 50% 30%, #FFFBF5 0%, ${C.ivory} 55%, ${C.paper} 100%)"></div>
  <div class="a" style="left:0;right:0;top:1150px;bottom:0;background:linear-gradient(180deg, rgba(220,200,175,0) 0%, rgba(220,200,175,.45) 30%, rgba(214,192,166,.6) 100%)"></div>
  ${topBar()}
  <div class="a" style="top:150px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
    <div style="display:flex;align-items:center;gap:16px;color:${C.muted}">${tricolor(40, 3)}<span class="lat caps" style="font-size:17px">Maison française · depuis 2004</span>${tricolor(40, 3)}</div>
    <div style="margin-top:24px">${logo(540)}</div>
    <div style="margin-top:22px;font-weight:700;font-size:58px;line-height:1.2">جمال فرنسي لكل يوم</div>
    <div style="margin-top:8px;font-weight:400;font-size:29px;color:${C.muted}">إيفولوديرم الآن بوكالة حصرية لدى ديما الحياة</div>
    <div style="margin-top:22px">${channels(0.9)}</div>
  </div>
  ${arch(photo('argan_shampoo.jpg'), { x: 46, y: 690, w: 310, h: 470, pos: '50% 40%', rotate: -4 })}
  ${arch(photo('monoi_jar.jpg'), { x: 724, y: 690, w: 310, h: 470, pos: '50% 62%', rotate: 4 })}
  <div class="a fr" style="left:52px;width:300px;top:1182px;text-align:center;font-size:31px;color:${C.ink};z-index:25;transform:rotate(-4deg)">Argan Divin</div>
  <div class="a fr" style="left:728px;width:300px;top:1182px;text-align:center;font-size:31px;color:${C.ink};z-index:25;transform:rotate(4deg)">Monoï à la Folie</div>
  <div class="a" style="left:${W / 2 - 230}px;top:1205px;width:460px;height:40px;border-radius:50%;background:radial-gradient(closest-side, rgba(70,40,20,.35), rgba(70,40,20,0));z-index:29"></div>
  ${iphone(appScreen(), { x: W / 2 - pw / 2, y: 1222 - ph, scale: sc })}
  <div class="a" style="left:292px;top:600px;z-index:45">${seal(138)}</div>
  ${bottomBar(C.ink, { text: 'حمّلي تطبيق ديما الحياة الآن', icon: 'phone' })}
  <div class="a paper"></div>`;
});

// 2 — قصة البراند
SLIDES.push(() => {
  const stat = (big, title, sub, extra = '') => `<div style="display:flex;align-items:center;gap:24px;padding:24px 0;border-bottom:1.5px solid ${C.line}">
      <div style="width:150px;flex:none;text-align:center" class="lat"><span style="font-family:'Cormorant Garamond';font-weight:600;font-size:78px;line-height:1;color:${C.gold}">${big}</span>${extra}</div>
      <div><div style="font-weight:700;font-size:30px;line-height:1.3">${title}</div><div style="font-weight:400;font-size:23px;line-height:1.45;color:${C.muted};margin-top:4px">${sub}</div></div></div>`;
  return `
  <div class="a" style="inset:0;background:linear-gradient(180deg, #FFFBF5 0%, ${C.ivory} 60%, ${C.paper} 100%)"></div>
  ${topBar()}
  ${arch(photo('face_glow.png'), { x: 56, y: 196, w: 420, h: 760, pos: '58% 40%', zoom: 1.12 })}
  <div class="a" style="left:70px;top:820px;z-index:45">${seal(150, { rotate: -10 })}</div>
  <div class="a" style="right:60px;top:206px;width:500px;z-index:30">
    <div class="lat caps" style="font-size:16px;color:${C.gold};text-align:right">La maison Evoluderm</div>
    <div style="margin-top:14px;font-weight:700;font-size:50px;line-height:1.25">قصة جمال<br>بدأت في فرنسا</div>
    <div style="margin-top:14px;font-weight:400;font-size:24px;line-height:1.6;color:${C.muted}">منذ أكثر من 20 عاماً تبتكر إيفولوديرم في فرنسا عناية يومية حسّية وفعّالة، بمكونات طبيعية المصدر.</div>
    <div style="margin-top:18px;border-top:1.5px solid ${C.line}">
      ${stat('2004', 'انطلاقة البراند', 'علامة فرنسية للعناية والجمال')}
      ${stat('90<span style="font-size:.6em">%</span>', 'مكونات طبيعية المصدر', 'كحدّ أدنى في أغلب منتجاتها، وأغلبها نباتية')}
      ${stat('+140', 'منتجاً في ديما الحياة', 'للبشرة والشعر والجسم، بأسعار تبدأ من 3,000 د.ع')}
    </div>
  </div>
  <div class="a" style="right:60px;left:60px;top:1010px;z-index:30;display:flex;align-items:center;justify-content:center;gap:22px;padding:30px 36px;border-radius:30px;background:${C.ink};color:${C.ivory}">
    ${tricolor(64, 5)}<div style="text-align:center"><div style="font-weight:700;font-size:34px">ديما الحياة — الوكيل الحصري لإيفولوديرم في العراق</div>
    <div style="font-weight:400;font-size:23px;opacity:.75;margin-top:4px">منتجات أصلية مضمونة مباشرة من فرنسا</div></div>${tricolor(64, 5)}</div>
  ${bottomBar()}
  <div class="a paper"></div>`;
});

// 3 — فيتامين C (عالم برتقالي)
SLIDES.push(() => {
  const OR = '#E8730C';
  const items = [[P('48e2fd3a'), 'سيروم فيتامين C', '30 مل · للوجه'], [P('68acbbc6'), 'كريم الإشراقة', '50 مل · للوجه'], [P('cf5ef994'), 'جل الاستحمام', '1 لتر · للجسم'], [P('9f1b803b'), 'لوشن الجسم', '500 مل · للجسم']];
  const tile = ([p, n, s]) => `<div style="flex:1;background:#fff;border-radius:26px;padding:14px 10px 16px;text-align:center;box-shadow:0 14px 30px rgba(150,70,0,.14)">
      <div style="height:132px;display:grid;place-items:center"><img src="${p.img}" style="max-width:100%;max-height:132px;object-fit:contain"></div>
      <div style="font-weight:700;font-size:23px;margin-top:6px">${n}</div><div style="font-size:18px;color:${C.muted}">${s}</div>
      <div style="font-weight:700;font-size:27px;color:${OR};margin-top:6px">${money(p.price)} <span style="font-size:.68em;font-weight:500">د.ع</span></div></div>`;
  return `
  <div class="a" style="inset:0;background:#F6A43A"></div>
  <div class="a" style="left:0;right:0;top:0;height:900px;overflow:hidden"><img src="${photo('vitc_routine.png')}" style="width:100%;height:100%;object-fit:cover;object-position:50% 30%;transform:scale(1.04)"></div>
  <div class="a" style="left:0;right:0;top:0;height:260px;background:linear-gradient(180deg, rgba(246,164,58,.85), rgba(246,164,58,0))"></div>
  ${topBar()}
  <div class="a" style="left:0;right:0;top:760px;bottom:0;background:${C.ivory};border-radius:56px 56px 0 0;box-shadow:0 -20px 50px rgba(120,50,0,.18)"></div>
  <div class="a" style="left:60px;top:190px;z-index:40;direction:ltr;text-align:left;color:#fff;text-shadow:0 4px 24px rgba(150,60,0,.3)">
    <div class="fr" style="font-size:96px;line-height:.92">Vitamine<br>C</div></div>
  <div class="a" style="left:60px;right:60px;top:800px;z-index:40;display:flex;justify-content:space-between;align-items:flex-end">
    <div><div class="lat caps" style="font-size:16px;color:${OR};text-align:right">Routine éclat · visage & corps</div>
      <div style="font-weight:700;font-size:48px;line-height:1.2;margin-top:8px">روتين الإشراقة بفيتامين C</div></div>
    <div style="font-weight:500;font-size:24px;color:${C.muted};padding-bottom:8px">بخلاصة البرتقال</div></div>
  <div class="a" style="left:60px;right:60px;top:925px;z-index:40;display:flex;gap:16px">${items.map(tile).join('')}</div>
  ${bottomBar()}
  <div class="a paper" style="opacity:.2"></div>`;
});

// 4 — أرغان ديفان (تراكوتا مراكش)
SLIDES.push(() => {
  const TC = '#9E4A2C', CREAM = '#FBEBDD';
  const items = [[P('ed6b6718'), 'شامبو مغذٍّ 400 مل'], [P('8b7258cb'), 'بلسم فك التشابك 200 مل'], [P('16265b66'), 'زيت ما قبل الشامبو 150 مل'], [P('890a1a33'), 'ماسك الشعر 1 لتر']];
  const chip = ([p, n]) => `<div style="display:flex;align-items:center;gap:14px;background:rgba(255,245,235,.1);border:1.5px solid rgba(251,235,221,.28);border-radius:24px;padding:10px 18px 10px 10px">
      <div style="width:84px;height:84px;border-radius:18px;background:#fff;display:grid;place-items:center;flex:none"><img src="${p.img}" style="width:76px;height:76px;object-fit:contain"></div>
      <div><div style="font-weight:500;font-size:22px;line-height:1.3;color:${CREAM}">${n}</div><div style="font-weight:700;font-size:28px;color:#fff">${money(p.price)} <span style="font-size:.7em;font-weight:500">د.ع</span></div></div></div>`;
  return `
  <div class="a" style="inset:0;background:radial-gradient(90% 70% at 50% 35%, #C7704C 0%, #A9553A 50%, #7E3A25 100%)"></div>
  <div class="a" style="inset:0;opacity:.18;background:repeating-linear-gradient(115deg, rgba(0,0,0,.0) 0 90px, rgba(60,20,5,.55) 90px 160px)"></div>
  ${topBar(CREAM)}
  <div class="a" style="top:158px;left:0;right:0;z-index:40;text-align:center;color:${CREAM}">
    <div class="lat caps" style="font-size:16px;opacity:.8">Rituel ultra-nourrissant · inspiré du Maroc</div>
    <div class="lat fr" style="font-size:112px;line-height:1;margin-top:10px;color:#fff">Argan Divin</div>
    <div style="font-weight:600;font-size:36px;margin-top:6px">طقس التغذية المغربي للشعر الجاف والجسم</div></div>
  <div class="a" style="left:60px;right:60px;top:430px;height:520px;border-radius:36px;overflow:hidden;z-index:30;box-shadow:0 40px 80px rgba(40,10,0,.45)">
    <img src="${photo('argan_range_wide.png')}" style="position:absolute;height:100%;left:-420px;top:0;width:auto;transform:scale(1.02);transform-origin:center"></div>
  <div class="a" style="left:96px;top:410px;z-index:41;background:${CREAM};color:${TC};border-radius:999px;padding:10px 22px;font-weight:700;font-size:22px;box-shadow:0 10px 24px rgba(40,10,0,.3)">زيت الأرغان · حتى <span class="lat">99%</span> مكونات طبيعية المصدر</div>
  <div class="a" style="left:60px;right:60px;top:982px;z-index:40;display:grid;grid-template-columns:1fr 1fr;gap:14px">${items.map(chip).join('')}</div>
  ${bottomBar(CREAM, { dark: false })}
  <div class="a paper" style="opacity:.25"></div>`;
});

// 5 — مونوي آ لا فولي (شمس تاهيتي)
SLIDES.push(() => {
  const SUN = '#F2B705', TEAL = '#127C82', INK = '#3B2A12';
  const list = [[P('2a5b76d5'), 'ماسك الشعر المرطّب', '500 مل'], [P('65cd972b'), 'البخاخ المعطّر', '200 مل · للشعر والجسم'], [P('20f9f6e2'), 'جل الاستحمام', '500 مل'], [P('94770bef'), 'لوشن الجسم المرطّب', '500 مل']];
  return `
  <div class="a" style="inset:0;background:linear-gradient(180deg, #FFF6DB 0%, #FCE9AE 100%)"></div>
  <div class="a" style="left:0;right:0;top:0;height:640px;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)"><img src="${photo('monoi_flower.png')}" style="width:100%;height:100%;object-fit:cover;object-position:60% 50%;opacity:.95"></div>
  ${topBar(INK)}
  <div class="a" style="left:60px;top:200px;width:430px;height:820px;z-index:30;border-radius:215px 215px 30px 30px;overflow:hidden;box-shadow:0 40px 80px rgba(120,80,0,.3);border:10px solid #fff">
    <img src="${photo('monoi_jar.jpg')}" style="width:100%;height:100%;object-fit:cover;object-position:50% 55%"></div>
  <div class="a" style="left:360px;top:820px;width:210px;height:210px;z-index:35;border-radius:50%;overflow:hidden;border:8px solid #fff;box-shadow:0 24px 50px rgba(120,80,0,.3)"><img src="${photo('monoi_brume.png')}" style="width:100%;height:100%;object-fit:cover;object-position:50% 40%;transform:scale(1.25)"></div>
  <div class="a" style="right:60px;top:206px;width:500px;z-index:40;color:${INK}">
    <div class="lat caps" style="font-size:16px;color:${TEAL};text-align:right">Monoï de Tahiti · fleur de Tiaré</div>
    <div class="lat fr" style="font-size:80px;line-height:1;margin-top:12px;text-align:right">Monoï à la Folie</div>
    <div style="font-weight:700;font-size:38px;line-height:1.3;margin-top:12px">عطر زهرة التياري<br>لشعر وجسم مرطّبين</div>
    <div style="margin-top:26px;display:flex;flex-direction:column;gap:16px">${list.map(([p, n, s]) => `<div style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.8);border-radius:24px;padding:12px 20px 12px 12px;box-shadow:0 10px 24px rgba(120,80,0,.08)">
        <div style="width:92px;height:92px;border-radius:18px;background:#fff;display:grid;place-items:center;flex:none"><img src="${p.img}" style="width:86px;height:86px;object-fit:contain"></div>
        <div style="flex:1"><div style="font-weight:600;font-size:24px;line-height:1.25">${n}</div><div style="font-size:19px;opacity:.6">${s}</div></div>
        <div style="font-weight:700;font-size:27px;color:${TEAL}">${money(p.price)} <span style="font-size:.68em;font-weight:500">د.ع</span></div></div>`).join('')}</div>
  </div>
  <div class="a" style="left:60px;right:60px;top:1072px;z-index:40;display:flex;align-items:center;justify-content:center;gap:16px;padding:20px;border-radius:24px;background:${TEAL};color:#fff;font-weight:600;font-size:27px">
    ${ICON('heart', 28, '#FFE58A')} ماسك الشعر متوفر أيضاً بحجم 1 لتر بـ ${money(P('d866ee6f').price)} د.ع</div>
  ${bottomBar(INK)}
  <div class="a paper" style="opacity:.2"></div>`;
});

// 6 — ماسكات الشعر 1 لتر
SLIDES.push(() => {
  const MOCHA = '#5A3A22';
  const items = [[P('890a1a33'), 'أرغان ديفان', 'مغذٍّ للشعر الجاف'], [P('d866ee6f'), 'مونوي آ لا فولي', 'ترطيب للشعر العادي'], [P('ab67e4d4'), 'الزيت الثمين', 'لمعان للشعر الباهت']];
  return `
  <div class="a" style="inset:0;background:linear-gradient(180deg, #FFFBF5, ${C.paper})"></div>
  <div class="a" style="left:0;top:0;bottom:0;width:470px;overflow:hidden"><img src="${photo('hair_comb.jpg')}" style="width:100%;height:100%;object-fit:cover;object-position:45% 40%"></div>
  <div class="a" style="left:0;top:0;bottom:0;width:470px;background:linear-gradient(180deg, rgba(30,22,18,.72) 0%, rgba(30,22,18,0) 24%, rgba(42,33,28,0) 70%, rgba(42,33,28,.45) 100%)"></div>
  <div class="a" style="left:400px;top:0;bottom:0;width:80px;background:linear-gradient(90deg, rgba(248,242,234,0), ${C.ivory})"></div>
  ${topBar(C.ink, '#fff')}
  <div class="a" style="left:70px;top:1010px;z-index:40;color:#fff;direction:ltr;text-align:left">
    <div class="fr" style="font-size:44px;line-height:1">Masques cheveux</div>
    <div class="caps" style="font-size:15px;margin-top:10px;opacity:.9">Grand format · 1 litre</div></div>
  <div class="a" style="right:60px;top:196px;width:520px;z-index:40">
    <div class="lat caps" style="font-size:16px;color:${C.gold};text-align:right">Le soin salon à la maison</div>
    <div style="font-weight:700;font-size:54px;line-height:1.2;margin-top:12px">ماسكات الشعر<br>بحجم <span class="lat" style="font-family:'Cormorant Garamond';font-weight:600;font-size:1.25em;color:${MOCHA}">1L</span> العائلي</div>
    <div style="font-weight:400;font-size:24px;line-height:1.55;color:${C.muted};margin-top:12px">عناية صالون في بيتك، بعبوة كبيرة تدوم طويلاً.</div>
    <div style="margin-top:26px;display:flex;flex-direction:column;gap:18px">${items.map(([p, n, s]) => `<div style="background:#fff;border-radius:28px;padding:14px 22px 14px 14px;box-shadow:0 14px 30px rgba(70,40,20,.1)">${productRow(p, n, { accent: MOCHA, size: 132, sub: s })}</div>`).join('')}</div>
    <div style="margin-top:22px;display:flex;align-items:center;gap:14px;padding:18px 24px;border-radius:24px;border:1.5px dashed ${C.gold};color:${MOCHA};font-weight:600;font-size:23px">${ICON('heart', 26, C.gold)}<span>ماسك أرغان ديفان ومونوي متوفران أيضاً بحجم <span class="lat">500</span> مل بـ ${money(P('12b30dba').price)} د.ع</span></div>
  </div>
  ${bottomBar(C.ink, { plate: 'rgba(255,255,255,.88)' })}
  <div class="a paper" style="opacity:.2"></div>`;
});

// 7 — عناية الوجه (ريتينول-لايك + سيرومات)
SLIDES.push(() => {
  const ROSE = '#C2185B', BLUSH = '#F7DCE4';
  const cards = [[P('b8ac8cf7'), 'كريم نهاري<br>شبيه بالريتينول'], [P('6e72539a'), 'كريم ليلي<br>شبيه بالريتينول'], [P('df4077dc'), 'سيروم حمض<br>الهيالورونيك'], [P('23de2a5a'), 'سيروم الجزر<br>للإشراقة']];
  return `
  <div class="a" style="inset:0;background:linear-gradient(180deg, #FFF5F7 0%, ${BLUSH} 100%)"></div>
  ${topBar()}
  <div class="a" style="right:60px;top:190px;width:480px;height:560px;border-radius:240px 240px 30px 30px;overflow:hidden;z-index:30;border:10px solid #fff;box-shadow:0 36px 70px rgba(150,40,80,.22)"><img src="${photo('face_skin.png')}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;transform:scale(1.08)"></div>
  <div class="a" style="right:440px;top:590px;width:220px;height:220px;border-radius:50%;overflow:hidden;z-index:35;border:8px solid #fff;box-shadow:0 24px 50px rgba(150,40,80,.25)"><img src="${photo('retinol_jar.png')}" style="width:100%;height:100%;object-fit:cover;object-position:50% 50%;transform:scale(1.2)"></div>
  <div class="a" style="left:60px;top:200px;width:430px;z-index:40;direction:ltr;text-align:left">
    <div class="caps" style="font-size:16px;color:${ROSE}">Soin visage</div>
    <div class="fr" style="font-size:84px;line-height:.95;margin-top:10px;color:${C.ink}">Rétinol-<br>Like</div></div>
  <div class="a" style="left:60px;top:410px;width:360px;z-index:40">
    <div style="font-weight:700;font-size:40px;line-height:1.3">بشرة أنعم وأكثر نضارة</div>
    <div style="font-size:23px;line-height:1.55;color:${C.muted};margin-top:8px">روتين فرنسي ضد علامات التقدّم بالعمر، صباحاً ومساءً.</div></div>
  <div class="a" style="left:60px;right:60px;top:860px;z-index:40;display:flex;gap:14px;justify-content:space-between">${cards.map(([p, n]) => productCard(p, n, { accent: ROSE, w: 228, imgH: 168 })).join('')}</div>
  ${bottomBar()}
  <div class="a paper" style="opacity:.2"></div>`;
});

// 8 — حمّلي التطبيق
SLIDES.push(() => {
  const perks = [['shield', 'منتجات أصلية <span class="lat">100%</span>'], ['truck', 'توصيل لكل العراق'], ['tag', 'الدفع عند الاستلام']];
  const dots = ['vitc_routine.png', 'argan_shampoo.jpg', 'monoi_jar.jpg', 'hair_comb.jpg', 'face_skin.png'];
  return `
  <div class="a" style="inset:0;background:radial-gradient(80% 60% at 50% 40%, #FFFBF5 0%, ${C.ivory} 55%, ${C.paper} 100%)"></div>
  ${topBar()}
  <div class="a" style="top:200px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
    ${logo(430)}
    <div style="display:flex;margin-top:44px">${dots.map((f, i) => `<div style="width:140px;height:140px;border-radius:50%;overflow:hidden;border:6px solid #fff;margin-left:${i ? -22 : 0}px;box-shadow:0 12px 26px rgba(70,40,20,.18);position:relative;z-index:${10 - i}"><img src="${photo(f)}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}</div>
    <div style="margin-top:56px;display:flex;align-items:center;gap:30px">${appIcon(166, 'rgba(185,138,78,.35)')}
      <div><div style="font-weight:700;font-size:56px;line-height:1.15">حمّلي تطبيق<br>ديما الحياة</div></div></div>
    <div style="margin-top:32px;font-size:28px;line-height:1.55;color:${C.muted};text-align:center">كل منتجات إيفولوديرم الأصلية بين يديكِ<br>اطلبيها بلمسة واحدة أو زورينا في المحل</div>
    <div style="margin-top:32px">${channels(1)}</div>
    <div style="margin-top:40px">${appStoreBadge(1.55)}</div>
    <div style="margin-top:44px;display:flex;gap:14px">${perks.map(([i, t]) => `<span style="display:inline-flex;align-items:center;gap:10px;padding:13px 22px;border-radius:999px;border:1.5px solid ${C.line};background:rgba(255,255,255,.6);font-weight:500;font-size:23px">${ICON(i, 24, C.gold)}${t}</span>`).join('')}</div>
    <div style="margin-top:44px;display:flex;align-items:center;gap:16px">${tricolor(40, 3)}<span class="lat" style="font-family:Jost;font-weight:400;font-size:24px;letter-spacing:.3em;color:${C.ink}">DEEMAALHAYAT.COM</span>${tricolor(40, 3)}</div>
  </div>
  <div class="a" style="right:64px;top:340px;z-index:45">${seal(150, { rotate: 10 })}</div>
  <div class="a paper"></div>`;
});

function page(i) {
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${SLIDES[i]()}</body></html>`;
}

module.exports = { page, count: SLIDES.length, W, H };
