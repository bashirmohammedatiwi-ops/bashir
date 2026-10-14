#!/usr/bin/env python3
"""Ultra-premium landscape Retinol Complex catalog — Italian editorial design."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PRODUCTS = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
PHOTOS = ROOT / "product-photos"
OUT = ROOT / "index.html"
BRAND_LOGO = "brand-logo.png"

FAMILIES = [
    {
        "id": "color-protection",
        "num": "01",
        "title": "مجموعة حماية لون الشعر",
        "en": "Color Protection",
        "desc": "مجموعة متكاملة للشعر المصبوغ تحمي اللون من البهتان وتمنحه لمعاناً ونعومة مع الحناء والكيراتين والكولاجين.",
        "accent": "#7a3040",
        "tint": "#f8f0f2",
        "match": lambda n: "حماية اللون" in n,
    },
    {
        "id": "anti-frizz",
        "num": "02",
        "title": "مجموعة ضد التجعد",
        "en": "Anti-Frizz",
        "desc": "انضباط ونعومة للشعر الجاف والمجعد مع بذور الكتان والكولاجين — ملمساً حريرياً طوال اليوم.",
        "accent": "#8a6230",
        "tint": "#f7f2ea",
        "match": lambda n: "تجعد" in n and "اصفرار" not in n,
    },
    {
        "id": "anti-dandruff",
        "num": "03",
        "title": "مجموعة ضد القشرة",
        "en": "Anti-Dandruff",
        "desc": "تنقية وتوازن لفروة الرأس مع القراص والأوكالبتوس — انتعاش ونظافة دون جفاف.",
        "accent": "#2f5a48",
        "tint": "#eef5f1",
        "match": lambda n: "قشرة" in n,
    },
    {
        "id": "volume",
        "num": "04",
        "title": "مجموعة تكثيف الحجم",
        "en": "Volumizing",
        "desc": "كثافة ورفع من الجذور للشعر الخفيف مع الكولاجين والكينوا — حجم طبيعي دون ثقل.",
        "accent": "#34506e",
        "tint": "#eef2f7",
        "match": lambda n: "حجم" in n or "تكثيف" in n,
    },
    {
        "id": "anti-yellow",
        "num": "05",
        "title": "مجموعة ضد الاصفرار",
        "en": "Anti-Yellow",
        "desc": "للشعر الأشقر والرمادي والأبيض — يزيل الاصفرار ويعيد البرودة والنقاء.",
        "accent": "#4d4268",
        "tint": "#f2f0f6",
        "match": lambda n: "اصفرار" in n,
    },
    {
        "id": "anti-loss",
        "num": "06",
        "title": "مجموعة ضد تساقط الشعر",
        "en": "Anti-Hair Loss",
        "desc": "تقوية الجذور ومقاومة التساقط مع السيراميدات والبانثينول — روتين متكامل للعناية اليومية.",
        "accent": "#6a3542",
        "tint": "#f7eff1",
        "match": lambda n: "تساقط" in n,
    },
    {
        "id": "sos",
        "num": "07",
        "title": "مجموعة SOS MACCHIA",
        "en": "SOS Dark Spot",
        "desc": "توحيد لون البشرة وتقليل البقع الداكنة مع Active Bright والنياسيناميد.",
        "accent": "#9a4a24",
        "tint": "#f8f1eb",
        "match": lambda n: any(k in n for k in ["SOS", "Dark-Spot", "الوجه والعين"]),
    },
    {
        "id": "treatments",
        "num": "08",
        "title": "علاجات متخصصة",
        "en": "Special Care",
        "desc": "أمبولات الكيراتين، علاج 10 في 1، سكراب الفروة، وزيت الخروع — حلول مركّزة لنتائج أوضح.",
        "accent": "#3a4452",
        "tint": "#eef1f4",
        "match": lambda n: True,
    },
]


def e(s: str) -> str:
    return html.escape(s or "")


def fmt(n: int) -> str:
    return f"{n:,}".replace(",", "٬") + " د.ع"


def clean(n: str) -> str:
    return n.replace("ريتينول كومبلكس - ", "").strip()


def short(t: str, lim: int = 195) -> str:
    t = re.sub(r"\s+", " ", (t or "").strip())
    t = t.replace("من ريتينول كومبلكس", "").replace("ريتينول كومبلكس —", "—")
    t = re.sub(r"\s+", " ", t).strip(" —")
    return t if len(t) <= lim else t[: lim - 1].rsplit(" ", 1)[0] + "…"


def bullets(t: str) -> list[str]:
    parts = re.split(r"[•\n]", t or "")
    out = []
    for p in parts:
        p = p.strip(" -–—")
        if not p or len(p) < 12 or "ديما" in p:
            continue
        out.append(p)
    if len(out) > 1 and len(out[0]) > 90:
        out = out[1:]
    return out[:4] if out else [short(t, 130)]


def photo(p: dict) -> str:
    slug = p["slug"]
    local = PHOTOS / f"{slug}.jpg"
    if local.exists():
        return f"product-photos/{slug}.jpg"
    img = ROOT / "images" / f"{slug}.webp"
    if img.exists():
        return f"images/{slug}.webp"
    return p.get("image") or ""


def apply_prices(products: list[dict]) -> list[dict]:
    """Shampoo 13000, conditioner 12000; wholesale = retail − 30%."""
    out = []
    for p in products:
        p = dict(p)
        name = p.get("nameAr", "")
        if "شامبو" in name:
            p["price"] = 13000
        elif "بلسم" in name:
            p["price"] = 12000
        p["wholesale"] = int(round(p["price"] * 0.7))
        out.append(p)
    return out


def assign(products: list[dict]) -> dict[str, list[dict]]:
    g = {f["id"]: [] for f in FAMILIES}
    used = set()
    for fam in FAMILIES[:-1]:
        for p in products:
            if p["id"] in used:
                continue
            if fam["match"](p["nameAr"]):
                g[fam["id"]].append(p)
                used.add(p["id"])
    for p in products:
        if p["id"] not in used:
            g["treatments"].append(p)
    return g


ITALY_FLAG = """
<svg class="flag" viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="3" height="6" fill="#009246"/>
  <rect x="3" width="3" height="6" fill="#fff"/>
  <rect x="6" width="3" height="6" fill="#ce2b37"/>
