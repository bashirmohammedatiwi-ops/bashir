// Instagram Black Friday 2026 — مكتبة الشرائح (1080×1350، تُصدَّر ×2).
// كل شريحة: أيقونة التطبيق + «متوفر على App Store». الأسلوب: Noir Studio (نفس تصاميم التطبيق).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BF = path.join(ROOT, '..', 'bf');
const ALPHA = path.join(BF, 'alpha'); // منتجات مقصوصة بشفافية
const CUT = path.join(BF, 'cut'); // منتجات على خلفية بيضاء (لبطاقات التطبيق)
const ASSETS = path.join(ROOT, 'assets');
const W = 1080, H = 1350;
const url = (p) => 'file:///' + p.replace(/\\/g, '/');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const byId = Object.fromEntries(catalog.map((p) => [p.id, p]));

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
/** سطر الغلاف بلا «في التطبيق» (القنوات تظهر في شارتين تحته). */
const coverSub = (t) =>
  String(t || '')
    .replace(/\s*[—–-]?\s*(الآن\s+)?(في|داخل|على)\s+(تطبيق ديما الحياة|التطبيق)(\s+الآن)?\s*$/u, '')
    .trim();
/** يعزل المقاطع اللاتينية داخل نص عربي حتى لا تنقلب علاماتها (SPF 50+). */
const iso = (t) =>
  String(t ?? '').replace(
    /[\p{Script=Latin}0-9][\p{Script=Latin}0-9 .,+%&'’·×/-]*[\p{Script=Latin}0-9+%]|[\p{Script=Latin}0-9]/gu,
    (m) => `<span dir="ltr" style="unicode-bidi:isolate">${m}</span>`,
  );
const money = (n) => Number(n || 0).toLocaleString('en-US');

// ---------- هويات البراندات (نفس بنرات التطبيق) ----------
const BRANDS = {
  lierac: { ar: 'ليراك', world: 'care', a1: '#F7E7C1', a2: '#C9A15A', light: '#E8C886',
    word: (s = 1) => `<div class="lat wm" style="font-family:Jost;font-weight:300;font-size:${92 * s}px;letter-spacing:.36em;margin-left:-.36em">LIERAC</div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${21 * s}px;letter-spacing:1.1em;opacity:.6;margin-top:${12 * s}px">PARIS</div>` },
  phyto: { ar: 'فيتو', world: 'care', a1: '#E6F0D6', a2: '#9DBF73', light: '#B9D58E',
    word: (s = 1) => `<div class="lat wm" style="font-family:Montserrat;font-weight:600;font-size:${92 * s}px;letter-spacing:.34em;margin-left:-.34em">PHYTO</div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${21 * s}px;letter-spacing:1.1em;opacity:.6;margin-top:${12 * s}px">PARIS</div>` },
  bioderma: { ar: 'بيوديرما', world: 'care', a1: '#DDF2FF', a2: '#4DB2EC', light: '#7CC8F2',
    word: (s = 1) => `<div class="lat wm" style="font-family:Montserrat;font-weight:800;font-size:${82 * s}px;letter-spacing:.06em">BIODERMA</div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${18 * s}px;letter-spacing:.5em;opacity:.6;margin-top:${12 * s}px">LABORATOIRE DERMATOLOGIQUE</div>` },
  'brand-1784986563282': { ar: 'ديبورا', world: 'beauty', a1: '#FBE2D8', a2: '#D9917F', light: '#F0B3A2',
    word: (s = 1) => `<div class="lat wm" style="font-family:'Bodoni Moda';font-weight:700;font-size:${90 * s}px;letter-spacing:.12em;-webkit-text-stroke:${1.6 * s}px #fff">DEBORAH</div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${21 * s}px;letter-spacing:1.1em;opacity:.6;margin-top:${12 * s}px">MILANO</div>` },
  revox: { ar: 'ريفوكس', world: 'care', a1: '#F3F4F6', a2: '#A9B1BA', light: '#D7DCE2',
    word: (s = 1) => `<div class="lat wm" style="font-family:Montserrat;font-weight:500;font-size:${92 * s}px;letter-spacing:.28em;margin-left:-.28em">REVOX</div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${19 * s}px;letter-spacing:.8em;opacity:.6;margin-top:${12 * s}px">JUST · SKINCARE</div>` },
  beesline: { ar: 'بيزلين', world: 'care', a1: '#FFE9A8', a2: '#EBA91A', light: '#F7C84A',
    word: (s = 1) => `<div class="lat wm" style="font-family:Montserrat;font-weight:700;font-size:${92 * s}px;letter-spacing:.01em">Beesline<span style="font-size:.4em;vertical-align:super;font-weight:500">®</span></div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${19 * s}px;letter-spacing:.7em;opacity:.6;margin-top:${12 * s}px">NATURAL · DERMATOLOGICAL</div>` },
  dermolab: { ar: 'ديرمولاب', world: 'care', a1: '#DDE9FF', a2: '#5A93E0', light: '#86B0EE',
    word: (s = 1) => `<div class="lat wm" style="font-family:Montserrat;font-weight:800;font-size:${86 * s}px;letter-spacing:.06em">DERMOLAB</div><div class="lat wm" style="font-family:Jost;font-weight:400;font-size:${18 * s}px;letter-spacing:.6em;opacity:.6;margin-top:${12 * s}px">DEBORAH GROUP · MILANO</div>` },
};
for (const [k, v] of Object.entries(BRANDS)) v.key = k;
const WORLDS = {
  care: { name: 'طقوس العناية', c1: '#1F8F74', c2: '#5DBB9F', soft: '#E6F4EF' },
  beauty: { name: 'سحر الجمال', c1: '#8E3FB3', c2: '#C16FD9', soft: '#F4E9F8' },
};

// ---------- عناصر مشتركة ----------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,500..900&family=Montserrat:wght@300;400;500;600;700;800&family=Jost:wght@300;400;500&family=Inter:wght@500;600;700&display=block" rel="stylesheet">`;
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:#050506;font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased;color:#fff}
.a{position:absolute}
.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.wm{line-height:1;color:#fff}
.grain{inset:0;opacity:.08;mix-blend-mode:overlay;z-index:95;pointer-events:none;
 background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
`;

const APPLE = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`;

/** شارة «متوفر على App Store» بأسلوب شارة Apple الرسمية. */
function appStoreBadge(scale = 1, light = false) {
  const h = 64 * scale;
  const bg = light ? '#fff' : '#000', fg = light ? '#000' : '#fff', bd = light ? '#fff' : 'rgba(255,255,255,.55)';
  return `<div style="display:inline-flex;align-items:center;gap:${12 * scale}px;height:${h}px;padding:0 ${20 * scale}px 0 ${22 * scale}px;border-radius:${14 * scale}px;background:${bg};color:${fg};border:${1.5 * scale}px solid ${bd};direction:ltr">
    <span style="width:${32 * scale}px;height:${38 * scale}px;display:block;margin-top:-${4 * scale}px">${APPLE}</span>
    <span style="display:flex;flex-direction:column;align-items:flex-end;line-height:1">
      <span style="font-family:'IBM Plex Sans Arabic';font-weight:500;font-size:${15 * scale}px;opacity:.9;margin-bottom:${4 * scale}px">متوفر على</span>
      <span style="font-family:Inter;font-weight:600;font-size:${27 * scale}px;letter-spacing:-.01em">App Store</span>
    </span></div>`;
}

/** أيقونة التطبيق بزوايا iOS. */
const appIcon = (size, glow) =>
  `<img src="${url(path.join(ASSETS, 'app_icon.png'))}" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;display:block;box-shadow:0 ${size * 0.08}px ${size * 0.3}px rgba(0,0,0,.45)${glow ? `, 0 0 ${size * 0.8}px ${glow}` : ''};border:1px solid rgba(255,255,255,.18)">`;

/** شريط علوي ثابت: أيقونة + اسم التطبيق (يمين) و BLACK FRIDAY (يسار). */
function topBar(b) {
  return `<div class="a" style="top:52px;right:60px;left:60px;z-index:80;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:16px">${appIcon(64)}
      <div style="display:flex;flex-direction:column;gap:4px"><span style="font-weight:700;font-size:28px;line-height:1">ديما الحياة</span>
      <span class="lat" style="font-family:Jost;font-weight:400;font-size:14px;letter-spacing:.42em;opacity:.6;line-height:1">DEEMA ALHAYAT</span></div></div>
    <div style="display:flex;align-items:center;gap:14px"><span style="font-weight:500;font-size:24px;color:rgba(255,255,255,.75)">الجمعة السوداء</span>
      <span style="width:40px;height:1px;background:${rgba(b.a1, 0.6)}"></span>
      <span class="lat" style="font-family:Montserrat;font-weight:600;font-size:20px;letter-spacing:.5em;color:${b.a1}">BLACK FRIDAY</span></div>
  </div>`;
}

/** شريط سفلي ثابت: «حمّلي التطبيق» + شارة App Store. */
function bottomBar(b, text = 'العروض في محل ديما الحياة وعلى التطبيق', icon = 'store') {
  return `<div class="a" style="bottom:48px;right:60px;left:60px;z-index:80;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:14px">${appIcon(52)}<span style="display:flex;align-items:center;gap:10px;font-weight:500;font-size:26px;color:rgba(255,255,255,.88)">${ICON(icon, 26, b.a1)}${text}</span></div>
    ${appStoreBadge(1)}
  </div>`;
}

// ---------- عالم بصري لكل براند (خلفية + زخرفة) ----------
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const svgUri = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
/** الزخارف لا تدخل الشريط العلوي/السفلي ولا منطقة العنوان والرقم ولا وسط المنتجات. */
const clear = (x, y, r = 0) => !(y - r < 200 || y + r > H - 200 || (x + r > 120 && x - r < 960 && y - r < 500) || (x + r > 220 && x - r < 860 && y < 1120));
const fade = 'mask-image:radial-gradient(75% 65% at 50% 42%, rgba(0,0,0,0) 28%, #000 78%);-webkit-mask-image:radial-gradient(75% 65% at 50% 42%, rgba(0,0,0,0) 28%, #000 78%)';

const THEMES = {
  // ليراك: أسود وذهب (المعتمد)
  lierac: { bg: ['#131116', '#070608', '#030304'], motif: () => '' },
  // فيتو: أخضر غابي وأوراق نباتية بخط رفيع مثل شعارها
  phyto: {
    bg: ['#15231A', '#0A120C', '#050806'],
    motif: (b) => {
      const leaf = (x, y, s, r, o) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" opacity="${o}">
        <path d="M0 0 C 60 -90 190 -90 250 0 C 190 90 60 90 0 0 Z" fill="${rgba(b.a2, 0.05)}" stroke="${b.a2}" stroke-width="2.2"/>
        <path d="M0 0 L 250 0" stroke="${b.a2}" stroke-width="1.6"/>
        ${[50, 95, 140, 185].map((v) => `<path d="M${v} 0 Q ${v + 28} -30 ${v + 52} -48 M${v} 0 Q ${v + 28} 30 ${v + 52} 48" stroke="${b.a2}" stroke-width="1.2" fill="none"/>`).join('')}</g>`;
      return `<svg class="a" style="inset:0;z-index:1" viewBox="0 0 ${W} ${H}" fill="none">
        ${leaf(-90, 640, 1.15, -22, 0.34)}${leaf(1170, 620, 1.15, 202, 0.34)}${leaf(-80, 960, 0.95, 24, 0.26)}${leaf(1160, 940, 0.95, 156, 0.26)}</svg>`;
    },
  },
  // بيوديرما: أزرق داكن، فقاعات وقطرات ونقاط مختبر جلدي
  bioderma: {
    bg: ['#0E2236', '#06121F', '#030910'],
    motif: (b) => {
      seed = 11;
      let c = '';
      for (let i = 0; i < 90; i++) {
        const r = 10 + rnd() * 50, x = rnd() * W, y = rnd() * H;
        if (!clear(x, y, r)) continue;
        c += `<circle cx="${x}" cy="${y}" r="${r}" fill="${rgba(b.a1, 0.03)}" stroke="${b.a1}" stroke-opacity="${0.1 + rnd() * 0.1}" stroke-width="1.6"/>
              <circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.18}" fill="${b.a1}" fill-opacity=".22"/>`;
      }
      const dots = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><circle cx="2" cy="2" r="1.4" fill="${b.a2}" fill-opacity=".35"/></svg>`);
      return `<div class="a" style="inset:0;z-index:1;background:${dots};opacity:.6;${fade}"></div><svg class="a" style="inset:0;z-index:1" viewBox="0 0 ${W} ${H}">${c}</svg>`;
    },
  },
  // بيزلين: عسلي داكن وخلايا نحل
  beesline: {
    bg: ['#2A1B06', '#140D03', '#0A0602'],
    motif: (b) => {
      const s = 46, hgt = s * Math.sqrt(3);
      const hex = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${s * 3}" height="${hgt}"><g fill="none" stroke="${b.a2}" stroke-width="1.6" stroke-opacity=".55">
        <path d="M${s / 2} 0 L${s * 1.5} 0 L${s * 2} ${hgt / 2} L${s * 1.5} ${hgt} L${s / 2} ${hgt} L0 ${hgt / 2} Z"/>
        <path d="M${s * 2} ${hgt / 2} L${s * 3} ${hgt / 2}"/></g></svg>`);
      seed = 5;
      let cells = '';
      for (let i = 0; i < 9; i++) {
        const x = rnd() < 0.5 ? 40 + rnd() * 180 : W - 220 + rnd() * 180, y = 520 + rnd() * 560, r = 24 + rnd() * 24;
        if (!clear(x, y, r)) continue;
        const pts = [0, 1, 2, 3, 4, 5].map((k) => `${x + r * Math.cos((Math.PI / 3) * k)},${y + r * Math.sin((Math.PI / 3) * k)}`).join(' ');
        cells += `<polygon points="${pts}" fill="${b.light}" fill-opacity="${0.12 + rnd() * 0.18}" stroke="${b.a1}" stroke-opacity=".5"/>`;
      }
      return `<div class="a" style="inset:0;z-index:1;background:${hex};opacity:.5;${fade}"></div><svg class="a" style="inset:0;z-index:1" viewBox="0 0 ${W} ${H}">${cells}</svg>`;
    },
  },
  // ريفوكس: غرافيت ومختبر دقيق: شبكة، علامات قياس، رموز علمية
  revox: {
    bg: ['#1A1D21', '#0D0F11', '#060708'],
    motif: (b) => {
      const grid = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M60 0H0V60" fill="none" stroke="${b.a1}" stroke-opacity=".09" stroke-width="1"/></svg>`);
      const tick = (y, label) => `<g opacity=".55"><path d="M64 ${y}h26" stroke="${b.a2}" stroke-width="1.4"/><text x="98" y="${y + 6}" font-family="Jost" font-size="17" letter-spacing="3" fill="${b.a2}">${label}</text></g>`;
      return `<div class="a" style="inset:0;z-index:1;background:${grid};${fade}"></div>
        <svg class="a" style="inset:0;z-index:1;direction:ltr" direction="ltr" viewBox="0 0 ${W} ${H}">
          ${tick(560, 'C₆H₈O₆')}${tick(700, 'AHA · BHA')}${tick(840, 'pH 3.5')}${tick(980, 'B77')}
          <g opacity=".5" transform="translate(${W - 130} 640)" stroke="${b.a2}" fill="none" stroke-width="1.6">
            <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20"/><path d="M35 -20 L70 -40 M35 20 L70 40 M0 40 L0 80"/><circle cx="70" cy="-40" r="6"/><circle cx="70" cy="40" r="6"/></g>
          <text x="${W - 60}" y="${H - 190}" text-anchor="end" font-family="Jost" font-size="16" letter-spacing="5" fill="${b.a2}" opacity=".5">REVOX B77 · LAB GRADE</text></svg>`;
    },
  },
  // ديرمولاب: أزرق إيطالي وموجات حريرية
  dermolab: {
    bg: ['#0C1E3C', '#060F22', '#030712'],
    motif: (b) => {
      let w = '';
      for (let i = 0; i < 9; i++) {
        const y = 560 + i * 30, amp = 40 + i * 5;
        w += `<path d="M-40 ${y} C 260 ${y - amp}, 520 ${y + amp}, 800 ${y} S 1200 ${y - amp}, 1140 ${y}" stroke="${b.a1}" stroke-opacity="${0.08 + i * 0.02}" stroke-width="1.6" fill="none"/>`;
      }
      let w2 = '';
      for (let i = 0; i < 7; i++) {
        const y = 1050 + i * 26, amp = 40 + i * 5;
        w2 += `<path d="M-40 ${y} C 300 ${y + amp}, 600 ${y - amp}, 1120 ${y}" stroke="${b.a2}" stroke-opacity="${0.1 + i * 0.03}" stroke-width="1.4" fill="none"/>`;
      }
      return `<svg class="a" style="inset:0;z-index:1;${fade}" viewBox="0 0 ${W} ${H}">${w}${w2}</svg>`;
    },
  },
  // ديبورا: برقوقي وردي، لمعان وبريق مكياج
  'brand-1784986563282': {
    bg: ['#2A121C', '#14080D', '#0A0407'],
    motif: (b) => {
      seed = 3;
      let s = '';
      for (let i = 0; i < 120; i++) {
        const x = rnd() * W, y = rnd() * H, r = 3 + rnd() * 12;
        if (!clear(x, y, r * 2.2)) continue;
        s += rnd() < 0.45
          ? `<path d="M${x} ${y - r * 2.2} Q ${x} ${y} ${x + r * 2.2} ${y} Q ${x} ${y} ${x} ${y + r * 2.2} Q ${x} ${y} ${x - r * 2.2} ${y} Q ${x} ${y} ${x} ${y - r * 2.2} Z" fill="${b.a1}" fill-opacity="${0.35 + rnd() * 0.5}"/>`
          : `<circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="${b.light}" fill-opacity="${0.06 + rnd() * 0.12}"/>`;
      }
      return `<div class="a" style="inset:0;z-index:1;background:linear-gradient(118deg, rgba(0,0,0,0) 30%, ${rgba(b.light, 0.08)} 46%, rgba(0,0,0,0) 62%)"></div>
        <svg class="a" style="inset:0;z-index:1" viewBox="0 0 ${W} ${H}">${s}</svg>`;
    },
  },
};

