/** جمع معرّفات التصنيف مع كل الفروع (لجلب منتجات الشجرة كاملة) */
export function collectDescendantIds(node) {
  if (!node) return [];
  const ids = [node.id];
  for (const child of node.children || []) {
    ids.push(...collectDescendantIds(child));
  }
  return ids;
}

export function findCategoryNode(all = [], categoryId) {
  return all.find((c) => String(c.id) === String(categoryId)) || null;
}

/** تطبيق أعداد المنتجات المحسوبة على عقد الشجرة */
export function applyProductCounts(all = [], countMap) {
  for (const node of all) {
    const n = countMap.get(String(node.id));
    if (n != null) node.productCount = n;
  }
}

export async function mapPool(items = [], fn, concurrency = 8) {
  const results = new Map();
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      results.set(String(item.id), await fn(item));
    }
  });
  await Promise.all(workers);
  return results;
}
