// طقوس العناية v2 — مجموعات ملوّنة لكل قسم بتصاميم الاستوديو الباستيل. يعمل داخل حاوية الـ API (/tmp/care4).
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = 'http://127.0.0.1:3000/api/v1';
const DIR = '/tmp/care4';
const W = '2236ecab-86ab-443d-a7db-14971155838e';
const RB = '/data/uploads/care-redesign-v2-rollback-2026-11-05.json';
const TAG = 'CARE4';
const P = JSON.parse(fs.readFileSync(`${DIR}/plan.json`, 'utf8'));

(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => {
    const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    const t = await r.text();
    if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`);
    const j = JSON.parse(t || '{}');
    return j.data !== undefined ? j.data : j;
  };

  const blocks = await prisma.homeBlock.findMany({ where: { worldId: W } });
  const banners = await prisma.banner.findMany({ where: { worldId: W } });
  if (!fs.existsSync(RB)) { fs.writeFileSync(RB, JSON.stringify({ at: new Date().toISOString(), blocks, banners })); console.log('rollback saved', RB); }
  const B = (k) => { const b = blocks.find((x) => x.id.startsWith(k)); if (!b) throw new Error('no block ' + k); return b; };

  // 1) الصور
  const media = {};
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.jpg'))) {
    const k = f.replace('.jpg', ''); const name = `care-v4_${f}`;
    const ex = await prisma.media.findFirst({ where: { originalName: name }, select: { id: true } });
    if (ex) { media[k] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${DIR}/${f}`)], { type: 'image/jpeg' }), name);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[k] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('media', Object.keys(media).length);

  const common = { textEn: '', labelEn: '', subtitleEn: '' };
  const item = ([k, [lt, lv]]) => { if (!media[k]) throw new Error('no media ' + k); return { title: '', titleEn: '', subtitleEn: '', imageId: media[k], linkType: lt, linkValue: lv }; };
  const wall = (extra, items) => ({ ...common, titleEn: '', showTitle: false, showViewAll: false, showShadow: false, overlayStyle: 'none', borderStyle: 'none', aspectRatio: '1:1', tileCornerRadius: 16, items, ...extra });
  const upsert = async (type, title, payload, subtitle) => {
    const ex = blocks.find((b) => b.type === type && b.title === title && String(b.payload?.titleEn || '').startsWith(TAG));
    const full = { ...payload, titleEn: `${TAG} ${payload.titleEn || ''}`.trim() };
    if (ex) { await call('PATCH', `/home-blocks/${ex.id}`, { title, subtitle, payload: full, isActive: true }); return ex.id; }
    return (await call('POST', '/home-blocks', { type, worldId: W, pageKey: 'HOME', title, subtitle, payload: full, position: 99, isActive: true })).id;
  };

  // 2) الفهرس الملوّن (نفس قسم «تسوّقي حسب الحاجة» — تُستبدل صوره)
  const idx = B('73cbc22e');
  await call('PATCH', `/home-blocks/${idx.id}`, { payload: { ...idx.payload, gap: 8, tileCornerRadius: 16, items: P.INDEX.map(item) } });

  // 3) المجموعات
  const groupIds = {};
  for (const g of P.GROUPS) {
    const c = P.G[g.key];
    const children = [
      { type: 'CUSTOM_BANNER', title: '', payload: { ...common, titleEn: '', source: 'inline', imageId: media[g.wide[0]], linkType: g.wide[1][0], linkValue: g.wide[1][1], bannerAspect: 3, showTitle: false, showViewAll: false, sectionLayout: 'full' } },
    ];
    if (g.sq) children.push({ type: 'PHOTO_WALL', title: '', payload: wall({ display: 'grid', sectionLayout: 'grid2', gap: 10 }, g.sq.map(item)) });
    children.push({ type: 'PHOTO_WALL', title: '', payload: wall({ display: 'scroll', tilesPerView: 2.6, gap: 10 }, g.sm.map(item)) });
    const list = g.list.bf
      ? { productIds: P.bfIds, filter: 'promo', showViewAll: false }
      : { subcategoryId: g.list.subcategoryId, filter: 'all', limit: 12, showViewAll: true };
    children.push({ type: 'PRODUCT_LIST', title: g.list.listTitle, payload: { ...common, titleEn: '', sectionLayout: 'carousel', showTitle: true, titleColor: c.ink, ...list } });
    const payload = { ...common, titleEn: g.key, backgroundColor: c.bg, titleColor: c.ink, showTitle: true, pattern: 'none', paddingH: 12, framePaddingH: 12, paddingTop: 20, paddingBottom: 20, shadow: false, children,
      ...(g.until ? { visibleUntil: g.until } : {}) };
    groupIds[g.key] = await upsert('SECTION_GROUP', g.title, payload, g.sub);
  }
  console.log('groups', groupIds);

  // 4) إيقاف ما حلّت محله المجموعات
  const off = ['fb9624c4', '172ddaa6', '52b267e3', 'd5ad12d2', '67ebe29f', 'da34a3f8', '3929c1d6', '5bfd6dd1'];
  for (const k of off) { const b = B(k); if (b.isActive) await call('PATCH', `/home-blocks/${b.id}`, { isActive: false }); }
  for (const b of blocks.filter((b) => b.type === 'SECTION_GROUP' && b.isActive && String(b.payload?.titleEn || '').startsWith('BF2026')))
    await call('PATCH', `/home-blocks/${b.id}`, { isActive: false });

  // 5) الترتيب
  const now = await prisma.homeBlock.findMany({ where: { worldId: W, pageKey: 'HOME', isActive: true }, orderBy: { position: 'asc' }, select: { id: true, type: true } });
  const strips = now.filter((b) => b.type === 'PROMO_STRIP').map((b) => b.id);
  const o = (k) => B(k).id;
  const head = [...strips, idx.id, o('d1539da4'), groupIds.bf, o('f1d237b1'), groupIds.face, groupIds.hair, groupIds.body, groupIds.sun, groupIds.kor, groupIds.derma, o('f7b79d64'), o('934d2533')];
  const order = [...head.filter((id) => now.some((b) => b.id === id)), ...now.map((b) => b.id).filter((id) => !head.includes(id))];
  await call('POST', '/home-blocks/reorder', { ids: order });
  console.log('order', order.length);
  fs.writeFileSync('/data/uploads/care-redesign-v2-created-2026-11-05.json', JSON.stringify({ media, groupIds, order }, null, 1));
  await prisma.$disconnect();
  console.log('done');
  process.exit(0);
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
