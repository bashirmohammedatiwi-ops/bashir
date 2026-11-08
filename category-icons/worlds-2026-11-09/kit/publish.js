// Generic world publisher. Usage (inside the api container): node x_pub.js /tmp/w5/<slug>
// <dir>/plan.json:
// { "world": "<slug>",
//   "banners": [ {"ref":"<existing banner id or 8-char prefix>"} | {"img":"<file in img/>","title":"…","linkType":"brand|products|category|subcategory","linkValue":"…"} ],
//   "blocks":  [ {"ref":"<existing block id/prefix>", "title"?: "…", "patch"?: {payload top-level keys to override}}
//              | {"new":"<stable key>", "type":"PHOTO_WALL|CUSTOM_BANNER|SECTION_GROUP|PRODUCT_LIST|…", "title":"…", "payload":{…}} ] }
// Arrays give the FINAL order. Any active banner/block of the world that is not listed is hidden (isActive=false), never deleted.
// Any string "@img:<file>" anywhere in a payload is replaced by the uploaded media id of <dir>/img/<file>.
const fs = require('fs'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1';
(async () => {
  const dir = process.argv[2]; const plan = JSON.parse(fs.readFileSync(dir + '/plan.json', 'utf8'));
  const world = await prisma.world.findUnique({ where: { slug: plan.world } }); if (!world) throw new Error('world ' + plan.world);
  const W = world.id;
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '2h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const blocks = await prisma.homeBlock.findMany({ where: { worldId: W } });
  const banners = await prisma.banner.findMany({ where: { worldId: W } });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  fs.writeFileSync(`/data/uploads/world-${plan.world}-rollback-${stamp}.json`, JSON.stringify({ blocks, banners }));
  // upload images
  const media = {};
  const imgDir = dir + '/img';
  for (const f of fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : []) {
    const on = `w5-${plan.world}-${f}`;
    const ex = await prisma.media.findFirst({ where: { originalName: on }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (ex && !process.env.REUPLOAD) { media[f] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${imgDir}/${f}`)], { type: f.endsWith('.png') ? 'image/png' : 'image/jpeg' }), on);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[f] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  const sub = (v) => {
    if (typeof v === 'string' && v.startsWith('@img:')) { const id = media[v.slice(5)]; if (!id) throw new Error('missing image ' + v); return id; }
    if (Array.isArray(v)) return v.map(sub);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sub(x)]));
    return v;
  };
  const find = (list, ref) => { const m = list.filter((x) => x.id.startsWith(ref)); if (m.length !== 1) throw new Error(`ref ${ref} matched ${m.length}`); return m[0]; };
  // banners
  const keepB = [];
  for (const [i, b] of (plan.banners || []).entries()) {
    if (b.ref) { const x = find(banners, b.ref); await call('PATCH', `/banners/${x.id}`, { title: b.title ?? x.title, position: i, isActive: true }); keepB.push(x.id); }
    else {
      const ex = banners.find((x) => x.title === b.title && x.linkValue === b.linkValue);
      const body = { title: b.title, imageId: media[b.img], linkType: b.linkType, linkValue: b.linkValue, position: i, isActive: true };
      if (!media[b.img]) throw new Error('missing banner image ' + b.img);
      const id = ex ? (await call('PATCH', `/banners/${ex.id}`, body), ex.id) : (await call('POST', '/banners', { ...body, worldId: W })).id;
      keepB.push(id);
    }
  }
  if (plan.banners) for (const b of banners.filter((x) => x.isActive && !keepB.includes(x.id))) await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: false });
  // blocks
  const keepK = [];
  for (const [i, b] of (plan.blocks || []).entries()) {
    if (b.ref) {
      const x = find(blocks, b.ref);
      const body = { position: i, isActive: true };
      if (b.title !== undefined) body.title = b.title;
      if (b.patch) body.payload = { ...(x.payload || {}), ...sub(b.patch) };
      await call('PATCH', `/home-blocks/${x.id}`, body); keepK.push(x.id);
    } else {
      const ex = blocks.find((x) => x.payload && x.payload.__key === b.new);
      const payload = { ...sub(b.payload), __key: b.new };
      const id = ex ? (await call('PATCH', `/home-blocks/${ex.id}`, { type: b.type, title: b.title, payload, position: i, isActive: true }), ex.id)
        : (await call('POST', '/home-blocks', { type: b.type, worldId: W, pageKey: 'HOME', title: b.title, payload, position: i, isActive: true })).id;
      keepK.push(id);
    }
  }
  if (plan.blocks) for (const b of blocks.filter((x) => x.isActive && !keepK.includes(x.id))) await call('PATCH', `/home-blocks/${b.id}`, { isActive: false });
  console.log(JSON.stringify({ world: plan.world, media: Object.keys(media).length, banners: keepB.length, blocks: keepK.length }));
  await prisma.$disconnect(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
