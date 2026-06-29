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
  amazon: 'hub-card--amazon',
  miswag: 'hub-card--miswag',
  orisdi: 'hub-card--orisdi',
};

const STORE_LABELS = {
  niceone: 'Nice One',
  vanilla: 'Vanilla',
  elryan: 'الريان',
  miraaya: 'ميرايا',
  faces: 'وجوه',
  amazon: 'Amazon',
  miswag: 'مسواگ',
  orisdi: 'أورزدي',
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

function renderStoreSummary(stores = [], storeStatuses = {}) {
  const pills = Object.keys(storeStatuses).length
    ? Object.entries(storeStatuses).map(([id, s]) => {
        const cls = STORE_CLASS[id] || '';
        const label = s.label || STORE_LABELS[id] || id;
        let count = '…';
        if (s.status === 'done') count = s.count ?? 0;
        if (s.status === 'error') count = '!';
        if (s.status === 'searching') count = '●';
        return `<span class="barcode-store-pill ${cls} barcode-store-pill--${s.status}">${esc(label)} <strong>${count}</strong></span>`;
      })
    : stores.map((s) => `
        <span class="barcode-store-pill ${STORE_CLASS[s.id] || ''}">
          ${esc(s.label)} <strong>${s.count}</strong>
        </span>`);
  if (!pills.length) return '';
  return `<div class="barcode-store-summary">${pills.join('')}</div>`;
}

async function consumeSse(url, onEvent, signal) {
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
    if (!dataLines.length) {
      eventName = 'message';
      return;
    }
    const raw = dataLines.join('\n');
    dataLines = [];
    const name = eventName;
    eventName = 'message';
    if (!raw || raw.startsWith(':')) return;
    try {
      onEvent(name, JSON.parse(raw));
    } catch { /* skip */ }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('event:')) {
        flush();
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      } else if (line.trim() === '') {
        flush();
      }
    }
  }
  flush();
}

let activeSearchController = null;

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

  activeSearchController?.abort();
  const controller = new AbortController();
  activeSearchController = controller;

  btn.disabled = true;
  status.textContent = 'جاري البحث — النتائج تظهر فور وصولها…';
  status.className = 'barcode-status barcode-status--loading';
  results.innerHTML = '';
  summary.innerHTML = renderStoreSummary([], {});

  const storeStatuses = {};
  let resultItems = [];
  let errors = [];
  let barcode = q.replace(/\D/g, '');

  const paint = () => {
    summary.innerHTML = renderStoreSummary([], storeStatuses);
    if (resultItems.length) {
      results.innerHTML = resultItems.map(renderResultCard).join('');
    } else if (!Object.values(storeStatuses).some((s) => s.status === 'searching' || s.status === 'pending')) {
      results.innerHTML = '<div class="barcode-empty">جرّب باركوداً آخر أو افتح متجراً محدداً للبحث اليدوي</div>';
    }
  };

  try {
    await consumeSse(
      hubApi(`/api/search/barcode/stream?q=${encodeURIComponent(q)}`),
      (type, data) => {
        if (type === 'start') {
          barcode = data.barcode || barcode;
          for (const s of data.stores || []) {
            storeStatuses[s.id || s.store] = {
              status: s.status || 'pending',
              label: s.label || STORE_LABELS[s.id || s.store],
              count: s.count,
            };
          }
          paint();
        }
        if (type === 'store-status') {
          storeStatuses[data.store] = {
            status: data.status,
            label: data.label || STORE_LABELS[data.store],
            count: data.count,
          };
          paint();
        }
        if (type === 'results' && data.payload) {
          resultItems = data.payload.results || [];
          paint();
          if (resultItems.length) {
            status.textContent = `${resultItems.length} نتيجة حتى الآن — البحث مستمر…`;
          }
        }
        if (type === 'done' && data.payload) {
          resultItems = data.payload.results || [];
          errors = data.payload.errors || [];
          for (const s of data.payload.stores || []) {
            storeStatuses[s.id] = {
              status: (s.count ?? 0) > 0 ? 'done' : 'done',
              label: s.label,
              count: s.count,
            };
          }
          paint();
        }
      },
      controller.signal,
    );

    if (errors.length) {
      const errNote = errors.map((e) => `${e.store}: ${e.message}`).join(' · ');
      status.textContent = resultItems.length
        ? `تم العثور على ${resultItems.length} نتيجة · تحذير: ${errNote}`
        : `لم يُعثر على نتائج · ${errNote}`;
      status.className = resultItems.length ? 'barcode-status barcode-status--ok' : 'barcode-status barcode-status--warn';
    } else if (!resultItems.length) {
      status.textContent = `لا توجد نتائج للباركود ${barcode}`;
      status.className = 'barcode-status barcode-status--warn';
    } else {
      status.textContent = `${resultItems.length} نتيجة للباركود ${barcode}`;
      status.className = 'barcode-status barcode-status--ok';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
    status.textContent = `خطأ: ${err.message}`;
    status.className = 'barcode-status barcode-status--error';
    if (!resultItems.length) results.innerHTML = '';
  } finally {
    if (activeSearchController === controller) {
      btn.disabled = false;
      activeSearchController = null;
    }
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
