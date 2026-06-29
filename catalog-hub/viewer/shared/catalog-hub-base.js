/** مسارات API وصور الكتالوج خلف بادئة /catalog-hub على السيرفر */
export function catalogHubBase() {
  const path = window.location.pathname;
  const idx = path.indexOf('/catalog-hub');
  if (idx >= 0) return path.slice(0, idx + '/catalog-hub'.length);
  return '';
}

export function hubApi(path = '') {
  const p = String(path || '');
  if (!p.startsWith('/')) return `${catalogHubBase()}/${p}`;
  return `${catalogHubBase()}${p}`;
}

export function fixHubAssetUrl(url = '') {
  const u = String(url || '').trim();
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  if (u.startsWith('/api/') || u.startsWith('/shared/')) return hubApi(u);
  return u;
}

export function fixStoreUrl(url = '') {
  const u = String(url || '').trim();
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = catalogHubBase();
  if (!base) return u;
  if (u.startsWith(base)) return u;
  if (u.startsWith('/')) return `${base}${u}`;
  return u;
}

export function initHubLinks() {
  const base = catalogHubBase();
  if (!base) return;
  document.querySelectorAll('a[href^="/"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('//')) return;
    if (/^\/(api|media)\//.test(href)) return;
    if (href.startsWith('/catalog-hub')) return;
    a.setAttribute('href', `${base}${href}`);
  });
}
