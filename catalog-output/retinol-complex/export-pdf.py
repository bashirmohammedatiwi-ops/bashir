#!/usr/bin/env python3
"""Export catalog PDF at true web quality (high-DPI sheet screenshots)."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
HTML = ROOT / "index.html"
PDF_OUT = Path("/Users/cloud/Desktop/Retinol_Complex_Catalog.pdf")
DESK = Path("/Users/cloud/Desktop/Retinol_Complex_Catalog")
PAGES_DIR = ROOT / "pdf-render-pages"

# CSS design size in px at 96dpi: 297mm≈1123px, 210mm≈794px — capture at 3x for sharper labels
BASE_W, BASE_H = 1123, 794
SCALE = 3
OUT_W, OUT_H = int(BASE_W * SCALE), int(BASE_H * SCALE)  # ~3369 x 2382


def export() -> None:
    if PAGES_DIR.exists():
        shutil.rmtree(PAGES_DIR)
    PAGES_DIR.mkdir()

    images: list[Path] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={"width": BASE_W, "height": BASE_H + 40},
            device_scale_factor=SCALE,
        )
        page = context.new_page()
        page.goto(HTML.resolve().as_uri(), wait_until="networkidle", timeout=180000)
        page.evaluate("() => document.fonts.ready")
        page.wait_for_timeout(1000)

        # Normalize every sheet to exact design size before capture
        page.evaluate(
            """([w, h]) => {
              document.body.style.background = '#fff';
              document.querySelectorAll('.sheet').forEach((el) => {
                el.style.width = w + 'px';
                el.style.height = h + 'px';
                el.style.minHeight = h + 'px';
                el.style.maxHeight = h + 'px';
                el.style.margin = '0';
                el.style.boxShadow = 'none';
                el.style.pageBreakAfter = 'auto';
              });
            }""",
            [BASE_W, BASE_H],
        )
        page.wait_for_timeout(300)

        sheets = page.query_selector_all(".sheet")
        print(f"Rendering {len(sheets)} pages @ {SCALE}x ({OUT_W}x{OUT_H})...")
        for i, sheet in enumerate(sheets, 1):
            # scroll into view for lazy images
            sheet.scroll_into_view_if_needed()
            page.wait_for_timeout(60)
            dest = PAGES_DIR / f"page-{i:03d}.png"
            sheet.screenshot(path=str(dest), type="png")
            images.append(dest)
            if i % 10 == 0 or i == len(sheets):
                print(f"  {i}/{len(sheets)}")
        browser.close()

    pil_pages: list[Image.Image] = []
    for path in images:
        im = Image.open(path).convert("RGB")
        if im.size != (OUT_W, OUT_H):
            # pad/crop to exact size on white if browser rounded differently
            canvas = Image.new("RGB", (OUT_W, OUT_H), (255, 255, 255))
            im_fit = im.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS) if abs(im.size[0]-OUT_W)>4 else im
            if im_fit.size != (OUT_W, OUT_H):
                im_fit = im.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
            canvas.paste(im_fit, (0, 0))
            im = canvas
        pil_pages.append(im)

    first, rest = pil_pages[0], pil_pages[1:]
    first.save(
        PDF_OUT,
        "PDF",
        resolution=96 * SCALE,
        save_all=True,
        append_images=rest,
        quality=96,
        optimize=True,
    )
    print(f"PDF: {PDF_OUT} ({PDF_OUT.stat().st_size/1024/1024:.1f} MB)")

    # sanity check sizes
    sizes = {Image.open(p).size for p in images[:5]}
    print("sample page sizes:", sizes)

    if DESK.exists():
        shutil.rmtree(DESK)
    DESK.mkdir()
    shutil.copy2(HTML, DESK / "index.html")
    shutil.copy2(ROOT / "brand-logo.png", DESK / "brand-logo.png")
    shutil.copytree(ROOT / "product-photos", DESK / "product-photos")
    if (ROOT / "images").exists():
        shutil.copytree(ROOT / "images", DESK / "images")
    shutil.copy2(PDF_OUT, DESK / "Retinol_Complex_Catalog.pdf")
    print(f"Desktop: {DESK}")


if __name__ == "__main__":
    export()
