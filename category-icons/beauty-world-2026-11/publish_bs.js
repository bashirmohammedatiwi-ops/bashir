// Beauty Spell rebuild: GRIGI + RYBELLA first. Run inside the api container (files in /tmp/bsup).
const fs = require('fs'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/bsup';
const W = '0c6628d2-926e-45ef-8a76-1731a40a490f';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const P = JSON.parse(fs.readFileSync(UP + '/plan.json', 'utf8'));

  // rollback snapshot
  const oldBlocks = await prisma.homeBlock.findMany({ where: { worldId: W, isActive: true }, select: { id: true, position: true, payload: true, title: true } });
  const oldBanners = await prisma.banner.findMany({ where: { worldId: W, isActive: true }, select: { id: true, title: true } });
  fs.writeFileSync('/data/uploads/beauty-rollback-2026-11-03.json', JSON.stringify({ oldBlocks, oldBanners }));

  // 1 uploads
  const media = {};
  for (const f of fs.readdirSync(UP).filter((f) => f.endsWith('.jpg'))) {
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${UP}/${f}`)], { type: 'image/jpeg' }), `beauty-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[f.replace('.jpg', '')] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('uploaded', Object.keys(media).length);

  // 2 world hero banners: hide old, create new
  for (const b of oldBanners) await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: false });
  const heroes = [
    ['h_grigi_berry', 'كريجي — شفاه بلون التوت', 'brand', 'grigi'],
    ['h_rybella', 'ريبيلا — جمال إيطالي', 'brand', 'rybella'],
    ['h_grigi_blue', 'كريجي — عيون آسرة', 'products', `brandId=${P.G}&subcategoryId=${P.SUB.eyes}&title=${encodeURIComponent('عيون كريجي')}`],
    ['h_grigi_cinnamon', 'كريجي — دفء القرفة', 'brand', 'grigi'],
  ];
  for (const [i, [img, title, linkType, linkValue]] of heroes.entries())
    await call('POST', '/banners', { title, imageId: media[img], linkType, linkValue, worldId: W, position: i, isActive: true });
  console.log('heroes', heroes.length);

  // 3 new blocks
  const tile = (img, linkType, linkValue) => ({ title: '', titleEn: '', subtitleEn: '', imageId: media[img], linkType, linkValue });
  const banner = (img, linkType, linkValue, aspect, extra = {}) => ({ type: 'CUSTOM_BANNER', title: '', payload: { source: 'inline', imageId: media[img], linkType, linkValue, bannerAspect: aspect, showTitle: false, showViewAll: false, sectionLayout: 'full', ...extra } });
  const mk = async (type, title, payload) => (await call('POST', '/home-blocks', { type, worldId: W, pageKey: 'HOME', title, payload, position: 99, isActive: true })).id;

  const featured = await mk('SECTION_GROUP', 'المميز', {
    backgroundColor: '#F7F0F2', paddingH: 0, paddingTop: 14, paddingBottom: 16, shadow: false, showTitle: false, pattern: 'none', titleEn: 'Featured',
    children: [
      { type: 'PHOTO_WALL', title: '', payload: { display: 'marquee', aspectRatio: '27:10', tilesPerView: 1.15, gap: 10, marqueeGap: 10, marqueeSpeed: 3, fullBleed: true, tileCornerRadius: 14, showShadow: false, showTitle: false, showViewAll: false, overlayStyle: 'none', borderStyle: 'none',
        items: [tile('w_grigi_lips', 'products', `brandId=${P.G}&subcategoryId=${P.SUB.lips}&title=${encodeURIComponent('شفاه كريجي')}`),
                tile('w_rybella_lips', 'products', `brandId=${P.R}&subcategoryId=${P.SUB.lips}&title=${encodeURIComponent('أحمر شفاه ريبيلا')}`),
                tile('w_grigi_eyes', 'tertiary', P.T.eyeshadow),
                tile('w_rybella_color', 'brand', 'rybella'),
                tile('w_grigi_face', 'products', `brandId=${P.G}&subcategoryId=${P.SUB.face}&title=${encodeURIComponent('وجه كريجي')}`)] } },
      { type: 'PHOTO_WALL', title: '', payload: { gap: 8, columns: 3, display: 'grid', aspectRatio: '1:1', showTitle: false, showShadow: false, showViewAll: false, overlayStyle: 'none', borderStyle: 'none', tileCornerRadius: 14,
        items: [tile('m_lips', 'subcategory', P.SUB.lips), tile('m_eyes', 'tertiary', P.T.eyeshadow), tile('m_powder', 'tertiary', P.T.powder),
                tile('m_blush', 'tertiary', P.T.blush), tile('m_mascara', 'tertiary', P.T.mascara), tile('m_nails', 'subcategory', P.SUB.nails)] } },
      banner('x_exclusive', 'brand', 'grigi', 3.2),
    ] });
  const brandGroup = async (title, titleEn, band, img, slug, brandId) => mk('SECTION_GROUP', title, {
    backgroundColor: band, paddingH: 12, paddingTop: 18, paddingBottom: 16, shadow: false, showTitle: false, pattern: 'none', titleEn,
    children: [banner(img, 'brand', slug, 2.15),
      { type: 'PRODUCT_LIST', title: '', payload: { filter: 'all', brandId, categoryId: P.MK, limit: 16, showTitle: false, showViewAll: true } }] });
  const grigi = await brandGroup('كريجي', 'GRIGI', '#F1E4EB', 's_grigi', 'grigi', P.G);
  const rybella = await brandGroup('ريبيلا', 'RYBELLA', '#F5ECE2', 's_rybella', 'rybella', P.R);
  const flash = await mk('FLASH_SALE', 'عروض سريعة', { productIds: P.flash, filter: 'all', limit: 18, showTitle: true, showViewAll: true, titleEn: 'Flash deals', endsAt: '2026-11-10T21:00:00.000Z',
    viewAllQuery: `isPromo=1&categoryId=${P.MK}&title=${encodeURIComponent('عروض المكياج')}` });
  console.log('created', { featured, grigi, rybella, flash });

  // 4 refresh curated lists (GRIGI/RYBELLA first) and the brands strip
  const byId = Object.fromEntries(oldBlocks.map((b) => [b.id.slice(0, 8), b]));
  const patchList = async (k, ids, title) => { const b = byId[k]; await call('PATCH', `/home-blocks/${b.id}`, { title, payload: { ...b.payload, productIds: ids, limit: ids.length, showTitle: true } }); };
  await patchList('60a2253e', P.lips, 'للشفاه');
  await patchList('a70fd02f', P.eyes, 'للعيون');
  await patchList('00070af7', P.face, 'لبشرة الوجه');
  await call('PATCH', `/home-blocks/${byId['87c31f33'].id}`, { payload: { ...byId['87c31f33'].payload, brandIds: P.brandsIds } });

  // 5 hide replaced blocks: «مختارات المكياج», «عروض المكياج» (flash covers it), old «ريبيلا الإيطالية» list
  for (const k of ['7771e08b', '411f0fb6', '251a7658']) await call('PATCH', `/home-blocks/${byId[k].id}`, { isActive: false });

  // 6 order
  const o = (k) => byId[k].id;
  const order = [featured, grigi, rybella, flash, o('135282e0'), o('f52ab320'), o('60a2253e'), o('468a4954'), o('a70fd02f'),
    o('92ce1d62'), o('cfa2c4ca'), o('00070af7'), o('f4352be0'), o('2335a1ef'), o('29152249'), o('b5c98785'),
    o('1b7c0f25'), o('3eb2fe2c'), o('f58b1edd'), o('e7c2a952'), o('4a37221f'), o('d54a85cc'), o('0b1a9e83'), o('23598cb2'), o('32141870'), o('87c31f33')];
  for (const [i, id] of order.entries()) await call('PATCH', `/home-blocks/${id}`, { position: i });
  console.log('ordered', order.length);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
