// Beauty Spell redesign: new hero banners, «إطلالات الموسم» ad group, new look grid, brand rooms.
const fs = require('fs'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/bsup3';
const W = '0c6628d2-926e-45ef-8a76-1731a40a490f';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const L = JSON.parse(fs.readFileSync(UP + '/looks.json', 'utf8'));
  const blocks = await prisma.homeBlock.findMany({ where: { worldId: W }, select: { id: true, type: true, title: true, payload: true, position: true, isActive: true } });
  const banners = await prisma.banner.findMany({ where: { worldId: W }, select: { id: true, title: true, isActive: true, position: true, imageId: true, linkType: true, linkValue: true } });
  if (!fs.existsSync('/data/uploads/beauty-redesign-rollback-2026-11-03.json')) fs.writeFileSync('/data/uploads/beauty-redesign-rollback-2026-11-03.json', JSON.stringify({ blocks, banners }));
  const B = (k) => { const b = blocks.find((x) => x.id.startsWith(k)); if (!b) throw new Error('no block ' + k); return b; };

  const media = {};
  for (const f of fs.readdirSync(UP).filter((f) => f.endsWith('.jpg'))) {
    const ex = await prisma.media.findFirst({ where: { originalName: { startsWith: `beauty-${f.replace('.jpg', '')}.` } }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (ex) { media[f.replace('.jpg', '')] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${UP}/${f}`)], { type: 'image/jpeg' }), `beauty-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[f.replace('.jpg', '')] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('uploaded', Object.keys(media).length);

  // 1 hero carousel: replace old Huda/Astra/general banners with the new stage designs
  for (const k of ['b85a9601', '8f8aeafb', '8a4a6220']) { const b = banners.find((x) => x.id.startsWith(k)); await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: false }); }
  const nb = {};
  for (const [img, title, slug] of [['L_huda', 'هدى بيوتي — ألوان لا تُنسى', 'huda-beauty'], ['L_mufe', 'ميك أب فور إيفر — بشرة HD', 'make-up-for-ever'], ['L_sheglam', 'شيغلام — وردي بلمسة ناعمة', 'sheglam']])
    nb[img] = banners.find((x) => x.title === title)?.id || (await call('POST', '/banners', { title, imageId: media[img], linkType: 'brand', linkValue: slug, worldId: W, position: 50, isActive: true })).id;
  const hero = [banners.find((x) => x.id.startsWith('5d7c0131')).id, nb.L_huda, banners.find((x) => x.id.startsWith('c76c06e7')).id, nb.L_mufe,
    banners.find((x) => x.id.startsWith('2a076385')).id, nb.L_sheglam, banners.find((x) => x.id.startsWith('2cc108de')).id];
  const all = await prisma.banner.findMany({ where: { worldId: W }, select: { id: true, title: true } });
  for (const [i, id] of hero.entries()) await call('PATCH', `/banners/${id}`, { title: all.find((x) => x.id === id).title, position: i, isActive: true });

  // 2 «إطلالات الموسم» group: portrait look cards + budget strip
  const own = async (list, n) => {
    const ps = await prisma.product.findMany({ where: { id: { in: list } }, select: { id: true, brand: { select: { slug: true } } } });
    return list.filter((id) => ps.find((p) => p.id === id && ['grigi', 'rybella'].includes(p.brand.slug))).slice(0, n);
  };
  const lookItems = [];
  const lookTitles = { C_night: 'سهرة جريئة', C_soft: 'إطلالة يومية ناعمة', C_smoky: 'عيون دخانية', C_glow: 'بشرة نديّة', C_bride: 'إطلالة العروس' };
  for (const k of ['C_night', 'C_soft', 'C_smoky', 'C_glow', 'C_bride']) {
    const v = L.looks[k]; let ids = [...v.ids];
    for (const pre of v.rprefix) { const p = await prisma.product.findFirst({ where: { id: { startsWith: pre } }, select: { id: true } }); if (p) ids.push(p.id); }
    if (v.use) ids = [...(await own(L.plan[v.use[0]], v.use[1])), ...ids];
    lookItems.push({ title: '', titleEn: '', subtitleEn: '', imageId: media[k], linkType: 'products', linkValue: `ids=${ids.join(',')}&title=${encodeURIComponent(lookTitles[k])}` });
  }
  const mk = async (type, title, payload) => (await call('POST', '/home-blocks', { type, worldId: W, pageKey: 'HOME', title, payload, position: 99, isActive: true })).id;
  const looks = await mk('SECTION_GROUP', 'إطلالات الموسم', {
    backgroundColor: '#F6EEF1', paddingH: 0, paddingTop: 16, paddingBottom: 18, shadow: false, showTitle: false, pattern: 'none', titleEn: 'Looks of the season',
    children: [
      { type: 'PHOTO_WALL', title: 'إطلالات الموسم', payload: { titleEn: 'Looks of the season', subtitle: 'اختاري إطلالتك ونجهّزلك كل منتجاتها', subtitleEn: 'Pick a look, we gather its products',
        display: 'scroll', aspectRatio: '4:5', tilesPerView: 1.7, gap: 10, tileCornerRadius: 16, showTitle: true, showViewAll: false, showShadow: false, overlayStyle: 'none', borderStyle: 'none', items: lookItems } },
      { type: 'CUSTOM_BANNER', title: '', payload: { source: 'inline', imageId: media.S_budget, linkType: 'products',
        linkValue: `categoryId=${L.plan.MK}&maxPrice=10000&title=${encodeURIComponent('مكياج بأقل من ١٠ آلاف')}`, bannerAspect: 3.84, showTitle: false, showViewAll: false, sectionLayout: 'full' } },
    ] });

  // 3 replace the old photo grid with the new jewel tiles (same links)
  const g = B('135282e0'); const tn = ['T_lips', 'T_eyes', 'T_face', 'T_cheeks', 'T_brows', 'T_glow'];
  await call('PATCH', `/home-blocks/${g.id}`, { title: 'اختاري لمستك', payload: { ...g.payload, titleEn: 'Shop by area', items: g.payload.items.map((it, i) => ({ ...it, title: '', titleEn: '', subtitle: '', subtitleEn: '', imageId: media[tn[i]] })) } });

  // 4 brand rooms: tinted group = new banner + the brand's product list; hide the old pair
  const rooms = [];
  for (const [bk, lk, img, slug, tint, en] of [
    ['92ce1d62', 'cfa2c4ca', 'R_huda', 'huda-beauty', '#F4EAE4', 'Huda Beauty'], ['f4352be0', '2335a1ef', 'R_sheglam', 'sheglam', '#FBEAF0', 'SHEGLAM'],
    ['29152249', 'b5c98785', 'R_astra', 'astra', '#FBEDEE', 'Astra'], ['1b7c0f25', '3eb2fe2c', 'R_mufe', 'make-up-for-ever', '#F2EDE7', 'Make Up For Ever'],
    ['f58b1edd', 'e7c2a952', 'R_maybelline', 'maybelline', '#FBEBEF', 'Maybelline'], ['4a37221f', 'd54a85cc', 'R_nyx', 'nyx', '#F4E9F2', 'NYX'],
    ['0b1a9e83', '23598cb2', 'R_artdeco', 'artdeco', '#F1ECF6', 'Artdeco']]) {
    const lst = B(lk);
    const id = await mk('SECTION_GROUP', lst.title, { backgroundColor: tint, paddingH: 12, paddingTop: 18, paddingBottom: 16, shadow: false, showTitle: false, pattern: 'none', titleEn: en,
      children: [{ type: 'CUSTOM_BANNER', title: '', payload: { source: 'inline', imageId: media[img], linkType: 'brand', linkValue: slug, bannerAspect: 2.15, showTitle: false, showViewAll: false, sectionLayout: 'full' } },
        { type: 'PRODUCT_LIST', title: '', payload: { ...lst.payload, showTitle: false, showViewAll: true } }] });
    rooms.push(id);
    for (const k of [bk, lk]) await call('PATCH', `/home-blocks/${B(k).id}`, { isActive: false });
  }

  // 5 order
  const o = (k) => B(k).id;
  const order = [o('73dedc60'), o('26b2c8ba'), o('30db6b4e'), o('9bd4e9cd'), looks, o('135282e0'), o('60a2253e'), o('468a4954'), o('a70fd02f'), o('f52ab320'), o('00070af7'),
    ...rooms, o('32141870'), o('87c31f33')];
  for (const [i, id] of order.entries()) await call('PATCH', `/home-blocks/${id}`, { position: i });
  console.log('done', { looks, rooms: rooms.length, order: order.length });
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
