import { DiscountType, PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/** حساب الأدمن فقط — يُشغَّل عند RUN_SEED=1 أو reset-admin */
async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

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

  // إعدادات المتجر الأساسية مرة واحدة فقط — بدون بيانات تجريبية
  await prisma.setting.upsert({
    where: { key: "store" },
    update: {},
    create: {
      key: "store",
      value: {
        storeName: "الحياة",
        currency: "د.ع",
        whatsapp: "",
        taxPercent: 0,
        shippingFee: 5000,
        freeShippingThreshold: 50000,
        cashOnDelivery: true,
        emailOrders: adminEmail,
        pickupEnabled: false,
        pickupAddress: "",
        pickupHours: "",
      },
    },
  });

  console.log("Admin ready:", admin.email);
  return admin;
}

/**
 * بيانات تجريبية للاختبار المحلي فقط.
 * لا تُشغَّل إلا صراحةً: SEED_DEMO=1
 */
async function seedDemoData() {
  const customerHash = await bcrypt.hash("Customer@123", 10);

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
    { parent: "makeup", name: "أحمر شفاه", slug: "makeup-lipstick", position: 0 },
    { parent: "makeup", name: "أساس", slug: "makeup-foundation", position: 1 },
    { parent: "perfumes", name: "نسائي", slug: "perfumes-women", position: 0 },
    { parent: "haircare", name: "شامبو", slug: "haircare-shampoo", position: 0 },
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

  const productDefs = [
    {
      sku: "MAC-LIP-001",
      slug: "mac-ruby-woo",
      name: "MAC Ruby Woo",
      nameAr: "ماك روبي وو",
      brandId: brandMap.mac,
      categoryId: catMap.makeup,
      price: 35000,
      stock: 40,
    },
    {
      sku: "DIOR-FND-001",
      slug: "dior-forever",
      name: "Dior Forever Foundation",
      nameAr: "ديور فورايفر فاونديشن",
      brandId: brandMap.dior,
      categoryId: catMap.makeup,
      price: 85000,
      stock: 25,
    },
    {
      sku: "LOR-SER-001",
      slug: "loreal-revitalift",
      name: "L'Oreal Revitalift Serum",
      nameAr: "لوريال ريفيتاليفت سيروم",
      brandId: brandMap.loreal,
      categoryId: catMap.skincare,
      price: 28000,
      stock: 60,
    },
  ];

  for (const p of productDefs) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        nameAr: p.nameAr,
        brandId: p.brandId,
        categoryId: p.categoryId,
        price: p.price,
        stock: p.stock,
        isActive: true,
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        nameAr: p.nameAr,
        description: "",
        brandId: p.brandId,
        categoryId: p.categoryId,
        price: p.price,
        stock: p.stock,
        isActive: true,
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
      minOrder: 20000,
      isActive: true,
    },
  });

  const existingCare = await prisma.homeBlock.count({
    where: { title: "تسوّق حسب مشكلتك" },
  });
  if (existingCare === 0) {
    await prisma.homeBlock.createMany({
      data: [
        {
          type: "SKIN_CONCERNS",
          title: "تسوّق حسب مشكلتك",
          position: 20,
          isActive: true,
          payload: { display: "circles", maxItems: 10, showTitle: true },
        },
        {
          type: "ROUTINE_CAROUSEL",
          title: "روتينك اليومي",
          position: 21,
          isActive: true,
          payload: { kind: "both", limit: 8, showViewAll: true, showTitle: true },
        },
      ],
    });
  }

  console.log("Demo seed completed:", {
    customers: customers.length,
    brands: brands.length,
    products: productDefs.length,
  });
}

async function main() {
  const admin = await ensureAdmin();

  // بيانات الاختبار فقط عند الطلب الصريح — لا تُعاد عند إعادة البناء
  if (process.env.SEED_DEMO === "1") {
    console.log("SEED_DEMO=1 — inserting demo/test data...");
    await seedDemoData();
  } else {
    console.log("Seed completed (admin only). Demo data skipped (set SEED_DEMO=1 to enable).");
  }

  console.log("Done:", { admin: admin.email, demo: process.env.SEED_DEMO === "1" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
