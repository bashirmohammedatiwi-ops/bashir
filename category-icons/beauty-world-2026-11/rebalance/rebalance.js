// Beauty Spell rebalance: GRIGI/RYBELLA lead, other brands present in ads + lists.
const fs = require('fs'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/bsup2';
const W = '0c6628d2-926e-45ef-8a76-1731a40a490f';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const L = JSON.parse(fs.readFileSync(UP + '/lists2.json', 'utf8'));
  const blocks = await prisma.homeBlock.findMany({ where: { worldId: W }, select: { id: true, payload: true, title: true, isActive: true } });
  const B = (k) => blocks.find((b) => b.id.startsWith(k));
  const banners = await prisma.banner.findMany({ where: { worldId: W }, select: { id: true, title: true, isActive: true, position: true } });
  fs.writeFileSync('/data/uploads/beauty-rebalance-rollback-2026-11-03.json', JSON.stringify({ blocks: ['73dedc60', '60a2253e', 'a70fd02f', '00070af7', '30db6b4e'].map(B), banners }));

  const media = {};
  for (const f of fs.readdirSync(UP).filter((f) => f.endsWith('.jpg'))) {
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${UP}/${f}`)], { type: 'image/jpeg' }), `beauty-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[f.replace('.jpg', '')] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('uploaded', Object.keys(media).length);

  // featured group: marquee alternates own brands with others; tiles mix brands
  const fb = B('73dedc60'); const ch = fb.payload.children;
  const mq = ch[0].payload.items; // [grigi_lips, rybella_lips, grigi_eyes, rybella_color, grigi_face]
  const tile = (img, slug) => ({ title: '', titleEn: '', subtitleEn: '', imageId: media[img], linkType: 'brand', linkValue: slug });
  ch[0].payload.items = [mq[0], tile('w_huda', 'huda-beauty'), mq[1], tile('w_sheglam', 'sheglam'), mq[2],
    tile('w_mufe', 'make-up-for-ever'), mq[3], tile('w_maybelline', 'maybelline'), mq[4], tile('w_nyx', 'nyx')];
  const tn = ['m_lips', 'm_eyes', 'm_powder', 'm_blush', 'm_mascara', 'm_nails'];
  ch[1].payload.items = ch[1].payload.items.map((it, i) => ({ ...it, imageId: media[tn[i]] }));
  await call('PATCH', `/home-blocks/${fb.id}`, { payload: { ...fb.payload, children: ch } });

  // lists + flash
  for (const [k, key] of [['60a2253e', 'lips'], ['a70fd02f', 'eyes'], ['00070af7', 'face'], ['30db6b4e', 'flash']]) {
    const b = B(k); await call('PATCH', `/home-blocks/${b.id}`, { payload: { ...b.payload, productIds: L[key], limit: L[key].length } });
  }

  // hero carousel: bring back Huda, Astra and the general banner between ours
  const bn = (k) => banners.find((b) => b.id.startsWith(k));
  const order = ['5d7c0131', 'b85a9601', 'c76c06e7', '8f8aeafb', '2a076385', '8a4a6220', '2cc108de'];
  for (const [i, k] of order.entries()) { const b = bn(k); await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: true, position: i }); }
  console.log('done');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