</svg>
"""

ORNAMENT = """
<svg class="ornament" viewBox="0 0 80 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <line x1="0" y1="6" x2="28" y2="6" stroke="currentColor" stroke-width="1"/>
  <path d="M40 1 L44 6 L40 11 L36 6 Z" fill="currentColor"/>
  <line x1="52" y1="6" x2="80" y2="6" stroke="currentColor" stroke-width="1"/>
</svg>
"""


def family_page(fam: dict, items: list[dict]) -> str:
    n = min(len(items), 6)
    thumbs = "".join(
        f"""<figure class="thumb">
          <div class="thumb-stage">
            <img src="{e(photo(p))}" alt="{e(clean(p['nameAr']))}" />
          </div>
          <figcaption>{e(clean(p['nameAr'])[:46])}{"…" if len(clean(p['nameAr']))>46 else ""}</figcaption>
        </figure>"""
        for p in items[:6]
    )
    return f"""
    <section class="sheet family" style="--a:{fam['accent']};--tint:{fam['tint']}">
      <div class="family-rail" aria-hidden="true"></div>
      <div class="family-panel">
        <div class="fp-eyebrow">
          <span class="col-num">{fam['num']}</span>
          <span class="col-label">COLLECTION</span>
        </div>
        <h2>{e(fam['title'])}</h2>
        <p class="en">{e(fam['en'])}</p>
        {ORNAMENT}
        <p class="desc">{e(fam['desc'])}</p>
        <div class="fp-meta">
          <div class="meta-box">
            <span class="meta-k">المنتجات</span>
            <strong>{len(items):02d}</strong>
          </div>
          <div class="meta-box">
            <span class="meta-k">الأصل</span>
            <strong>Italy</strong>
          </div>
        </div>
        <div class="fp-foot">
          <span>Retinol Complex</span>
          <span class="dot"></span>
          <span>Professional Line</span>
        </div>
      </div>
      <div class="family-gallery">
        <div class="gallery-label">منتجات المجموعة</div>
        <div class="gallery n{n}">{thumbs}</div>
      </div>
      <span class="wm-num" aria-hidden="true">{fam['num']}</span>
    </section>"""


def product_page(p: dict, fam: dict, idx: int, total: int) -> str:
    bl = "".join(f"<li><span>{e(b)}</span></li>" for b in bullets(p.get("descriptionAr", "")))
    return f"""
    <section class="sheet product" style="--a:{fam['accent']};--tint:{fam['tint']}">
      <aside class="p-visual">
        <div class="p-stage">
          <div class="p-halo" aria-hidden="true"></div>
          <img src="{e(photo(p))}" alt="{e(clean(p['nameAr']))}" />
          <div class="p-floor" aria-hidden="true"></div>
        </div>
        <div class="p-visual-meta">
          <span>Retinol Complex</span>
          <span dir="ltr">{fam['num']} · {idx:02d}/{total:02d}</span>
        </div>
      </aside>
      <div class="p-content">
        <div class="p-accent-bar" aria-hidden="true"></div>
        <header class="p-head">
          <span class="p-chip">{e(fam['title'])}</span>
          <span class="p-count" dir="ltr">{idx:02d} — {total:02d}</span>
        </header>
        <p class="p-brand">RETINOL COMPLEX · ITALY</p>
        <h1>{e(clean(p['nameAr']))}</h1>
        {ORNAMENT}
        <p class="p-lead">{e(short(p.get('descriptionAr',''), 180))}</p>
        <ul class="p-bullets">{bl}</ul>
        <div class="p-prices">
          <div class="price retail">
            <span class="price-label">سعر المستهلك</span>
            <strong>{fmt(p['price'])}</strong>
          </div>
          <div class="price wholesale">
            <span class="price-label">سعر الجملة</span>
            <strong>{fmt(p['wholesale'])}</strong>
          </div>
        </div>
        <footer class="p-foot">
          <span class="p-sku" dir="ltr">SKU · {e(p.get('sku',''))}</span>
          <span class="p-italy">{ITALY_FLAG} Italy</span>
        </footer>
      </div>
    </section>"""


CSS = r"""
:root {
  --ink: #171417;
  --soft-ink: #4a4548;
  --muted: #8a8386;
  --line: #e8e2dc;
  --paper: #fffcf9;
  --mist: #f4f0eb;
  --burgundy: #6f2a38;
  --gold: #c4a574;
  --gold-deep: #9a7a4f;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  font-family: 'Cairo', sans-serif;
  background: #bdb6ae;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
img { max-width: 100%; display: block; object-fit: contain; }
.sheet {
  width: 297mm;
  height: 210mm;
  min-height: 210mm;
  margin: 0 auto 16px;
  background: var(--paper);
  position: relative;
  overflow: hidden;
  page-break-after: always;
  box-shadow: 0 18px 48px rgba(0,0,0,.18);
}
.sheet.family,
.sheet.product,
.sheet.index {
  display: grid;
}
.sheet.family > *:not(.wm-num):not(.family-rail),
.sheet.product > *,
.sheet.index > * {
  min-height: 100%;
  height: 100%;
}

.flag {
  width: 26px; height: 17px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.1);
  flex-shrink: 0;
}
.ornament {
  width: 72px; height: 12px;
  color: var(--gold-deep);
  margin: 14px 0 16px;
  opacity: .85;
}
.family-panel .ornament,
.p-content .ornament { color: var(--a, var(--gold-deep)); }

