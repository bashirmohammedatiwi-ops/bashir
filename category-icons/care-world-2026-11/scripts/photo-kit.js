// تصاميم «طقوس العناية» على صور الحملات الرسمية: صورة كاملة + تدرّج ناعم + طباعة تحريرية قليلة.
// usage: node photo-kit.js [key,...]   (يقرأ photo-designs.json)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const CAMP = path.join(HERE, '..', 'campaign');
const OUT = path.join(HERE, 'out_photo');
const HTML = path.join(HERE, 'html_photo');
const SHOT = path.join(HERE, '..', 'pw', 'shot.js');
for (const d of [OUT, HTML]) fs.mkdirSync(d, { recursive: true });
const url = (p) => 'file:///' + p.replace(/\\/g, '/');
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const { WORD } = require('./words');

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=Jost:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Bodoni+Moda:opsz,wght@6..96,500..800&family=Nunito:wght@700;800;900&family=Inter:wght@400;500;600&display=block" rel="stylesheet">`;
const CSS = (W, H) => `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;font-family:'IBM Plex Sans Arabic';direction:rtl;-webkit-font-smoothing:antialiased}
.a{position:absolute}.lat{direction:ltr;unicode-bidi:isolate;white-space:nowrap}`;

const tricolor = `<span style="direction:ltr;display:inline-flex;height:6px;width:66px;border-radius:3px;overflow:hidden"><i style="flex:1;background:#1f3f8f"></i><i style="flex:1;background:#f4f1ea"></i><i style="flex:1;background:#d7263d"></i></span>`;

/** الصورة كخلفية مع نقطة تركيز وتكبير اختياري. */
function photo(d) {
  const f = path.join(CAMP, d.photo);
  if (!fs.existsSync(f)) throw new Error('missing photo ' + d.photo);
  const pos = d.focus || '50% 50%';
  return `<div class="a" style="inset:0;background:url('${url(f)}') ${pos}/cover no-repeat;${d.zoom ? `transform:scale(${d.zoom});transform-origin:${pos}` : ''}"></div>`;
}

/** تدرّج ناعم على جهة النص فقط. side: right|left|bottom ؛ tone: light|dark */
function scrim(side, tone, strength = 1, color) {
  const c = color || (tone === 'dark' ? '#0d0b0a' : '#fbf8f3');
  const a1 = (tone === 'dark' ? 0.82 : 0.9) * strength, a2 = (tone === 'dark' ? 0.45 : 0.55) * strength;
  if (side === 'bottom') return `<div class="a" style="inset:0;background:linear-gradient(0deg, ${rgba(c, a1)} 0%, ${rgba(c, a2)} 30%, ${rgba(c, 0)} 58%)"></div>`;
  const dir = side === 'right' ? '270deg' : '90deg';
  return `<div class="a" style="inset:0;background:linear-gradient(${dir}, ${rgba(c, a1)} 0%, ${rgba(c, a2)} 34%, ${rgba(c, 0)} 60%)"></div>`;
}