function scene(b, { cx = W / 2, floor = 960, beamW = 900, glowY, motif = 1 } = {}) {
  const t = THEMES[b.key] || THEMES.lierac;
  return `
  <div class="a" style="inset:0;background:radial-gradient(90% 70% at 50% 45%, ${t.bg[0]} 0%, ${t.bg[1]} 62%, ${t.bg[2]} 100%)"></div>
  <div class="a" style="inset:0;z-index:1;opacity:${motif};-webkit-mask-image:linear-gradient(180deg, transparent 0 180px, #000 240px calc(100% - 240px), transparent calc(100% - 180px));mask-image:linear-gradient(180deg, transparent 0 180px, #000 240px calc(100% - 240px), transparent calc(100% - 180px))">${motif ? t.motif(b, floor) : ''}</div>
  <div class="a" style="left:${cx - beamW / 2}px;top:-120px;width:${beamW}px;height:${floor + 140}px;z-index:2;filter:blur(40px);opacity:.78;
    clip-path:polygon(36% 0, 64% 0, 100% 100%, 0 100%);background:linear-gradient(180deg, ${rgba(b.light, 0.34)} 0%, ${rgba(b.light, 0.1)} 58%, ${rgba(b.light, 0)} 100%)"></div>
  <div class="a" style="left:${cx - 520}px;top:${(glowY ?? floor) - 620}px;width:1040px;height:760px;z-index:3;background:radial-gradient(closest-side, ${rgba(b.light, 0.28)}, ${rgba(b.light, 0.07)} 55%, rgba(0,0,0,0))"></div>
  <div class="a" style="left:0;right:0;top:${floor}px;bottom:0;z-index:4;background:linear-gradient(180deg, ${rgba(b.light, 0.1)} 0%, rgba(10,9,11,.92) 18%, #040405 100%)"></div>
  <div class="a" style="left:0;right:0;top:${floor}px;height:2px;z-index:5;background:linear-gradient(90deg, rgba(255,255,255,0) 8%, ${rgba(b.a1, 0.42)} 40%, ${rgba(b.a1, 0.42)} 60%, rgba(255,255,255,0) 92%)"></div>
  <div class="a" style="inset:0;z-index:60;pointer-events:none;background:radial-gradient(120% 110% at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,.6) 100%)"></div>`;
}