/* ========== COVER ========== */
.cover {
  display: grid;
  grid-template-columns: 18mm 1fr;
  background:
    radial-gradient(ellipse 70% 55% at 58% 38%, rgba(196,165,116,.10), transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 80%, rgba(111,42,56,.05), transparent 55%),
    linear-gradient(180deg, #fffefc 0%, #faf6f1 100%);
}
.cover-spine {
  background:
    linear-gradient(180deg, #1a1012 0%, #6f2a38 42%, #3d1822 100%);
  position: relative;
}
.cover-spine::after {
  content: '';
  position: absolute;
  inset: 14mm 6px;
  border-top: 1px solid rgba(196,165,116,.45);
  border-bottom: 1px solid rgba(196,165,116,.45);
}
.cover-main {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10mm 18mm;
}
.cover-frame {
  position: absolute;
  inset: 10mm 12mm 10mm 8mm;
  border: 1px solid rgba(196,165,116,.35);
  pointer-events: none;
}
.cover-frame::before,
.cover-frame::after {
  content: '';
  position: absolute;
  width: 18px; height: 18px;
  border-color: var(--burgundy);
  border-style: solid;
}
.cover-frame::before {
  top: -1px; right: -1px;
  border-width: 1.5px 1.5px 0 0;
}
.cover-frame::after {
  bottom: -1px; left: -1px;
  border-width: 0 0 1.5px 1.5px;
}
.cover-corner-tl, .cover-corner-br {
  position: absolute;
  width: 18px; height: 18px;
  border-color: var(--burgundy);
  border-style: solid;
  pointer-events: none;
  z-index: 2;
}
.cover-corner-tl {
  top: calc(10mm - 1px); left: calc(8mm - 1px);
  border-width: 1.5px 0 0 1.5px;
}
.cover-corner-br {
  bottom: calc(10mm - 1px); right: calc(12mm - 1px);
  border-width: 0 1.5px 1.5px 0;
}
.cover-inner {
  position: relative; z-index: 1;
  text-align: center;
  display: flex; flex-direction: column; align-items: center;
  max-width: 640px;
}
.cover-kicker {
  font-size: 10px;
  letter-spacing: .48em;
  color: var(--burgundy);
  font-weight: 700;
  margin-bottom: 18px;
  margin-right: -.48em;
}
.cover-logo {
  width: 132px; height: 132px;
  border-radius: 50%;
  background: #fff;
  padding: 16px;
  margin-bottom: 22px;
  box-shadow:
    0 0 0 1px rgba(196,165,116,.4),
    0 0 0 8px rgba(255,255,255,.65),
    0 22px 50px rgba(40,20,25,.07);
}
.cover-logo img { width: 100%; height: 100%; object-fit: contain; }
.cover-en {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 48px;
  letter-spacing: .28em;
  font-weight: 600;
  margin-right: -.28em;
  line-height: 1;
  color: #141214;
  white-space: nowrap;
}
.cover-divider {
  display: flex; align-items: center; gap: 14px;
  margin: 16px 0 12px;
  color: var(--gold-deep);
  font-size: 11px;
  letter-spacing: .4em;
  font-weight: 600;
  margin-right: -.4em;
}
.cover-divider::before,
.cover-divider::after {
  content: '';
  width: 42px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-deep), transparent);
}
.cover-ar {
  font-size: 20px;
  font-weight: 700;
  color: #5a5456;
  letter-spacing: .18em;
}
.cover-tag {
  margin-top: 10px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 16px;
  font-style: italic;
  color: #8a7a70;
  letter-spacing: .06em;
}
.made-in {
  margin-top: 28px;
  display: inline-flex; align-items: center; gap: 12px;
  padding: 12px 24px;
  border: 1px solid rgba(196,165,116,.55);
  border-radius: 999px;
  font-size: 13px;
  color: #2a2426;
  background: rgba(255,255,255,.88);
  letter-spacing: .02em;
  box-shadow: 0 8px 24px rgba(40,20,25,.04);
}
.made-in strong { font-weight: 800; color: var(--burgundy); }

