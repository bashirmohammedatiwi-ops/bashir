/**
 * تطبيق كتالوج موحّد — يعمل لكل المتاجر القياسية
 * الاستخدام: <html data-store="miswag"> + <script type="module" src="../shared/catalog-app.js">
 */
import { hubApi, fixHubAssetUrl, initHubLinks } from './catalog-hub-base.js';
import { sortProducts, renderShadeSwatchMarkup } from './store-ui.js';
import { getStoreClientConfig } from './store-client-config.js';

const $ = (sel, root = document) => root.querySelector(sel);

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

function fixImg(url, config) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (config.imgFix) return fixHubAssetUrl(u);
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return fixHubAssetUrl(u);
}

export function createCatalogApp(storeId) {
  const config = getStoreClientConfig(storeId);
  const API = hubApi(config.apiPrefix);

  const state = {
    categories: { tree: [], leaves: [], all: [] },
    currentCategoryId: null,
    currentPath: '',
    currentPathEn: '',
    isSearch: false,
    searchQuery: '',
    page: 1,
    hasMore: false,
    products: [],
    loading: false,
    sort: 'default',
    totalCount: null,
  };

  async function api(path, options = {}, { timeoutMs = 120000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(path, { ...options, signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('انتهت مهلة الاتصال — حاول مجدداً');
      if (err instanceof TypeError) throw new Error('تعذّر الاتصال بالسيرفر');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function closeSidebar() {
    $('#sidebar')?.classList.remove('open');
    if (!$('#productPanel')?.classList.contains('open')) {
      $('#overlay')?.classList.remove('show');
    }
  }

  function openSidebar() {
    $('#sidebar')?.classList.add('open');
    $('#overlay')?.classList.add('show');
  }

  function closePanel() {
    $('#productPanel')?.classList.remove('open');
    $('#productPanel')?.setAttribute('aria-hidden', 'true');
    if (!$('#sidebar')?.classList.contains('open')) {
      $('#overlay')?.classList.remove('show');
    }
  }

  function closeAll() {
    closeSidebar();
    closePanel();
  }

  function renderCategoryTree() {
    const container = $('#catTree');
    if (!container) return;
    if (!state.categories.tree.length) {
      container.innerHTML = '<div class="loading-tree">لا توجد تصنيفات</div>';
      return;
    }

    function renderNode(node) {
      const active = state.currentCategoryId === (node.slug || node.id) ? ' active' : '';
      const count = node.productCount ? ` <span class="cat-count">(${node.productCount})</span>` : '';
      const nameHtml = config.bilingual
        ? biText(node.nameAr || node.name, node.nameEn, { block: false })
        : esc(node.name);
      const link = `<a class="cat-link${node.isLeaf ? ' leaf' : ' parent'}${active}" data-id="${esc(node.slug || node.id)}" data-path="${esc(node.path || node.name)}" data-path-en="${esc(node.pathEn || node.nameEn || '')}">${nameHtml}${count}</a>`;
      const children = (node.children || []).map((c) => renderNode(c)).join('');
      if (!children) return link;
      return `<div class="cat-group open">${link}<div class="cat-children">${children}</div></div>`;
    }

    container.innerHTML = state.categories.tree.map((n) => renderNode(n)).join('');
    container.querySelectorAll('[data-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        loadCategory(el.dataset.id, el.dataset.path, el.dataset.pathEn);
        closeSidebar();
      });
    });
  }

  function displayBarcode(item) {
    const bc = String(item?.barcode ?? '').trim();
    return bc && /^\d{8,14}$/.test(bc) ? bc : '';
  }

  function hasVariants(p) {
    return !!(p.hasOptions || p.hasShades || (p.shadeCount > 1) || (p.shades?.length > 1));
  }

  function renderProductCard(p) {
    const badge = hasVariants(p) ? '<span class="card-badge">متغيرات</span>' : '';
    const nameHtml = config.bilingual ? biTitle(p.nameAr || p.name, p.nameEn || p.name) : esc(p.name);
    const brandHtml = config.bilingual
      ? biText(p.brandAr || p.manufacturer, p.brandEn || p.manufacturerEn, { block: false })
      : esc(p.manufacturer || '');
    const meta = [
      p.asin && `ASIN: ${esc(p.asin)}`,
      p.sku && `SKU: ${esc(p.sku)}`,
      displayBarcode(p) && `باركود: ${esc(displayBarcode(p))}`,
    ].filter(Boolean).join(' · ');
    return `
      <article class="card" data-id="${esc(p.id)}">
        <div class="card-img">
          ${badge}
          <img src="${esc(fixImg(p.thumb, config))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        </div>
        <div class="card-body">
          <div class="card-brand">${brandHtml}</div>
          <h3 class="card-name">${nameHtml}</h3>
          <div class="card-price">${esc(p.price)}</div>
          ${meta ? `<div class="card-meta">${meta}</div>` : ''}
        </div>
      </article>`;
  }

  function updateUI() {
    const grid = $('#grid');
    const welcome = $('#welcome');
    const filters = $('#filtersBar');
    const loadWrap = $('#loadMoreWrap');
    const status = $('#statusMsg');
    if (!grid) return;

    if (!state.currentCategoryId && !state.isSearch) {
      welcome?.classList.remove('hidden');
      grid.innerHTML = '';
      filters?.classList.add('hidden');
      loadWrap?.classList.add('hidden');
      status?.classList.add('hidden');
      if ($('#pageTitle')) $('#pageTitle').textContent = 'اختر تصنيفاً';
      if ($('#pageStats')) $('#pageStats').textContent = '';
      return;
    }

    welcome?.classList.add('hidden');
    filters?.classList.toggle('hidden', false);

    if ($('#pageTitle')) {
      $('#pageTitle').innerHTML = config.bilingual
        ? biTitle(state.currentPath, state.currentPathEn)
        : esc(state.currentPath);
    }
    const stats = [];
    if (state.products.length) stats.push(`${state.products.length} محمّل`);
    if (state.totalCount) stats.push(`${state.totalCount} إجمالي`);
    if ($('#pageStats')) $('#pageStats').textContent = stats.join(' · ') || '';

    if (state.loading && !state.products.length) {
      grid.innerHTML = Array(12).fill('<div class="skeleton"></div>').join('');
      status?.classList.add('hidden');
      loadWrap?.classList.add('hidden');
      return;
    }

    if (!state.products.length && !state.loading) {
      grid.innerHTML = '';
      if (status) {
        status.textContent = state.isSearch ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات';
        status.classList.remove('hidden');
      }
      loadWrap?.classList.add('hidden');
      return;
    }

    status?.classList.add('hidden');
    const sorted = sortProducts(state.products, state.sort, { bilingual: config.bilingual });
    grid.innerHTML = sorted.map(renderProductCard).join('');
    grid.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => openProduct(el.dataset.id));
    });

    loadWrap?.classList.toggle('hidden', !state.hasMore);
    const btn = $('#loadMoreBtn');
    if (btn) {
      btn.disabled = state.loading;
      btn.textContent = state.loading ? 'جاري التحميل...' : `تحميل المزيد${state.totalCount ? ` (${state.products.length}/${state.totalCount})` : ''}`;
    }
  }

  async function fetchProductsPage(page, append = false) {
    state.loading = true;
    updateUI();
    try {
      let data;
      const params = new URLSearchParams({ page, limit: 30, sort: state.sort });
      if (state.isSearch) {
        data = await api(`${API}/search?${params}&q=${encodeURIComponent(state.searchQuery)}`);
      } else {
        data = await api(`${API}/categories/${encodeURIComponent(state.currentCategoryId)}/products?${params}`);
      }
      state.page = page;
      state.hasMore = !!data.hasMore;
      state.totalCount = data.meta?.totalCount ?? data.total ?? state.totalCount;
      state.products = append ? [...state.products, ...(data.products || [])] : (data.products || []);
      if (data.meta?.path) state.currentPath = data.meta.path;
      if (data.meta?.pathEn) state.currentPathEn = data.meta.pathEn;
    } catch (err) {
      const status = $('#statusMsg');
      if (status) {
        status.textContent = `خطأ: ${err.message}`;
        status.classList.remove('hidden');
      }
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
    state.searchQuery = '';
    state.page = 1;
    state.products = [];
    state.totalCount = null;
    state.sort = 'default';
    const sortEl = $('#sortFilter');
    if (sortEl) sortEl.value = 'default';
    const searchEl = $('#globalSearch');
    if (searchEl) searchEl.value = '';
    fetchProductsPage(1);
  }

  function runSearch(query) {
    const q = query.trim();
    if (q.length < 2) return;
    state.isSearch = true;
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

  function pickDefaultCategory() {
    const leaves = state.categories.leaves || [];
    const all = state.categories.all || leaves;
    if (config.defaultCategory) {
      const hit = [...leaves, ...all, ...(state.categories.tree || [])]
        .find((n) => n.slug === config.defaultCategory || n.id === config.defaultCategory);
      if (hit) return hit;
    }
    const withCount = leaves.filter((l) => l.productCount > 0).sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
    return withCount[0] || leaves[0] || all[0] || null;
  }

  function autoLoadDefault() {
    if (!config.autoLoad || state.currentCategoryId || state.isSearch) return;
    const leaf = pickDefaultCategory();
    if (!leaf) return;
    loadCategory(leaf.slug || leaf.id, leaf.path || leaf.name, leaf.pathEn || leaf.nameEn || '');
  }

  function metaRow(label, value, attrs = '') {
    if (value === undefined || value === null || value === '') return '';
    const isLink = String(value).startsWith('http');
    const valHtml = isLink
      ? `<a href="${esc(value)}" target="_blank" rel="noopener" dir="ltr">${esc(value)}</a>`
      : `<code${attrs ? ` ${attrs}` : ''}>${esc(value)}</code>`;
    return `<div class="p-meta-row"><span>${esc(label)}</span><span class="p-meta-val">${valHtml}</span></div>`;
  }

  function productMetaRows(product, shade = null) {
    const target = shade || product;
    return [
      metaRow('رقم المنتج', product.id),
      product.asin ? metaRow('ASIN', product.asin, 'dir="ltr"') : '',
      shade ? metaRow('المتغير', shade.name || shade.nameEn) : '',
      metaRow('SKU', shade?.sku || product.sku),
      metaRow('الباركود', displayBarcode(target) || displayBarcode(product) || 'غير متوفر'),
      metaRow('المخزون', shade?.inStock === false ? 'غير متوفر' : (shade?.quantity ?? product.quantity ?? 'متوفر')),
      product.category ? metaRow('التصنيف', product.category) : '',
      product.productUrl ? metaRow('رابط المتجر', product.productUrl) : '',
      product.productUrlEn ? metaRow('Store link', product.productUrlEn) : '',
    ].join('');
  }

  function renderShadeCard(s, active) {
    const name = (s.name || s.nameEn || s.sku || '—').trim();
    return `
      <div class="shade-item${active ? ' active' : ''}${s.inStock === false ? ' out-of-stock' : ''}" data-option="${esc(s.optionId || s.sku)}" role="button" tabindex="0" title="${esc(name)}">
        ${renderShadeSwatchMarkup(s, esc)}
        <div class="shade-value">${esc(name)}</div>
        ${displayBarcode(s) ? `<div class="shade-code shade-ean" dir="ltr">${esc(displayBarcode(s))}</div>` : ''}
      </div>`;
  }

  function applyShadeSelection(product, shades, shade) {
    $('#shadesGrid')?.querySelectorAll('.shade-item').forEach((c) => c.classList.remove('active'));
    const activeCard = document.querySelector(`.shade-item[data-option="${CSS.escape(String(shade.optionId || shade.sku || ''))}"]`);
    activeCard?.classList.add('active');
    const label = $('#shadeSelectedName');
    if (label) label.textContent = shade.name || shade.nameEn || shade.sku || '—';
    if (shade.image) {
      const img = $('#mainImg');
      if (img) img.src = fixImg(shade.image, config);
    }
    if (shade.price && $('#panelPrice')) $('#panelPrice').textContent = shade.price;
    const meta = $('#metaGrid');
    if (meta) meta.innerHTML = productMetaRows(product, shade);
  }

  function renderProductPanel(product, shades) {
    const mainImg = fixImg(product.images?.[0] || product.thumb, config);
    const gallery = (product.images?.length ? product.images : [mainImg])
      .filter(Boolean)
      .map((url, i) => `<img src="${esc(fixImg(url, config))}" class="${i === 0 ? 'active' : ''}" data-full="${esc(fixImg(url, config))}" alt="" referrerpolicy="no-referrer" />`)
      .join('');

    const showShades = config.shades && shades.length > 0;
    const shadesHtml = showShades ? `
      <div class="p-section shades-section">
        <div class="shades-header">
          <h3>${esc(shades[0]?.optionGroup || 'المتغيرات / الدرجات')}</h3>
          <div class="shade-selected-name" id="shadeSelectedName"></div>
          <div class="shade-stats-badge">${shades.length} متغير</div>
        </div>
        <div class="shades-row" id="shadesGrid">
          ${shades.map((s) => renderShadeCard(s, false)).join('')}
        </div>
      </div>` : '';

    const descAr = product.description || '';
    const descEn = product.descriptionEn || product.description || '';

    return `
      <img class="p-main-img" id="mainImg" src="${esc(mainImg)}" alt="" referrerpolicy="no-referrer" />
      ${gallery ? `<div class="p-gallery" id="gallery">${gallery}</div>` : ''}
      <h2 class="p-title">${config.bilingual ? biTitle(product.nameAr || product.name, product.nameEn) : esc(product.name)}</h2>
      <div class="p-brand">${config.bilingual ? biText(product.brandAr || product.manufacturer, product.brandEn || product.manufacturerEn, { block: false }) : esc(product.manufacturer || '')}</div>
      <div class="p-price" id="panelPrice">${esc(product.price)}</div>
      <div class="p-section">
        <h3>البيانات الأساسية</h3>
        <div class="p-meta-grid" id="metaGrid">${productMetaRows(product)}</div>
      </div>
      ${shadesHtml}
      ${descAr || descEn ? `
        <div class="p-section">
          <h3>الوصف</h3>
          ${descAr ? `<div class="p-desc">${esc(descAr)}</div>` : ''}
          ${descEn && descEn !== descAr ? `<div class="p-desc bi-en" dir="ltr">${esc(descEn)}</div>` : ''}
        </div>` : ''}
    `;
  }

  function bindPanelEvents(product, shades) {
    $('#gallery')?.querySelectorAll('img').forEach((img) => {
      img.addEventListener('click', () => {
        const main = $('#mainImg');
        if (main) main.src = img.dataset.full || img.src;
        $('#gallery')?.querySelectorAll('img').forEach((i) => i.classList.remove('active'));
        img.classList.add('active');
      });
    });
    $('#shadesGrid')?.querySelectorAll('.shade-item').forEach((card) => {
      const pick = () => {
        const shade = shades.find((s) => String(s.optionId || s.sku) === card.dataset.option);
        if (shade) applyShadeSelection(product, shades, shade);
      };
      card.addEventListener('click', pick);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
    });
    if (shades.length) applyShadeSelection(product, shades, shades[0]);
  }

  async function openProduct(id) {
    const panel = $('#productPanel');
    const body = $('#panelBody');
    if (!panel || !body) return;
    panel.classList.add('open');
    $('#overlay')?.classList.add('show');
    panel.setAttribute('aria-hidden', 'false');
    body.innerHTML = '<div class="panel-loading">جاري تحميل التفاصيل...</div>';
    try {
      const { product } = await api(`${API}/products/${encodeURIComponent(id)}`, {}, { timeoutMs: 180000 });
      const shades = product.shades || [];
      body.innerHTML = renderProductPanel(product, shades);
      bindPanelEvents(product, shades);
    } catch (err) {
      body.innerHTML = `<div class="panel-loading panel-loading--error">خطأ: ${esc(err.message)}</div>`;
    }
  }

  async function loadCategories() {
    const container = $('#catTree');
    if (container) container.innerHTML = '<div class="loading-tree">جاري تحميل التصنيفات...</div>';
    try {
      const data = await api(`${API}/categories`);
      state.categories = data;
      renderCategoryTree();
      const leaves = data.leaves || [];
      const totalProducts = (data.all || leaves).reduce((s, c) => s + (c.productCount || 0), 0);
      const stats = $('#welcomeStats');
      if (stats) {
        stats.innerHTML = `
          <div class="stat-box"><strong>${leaves.length || data.tree?.length || 0}</strong><span>تصنيف</span></div>
          <div class="stat-box"><strong>${totalProducts ? totalProducts.toLocaleString('ar') : '—'}</strong><span>منتج تقريباً</span></div>`;
      }
      autoLoadDefault();
    } catch (err) {
      if (container) container.innerHTML = `<div class="loading-tree loading-tree--error">خطأ: ${esc(err.message)}</div>`;
      const status = $('#statusMsg');
      if (status) {
        status.textContent = `خطأ في التصنيفات: ${err.message}`;
        status.classList.remove('hidden');
      }
    }
  }

  async function init() {
    initHubLinks();
    $('#menuBtn')?.addEventListener('click', openSidebar);
    $('#sidebarClose')?.addEventListener('click', closeSidebar);
    $('#overlay')?.addEventListener('click', closeAll);
    $('#panelClose')?.addEventListener('click', (e) => { e.stopPropagation(); closePanel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

    $('#loadMoreBtn')?.addEventListener('click', () => {
      if (!state.loading && state.hasMore) fetchProductsPage(state.page + 1, true);
    });

    $('#sortFilter')?.addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.page = 1;
      state.products = [];
      fetchProductsPage(1);
    });

    let searchTimer;
    $('#globalSearch')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (e.target.value.trim().length >= 2) runSearch(e.target.value);
      }, 450);
    });
    $('#globalSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch(e.target.value);
    });

    await loadCategories();
    const openProductId = new URLSearchParams(location.search).get('product');
    if (openProductId) openProduct(openProductId);
  }

  return { init, loadCategory, openProduct, runSearch, state, config };
}

const storeId = document.documentElement.dataset.store || document.body?.dataset?.store;
if (storeId && !getStoreClientConfig(storeId).custom) {
  createCatalogApp(storeId).init();
}
