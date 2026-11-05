// معاينة بعرض الهاتف (390px) لعالم «طقوس العناية» بالترتيب الجديد.
const fs = require('fs');
const path = require('path');
const P = require('./plan');
const HERE = __dirname;
const OUT = path.join(HERE, 'out_photo');
const img = (k) => 'out_photo/' + k + '.jpg';

async function products(ids) {
  const r = await fetch(`https://deemaalhayat.com/api/v1/products?ids=${ids.join(',')}&limit=${ids.length}`);
  const j = await r.json();
  const list = j.data?.items || j.data || j.items || [];
  const by = Object.fromEntries(list.map((p) => [p.id, p]));
  return ids.map((id) => by[id]).filter(Boolean);
}
const thumb = (p) => p.images?.[0]?.media?.variants?.small?.formats?.webp || '';
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

const title = (t, sub, more = true) => `<div class="st"><div><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</div>${more ? '<a>عرض الكل ‹</a>' : ''}</div>`;
const row = (ps) => `<div class="row">${ps.map((p) => `<div class="pc"><div class="pi" style="background-image:url('${thumb(p)}')">${p.discountPercent ? `<span class="off">-${p.discountPercent}%</span>` : ''}</div><div class="pn">${p.nameAr || p.name}</div><div class="pp">${fmt(p.price)} د.ع ${p.originalPrice > p.price ? `<s>${fmt(p.originalPrice)}</s>` : ''}</div></div>`).join('')}</div>`;

(async () => {
  const feed = JSON.parse(fs.readFileSync(path.join(HERE, 'feed.json'), 'utf8')).data;
  const evo = await products(P.evoProducts());
  const bf = await products(P.bfTop());
  const bfGroups = feed.sections.filter((s) => s.type === 'SECTION_GROUP');
  const bannerUrl = (b) => { const v = b?.image?.variants || {}; const f = (v.medium || v.large || {}).formats || {}; return f.webp || f.jpg || ''; };
  const heroes = [img('h_evo'), ...feed.banners.filter((b) => b.endsAt).map(bannerUrl)];

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=block" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{width:390px;font-family:'IBM Plex Sans Arabic';background:#fff;color:#1b1b1f}
.strip{background:#141216;color:#F3DFA8;font-size:12px;font-weight:600;padding:9px 16px;white-space:nowrap;overflow:hidden}
.hero{margin:12px 16px 0;border-radius:18px;overflow:hidden;aspect-ratio:2.15}.hero img{width:100%;display:block}
.dots{display:flex;justify-content:center;gap:5px;margin:8px 0 4px}.dots i{width:6px;height:6px;border-radius:3px;background:#d4d4d8}.dots i.on{width:18px;background:#1b1b1f}
.st{display:flex;justify-content:space-between;align-items:flex-end;padding:22px 16px 10px}.st b{font-size:17px;display:block}.st small{font-size:12px;color:#6b6b73}.st a{font-size:12px;color:#6b6b73}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px}.grid3 img{width:100%;border-radius:14px;display:block}
.scroll{display:flex;gap:10px;overflow:hidden;padding:0 16px}.scroll img{width:214px;flex:none;border-radius:16px;display:block}
.row{display:flex;gap:10px;overflow:hidden;padding:0 16px}.pc{width:132px;flex:none}.pi{position:relative;height:132px;border-radius:14px;background:#f4f4f5 center/contain no-repeat}
.off{position:absolute;top:6px;right:6px;background:#141216;color:#F3DFA8;font-size:11px;font-weight:700;padding:2px 7px;border-radius:999px}
.pn{font-size:11.5px;line-height:1.35;height:31px;overflow:hidden;margin-top:6px}.pp{font-size:12px;font-weight:700;margin-top:3px}.pp s{color:#9b9ba3;font-weight:400;font-size:10.5px}
.room{margin:20px 12px 0;padding:14px 0 16px;border-radius:24px}.room .ban{margin:0 12px;border-radius:16px;overflow:hidden}.room .ban img{width:100%;display:block}
.room .st{padding-top:14px}.bfb{margin:0 12px;border-radius:16px;overflow:hidden}.bfb img{width:100%;display:block}
.label{margin:26px 16px 0;padding:6px 10px;border:1px dashed #c4c4cc;border-radius:10px;font-size:11px;color:#6b6b73;text-align:center}
</style></head><body>
<div class="strip">الجمعة السوداء • خصومات حتى 50% حتى 28 تشرين الثاني • أصلي 100٪ • توصيل لكل العراق</div>
<div class="hero"><img src="${heroes[0]}"></div>
<div class="dots">${heroes.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
${title('تسوّقي حسب الحاجة', 'اختاري ما تبحثين عنه', false)}
<div class="grid3">${P.TILES.map(([k]) => `<img src="${img(k)}">`).join('')}</div>
<div class="room" style="background:#FFF1E2">
  <div class="ban"><img src="${img('r_evo')}"></div>
  ${title('عالم إيفولوديرم', 'الوكيل الحصري في العراق • صُنع في فرنسا', false)}
  <div class="scroll">${P.EVO_CARDS.map(([k]) => `<img src="${img(k)}">`).join('')}</div>
  ${title('الأكثر طلباً من إيفولوديرم', '')}
  ${row(evo)}
</div>
${title('أقوى عروض الجمعة السوداء', 'حتى 50% • في المحل وعلى التطبيق')}
${row(bf)}
${title('أهم براندات العناية', 'اضغطي على البراند لتشوفي كل منتجاته', false)}
<div class="scroll">${P.BRAND_CARDS.map(([k]) => `<img src="${img(k)}">`).join('')}</div>
<div class="label">↓ حسب احتياج بشرتك (كما هو)</div>
${bfGroups.slice(0, 2).map((g) => `<div class="room" style="background:${g.backgroundColor}"><div class="bfb"><img src="${bannerUrl(g.children[0].banners[0])}"></div><div class="label" style="margin-top:12px">منتجات العرض…</div></div>`).join('')}
<div class="label">↓ باقي مجموعات الجمعة السوداء (بيزلين، فيتو، ريفوكس، ديرمولاب) — تختفي وحدها بعد 28/11<br>↓ صفوف: سيرافي، لاروش بوزيه، لوريال بروفيشنال، أنوا، للجسم • شعارات البراندات</div>
<div style="height:20px"></div>
</body></html>`;
  fs.writeFileSync(path.join(HERE, 'mock.html'), html);
  console.log('mock ok', { evo: evo.length, bf: bf.length, heroes: heroes.length });
})();
