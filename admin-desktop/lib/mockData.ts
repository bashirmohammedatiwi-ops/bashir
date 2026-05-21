// Mock data store for admin panel.
// Used as a fallback when the backend is unavailable.

type Record = { id: string; [k: string]: any };

const now = new Date().toISOString();

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const KEY = "alhayaa-mock-db";

interface MockDB {
  categories: Record[];
  brands: Record[];
  products: Record[];
  orders: Record[];
  packages: Record[];
  banners: Record[];
  coupons: Record[];
  homeBlocks: Record[];
  media: Record[];
  users: Record[];
}

const seedDB: MockDB = {
  categories: [
    { id: uid("cat"), name: "العناية بالبشرة", slug: "skincare", icon: "🧴", position: 0, isActive: true },
    { id: uid("cat"), name: "المكياج", slug: "makeup", icon: "💄", position: 1, isActive: true },
    { id: uid("cat"), name: "العطور", slug: "perfumes", icon: "🌸", position: 2, isActive: true },
    { id: uid("cat"), name: "العناية بالشعر", slug: "haircare", icon: "💁", position: 3, isActive: true },
    { id: uid("cat"), name: "العناية بالجسم", slug: "bodycare", icon: "🛁", position: 4, isActive: true },
  ],
  brands: [
    { id: uid("br"), name: "MAC", slug: "mac", initial: "M", isFeatured: true, position: 0 },
    { id: uid("br"), name: "Dior", slug: "dior", initial: "D", isFeatured: true, position: 1 },
    { id: uid("br"), name: "Chanel", slug: "chanel", initial: "C", isFeatured: true, position: 2 },
    { id: uid("br"), name: "L'Oreal", slug: "loreal", initial: "L", isFeatured: true, position: 3 },
    { id: uid("br"), name: "Maybelline", slug: "maybelline", initial: "M", isFeatured: false, position: 4 },
    { id: uid("br"), name: "NARS", slug: "nars", initial: "N", isFeatured: false, position: 5 },
    { id: uid("br"), name: "Huda Beauty", slug: "huda", initial: "H", isFeatured: true, position: 6 },
  ],
  products: Array.from({ length: 24 }).map((_, i) => ({
    id: uid("p"),
    sku: `SKU-${1000 + i}`,
    name: [
      "أحمر شفاه مات فاخر",
      "كريم أساس مرطب",
      "ماسكارا تكثيف الرموش",
      "عطر زهري شرقي",
      "كريم ليلي مغذي",
      "مسحوق برونزي",
      "أحمر خدود وردي",
      "محدد عيون أسود",
    ][i % 8] + ` — ${i + 1}`,
    brand: { id: "br_1", name: ["MAC", "Dior", "Chanel", "L'Oreal", "NARS"][i % 5] },
    category: { id: "cat_1", name: ["المكياج", "العطور", "العناية بالبشرة"][i % 3] },
    price: 25000 + (i % 7) * 8500,
    originalPrice: 35000 + (i % 7) * 9000,
    stock: (i % 5 === 0) ? 0 : 10 + (i * 3) % 90,
    isActive: i % 11 !== 0,
    rating: 3.8 + ((i * 17) % 13) / 10,
    soldCount: 50 + ((i * 23) % 500),
    createdAt: now,
  })),
  orders: Array.from({ length: 18 }).map((_, i) => ({
    id: uid("o"),
    orderNumber: `ORD-${100000 + i}`,
    user: { id: "u_1", name: `زبون ${i + 1}`, email: `client${i + 1}@mail.com` },
    total: 45000 + ((i * 12300) % 280000),
    status: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"][i % 6],
    itemsCount: 1 + (i % 5),
    createdAt: now,
  })),
  packages: [
    {
      id: uid("pk"),
      name: "باقة العروس الذهبية",
      itemsCount: 5,
      items: [{}, {}, {}, {}, {}],
      price: 185000,
      originalPrice: 245000,
      isActive: true,
    },
    {
      id: uid("pk"),
      name: "باقة العناية اليومية",
      itemsCount: 3,
      items: [{}, {}, {}],
      price: 95000,
      originalPrice: 125000,
      isActive: true,
    },
    {
      id: uid("pk"),
      name: "باقة عطور للهدية",
      itemsCount: 4,
      items: [{}, {}, {}, {}],
      price: 220000,
      originalPrice: 280000,
      isActive: false,
    },
  ],
  banners: [
    { id: uid("bn"), title: "تشكيلة الصيف الجديدة", subtitle: "خصومات تصل إلى 40%", ctaUrl: "/products?sale=1", position: 0, isActive: true },
    { id: uid("bn"), title: "عطور حصرية", subtitle: "وصلت حديثًا", ctaUrl: "/categories/perfumes", position: 1, isActive: true },
    { id: uid("bn"), title: "باقات هدايا", subtitle: "اختر هديتك المثالية", ctaUrl: "/packages", position: 2, isActive: true },
  ],
  coupons: [
    { id: uid("cp"), code: "WELCOME10", type: "PERCENT", amount: 10, isActive: true, usageLimit: 1000, usedCount: 124 },
    { id: uid("cp"), code: "SUMMER25", type: "PERCENT", amount: 25, isActive: true, usageLimit: 500, usedCount: 87 },
    { id: uid("cp"), code: "FREESHIP", type: "FIXED", amount: 5000, isActive: false, usageLimit: 200, usedCount: 200 },
  ],
  homeBlocks: [
    { id: uid("hb"), kind: "BANNERS", title: "البنرات الرئيسية", position: 0, isActive: true },
    { id: uid("hb"), kind: "CATEGORIES", title: "تسوق حسب الفئة", position: 1, isActive: true },
    { id: uid("hb"), kind: "FLASH_SALE", title: "تخفيضات لفترة محدودة", position: 2, isActive: true },
    { id: uid("hb"), kind: "BRANDS", title: "أبرز البراندات", position: 3, isActive: true },
    { id: uid("hb"), kind: "PACKAGES", title: "الباقات", position: 4, isActive: true },
    { id: uid("hb"), kind: "TRENDING", title: "الأكثر مبيعًا", position: 5, isActive: true },
  ],
  media: Array.from({ length: 8 }).map((_, i) => ({
    id: uid("m"),
    filename: `image_${i + 1}.webp`,
    purpose: ["PRODUCT", "BANNER", "GENERAL"][i % 3],
    bytes: 220000 + i * 30000,
    width: 1200,
    height: 1200,
    createdAt: now,
  })),
  users: [
    { id: "dev-admin", email: "admin@alhayaa.com", name: "Super Admin", role: "SUPER_ADMIN", isActive: true, loyaltyPoints: 0, _count: { orders: 0 } },
    { id: uid("u"), email: "sara@mail.com", name: "سارة أحمد", role: "CUSTOMER", isActive: true, loyaltyPoints: 5000, _count: { orders: 6 } },
    { id: uid("u"), email: "nour@mail.com", name: "نور حسين", role: "CUSTOMER", isActive: true, loyaltyPoints: 3200, _count: { orders: 4 } },
    { id: uid("u"), email: "layla@mail.com", name: "ليلى محمد", role: "CUSTOMER", isActive: true, loyaltyPoints: 1800, _count: { orders: 3 } },
  ],
};

