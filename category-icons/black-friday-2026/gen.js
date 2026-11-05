// Black Friday 2026 — «Noir Studio»: منتجات مقصوصة على أرضية سوداء لامعة بانعكاس، ضوء البراند، طباعة تحريرية.
// usage: node gen2.js [key,...]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const ALPHA = path.join(HERE, 'alpha');
const HTML = path.join(HERE, 'html2');
const OUT = path.join(HERE, 'out2');
const SHOT = path.join(HERE, '..', 'pw', 'shot.js');
for (const d of [HTML, OUT]) fs.mkdirSync(d, { recursive: true });
const picked = JSON.parse(fs.readFileSync(path.join(HERE, 'picked.json'), 'utf8'));
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/');
const W = 2150, H = 1000, FLOOR = 812;

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ---------- هويات البراندات ----------
const BRANDS = {
  lierac: {
    word: `<div class="lat wm" style="font-family:Jost;font-weight:300;font-size:104px;letter-spacing:.36em;margin-left:-.36em">LIERAC</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:24px;letter-spacing:1.1em;opacity:.6;margin-top:14px">PARIS</div>`,
    a1: '#F7E7C1', a2: '#C9A15A', light: '#E8C886',
  },
  phyto: {
    word: `<div class="lat wm" style="font-family:Montserrat;font-weight:600;font-size:104px;letter-spacing:.34em;margin-left:-.34em">PHYTO</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:24px;letter-spacing:1.1em;opacity:.6;margin-top:14px">PARIS</div>`,
    a1: '#E6F0D6', a2: '#9DBF73', light: '#B9D58E',
  },
  bioderma: {
    word: `<div class="lat wm" style="font-family:Montserrat;font-weight:800;font-size:96px;letter-spacing:.06em">BIODERMA</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:22px;letter-spacing:.5em;opacity:.6;margin-top:14px">LABORATOIRE DERMATOLOGIQUE</div>`,
    a1: '#DDF2FF', a2: '#4DB2EC', light: '#7CC8F2',
  },
  'brand-1784986563282': {
    word: `<div class="lat wm" style="font-family:'Bodoni Moda';font-weight:600;font-size:104px;letter-spacing:.12em">DEBORAH</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:24px;letter-spacing:1.1em;opacity:.6;margin-top:14px">MILANO</div>`,
    a1: '#FBE2D8', a2: '#D9917F', light: '#F0B3A2',
  },
  revox: {
    word: `<div class="lat wm" style="font-family:Montserrat;font-weight:500;font-size:104px;letter-spacing:.28em;margin-left:-.28em">REVOX</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:22px;letter-spacing:.8em;opacity:.6;margin-top:14px">JUST · SKINCARE</div>`,
    a1: '#F3F4F6', a2: '#A9B1BA', light: '#D7DCE2',
  },
  beesline: {
    word: `<div class="lat wm" style="font-family:Montserrat;font-weight:700;font-size:104px;letter-spacing:.01em">Beesline<span style="font-size:.4em;vertical-align:super;font-weight:500">®</span></div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:22px;letter-spacing:.7em;opacity:.6;margin-top:14px">NATURAL · DERMATOLOGICAL</div>`,
    a1: '#FFE9A8', a2: '#EBA91A', light: '#F7C84A',
  },
  dermolab: {
    word: `<div class="lat wm" style="font-family:Montserrat;font-weight:800;font-size:98px;letter-spacing:.06em">DERMOLAB</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:22px;letter-spacing:.6em;opacity:.6;margin-top:14px">DEBORAH GROUP · MILANO</div>`,
    a1: '#DDE9FF', a2: '#5A93E0', light: '#86B0EE',
  },
  rybella: {
    word: `<div class="lat wm" style="font-family:Montserrat;font-weight:800;font-size:104px;letter-spacing:.06em;display:inline-block;transform:scaleY(1.12);transform-origin:right center">RYBELLA</div>
           <div class="lat wm" style="font-family:Jost;font-weight:400;font-size:22px;letter-spacing:.8em;opacity:.6;margin-top:20px">ITALIAN BEAUTY</div>`,
    a1: '#FFD5EA', a2: '#F0398F', light: '#FF7DB8',
  },
};

