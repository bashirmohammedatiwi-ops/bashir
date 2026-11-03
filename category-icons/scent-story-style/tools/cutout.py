# cutout.py in.webp out.png : remove the border-connected studio background, trim, keep a soft edge
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
im = Image.open(sys.argv[1]).convert('RGB')
a = np.asarray(im).astype(np.int16)
h, w, _ = a.shape
border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
bg = np.median(border, axis=0)
dist = np.abs(a - bg).max(axis=2)
tol = float(sys.argv[3]) if len(sys.argv) > 3 else 18
cand = dist <= tol
lab, n = ndimage.label(cand)
edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bgmask = np.isin(lab, list(edge_labels))
bgmask = ndimage.binary_opening(bgmask, iterations=1)
alpha = np.where(bgmask, 0, 255).astype(np.uint8)
am = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2))
rgba = im.convert('RGBA'); rgba.putalpha(am)
bbox = am.point(lambda v: 255 if v > 24 else 0).getbbox()
if bbox: rgba = rgba.crop(bbox)
rgba.save(sys.argv[2])
print(sys.argv[1], 'bg', bg.astype(int).tolist(), 'size', rgba.size)
