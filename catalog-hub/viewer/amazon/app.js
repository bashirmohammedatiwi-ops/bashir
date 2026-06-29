import { hubApi, fixHubAssetUrl, initHubLinks } from '../shared/catalog-hub-base.js';

const API = hubApi('/api/amazon');
const $ = (sel, root = document) => root.querySelector(sel);

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
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escUrl(url = '') {
  return esc(fixHubAssetUrl(url));
}

function biText(ar, en, { block = true } = {}) {
  const a = String(ar ?? '').trim();
  const e = String(en ?? '').trim();
  if (!a && !e) return '';
  if (!e || e === a) return esc(a || e);
  if (!a) return `<span class="bi-en" dir="ltr">${esc(e)}</span>`;
  if (!block) return `<span class="bi-inline"><span class="bi-ar">${esc(a)}</span><span class="bi-sep"> · </span><span class="bi-en" dir="ltr">${esc(e)}</span></span>`;
  return `<span class="bi-block"><span class="bi-ar">${esc(a)}</span><span class="bi-en" dir="ltr">${esc(e)}</span></span>`;
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
    const link = `<a class="cat-link${node.isLeaf ? ' leaf' : ' parent'}${active}" data-id="${esc(node.slug)}" data-path="${esc(node.path)}" data-path-en="${esc(node.pathEn || '')}">${biText(node.nameAr || node.name, node.nameEn)}</a>`;
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
      loadCategory(el.dataset.id, el.dataset.path, el.dataset.pathEn);
      closeSidebar();
    });
  });
}

function renderProductCard(p) {
  const meta = [p.asin && `ASIN: ${esc(p.asin)}`, p.barcode && `باركود: ${esc(p.barcode)}`].filter(Boolean).join(' · ');
  return `
    <article class="card" data-id="${esc(p.id)}">
      <div class="card-img">
        <img src="${escUrl(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
      </div>
      <div class="card-body">
        <div class="card-brand">${biText(p.brandAr || p.manufacturer, p.brandEn || p.manufacturerEn, { block: false })}</div>
        <h3 class="card-name">${biText(p.nameAr || p.name, p.nameEn)}</h3>
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
    $('#pageTitle').innerHTML = 'اختر تصنيفاً';
    $('#pageStats').textContent = '';
    return;
  }

  welcome.classList.add('hidden');
  filters.classList.toggle('hidden', state.isSearch);

  $('#pageTitle').innerHTML = state.isSearch
    ? biText(state.currentPath, `Search: ${state.searchQuery}`)
    : biText(state.currentPath, state.currentPathEn);
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
      data = await api(`${API}/search?q=${encodeURIComponent(state.searchQuery)}&page=${page}&limit=30&sort=${state.sort}`);
    } else {
      const params = new URLSearchParams({ page, limit: 30, sort: state.sort });
      data = await api(`${API}/categories/${encodeURIComponent(state.currentCategoryId)}/products?${params}`);
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

function loadCategory(id, path, pathEn = '') {
  state.currentCategoryId = id;
  state.currentPath = path;
  state.currentPathEn = pathEn;
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
  state.currentPathEn = `Search: ${q}`;
  state.page = 1;
  state.products = [];
  fetchProductsPage(1);
  closeSidebar();
}

function metaRow(label, value, attrs = '') {
  if (value === undefined || value === null || value === '') return '';
  return `<div class="p-meta-row"><span>${esc(label)}</span><code${attrs ? ` ${attrs}` : ''}>${esc(value)}</code></div>`;
}

function renderProductPanel(product) {
  const mainImg = fixHubAssetUrl(product.images?.[0] || product.thumb);
  const gallery = (product.images?.length ? product.images : [mainImg])
    .filter(Boolean)
    .map((url, i) => `<img src="${escUrl(url)}" class="${i === 0 ? 'active' : ''}" data-full="${escUrl(url)}" alt="" referrerpolicy="no-referrer" />`)
    .join('');

  const descAr = product.description || '';
  const descEn = product.descriptionEn || '';

  return `
    <img class="p-main-img" id="mainImg" src="${escUrl(mainImg)}" alt="" referrerpolicy="no-referrer" />
    ${gallery ? `<div class="p-gallery" id="gallery">${gallery}</div>` : ''}
    <h2 class="p-title">${biText(product.nameAr || product.name, product.nameEn)}</h2>
    <div class="p-brand">${biText(product.brandAr || product.manufacturer, product.brandEn || product.manufacturerEn)}</div>
    <div class="p-price" id="panelPrice">${esc(product.price)}${product.priceEn && product.priceEn !== product.price ? ` <span class="bi-en" dir="ltr">/ ${esc(product.priceEn)}</span>` : ''}</div>

    <div class="p-section">
      <h3>البيانات الأساسية</h3>
      <div class="p-meta-grid" id="metaGrid">
        ${metaRow('ASIN', product.asin || product.id, 'dir="ltr"')}
        ${metaRow('الباركود', product.barcode || 'غير متوفر', 'dir="ltr"')}
        ${metaRow('Amazon SA', product.productUrl, 'dir="ltr"')}
        ${metaRow('Amazon.com', product.productUrlEn, 'dir="ltr"')}
      </div>
    </div>

    ${descAr || descEn ? `
    <div class="p-section">
      <h3>الوصف</h3>
      ${descAr ? `<div class="p-desc">${esc(descAr)}</div>` : ''}
      ${descEn && descEn !== descAr ? `<div class="p-desc bi-en" dir="ltr">${esc(descEn)}</div>` : ''}
    </div>` : ''}
  `;
}

function bindPanelEvents() {
  $('#gallery')?.querySelectorAll('img').forEach((img) => {
    img.addEventListener('click', () => {
      $('#mainImg').src = img.dataset.full || img.src;
      $('#gallery').querySelectorAll('img').forEach((i) => i.classList.remove('active'));
      img.classList.add('active');
    });
  });
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
    body.innerHTML = renderProductPanel(product);
    bindPanelEvents();
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
    const leafCount = (data.leaves || []).length;
    $('#welcomeStats').innerHTML = `
      <div class="stat-box"><strong>${leafCount}</strong><span>تصنيف فرعي</span></div>
      <div class="stat-box"><strong>AR+EN</strong><span>ثنائي اللغة</span></div>`;
  } catch (err) {
    $('#catTree').innerHTML = `<div class="loading-tree">خطأ: ${esc(err.message)}</div>`;
  }

  const openProductId = new URLSearchParams(location.search).get('product');
  if (openProductId) openProduct(openProductId);
}

init();