const DEB = 'brand-1784986563282';
const DESIGNS = [
  // LIERAC
  { key: 'hero_lierac', brand: 'lierac', kind: 'hero', pct: 50, sub: 'عروض 25% و50% على بريميوم وسونيسيم', pick: ['lierac_25:0', 'lierac_25:2', 'lierac_50:1', 'lierac_25:1', 'lierac_25:4'] },
  { key: 'o_lierac_50', brand: 'lierac', kind: 'offer', pct: 50, sub: 'على واقيات سونيسيم ولِفت إنتغرال', pick: ['lierac_50:1', 'lierac_50:0', 'lierac_50:3', 'lierac_50:2', 'lierac_50:4'] },
  { key: 'o_lierac_25', brand: 'lierac', kind: 'offer', pct: 25, sub: 'على مجموعة بريميوم وهيدراجينست', pick: ['lierac_25:0', 'lierac_25:1', 'lierac_25:2', 'lierac_25:4', 'lierac_25:3'] },
  // PHYTO
  { key: 'hero_phyto', brand: 'phyto', kind: 'hero', pct: 50, sub: 'عروض 25% و50% على عناية الشعر', pick: ['phyto_25:0', 'phyto_25:2', 'phyto_50:1', 'phyto_25:1', 'phyto_25:3'] },
  { key: 'o_phyto_50', brand: 'phyto', kind: 'offer', pct: 50, sub: 'على أمبولات فيتوسيان ومعزز اللمعان', pick: ['phyto_50:0', 'phyto_50:1'], h: 560 },
  { key: 'o_phyto_25', brand: 'phyto', kind: 'offer', pct: 25, sub: 'على شامبوهات وعلاجات فيتو للشعر', pick: ['phyto_25:0', 'phyto_25:1', 'phyto_25:2', 'phyto_25:3'] },
  { key: 'o_phyto_19', brand: 'phyto', kind: 'offer', pct: 19, sub: 'على صبغات فيتوكولور الخالية من الأمونيا', pick: ['phyto_19:2', 'phyto_19:0', 'phyto_19:3'] },
  // BIODERMA
  { key: 'hero_bioderma', brand: 'bioderma', kind: 'hero', pct: 50, sub: 'عروض 10% و15% و50% على بيوديرما', pick: ['bioderma_50:0', 'bioderma_10:1', 'bioderma_15:1', 'bioderma_10:2', 'bioderma_50:3'] },
  { key: 'o_bioderma_50', brand: 'bioderma', kind: 'offer', pct: 50, sub: 'على واقيات فوتوديرم وسيبيوم', pick: ['bioderma_50:0', 'bioderma_50:1', 'bioderma_50:3', 'bioderma_50:2'] },
  { key: 'o_bioderma_15', brand: 'bioderma', kind: 'offer', pct: 15, sub: 'على بيغمنتبيو وأتوديرم', pick: ['bioderma_15:1', 'bioderma_15:0', 'bioderma_15:3', 'bioderma_15:2'] },
  { key: 'o_bioderma_10', brand: 'bioderma', kind: 'offer', pct: 10, sub: 'على سنسيبيو وغسولات بيوديرما', pick: ['bioderma_10:1', 'bioderma_10:0', 'bioderma_10:2', 'bioderma_10:3', 'bioderma_10:4'] },
  // DEBORAH
  { key: 'hero_deborah', brand: DEB, kind: 'hero', pct: 50, sub: 'عروض 30% و50% على مكياج ديبورا ميلانو', pick: [`${DEB}_30:1`, `${DEB}_30:5`, `${DEB}_50:1`, `${DEB}_30:2`, `${DEB}_50:2`] },
  { key: 'o_deborah_50', brand: DEB, kind: 'offer', pct: 50, sub: 'على أحمر الشفاه والغلوس والماسكارا', pick: [`${DEB}_50:0`, `${DEB}_50:1`, `${DEB}_50:2`, `${DEB}_50:3`, `${DEB}_50:4`] },
  { key: 'o_deborah_30', brand: DEB, kind: 'offer', pct: 30, sub: 'على الباليتات والفاونديشن والماسكارا', pick: [`${DEB}_30:1`, `${DEB}_30:0`, `${DEB}_30:3`, `${DEB}_30:4`, `${DEB}_30:2`] },
  // REVOX · DERMOLAB · RYBELLA (عرض واحد لكل منها)
  { key: 'o_revox_40', brand: 'revox', kind: 'offer', pct: 40, sub: 'على سيرومات JUST وعناية زيتكير', pick: ['revox_40:0', 'revox_40:1', 'revox_40:3', 'revox_40:2', 'revox_40:4'] },
  { key: 'o_dermolab_40', brand: 'dermolab', kind: 'offer', pct: 40, sub: 'على كريمات وسيرومات ديرمولاب', pick: ['dermolab_40:0', 'dermolab_40:1', 'dermolab_40:4', 'dermolab_40:5'] },
  { key: 'o_rybella_40', brand: 'rybella', kind: 'offer', pct: 40, sub: 'على مكياج ريبيلا الإيطالي', pick: ['rybella_40:1', 'rybella_40:0', 'rybella_40:3', 'rybella_40:8', 'rybella_40:4'] },
  // BEESLINE
  { key: 'hero_beesline', brand: 'beesline', kind: 'hero', pct: 50, sub: 'عروض 30% و50% على العناية اليومية', pick: ['beesline_50:0', 'beesline_50:1', 'beesline_30:0', 'beesline_50:2', 'beesline_30:2'] },
  { key: 'o_beesline_50', brand: 'beesline', kind: 'offer', pct: 50, sub: 'على سيرومات بيزلين للوجه', pick: ['beesline_50:1', 'beesline_50:0', 'beesline_50:2'] },
  { key: 'o_beesline_30', brand: 'beesline', kind: 'offer', pct: 30, sub: 'على مزيلات العرق والعناية اليومية', pick: ['beesline_30:3', 'beesline_30:0', 'beesline_30:1', 'beesline_30:2', 'beesline_30:4'] },
];

