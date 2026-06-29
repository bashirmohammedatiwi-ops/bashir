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
} from '/shared/store-ui.js';
import { hubApi, initHubLinks } from '/shared/catalog-hub-base.js';

const API = hubApi('/api/miraaya');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  categories: { tree: [], leaves: [], all: [] },
  brands: [],
  currentCategoryId: null,
  currentPath: '',
  currentPathEn: '',
  isSearch: false,
  isBrand: false,
  currentBrandId: null,
  searchQuery: '',
  page: 1,
  hasMore: false,
  products: [],
  loading: false,
  sort: 'default',
  totalCount: null,
  catFilter: '',
  brandFilter: '',
  sidebarTab: 'categories',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** عرض ثنائي اللغة: عربي + إنجليزي */
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
    if (err?.name === 'AbortError') {
      throw new Error('انتهت مهلة الاتصال — تأكد أن السيرفر يعمل');
    }
    if (err instanceof TypeError) {
      throw new Error('تعذّر الاتصال بالسيرفر — شغّل npm start');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function loadCategories() {
  const container = $('#catTree');
  container.innerHTML = '<div class="loading-tree">جاري تحميل التصنيفات...<br><span class="loading-hint">قد يستغرق 10–20 ثانية في أول زيارة</span></div>';
  try {
    const data = await api(`${API}/categories`);
    state.categories = data;
    renderCategoryTree();
    const leafCount = (data.leaves || []).length;
    $('#welcomeStats').innerHTML = `
      <div class="stat-box"><strong>${leafCount}</strong><span>تصنيف</span></div>
      <div class="stat-box"><strong>EAN</strong><span>باركود من قاعدة ميرايا</span></div>
      <div class="stat-box"><strong>AR + EN</strong><span>ثنائي اللغة</span></div>`;
    deferIdle(() => loadBrands());
  } catch (err) {
    container.innerHTML = `<div class="loading-tree loading-tree--error">خطأ: ${esc(err.message)}<br><button type="button" class="btn-retry" id="retryCategories">إعادة المحاولة</button></div>`;
    $('#retryCategories')?.addEventListener('click', loadCategories);
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
  const active = state.currentCategoryId === node.slug && !state.isBrand ? ' active' : '';
  const count = node.productCount
    ? ` <span class="cat-count">${Number(node.productCount).toLocaleString('ar-EG')}</span>`
    : '';
  const hasKids = (node.children || []).length > 0;
  const openClass = node._forceOpen || depth < 1 ? ' open' : '';
  const link = `<a class="cat-link${node.isLeaf ? ' leaf' : ' parent'}${active}" data-id="${esc(node.slug)}" data-path="${esc(node.path)}" data-path-en="${esc(node.pathEn || '')}" style="--depth:${depth}">${biText(node.name, node.nameEn)}${count}</a>`;
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
  container.querySelectorAll('[data-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      loadCategory(el.dataset.id, el.dataset.path, el.dataset.pathEn);
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
  const opts = { esc, biTitleFn: biTitle, onSelect: (b) => loadBrand(b.id, b.name, b.nameEn) };
  const emptyMsg = '<div class="brands-loading">لا توجد علامات — جرّب لاحقاً</div>';
  if ($('#sidebarBrands')) {
    if (!brands.length) $('#sidebarBrands').innerHTML = emptyMsg;
    else renderBrandsGrid(brands, { ...opts, root: $('#sidebarBrands') });
  }
  if ($('#welcomeBrands')) {
    if (!brands.length) $('#welcomeBrands').innerHTML = emptyMsg;
    else renderBrandsGrid(brands.slice(0, 24), { ...opts, root: $('#welcomeBrands') });
    if ($('#welcomeBrandsCount')) $('#welcomeBrandsCount').textContent = brands.length ? `${brands.length} علامة` : '';
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
  if (hint) hint.textContent = state.sort !== 'default' && state.products.length ? 'الترتيب يطبّق على المنتجات المحمّلة' : '';
}

function updateProgressBar() {
  const show = updateProgress({
    loaded: state.products.length,
    total: state.totalCount,
    labelEl: $('#progressLabel'),
    pctEl: $('#progressPct'),
    fillEl: $('#progressFill'),
  });
  $('#progressWrap')?.classList.toggle('hidden', !show);
}

function displayBarcode(item) {
  return String(item?.barcode ?? '').trim();
}

function barcodeLine(p) {
  const bc = displayBarcode(p);
  return bc ? `باركود: ${esc(bc)}` : '';
}

function barcodeMetaRows(product, shade = null) {
  const target = shade || product;
  const barcode = displayBarcode(target) || displayBarcode(product);
  const categoryBi = product.category || product.categoryEn
    ? biText(product.category, product.categoryEn, { block: false })
    : '';
  const storeLinks = [
    product.productUrl ? `<a href="${esc(product.productUrl)}" target="_blank" rel="noopener">miraaya.com/ar ↗</a>` : '',
    product.productUrlEn ? `<a href="${esc(product.productUrlEn)}" target="_blank" rel="noopener">miraaya.com/en ↗</a>` : '',
  ].filter(Boolean).join(' · ');
  return [
    metaRow('رقم المنتج', product.id),
    shade ? metaRow('التدرج اللوني', biText(shade.name, shade.nameEn, { block: false })) : '',
    shade?.hex ? metaRow('كود اللون', shade.hex, 'dir="ltr"') : '',
    metaRow('SKU', shade?.sku || product.sku),
    metaRow('الباركود', barcode || 'غير متوفر', barcode ? 'data-barcode' : ''),
    metaRow('المخزون', (shade?.inStock === false ? 'غير متوفر' : (shade?.quantity ?? product.quantity ?? 'متوفر'))),
    categoryBi ? metaRow('التصنيف', categoryBi) : '',
    storeLinks ? metaRow('رابط ميرايا', storeLinks, 'data-link') : '',
  ].join('');
}

function renderProductCard(p) {
  const badge = p.hasOptions ? '<span class="card-badge">متغيرات</span>' : '';
  const meta = [p.sku && `SKU: ${esc(p.sku)}`, barcodeLine(p)].filter(Boolean).join(' · ');
  const brand = biText(p.manufacturer, p.manufacturerEn, { block: false });
  return `
    <article class="card" data-id="${esc(p.id)}">
      <div class="card-img">
        ${badge}
        <img src="${esc(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
      </div>
      <div class="card-body">
        ${brand ? `<div class="card-brand">${brand}</div>` : ''}
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

  if (!state.currentCategoryId && !state.isSearch && !state.isBrand) {
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
  updateProgressBar();

  $('#pageTitle').innerHTML = biTitle(state.currentPath, state.currentPathEn);
  const stats = [];
  if (state.products.length) stats.push(`${state.products.length.toLocaleString('ar-EG')} محمّل`);
  if (state.totalCount) stats.push(`${state.totalCount.toLocaleString('ar-EG')} إجمالي`);
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

  loadWrap.classList.toggle('hidden', !state.hasMore);
  $('#loadMoreBtn').disabled = state.loading;
  $('#loadMoreBtn').textContent = state.loading ? 'جاري التحميل...' : `تحميل المزيد${state.totalCount ? ` (${state.products.length}/${state.totalCount})` : ''}`;
}

async function fetchProductsPage(page, append = false) {
  state.loading = true;
  updateUI();

  try {
    let data;
    const params = new URLSearchParams({ page, limit: 30, sort: state.sort });
    if (state.isSearch) {
      data = await api(`${API}/search?${params}&q=${encodeURIComponent(state.searchQuery)}`);
    } else if (state.isBrand) {
      data = await api(`${API}/brands/${encodeURIComponent(state.currentBrandId)}/products?${params}`);
    } else {
      data = await api(`${API}/categories/${state.currentCategoryId}/products?${params}`);
    }

    state.page = page;
    state.hasMore = data.hasMore;
    state.totalCount = data.meta?.totalCount ?? state.totalCount;
    state.products = append ? [...state.products, ...data.products] : data.products;
    if (data.meta?.pathEn) state.currentPathEn = data.meta.pathEn;
  } catch (err) {
    $('#statusMsg').textContent = `خطأ: ${err.message}`;
    $('#statusMsg').classList.remove('hidden');
  } finally {
    state.loading = false;
    updateUI();
    renderCategoryTree();
  }
}

function loadCategory(id, path, pathEn = '') {
  state.currentCategoryId = id;
  state.currentPath = path;
  state.currentPathEn = pathEn;
  state.isSearch = false;
  state.isBrand = false;
  state.currentBrandId = null;
  state.searchQuery = '';
  state.page = 1;
  state.products = [];
  state.totalCount = null;
  $('#globalSearch').value = '';
  fetchProductsPage(1);
}

function loadBrand(id, name, nameEn = '') {
  state.isBrand = true;
  state.isSearch = false;
  state.currentBrandId = id;
  state.currentCategoryId = 'brand';
  state.currentPath = `علامة: ${name}`;
  state.currentPathEn = `Brand: ${nameEn || name}`;
  state.page = 1;
  state.products = [];
  state.totalCount = null;
  state.searchQuery = '';
  $('#globalSearch').value = '';
  fetchProductsPage(1);
  closeSidebar();
}

function runSearch(query) {
  const q = query.trim();
  if (!q) return;
  state.isSearch = true;
  state.isBrand = false;
  state.currentBrandId = null;
  state.searchQuery = q;
  state.currentCategoryId = 'search';
  state.currentPath = `بحث: ${q}`;
  state.currentPathEn = `Search: ${q}`;
  state.page = 1;
  state.products = [];
  state.totalCount = null;
  fetchProductsPage(1);
  closeSidebar();
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

function shadeStatsLabel(shades = []) {
  const withBarcode = shades.filter((s) => displayBarcode(s)).length;
  const total = shades.length;
  if (!total) return '';
  if (withBarcode === total) return `${total} متغير · باركود لكل المتغيرات`;
  if (withBarcode) return `${withBarcode}/${total} متغير بباركود`;
  return `${total} متغير`;
}

function renderShadeSwatch(shade) {
  return renderShadeSwatchMarkup(shade, esc, { imgExtra: 'referrerpolicy="no-referrer"' });
}

function renderShadeCard(s, active) {
  const nameHtml = biTitle(s.name, s.nameEn);
  return `
    <div class="shade-item${active ? ' active' : ''}${s.inStock === false ? ' out-of-stock' : ''}" data-option="${esc(s.optionId)}" role="button" tabindex="0">
      ${renderShadeSwatch(s)}
      <div class="shade-value">${nameHtml}</div>
      ${s.hex ? `<div class="shade-hex-code" dir="ltr">${esc(s.hex)}</div>` : ''}
      ${displayBarcode(s) ? `<div class="shade-code shade-ean" dir="ltr" title="باركود">${esc(displayBarcode(s))}</div>` : ''}
      ${s.sku ? `<div class="shade-sku-code" dir="ltr">SKU: ${esc(s.sku)}</div>` : ''}
    </div>`;
}

function applyShadeSelection(product, shades, shade) {
  const grid = $('#shadesGrid');
  if (grid) {
    grid.querySelectorAll('.shade-item').forEach((c) => c.classList.remove('active'));
    grid.querySelector(`.shade-item[data-option="${shade.optionId}"]`)?.classList.add('active');
  }

  const labelParts = shadeSelectionLabelParts(shade);
  $('#shadeSelectedName').innerHTML = biText(
    [labelParts.ar, displayBarcode(shade), shade.sku].filter(Boolean).join(' · '),
    [labelParts.en, displayBarcode(shade), shade.sku].filter(Boolean).join(' · '),
    { block: false },
  ) || '—';
  if (shade.image) $('#mainImg').src = shade.image;
  if (shade.price) $('#panelPrice').textContent = shade.price;
  $('#metaGrid').innerHTML = barcodeMetaRows(product, shade);

  const barcode = displayBarcode(shade) || displayBarcode(product);
  $('#shadeDetail').innerHTML = `
    <div class="shade-detail">
      <div class="shade-detail-swatch">${renderShadeSwatch(shade)}</div>
      <div class="shade-detail-text">
        <strong>${biTitle(shade.name, shade.nameEn)}</strong>
        ${shade.hex ? `<div class="shade-detail-hex">اللون: <code dir="ltr">${esc(shade.hex)}</code></div>` : ''}
        <div>السعر: ${esc(shade.price || '—')}</div>
        <div>SKU: <code dir="ltr">${esc(shade.sku || '—')}</code></div>
        <div>الباركود: <code dir="ltr">${esc(barcode || 'غير متوفر')}</code></div>
        <div>المخزون: ${esc(shade.inStock === false ? 'غير متوفر' : (shade.quantity ?? product.quantity ?? 'متوفر'))}</div>
        ${shade.brand || shade.brandEn ? `<div>العلامة: ${biText(shade.brand, shade.brandEn, { block: false })}</div>` : ''}
      </div>
    </div>`;
}

function renderProductPanel(product, shades) {
  const mainImg = product.images?.[0] || product.thumb;
  const gallery = (product.images?.length ? product.images : [mainImg])
    .filter(Boolean)
    .map((url, i) => `<img src="${esc(url)}" class="${i === 0 ? 'active' : ''}" data-full="${esc(url)}" alt="" referrerpolicy="no-referrer" />`)
    .join('');

  const shadesHtml = product.hasOptions && shades.length
    ? `
    <div class="p-section shades-section">
      <div class="shades-header">
        <h3>المتغيرات</h3>
        <div class="shade-selected-name" id="shadeSelectedName"></div>
        <div class="shade-stats-badge" id="shadeStatsBadge">${shadeStatsLabel(shades)}</div>
      </div>
      <div class="shades-row" id="shadesGrid">
        ${shades.map((s) => renderShadeCard(s, false)).join('')}
      </div>
      <div id="shadeDetail"></div>
    </div>`
    : '';

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
    product.productUrl ? `<a href="${esc(product.productUrl)}" target="_blank" rel="noopener">miraaya.com/ar ↗</a>` : '',
    product.productUrlEn ? `<a href="${esc(product.productUrlEn)}" target="_blank" rel="noopener">miraaya.com/en ↗</a>` : '',
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
    ${descHtml}
  `;
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
  const overlay = $('#overlay');
  panel.classList.add('open');
  overlay.classList.add('show');
  panel.setAttribute('aria-hidden', 'false');
  body.innerHTML = '<div class="panel-loading">جاري تحميل التفاصيل...</div>';

  try {
    const { product } = await api(`${API}/products/${id}`);
    if (state.currentPath && !state.isSearch) {
      product.category = state.currentPath;
      product.categoryEn = state.currentPathEn;
    }
    const shades = product.shades || [];
    body.innerHTML = renderProductPanel(product, shades);
    bindPanelEvents(product, shades);
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

  $('#loadMoreBtn').addEventListener('click', () => {
    if (!state.loading && state.hasMore) fetchProductsPage(state.page + 1, true);
  });

  bindSortPills($('#sortPills'), {
    getSort: () => state.sort,
    onSort: (sort) => {
      state.sort = sort;
      if (state.products.length && (state.isBrand || state.sort !== 'default')) {
        updateUI();
      } else if (state.currentCategoryId || state.isSearch || state.isBrand) {
        state.page = 1;
        state.products = [];
        fetchProductsPage(1);
      }
    },
  });

  $$('.sidebar-tab').forEach((btn) => {
    btn.addEventListener('click', () => setSidebarTab(btn.dataset.tab));
  });

  let brandFilterTimer;
  $('#brandFilter')?.addEventListener('input', (e) => {
    clearTimeout(brandFilterTimer);
    brandFilterTimer = setTimeout(() => {
      state.brandFilter = e.target.value;
      renderBrandsPanels();
    }, 200);
  });

  let catFilterTimer;
  $('#catFilter')?.addEventListener('input', (e) => {
    clearTimeout(catFilterTimer);
    catFilterTimer = setTimeout(() => {
      state.catFilter = e.target.value;
      renderCategoryTree();
    }, 200);
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

  try {
    await loadCategories();
  } catch (err) {
    $('#catTree').innerHTML = `<div class="loading-tree loading-tree--error">خطأ: ${esc(err.message)}</div>`;
  }
  const openProductId = new URLSearchParams(location.search).get('product');
  if (openProductId) openProduct(openProductId);
}

init().catch((err) => {
  console.error('Miraaya init:', err);
  const container = $('#catTree');
  if (container) {
    container.innerHTML = `<div class="loading-tree loading-tree--error">خطأ في التهيئة: ${esc(err.message)}</div>`;
  }
});
