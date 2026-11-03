// Pending barcode drafts → products: create new ones via API, link/activate existing ones, mark drafts added.
const fs = require('fs'); const crypto = require('crypto'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/draftup';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '2h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 400)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const plan = JSON.parse(fs.readFileSync(UP + '/plan.json', 'utf8'));
  const RB = '/data/uploads/drafts-rollback-2026-11-03.json';
  const touched = [...plan.existing.map((e) => e.productId), ...Object.keys(plan.rename)];
  if (!fs.existsSync(RB)) fs.writeFileSync(RB, JSON.stringify({ products: await prisma.product.findMany({ where: { id: { in: touched } } }), shades: await prisma.productShade.findMany({ where: { productId: { in: touched } } }),
    drafts: await prisma.barcodeDraft.findMany({ where: { id: { in: [...plan.new, ...plan.existing].map((x) => x.draftId) } } }) }));

  const media = {};
  for (const f of plan.files) {
    const ex = await prisma.media.findFirst({ where: { originalName: `draft-${f}` }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (ex) { media[f] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'PRODUCT');
    fd.append('file', new Blob([fs.readFileSync(`${UP}/img/${f}`)], { type: 'image/jpeg' }), `draft-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[f] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('media', Object.keys(media).length);
  const brands = Object.fromEntries((await prisma.brand.findMany({ select: { id: true, slug: true } })).map((b) => [b.slug, b.id]));
  const snap = async (bc) => prisma.inventorySyncSnapshot.findUnique({ where: { barcode: bc } });
  const done = async (draftId, productId, shadeId) => prisma.barcodeDraft.update({ where: { id: draftId }, data: { addedAt: new Date(), productId, shadeId: shadeId ?? null } });

  let created = 0;
  for (const n of plan.new) {
    let p = await prisma.product.findFirst({ where: { barcode: n.barcode }, select: { id: true } });
    if (!p) {
      const imageIds = [];
      for (const f of n.images) {
        if (f.startsWith('EXISTING:')) { const pi = await prisma.productImage.findFirst({ where: { productId: f.split(':')[1] }, orderBy: { position: 'asc' } }); if (pi) imageIds.push(pi.mediaId); }
        else imageIds.push(media[f]);
      }
      if (!brands[n.brand]) throw new Error('brand ' + n.brand);
      p = await call('POST', '/products', { sku: n.sku, slug: n.slug, barcode: n.barcode, brandId: brands[n.brand], categoryId: n.cat, subcategoryId: n.sub, subcategoryIds: [n.sub],
        ...(n.ter ? { tertiaryCategoryId: n.ter, tertiaryCategoryIds: [n.ter] } : {}), nameAr: n.nameAr, nameEn: n.nameEn, descriptionAr: n.dAr, descriptionEn: n.dEn,
        price: n.price, originalPrice: n.originalPrice, stock: n.stock, isActive: true, imageIds });
      created++;
    }
    await done(n.draftId, p.id);
  }
  console.log('created', created, 'of', plan.new.length);

  for (const e of plan.existing) {
    const s = await snap(e.barcode);
    if (e.kind === 'addShade') {
      let sh = await prisma.productShade.findFirst({ where: { productId: e.productId, barcode: e.barcode } });
      if (!sh) {
        const n = await prisma.productShade.count({ where: { productId: e.productId } });
        sh = await prisma.productShade.create({ data: { id: crypto.randomUUID(), productId: e.productId, name: e.shadeName, colorHex: e.colorHex, barcode: e.barcode, imageId: media[e.img],
          price: s.price, originalPrice: s.originalPrice, discountPercent: s.discountPercent, stock: s.stock, isActive: true, position: n } });
      }
      const all = await prisma.productShade.findMany({ where: { productId: e.productId, isActive: true } });
      const lead = [...all.filter((x) => x.stock > 0)].sort((x, y) => (x.price ?? 1e12) - (y.price ?? 1e12))[0] || all[0];
      await prisma.product.update({ where: { id: e.productId }, data: { isActive: true, stock: all.reduce((t, x) => t + x.stock, 0), price: lead.price ?? 0, originalPrice: lead.originalPrice ?? 0 } });
      await done(e.draftId, e.productId, sh.id);
    } else if (e.kind === 'relink') {
      await prisma.product.update({ where: { id: e.productId }, data: { barcode: e.barcode, isActive: true, price: s.price, originalPrice: s.originalPrice, discountPercent: s.discountPercent, stock: s.stock, isPromo: s.discountPercent > 0 } });
      await done(e.draftId, e.productId);
    } else {
      await prisma.product.update({ where: { id: e.productId }, data: { isActive: true } });
      await done(e.draftId, e.productId);
    }
  }
  for (const [id, [ar, en]] of Object.entries(plan.rename)) await prisma.product.update({ where: { id }, data: { name: ar, nameAr: ar, nameEn: en } });
  await call('PATCH', `/products/${plan.existing[0].productId}`, { isActive: true });
  console.log('existing', plan.existing.length, 'renamed', Object.keys(plan.rename).length, 'done'); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
