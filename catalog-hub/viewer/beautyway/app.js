import { hubApi, initHubLinks } from '../shared/catalog-hub-base.js';

const API = hubApi('/api/beautyway');
const $ = (sel, root = document) => root.querySelector(sel);

const state = {
  categories: { tree: [], leaves: [] },
  currentCategoryId: null,
  currentPath: '',
  isSearch: false,
  searchQuery: '',
  page: 1,
  hasMore: false,
  products: [],
  loading: false,
  sort: 'default',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
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

function renderCategoryTree() {
  const container = $('#catTree');
  if (!state.categories.tree.length) {
    container.innerHTML = '<div class="loading-tree">لا توجد تصنيفات</div>';
    return;
  }

  function renderNode(node) {
    const active = state.currentCategoryId === node.slug ? ' active' : '';
    const count = node.productCount ? ` <span class="cat-count">(${node.productCount})</span>` : '';
    const link = `<a class="cat-link${node.isLeaf ? ' leaf' : ' parent'}${active}" data-id="${esc(node.slug)}" data-path="${esc(node.path)}">${esc(node.name)}${count}</a>`;
    const children = (node.children || []).map((c) => renderNode(c)).join('');
    if (!children) return link;
    return `
      <div class="cat-group open">
        ${link}
        <div class="cat-children">${children}</div>
      </div>`;
  }

  container.innerHTML = state.categories.tree.map((n) => renderNode(n)).join('');

  container.querySelectorAll('[data-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      loadCategory(el.dataset.id, el.dataset.path);
      closeSidebar();
    });
  });
}

function displayBarcode(item) {
  return String(item?.barcode ?? '').trim();
}

function displayBeautywayRef(item) {
  return String(item?.sku ?? item?.id ?? '').trim();
}

function barcodeLine(p) {
  const bc = displayBarcode(p);
  return bc ? `باركود: ${esc(bc)}` : '';
}

function barcodeMetaRows(product, shade = null) {
  const target = shade || product;
  const barcode = displayBarcode(target) || displayBarcode(product);
  const beautywayRef = displayBeautywayRef(target) || displayBeautywayRef(product);
  const rows = [
    metaRow('رقم المنتج', product.id),
    shade ? metaRow('المتغير', shade.name) : '',
    metaRow('SKU', shade?.sku || product.sku),
  ];
  if (barcode) {
    rows.push(metaRow('الباركود', barcode, 'data-barcode'));
  } else {
    rows.push(metaRow('الباركود', 'غير متوفر'));
  }
  if (beautywayRef && beautywayRef !== barcode) {
    rows.push(metaRow('معرّف Beauty Way', beautywayRef, 'data-beautyway-ref'));
  }
  rows.push(
    metaRow('المخزون', (shade?.inStock === false ? 'غير متوفر' : (shade?.quantity ?? product.quantity ?? 'متوفر'))),
    !shade && product.rating ? metaRow('التقييم', `${product.rating} (${product.reviews || 0})`) : '',
    product.category ? metaRow('التصنيف', product.category) : '',
  );
  return rows.join('');
}

