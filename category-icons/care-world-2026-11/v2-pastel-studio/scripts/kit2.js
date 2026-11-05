// «طقوس العناية» v2 — استوديو: قوس خلفي فاتح + منصّة بمستويين + أوراق نباتية جريئة + إضاءة ناعمة.
// صور الكتالوج تُدمج بـ multiply على أسطح فاتحة فقط (بلا قص). البنرات العريضة فيها نافذة صورة حملة.
// usage: node kit2.js [key,...]   (يقرأ designs2.json)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const HERE = __dirname;
const OUT = path.join(HERE, 'out2');
const HTML = path.join(HERE, 'html2');
const CAMP = path.join(HERE, '..', 'campaign');
const SHOT = path.join(HERE, '..', 'pw', 'shot.js');
for (const d of [OUT, HTML]) fs.mkdirSync(d, { recursive: true });
const url = (p) => 'file:///' + p.replace(/\\/g, '/');
const { WORD } = require(path.join(HERE, '..', 'evo', 'words.js'));
const CANDS = JSON.parse(fs.readFileSync(path.join(HERE, 'cands.json'), 'utf8'));
const byId = {};
for (const v of Object.values(CANDS)) for (const p of v) byId[p.id] = p;
const prod = (ref) => {
  if (byId[ref]) return byId[ref];
  const [k, i] = ref.split(':');
  const p = CANDS[k]?.[+i];
  if (!p) throw new Error('no product ' + ref);
  return p;
};

// bg خلفية، hi إضاءة، shape الأوراق، plate القوس والمنصّة، side جانب المنصّة، ink النص
const PAL = {
  face: { bg: '#F2DDD3', hi: '#FBF0EA', shape: '#E3B19C', plate: '#FFFBF8', side: '#EFDCD2', ink: '#8E3B27', acc: '#C2674C' },
  hair: { bg: '#E6DCEE', hi: '#F6F1FA', shape: '#C6AEDB', plate: '#FFFDFF', side: '#E5DAEE', ink: '#55306B', acc: '#8C62A8' },
  body: { bg: '#EFE2D1', hi: '#FAF4EC', shape: '#DCC09C', plate: '#FFFDF9', side: '#EBDDCB', ink: '#6E4527', acc: '#A9784E' },
  sun: { bg: '#F6E6BF', hi: '#FDF7E6', shape: '#EDC86F', plate: '#FFFDF5', side: '#F2E3BE', ink: '#8A4F06', acc: '#C98512' },
  kor: { bg: '#D9ECE3', hi: '#F1F9F5', shape: '#A3D1BC', plate: '#FBFEFC', side: '#D7EAE1', ink: '#22604A', acc: '#3E8C6E' },
  derma: { bg: '#DBE7F0', hi: '#F2F7FB', shape: '#A7C2DA', plate: '#FBFDFF', side: '#D8E5EF', ink: '#24496B', acc: '#4677A3' },
  bf: { bg: '#E7E0EA', hi: '#F7F4F8', shape: '#C8B6D1', plate: '#FFFEFF', side: '#E4DCE8', ink: '#1C1820', acc: '#C0392B', hot: '#C0392B' },
};

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=Jost:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&family=Bodoni+Moda:opsz,wght@6..96,500..800&family=Nunito:wght@700;800&family=Inter:wght@400;500;600&display=block" rel="stylesheet">`;
const CSS = (W, H, c) => `*{margin:0;padding:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:${c.bg};font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased}
.a{position:absolute}.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}.mul{mix-blend-mode:multiply}
.grain{inset:0;opacity:.05;mix-blend-mode:multiply;pointer-events:none;z-index:90;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .2  0 0 0 .7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}`;

