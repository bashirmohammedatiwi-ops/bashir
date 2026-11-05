// بنر «كريجي — خصم 50%» أول بنر في عالم الجمال. يعمل داخل حاوية الـ API (/tmp/h_grigi50.jpg).
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = 'http://127.0.0.1:3000/api/v1';
const W = '0c6628d2-926e-45ef-8a76-1731a40a490f';
const TITLE = 'كريجي — خصم 50%';

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
  const banners = await prisma.banner.findMany({ where: { worldId: W }, orderBy: { position: 'asc' } });
  fs.writeFileSync('/data/uploads/beauty-banners-rollback-2026-11-05-grigi.json', JSON.stringify(banners));

  const name = 'beauty-grigi50-hero.jpg';
  let mediaId = (await prisma.media.findFirst({ where: { originalName: name }, select: { id: true } }))?.id;
  if (!mediaId) {
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync('/tmp/h_grigi50.jpg')], { type: 'image/jpeg' }), name);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + t.slice(0, 200));
    mediaId = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  const grigi = await prisma.brand.findFirst({ where: { slug: 'grigi' }, select: { id: true } });
  const body = { title: TITLE, titleEn: 'GRIGI — 50% off', imageId: mediaId, linkType: 'products',
    linkValue: `brandId=${grigi.id}&isPromo=1&title=${encodeURIComponent('عروض كريجي — خصم 50%')}`, worldId: W, position: 0, isActive: true };
  const ex = banners.find((b) => b.title === TITLE);
  const id = ex ? (await call('PATCH', `/banners/${ex.id}`, body), ex.id) : (await call('POST', '/banners', body)).id;
  let pos = 1;
  for (const b of banners.filter((b) => b.id !== id)) await call('PATCH', `/banners/${b.id}`, { title: b.title, position: pos++ });
  console.log('grigi banner', id, 'others shifted', pos - 1);
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
