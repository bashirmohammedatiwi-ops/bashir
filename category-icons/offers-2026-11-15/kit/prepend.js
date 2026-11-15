// node x_prep.js <dir> <world>: builds <dir>/plan.json = offers first, then the world's CURRENT active banners/blocks in their current order.
const fs = require('fs'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();
(async () => {
  const [dir, slug] = process.argv.slice(2);
  const o = JSON.parse(fs.readFileSync(dir + '/offers.json', 'utf8'));
  const w = await prisma.world.findUnique({ where: { slug } });
  const titles = new Set(o.banners.map((b) => b.title));
  const banners = (await prisma.banner.findMany({ where: { worldId: w.id, isActive: true }, orderBy: { position: 'asc' } })).filter((b) => !titles.has(b.title));
  const blocks = (await prisma.homeBlock.findMany({ where: { worldId: w.id, isActive: true }, orderBy: { position: 'asc' } })).filter((b) => b.payload?.__key !== o.wall.new);
  const plan = { world: slug, banners: [...o.banners, ...banners.map((b) => ({ ref: b.id }))], blocks: [o.wall, ...blocks.map((b) => ({ ref: b.id }))] };
  fs.writeFileSync(dir + '/plan.json', JSON.stringify(plan, null, 1));
  console.log('plan', plan.banners.length, 'banners', plan.blocks.length, 'blocks');
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
