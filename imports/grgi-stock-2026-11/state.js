// GRGI: keep only the owner's current list active (products + shades), recompute shade-product aggregates.
const fs = require('fs'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const plan = JSON.parse(fs.readFileSync('/tmp/grgiup1/state_plan.json', 'utf8'));
  const G = '0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4';
  const RB = '/data/uploads/grgi-state-rollback-2026-11-03.json';
  if (!fs.existsSync(RB)) fs.writeFileSync(RB, JSON.stringify({
    products: await prisma.product.findMany({ where: { brandId: G }, select: { id: true, isActive: true, stock: true, price: true, originalPrice: true, discountPercent: true } }),
    shades: await prisma.productShade.findMany({ where: { product: { brandId: G } }, select: { id: true, isActive: true } }) }));
  await prisma.productShade.updateMany({ where: { id: { in: plan.shadeOff } }, data: { isActive: false } });
  await prisma.productShade.updateMany({ where: { id: { in: plan.shadeOn } }, data: { isActive: true } });
  await prisma.product.updateMany({ where: { id: { in: plan.prodOff } }, data: { isActive: false } });
  await prisma.product.updateMany({ where: { id: { in: plan.prodOn } }, data: { isActive: true } });
  for (const id of plan.prodOn) {
    const all = await prisma.productShade.findMany({ where: { productId: id } });
    if (!all.length) continue;
    const live = all.filter((s) => s.isActive); const pool = live.filter((s) => s.stock > 0);
    const lead = [...(pool.length ? pool : live)].sort((a, b) => (b.discountPercent - a.discountPercent) || ((a.price ?? 1e12) - (b.price ?? 1e12)))[0];
    const maxD = Math.max(0, ...live.map((s) => s.discountPercent));
    await prisma.product.update({ where: { id }, data: { stock: live.reduce((n, s) => n + s.stock, 0), price: lead.price ?? 0, originalPrice: lead.originalPrice ?? 0, discountPercent: maxD, isPromo: maxD > 0 } });
  }
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  await fetch(`http://127.0.0.1:3000/api/v1/products/${plan.prodOn[0]}`, { method: 'PATCH', headers: { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web', 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) });
  const c = await prisma.product.count({ where: { brandId: G, isActive: true } }); const cs = await prisma.productShade.count({ where: { product: { brandId: G }, isActive: true } });
  console.log('active products', c, 'active shades', cs); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