// ---------- المنتجات ----------
const alphaMeta = () => JSON.parse(fs.readFileSync(path.join(ALPHA, 'meta.json'), 'utf8'));
function product(ref) {
  const [k, i] = ref.split(':');
  const p = picked[k]?.[+i];
  if (!p) throw new Error('no pick ' + ref);
  const m = alphaMeta()[p.id];
  if (!m) throw new Error('no cutout ' + ref);
  return { src: fileUrl(path.join(ALPHA, p.id + '.png')), ratio: m.ratio };
}

/** تكوين: الأول في الوسط والأكبر، ثم يمين/يسار بالتناوب، مع تراكب وعمق. */
function composition(refs, box, light) {
  const items = refs.map((r, rank) => ({ ...product(r), rank }));
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
    const base = box.h * (dist === 0 ? 1 : dist === 1 ? 0.8 : 0.64);
    const h = Math.min(base, base * Math.pow(0.6 / Math.max(it.ratio, 0.18), 0.5));
    return { ...it, dist, h, w: h * it.ratio };
  });
  const overlap = 0.15;
  let total = sized.reduce((s, it) => s + it.w, 0) - sized.slice(1).reduce((s, it) => s + it.w * overlap, 0);
  const k = Math.min(1, box.w / total);
  sized.forEach((it) => { it.h *= k; it.w *= k; });
  total *= k;
  let x = box.x + (box.w - total) / 2;
  let html = '';
  sized.forEach((it, idx) => {
    if (idx > 0) x -= it.w * overlap;
    const left = x;
    x += it.w;
    const z = 20 - it.dist * 2;
    const dim = it.dist === 0 ? 1 : it.dist === 1 ? 0.9 : 0.8;
    const top = FLOOR - it.h;
    // انعكاس على الأرضية اللامعة
    html += `<img class="a" src="${it.src}" style="left:${left}px;top:${FLOOR}px;width:${it.w}px;height:${it.h}px;transform:scaleY(-1);transform-origin:center;opacity:.22;z-index:${z - 10};filter:brightness(${dim * 0.8}) blur(1.2px);
      -webkit-mask-image:linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 24%);mask-image:linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 24%)">`;
    // ظل تلامس
    html += `<div class="a" style="left:${left + it.w * 0.06}px;top:${FLOOR - 10}px;width:${it.w * 0.88}px;height:20px;border-radius:50%;background:radial-gradient(closest-side, rgba(0,0,0,.85), rgba(0,0,0,0));z-index:${z - 1}"></div>`;
    // المنتج: إضاءة حافة بلون البراند + عمق
    html += `<img class="a" src="${it.src}" style="left:${left}px;top:${top}px;width:${it.w}px;height:${it.h}px;z-index:${z};
      filter:brightness(${dim}) drop-shadow(0 0 34px ${rgba(light, it.dist === 0 ? 0.32 : 0.18)}) drop-shadow(-18px 24px 30px rgba(0,0,0,.55))">`;
  });
  return html;
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,500..900&family=Montserrat:wght@300;400;500;600;700;800&family=Jost:wght@300;400;500&display=block" rel="stylesheet">`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:#050506;font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased;color:#fff}
.a{position:absolute}
.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.wm{line-height:1;color:#fff}
.grain{inset:0;opacity:.09;mix-blend-mode:overlay;z-index:90;pointer-events:none;
 background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
`;

function design(d) {
  const b = BRANDS[d.brand];
  const cx = 600; // مركز مشهد المنتجات
  const scene = `
    <div class="a" style="inset:0;background:radial-gradient(70% 120% at 30% 40%, #121014 0%, #060607 60%, #030304 100%)"></div>
    <!-- شعاع ضوء من الأعلى -->
    <div class="a" style="left:${cx - 520}px;top:-120px;width:1040px;height:${FLOOR + 140}px;z-index:2;filter:blur(38px);opacity:.75;
      clip-path:polygon(38% 0, 62% 0, 100% 100%, 0 100%);background:linear-gradient(180deg, ${rgba(b.light, 0.34)} 0%, ${rgba(b.light, 0.1)} 55%, ${rgba(b.light, 0)} 100%)"></div>
    <!-- هالة خلف المنتجات -->
    <div class="a" style="left:${cx - 560}px;top:${FLOOR - 640}px;width:1120px;height:760px;z-index:3;background:radial-gradient(closest-side, ${rgba(b.light, 0.3)}, ${rgba(b.light, 0.08)} 55%, rgba(0,0,0,0))"></div>
    <!-- الأرضية اللامعة -->
    <div class="a" style="left:0;right:0;top:${FLOOR}px;bottom:0;z-index:4;background:linear-gradient(180deg, ${rgba(b.light, 0.1)} 0%, rgba(10,9,11,.92) 22%, #040405 100%)"></div>
    <div class="a" style="left:0;right:0;top:${FLOOR}px;height:2px;z-index:5;background:linear-gradient(90deg, rgba(255,255,255,0) 0%, ${rgba(b.a1, 0.4)} 28%, ${rgba(b.a1, 0.4)} 34%, rgba(255,255,255,0) 62%)"></div>
    <div class="a" style="left:${cx - 520}px;top:${FLOOR - 10}px;width:1040px;height:140px;z-index:5;background:radial-gradient(closest-side, ${rgba(b.light, 0.18)}, rgba(0,0,0,0))"></div>
    <!-- تظليل الحواف -->
    <div class="a" style="inset:0;z-index:60;pointer-events:none;background:radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)"></div>`;
  const prods = composition(d.pick, { x: cx - 500, w: 1000, h: d.h ?? 600 }, b.light);

  const metal = `linear-gradient(176deg, #ffffff 0%, ${b.a1} 38%, ${b.a2} 78%, ${b.a1} 100%)`;
  const pctBlock = `
    <div style="display:flex;align-items:flex-start;gap:26px;margin-top:30px">
      <div class="lat" style="font-family:'Bodoni Moda';font-weight:700;font-size:330px;line-height:.78;letter-spacing:-.02em;background:${metal};-webkit-background-clip:text;color:transparent;padding:6px 0 16px;
        -webkit-text-stroke:5px ${rgba(b.a1, 0.95)};paint-order:stroke fill">
        ${d.pct}<span style="font-size:.46em;vertical-align:top;position:relative;top:.16em;margin-left:.04em">%</span></div>
      <div style="display:flex;flex-direction:column;align-items:flex-start;padding-top:44px;gap:10px">
        <span style="font-weight:600;font-size:66px;line-height:1;color:#fff">${d.kind === 'hero' ? 'حتى' : 'خصم'}</span>
        <span style="width:84px;height:3px;background:${b.a2}"></span>
      </div>
    </div>`;

  const text = `
    <div class="a" style="right:120px;top:0;height:${H}px;width:960px;z-index:70;display:flex;flex-direction:column;justify-content:center;align-items:flex-start">
      <div style="display:flex;align-items:center;gap:22px">
        <span class="lat" style="font-family:Montserrat;font-weight:600;font-size:28px;letter-spacing:.55em;color:${b.a1}">BLACK FRIDAY</span>
        <span style="width:70px;height:1px;background:${rgba(b.a1, 0.6)}"></span>
        <span style="font-weight:500;font-size:34px;color:rgba(255,255,255,.75)">الجمعة السوداء</span>
      </div>
      <div style="margin-top:46px;text-align:right">${b.word}</div>
      ${pctBlock}
      <div style="margin-top:22px;font-weight:400;font-size:52px;line-height:1.35;color:rgba(255,255,255,.8);max-width:960px">${d.sub}</div>
      <div style="margin-top:48px;display:flex;align-items:center;gap:34px">
        <span style="display:inline-flex;align-items:center;gap:22px;height:96px;padding:0 50px;border-radius:999px;border:2px solid ${b.a2};background:${rgba(b.a2, 0.12)};font-weight:600;font-size:44px;color:#fff;white-space:nowrap">
          تسوّقي العرض <span style="font-family:Jost;font-weight:300;font-size:1.05em">←</span></span>
        <span style="font-weight:400;font-size:36px;color:rgba(255,255,255,.55);white-space:nowrap">حتى 28 تشرين الثاني</span>
      </div>
    </div>`;

  return `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${scene}<div class="a" style="inset:0;z-index:10">${prods}</div>${text}<div class="a grain"></div></body></html>`;
}

const only = (process.argv[2] || '').split(',').filter(Boolean);
for (const d of DESIGNS) {
  if (only.length && !only.includes(d.key)) continue;
  const h = path.join(HTML, d.key + '.html');
  fs.writeFileSync(h, design(d));
  execFileSync('node', [SHOT, h, path.join(OUT, d.key + '.jpg'), String(W), String(H), 'view', '1'], { stdio: 'inherit' });
  console.log('rendered', d.key);
}
module.exports = { BRANDS, DESIGNS };
