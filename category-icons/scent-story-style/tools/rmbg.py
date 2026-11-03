import sys, glob, os
from rembg import remove, new_session
from PIL import Image
src, dst, model = sys.argv[1], sys.argv[2], sys.argv[3]
sess = new_session(model)
for f in sorted(glob.glob(os.path.join(src, '*.webp'))):
    out = os.path.join(dst, os.path.basename(f)[:-5] + '.png')
    if os.path.exists(out): continue
    im = Image.open(f).convert('RGB')
    # upscale small images so edges are smoother
    if max(im.size) < 1000:
        s = 1000 / max(im.size); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    r = remove(im, session=sess, post_process_mask=True)
    bb = r.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if bb: r = r.crop(bb)
    r.save(out); print('ok', os.path.basename(out), r.size, flush=True)
