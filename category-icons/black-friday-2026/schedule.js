// بعد النشر: إزالة عرض فيتو 19%، بنر فيتو العلوي الجديد، وجدولة انتهاء أقسام الجمعة السوداء.
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = 'http://127.0.0.1:3000/api/v1';
const ENDS = '2026-11-28T20:59:59.000Z';
const TAG = 'BF2026';
const created = JSON.parse(fs.readFileSync('/data/uploads/bf-2026-11-created.json', 'utf8'));
const rollback = JSON.parse(fs.readFileSync('/data/uploads/bf-2026-11-rollback.json', 'utf8'));

(async () => {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${token}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => {
    const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    const t = await r.text();
    if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`);
    const j = JSON.parse(t || '{}');
    return j.data !== undefined ? j.data : j;
  };

  // 1) بنر فيتو العلوي بلا 19%
  const name = 'bf26-hero_phyto-v2.jpg';
  let heroId = (await prisma.media.findFirst({ where: { originalName: name }, select: { id: true } }))?.id;
  if (!heroId) {
    const fd = new FormData();
    fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync('/tmp/bf/hero_phyto.jpg')], { type: 'image/jpeg' }), name);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd });
    const t = await r.text();
    if (!r.ok) throw new Error('upload ' + t.slice(0, 200));
    heroId = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  const phytoHero = await prisma.banner.findFirst({ where: { title: 'فيتو — الجمعة السوداء' } });
  await call('PATCH', `/banners/${phytoHero.id}`, { title: phytoHero.title, imageId: heroId });
  console.log('phyto hero image replaced');

  // 2) مجموعات الجمعة السوداء: إزالة عرض فيتو 19% + الاختفاء بعد 28/11
  const groups = (await prisma.homeBlock.findMany({ where: { type: 'SECTION_GROUP' } })).filter((b) => String(b.payload?.titleEn || '').startsWith(TAG));
  for (const g of groups) {
    const p = JSON.parse(JSON.stringify(g.payload));
    const i = (p.children || []).findIndex((c) => c.type === 'CUSTOM_BANNER' && c.payload?.imageId === created.media.o_phyto_19);
    if (i >= 0) { p.children.splice(i, 2); console.log('removed phyto 19% from', g.id.slice(0, 8), g.worldId ? 'world' : 'offers tab'); }
    p.visibleUntil = ENDS;
    await call('PATCH', `/home-blocks/${g.id}`, { payload: p });
  }
  console.log('groups scheduled', groups.length);

  // 3) شريط العروض: نسخة الجمعة السوداء تنتهي، والنص الأصلي يعود بعدها في المكان نفسه
  for (const old of rollback.blocks.filter((b) => b.type === 'PROMO_STRIP' && /20\s*[%٪]/.test(b.payload?.text || ''))) {
    const cur = await prisma.homeBlock.findUnique({ where: { id: old.id } });
    await call('PATCH', `/home-blocks/${cur.id}`, { payload: { ...cur.payload, visibleUntil: ENDS } });
    const title = old.title;
    let back = await prisma.homeBlock.findFirst({ where: { worldId: old.worldId, type: 'PROMO_STRIP', title, id: { not: old.id } } });
    const payload = { ...old.payload, visibleFrom: ENDS };
    if (back) await call('PATCH', `/home-blocks/${back.id}`, { payload, isActive: true });
    else back = await call('POST', '/home-blocks', { type: 'PROMO_STRIP', title, payload, pageKey: 'HOME', worldId: old.worldId, position: cur.position, isActive: true });
    const blocks = await prisma.homeBlock.findMany({ where: { worldId: old.worldId, pageKey: 'HOME', isActive: true }, orderBy: { position: 'asc' }, select: { id: true } });
    const ids = blocks.map((b) => b.id).filter((id) => id !== back.id);
    ids.splice(ids.indexOf(cur.id) + 1, 0, back.id);
    await call('POST', '/home-blocks/reorder', { ids });
    console.log('strip scheduled', cur.id.slice(0, 8), '→ original returns', back.id.slice(0, 8));
  }

  await prisma.$disconnect();
  console.log('done');
  process.exit(0);
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