// ---------- الزخارف ----------
/** مجموعة أوراق نباتية جريئة (3 أوراق بعِرق أفتح). */
function leaves(x, y, s, c, rot = 0, flip = false) {
  const leaf = (r, len, wd) => `<g transform="rotate(${r} 0 0)"><path d="M0 0 C ${len * 0.25} ${-wd}, ${len * 0.75} ${-wd}, ${len} 0 C ${len * 0.75} ${wd}, ${len * 0.25} ${wd}, 0 0 Z" fill="${c.shape}"/><path d="M${len * 0.06} 0 L ${len * 0.9} 0" stroke="${c.hi}" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>`;
  const size = s * 4;
  return `<svg class="a" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg) ${flip ? 'scaleX(-1)' : ''};overflow:visible;z-index:1" width="${size}" height="${size}" viewBox="-40 -380 720 720">${leaf(-58, 520, 120)}${leaf(-18, 600, 140)}${leaf(24, 470, 108)}</svg>`;
}
const swash = (w, color) => `<svg width="${w}" height="${w * 0.09}" viewBox="0 0 100 9" style="display:block;margin-top:14px"><path d="M2 6 C 25 1, 55 1, 98 4" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/></svg>`;

/** استوديو: قوس خلفي + خط قوس رفيع + منصّة بمستويين. يعيد {html, floor, riser} خطوط القاعدة. */
function studio(cx, base, w, h, c, { riser = true } = {}) {
  const pw = w * 0.96, ph = w * 0.075, rw = w * 0.42, rh = w * 0.07;
  const top = base - h;
  const cyl = (x, y, ww, hh, top) => `
    <div class="a" style="left:${x}px;top:${y}px;width:${ww}px;height:${hh}px;background:linear-gradient(90deg, ${c.side}, ${c.plate} 45%, ${c.side});z-index:6"></div>
    <div class="a" style="left:${x}px;top:${y + hh - ww * 0.06}px;width:${ww}px;height:${ww * 0.12}px;border-radius:50%;background:linear-gradient(90deg, ${c.side}, ${c.plate} 45%, ${c.side});z-index:5;box-shadow:0 ${ww * 0.04}px ${ww * 0.06}px -${ww * 0.02}px rgba(70,40,30,.28)"></div>
    <div class="a" style="left:${x}px;top:${y - ww * 0.06}px;width:${ww}px;height:${ww * 0.12}px;border-radius:50%;background:${top};z-index:7"></div>`;
  const floorY = base - ph; // سطح المنصّة السفلى
  const riserY = floorY - rh;
  return {
    top, w, floor: floorY, riser: riser ? riserY : floorY, rx: [cx - rw / 2, cx + rw / 2],
    html: `
    <div class="a" style="left:${cx - w / 2 - 22}px;top:${top - 22}px;width:${w + 44}px;height:${h + 22}px;border:2.5px solid ${c.acc};opacity:.3;border-radius:${(w + 44) / 2}px ${(w + 44) / 2}px 0 0;border-bottom:none;z-index:2;-webkit-mask-image:linear-gradient(180deg,#000 30%,transparent 55%)"></div>
    <div class="a" style="left:${cx - w / 2}px;top:${top}px;width:${w}px;height:${h}px;background:radial-gradient(70% 60% at 50% 38%, #fff, ${c.plate} 60%, ${c.side} 140%);border-radius:${w / 2}px ${w / 2}px 0 0;z-index:3"></div>
    ${cyl(cx - pw / 2, floorY, pw, ph, c.plate)}
    ${riser ? cyl(cx - rw / 2, riserY, rw, rh, '#fff') : ''}`,
  };
}

