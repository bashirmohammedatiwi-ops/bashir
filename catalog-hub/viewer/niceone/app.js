import {
  sortProducts,
  bindSortPills,
  updateProgress,
  renderBrandsGrid,
  filterBrands,
  filterTree,
  deferIdle,
  renderShadeSwatchMarkup,
  shadeSelectionLabelParts,
} from '../shared/store-ui.js';
import { hubApi, fixHubAssetUrl, initHubLinks } from '../shared/catalog-hub-base.js';

const API = hubApi('/api');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  categories: { tree: [], leaves: [] },
  catalogOverview: null,
  brands: [],
  currentSlug: null,
  currentPath: '',
  currentPathEn: '',
  isSearch: false,
  isBrand: false,
  isFullCatalog: false,
  currentBrandId: null,
  searchQuery: '',
  page: 1,
  hasMore: false,
  products: [],
  loading: false,
  loadingAll: false,
  sort: 'default',
  totalCount: null,
  catFilter: '',
  brandFilter: '',
  sidebarTab: 'categories',
  fetchAbort: null,
};

const PAGE_SIZE = 100;

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fixImageUrl(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return fixHubAssetUrl(u);
}

function biText(ar, en, { block = true, fallback = '' } = {}) {
  const a = String(ar ?? '').trim();
  const e = String(en ?? '').trim();
  if (!a && !e) return fallback;
  if (!e || e === a) return esc(a || e);
  if (!a) return `<span class="bi-en" dir="ltr">${esc(e)}</span>`;
  if (!block) return `<span class="bi-inline"><span class="bi-ar">${esc(a)}</span><span class="bi-sep"> · </span><span class="bi-en" dir="ltr">${esc(e)}</span></span>`;
  return `<span class="bi-block"><span class="bi-ar">${esc(a)}</span><span class="bi-en" dir="ltr">${esc(e)}</span></span>`;
}

function biTitle(ar, en) {
  return biText(ar, en, { block: true });
}