/* ========== INDEX ========== */
.index {
  grid-template-columns: 98mm 1fr;
}
.index-side {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(196,165,116,.18), transparent 50%),
    linear-gradient(165deg, #120c0e 0%, #2a151c 48%, #4a2430 100%);
  color: #fff;
  padding: 16mm 13mm 14mm;
  display: flex; flex-direction: column; justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.index-side::before {
  content: 'RC';
  position: absolute;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 180px;
  font-weight: 600;
  opacity: .05;
  left: -10px; bottom: -40px;
  letter-spacing: -.04em;
  line-height: 1;
}
.index-kicker {
  font-size: 10px;
  letter-spacing: .36em;
  color: var(--gold);
  font-weight: 700;
  margin-bottom: 16px;
}
.index-side h1 {
  font-size: 34px;
  font-weight: 900;
  line-height: 1.25;
  position: relative; z-index: 1;
}
.index-side .gold-line {
  width: 48px; height: 1.5px;
  background: var(--gold);
  margin: 16px 0 14px;
}
.index-side .sub {
  font-size: 13.5px;
  line-height: 1.9;
  color: rgba(255,255,255,.7);
  position: relative; z-index: 1;
  max-width: 240px;
}
.index-side .italy {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px;
  color: rgba(255,255,255,.88);
  position: relative; z-index: 1;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.12);
}
.index-main {
  padding: 12mm 12mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  background:
    linear-gradient(180deg, #fffefc, #faf7f3);
}
.ix {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 11px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(232,226,220,.9);
  box-shadow: 0 4px 14px rgba(30,20,20,.03);
  position: relative;
  overflow: hidden;
}
.ix::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; right: 0;
  width: 3.5px;
  background: var(--a);
}
.ix-num {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  font-weight: 600;
  color: var(--a);
  line-height: 1;
  letter-spacing: .02em;
}
.ix strong {
  display: block;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 800;
}
.ix small {
  color: var(--muted);
  font-size: 11.5px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  letter-spacing: .06em;
  font-style: italic;
}
.ix-count {
  font-size: 11px;
  color: var(--muted);
  background: var(--mist);
  padding: 5px 10px;
  border-radius: 999px;
  white-space: nowrap;
  font-weight: 700;
}