const T = {
  /** بنر 2150×1000 — النص على الجهة الفارغة من الصورة. */
  banner(d) {
    const W = 2150, H = 1000;
    const tone = d.tone || 'light', ink = d.ink || (tone === 'dark' ? '#ffffff' : '#1f1812');
    const side = d.side || 'right';
    const pos = side === 'right' ? 'right:120px' : 'left:120px';
    const word = d.word ? WORD[d.word](d.wordScale || 0.95, ink) : '';
    const btnBg = d.btn || (tone === 'dark' ? '#ffffff' : ink), btnInk = tone === 'dark' ? '#1a1410' : '#ffffff';
    const text = `<div class="a" style="${pos};top:0;height:${H}px;width:${d.textW || 900}px;z-index:10;display:flex;flex-direction:column;justify-content:center;align-items:flex-start">
      ${d.kicker ? `<div style="display:flex;align-items:center;gap:16px;margin-bottom:30px">${d.tricolor ? tricolor : ''}<span class="lat" style="font-family:Jost;font-weight:500;font-size:34px;letter-spacing:.36em;color:${rgba(ink, 0.85)}">${d.kicker}</span></div>` : ''}
      ${word ? `<div style="margin-bottom:30px">${word}</div>` : ''}
      <div style="font-weight:700;font-size:${d.titleSize || 98}px;line-height:1.16;color:${ink}">${d.title}</div>
      ${d.sub ? `<div style="margin-top:18px;font-weight:500;font-size:${d.subSize || 54}px;line-height:1.4;color:${rgba(ink, 0.88)}">${d.sub}</div>` : ''}
      ${d.chips ? `<div style="margin-top:28px;display:flex;gap:14px;flex-wrap:wrap">${d.chips.map((c) => `<span style="padding:12px 30px;border-radius:999px;border:2px solid ${rgba(ink, 0.45)};font-weight:600;font-size:40px;color:${ink};background:${tone === 'dark' ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.5)'}">${c}</span>`).join('')}</div>` : ''}
      <div style="margin-top:38px;display:inline-flex;align-items:center;gap:18px;height:118px;padding:0 58px;border-radius:999px;background:${btnBg};color:${btnInk};font-weight:700;font-size:50px">${d.cta || 'تسوّقي الآن'} <span style="font-family:Jost;font-weight:300">←</span></div>
    </div>`;
    const seal = d.seal ? `<div class="a" style="${side === 'right' ? 'left' : 'right'}:90px;top:70px;z-index:12;width:290px;height:290px;border-radius:50%;background:${rgba(d.sealColor || '#6A4322', 0.94)};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 20px 40px -16px rgba(0,0,0,.5);transform:rotate(-8deg)">
        <span style="font-weight:700;font-size:50px;line-height:1.15">${d.seal[0]}</span><span style="font-weight:700;font-size:44px;margin-top:2px">${d.seal[1]}</span><span class="lat" style="font-family:Jost;font-size:22px;letter-spacing:.3em;margin-top:10px;opacity:.85">${d.seal[2] || ''}</span></div>` : '';
    return { W, H, body: `${photo(d)}${scrim(side, tone, d.scrim ?? 1, d.scrimColor)}${seal}${text}` };
  },
  /** بطاقة 1080×1350 — الشعار والسطر أسفل الصورة على تدرّج. */
  card(d) {
    const W = 1080, H = 1350;
    const tone = d.tone || 'dark', ink = d.ink || (tone === 'dark' ? '#ffffff' : '#1f1812');
    const word = d.word ? WORD[d.word](d.wordScale || 0.8, ink) : `<div style="font-weight:700;font-size:${d.headingSize || 96}px;line-height:1.15;color:${ink}">${d.heading}</div>`;
    const top = d.textPos === 'top';
    const sc = top ? scrim('bottom', tone, d.scrim ?? 1, d.scrimColor).replace('0deg', '180deg') : scrim('bottom', tone, d.scrim ?? 1, d.scrimColor);
    return { W, H, body: `${photo(d)}${sc}
      ${d.tag ? `<div class="a" style="${top ? 'bottom' : 'top'}:56px;right:56px;z-index:10;padding:12px 26px;border-radius:999px;background:${rgba('#ffffff', 0.92)};color:#1f1812;font-weight:700;font-size:30px">${d.tag}</div>` : ''}
      <div class="a" style="${top ? 'top:90px' : 'bottom:84px'};left:60px;right:60px;z-index:10;display:flex;flex-direction:column;align-items:center;text-align:center">
        ${d.kicker ? `<div class="lat" style="font-family:Jost;font-weight:500;font-size:34px;letter-spacing:.36em;color:${rgba(ink, 0.85)};margin-bottom:18px">${d.kicker}</div>` : ''}
        ${word}
        <div style="margin-top:20px;font-weight:600;font-size:62px;line-height:1.3;color:${ink}">${d.line}</div>
        <div style="margin-top:26px;font-weight:700;font-size:44px;color:${rgba(ink, 0.9)}">${d.cta || 'تسوّقي الآن'} ←</div>
      </div>` };
  },
  /** مربع 1080×1080 لـ«تسوّقي حسب الحاجة». */
  tile(d) {
    const W = 1080, H = 1080;
    const ink = '#ffffff';
    return { W, H, body: `${photo(d)}${scrim('bottom', 'dark', d.scrim ?? 1)}
      <div class="a" style="bottom:70px;left:40px;right:40px;z-index:10;text-align:center">
        <div style="font-weight:700;font-size:${d.headingSize || 150}px;line-height:1.1;color:${ink};text-shadow:0 4px 20px rgba(0,0,0,.35)">${d.heading}</div>
        </div>` };
  },
};

function render(d) {
  const { W, H, body } = T[d.tpl](d);
  const html = `<!doctype html><html lang="ar"><head><meta charset="utf-8">${FONTS}<style>${CSS(W, H)}</style></head><body>${body}</body></html>`;
  const hp = path.join(HTML, d.key + '.html');
  fs.writeFileSync(hp, html);
  execFileSync('node', [SHOT, hp, path.join(OUT, d.key + '.jpg'), String(W), String(H), 'view', '1'], { stdio: 'inherit' });
  console.log('rendered', d.key);
}

if (require.main === module) {
  const designs = JSON.parse(fs.readFileSync(path.join(HERE, 'photo-designs.json'), 'utf8'));
  const only = (process.argv[2] || '').split(',').filter(Boolean);
  for (const d of designs) if (!only.length || only.includes(d.key)) render(d);
}
module.exports = { render };