async function api(path, options = {}, { timeoutMs = 90000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...options, signal: controller.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('انتهت مهلة الاتصال — تأكد أن السيرفر يعمل');
    if (err instanceof TypeError) throw new Error('تعذّر الاتصال بالسيرفر — شغّل npm start');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function enrichListBarcodes() {
  const ids = state.products.map((p) => p.id).filter(Boolean);
  if (!ids.length) return;
  try {
    const { barcodes } = await api(`${API}/products/barcodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, deep: false }),
    });
    let changed = false;
    state.products = state.products.map((p) => {
      const info = barcodes[p.id];
      if (!info || info.error) return p;
      const next = { ...p };
      if (info.barcode) next.barcode = info.barcode;
      if (info.stats) next.barcodeStats = info.stats;
      if (info.hasOptions && !info.barcode && info.productEan) next.barcode = info.productEan;
      changed = true;
      return next;
    });
    if (changed) updateUI();
  } catch {
    /* optional */
  }
}

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  if (!$('#productPanel').classList.contains('open')) {
    $('#overlay').classList.remove('show');
  }
}

function openSidebar() {
  $('#sidebar').classList.add('open');
  $('#overlay').classList.add('show');
}

function renderCategoryNode(node, depth = 0) {
  const active = state.currentSlug === node.slug && !state.isBrand && !state.isSearch && !state.isFullCatalog ? ' active' : '';
  const hasKids = (node.children || []).length > 0;
  const openClass = node._forceOpen || depth < 1 ? ' open' : '';
  const count = node.productCount ? ` <span class="cat-count">(${node.productCount.toLocaleString('ar-SA')})</span>` : '';
  const link = `<a class="cat-link${node.isLeaf ? ' leaf' : ' parent'}${active}" data-slug="${esc(node.slug)}" data-path="${esc(node.path)}" data-path-en="${esc(node.pathEn || '')}" style="--depth:${depth}">${biText(node.name, node.nameEn)}${count}</a>`;
  if (!hasKids) return link;
  const toggle = `<button type="button" class="cat-toggle${openClass}" data-toggle aria-label="طي/فتح">▾</button>`;
  const children = (node.children || []).map((c) => renderCategoryNode(c, depth + 1)).join('');
  return `<div class="cat-group${openClass}"><div class="cat-row">${toggle}${link}</div><div class="cat-children">${children}</div></div>`;
}

function nodeMatchesFilter(node, q) {
  const hay = `${node.name} ${node.nameEn || ''} ${node.path || ''} ${node.pathEn || ''}`.toLowerCase();
  return hay.includes(q);
}

function renderCategoryTree() {
  const container = $('#catTree');
  const q = state.catFilter.trim().toLowerCase();
  const tree = filterTree(state.categories.tree, q, nodeMatchesFilter);
  if (!state.categories.tree.length) {
    container.innerHTML = '<div class="loading-tree">لا توجد تصنيفات</div>';
    return;
  }
  if (!tree.length) {
    container.innerHTML = '<div class="loading-tree">لا توجد تصنيفات مطابقة</div>';
    return;
  }
  container.innerHTML = tree.map((n) => renderCategoryNode(n)).join('');
  container.querySelectorAll('[data-slug]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      loadCategory(el.dataset.slug, el.dataset.path, el.dataset.pathEn);
      closeSidebar();
    });
  });
  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.cat-group')?.classList.toggle('open');
    });
  });
}

function renderBrandsPanels() {
  const brands = filterBrands(state.brands, state.brandFilter);
  const opts = {
    esc,
    biTitleFn: biTitle,
    onSelect: (b) => loadBrand(b.id, b.name, b.nameEn),
    numberLocale: 'ar-SA',
  };
  const emptyMsg = '<div class="brands-loading">لا توجد علامات</div>';
  if ($('#sidebarBrands')) {
    if (!brands.length) $('#sidebarBrands').innerHTML = emptyMsg;
    else renderBrandsGrid(brands, { ...opts, root: $('#sidebarBrands') });
  }
  if ($('#welcomeBrands')) {
    if (!brands.length) $('#welcomeBrands').innerHTML = emptyMsg;
    else renderBrandsGrid(brands.slice(0, 24), { ...opts, root: $('#welcomeBrands') });
    if ($('#welcomeBrandsCount')) {
      $('#welcomeBrandsCount').textContent = brands.length ? `${brands.length} علامة` : '';
    }
  }
}

async function loadBrands() {
  if (state.brands.length) return renderBrandsPanels();
  [$('#sidebarBrands'), $('#welcomeBrands')].filter(Boolean).forEach((el) => {
    el.innerHTML = '<div class="brands-loading">جاري تحميل العلامات...</div>';
  });
  try {
    const data = await api(`${API}/brands`);
    state.brands = data.brands || [];
    renderBrandsPanels();
  } catch (err) {
    [$('#sidebarBrands'), $('#welcomeBrands')].filter(Boolean).forEach((el) => {
      el.innerHTML = `<div class="brands-loading">خطأ: ${esc(err.message)}</div>`;
    });
  }
}

function setSidebarTab(tab) {
  state.sidebarTab = tab;
  $$('.sidebar-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
  $('#sidebarCategoriesPanel')?.classList.toggle('hidden', tab !== 'categories');
  $('#sidebarBrandsPanel')?.classList.toggle('hidden', tab !== 'brands');
  if (tab === 'brands') loadBrands();
}

function updateSortPills() {
  $$('#sortPills .sort-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sort === state.sort);
  });
  const hint = $('#sortHint');
  if (hint) {
    hint.textContent = state.sort !== 'default' && state.products.length ? 'الترتيب يطبّق على المنتجات المحمّلة' : '';
  }
}

function refreshProgressBar() {
  const shown = updateProgress({
    loaded: state.products.length,
    total: state.totalCount,
    labelEl: $('#progressLabel'),
    pctEl: $('#progressPct'),
    fillEl: $('#progressFill'),
  });
  $('#progressWrap')?.classList.toggle('hidden', !shown);
}

function displayBarcode(item) {
  const bc = item?.barcode || item?.ean || '';
  return bc && bc !== 'Array' && /^\d{8,14}$/.test(String(bc)) ? String(bc) : '';
}

function barcodeLine(p) {
  const bc = displayBarcode(p);
  return bc ? `باركود: ${esc(bc)}` : '';
}

function renderProductCard(p) {
  const badge = p.hasOptions
    ? '<span class="card-badge">درجات لون</span>'
    : p.tag?.text
      ? `<span class="card-badge" style="background:${esc(p.tag.background_color || '#c2185b')}">${esc(p.tag.text)}</span>`
      : '';
  let barcodeMeta = '';
  if (p.barcode) {
    barcodeMeta = `باركود: ${esc(p.barcode)}`;
  } else if (p.hasOptions && p.barcodeStats) {
    const { withEan, total } = p.barcodeStats;
    barcodeMeta = withEan ? `باركود: ${withEan}/${total} درجة` : 'SKU لكل درجة';
  } else if (p.hasOptions) {
    barcodeMeta = 'جاري جلب الباركود...';
  }
  const meta = [p.sku && `SKU: ${esc(p.sku)}`, barcodeMeta].filter(Boolean).join(' · ');
  const brand = biText(p.manufacturer, p.manufacturerEn, { block: false });
  return `
    <article class="card" data-id="${esc(p.id)}">
      <div class="card-img">
        ${badge}
        <img src="${esc(fixHubAssetUrl(p.thumb))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
      </div>
      <div class="card-body">
        <div class="card-brand">${brand}</div>
        <h3 class="card-name">${biTitle(p.name, p.nameEn)}</h3>
        <div class="card-price">${esc(p.price)}</div>
        ${meta ? `<div class="card-meta">${meta}</div>` : ''}
      </div>
    </article>`;
}

function updateUI() {
  const grid = $('#grid');
  const welcome = $('#welcome');
  const toolbar = $('#catalogToolbar');
  const loadWrap = $('#loadMoreWrap');
  const status = $('#statusMsg');

  if (!state.currentSlug && !state.isSearch && !state.isBrand && !state.isFullCatalog) {
    welcome.classList.remove('hidden');
    grid.innerHTML = '';
    toolbar?.classList.add('hidden');
    loadWrap.classList.add('hidden');
    status.classList.add('hidden');
    $('#pageTitle').textContent = 'اختر تصنيفاً';
    $('#pageStats').textContent = '';
    return;
  }

  welcome.classList.add('hidden');
  toolbar?.classList.remove('hidden');
  updateSortPills();
  refreshProgressBar();

  $('#pageTitle').innerHTML = biTitle(state.currentPath, state.currentPathEn);
  const stats = [];
  if (state.products.length) stats.push(`${state.products.length.toLocaleString('ar-SA')} محمّل`);
  if (state.totalCount) stats.push(`${state.totalCount.toLocaleString('ar-SA')} إجمالي`);
  $('#pageStats').textContent = stats.join(' · ');

  if (state.loading && !state.products.length) {
    grid.innerHTML = Array(12).fill('<div class="skeleton"></div>').join('');
    status.classList.add('hidden');
    loadWrap.classList.add('hidden');
    return;
  }

  if (!state.products.length && !state.loading) {
    grid.innerHTML = '';
    status.textContent = 'لا توجد منتجات';
    status.classList.remove('hidden');
    loadWrap.classList.add('hidden');
    return;
  }

  status.classList.add('hidden');
  grid.innerHTML = sortProducts(state.products, state.sort, { bilingual: true }).map(renderProductCard).join('');
  grid.querySelectorAll('.card').forEach((el) => {
    el.addEventListener('click', () => openProduct(el.dataset.id));
  });

  loadWrap.classList.toggle('hidden', !state.hasMore && !state.loadingAll);
  $('#loadMoreBtn').disabled = state.loading || state.loadingAll;
  $('#loadAllBtn') && ($('#loadAllBtn').disabled = state.loading || state.loadingAll);
  $('#loadMoreBtn').textContent = state.loading
    ? 'جاري التحميل...'
    : `تحميل المزيد${state.totalCount ? ` (${state.products.length}/${state.totalCount})` : ''}`;
  if ($('#loadAllBtn')) {
    $('#loadAllBtn').textContent = state.loadingAll
      ? `جاري جلب الكل... ${state.products.length}${state.totalCount ? `/${state.totalCount}` : ''}`
      : `تحميل الكل${state.totalCount ? ` (${state.totalCount})` : ''}`;
  }
}

async function fetchProductsPage(page, append = false) {
  state.loading = true;
  updateUI();

  try {
    let data;
    const params = new URLSearchParams({ page, limit: PAGE_SIZE, sort: state.sort });
    if (state.isSearch) {
      data = await api(`${API}/search?${params}&q=${encodeURIComponent(state.searchQuery)}`);
    } else if (state.isBrand) {
      data = await api(`${API}/brands/${encodeURIComponent(state.currentBrandId)}/products?${params}`);
    } else {
      data = await api(`${API}/categories/${encodeURIComponent(state.currentSlug)}/products?${params}`);
    }

    state.page = page;
    state.hasMore = data.hasMore;
    state.totalCount = data.meta?.totalCount ?? state.totalCount;
    state.products = append ? [...state.products, ...data.products] : data.products;
    if (data.meta?.path) state.currentPath = data.meta.path;
    if (data.meta?.pathEn) state.currentPathEn = data.meta.pathEn;
  } catch (err) {
    $('#statusMsg').textContent = `خطأ: ${err.message}`;
    $('#statusMsg').classList.remove('hidden');
  } finally {
    state.loading = false;
    updateUI();
    renderCategoryTree();
    enrichListBarcodes();
  }
}

async function fetchCategoryAllServer(slug) {
  state.loadingAll = true;
  state.isFullCatalog = false;
  updateUI();
  try {
    const params = new URLSearchParams({ all: '1', limit: PAGE_SIZE, sort: state.sort });
    const data = await api(`${API}/categories/${encodeURIComponent(slug)}/products?${params}`, {}, { timeoutMs: 600000 });
    state.products = data.products || [];
    state.totalCount = data.meta?.totalCount ?? state.products.length;
    state.hasMore = false;
    state.page = 1;
    if (data.meta?.path) state.currentPath = data.meta.path;
    if (data.meta?.pathEn) state.currentPathEn = data.meta.pathEn;
  } catch (err) {
    $('#statusMsg').textContent = `خطأ: ${err.message}`;
    $('#statusMsg').classList.remove('hidden');
  } finally {
    state.loadingAll = false;
    updateUI();
    enrichListBarcodes();
  }
}

async function loadAllPages() {
  if (state.loading || state.loadingAll || !state.hasMore) {
    if (state.currentSlug && !state.isSearch && !state.isBrand) {
      return fetchCategoryAllServer(state.currentSlug);
    }
    return;
  }
  state.loadingAll = true;
  updateUI();
  try {
    while (state.hasMore && !state.loading) {
      await fetchProductsPage(state.page + 1, true);
      if (!state.hasMore) break;
    }
  } finally {
    state.loadingAll = false;
    updateUI();
  }
}

async function consumeCatalogSse(url, onEvent, signal) {
  const res = await fetch(url, { headers: { Accept: 'text/event-stream' }, signal });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = 'message';
  let dataLines = [];

  const flush = () => {
    if (!dataLines.length) { eventName = 'message'; return; }
    const raw = dataLines.join('\n');
    dataLines = [];
    const name = eventName;
    eventName = 'message';
    if (!raw || raw.startsWith(':')) return;
    try { onEvent(name, JSON.parse(raw)); } catch { /* skip */ }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('event:')) { flush(); eventName = line.slice(6).trim(); }
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      else if (line.trim() === '') flush();
    }
  }
  flush();
}

async function loadEntireCatalog() {
  state.fetchAbort?.abort();
  const controller = new AbortController();
  state.fetchAbort = controller;

  state.isFullCatalog = true;
  state.isSearch = false;
  state.isBrand = false;
  state.currentSlug = 'catalog';
  state.currentPath = 'كل المنتجات';
  state.currentPathEn = 'All Products';
  state.products = [];
  state.totalCount = null;
  state.hasMore = false;
  state.loadingAll = true;
  updateUI();
  closeSidebar();

  try {
    await consumeCatalogSse(`${API}/catalog/stream`, (type, data) => {
      if (type === 'progress' && data.uniqueTotal != null) {
        state.totalCount = Math.max(state.totalCount || 0, data.uniqueTotal);
        refreshProgressBar();
        $('#pageStats').textContent = `${state.products.length.toLocaleString('ar-SA')} محمّل · جاري الجلب...`;
      }
      if (type === 'batch' && data.products?.length) {
        state.products = [...state.products, ...data.products];
        updateUI();
      }
      if (type === 'done') {
        state.totalCount = data.total ?? state.products.length;
        state.hasMore = false;
      }
      if (type === 'error') throw new Error(data.error || 'فشل جلب الكatalog');
    }, controller.signal);
    enrichListBarcodes();
  } catch (err) {
    if (err?.name !== 'AbortError') {
      $('#statusMsg').textContent = `خطأ: ${err.message}`;
      $('#statusMsg').classList.remove('hidden');
    }
  } finally {
    state.loadingAll = false;
    updateUI();
  }
}

function resetCatalogState() {
  state.page = 1;
  state.products = [];
  state.totalCount = null;
  state.hasMore = false;
  state.isFullCatalog = false;
  state.fetchAbort?.abort();
}

function loadCategory(slug, path, pathEn = '') {
  state.currentSlug = slug;
  state.currentPath = path;
  state.currentPathEn = pathEn;
  state.isSearch = false;
  state.isBrand = false;
  state.isFullCatalog = false;
  state.currentBrandId = null;
  state.searchQuery = '';
  state.sort = 'default';
  $('#globalSearch').value = '';
  resetCatalogState();
  fetchProductsPage(1);
}

function loadBrand(id, name, nameEn = '') {
  state.isBrand = true;
  state.isSearch = false;
  state.currentBrandId = id;
  state.currentSlug = null;
  state.currentPath = `علامة: ${name}`;
  state.currentPathEn = `Brand: ${nameEn || name}`;
  state.searchQuery = '';
  state.sort = 'default';
  $('#globalSearch').value = '';
  resetCatalogState();
  fetchProductsPage(1);
  closeSidebar();
}

function runSearch(query) {
  const q = query.trim();
  if (!q) return;
  state.isSearch = true;
  state.isBrand = false;
  state.searchQuery = q;
  state.currentSlug = 'search';
  state.currentPath = `بحث: ${q}`;
  state.currentPathEn = `Search: ${q}`;
  state.currentBrandId = null;
  resetCatalogState();
  fetchProductsPage(1);
  closeSidebar();
}

function isEan(value) {
  const s = String(value ?? '').trim();
  return s && s !== 'Array' && /^\d{8,14}$/.test(s);
}

function shadeEan(shade) {
  if (isEan(shade?.ean)) return shade.ean;
  if (isEan(shade?.barcode) && shade.barcodeSource && shade.barcodeSource !== 'sku') return shade.barcode;
  return '';
}

function shadeStatsLabel(shades = []) {
  const withEan = shades.filter((s) => shadeEan(s)).length;
  const total = shades.length;
  if (!total) return '';
  if (withEan === total) return `${total} درجة · باركود EAN لكل الدرجات`;
  if (withEan) return `${withEan}/${total} درجة بباركود EAN`;
  return `${total} درجة · SKU متاح`;
}

function barcodeSourceLabel(source) {
  const map = {
    image: 'من صورة الدرجة',
    option_fetch: 'من تفاصيل الدرجة (API)',
    product_image: 'من صورة المنتج',
    list: 'من قائمة ISBN',
    variant: 'من بيانات الدرجة',
    attributes: 'من المواصفات',
    product: 'باركود المنتج',
    upcitemdb: 'قاعدة UPCitemdb',
    upcitemdb_sku: 'UPCitemdb (SKU)',
    openbeautyfacts: 'Open Beauty Facts',
    external: 'بحث خارجي',
    sku: 'SKU (لا يوجد EAN منفصل)',
    none: '',
  };
  return map[source] || '';
}

function metaRow(label, value, attrs = '') {
  if (value === undefined || value === null || value === '') return '';
  const isLink = attrs.includes('data-link');
  const isHtml = isLink || (typeof value === 'string' && /<[a-z][\s\S]*>/i.test(value));
  const valHtml = isHtml
    ? value
    : `<code${attrs ? ` ${attrs}` : ''}>${esc(value)}</code>`;
  return `<div class="p-meta-row"><span>${esc(label)}</span><span class="p-meta-val">${valHtml}</span></div>`;
}

function barcodeMetaRows(product, shade = null) {
  const target = shade || product;
  const barcode = displayBarcode(target) || displayBarcode(product);
  const categoryHtml = product.category
    ? biText(product.category, product.categoryEn, { block: false })
    : '';
  return [
    metaRow('رقم المنتج', product.id),
    shade ? metaRow('التدرج اللوني', biText(shade.name, shade.nameEn, { block: false })) : '',
    shade?.hex ? metaRow('كود اللون', shade.hex, 'dir="ltr"') : '',
    metaRow('SKU', shade?.sku || product.sku),
    metaRow('الباركود', barcode || 'غير متوفر', barcode ? 'data-barcode' : ''),
    metaRow('المخزون', shade?.inStock === false ? 'غير متوفر' : (shade?.quantity ?? product.quantity ?? 'متوفر')),
    categoryHtml ? metaRow('التصنيف', categoryHtml) : '',
  ].join('');
}

function renderShadeSwatch(shade) {
  return renderShadeSwatchMarkup(shade, esc);
}

function renderShadeCard(s, active) {
  const nameHtml = biTitle(s.name, s.nameEn);
  const ean = shadeEan(s);
  const title = `${(s.name || s.nameEn || s.sku || '').trim()}${ean ? ' — ' + ean : ''}`;
  return `
    <div class="shade-item${active ? ' active' : ''}${s.inStock === false ? ' out-of-stock' : ''}" data-option="${esc(s.optionId)}" role="button" tabindex="0" title="${esc(title)}">
      ${renderShadeSwatch(s)}
      <div class="shade-value">${nameHtml}</div>
      ${s.hex ? `<div class="shade-hex-code" dir="ltr">${esc(s.hex)}</div>` : ''}
      ${ean ? `<div class="shade-code shade-ean" dir="ltr" title="باركود EAN">${esc(ean)}</div>` : ''}
    </div>`;
}

function applyShadeSelection(product, shades, shade) {
  const ean = shadeEan(shade);
  const productEan = isEan(shade.productEan) ? shade.productEan : isEan(product.barcode) ? product.barcode : '';
  const sourceHint = ean ? barcodeSourceLabel(shade.barcodeSource) : '';
  const grid = $('#shadesGrid');
  if (grid) {
    grid.querySelectorAll('.shade-item').forEach((c) => c.classList.remove('active'));
    grid.querySelector(`.shade-item[data-option="${shade.optionId}"]`)?.classList.add('active');
  }

  const labelParts = shadeSelectionLabelParts(shade);
  const selectedLabel = $('#shadeSelectedName');
  if (selectedLabel) {
    selectedLabel.innerHTML = biText(
      labelParts.ar,
      labelParts.en !== labelParts.ar ? labelParts.en : '',
      { block: false, fallback: '—' },
    );
  }

  if (shade.image) $('#mainImg').src = shade.image;
  if (shade.price) $('#panelPrice').textContent = shade.price;
  $('#metaGrid').innerHTML = barcodeMetaRows(product, shade);

  const imgs = shade.images?.length ? shade.images : [shade.image, ...(shade.additionalImages || [])].filter(Boolean);
  $('#shadeDetail').innerHTML = `
    <div class="shade-detail">
      <div class="shade-detail-swatch">${renderShadeSwatch(shade)}</div>
      <div class="shade-detail-text">
        <strong>${biTitle(shade.name, shade.nameEn)}</strong>
        ${shade.hex ? `<div class="shade-detail-hex">اللون: <code dir="ltr">${esc(shade.hex)}</code></div>` : ''}
        <div>السعر: ${esc(shade.price || '—')}</div>
        <div>SKU: <code dir="ltr">${esc(shade.sku || '—')}</code></div>
        ${ean ? `<div>باركود EAN: <code dir="ltr">${esc(ean)}</code></div>` : ''}
        ${!ean && productEan ? `<div>باركود المنتج: <code dir="ltr">${esc(productEan)}</code></div>` : ''}
        ${sourceHint ? `<div class="shade-source-hint">${esc(sourceHint)}</div>` : ''}
        <div>المخزون: ${esc(shade.inStock === false ? 'غير متوفر' : (shade.quantity ?? product.quantity ?? 'متوفر'))}</div>
      </div>
      ${imgs.length > 1 ? `<div class="shade-detail-gallery">${imgs.map((u) => `<img src="${esc(u)}" alt="" data-zoom="${esc(u)}" />`).join('')}</div>` : ''}
    </div>`;
  $('#shadeDetail').querySelectorAll('[data-zoom]').forEach((img) => {
    img.addEventListener('click', () => { $('#mainImg').src = img.dataset.zoom; });
  });
}

function renderProductPanel(product, shades, activeShadeId) {
  const mainImg = fixImageUrl(product.images?.[0] || product.thumb);
  const gallery = (product.images?.length ? product.images : [mainImg])
    .filter(Boolean)
    .map((url, i) => `<img src="${esc(fixImageUrl(url))}" class="${i === 0 ? 'active' : ''}" data-full="${esc(fixImageUrl(url))}" alt="" />`)
    .join('');

  const shadesHtml = product.hasOptions && shades.length
    ? `
    <div class="p-section shades-section">
      <div class="shades-header">
        <h3>${biText(shades[0]?.optionGroup, shades[0]?.optionGroupEn, { block: false, fallback: 'الدرجات / الألوان' })}</h3>
        <div class="shade-selected-name" id="shadeSelectedName"></div>
        <div class="shade-stats-badge" id="shadeStatsBadge">${shadeStatsLabel(shades)}</div>
      </div>
      <div class="shades-row" id="shadesGrid">
        ${shades.map((s) => renderShadeCard(s, activeShadeId === s.optionId)).join('')}
      </div>
      <div id="shadeDetail"></div>
    </div>`
    : '';

  const attrList = Array.isArray(product.attributes) ? product.attributes : [];
  const attrs = attrList.map((a) => `<span class="p-attr">${esc(a.name)}: ${esc(a.value)}</span>`).join('');
  const descAr = product.description || '';
  const descEn = product.descriptionEn || '';
  const descHtml = (descAr || descEn)
    ? `
    <div class="p-section">
      <h3>الوصف</h3>
      ${descAr ? `<div class="p-desc-block"><div class="p-desc-label">عربي</div><div class="p-desc">${descAr}</div></div>` : ''}
      ${descEn ? `<div class="p-desc-block"><div class="p-desc-label" dir="ltr">English</div><div class="p-desc" dir="ltr">${descEn}</div></div>` : ''}
    </div>`
    : '';

  const storeLinks = [
    product.productUrl ? `<a href="${esc(product.productUrl)}" target="_blank" rel="noopener">niceonesa.com/ar ↗</a>` : '',
    product.productUrlEn ? `<a href="${esc(product.productUrlEn)}" target="_blank" rel="noopener">niceonesa.com/en ↗</a>` : '',
  ].filter(Boolean).join(' · ');

  return `
    <img class="p-main-img" id="mainImg" src="${esc(mainImg)}" alt="" referrerpolicy="no-referrer" />
    ${gallery ? `<div class="p-gallery" id="gallery">${gallery}</div>` : ''}
    <h2 class="p-title">${biTitle(product.name, product.nameEn)}</h2>
    <div class="p-brand">${biText(product.manufacturer, product.manufacturerEn, { block: false })}</div>
    <div class="p-price" id="panelPrice">${esc(product.price)}</div>
    ${storeLinks ? `<p class="p-store-link">${storeLinks}</p>` : ''}
    <div class="p-section">
      <h3>البيانات الأساسية</h3>
      <div class="p-meta-grid" id="metaGrid">${barcodeMetaRows(product)}</div>
    </div>
    ${shadesHtml}
    ${attrs ? `<div class="p-section"><h3>المواصفات</h3><div class="p-attrs">${attrs}</div></div>` : ''}
    ${descHtml}
  `;
}

async function pollShadeBarcodes(product, shades, productId) {
  let current = shades;
  let attempts = 0;
  while (attempts < 20) {
    const missing = current.filter((s) => !shadeEan(s)).length;
    const badge = $('#shadeStatsBadge');
    if (!missing) {
      if (badge) badge.textContent = shadeStatsLabel(current);
      return current;
    }
    if (badge) badge.textContent = `جاري البحث... ${current.length - missing}/${current.length} باركود`;
    try {
      const enriched = await api(`${API}/products/${productId}/shades?lookup=1&max=8`);
      if (enriched.shades?.length) {
        current = enriched.shades;
        refreshShadesUI(product, current);
        if (enriched.lookup?.complete) break;
      }
    } catch {
      break;
    }
    attempts += 1;
    await new Promise((r) => setTimeout(r, 800));
  }
  return current;
}

function refreshShadesUI(product, shades) {
  const shadesGrid = $('#shadesGrid');
  if (shadesGrid) {
    const activeId = document.querySelector('.shade-item.active')?.dataset?.option;
    shadesGrid.outerHTML = `<div class="shades-row" id="shadesGrid">${shades.map((s) => renderShadeCard(s, s.optionId === activeId)).join('')}</div>`;
  }
  const statsBadge = $('#shadeStatsBadge');
  if (statsBadge) statsBadge.textContent = shadeStatsLabel(shades);
  bindPanelEvents(product, shades);
  const activeShade = shades.find((s) => s.optionId === document.querySelector('.shade-item.active')?.dataset?.option) || shades[0];
  if (activeShade) applyShadeSelection(product, shades, activeShade);
}

function bindPanelEvents(product, shades) {
  $('#gallery')?.querySelectorAll('img').forEach((img) => {
    img.addEventListener('click', () => {
      $('#mainImg').src = img.dataset.full || img.src;
      $('#gallery').querySelectorAll('img').forEach((i) => i.classList.remove('active'));
      img.classList.add('active');
    });
  });

  const grid = $('#shadesGrid');
  if (!grid) return;

  grid.querySelectorAll('.shade-item').forEach((card) => {
    const pick = () => {
      const shade = shades.find((s) => s.optionId === card.dataset.option);
      if (shade) applyShadeSelection(product, shades, shade);
    };
    card.addEventListener('click', pick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
  });

  if (shades.length) applyShadeSelection(product, shades, shades[0]);
}

async function openProduct(id) {
  const panel = $('#productPanel');
  const body = $('#panelBody');
  panel.classList.add('open');
  $('#overlay').classList.add('show');
  panel.setAttribute('aria-hidden', 'false');
  body.innerHTML = '<div class="panel-loading">جاري تحميل التفاصيل...</div>';

  try {
    const { product } = await api(`${API}/products/${id}`);
    const shades = product.shades || [];
    body.innerHTML = renderProductPanel(product, shades);
    bindPanelEvents(product, shades);
    if (product.hasOptions && shades.length && shades.some((s) => !shadeEan(s))) {
      pollShadeBarcodes(product, shades, id);
    }
  } catch (err) {
    body.innerHTML = `<div class="panel-loading">خطأ: ${esc(err.message)}</div>`;
  }
}

function closePanel() {
  $('#productPanel').classList.remove('open');
  $('#productPanel').setAttribute('aria-hidden', 'true');
  if (!$('#sidebar').classList.contains('open')) {
    $('#overlay').classList.remove('show');
  }
}

function closeAll() {
  closeSidebar();
  closePanel();
}

function pickDefaultCategory() {
  const tree = state.categories.tree || [];
  const leaves = state.categories.leaves || [];
  const roots = state.catalogOverview?.roots || [];
  const makeupRoot = roots.find((r) => r.slug === 'makeup') || tree.find((n) => n.slug === 'makeup');
  if (makeupRoot) {
    return {
      slug: makeupRoot.slug,
      path: makeupRoot.path || 'المكياج',
      pathEn: makeupRoot.pathEn || 'Makeup',
    };
  }
  const preferredSlugs = ['makeup', 'foundation', 'lipstick', 'perfume', 'care'];
  for (const slug of preferredSlugs) {
    const hit = leaves.find((l) => l.slug === slug) || tree.find((n) => n.slug === slug);
    if (hit) return { slug: hit.slug, path: hit.path || hit.name, pathEn: hit.pathEn || hit.nameEn || '' };
  }
  const leaf = leaves[0];
  return leaf ? { slug: leaf.slug, path: leaf.path, pathEn: leaf.pathEn || '' } : null;
}

async function loadCatalogOverview() {
  try {
    state.catalogOverview = await api(`${API}/catalog/overview`);
    const o = state.catalogOverview;
    const totalLabel = (o.estimatedUnique || o.searchTotal || o.sumRoots || 0).toLocaleString('ar-SA');
    $('#welcomeStats').innerHTML = `
      <div class="stat-box"><strong>${totalLabel}</strong><span>منتج تقريباً</span></div>
      <div class="stat-box"><strong>${o.leaves}</strong><span>تصنيف فرعي</span></div>
      <div class="stat-box"><strong>${o.roots?.length || 10}</strong><span>أقسام رئيسية</span></div>`;
    if (o.roots?.length && state.categories.tree?.length) {
      for (const root of o.roots) {
        const node = state.categories.tree.find((n) => n.slug === root.slug);
        if (node) node.productCount = root.total;
      }
      renderCategoryTree();
    }
  } catch {
    /* optional */
  }
}

function autoLoadDefaultCategory() {
  if (state.currentSlug || state.isSearch || state.isBrand || state.isFullCatalog) return;
  const leaf = pickDefaultCategory();
  if (!leaf) return;
  loadCategory(leaf.slug, leaf.path, leaf.pathEn || '');
}

async function loadCategories() {
  const container = $('#catTree');
  container.innerHTML = '<div class="loading-tree">جاري تحميل التصنيفات...</div>';
  try {
    const data = await api(`${API}/categories?counts=1`);
    state.categories = data;
    renderCategoryTree();
    deferIdle(() => {
      loadBrands();
      loadCatalogOverview();
    });
    autoLoadDefaultCategory();
  } catch (err) {
    container.innerHTML = `<div class="loading-tree loading-tree--error">خطأ: ${esc(err.message)}<br><button type="button" class="btn-retry" id="retryCategories">إعادة المحاولة</button></div>`;
    $('#statusMsg').textContent = `خطأ في تحميل التصنيفات: ${err.message}`;
    $('#statusMsg').classList.remove('hidden');
    $('#retryCategories')?.addEventListener('click', loadCategories);
  }
}

async function init() {
  initHubLinks();
  $('#menuBtn').addEventListener('click', openSidebar);
  $('#sidebarClose').addEventListener('click', closeSidebar);
  $('#overlay').addEventListener('click', closeAll);
  $('#panelClose').addEventListener('click', (e) => {
    e.stopPropagation();
    closePanel();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  $$('.sidebar-tab').forEach((btn) => {
    btn.addEventListener('click', () => setSidebarTab(btn.dataset.tab));
  });

  $('#catFilter')?.addEventListener('input', (e) => {
    state.catFilter = e.target.value;
    renderCategoryTree();
  });

  $('#brandFilter')?.addEventListener('input', (e) => {
    state.brandFilter = e.target.value;
    renderBrandsPanels();
  });

  bindSortPills($('#sortPills'), {
    getSort: () => state.sort,
    onSort: (sort) => {
      state.sort = sort;
      state.page = 1;
      state.products = [];
      fetchProductsPage(1);
    },
  });

  $('#loadMoreBtn').addEventListener('click', () => {
    if (!state.loading && !state.loadingAll && state.hasMore) fetchProductsPage(state.page + 1, true);
  });

  $('#loadAllBtn')?.addEventListener('click', () => loadAllPages());
  $('#loadFullCatalogBtn')?.addEventListener('click', () => loadEntireCatalog());
  $('#loadMakeupBtn')?.addEventListener('click', () => {
    const makeup = state.catalogOverview?.roots?.find((r) => r.slug === 'makeup')
      || state.categories.tree?.find((n) => n.slug === 'makeup');
    if (makeup) loadCategory(makeup.slug, makeup.path || makeup.name, makeup.pathEn || 'Makeup');
    else loadCategory('makeup', 'المكياج', 'Makeup');
    closeSidebar();
  });

  let searchTimer;
  $('#globalSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (e.target.value.trim().length >= 2) runSearch(e.target.value);
    }, 500);
  });
  $('#globalSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch(e.target.value);
  });

  await loadCategories();
  const openProductId = new URLSearchParams(location.search).get('product');
  if (openProductId) openProduct(openProductId);
}

init();