/* ========== FAMILY ========== */
.family {
  grid-template-columns: 1.02fr 1fr;
  background: #fff;
}
.family-rail {
  position: absolute;
  top: 0; bottom: 0; right: 0;
  width: 5px;
  background: linear-gradient(180deg, var(--a), color-mix(in srgb, var(--a) 40%, #1a1012));
  z-index: 4;
}
.family-panel {
  padding: 14mm 14mm 12mm 12mm;
  display: flex; flex-direction: column; justify-content: center;
  position: relative;
  background: #fff;
  z-index: 1;
}
.fp-eyebrow {
  display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
}
.col-num {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: var(--a);
  width: 36px; height: 36px;
  border-radius: 50%;
  display: grid; place-items: center;
  letter-spacing: .04em;
}
.col-label {
  font-size: 11px;
  letter-spacing: .32em;
  font-weight: 800;
  color: var(--a);
}
.family-panel h2 {
  font-size: 29px;
  font-weight: 900;
  line-height: 1.28;
  margin-bottom: 6px;
  max-width: 420px;
}
.family-panel .en {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 22px;
  color: var(--a);
  letter-spacing: .08em;
  font-style: italic;
}
.family-panel .desc {
  font-size: 14px;
  color: var(--soft-ink);
  line-height: 1.95;
  max-width: 430px;
}
.fp-meta {
  display: flex; gap: 10px;
  margin-top: 22px;
}
.meta-box {
  min-width: 88px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--tint);
}
.meta-k {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 2px;
  letter-spacing: .06em;
}
.meta-box strong {
  font-size: 16px;
  font-weight: 800;
  color: var(--a);
  font-family: 'Cormorant Garamond', Georgia, serif;
  letter-spacing: .04em;
}
.fp-foot {
  margin-top: 22px;
  display: flex; align-items: center; gap: 10px;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.fp-foot .dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--gold);
}
.family-gallery {
  background: #f2f2f2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 11mm 10mm;
  position: relative;
  z-index: 1;
}
.gallery-label {
  font-size: 10px;
  letter-spacing: .28em;
  color: var(--a);
  font-weight: 800;
  margin-bottom: 12px;
  text-align: center;
}
.gallery {
  display: grid; gap: 10px;
  width: 100%;
}
.gallery.n1, .gallery.n2 { grid-template-columns: 1fr 1fr; }
.gallery.n3, .gallery.n4 { grid-template-columns: 1fr 1fr; }
.gallery.n5, .gallery.n6 { grid-template-columns: 1fr 1fr 1fr; }
.thumb {
  background: #ffffff;
  border: 3px solid #111111;
  border-radius: 10px;
  padding: 10px 8px 8px;
  text-align: center;
  box-shadow: none;
}
.thumb-stage {
  height: 100px;
  display: grid; place-items: center;
  margin-bottom: 6px;
  background: #ffffff;
  border-radius: 0;
}
.thumb img {
  max-height: 94px;
  max-width: 94%;
  filter: none;
}
.thumb figcaption {
  font-size: 9.5px;
  color: var(--muted);
  line-height: 1.35;
  min-height: 26px;
  padding: 0 2px;
}
.wm-num {
  position: absolute;
  left: 8mm; bottom: -8mm;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 220px;
  font-weight: 600;
  color: var(--a);
  opacity: .05;
  line-height: 1;
  z-index: 0;
  pointer-events: none;
}

