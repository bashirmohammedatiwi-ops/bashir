// طقوس العناية — إعادة ترتيب العالم بالتصاميم الجديدة + إعلان إيفولوديرم. يعمل داخل حاوية الـ API.
// node publish-care.js  (الصور والإعدادات في /tmp/care3)
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = 'http://127.0.0.1:3000/api/v1';
const DIR = '/tmp/care3';
const W = '2236ecab-86ab-443d-a7db-14971155838e';
const RB = '/data/uploads/care-redesign-rollback-2026-11-05.json';
const BF_END = '2026-11-28T20:59:59.000Z';
const AFTER_BF = '2026-11-28T21:00:00.000Z';
const C = JSON.parse(fs.readFileSync(`${DIR}/care3-config.json`, 'utf8'));
const TAG = 'CARE3';

(async () => {
  const a = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const tok = jwt.sign({ sub: a.id, role: a.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${tok}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => {
    const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    const t = await r.text();
    if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`);
    const j = JSON.parse(t || '{}');
    return j.data !== undefined ? j.data : j;
  };

  // 0) لقطة رجوع (مرة واحدة)
  const blocks = await prisma.homeBlock.findMany({ where: { worldId: W } });
  const banners = await prisma.banner.findMany({ where: { worldId: W } });
  if (!fs.existsSync(RB)) { fs.writeFileSync(RB, JSON.stringify({ at: new Date().toISOString(), blocks, banners })); console.log('rollback saved', RB); }
  const B = (k) => { const b = blocks.find((x) => x.id.startsWith(k)); if (!b) throw new Error('no block ' + k); return b; };

  // 1) رفع الصور
  const media = {};
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.jpg'))) {
    const k = f.replace('.jpg', ''); const name = `care-v3_${f}`;
    const ex = await prisma.media.findFirst({ where: { originalName: name }, select: { id: true } });
    if (ex) { media[k] = ex.id; continue; }
    const fd = new FormData(); fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${DIR}/${f}`)], { type: 'image/jpeg' }), name);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd }); const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[k] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('media', Object.keys(media).length);

  // البراندات الموجودة فقط
  const slugs = [...C.BRAND_CARDS.map((x) => x[1]), ...C.EVERGREEN.map((x) => x[2])];
  const have = new Set((await prisma.brand.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })).map((b) => b.slug));
  const missing = slugs.filter((s) => !have.has(s)); if (missing.length) console.log('missing brands (skipped):', [...new Set(missing)]);

  // 2) البنرات العلوية: إيفولوديرم أولاً، ثم الجمعة السوداء، ثم الدائمة الجديدة (تبدأ بعد 28/11)
  const upsertBanner = async (title, body) => {
    const ex = banners.find((b) => b.title === title);
    if (ex) { await call('PATCH', `/banners/${ex.id}`, { title, ...body }); return ex.id; }
    return (await call('POST', '/banners', { title, worldId: W, ...body })).id;
  };
  await upsertBanner('إيفولوديرم — الوكيل الحصري', { titleEn: `${TAG} Evoluderm`, imageId: media.h_evo, linkType: 'products', linkValue: C.EVO_LINK, position: 0, isActive: true, startsAt: null, endsAt: null });
  const bfHeroes = banners.filter((b) => b.isActive && b.endsAt && +new Date(b.endsAt) === +new Date(BF_END)).sort((x, y) => x.position - y.position);
  for (const [i, b] of bfHeroes.entries()) await call('PATCH', `/banners/${b.id}`, { title: b.title, position: 1 + i });
  let pos = 1 + bfHeroes.length;
  for (const [img, title, slug] of C.EVERGREEN) {
    if (!have.has(slug)) continue;
    await upsertBanner(title, { titleEn: `${TAG} ${slug}`, imageId: media[img], linkType: 'brand', linkValue: slug, position: pos++, isActive: true, startsAt: AFTER_BF, endsAt: null });
  }
  // البنرات الدائمة القديمة: حلّت محلها التصاميم الجديدة
  for (const b of banners.filter((b) => b.isActive && !b.endsAt && !(b.titleEn || '').startsWith(TAG) && b.title !== 'إيفولوديرم — الوكيل الحصري'))
    await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: false });
  console.log('banners: bf', bfHeroes.length, 'evergreen', pos - 1 - bfHeroes.length);

  // 3) الأقسام الجديدة
  const upsertBlock = async (type, title, payload) => {
    const ex = blocks.find((b) => b.type === type && b.title === title && String(b.payload?.titleEn || '').startsWith(TAG));
    const full = { ...payload, titleEn: `${TAG} ${payload.titleEn || ''}`.trim() };
    if (ex) { await call('PATCH', `/home-blocks/${ex.id}`, { title, payload: full, isActive: true }); return ex.id; }
    return (await call('POST', '/home-blocks', { type, worldId: W, pageKey: 'HOME', title, payload: full, position: 99, isActive: true })).id;
  };
  const common = { textEn: '', labelEn: '', subtitleEn: '' };
  const tiles = await upsertBlock('PHOTO_WALL', 'تسوّقي حسب الحاجة', { ...common, titleEn: 'Shop by need', subtitle: 'اختاري ما تبحثين عنه', display: 'grid', sectionLayout: 'grid3', aspectRatio: '1:1', gap: 8, tileCornerRadius: 14,
    showTitle: true, showViewAll: false, showShadow: false, overlayStyle: 'none', borderStyle: 'none',
    items: C.TILES.map(([k, lt, lv]) => ({ title: '', titleEn: '', subtitleEn: '', imageId: media[k], linkType: lt, linkValue: lv })) });

  const evo = await upsertBlock('SECTION_GROUP', 'عالم إيفولوديرم', { ...common, titleEn: 'Evoluderm world', backgroundColor: '#FFF1E2', paddingH: 12, paddingTop: 16, paddingBottom: 18, shadow: false, showTitle: false, pattern: 'none',
    children: [
      { type: 'CUSTOM_BANNER', title: '', payload: { source: 'inline', imageId: media.r_evo, linkType: 'products', linkValue: C.EVO_LINK, bannerAspect: 2.15, showTitle: false, showViewAll: false, sectionLayout: 'full', ...common, titleEn: '' } },
      { type: 'PHOTO_WALL', title: 'عالم إيفولوديرم', payload: { ...common, titleEn: 'Evoluderm world', subtitle: 'الوكيل الحصري في العراق • صُنع في فرنسا', display: 'scroll', aspectRatio: '4:5', tilesPerView: 1.6, gap: 10, tileCornerRadius: 16,
        showTitle: true, showViewAll: false, showShadow: false, overlayStyle: 'none', borderStyle: 'none',
        items: C.EVO_CARDS.map(([k, lt, lv]) => ({ title: '', titleEn: '', subtitleEn: '', imageId: media[k], linkType: lt, linkValue: lv })) } },
      { type: 'PRODUCT_LIST', title: 'الأكثر طلباً من إيفولوديرم', payload: { ...common, titleEn: 'Evoluderm favourites', productIds: C.evoIds, filter: 'all', sectionLayout: 'carousel', showTitle: true, showViewAll: false } },
    ] });

  const bfTop = await upsertBlock('PRODUCT_LIST', 'أقوى عروض الجمعة السوداء', { ...common, titleEn: 'Top Black Friday deals', subtitle: 'حتى 50% • في المحل وعلى التطبيق', productIds: C.bfIds, filter: 'promo', sectionLayout: 'carousel', showTitle: true, showViewAll: false, visibleUntil: BF_END });

  const brandsWall = await upsertBlock('PHOTO_WALL', 'أهم براندات العناية', { ...common, titleEn: 'Top care brands', subtitle: 'اضغطي على البراند لتشوفي كل منتجاته', display: 'scroll', aspectRatio: '4:5', tilesPerView: 1.6, gap: 10, tileCornerRadius: 16,
    showTitle: true, showViewAll: false, showShadow: false, overlayStyle: 'none', borderStyle: 'none',
    items: C.BRAND_CARDS.filter(([, s]) => have.has(s)).map(([k, s]) => ({ title: '', titleEn: '', subtitleEn: '', imageId: media[k], linkType: 'brand', linkValue: s })) });
  console.log('blocks', { tiles, evo, bfTop, brandsWall });

  // 4) إيفولوديرم أول شعار في «براندات العناية»
  const fb = B('d1539da4');
  const ids = [C.EVO_BRAND, ...(fb.payload.brandIds || []).filter((x) => x !== C.EVO_BRAND)];
  await call('PATCH', `/home-blocks/${fb.id}`, { payload: { ...fb.payload, brandIds: ids } });

  // 5) إيقاف القديم: بنرات 20% المنتهية، سوق البراندات القديم، البلاطات والقوائم المكررة
  const off = ['61655900', '1ba18f7e', 'f16d03f4', 'd167462c', 'bc180389', '4e8a4306', '226df278', '2fb079fd', 'be34b7ed'];
  for (const k of off) { const b = B(k); if (b.isActive) await call('PATCH', `/home-blocks/${b.id}`, { isActive: false }); }

  // 6) الترتيب
  const now = await prisma.homeBlock.findMany({ where: { worldId: W, pageKey: 'HOME', isActive: true }, orderBy: { position: 'asc' }, select: { id: true, type: true, title: true, payload: true } });
  const strips = now.filter((b) => b.type === 'PROMO_STRIP').map((b) => b.id); // الجمعة السوداء + الأصلي العائد بعدها
  const bfGroups = now.filter((b) => b.type === 'SECTION_GROUP' && String(b.payload?.titleEn || '').startsWith('BF2026')).map((b) => b.id);
  const o = (k) => B(k).id;
  const head = [...strips, tiles, evo, bfTop, brandsWall, o('f7b79d64'), ...bfGroups, o('934d2533'), o('52b267e3'), o('d5ad12d2'), o('67ebe29f'), o('da34a3f8'), o('3929c1d6'), o('5bfd6dd1')];
  const rest = now.map((b) => b.id).filter((id) => !head.includes(id) && id !== fb.id);
  const order = [...head.filter((id) => now.some((b) => b.id === id)), ...rest, fb.id];
  await call('POST', '/home-blocks/reorder', { ids: order });
  console.log('order', order.length, 'rest', rest.length);

  fs.writeFileSync('/data/uploads/care-redesign-created-2026-11-05.json', JSON.stringify({ media, tiles, evo, bfTop, brandsWall, order }, null, 1));
  await prisma.$disconnect();
  console.log('done');
  process.exit(0);
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
