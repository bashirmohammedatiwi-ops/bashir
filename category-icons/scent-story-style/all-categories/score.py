import json, os, sys, numpy as np
from PIL import Image
from scipy import ndimage
SC=sys.argv[1]
d=json.load(open(f'{SC}/cats/cands_raw.json'))
cache={}
def score(pid):
    f=f'{SC}/cats/thumb/{pid[:12]}.webp'
    if not os.path.exists(f): return None
    if pid in cache: return cache[pid]
    try: im=Image.open(f).convert('RGB')
    except Exception: return None
    a=np.asarray(im.resize((256,256))).astype(np.int16)
    b=np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)])
    bg=np.median(b,0); bstd=np.abs(b-bg).max(1).mean(); bright=bg.mean()
    fg=np.abs(a-bg).max(2)>28
    fill=fg.mean()
    lab,n=ndimage.label(fg)
    sizes=ndimage.sum(fg,lab,range(1,n+1)) if n else np.array([0])
    big=(sizes>40).sum()
    main=sizes.max()/max(fg.sum(),1)
    sat=(a.max(2)-a.min(2))[fg].mean() if fg.any() else 0
    s=0
    s+= 3 if bright>235 else (1.5 if bright>200 else 0)
    s+= 2 if bstd<6 else (1 if bstd<14 else -2)
    s+= 2 if 0.12<fill<0.55 else (0.5 if 0.06<fill<0.7 else -2)
    s+= 2*main            # one dominant object
    s-= 0.25*max(0,big-3)  # many separate blobs = collage / text
    s+= min(sat,80)/80     # colourful product reads better
    r=dict(s=round(float(s),2),bright=round(float(bright)),bstd=round(float(bstd),1),fill=round(float(fill),2),big=int(big),main=round(float(main),2))
    cache[pid]=r; return r
out={}
for x in d:
    r=score(x['pid'])
    if r is None: continue
    out.setdefault(x['cid'],[]).append({**x,**r})
for k in out: out[k].sort(key=lambda x:(-x['s'],-x['w']))
json.dump(out,open(f'{SC}/cats/ranked.json','w'),ensure_ascii=False)
print(len(out))