/* ========== PRODUCT ========== */
.product {
  grid-template-columns: 1.12fr 1fr;
}
.p-visual {
  background: #f2f2f2;
  display: flex;
  flex-direction: column;
  padding: 9mm 9mm 8mm;
  position: relative;
}
.p-stage {
  flex: 1;
  position: relative;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #ffffff !important;
  border: 3.5px solid #111111;
  box-shadow: none;
  overflow: hidden;
}
.p-halo {
  display: none;
}
.p-stage img {
  position: relative;
  z-index: 1;
  max-height: 142mm;
  max-width: 90%;
  filter: none;
}
.p-floor {
  display: none;
}
.p-visual-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--muted);
  letter-spacing: .08em;
  padding: 0 4px;
}
.p-content {
  padding: 11mm 13mm 10mm 11mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #fffefc;
  position: relative;
  border-right: 1px solid var(--line);
}
.p-accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--a), var(--gold));
}
.p-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.p-chip {
  font-size: 10.5px;
  font-weight: 800;
  color: var(--a);
  background: color-mix(in srgb, var(--a) 8%, #fff);
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--a) 16%, #fff);
}
.p-count {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .1em;
  font-weight: 600;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 14px;
}
.p-brand {
  font-family: 'Cormorant Garamond', Georgia, serif;
  letter-spacing: .26em;
  font-size: 12px;
  color: #9a9194;
  margin-bottom: 6px;
}
.p-content h1 {
  font-size: 21px;
  font-weight: 900;
  line-height: 1.35;
}
.p-content .ornament { margin: 10px 0 12px; }
.p-lead {
  color: var(--soft-ink);
  font-size: 12.5px;
  line-height: 1.85;
  margin-bottom: 12px;
}
.p-bullets {
  list-style: none;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.p-bullets li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
  color: #333;
  line-height: 1.55;
  padding: 7px 10px;
  background: var(--mist);
  border-radius: 10px;
  border-right: 3px solid var(--a);
}
.p-bullets li::before { content: none; }
.p-bullets li span { flex: 1; }
.p-prices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.price {
  border-radius: 16px;
  padding: 14px 12px 12px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.price-label {
  display: block;
  font-size: 10.5px;
  margin-bottom: 4px;
  font-weight: 700;
  letter-spacing: .04em;
}
.price strong {
  display: block;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.2;
}
.price.retail {
  background:
    linear-gradient(145deg, #120c0e 0%, #2a151c 55%, #3d1e28 100%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(20,10,12,.18);
}
.price.retail strong { color: #e8c99a; }
.price.wholesale {
  background: #fff;
  border: 1.5px solid var(--a);
  color: var(--ink);
  box-shadow: 0 8px 20px rgba(30,20,20,.04);
}
.price.wholesale .price-label { color: var(--a); }
.price.wholesale strong { color: var(--a); }
.p-foot {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.p-sku {
  font-size: 11px;
  color: #aaa;
  letter-spacing: .04em;
}
.p-italy {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .06em;
}
.p-italy .flag { width: 18px; height: 12px; }

/* ========== CLOSING ========== */
.closing {
  display: grid;
  grid-template-columns: 18mm 1fr;
  background:
    radial-gradient(ellipse 70% 55% at 55% 55%, rgba(196,165,116,.10), transparent 60%),
    linear-gradient(180deg, #fffefc 0%, #faf6f1 100%);
}
.closing .cover-main {
  justify-content: center;
}
.closing h2 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 46px;
  letter-spacing: .26em;
  font-weight: 600;
  margin-right: -.26em;
  color: #141214;
  white-space: nowrap;
}
.closing .thanks {
  font-size: 16px;
  color: #5a5456;
  letter-spacing: .12em;
  font-weight: 600;
  margin-top: 4px;
}
.closing .cover-tag {
  margin-top: 8px;
}

@media print {
  body { background: #fff; }
  .sheet { box-shadow: none; margin: 0; }
}
@page { size: A4 landscape; margin: 0; }
"""


def build() -> str:
    products = apply_prices(PRODUCTS)
    grouped = assign(products)
    index_items = []
    body = []
    for fam in FAMILIES:
        items = grouped[fam["id"]]
        if not items:
            continue
        index_items.append(f"""
        <div class="ix" style="--a:{fam['accent']}">
          <div class="ix-num">{fam['num']}</div>
          <div>
            <strong>{e(fam['title'])}</strong>
            <small>{e(fam['en'])}</small>
          </div>
          <span class="ix-count">{len(items)} منتجات</span>
        </div>""")
        body.append(family_page(fam, items))
        for i, p in enumerate(items, 1):
            body.append(product_page(p, fam, i, len(items)))

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>كتالوج ريتينول كومبلكس</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
<style>{CSS}</style>
</head>
<body>

<section class="sheet cover">
  <div class="cover-spine" aria-hidden="true"></div>
  <div class="cover-main">
    <div class="cover-frame" aria-hidden="true"></div>
    <span class="cover-corner-tl" aria-hidden="true"></span>
    <span class="cover-corner-br" aria-hidden="true"></span>
    <div class="cover-inner">
      <p class="cover-kicker">PROFESSIONAL HAIR &amp; SKIN CARE</p>
      <div class="cover-logo"><img src="{BRAND_LOGO}" alt="Retinol Complex" /></div>
      <div class="cover-en">RETINOL COMPLEX</div>
      <div class="cover-divider">ITALY</div>
      <div class="cover-ar">كتالوج المنتجات</div>
      <p class="cover-tag">Italian Professional Beauty</p>
      <div class="made-in">
        {ITALY_FLAG}
        <span>صُنع في <strong>إيطاليا</strong> · Made in Italy</span>
      </div>
    </div>
  </div>
</section>

<section class="sheet index">
  <div class="index-side">
    <div>
      <p class="index-kicker">INDEX</p>
      <h1>المجموعات<br>والعوائل</h1>
      <div class="gold-line"></div>
      <p class="sub">عناية احترافية بالشعر والبشرة بجودة إيطالية أصيلة — مختارة بعناية لكل احتياج.</p>
    </div>
    <div class="italy">
      {ITALY_FLAG}
      <span>Made in Italy · Retinol Complex</span>
    </div>
  </div>
  <div class="index-main">{"".join(index_items)}</div>
</section>

{"".join(body)}

<section class="sheet closing">
  <div class="cover-spine" aria-hidden="true"></div>
  <div class="cover-main">
    <div class="cover-frame" aria-hidden="true"></div>
    <span class="cover-corner-tl" aria-hidden="true"></span>
    <span class="cover-corner-br" aria-hidden="true"></span>
    <div class="cover-inner">
      <div class="cover-logo"><img src="{BRAND_LOGO}" alt="" /></div>
      <h2>RETINOL COMPLEX</h2>
      <div class="cover-divider">ITALY</div>
      <p class="thanks">عناية إيطالية متكاملة</p>
      <p class="cover-tag">Thank you · Grazie</p>
      <div class="made-in">
        {ITALY_FLAG}
        <span>صُنع في <strong>إيطاليا</strong> · Made in Italy</span>
      </div>
    </div>
  </div>
</section>

</body>
</html>"""


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    products = apply_prices(PRODUCTS)
    # persist corrected shampoo/conditioner prices
    (ROOT / "products.json").write_text(
        json.dumps(products, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    g = assign(products)
    print("Wrote", OUT)
    for f in FAMILIES:
        print(f"  {f['num']} {f['title']}: {len(g[f['id']])}")
    sh = [p for p in products if "شامبو" in p["nameAr"]]
    cd = [p for p in products if "بلسم" in p["nameAr"]]
    print(f"  shampoo prices: {{{sorted({p['price'] for p in sh})}}} wholesale {{{sorted({p['wholesale'] for p in sh})}}}")
    print(f"  conditioner prices: {{{sorted({p['price'] for p in cd})}}} wholesale {{{sorted({p['wholesale'] for p in cd})}}}")
