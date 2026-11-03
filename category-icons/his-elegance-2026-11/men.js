// His Elegance (أناقة الرجل) redesign: noir-gentleman heroes, featured group, scent families, houses wall, occasions, brand rooms.
const fs = require('fs'); const jwt = require('jsonwebtoken'); const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); const API = 'http://127.0.0.1:3000/api/v1'; const UP = '/tmp/menup';
const W = 'ef665a38-c583-452a-889c-1e6973020786';
const MEN = '8dca642a-1194-4101-b5cc-486ca1664e89';
(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => { const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`); const j = JSON.parse(t); return j.data !== undefined ? j.data : j; };
  const L = JSON.parse(fs.readFileSync(UP + '/plan.json', 'utf8'));
  const blocks = await prisma.homeBlock.findMany({ where: { worldId: W }, select: { id: true, type: true, title: true, payload: true, position: true, isActive: true } });
  const banners = await prisma.banner.findMany({ where: { worldId: W }, select: { id: true, title: true, isActive: true, position: true, imageId: true, linkType: true, linkValue: true } });
  const RB = '/data/uploads/men-redesign-rollback-2026-11-03.json';
  if (!fs.existsSync(RB)) fs.writeFileSync(RB, JSON.stringify({ blocks, banners }));
  const B = (k) => { const b = blocks.find((x) => x.id.startsWith(k)); if (!b) throw new Error('no block ' + k); return b; };
  const brand = async (slug) => (await prisma.brand.findFirst({ where: { slug }, select: { id: true } })).id;

  // uploads (idempotent by original name)
  const media = {};
  for (const f of fs.readdirSync(UP).filter((f) => f.endsWith('.jpg'))) {
    const n = f.replace('.jpg', '');
    const ex = await prisma.media.findFirst({ where: { originalName: `men-${f}` }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (ex) { media[n] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${UP}/${f}`)], { type: 'image/jpeg' }), `men-${f}`);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[n] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('media', Object.keys(media).length);
  const ids = (k, title) => `ids=${L[k].join(',')}&title=${encodeURIComponent(title)}`;

  // 1 hero banners
  const heroes = [['H_signature', 'أناقة الرجل — حضورك يبدأ بعطرك', 'subcategory', MEN], ['H_tomford', 'توم فورد — فخامة بلا مساومة', 'brand', 'tom-ford'],
    ['H_pdm', 'بارفيوم دي مارلي — فخامة القصور', 'brand', 'parfums-de-marly'], ['H_dior', 'ديور — أيقونة سوفاج', 'brand', 'christian-dior'],
    ['H_niche', 'كسرجوف — فن العطر الإيطالي', 'brand', 'xerjoff'], ['H_care', 'عناية يومية للرجل', 'products', ids('care', 'عناية الرجل')]];
  const titles = heroes.map((h) => h[1]);
  for (const b of banners.filter((b) => b.isActive && !titles.includes(b.title))) await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: false });
  for (const [i, [img, title, lt, lv]] of heroes.entries()) {
    const ex = banners.find((b) => b.title === title);
    if (ex) await call('PATCH', `/banners/${ex.id}`, { title, imageId: media[img], linkType: lt, linkValue: lv, position: i, isActive: true });
    else await call('POST', '/banners', { title, imageId: media[img], linkType: lt, linkValue: lv, worldId: W, position: i, isActive: true });
  }

  const T = (img, lt, lv) => ({ title: '', titleEn: '', subtitleEn: '', imageId: media[img], linkType: lt, linkValue: lv });
  const mk = async (type, title, payload) => (await call('POST', '/home-blocks', { type, worldId: W, pageKey: 'HOME', title, payload, position: 99, isActive: true })).id;
  const banner = (img, lt, lv, aspect) => ({ type: 'CUSTOM_BANNER', title: '', payload: { source: 'inline', imageId: media[img], linkType: lt, linkValue: lv, bannerAspect: aspect, showTitle: false, showViewAll: false, sectionLayout: 'full' } });

  // 2 featured: house strips marquee + scent-family grid
  const featured = await mk('SECTION_GROUP', 'المميز', { backgroundColor: '#0E1622', paddingH: 0, paddingTop: 14, paddingBottom: 16, shadow: false, showTitle: false, pattern: 'none', titleEn: 'Featured',
    children: [
      { type: 'PHOTO_WALL', title: '', payload: { display: 'marquee', aspectRatio: '27:10', tilesPerView: 1.15, gap: 10, marqueeGap: 10, marqueeSpeed: 3, fullBleed: true, tileCornerRadius: 14, showShadow: false, showTitle: false, showViewAll: false, overlayStyle: 'none', borderStyle: 'none',
        items: [['W_chanel', 'chanel'], ['W_ysl', 'yves-saint-laurent'], ['W_armani', 'giorgio-armani'], ['W_versace', 'versace'], ['W_paco', 'paco-rabanne'], ['W_jpg', 'jean-paul-gaultier'], ['W_montblanc', 'montblanc'], ['W_boss', 'hugo-boss']].map(([i, s]) => T(i, 'brand', s)) } },
      { type: 'PHOTO_WALL', title: '', payload: { gap: 8, columns: 3, display: 'grid', aspectRatio: '1:1', showTitle: false, showShadow: false, showViewAll: false, overlayStyle: 'none', borderStyle: 'none', tileCornerRadius: 14,
        items: [['F_fresh', 'fresh', 'عطور منعشة'], ['F_woody', 'woody', 'عطور خشبية'], ['F_oud', 'oriental', 'عطور شرقية وعود'], ['F_leather', 'leather', 'عطور جلدية ودخانية'], ['F_citrus', 'citrus', 'عطور حمضية'], ['F_classic', 'classic', 'عطور كلاسيكية']]
          .map(([i, k, t]) => T(i, 'products', ids(k, t))) } },
    ] });

  // 3 category grid → new tiles
  const g = B('3e2f8c65'); const kn = ['K_men', 'K_unisex', 'K_care', 'K_oral'];
  await call('PATCH', `/home-blocks/${g.id}`, { payload: { ...g.payload, items: g.payload.items.map((it, i) => ({ ...it, title: '', titleEn: '', subtitle: '', subtitleEn: '', imageId: media[kn[i]] })) } });

  // 4 icons list + unisex film
  const ic = B('e5436a65'); await call('PATCH', `/home-blocks/${ic.id}`, { title: 'أيقونات العطور الرجالية', payload: { ...ic.payload, productIds: L.icons, limit: L.icons.length, titleEn: 'Iconic fragrances for him', showTitle: true } });
  const un = B('f4addf84'); await call('PATCH', `/home-blocks/${un.id}`, { payload: { ...un.payload, productIds: L.unisex, limit: L.unisex.length, showTitle: true } });

  // 5 houses wall → new posters
  const hw = B('f236602a');
  await call('PATCH', `/home-blocks/${hw.id}`, { payload: { ...hw.payload, items: [['P_dior', 'christian-dior'], ['P_chanel', 'chanel'], ['P_tomford', 'tom-ford'], ['P_ysl', 'yves-saint-laurent'], ['P_armani', 'giorgio-armani'],
    ['P_pdm', 'parfums-de-marly'], ['P_xerjoff', 'xerjoff'], ['P_jpg', 'jean-paul-gaultier'], ['P_montale', 'montale'], ['P_mancera', 'mancera']].map(([i, s]) => T(i, 'brand', s)) } });

  // 6 occasions group + budget strip
  const occ = await mk('SECTION_GROUP', 'عطرك حسب المناسبة', { backgroundColor: '#EDF0F4', paddingH: 0, paddingTop: 16, paddingBottom: 18, shadow: false, showTitle: false, pattern: 'none', titleEn: 'By occasion',
    children: [
      { type: 'PHOTO_WALL', title: 'عطرك حسب المناسبة', payload: { titleEn: 'Your scent for every occasion', subtitle: 'اختر المناسبة ونجهّزلك أنسب العطور', subtitleEn: 'Pick the moment, we pick the scents',
        display: 'scroll', aspectRatio: '4:5', tilesPerView: 1.7, gap: 10, tileCornerRadius: 16, showTitle: true, showViewAll: false, showShadow: false, overlayStyle: 'none', borderStyle: 'none',
        items: [['O_work', 'work', 'عطور العمل'], ['O_night', 'night', 'عطور السهرة'], ['O_summer', 'summer', 'عطور الصيف'], ['O_winter', 'winter', 'عطور الشتاء'], ['O_gift', 'gift', 'هدية تليق به']].map(([i, k, t]) => T(i, 'products', ids(k, t))) } },
      banner('S_budget', 'products', `subcategoryId=${MEN}&maxPrice=50000&title=${encodeURIComponent('عطور رجالية بأقل من ٥٠ ألف')}`, 3.84),
    ] });

  // 7 brand rooms
  const rooms = []; const hide = ['0642f187'];
  const room = async (title, en, tint, img, slug, listPayload) => rooms.push(await mk('SECTION_GROUP', title, { backgroundColor: tint, paddingH: 12, paddingTop: 18, paddingBottom: 16, shadow: false, showTitle: false, pattern: 'none', titleEn: en,
    children: [banner(img, 'brand', slug, 2.15), { type: 'PRODUCT_LIST', title: '', payload: { ...listPayload, showTitle: false, showViewAll: true } }] }));
  const fresh = async (slug, sub) => ({ filter: 'all', brandId: await brand(slug), ...(sub ? { subcategoryId: sub } : {}), limit: 14 });
  const old = (bk, lk) => { hide.push(bk, lk); return B(lk).payload; };
  await room('ديور', 'Dior', '#ECEFF3', 'R_dior', 'christian-dior', await fresh('christian-dior', MEN));
  await room('توم فورد', 'Tom Ford', '#F1EBE5', 'R_tomford', 'tom-ford', await fresh('tom-ford'));
  await room('بارفيوم دي مارلي', 'Parfums de Marly', '#EAF0EC', 'R_pdm', 'parfums-de-marly', old('bb16aef4', 'e8224ec3'));
  await room('جان بول غوتييه', 'Jean Paul Gaultier', '#EAEEF5', 'R_jpg', 'jean-paul-gaultier', old('adb30bf0', '3d4241fa'));
  await room('كسرجوف', 'Xerjoff', '#EEEBF4', 'R_xerjoff', 'xerjoff', old('02ddaab3', '80109d27'));
  await room('فيرساتشي', 'Versace', '#E8F0F4', 'R_versace', 'versace', await fresh('versace', MEN));
  await room('رابان', 'Rabanne', '#ECEAF4', 'R_paco', 'paco-rabanne', await fresh('paco-rabanne', MEN));
  await room('أمواج', 'Amouage', '#EAF0EC', 'R_amouage', 'amouage', old('398c7745', 'de523bbb'));
  await room('مانسيرا', 'Mancera', '#F3EAEC', 'R_mancera', 'mancera', old('a5530b6a', 'cc13a27f'));
  await room('مونتال', 'Montale', '#EEEDEC', 'R_montale', 'montale', old('4fd9d017', '2e7ada64'));
  await room('سوسبيرو', 'Sospiro', '#EAF0EC', 'R_sospiro', 'sospiro', old('c9262e3e', '591bf706'));
  const care = await mk('SECTION_GROUP', 'عناية الرجل', { backgroundColor: '#F4F0E9', paddingH: 12, paddingTop: 18, paddingBottom: 16, shadow: false, showTitle: false, pattern: 'none', titleEn: 'Grooming',
    children: [banner('R_care', 'products', ids('care', 'عناية الرجل'), 2.15), { type: 'PRODUCT_LIST', title: '', payload: { ...B('8f9a8a5f').payload, showTitle: false, showViewAll: true } }] });
  hide.push('c7f00c25', '8f9a8a5f');
  for (const k of hide) await call('PATCH', `/home-blocks/${B(k).id}`, { isActive: false });

  // 8 order
  const o = (k) => B(k).id;
  const order = [featured, o('3e2f8c65'), o('e5436a65'), o('f236602a'), occ, o('deb5a181'), o('f4addf84'), ...rooms, care, o('ea91dc1a'), o('b940ef0b')];
  for (const [i, id] of order.entries()) await call('PATCH', `/home-blocks/${id}`, { position: i });
  console.log('done', { featured, occ, rooms: rooms.length, order: order.length });
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