function loadDB(): MockDB {
  if (typeof window === "undefined") return seedDB;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seedDB));
      return seedDB;
    }
    return JSON.parse(raw) as MockDB;
  } catch {
    return seedDB;
  }
}

function saveDB(db: MockDB) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(db));
  }
}

export const mockDB = {
  reset() {
    saveDB(seedDB);
    return seedDB;
  },
  read(): MockDB {
    return loadDB();
  },

  list<T extends keyof MockDB>(name: T): MockDB[T] {
    return loadDB()[name];
  },

  paginate<T extends keyof MockDB>(
    name: T,
    params: { page?: number; limit?: number; search?: string; status?: string },
  ) {
    const db = loadDB();
    let rows = db[name] as Record[];
    if (params.search) {
      const q = params.search.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((v) =>
          typeof v === "string" && v.toLowerCase().includes(q),
        ),
      );
    }
    if (params.status) {
      rows = rows.filter((r: any) => r.status === params.status);
    }
    const page = params.page ?? 1;
    const limit = params.limit ?? 15;
    const total = rows.length;
    const data = rows.slice((page - 1) * limit, page * limit);
    return { data, meta: { total, page, limit } };
  },

  create<T extends keyof MockDB>(name: T, payload: Partial<Record>): Record {
    const db = loadDB();
    const item = { id: uid(String(name).slice(0, 2)), createdAt: now, isActive: true, ...payload } as Record;
    (db[name] as Record[]).unshift(item);
    saveDB(db);
    return item;
  },

  update<T extends keyof MockDB>(name: T, id: string, patch: Partial<Record>): Record | null {
    const db = loadDB();
    const arr = db[name] as Record[];
    const idx = arr.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...patch };
    saveDB(db);
    return arr[idx];
  },

  remove<T extends keyof MockDB>(name: T, id: string): boolean {
    const db = loadDB();
    const arr = db[name] as Record[];
    const before = arr.length;
    db[name] = arr.filter((r) => r.id !== id) as any;
    saveDB(db);
    return arr.length !== before;
  },

  dashboard() {
    const db = loadDB();
    const last30Days = db.orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      kpi: {
        productsCount: db.products.filter((p) => p.isActive).length,
        ordersCount: db.orders.length,
        usersCount: db.users.length + 124,
        salesLast30Days: last30Days,
      },
      topProducts: [...db.products]
        .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
        .slice(0, 5),
      ordersByStatus: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
        (s) => ({
          status: s,
          count: db.orders.filter((o) => o.status === s).length,
        }),
      ),
      revenueByDay: Array.from({ length: 14 }).map((_, i) => ({
        day: `يوم ${i + 1}`,
        amount: 80000 + ((i * 37) % 250000),
      })),
    };
  },
};
