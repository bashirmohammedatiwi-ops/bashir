export const SORT_OPTIONS = [
  { id: 'default', label: 'الافتراضي' },
  { id: 'name_asc', label: 'أ-ي' },
  { id: 'name_desc', label: 'ي-أ' },
  { id: 'price_asc', label: 'السعر ↑' },
  { id: 'price_desc', label: 'السعر ↓' },
];

export function priceOf(p) {
  const n = p.priceNumeric ?? Number(String(p.price || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function nameOf(p, bilingual = false) {
  if (bilingual) return (p.name || p.nameEn || '').trim();
  return (p.name || '').trim();
}

export function sortProducts(list, sort, { bilingual = false, sortLocale = 'ar' } = {}) {
  if (!sort || sort === 'default') return list;
  return [...list].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const diff = priceOf(a) - priceOf(b);
      return sort === 'price_asc' ? diff : -diff;
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      const diff = nameOf(a, bilingual).localeCompare(nameOf(b, bilingual), sortLocale, { sensitivity: 'base' });
      return sort === 'name_asc' ? diff : -diff;
    }
    return 0;
  });
}

export function bindSortPills(container, { getSort, onSort }) {
  container.querySelectorAll('.sort-pill').forEach((btn) => {
    btn.addEventListener('click', () => onSort(btn.dataset.sort));
  });
  return () => {
    container.querySelectorAll('.sort-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sort === getSort());
    });
  };
}

export function updateProgress({ loaded, total, labelEl, pctEl, fillEl }) {
  if (!total || total <= 0) return false;
  const pct = Math.min(100, Math.round((loaded / total) * 100));
  if (labelEl) labelEl.textContent = `${loaded.toLocaleString('ar-EG')} / ${total.toLocaleString('ar-EG')} منتج`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  return true;
}

export function brandInitial(name = '') {
  const t = String(name).trim();
  if (!t) return '?';
  const parts = t.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

export function renderBrandCard(brand, esc, biTitleFn, { numberLocale = 'ar-EG', productLabel = 'منتج' } = {}) {
  const logo = brand.image
    ? `<img src="${esc(brand.image)}" alt="" loading="lazy" decoding="async" />`
    : `<span class="brand-card-fallback">${esc(brandInitial(brand.name))}</span>`;
  const nameHtml = biTitleFn
    ? biTitleFn(brand.name, brand.nameEn || brand.name)
    : esc(brand.name);
  const count = brand.productCount
    ? `<div class="brand-card-count">${brand.productCount.toLocaleString(numberLocale)} ${productLabel}</div>`
    : '';
  return `
    <button type="button" class="brand-card" data-brand-id="${esc(brand.id)}" data-brand-name="${esc(brand.name)}" data-brand-name-en="${esc(brand.nameEn || '')}">
      <div class="brand-card-logo">${logo}</div>
      <div class="brand-card-name">${nameHtml}</div>
      ${count}
    </button>`;
}

export function renderBrandsGrid(brands, { esc, biTitleFn, onSelect, root, numberLocale, productLabel } = {}) {
  const cardOpts = { numberLocale, productLabel };
  root.innerHTML = brands.map((b) => renderBrandCard(b, esc, biTitleFn, cardOpts)).join('');
  root.querySelectorAll('.brand-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      onSelect({
        id: btn.dataset.brandId,
        name: btn.dataset.brandName,
        nameEn: btn.dataset.brandNameEn,
      });
    });
  });
}

export function filterBrands(brands, q) {
  const query = String(q || '').trim().toLowerCase();
  if (!query) return brands;
  return brands.filter((b) => {
    const hay = `${b.name} ${b.nameEn || ''}`.toLowerCase();
    return hay.includes(query);
  });
}

export function filterTree(nodes, q, nodeMatches) {
  if (!q) return nodes;
  const out = [];
  for (const node of nodes) {
    const kids = filterTree(node.children || [], q, nodeMatches);
    if (nodeMatches(node, q) || kids.length) {
      out.push({ ...node, children: kids, _forceOpen: true });
    }
  }
  return out;
}

export function shadeSwatchBackground(hex = '') {
  const h = String(hex || '').trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(h) ? h : '';
}

export function renderShadeSwatchMarkup(shade, esc, { imgExtra = '' } = {}) {
  const oos = shade.inStock === false;
  const hex = shadeSwatchBackground(shade.hex);
  const styleAttr = hex ? ` style="background:${esc(hex)}"` : '';
  if (shade.image) {
    return `<span class="shade-color-box${oos ? ' shade-oos' : ''}"${styleAttr} title="${esc(shade.name || '')}">
      <img src="${esc(shade.image)}" alt="${esc(shade.name || '')}" ${imgExtra} />
    </span>`;
  }
  if (hex) {
    return `<span class="shade-color-box${oos ? ' shade-oos' : ''}"${styleAttr} title="${esc(shade.name || '')}"></span>`;
  }
  return `<span class="shade-color-box shade-empty${oos ? ' shade-oos' : ''}" title="${esc(shade.name || '')}">—</span>`;
}

export function shadeSelectionLabelParts(shade) {
  const parts = [shade.name, shade.hex, shade.colorCode].filter(Boolean);
  const partsEn = [shade.nameEn, shade.hex, shade.colorCode].filter(Boolean);
  return { ar: parts.join(' · '), en: partsEn.join(' · ') };
}

/** تشغيل مهمة ثانوية بعد التحميل الأول دون إبطاء الواجهة */
export function deferIdle(fn, { timeout = 4000 } = {}) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout });
  } else {
    setTimeout(fn, Math.min(timeout, 800));
  }
}

/** إعادة جلب أعداد التصنيفات بعد إثرائها في الخلفية (الريان · وجوه) */
export function scheduleCategoryCountRefresh(fetchFn, onData, { delayMs = 14000 } = {}) {
  setTimeout(async () => {
    try {
      const data = await fetchFn();
      onData(data);
    } catch {
      /* تجاهل */
    }
  }, delayMs);
}
