// معاينة بعرض الهاتف (390px) لعالم «طقوس العناية» v2.
const fs = require('fs');
const path = require('path');
const { INDEX, GROUPS, G } = require('./plan2');
const HERE = __dirname;
const img = (k) => 'out2/' + k + '.jpg';
const API = 'https://deemaalhayat.com/api/v1';
const thumb = (p) => p.images?.[0]?.media?.variants?.small?.formats?.webp || '';
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
async function rows(q, n = 8) { const j = await (await fetch(`${API}/products?${q}&limit=${n}`)).json(); return j.data || []; }
const row = (ps) => `<div class="row">${ps.map((p) => `<div class="pc"><div class="pi" style="background-image:url('${thumb(p)}')">${p.discountPercent ? `<span class="off">-${p.discountPercent}%</span>` : ''}</div><div class="pn">${p.nameAr || p.name}</div><div class="pp">${fmt(p.price)} د.ع ${p.originalPrice > p.price ? `<s>${fmt(p.originalPrice)}</s>` : ''}</div></div>`).join('')}</div>`;
const st = (t, s, ink, more = true) => `<div class="st"><div><b style="color:${ink || '#1b1b1f'}">${t}</b>${s ? `<small>${s}</small>` : ''}</div>${more ? `<a style="color:${ink}">عرض الكل ‹</a>` : ''}</div>`;

(async () => {
  const feed = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'evo', 'feed2.json'), 'utf8')).data;
  const bf = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'evo', 'bf-created.json'), 'utf8'));
  const bfIds = require('../evo/care3-config.json').bfIds;
  const heroU = (b) => { const f = (b.image.variants.medium || b.image.variants.large || {}).formats || {}; return f.webp || f.jpg; };
  const logos = (feed.sections.find((s) => s.type === 'FEATURED_BRANDS')?.brands || []).slice(0, 8);
  let html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=block" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{width:390px;font-family:'IBM Plex Sans Arabic';background:#fff;color:#1b1b1f}
.strip{background:#141216;color:#F3DFA8;font-size:12px;font-weight:600;padding:9px 16px;white-space:nowrap;overflow:hidden}
.hero{margin:12px 16px 0;border-radius:18px;overflow:hidden}.hero img{width:100%;display:block}
.dots{display:flex;justify-content:center;gap:5px;margin:8px 0 2px}.dots i{width:6px;height:6px;border-radius:3px;background:#d4d4d8}.dots i.on{width:18px;background:#1b1b1f}
.st{display:flex;justify-content:space-between;align-items:flex-end;padding:20px 16px 10px}.st b{font-size:18px;display:block}.st small{font-size:12px;color:#6b6b73;display:block}.st a{font-size:12px;color:#6b6b73}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px}.g3 img,.g2 img{width:100%;border-radius:14px;display:block}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 12px}
.sc{display:flex;gap:10px;overflow:hidden;padding:0 12px}.sc img{width:136px;flex:none;border-radius:14px;display:block}
.wide{padding:0 12px}.wide img{width:100%;border-radius:16px;display:block}
.grp{margin-top:20px;padding:4px 0 18px}.grp>*+*{margin-top:10px}
.logos{display:flex;gap:10px;overflow:hidden;padding:0 16px}.logos div{flex:none;width:110px;height:64px;border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.07);display:grid;place-items:center}.logos img{max-width:80px;max-height:40px}
.row{display:flex;gap:10px;overflow:hidden;padding:0 12px}.pc{width:128px;flex:none;background:#fff;border-radius:14px;padding:6px 6px 8px}.pi{position:relative;height:112px;border-radius:10px;background:#fff center/contain no-repeat}
.off{position:absolute;top:4px;right:4px;background:#C0392B;color:#fff;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:999px}
.pn{font-size:11px;line-height:1.35;height:30px;overflow:hidden;margin-top:4px}.pp{font-size:11.5px;font-weight:700;margin-top:3px}.pp s{color:#9b9ba3;font-weight:400;font-size:10px}
.evo img{width:100%;display:block;border-radius:16px}
</style></head><body>
<div class="strip">الجمعة السوداء • خصومات حتى 50% حتى 28 تشرين الثاني • أصلي 100٪ • توصيل لكل العراق</div>
<div class="hero"><img src="${heroU(feed.banners[0])}"></div><div class="dots">${feed.banners.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
${st('تسوّقي حسب الحاجة', 'اختاري ما تبحثين عنه', '', false)}
<div class="g3">${INDEX.map(([k]) => `<img src="${img(k)}">`).join('')}</div>
${st('براندات العناية', '', '')}
<div class="logos">${logos.map((b) => `<div><img src="${b.logo?.variants?.small?.formats?.webp || b.logoUrl || ''}"></div>`).join('')}</div>`;
  for (const g of GROUPS) {
    const c = G[g.key];
    const ps = g.list.bf ? await rows('ids=' + bfIds.slice(0, 8).join(','), 8) : await rows('subcategoryId=' + g.list.subcategoryId, 8);
    html += `<div class="grp" style="background:${c.bg}">${st(g.title, g.sub, c.ink, false)}
      <div class="wide"><img src="${img(g.wide[0])}"></div>
      ${g.sq ? `<div class="g2">${g.sq.map(([k]) => `<img src="${img(k)}">`).join('')}</div>` : ''}
      <div class="sc">${g.sm.map(([k]) => `<img src="${img(k)}">`).join('')}</div>
      ${st(g.list.listTitle, '', c.ink)}${row(ps)}</div>`;
    if (g.key === 'bf') {
      const evo = feed.sections.find((s) => s.title === 'عالم إيفولوديرم');
      const u = (im) => { const f = (im.variants.medium || {}).formats || {}; return f.webp; };
      html += `<div class="grp evo" style="background:#FFF1E2"><div class="wide"><img src="${u(evo.children[0].banners[0].image)}"></div>${st('عالم إيفولوديرم', 'الوكيل الحصري في العراق • صُنع في فرنسا', '#A8400F', false)}
        <div class="sc">${evo.children[1].items.map((it) => `<img src="${u(it.image)}" style="width:180px">`).join('')}</div></div>`;
    }
  }
  html += `<div style="height:20px"></div></body></html>`;
  fs.writeFileSync(path.join(HERE, 'mock2.html'), html);
  console.log('ok');
})();
