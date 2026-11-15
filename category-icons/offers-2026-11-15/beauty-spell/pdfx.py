# usage: python3 -I pdfx.py <pdf> <outdir> <prefix>  -> extracts embedded images >= 900px on short side
import sys, os, fitz
pdf, out, pre = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
d = fitz.open(pdf); seen = set()
for pno in range(len(d)):
    for img in d.get_page_images(pno):
        x = img[0]
        if x in seen: continue
        seen.add(x)
        try: pix = fitz.Pixmap(d, x)
        except Exception as e: print('err', e); continue
        if min(pix.width, pix.height) < int(os.environ.get('MINPX', 900)): continue
        if pix.n - pix.alpha >= 4: pix = fitz.Pixmap(fitz.csRGB, pix)
        if pix.alpha: pix = fitz.Pixmap(pix, 0)
        p = f'{out}/{pre}_p{pno+1:02d}_{x}.jpg'; pix.save(p, jpg_quality=95); print(p.split('/')[-1], pix.width, pix.height)