// ---------- المنتجات ----------
function cutout(id) {
  const meta = JSON.parse(fs.readFileSync(path.join(ALPHA, 'meta.json'), 'utf8'));
  const m = meta[id];
  if (!m) throw new Error('no cutout for ' + id + ' (run: node prep.js ' + id + ')');
  return { src: url(path.join(ALPHA, id + '.png')), ratio: m.ratio };
}

const hasCutout = (id) => !!JSON.parse(fs.readFileSync(path.join(ALPHA, 'meta.json'), 'utf8'))[id];

/** تكوين منتجات على الأرضية: الأول في الوسط والأكبر، الباقي يمين/يسار، مع انعكاس. */
function composition(ids, { x, w, h, floor, light, overlap = 0.15 }) {
  const items = ids.map((id, rank) => ({ ...cutout(id), rank }));
  const n = items.length, mid = Math.floor(n / 2);
  const slots = new Array(n);
  slots[mid] = items[0];
  let l = mid - 1, r = mid + 1;
  for (let i = 1; i < n; i++) {
    if (i % 2 === 1 && r < n) slots[r++] = items[i];
    else if (l >= 0) slots[l--] = items[i];
    else slots[r++] = items[i];
  }
  const sized = slots.map((it, idx) => {
    const dist = Math.abs(idx - mid);
    const base = h * (dist === 0 ? 1 : dist === 1 ? 0.8 : 0.64);
    const hh = Math.min(base, base * Math.pow(0.6 / Math.max(it.ratio, 0.18), 0.5));
    return { ...it, dist, h: hh, w: hh * it.ratio };
  });
  let total = sized.reduce((s, it) => s + it.w, 0) - sized.slice(1).reduce((s, it) => s + it.w * overlap, 0);
  const k = Math.min(1, w / total);
  sized.forEach((it) => { it.h *= k; it.w *= k; });
  total *= k;
  let cx = x + (w - total) / 2;
  let html = '';
  sized.forEach((it, idx) => {
    if (idx > 0) cx -= it.w * overlap;
    const left = cx;
    cx += it.w;
    const z = 20 - it.dist * 2;
    const dim = it.dist === 0 ? 1 : it.dist === 1 ? 0.9 : 0.8;
    html += `<img class="a" src="${it.src}" style="left:${left}px;top:${floor}px;width:${it.w}px;height:${it.h}px;transform:scaleY(-1);transform-origin:center;opacity:.22;z-index:${z - 10};filter:brightness(${dim * 0.8}) blur(1.2px);
      -webkit-mask-image:linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 24%)">`;
    html += `<div class="a" style="left:${left + it.w * 0.06}px;top:${floor - 9}px;width:${it.w * 0.88}px;height:18px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,0,0,.85), rgba(0,0,0,0));z-index:${z - 1}"></div>`;
    html += `<img class="a" src="${it.src}" style="left:${left}px;top:${floor - it.h}px;width:${it.w}px;height:${it.h}px;z-index:${z};filter:brightness(${dim}) drop-shadow(0 0 30px ${rgba(light, it.dist === 0 ? 0.32 : 0.18)}) drop-shadow(-16px 22px 28px rgba(0,0,0,.55))">`;
  });
  return `<div class="a" style="inset:0;z-index:10">${html}</div>`;
}

