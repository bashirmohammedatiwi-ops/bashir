import {
  DiscountType,
  HomeBlockType,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), 30, 0, 0);
  return d;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const customerHash = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: Role.SUPER_ADMIN, isActive: true },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });

  const customers = await Promise.all(
    [
      { email: "sara@mail.com", name: "سارة أحمد", phone: "+9647701111111" },
      { email: "nour@mail.com", name: "نور حسين", phone: "+9647702222222" },
      { email: "layla@mail.com", name: "ليلى محمد", phone: "+9647703333333" },
    ].map((c) =>
      prisma.user.upsert({
        where: { email: c.email },
        update: { name: c.name, phone: c.phone },
        create: {
          ...c,
          passwordHash: customerHash,
          role: Role.CUSTOMER,
          loyaltyPoints: 5000,
        },
      }),
    ),
  );

  const categories = [
    { name: "العناية بالبشرة", slug: "skincare", icon: "🧴", position: 0 },
    { name: "المكياج", slug: "makeup", icon: "💄", position: 1 },
    { name: "العطور", slug: "perfumes", icon: "🌸", position: 2 },
    { name: "العناية بالشعر", slug: "haircare", icon: "💁‍♀️", position: 3 },
    { name: "العناية بالجسم", slug: "bodycare", icon: "🛁", position: 4 },
  ];
  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    catMap[c.slug] = row.id;
  }

  const subcategories: { parent: string; name: string; slug: string; position: number }[] = [
    { parent: "skincare", name: "غسول وجه", slug: "skincare-cleanser", position: 0 },
    { parent: "skincare", name: "مرطب", slug: "skincare-moisturizer", position: 1 },
    { parent: "skincare", name: "سيروم", slug: "skincare-serum", position: 2 },
    { parent: "skincare", name: "واقي شمس", slug: "skincare-sunscreen", position: 3 },
    { parent: "makeup", name: "أحمر شفاه", slug: "makeup-lipstick", position: 0 },
    { parent: "makeup", name: "أساس", slug: "makeup-foundation", position: 1 },
    { parent: "makeup", name: "ماسكارا", slug: "makeup-mascara", position: 2 },
    { parent: "makeup", name: "ظلال عيون", slug: "makeup-eyeshadow", position: 3 },
    { parent: "perfumes", name: "نسائي", slug: "perfumes-women", position: 0 },
    { parent: "perfumes", name: "رجالي", slug: "perfumes-men", position: 1 },
    { parent: "haircare", name: "شامبو", slug: "haircare-shampoo", position: 0 },
    { parent: "haircare", name: "بلسم", slug: "haircare-conditioner", position: 1 },
    { parent: "bodycare", name: "مرطب جسم", slug: "bodycare-lotion", position: 0 },
  ];
  for (const sub of subcategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, parentId: catMap[sub.parent], position: sub.position },
      create: {
        name: sub.name,
        slug: sub.slug,
        parentId: catMap[sub.parent],
        position: sub.position,
        isActive: true,
      },
    });
  }

  const brands = [
    { name: "MAC", slug: "mac", initial: "M", isFeatured: true, position: 0 },
    { name: "Dior", slug: "dior", initial: "D", isFeatured: true, position: 1 },
    { name: "Chanel", slug: "chanel", initial: "C", isFeatured: true, position: 2 },
    { name: "L'Oreal", slug: "loreal", initial: "L", isFeatured: true, position: 3 },
    { name: "Maybelline", slug: "maybelline", initial: "M", isFeatured: false, position: 4 },
  ];
  const brandMap: Record<string, string> = {};
  for (const b of brands) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
    brandMap[b.slug] = row.id;
  }

  const brandCollections = [
    { brand: "mac", name: "Studio Fix", slug: "studio-fix", position: 0 },
    { brand: "mac", name: "Lipstick", slug: "lipstick", position: 1 },
    { brand: "dior", name: "J'adore", slug: "jadore", position: 0 },
    { brand: "dior", name: "Backstage", slug: "backstage", position: 1 },
    { brand: "chanel", name: "N°5", slug: "no5", position: 0 },
    { brand: "loreal", name: "Revitalift", slug: "revitalift", position: 0 },
    { brand: "maybelline", name: "Fit Me", slug: "fit-me", position: 0 },
  ];
  for (const col of brandCollections) {
    const brandId = brandMap[col.brand];
    if (!brandId) continue;
    await prisma.brandCollection.upsert({
      where: { brandId_slug: { brandId, slug: col.slug } },
      update: { name: col.name, position: col.position },
      create: {
        brandId,
        name: col.name,
        slug: col.slug,
        position: col.position,
        isActive: true,
      },
    });
  }

  await prisma.setting.upsert({
    where: { key: "store" },
    update: {},
    create: {
      key: "store",
      value: {
        storeName: "الحياة",
        currency: "د.ع",
        whatsapp: "+9647700000000",
        taxPercent: 0,
        shippingFee: 5000,
        freeShippingThreshold: 50000,
        cashOnDelivery: true,
        emailOrders: "orders@alhayaa.com",
      },
    },
  });

  const productDefs = [
    { sku: "SKU-1001", name: "أحمر شفاه مات فاخر", slug: "matte-lipstick", brand: "mac", cat: "makeup", price: 35000, orig: 42000, stock: 45, sold: 128, featured: true, new: true, tags: ["شفاه", "مات"] },
    { sku: "SKU-1002", name: "كريم أساس مرطب", slug: "hydrating-foundation", brand: "dior", cat: "makeup", price: 68000, orig: 75000, stock: 30, sold: 95, featured: true, tags: ["أساس", "مرطب"] },
    { sku: "SKU-1003", name: "ماسكارا تكثيف الرموش", slug: "volume-mascara", brand: "maybelline", cat: "makeup", price: 22000, orig: 28000, stock: 60, sold: 210, best: true, tags: ["رموش"] },
    { sku: "SKU-1004", name: "عطر زهري شرقي", slug: "floral-oriental-perfume", brand: "chanel", cat: "perfumes", price: 185000, orig: 210000, stock: 15, sold: 42, featured: true, tags: ["عطر", "زهري"] },
    { sku: "SKU-1005", name: "كريم ليلي مغذي", slug: "night-cream", brand: "loreal", cat: "skincare", price: 45000, orig: 52000, stock: 40, sold: 78, new: true, tags: ["كريم", "ليل"] },
    { sku: "SKU-1006", name: "مسحوق برونزي", slug: "bronzer-powder", brand: "mac", cat: "makeup", price: 38000, orig: 42000, stock: 25, sold: 56, tags: ["برونزر"] },
    { sku: "SKU-1007", name: "سيروم فيتامين C", slug: "vitamin-c-serum", brand: "loreal", cat: "skincare", price: 52000, orig: 60000, stock: 35, sold: 134, best: true, promo: true, tags: ["سيروم"] },
    { sku: "SKU-1008", name: "شampoo ترميم الشعر", slug: "repair-shampoo", brand: "loreal", cat: "haircare", price: 28000, orig: 32000, stock: 50, sold: 89, tags: ["شampoo"] },
    { sku: "SKU-1009", name: "لوشن مرطب للجسم", slug: "body-lotion", brand: "dior", cat: "bodycare", price: 42000, orig: 48000, stock: 28, sold: 67, tags: ["جسم"] },
    { sku: "SKU-1010", name: "باليت ظلال العيون", slug: "eyeshadow-palette", brand: "mac", cat: "makeup", price: 75000, orig: 85000, stock: 20, sold: 103, featured: true, tags: ["ظلال"] },
    { sku: "SKU-1011", name: "تونر منعش", slug: "refresh-toner", brand: "loreal", cat: "skincare", price: 32000, orig: 38000, stock: 55, sold: 45, tags: ["تونر"] },
    { sku: "SKU-1012", name: "عطر musk فاخر", slug: "luxury-musk", brand: "dior", cat: "perfumes", price: 195000, orig: 220000, stock: 12, sold: 38, best: true, tags: ["musk"] },
  ];

  const productMap: Record<string, string> = {};
  for (const p of productDefs) {
    const row = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        price: p.price,
        originalPrice: p.orig,
        stock: p.stock,
        soldCount: p.sold,
        isFeatured: !!p.featured,
        isNew: !!p.new,
        isBestSeller: !!p.best,
        isPromo: !!p.promo,
      },
      create: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: `${p.name} — منتج تجميل فاخر من متجر الحياة`,
        price: p.price,
        originalPrice: p.orig,
        discountPercent: Math.round(((p.orig - p.price) / p.orig) * 100),
        stock: p.stock,
        soldCount: p.sold,
        rating: 4.2 + Math.random() * 0.6,
        reviewCount: 5 + Math.floor(Math.random() * 20),
        isFeatured: !!p.featured,
        isNew: !!p.new,
        isBestSeller: !!p.best,
        isPromo: !!p.promo,
        brandId: brandMap[p.brand],
        categoryId: catMap[p.cat],
        tags: JSON.stringify(p.tags),
        skinType: JSON.stringify(["جميع الأنواع"]),
        shades: p.cat === "makeup" && p.slug.includes("lipstick")
          ? {
              create: [
                { name: "وردي", colorHex: "#E91E63", position: 0 },
                { name: "أحمر", colorHex: "#C62828", position: 1 },
                { name: "نude", colorHex: "#D7A58F", position: 2 },
              ],
            }
          : undefined,
      },
    });
    productMap[p.sku] = row.id;
  }

  for (const [i, customer] of customers.entries()) {
    await prisma.address.upsert({
      where: { id: `seed-addr-${i}` },
      update: {},
      create: {
        id: `seed-addr-${i}`,
        userId: customer.id,
        fullName: customer.name ?? "عميل",
        phone: customer.phone ?? "+9647700000000",
        city: "بغداد",
        governorate: "بغداد",
        area: "الكرادة",
        street: `شارع ${i + 1}`,
        house: `بناية ${i + 1}، طابق 2`,
        isDefault: true,
      },
    });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: { in: customers.map((c) => c.id) } },
  });

  const statuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ];

  const skus = Object.keys(productMap);
  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length];
    const addr = addresses.find((a) => a.userId === customer.id);
    const sku = skus[i % skus.length];
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) continue;
    const qty = 1 + (i % 3);
    const subtotal = product.price * qty;
    const shipping = subtotal >= 50000 ? 0 : 5000;
    const total = subtotal + shipping;
    const orderNumber = `ORD-SEED-${1000 + i}`;
    const status = statuses[i % statuses.length];

    await prisma.order.upsert({
      where: { orderNumber },
      update: { status, total, subtotal, shippingTotal: shipping },
      create: {
        orderNumber,
        userId: customer.id,
        addressId: addr?.id,
        status,
        paymentStatus: status === OrderStatus.CANCELLED ? PaymentStatus.PENDING : PaymentStatus.PAID,
        paymentMethod: PaymentMethod.COD,
        subtotal,
        shippingTotal: shipping,
        total,
        createdAt: daysAgo(13 - (i % 14)),
        items: {
          create: [{
            productId: product.id,
            quantity: qty,
            unitPrice: product.price,
            totalPrice: subtotal,
            productName: product.name,
            productSku: product.sku,
          }],
        },
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: DiscountType.PERCENT,
      value: 10,
      minOrder: 30000,
      isActive: true,
    },
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE5000" },
    update: {},
    create: {
      code: "SAVE5000",
      type: DiscountType.AMOUNT,
      value: 5000,
      minOrder: 50000,
      isActive: true,
    },
  });

  await prisma.banner.deleteMany({ where: { title: { startsWith: "SEED:" } } });
  await prisma.banner.createMany({
    data: [
      { title: "SEED: عروض الربيع", subtitle: "خصم حتى 30%", tag: "جديد", ctaLabel: "تسوق الآن", link: "/products", position: 0, isActive: true },
      { title: "SEED: مجموعة العطور", subtitle: "هدايا فاخرة", tag: "مميز", ctaLabel: "اكتشف", link: "/perfumes", position: 1, isActive: true },
      { title: "SEED: العناية بالبشرة", subtitle: "منتجات مختارة", ctaLabel: "عرض الكل", link: "/skincare", position: 2, isActive: true },
    ],
  });

  const pkgProducts = skus.slice(0, 3).map((s) => productMap[s]);
  const existingPkg = await prisma.package.findFirst({ where: { name: "باقة العروس الذهبية" } });
  if (!existingPkg) {
    await prisma.package.create({
      data: {
        name: "باقة العروس الذهبية",
        subtitle: "5 منتجات فاخرة",
        price: 185000,
        originalPrice: 245000,
        badge: "الأكثر مبيعاً",
        isFeatured: true,
        position: 0,
        items: { create: pkgProducts.map((pid, i) => ({ productId: pid, position: i })) },
      },
    });
  }

  const blockCount = await prisma.homeBlock.count();
  if (blockCount === 0) {
    await prisma.homeBlock.createMany({
      data: [
        { type: HomeBlockType.HERO_BANNER, title: "مرحباً بكم في الحياة", position: 0, payload: { bannerIds: [] }, isActive: true },
        { type: HomeBlockType.CATEGORY_GRID, title: "تسوق حسب الفئة", position: 1, payload: {}, isActive: true },
        { type: HomeBlockType.PRODUCT_LIST, title: "الأكثر مبيعاً", subtitle: "منتجات مختارة", position: 2, payload: { filter: "bestSeller" }, isActive: true },
        { type: HomeBlockType.FEATURED_BRANDS, title: "براندات مميزة", position: 3, payload: {}, isActive: true },
        { type: HomeBlockType.FLASH_SALE, title: "عروض سريعة", position: 4, payload: { endsAt: null }, isActive: true },
      ],
    });
  }

  const lipstickId = productMap["SKU-1001"];
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0 && lipstickId) {
    await prisma.review.createMany({
      data: [
        { productId: lipstickId, userId: customers[0].id, userName: "سارة", rating: 5, comment: "لون رائع وثبات ممتاز", approved: true },
        { productId: lipstickId, userName: "مريم", rating: 4.5, comment: "جودة عالية", approved: true },
        { productId: productMap["SKU-1007"], userName: "زينب", rating: 4, comment: "نتائج جيدة بعد أسبوع", approved: false },
      ],
    });
  }

  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        { type: NotificationType.OFFER, title: "خصم 20% على المكياج", body: "استخدمي كود WELCOME10", userId: null },
        { type: NotificationType.NEW_ARRIVAL, title: "وصل حديثاً", body: "تشكيلة العطور الجديدة متوفرة الآن", userId: null },
        { type: NotificationType.ORDER, title: "تحديث طلب", body: "طلبك قيد التحضير", userId: customers[0].id },
      ],
    });
  }

  const loyaltyCount = await prisma.loyaltyHistory.count();
  if (loyaltyCount === 0) {
    for (const c of customers) {
      await prisma.loyaltyHistory.createMany({
        data: [
          { userId: c.id, title: "نقاط ترحيب", points: 100, isEarned: true },
          { userId: c.id, title: "شراء منتجات", points: 250, isEarned: true },
        ],
      });
    }
  }

  console.log("Seed completed:", {
    admin: admin.email,
    products: productDefs.length,
    customers: customers.length,
    orders: 18,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
