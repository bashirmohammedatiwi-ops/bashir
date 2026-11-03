// Catrice stock import: activate, merge split shade lines, official white-background images, POS prices/stock.
const fs = require('fs'); const crypto = require('crypto'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/catup';
const BRAND = '0e997aba-07dd-4177-b5ca-3d7bb2481eb0';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '2h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 400)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const plan = JSON.parse(fs.readFileSync(UP + '/plan.json', 'utf8'));

  // rollback snapshot of everything we touch
  const ids = [...plan.products.map((p) => p.id), ...plan.deactivate];
  const RB = '/data/uploads/catrice-rollback-2026-11-03.json';
  if (!fs.existsSync(RB)) {
    fs.writeFileSync(RB, JSON.stringify({
      products: await prisma.product.findMany({ where: { id: { in: ids } } }),
      shades: await prisma.productShade.findMany({ where: { productId: { in: ids } } }),
      images: await prisma.productImage.findMany({ where: { productId: { in: ids } } }),
    }));
  }

  // uploads (idempotent by original name)
  const media = {};
  for (const f of plan.files) {
    const ex = await prisma.media.findFirst({ where: { originalName: `catrice-${f}` }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (ex) { media[f] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'PRODUCT');
    fd.append('file', new Blob([fs.readFileSync(`${UP}/img/${f}`)], { type: 'image/jpeg' }), `catrice-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[f] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('media', Object.keys(media).length);

  const lead = (sh) => {
    const live = sh.filter((s) => s.isActive !== false); const pool = live.filter((s) => (s.stock ?? 0) > 0);
    return [...(pool.length ? pool : live.length ? live : sh)].sort((x, y) => (y.discountPercent ?? 0) - (x.discountPercent ?? 0) || (x.price ?? 1e12) - (y.price ?? 1e12))[0];
  };

  // existing products
  let nShades = 0, nNew = 0;
  for (const p of plan.products) {
    await prisma.$transaction(async (tx) => {
      if (p.shades) {
        for (const s of p.shades) {
          if (s.keep) { await tx.productShade.update({ where: { id: s.id }, data: { position: s.position } }); continue; }
          const data = { name: s.name, colorHex: s.colorHex, barcode: s.barcode, price: s.price, originalPrice: s.originalPrice, discountPercent: s.discountPercent,
            stock: s.stock, isActive: true, position: s.position, ...(s.img ? { imageId: media[s.img] } : {}) };
          if (s.id) await tx.productShade.update({ where: { id: s.id }, data });
          else { await tx.productShade.create({ data: { id: crypto.randomUUID(), productId: p.id, ...data } }); nNew++; }
          nShades++;
        }
      }
      const gallery = [...new Set([p.primary && media[p.primary], p.texture && media[p.texture], ...p.extras].filter(Boolean))];
      await tx.productImage.deleteMany({ where: { productId: p.id } });
      for (const [i, mediaId] of gallery.entries()) await tx.productImage.create({ data: { id: crypto.randomUUID(), productId: p.id, mediaId, position: i, isPrimary: i === 0 } });
      const data = { isActive: true };
      if (p.rename) Object.assign(data, { name: p.rename[0], nameAr: p.rename[0], nameEn: p.rename[1] });
      if (p.single) Object.assign(data, { price: p.single.price, originalPrice: p.single.originalPrice, discountPercent: p.single.discountPercent, stock: p.single.stock, isPromo: p.single.discountPercent > 0 });
      else {
        const all = await tx.productShade.findMany({ where: { productId: p.id } });
        const live = all.filter((s) => s.isActive !== false); const l = lead(all);
        const maxD = Math.max(0, ...live.map((s) => s.discountPercent ?? 0));
        Object.assign(data, { stock: live.reduce((n, s) => n + (s.stock ?? 0), 0), price: l.price ?? 0, originalPrice: l.originalPrice ?? 0, discountPercent: maxD, isPromo: maxD > 0 });
      }
      await tx.product.update({ where: { id: p.id }, data });
    }, { timeout: 60000 });
  }
  // merged-away singles: hide and release their barcode (it now lives on the target's shade)
  await prisma.product.updateMany({ where: { id: { in: plan.deactivate } }, data: { isActive: false, barcode: null } });
  console.log('updated', plan.products.length, 'shades', nShades, 'new shades', nNew, 'deactivated', plan.deactivate.length);

  // brand-new products through the API (it prices shades from the POS snapshot)
  for (const n of plan.new) {
    const ex = await prisma.product.findFirst({ where: { slug: n.slug }, select: { id: true } });
    if (ex) { console.log('exists', n.slug); continue; }
    const body = { sku: n.sku, slug: n.slug, brandId: BRAND, categoryId: n.cat, subcategoryId: n.sub, tertiaryCategoryId: n.ter, subcategoryIds: [n.sub], tertiaryCategoryIds: [n.ter],
      nameAr: n.nameAr, nameEn: n.nameEn, descriptionAr: n.descriptionAr, descriptionEn: n.descriptionEn, isActive: true };
    if (n.shades) Object.assign(body, { price: n.shades[0].price, originalPrice: n.shades[0].originalPrice, stock: 0, barcode: n.shades[0].barcode, imageIds: [media[n.shades[0].img]],
      shades: n.shades.map((s, i) => ({ name: s.name, colorHex: s.colorHex, barcode: s.barcode, imageId: media[s.img], price: s.price, originalPrice: s.originalPrice, discountPercent: s.discountPercent, stock: s.stock, position: i, isActive: true })) });
    else Object.assign(body, { barcode: n.barcode, price: n.price, originalPrice: n.originalPrice, discountPercent: n.discountPercent, stock: n.stock, imageIds: [media[n.img], n.texture && media[n.texture]].filter(Boolean) });
    const c = await call('POST', '/products', body); console.log('created', n.slug, c.id);
  }
  // one API write to flush the home/listing caches
  await call('PATCH', `/products/${plan.products[0].id}`, { isActive: true });
  console.log('done'); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