/** يضع المنتجات: الأوسط على المنصّة العالية، والجانبيّة على السفلى. */
function place(refs, cx, st, hs, maxW, gap) {
  const ps = refs.map(prod);
  const n = ps.length;
  const mid = n === 2 ? 0 : Math.floor(n / 2);
  const room = (i) => ((n === 1 || i === (n === 2 ? 0 : Math.floor(n / 2))) ? st.riser : st.floor) - (st.top + 44);
  const ws = ps.map((p, i) => Math.min(Math.min(hs[i], room(i)) * p.w / p.h, maxW[i] ?? maxW[0]));
  let total0 = ws.reduce((a, b) => a + b, 0) + gap * (n - 1);
  const fit = Math.min(1, (st.w * 0.9) / total0);
  for (let i = 0; i < n; i++) ws[i] *= fit;
  const hh = ps.map((p, i) => ws[i] * p.h / p.w);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (n - 1);
  let x = cx - total / 2;
  return ps.map((p, i) => {
    const onRiser = n === 1 || i === mid;
    const b = (onRiser ? st.riser : st.floor) + (onRiser ? 6 : 8);
    const el = `<div class="a" style="left:${x + ws[i] * 0.1}px;top:${b - 12}px;width:${ws[i] * 0.8}px;height:22px;border-radius:50%;background:radial-gradient(closest-side, rgba(60,35,25,.34), rgba(60,35,25,0));z-index:10"></div>
      <img class="a mul" src="${url(path.join(HERE, 'prod', p.id + '.jpg'))}" style="left:${x}px;top:${b - hh[i]}px;width:${ws[i]}px;height:${hh[i]}px;z-index:11">`;
    x += ws[i] + gap;
    return el;
  }).join('');
}

const brandMark = (d, c, s) => {
  if (!d.brand) return '';
  if (WORD[d.brand]) return WORD[d.brand](s, c.ink);
  return `<span class="lat" style="font-family:Jost;font-weight:500;font-size:${74 * s}px;letter-spacing:.24em;color:${c.ink}">${d.brand}</span>`;
};
const pctBlock = (d, c, size) => `<div style="display:flex;align-items:flex-end;gap:${size * 0.08}px;direction:rtl">
  <span style="white-space:nowrap;font-weight:700;font-size:${size * 0.24}px;line-height:1.1;color:${c.ink};padding-bottom:${size * 0.12}px">${d.pctLabel || 'خصم حتى'}</span>
  <span class="lat" style="font-family:Montserrat;font-weight:800;font-size:${size}px;line-height:.8;letter-spacing:-.04em;color:${c.hot || c.acc}">${d.pct}<span style="font-size:.48em;font-weight:700;vertical-align:top">%</span></span></div>`;
const bgLayer = (c, sx, sy) => `<div class="a" style="inset:0;background:radial-gradient(55% 75% at ${sx}% ${sy}%, ${c.hi} 0%, ${c.bg} 62%), ${c.bg}"></div>`;

