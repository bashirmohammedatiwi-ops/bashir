// Black Friday 2026 — نشر التصاميم في التطبيق: عوالم + تبويب العروض. يعمل داخل حاوية الـ API.
// node publish.js  (الصور في /tmp/bf/*.jpg)
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = 'http://127.0.0.1:3000/api/v1';
const DIR = '/tmp/bf';
const RB = '/data/uploads/bf-2026-11-rollback.json';
const STARTS = new Date().toISOString();
const ENDS = '2026-11-28T20:59:59.000Z'; // نهاية 28/11 بتوقيت بغداد
const WORLD = { care: '2236ecab-86ab-443d-a7db-14971155838e', beauty: '0c6628d2-926e-45ef-8a76-1731a40a490f' };
const TAG = 'BF2026'; // في titleEn لكل ما نُضيفه — لتنظيفه بعد العرض

// كل عرض: البراند، تصفية لقطة الـ POS، النسبة
const OFFERS = {
  lierac_50: { brand: 'lierac', offer: 'ليراك.*50', pct: 50 },
  lierac_25: { brand: 'lierac', offer: 'ليراك.*25', pct: 25 },
  phyto_50: { brand: 'phyto', offer: 'فيتو.*50', pct: 50 },
  phyto_25: { brand: 'phyto', offer: 'فيتو black friday 25', pct: 25 },
  phyto_19: { brand: 'phyto', offer: 'اصباغ فيتو', pct: 19 },
  bioderma_50: { brand: 'bioderma', offer: 'بايوديرما.*50', pct: 50 },
  bioderma_15: { brand: 'bioderma', offer: 'بايوديرما.*15', pct: 15 },
  bioderma_10: { brand: 'bioderma', offer: 'بايوديرما.*10', pct: 10 },
  deborah_50: { brand: 'brand-1784986563282', offer: 'ديبورا black friday 50', pct: 50 },
  deborah_30: { brand: 'brand-1784986563282', offer: 'ديبورا black friday 30', pct: 30 },
  dermolab_40: { brand: 'dermolab', offer: 'كريمات ديبورا 40', pct: 40 },
  revox_40: { brand: 'revox', offer: 'ريفوكس', pct: 40 },
  beesline_50: { brand: 'beesline', offer: 'بزلاين.*50', pct: 50, storeOffer: 'بيزلين — الجمعة السوداء 50%' },
  beesline_30: { brand: 'beesline', offer: 'بزلاين.*30', pct: 30, storeOffer: 'بيزلين — الجمعة السوداء 30%' },
  rybella_40: { brand: 'rybella', pct: 40, byDiscount: true },
};

// المجموعات حسب البراند: [عنوان، عنوان إنجليزي، العروض بالترتيب، لون الخلفية]
const GROUPS = {
  lierac: ['ليراك — الجمعة السوداء', 'Lierac — Black Friday', ['lierac_50', 'lierac_25'], '#F1ECE4'],
  phyto: ['فيتو — الجمعة السوداء', 'Phyto — Black Friday', ['phyto_50', 'phyto_25', 'phyto_19'], '#EEF0EA'],
  bioderma: ['بيوديرما — الجمعة السوداء', 'Bioderma — Black Friday', ['bioderma_50', 'bioderma_15', 'bioderma_10'], '#EAF1F6'],
  beesline: ['بيزلين — الجمعة السوداء', 'Beesline — Black Friday', ['beesline_50', 'beesline_30'], '#F6EFDF'],
  revox: ['ريفوكس — الجمعة السوداء', 'Revox — Black Friday', ['revox_40'], '#EFF0F1'],
  dermolab: ['ديرمولاب — الجمعة السوداء', 'Dermolab — Black Friday', ['dermolab_40'], '#EBEFF7'],
  deborah: ['ديبورا — الجمعة السوداء', 'Deborah — Black Friday', ['deborah_50', 'deborah_30'], '#F6ECE8'],
  rybella: ['ريبيلا — الجمعة السوداء', 'Rybella — Black Friday', ['rybella_40'], '#F8E9F0'],
};
const BRAND_SLUG = { lierac: 'lierac', phyto: 'phyto', bioderma: 'bioderma', beesline: 'beesline', revox: 'revox', dermolab: 'dermolab', deborah: 'brand-1784986563282', rybella: 'rybella' };
const BRAND_AR = { lierac: 'ليراك', phyto: 'فيتو', bioderma: 'بيوديرما', beesline: 'بيزلين', revox: 'ريفوكس', dermolab: 'ديرمولاب', deborah: 'ديبورا', rybella: 'ريبيلا' };
const IMG_OF = (offer) => `o_${offer}`;

