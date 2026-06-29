import { hubApi, fixHubAssetUrl, fixStoreUrl, initHubLinks } from './shared/catalog-hub-base.js';

const $ = (sel) => document.querySelector(sel);

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STORE_CLASS = {
  niceone: 'hub-card--niceone',
  vanilla: 'hub-card--vanilla',
  elryan: 'hub-card--elryan',
  miraaya: 'hub-card--miraaya',
  faces: 'hub-card--faces',
};

function isValidBarcodeInput(raw) {
  const digits = String(raw).replace(/\D/g, '');
  return /^\d{8,14}$/.test(digits);
}

function renderResultCard(item) {
  const storeClass = STORE_CLASS[item.store] || '';
  const openHref = fixStoreUrl(item.openUrl || `/${item.store || 'niceone'}/`);
  const shade = item.shadeName
    ? `<div class="barcode-result-shade">تدرج: ${esc(item.shadeName)}</div>`
    : '';
  const thumb = item.thumb
    ? `<img src="${esc(fixHubAssetUrl(item.thumb))}" alt="" loading="lazy" />`
    : '<span class="barcode-result-fallback">?</span>';
  return `
    <a class="barcode-result ${storeClass}" href="${esc(openHref)}" target="_blank" rel="noopener">
      <div class="barcode-result-img">${thumb}</div>
      <div class="barcode-result-body">
        <div class="barcode-result-store">${esc(item.storeLabel)}</div>
        <h3 class="barcode-result-name">${esc(item.name)}</h3>
        ${item.manufacturer ? `<div class="barcode-result-brand">${esc(item.manufacturer)}</div>` : ''}
        ${shade}
        <div class="barcode-result-barcode" dir="ltr">${esc(item.barcode)}</div>
        ${item.price ? `<div class="barcode-result-price">${esc(item.price)}</div>` : ''}
        <span class="barcode-result-cta">فتح في المتجر ↗</span>
      </div>
    </a>`;
}

function renderStoreSummary(stores = []) {
  if (!stores.length) return '';
  return `
    <div class="barcode-store-summary">
      ${stores.map((s) => `
        <span class="barcode-store-pill ${STORE_CLASS[s.id] || ''}">
          ${esc(s.label)} <strong>${s.count}</strong>
        </span>`).join('')}
    </div>`;
}

async function runBarcodeSearch(raw) {
  const input = $('#barcodeInput');
  const status = $('#barcodeStatus');
  const results = $('#barcodeResults');
  const summary = $('#barcodeSummary');
  const btn = $('#barcodeSearchBtn');

  const q = String(raw ?? input?.value ?? '').trim();
  if (!isValidBarcodeInput(q)) {
    status.textContent = 'أدخل باركوداً صالحاً (8–14 رقم)';
    status.className = 'barcode-status barcode-status--error';
    results.innerHTML = '';
    summary.innerHTML = '';
    return;
  }

  btn.disabled = true;
  status.textContent = 'جاري البحث في كل المتاجر...';
  status.className = 'barcode-status barcode-status--loading';
  results.innerHTML = '<div class="barcode-loading">Nice One · Vanilla · الريان · ميرايا · وجوه — عادةً 2–8 ثوانٍ</div>';
  summary.innerHTML = '';

  const controller = new AbortController();
  const clientTimer = setTimeout(() => controller.abort(), 20_000);
  const tickTimer = setInterval(() => {
    if (status.classList.contains('barcode-status--loading')) {
      status.textContent = 'جاري البحث في كل المتاجر... (يرجى الانتظار)';
    }
  }, 4000);

  try {
    const res = await fetch(hubApi(`/api/search/barcode?q=${encodeURIComponent(q)}`), { signal: controller.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);

    summary.innerHTML = renderStoreSummary(data.stores || []);

    if (data.errors?.length) {
      const errNote = data.errors.map((e) => `${e.store}: ${e.message}`).join(' · ');
      status.textContent = data.results?.length
        ? `تم العثور على ${data.results.length} نتيجة · تحذير: ${errNote}`
        : `لم يُعثر على نتائج · ${errNote}`;
      status.className = data.results?.length ? 'barcode-status barcode-status--ok' : 'barcode-status barcode-status--warn';
    } else if (!data.results?.length) {
      status.textContent = `لا توجد نتائج للباركود ${data.barcode}`;
      status.className = 'barcode-status barcode-status--warn';
    } else {
      status.textContent = `${data.results.length} نتيجة للباركود ${data.barcode}`;
      status.className = 'barcode-status barcode-status--ok';
    }

    results.innerHTML = data.results?.length
      ? data.results.map(renderResultCard).join('')
      : '<div class="barcode-empty">جرّب باركوداً آخر أو افتح متجراً محدداً للبحث اليدوي</div>';
  } catch (err) {
    if (err?.name === 'AbortError') {
      status.textContent = 'انتهت مهلة البحث — جرّب مرة أخرى أو ابحث داخل متجر Nice One مباشرة';
    } else {
      status.textContent = `خطأ: ${err.message}`;
    }
    status.className = 'barcode-status barcode-status--error';
    results.innerHTML = '';
  } finally {
    clearTimeout(clientTimer);
    clearInterval(tickTimer);
    btn.disabled = false;
  }
}

function init() {
  initHubLinks();
  const form = $('#barcodeSearchForm');
  const input = $('#barcodeInput');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    runBarcodeSearch(input.value);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runBarcodeSearch(input.value);
    }
  });

  const fromUrl = new URLSearchParams(location.search).get('barcode');
  if (fromUrl && isValidBarcodeInput(fromUrl)) {
    input.value = fromUrl.replace(/\D/g, '');
    runBarcodeSearch(input.value);
  }
}

init();