const T = {
  /** عريض 2160×720: نافذة صورة حملة يساراً، الاستوديو بالوسط، النص يميناً. */
  wide(d, c) {
    const W = 2160, H = 720;
    const sw = d.studioW || 640, scx = d.photo ? 930 : 640;
    const st = studio(scx, H - 26, sw, 560, c);
    const ph = d.photo ? `<div class="a" style="left:80px;top:70px;width:440px;height:650px;border-radius:220px 220px 0 0;overflow:hidden;z-index:4;box-shadow:0 30px 60px -30px rgba(60,30,20,.4)"><img src="${url(path.join(CAMP, d.photo))}" style="width:100%;height:100%;object-fit:cover;object-position:${d.focus || '50% 30%'}"></div>
      <div class="a" style="left:58px;top:48px;width:484px;height:672px;border:2.5px solid ${c.acc};opacity:.35;border-radius:242px 242px 0 0;border-bottom:none;z-index:3"></div>` : '';
    return { W, H, body: `${bgLayer(c, 40, 40)}
      ${leaves(d.photo ? 470 : 230, 250, 120, c, -20)}
      ${leaves(scx + sw / 2 - 60, 330, 100, c, 15, true)}
      ${ph}${st.html}
      ${place(d.p, scx, st, d.hs || [400, 470, 400], d.maxW || [250, 270, 250], d.gap ?? 22)}
      <div class="a" style="right:120px;top:0;height:${H}px;width:${d.textW || 780}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:20">
        ${d.brand ? `<div style="margin-bottom:22px">${brandMark(d, c, d.brandScale || 0.78)}</div>` : ''}
        ${d.kicker ? `<div class="lat" style="font-family:Jost;font-weight:500;font-size:26px;letter-spacing:.4em;color:${c.acc};margin-bottom:14px">${d.kicker}</div>` : ''}
        ${d.pct ? pctBlock(d, c, 200) : ''}
        <div style="font-weight:700;font-size:${d.titleSize || 90}px;line-height:1.16;color:${c.ink}">${d.title}</div>
        ${swash(300, c.acc)}
        ${d.sub ? `<div style="margin-top:14px;font-weight:500;font-size:${d.subSize || 50}px;line-height:1.4;color:${c.ink};opacity:.82">${d.sub}</div>` : ''}
        <div style="margin-top:30px;display:inline-flex;align-items:center;gap:14px;height:94px;padding:0 50px;border-radius:999px;background:${c.ink};color:#fff;font-weight:700;font-size:42px;box-shadow:0 14px 30px -14px ${c.ink}">${d.cta || 'تسوّقي الآن'} <span style="font-family:Jost;font-weight:400">←</span></div>
      </div><div class="a grain"></div>` };
  },
  /** مربع 1080×1080 */
  square(d, c) {
    const W = 1080, H = 1080;
    const sw = d.studioW || 780;
    const st = studio(W / 2, H - 30, sw, 640, c);
    return { W, H, body: `${bgLayer(c, 50, 70)}
      ${leaves(70, 520, 110, c, -25)}
      ${leaves(720, 500, 95, c, 20, true)}
      ${st.html}
      ${place(d.p, W / 2, st, d.hs || [470, 540, 450], d.maxW || [270, 300, 270], d.gap ?? 22)}
      <div class="a" style="right:70px;left:70px;top:60px;z-index:20;display:flex;justify-content:space-between;align-items:flex-start">
        <div style="display:flex;flex-direction:column;align-items:flex-start">
          ${d.brand ? `<div style="margin-bottom:14px">${brandMark(d, c, d.brandScale || 0.66)}</div>` : ''}
          ${d.pct ? '' : `<div style="font-weight:700;font-size:${d.titleSize || 80}px;line-height:1.16;color:${c.ink}">${d.title}</div>${swash(200, c.acc)}`}
        </div>
        ${d.pct ? pctBlock(d, c, 210) : ''}
      </div><div class="a grain"></div>` };
  },
  /** صغير 720×720 */
  small(d, c) {
    const W = 720, H = 720;
    const sw = d.studioW || 600;
    const st = studio(W / 2, H - 22, sw, 530, c, { riser: d.p.length !== 2 || d.riser !== false });
    return { W, H, body: `${bgLayer(c, 50, 70)}
      ${leaves(40, 360, 80, c, -25)}
      ${leaves(470, 330, 70, c, 20, true)}
      ${st.html}
      ${place(d.p, W / 2, st, d.hs || [360, 380], d.maxW || [230, 230], d.gap ?? 16)}
      <div class="a" style="right:46px;left:46px;top:40px;z-index:20;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          ${d.brand ? `<div style="margin-bottom:6px">${brandMark(d, c, d.brandScale || 0.5)}</div>` : ''}
          ${d.pct ? '' : `<div style="font-weight:700;font-size:${d.titleSize || 68}px;line-height:1.14;color:${c.ink}">${d.title}</div>`}</div>
        ${d.pct ? pctBlock(d, c, 140) : ''}
      </div><div class="a grain"></div>` };
  },
};

function render(d) {
  const c = { ...PAL[d.pal], ...(d.c || {}) };
  const { W, H, body } = T[d.tpl](d, c);
  const html = `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>${CSS(W, H, c)}</style></head><body>${body}</body></html>`;
  const hp = path.join(HTML, d.key + '.html');
  fs.writeFileSync(hp, html);
  execFileSync('node', [SHOT, hp, path.join(OUT, d.key + '.jpg'), String(W), String(H), 'view', '1'], { stdio: 'inherit' });
  console.log('rendered', d.key);
}

if (require.main === module) {
  const designs = JSON.parse(fs.readFileSync(path.join(HERE, process.env.DESIGNS || 'designs2.json'), 'utf8'));
  const only = (process.argv[2] || '').split(',').filter(Boolean);
  for (const d of designs) if (!only.length || only.includes(d.key)) render(d);
}
module.exports = { render };