function renderProductCard(p) {
  const badge = p.hasOptions
    ? '<span class="card-badge">متغيرات</span>'
    : '';
  const meta = [p.sku && `SKU: ${esc(p.sku)}`, barcodeLine(p)].filter(Boolean).join(' · ');
  return `
    <article class="card" data-id="${esc(p.id)}">
      <div class="card-img">
        ${badge}
        <img src="${esc(p.thumb)}" alt="" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-brand">${esc(p.manufacturer)}</div>
        <h3 class="card-name">${esc(p.name)}</h3>
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

  if (!state.currentCategoryId && !state.isSearch) {
    welcome.classList.remove('hidden');
    grid.innerHTML = '';
    filters.classList.add('hidden');
    loadWrap.classList.add('hidden');
    status.classList.add('hidden');
    $('#pageTitle').textContent = 'اختر تصنيفاً';
    $('#pageStats').textContent = '';
    return;
  }

  welcome.classList.add('hidden');
  filters.classList.toggle('hidden', state.isSearch);

  $('#pageTitle').textContent = state.currentPath;
  $('#pageStats').textContent = state.products.length ? `${state.products.length} منتج` : '';

  if (state.loading && !state.products.length) {
    grid.innerHTML = Array(8).fill('<div class="skeleton"></div>').join('');
    status.classList.add('hidden');
    loadWrap.classList.add('hidden');
    return;
  }

  if (!state.products.length && !state.loading) {
    grid.innerHTML = '';
    status.textContent = 'لا توجد منتجات في هذا التصنيف';
    status.classList.remove('hidden');
    loadWrap.classList.add('hidden');
    return;
  }

  status.classList.add('hidden');
  grid.innerHTML = state.products.map(renderProductCard).join('');
  grid.querySelectorAll('.card').forEach((el) => {
    el.addEventListener('click', () => openProduct(el.dataset.id));
  });

  loadWrap.classList.toggle('hidden', !state.hasMore);
  $('#loadMoreBtn').disabled = state.loading;
  $('#loadMoreBtn').textContent = state.loading ? 'جاري التحميل...' : 'تحميل المزيد';
}

async function fetchProductsPage(page, append = false) {
  state.loading = true;
  updateUI();

  try {
    let data;
    if (state.isSearch) {
      data = await api(`${API}/search?q=${encodeURIComponent(state.searchQuery)}&page=${page}&limit=30`);
    } else {
      const params = new URLSearchParams({ page, limit: 30, sort: state.sort });
      data = await api(`${API}/categories/${state.currentCategoryId}/products?${params}`);
    }

    state.page = page;
    state.hasMore = data.hasMore;
    state.products = append ? [...state.products, ...data.products] : data.products;
  } catch (err) {
    $('#statusMsg').textContent = `خطأ: ${err.message}`;
    $('#statusMsg').classList.remove('hidden');
  } finally {
    state.loading = false;
    updateUI();
    renderCategoryTree();
  }
}

function loadCategory(id, path) {
  state.currentCategoryId = id;
  state.currentPath = path;
  state.isSearch = false;
  state.searchQuery = '';
  state.page = 1;
  state.products = [];
  state.sort = 'default';
  $('#sortFilter').value = 'default';
  $('#globalSearch').value = '';
  fetchProductsPage(1);
}

function runSearch(query) {
  const q = query.trim();
  if (!q) return;
  state.isSearch = true;
  state.searchQuery = q;
  state.currentCategoryId = 'search';
  state.currentPath = `بحث: ${q}`;
  state.page = 1;
  state.products = [];
  fetchProductsPage(1);
  closeSidebar();
}

function metaRow(label, value, attrs = '') {
  if (value === undefined || value === null || value === '') return '';
  return `<div class="p-meta-row"><span>${esc(label)}</span><code${attrs ? ` ${attrs}` : ''}>${esc(value)}</code></div>`;
}

function shadeStatsLabel(shades = []) {
  const withBarcode = shades.filter((s) => displayBarcode(s) || displayBeautywayRef(s)).length;
  const total = shades.length;
  if (!total) return '';
  if (withBarcode === total) return `${total} متغير · بيانات باركود/مرجع`;
  if (withBarcode) return `${withBarcode}/${total} متغير ببيانات`;
  return `${total} متغير`;
}

function productMetaRows(product, shade = null) {
  return barcodeMetaRows(product, shade);
}

function renderShadeSwatch(shade) {
  const oos = shade.inStock === false;
  if (shade.image) {
    return `<span class="shade-color-box${oos ? ' shade-oos' : ''}" title="${esc(shade.name || '')}">
      <img src="${esc(shade.image)}" alt="${esc(shade.name || '')}" />
    </span>`;
  }
  return `<span class="shade-color-box shade-empty${oos ? ' shade-oos' : ''}" title="${esc(shade.name || '')}">—</span>`;
}

function renderShadeCard(s, active) {
  const name = (s.name || '').trim() || s.sku || '—';
  return `
    <div class="shade-item${active ? ' active' : ''}${s.inStock === false ? ' out-of-stock' : ''}" data-option="${esc(s.optionId)}" role="button" tabindex="0" title="${esc(name)}">
      ${renderShadeSwatch(s)}
      <div class="shade-value">${esc(name)}</div>
      ${displayBarcode(s) ? `<div class="shade-code shade-ean" dir="ltr" title="باركود">${esc(displayBarcode(s))}</div>` : ''}
      ${s.sku ? `<div class="shade-hex-code" dir="ltr">SKU: ${esc(s.sku)}</div>` : ''}
    </div>`;
}

function applyShadeSelection(product, shades, shade) {
  const grid = $('#shadesGrid');
  if (grid) {
    grid.querySelectorAll('.shade-item').forEach((c) => c.classList.remove('active'));
    grid.querySelector(`.shade-item[data-option="${shade.optionId}"]`)?.classList.add('active');
  }

  const selectedLabel = $('#shadeSelectedName');
  if (selectedLabel) {
    selectedLabel.textContent = [shade.name, displayBarcode(shade) || displayBeautywayRef(shade), shade.sku].filter(Boolean).join(' · ') || '—';
  }

  if (shade.image) $('#mainImg').src = shade.image;
  if (shade.price) $('#panelPrice').textContent = shade.price;

  const meta = $('#metaGrid');
  if (meta) meta.innerHTML = productMetaRows(product, shade);

  const detail = $('#shadeDetail');
  if (detail) {
    const barcode = displayBarcode(shade) || displayBarcode(product);
    const beautywayRef = displayBeautywayRef(shade) || displayBeautywayRef(product);
    detail.innerHTML = `
      <div class="shade-detail">
        <div class="shade-detail-swatch">${renderShadeSwatch(shade)}</div>
        <div class="shade-detail-text">
          <strong>${esc(shade.name || '—')}</strong>
          <div>السعر: ${esc(shade.price || '—')}</div>
          <div>SKU: <code dir="ltr">${esc(shade.sku || '—')}</code></div>
          <div>الباركود: <code dir="ltr">${esc(barcode || 'غير متوفر في API')}</code></div>
          ${beautywayRef && beautywayRef !== barcode ? `<div>معرّف Beauty Way: <code dir="ltr">${esc(beautywayRef)}</code></div>` : ''}
          <div>المخزون: ${esc(shade.inStock === false ? 'غير متوفر' : (shade.quantity ?? product.quantity ?? 'متوفر'))}</div>
        </div>
      </div>`;
  }
}

function renderProductPanel(product, shades) {
  const mainImg = product.images?.[0] || product.thumb;
  const gallery = (product.images?.length ? product.images : [mainImg])
    .filter(Boolean)
    .map((url, i) => `<img src="${esc(url)}" class="${i === 0 ? 'active' : ''}" data-full="${esc(url)}" alt="" />`)
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

  const desc = product.description || '';

  return `
    <img class="p-main-img" id="mainImg" src="${esc(mainImg)}" alt="" />
    ${gallery ? `<div class="p-gallery" id="gallery">${gallery}</div>` : ''}
    <h2 class="p-title">${esc(product.name)}</h2>
    <div class="p-brand">${esc(product.manufacturer)}</div>
    <div class="p-price" id="panelPrice">${esc(product.price)}</div>

    <div class="p-section">
      <h3>البيانات الأساسية</h3>
      <div class="p-meta-grid" id="metaGrid">
        ${productMetaRows(product)}
      </div>
    </div>

    ${shadesHtml}

    ${desc ? `<div class="p-section"><h3>الوصف</h3><div class="p-desc">${desc}</div></div>` : ''}
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

  $('#sortFilter').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    state.products = [];
    fetchProductsPage(1);
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
    const data = await api(`${API}/categories`);
    state.categories = data;
    renderCategoryTree();
    const totalProducts = (data.all || data.leaves).reduce((s, c) => s + (c.productCount || 0), 0);
    $('#welcomeStats').innerHTML = `
      <div class="stat-box"><strong>${data.tree.length}</strong><span>قسم رئيسي</span></div>
      <div class="stat-box"><strong>${totalProducts.toLocaleString('ar')}</strong><span>منتج تقريباً</span></div>`;
  } catch (err) {
    $('#catTree').innerHTML = `<div class="loading-tree">خطأ: ${esc(err.message)}</div>`;
  }
  const openProductId = new URLSearchParams(location.search).get('product');
  if (openProductId) openProduct(openProductId);
}

init();
