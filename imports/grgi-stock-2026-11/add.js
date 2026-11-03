// GRGI: add owner-listed barcodes missing from the app (new shades on existing lines + new products).
const fs = require('fs'); const crypto = require('crypto'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/grgiup2'; const G = '0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 400)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const plan = JSON.parse(fs.readFileSync(UP + '/plan.json', 'utf8'));
  const media = {};
  for (const f of plan.files) {
    const ex = await prisma.media.findFirst({ where: { originalName: `grgi-${f}` }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (ex) { media[f] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'PRODUCT'); fd.append('file', new Blob([fs.readFileSync(`${UP}/img/${f}`)], { type: 'image/jpeg' }), `grgi-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text(); if (!r.ok) throw new Error('upload ' + f + t.slice(0, 200));
    media[f] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  const snap = async (bc) => prisma.inventorySyncSnapshot.findUnique({ where: { barcode: bc } });
  const num = (n) => { const m = /^\s*(\d+)/.exec(n); return m ? +m[1] : 9999; };
  let nAdd = 0;
  for (const [pid, shades] of Object.entries(plan.add)) {
    for (const s of shades) {
      if (await prisma.productShade.findFirst({ where: { productId: pid, barcode: s.barcode } })) continue;
      const p = await snap(s.barcode);
      await prisma.productShade.create({ data: { id: crypto.randomUUID(), productId: pid, name: s.name, colorHex: s.colorHex, barcode: s.barcode, imageId: media[s.img],
        price: p.price, originalPrice: p.originalPrice, discountPercent: p.discountPercent, stock: p.stock, isActive: true, position: 999 } });
      nAdd++;
    }
    const all = await prisma.productShade.findMany({ where: { productId: pid } });
    const sorted = [...all].sort((x, y) => num(x.name) - num(y.name) || x.name.localeCompare(y.name));
    for (const [i, s] of sorted.entries()) if (s.position !== i) await prisma.productShade.update({ where: { id: s.id }, data: { position: i } });
    const live = all.filter((s) => s.isActive); const pool = live.filter((s) => s.stock > 0);
    const lead = [...(pool.length ? pool : live)].sort((x, y) => (y.discountPercent - x.discountPercent) || ((x.price ?? 1e12) - (y.price ?? 1e12)))[0];
    const maxD = Math.max(0, ...live.map((s) => s.discountPercent));
    await prisma.product.update({ where: { id: pid }, data: { isActive: true, stock: live.reduce((t, s) => t + s.stock, 0), price: lead.price ?? 0, originalPrice: lead.originalPrice ?? 0, discountPercent: maxD, isPromo: maxD > 0 } });
  }
  const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let nNew = 0;
  for (const n of plan.new) {
    const bc = n.single || n.shades[0].barcode;
    if (await prisma.product.findFirst({ where: { OR: [{ barcode: bc }, { shades: { some: { barcode: bc } } }] } })) continue;
    const [cat, sub, ter] = n.cat;
    const base = { sku: 'AI-' + bc, slug: slug(n.nameEn) + '-' + bc.slice(-6), brandId: G, categoryId: cat, subcategoryId: sub, subcategoryIds: [sub], tertiaryCategoryId: ter, tertiaryCategoryIds: [ter],
      nameAr: n.nameAr, nameEn: n.nameEn, descriptionAr: n.dAr, descriptionEn: n.dEn, isActive: true };
    if (n.single) {
      const p = await snap(bc);
      await call('POST', '/products', { ...base, barcode: bc, price: p.price, originalPrice: p.originalPrice, discountPercent: p.discountPercent, stock: p.stock, imageIds: [media[n.img]] });
    } else {
      await call('POST', '/products', { ...base, barcode: bc, price: 0, stock: 0, imageIds: [media[n.shades[0].img]],
        shades: n.shades.map((s, i) => ({ name: s.name, colorHex: s.colorHex, barcode: s.barcode, imageId: media[s.img], position: i, isActive: true })) });
    }
    nNew++;
  }
  await call('PATCH', `/products/${Object.keys(plan.add)[0]}`, { isActive: true });
  const c = await prisma.product.count({ where: { brandId: G, isActive: true } }); const cs = await prisma.productShade.count({ where: { product: { brandId: G }, isActive: true } });
  console.log('added shades', nAdd, 'new products', nNew, '| GRGI active products', c, 'active shades', cs); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