/** رقم الخصم بخط Bodoni معدني (مع حدّ يُبقي خطوط الشعرة مقروءة). */
function bigPct(b, pct, size = 300, label = 'خصم') {
  const metal = `linear-gradient(176deg, #ffffff 0%, ${b.a1} 38%, ${b.a2} 78%, ${b.a1} 100%)`;
  return `<div style="display:flex;align-items:flex-start;justify-content:center;gap:22px;direction:rtl">
    <div style="display:flex;flex-direction:column;align-items:flex-start;padding-top:${size * 0.13}px;gap:10px">
      <span style="font-weight:600;font-size:${size * 0.2}px;line-height:1;color:#fff">${label}</span>
      <span style="width:${size * 0.25}px;height:3px;background:${b.a2}"></span></div>
    <div class="lat" style="font-family:'Bodoni Moda';font-weight:700;font-size:${size}px;line-height:.78;letter-spacing:-.02em;background:${metal};-webkit-background-clip:text;color:transparent;padding:6px 0 14px;-webkit-text-stroke:${size / 64}px ${rgba(b.a1, 0.95)};paint-order:stroke fill">
      ${pct}<span style="font-size:.46em;vertical-align:top;position:relative;top:.16em;margin-left:.04em">%</span></div>
  </div>`;
}