const HEROES = {
  care: [['hero_lierac', 'lierac'], ['hero_bioderma', 'bioderma'], ['hero_phyto', 'phyto'], ['hero_beesline', 'beesline'], ['o_revox_40', 'revox'], ['o_dermolab_40', 'dermolab']],
  beauty: [['hero_deborah', 'deborah'], ['o_rybella_40', 'rybella']],
};

(async () => {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null } });
  const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_ACCESS_SECRET || 'access', { expiresIn: '1h' });
  const H = { Authorization: `Bearer ${token}`, 'X-SSR': 'deema-web' };
  const call = async (m, p, b) => {
    const r = await fetch(API + p, { method: m, headers: { ...H, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    const t = await r.text();
    if (!r.ok) throw new Error(`${m} ${p} ${r.status} ${t.slice(0, 300)}`);
    const j = JSON.parse(t || '{}');
    return j.data !== undefined ? j.data : j;
  };

  const brands = Object.fromEntries((await prisma.brand.findMany({ where: { slug: { in: Object.values(BRAND_SLUG) } }, select: { id: true, slug: true } })).map((b) => [b.slug, b.id]));
  const promoQuery = (g) => `brandId=${brands[BRAND_SLUG[g]]}&isPromo=1&title=${encodeURIComponent('عروض ' + BRAND_AR[g] + ' — الجمعة السوداء')}`;

  // 0) لقطة رجوع (مرة واحدة)
  if (!fs.existsSync(RB)) {
    fs.writeFileSync(RB, JSON.stringify({
      at: new Date().toISOString(),
      blocks: await prisma.homeBlock.findMany({ where: { OR: [{ worldId: { in: Object.values(WORLD) } }, { pageKey: 'OFFERS' }] } }),
      banners: await prisma.banner.findMany({ where: { worldId: { in: Object.values(WORLD) } } }),
    }));
    console.log('rollback saved', RB);
  }

  // 1) منتجات العروض: تفعيل المتوفر الذي له صورة حقيقية
  const offerProducts = {};
  for (const [key, o] of Object.entries(OFFERS)) {
    let rows;
    if (o.byDiscount) {
      rows = await prisma.$queryRawUnsafe(
        `select p.id, p."isActive", p.stock from "Product" p join "Brand" b on b.id=p."brandId" where b.slug=$1 and p."discountPercent" between $2 and $3`,
        o.brand, o.pct - 1, o.pct + 1);
    } else {
      rows = await prisma.$queryRawUnsafe(
        `select distinct p.id, p."isActive", p.stock from "Product" p join "Brand" b on b.id=p."brandId"
           left join "InventorySyncSnapshot" s on s.barcode=p.barcode
           left join "ProductShade" sh on sh."productId"=p.id
           left join "InventorySyncSnapshot" s2 on s2.barcode=sh.barcode
           left join "ProductOffer" po on po.id=p."offerId"
         where b.slug=$1 and ((s."offerName" ~* $2 and s."discountPercent">0) or (s2."offerName" ~* $2 and s2."discountPercent">0) or ($3::text is not null and po.name=$3))`,
        o.brand, o.offer, o.storeOffer ?? null);
    }
    offerProducts[key] = rows;
  }
  const toActivate = [...new Set(Object.values(offerProducts).flat().filter((p) => !p.isActive && p.stock > 0).map((p) => p.id))];
  const withImg = toActivate.length
    ? (await prisma.$queryRawUnsafe(
        `select distinct i."productId" id from "ProductImage" i join "Media" m on m."id"=i."mediaId" where i."productId" = any($1::text[]) and coalesce(m."originalName",'') not ilike '%placeholder%'`, toActivate)).map((r) => r.id)
    : [];
  const prevState = await prisma.product.findMany({ where: { id: { in: withImg } }, select: { id: true, isActive: true } });
  const rbData = JSON.parse(fs.readFileSync(RB, 'utf8'));
  if (!rbData.activated) { rbData.activated = prevState.map((p) => p.id); fs.writeFileSync(RB, JSON.stringify(rbData)); }
  if (withImg.length) await prisma.product.updateMany({ where: { id: { in: withImg } }, data: { isActive: true } });
  console.log('activated', withImg.length, 'of', toActivate.length, 'inactive in-stock');

  // قوائم كل عرض: المفعّل، المتوفر أولاً
  const lists = {};
  for (const key of Object.keys(OFFERS)) {
    const ids = offerProducts[key].map((p) => p.id);
    const live = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true, stock: true, soldCount: true }, orderBy: [{ stock: 'desc' }] });
    lists[key] = [...live.filter((p) => p.stock > 0), ...live.filter((p) => p.stock <= 0)].slice(0, 24).map((p) => p.id);
    console.log('list', key, lists[key].length);
  }

  // 2) رفع الصور
  const media = {};
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.jpg'))) {
    const k = f.replace('.jpg', '');
    const name = `bf26-${f}`;
    const ex = await prisma.media.findFirst({ where: { originalName: name }, select: { id: true } });
    if (ex) { media[k] = ex.id; continue; }
    const fd = new FormData();
    fd.append('purpose', 'BANNER');
    fd.append('file', new Blob([fs.readFileSync(`${DIR}/${f}`)], { type: 'image/jpeg' }), name);
    const r = await fetch(API + '/media/upload', { method: 'POST', headers: H, body: fd });
    const t = await r.text();
    if (!r.ok) throw new Error('upload ' + f + ' ' + t.slice(0, 200));
    media[k] = (JSON.parse(t).data || JSON.parse(t)).id;
  }
  console.log('media', Object.keys(media).length);

  // 3) البنرات العلوية: الجمعة السوداء أولاً (تنتهي وحدها)، والقديمة بعدها
  for (const [world, heroes] of Object.entries(HEROES)) {
    const worldId = WORLD[world];
    const existing = await prisma.banner.findMany({ where: { worldId }, orderBy: { position: 'asc' } });
    for (const [i, [img, g]] of heroes.entries()) {
      const title = `${BRAND_AR[g]} — الجمعة السوداء`;
      const body = { title, titleEn: `${TAG} ${g}`, imageId: media[img], linkType: 'products', linkValue: promoQuery(g), worldId, position: i, isActive: true, startsAt: STARTS, endsAt: ENDS };
      const ex = existing.find((b) => b.title === title);
      if (ex) await call('PATCH', `/banners/${ex.id}`, body);
      else await call('POST', '/banners', body);
    }
    let pos = heroes.length;
    for (const b of existing.filter((b) => b.isActive && !(b.titleEn || '').startsWith(TAG))) {
      // بنر بيزلين القديم «20%» يناقض العرض الجديد
      if (b.title === 'سيرومات بيزلين بخصم 20%') { await call('PATCH', `/banners/${b.id}`, { title: b.title, isActive: false }); continue; }
      await call('PATCH', `/banners/${b.id}`, { title: b.title, position: pos++ });
    }
    console.log('heroes', world, heroes.length);
  }

  // 4) مجموعات البراندات (بنر لكل عرض + منتجاته)
  const groupPayload = (g) => {
    const [, en, offers, bg] = GROUPS[g];
    const children = [];
    for (const key of offers) {
      if (!lists[key].length) continue;
      children.push({ type: 'CUSTOM_BANNER', title: '', titleEn: '', payload: { source: 'inline', imageId: media[IMG_OF(key)], linkType: 'products', linkValue: promoQuery(g),
        showTitle: false, showViewAll: false, bannerAspect: 2.15, sectionLayout: 'full', textEn: '', labelEn: '', titleEn: '', subtitleEn: '' } });
      children.push({ type: 'PRODUCT_LIST', title: '', titleEn: '', payload: { productIds: lists[key], filter: 'promo', showTitle: false, showViewAll: false, sectionLayout: 'carousel', textEn: '', labelEn: '', titleEn: '', subtitleEn: '' } });
    }
    return { titleEn: `${TAG} ${en}`, showTitle: false, shadow: false, pattern: 'none', paddingH: 12, paddingTop: 18, paddingBottom: 16, backgroundColor: bg, children, textEn: '', labelEn: '', subtitleEn: '' };
  };
  const upsertGroup = async (g, scope) => {
    const title = GROUPS[g][0];
    const where = scope.worldId ? { worldId: scope.worldId, pageKey: 'HOME' } : { pageKey: 'OFFERS', worldId: null };
    const ex = await prisma.homeBlock.findFirst({ where: { ...where, type: 'SECTION_GROUP', title } });
    const payload = groupPayload(g);
    if (ex) { await call('PATCH', `/home-blocks/${ex.id}`, { payload, isActive: true }); return ex.id; }
    return (await call('POST', '/home-blocks', { type: 'SECTION_GROUP', title, payload, position: 0, isActive: true, pageKey: scope.worldId ? 'HOME' : 'OFFERS', ...(scope.worldId ? { worldId: scope.worldId } : {}) })).id;
  };
  const place = async (scopeWhere, newIds, afterCount) => {
    const blocks = await prisma.homeBlock.findMany({ where: { ...scopeWhere, isActive: true }, orderBy: { position: 'asc' }, select: { id: true } });
    const rest = blocks.map((b) => b.id).filter((id) => !newIds.includes(id));
    const order = [...rest.slice(0, afterCount), ...newIds, ...rest.slice(afterCount)];
    await call('POST', '/home-blocks/reorder', { ids: order });
  };

  const care = [];
  for (const g of ['lierac', 'bioderma', 'phyto', 'beesline', 'revox', 'dermolab']) care.push(await upsertGroup(g, { worldId: WORLD.care }));
  await place({ worldId: WORLD.care, pageKey: 'HOME' }, care, 2); // بعد الشريط وسوق البراندات
  const beauty = [];
  for (const g of ['deborah', 'rybella']) beauty.push(await upsertGroup(g, { worldId: WORLD.beauty }));
  await place({ worldId: WORLD.beauty, pageKey: 'HOME' }, beauty, 1); // بعد «المميز»
  const offersTab = [];
  for (const g of ['lierac', 'bioderma', 'deborah', 'rybella', 'phyto', 'beesline', 'revox', 'dermolab']) offersTab.push(await upsertGroup(g, {}));
  // قسما بيزلين السابقان في تبويب العروض صار مكانهما مجموعة بيزلين
  for (const b of await prisma.homeBlock.findMany({ where: { pageKey: 'OFFERS', type: 'PRODUCT_LIST', title: { startsWith: 'بيزلين — خصم' }, isActive: true } }))
    await call('PATCH', `/home-blocks/${b.id}`, { isActive: false });
  await place({ pageKey: 'OFFERS', worldId: null }, offersTab, 0);
  console.log('groups', { care: care.length, beauty: beauty.length, offers: offersTab.length });

  // 5) شريط العروض في العالمين: «حتى 20%» صار الجمعة السوداء حتى 50%
  const strips = await prisma.homeBlock.findMany({ where: { worldId: { in: Object.values(WORLD) }, type: 'PROMO_STRIP', isActive: true } });
  for (const s of strips) {
    const p = s.payload || {};
    if (!/20\s*[%٪]/.test(p.text || '')) continue;
    const text = 'الجمعة السوداء • خصومات حتى 50% حتى 28 تشرين الثاني • أصلي 100٪ • توصيل لكل العراق';
    const textEn = 'Black Friday • Up to 50% off until 28 November • 100% authentic • Delivery across Iraq';
    await call('PATCH', `/home-blocks/${s.id}`, { title: text, payload: { ...p, text, textEn, backgroundColor: '#141216', textColor: '#F3DFA8' } });
    console.log('strip updated', s.id.slice(0, 8));
  }

  fs.writeFileSync('/data/uploads/bf-2026-11-created.json', JSON.stringify({ media, care, beauty, offersTab, lists }, null, 1));
  await prisma.$disconnect();
  console.log('done');
  process.exit(0);
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
