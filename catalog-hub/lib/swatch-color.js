import sharp from 'sharp';

function rgbToHex(r, g, b) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** متوسط لون من صورة swatch — لدرجات وجوه التي لا تُرجع hex في الـ API */
export async function averageColorFromImageUrl(url, { timeoutMs = 8000 } = {}) {
  const src = String(url || '').trim();
  if (!src) return '';

  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return '';
    const buf = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(buf, { failOn: 'none' })
      .resize(24, 24, { fit: 'cover' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const alpha = info.channels === 4 ? data[i + 3] : 255;
      if (alpha < 32) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
    return n ? rgbToHex(r / n, g / n, b / n) : '';
  } catch {
    return '';
  }
}