const priceLine = (b, p, size = 44) => `<div style="display:flex;align-items:baseline;gap:18px;justify-content:center">
  <span style="font-weight:700;font-size:${size}px;color:#fff">${money(p.price)} <span style="font-size:.6em;font-weight:500">د.ع</span></span>
  <span style="font-weight:400;font-size:${size * 0.62}px;color:rgba(255,255,255,.5);text-decoration:line-through">${money(p.originalPrice)}</span></div>`;

// ---------- أيقونات خطية (بدل الإيموجي) ----------
const ICONS = {
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  crown: '<path d="m2 7 5 5 5-8 5 8 5-5-2 12H4Z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
};
const ICON = (name, size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${ICONS[name]}</svg>`;

/** «في محل ديما الحياة» + «وعلى التطبيق» — العروض في القناتين. */
const channels = (b, k = 1) => `<div style="display:flex;gap:${14 * k}px;justify-content:center;direction:rtl">${[['store', 'في محل ديما الحياة'], ['phone', 'وعلى التطبيق']].map(([i, t]) => `<span style="display:inline-flex;align-items:center;gap:${10 * k}px;padding:${10 * k}px ${24 * k}px;border-radius:999px;background:${rgba(b.a2, 0.18)};border:1.5px solid ${rgba(b.a1, 0.6)};font-weight:600;font-size:${26 * k}px;color:#fff;white-space:nowrap">${ICON(i, 28 * k, b.a1)}${t}</span>`).join('')}</div>`;

// ---------- شاشة التطبيق داخل iPhone ----------
function appScreen(brandKey, { hero, products, sectionTitle }) {
  const b = BRANDS[brandKey];
  const w = WORLDS[b.world];
  const chips = [['سحر الجمال', 'beauty'], ['طقوس العناية', 'care'], ['أناقة الرجل'], ['حكاية عطر']];
  const card = (p) => `<div style="width:150px;flex:none;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 16px rgba(30,20,40,.08)">
     <div style="position:relative;height:150px;background:#fff;display:flex;align-items:center;justify-content:center">
       <img src="${url(path.join(CUT, p.id + '.png'))}" style="max-width:118px;max-height:126px;object-fit:contain">
       <span style="position:absolute;top:8px;right:8px;background:#E2336B;color:#fff;font:700 12px Inter;padding:3px 7px;border-radius:999px;direction:ltr">-${p.pct}%</span></div>
     <div style="padding:8px 10px 11px;direction:rtl">
       <div style="font:500 11.5px/1.35 'IBM Plex Sans Arabic';color:#2A2433;height:31px;overflow:hidden">${iso(p.name)}</div>
       <div style="margin-top:5px;font:700 13.5px 'IBM Plex Sans Arabic';color:#E2336B">${money(p.price)} د.ع</div>
       <div style="font:400 10.5px 'IBM Plex Sans Arabic';color:#9A93A3;text-decoration:line-through">${money(p.originalPrice)}</div></div></div>`;
  return `<div style="width:390px;height:844px;background:#F7F5F9;position:relative;overflow:hidden;font-family:'IBM Plex Sans Arabic';direction:rtl">
    <div style="height:210px;background:linear-gradient(160deg, ${w.c1}, ${w.c2});border-radius:0 0 28px 28px;padding:54px 18px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;color:#fff">
        <div style="display:flex;align-items:center;gap:8px"><img src="${url(path.join(ASSETS, 'app_icon.png'))}" style="width:30px;height:30px;border-radius:8px"><div style="line-height:1.1"><div style="font:700 15px 'IBM Plex Sans Arabic'">ديما الحياة</div><div style="font:400 10px 'IBM Plex Sans Arabic';opacity:.85">مرحباً بكِ</div></div></div>
        <div style="display:flex;gap:8px">${['bell', 'heart', 'bag'].map((i) => `<span style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center">${ICON(i, 16, '#fff')}</span>`).join('')}</div></div>
      <div style="margin-top:14px;height:40px;border-radius:14px;background:#fff;display:flex;align-items:center;gap:8px;padding:0 14px;color:#9A93A3;font:400 12.5px 'IBM Plex Sans Arabic'">${ICON('search', 16, '#9A93A3')} ابحثي عن منتج، براند أو باركود…</div>
      <div style="display:flex;gap:8px;margin-top:14px">${chips.map(([n, k]) => `<span style="flex:none;padding:7px 12px;border-radius:12px;font:600 11.5px 'IBM Plex Sans Arabic';${k === b.world ? `background:#fff;color:${w.c1}` : 'background:rgba(255,255,255,.16);color:#fff'}">${n}</span>`).join('')}</div>
    </div>
    <div style="margin:14px 14px 0;border-radius:20px;overflow:hidden;box-shadow:0 10px 24px rgba(20,10,30,.18);position:relative">
      <img src="${url(path.join(ASSETS, hero))}" style="width:100%;display:block">
      <div style="position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:center;gap:4px">${[1, 0, 0, 0].map((a) => `<span style="height:5px;width:${a ? 16 : 5}px;border-radius:9px;background:rgba(255,255,255,${a ? 1 : 0.55})"></span>`).join('')}</div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:18px 16px 10px">
      <div style="font:700 16px 'IBM Plex Sans Arabic';color:#1F1A26">${sectionTitle}</div>
      <div style="font:600 11.5px 'IBM Plex Sans Arabic';color:${w.c1}">عرض الكل ‹</div></div>
    <div style="display:flex;gap:10px;padding:0 14px;direction:rtl">${products.slice(0, 3).map(card).join('')}</div>
    <div style="position:absolute;bottom:22px;left:14px;right:14px;height:62px;border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(20,10,30,.14);display:flex;align-items:center;justify-content:space-around;padding:0 10px;font-size:18px;color:#8F879A">
      <span style="background:${w.c1};color:#fff;font:600 12px 'IBM Plex Sans Arabic';padding:8px 14px;border-radius:16px;display:flex;align-items:center;gap:6px">${ICON('home', 15, '#fff')} الرئيسية</span>${['grid', 'crown', 'tag', 'cart', 'user'].map((i) => ICON(i, 20, '#8F879A')).join('')}</div>
  </div>`;
}

/** إطار iPhone (تيتانيوم) يحيط بشاشة 390×844، بحجم معيّن وميلان خفيف. */
function iphone(screenHtml, { x, y, scale = 1, rotate = 0 }) {
  const fw = 390 + 28, fh = 844 + 28;
  return `<div class="a" style="left:${x}px;top:${y}px;width:${fw}px;height:${fh}px;transform:scale(${scale}) rotate(${rotate}deg);transform-origin:top left;z-index:30">
    <div class="a" style="inset:0;border-radius:68px;background:linear-gradient(145deg,#5b5b60,#1c1c1f 30%,#3a3a3e 60%,#121214);box-shadow:0 60px 120px rgba(0,0,0,.65), 0 0 0 2px rgba(255,255,255,.08), inset 0 0 0 2px rgba(255,255,255,.12)"></div>
    <div class="a" style="inset:7px;border-radius:62px;background:#000"></div>
    <div class="a" style="left:14px;top:14px;width:390px;height:844px;border-radius:54px;overflow:hidden">${screenHtml}
      <div class="a" style="top:0;left:0;right:0;height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 30px;font:600 15px Inter;color:#fff;direction:ltr"><span>9:41</span><span style="display:flex;gap:6px;align-items:center">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0"/><path d="M4 7a5.8 5.8 0 0 1 8 0"/><circle cx="8" cy="10" r="1.2" fill="#fff" stroke="none"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".7" y=".7" width="22" height="10.6" rx="3" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><rect x="2.4" y="2.4" width="18.6" height="7.2" rx="1.8" fill="#fff"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="#fff" fill-opacity=".5"/></svg></span></div>
      <div class="a" style="top:11px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000"></div>
      <div class="a" style="inset:0;background:linear-gradient(115deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 38%);pointer-events:none"></div></div>
    <div class="a" style="right:-4px;top:200px;width:5px;height:96px;border-radius:3px;background:#2a2a2e"></div>
    <div class="a" style="left:-4px;top:170px;width:5px;height:60px;border-radius:3px;background:#2a2a2e"></div>
    <div class="a" style="left:-4px;top:250px;width:5px;height:60px;border-radius:3px;background:#2a2a2e"></div>
  </div>`;
}

// ---------- أنواع الشرائح ----------
const SLIDES = {
  /**
   * 1 — الغلاف: البراند و«حتى X%» أعلى، هاتف يعرض العرض داخل التطبيق واقف على الأرضية،
   * ومنتجات البراند الحقيقية حوله (s.stage: حتى 4 منتجات مقصوصة؛ 0 و2 يساراً، 1 و3 يميناً).
   */
  app(bk, s) {
    const b = BRANDS[bk];
    const products = s.products.map((id) => byId[id]).filter(Boolean);
    const FLOOR = 1172;
    const sc = 0.72, ph = (844 + 28) * sc, pw = (390 + 28) * sc;
    const phone = iphone(appScreen(bk, { hero: s.hero, products, sectionTitle: `${b.ar} — الجمعة السوداء` }), { x: W / 2 - pw / 2 + 8, y: FLOOR - ph + 6, scale: sc, rotate: -3 });
    const stage = (s.stage || s.products).filter(hasCutout).slice(0, 4);
    const left = stage.filter((_, i) => i % 2 === 0), right = stage.filter((_, i) => i % 2 === 1);
    const group = (ids, x) => (ids.length ? `<div class="a" style="inset:0;z-index:35">${composition(ids, { x, w: 330, h: s.stageH || 330, floor: FLOOR, light: b.light, overlap: 0.12 })}</div>` : '');
    return `${scene(b, { floor: FLOOR, beamW: 1080, glowY: 1040 })}${topBar(b)}
      <div class="a" style="top:162px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
        <div style="text-align:center">${b.word(0.74)}</div>
        <div style="margin-top:14px">${bigPct(b, s.pct, 150, 'حتى')}</div>
        <div style="margin-top:0;font-weight:500;font-size:31px;color:rgba(255,255,255,.85)">${coverSub(s.sub)}</div>
        <div style="margin-top:12px">${channels(b, 0.85)}</div></div>
      ${phone}
      ${group(left, 24)}${group(right, W - 354)}
      ${bottomBar(b, 'حمّلي تطبيق ديما الحياة الآن', 'phone')}
      <div class="a grain"></div>`;
  },
  /** 2 — البطل: البراند + «حتى X%» + المنتجات. */
  hero(bk, s) {
    const b = BRANDS[bk];
    return `${scene(b, { floor: 1060 })}${topBar(b)}
      <div class="a" style="top:200px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
        <div style="text-align:center">${b.word(1)}</div>
        <div style="margin-top:34px">${bigPct(b, s.pct, 270, s.label || 'حتى')}</div>
        <div style="margin-top:12px;font-weight:400;font-size:36px;color:rgba(255,255,255,.82)">${s.sub}</div></div>
      ${composition(s.products, { x: 90, w: 900, h: s.h || 400, floor: 1060, light: b.light })}
      ${bottomBar(b)}<div class="a grain"></div>`;
  },
  /** عرض واحد: «خصم X%» + منتجاته. */
  offer(bk, s) {
    return SLIDES.hero(bk, { ...s, label: 'خصم' });
  },
  /** منتج واحد كبير بسعره. */
  spotlight(bk, s) {
    const b = BRANDS[bk];
    const p = byId[s.product];
    return `${scene(b, { floor: 980, beamW: 760 })}${topBar(b)}
      <div class="a" style="top:170px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
        <div class="lat" style="font-family:Montserrat;font-weight:600;font-size:22px;letter-spacing:.5em;color:${b.a1}">${s.kicker || 'BEST OFFER'}</div>
        <div style="margin-top:14px;font-weight:700;font-size:46px;line-height:1.3;text-align:center;max-width:900px">${iso(s.title || p.name)}</div></div>
      ${composition([s.product], { x: 240, w: 600, h: s.h || 520, floor: 980, light: b.light })}
      <div class="a" style="top:340px;left:70px;z-index:45;width:190px;height:190px;border-radius:50%;background:linear-gradient(150deg, ${b.a1}, ${b.a2});color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(0,0,0,.5)">
        <span style="font-weight:600;font-size:26px;line-height:1">خصم</span><span class="lat" style="font-family:'Bodoni Moda';font-weight:800;font-size:76px;line-height:1;-webkit-text-stroke:2.6px #111;paint-order:stroke fill">${p.pct}%</span></div>
      <div class="a" style="top:1010px;left:0;right:0;z-index:45">${priceLine(b, p, 56)}
        ${s.note ? `<div style="text-align:center;margin-top:8px;font-size:28px;color:rgba(255,255,255,.65)">${s.note}</div>` : ''}</div>
      ${bottomBar(b)}<div class="a grain"></div>`;
  },
  /** شبكة 2×2 بأسعار. */
  grid(bk, s) {
    const b = BRANDS[bk];
    const card = (id) => {
      const p = byId[id];
      return `<div style="background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));border:1px solid ${rgba(b.a1, 0.22)};border-radius:28px;padding:16px 16px 18px;display:flex;flex-direction:column;align-items:center;position:relative">
        <span class="lat" style="position:absolute;top:16px;left:16px;font-family:Montserrat;font-weight:800;font-size:22px;color:#111;background:linear-gradient(150deg, ${b.a1}, ${b.a2});padding:6px 12px;border-radius:999px">-${p.pct}%</span>
        <div style="height:236px;width:100%;margin-top:30px;display:flex;align-items:flex-end;justify-content:center"><img src="${cutout(id).src}" style="max-height:206px;max-width:72%;object-fit:contain;filter:drop-shadow(0 0 24px ${rgba(b.light, 0.25)}) drop-shadow(0 18px 22px rgba(0,0,0,.5))"></div>
        <div style="margin-top:6px;font-weight:500;font-size:22px;line-height:1.35;text-align:center;height:60px;overflow:hidden;color:rgba(255,255,255,.88)">${iso(s.names?.[id] || p.name)}</div>
        <div style="margin-top:8px">${priceLine(b, p, 32)}</div></div>`;
    };
    return `${scene(b, { floor: 1350, beamW: 1100, glowY: 900, motif: 0 })}${topBar(b)}
      <div class="a" style="top:160px;left:0;right:0;z-index:40;text-align:center">
        <div style="font-weight:700;font-size:52px">${s.title}</div>
        <div style="margin-top:8px;font-size:28px;color:rgba(255,255,255,.7)">${s.sub || ''}</div></div>
      <div class="a" style="top:320px;left:60px;right:60px;z-index:40;display:grid;grid-template-columns:1fr 1fr;gap:22px">${s.products.slice(0, 4).map(card).join('')}</div>
      ${bottomBar(b)}<div class="a grain"></div>`;
  },
  /** الأخيرة: حمّلي التطبيق. */
  cta(bk, s) {
    const b = BRANDS[bk];
    const perks = ['منتجات أصلية 100%', 'توصيل لكل العراق', 'الدفع عند الاستلام'];
    return `${scene(b, { floor: 1350, beamW: 1000, glowY: 760, motif: 0.35 })}${topBar(b)}
      <div class="a" style="top:250px;left:0;right:0;z-index:40;display:flex;flex-direction:column;align-items:center">
        ${appIcon(250, rgba(b.light, 0.5))}
        <div style="margin-top:46px;font-weight:700;font-size:64px;line-height:1.2;text-align:center">${s.title || 'حمّلي تطبيق ديما الحياة'}</div>
        <div style="margin-top:16px;font-size:32px;color:rgba(255,255,255,.78);text-align:center;max-width:800px;line-height:1.5;text-wrap:balance">${s.sub}</div>
        <div style="margin-top:30px">${channels(b, 1.1)}</div>
        <div style="margin-top:40px">${appStoreBadge(1.6, true)}</div>
        <div style="margin-top:40px;display:flex;gap:16px">${perks.map((t) => `<span style="padding:14px 24px;border-radius:999px;border:1.5px solid ${rgba(b.a1, 0.4)};font-weight:500;font-size:25px;color:rgba(255,255,255,.88)">${t}</span>`).join('')}</div>
        <div class="lat" style="margin-top:40px;font-family:Jost;font-weight:400;font-size:26px;letter-spacing:.3em;color:${b.a1}">DEEMAALHAYAT.COM</div></div>
      <div class="a grain"></div>`;
  },
};

function page(bk, slide) {
  const fn = SLIDES[slide.type];
  if (!fn) throw new Error('unknown slide type ' + slide.type);
  return `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${fn(bk, slide)}</body></html>`;
}

module.exports = { page, BRANDS, W, H, catalog, byId };
