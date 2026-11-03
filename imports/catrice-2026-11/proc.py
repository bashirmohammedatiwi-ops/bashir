import json, numpy as np, os, sys
from PIL import Image
S=1600; M=0.07
def norm(src, dst):
    im=Image.open(src)
    im=im.convert('RGBA')
    bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); rgb=bg.convert('RGB')
    a=np.asarray(rgb).astype(int)
    mask=(a.min(2)<246)
    ys,xs=np.where(mask)
    if len(xs)==0: rgb.save(dst,quality=92); return
    x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    crop=rgb.crop((x0,y0,x1+1,y1+1))
    w,h=crop.size; inner=S*(1-2*M); s=min(inner/w,inner/h)
    crop=crop.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    can=Image.new('RGB',(S,S),'white'); can.paste(crop,((S-crop.width)//2,(S-crop.height)//2))
    can.save(dst,quality=92)
def hexof(src):
    a=np.asarray(Image.open(src).convert('RGB')).astype(int); h,w,_=a.shape
    c=a[h//4:3*h//4,w//4:3*w//4].reshape(-1,3); m=np.median(c,0).astype(int)
    return '#%02X%02X%02X'%tuple(m)
if __name__=='__main__':
    meta=json.load(open('meta.json'))
    out={}
    for bc,m in meta.items():
        r={}
        if m['pack']: norm(f"off/{m['pack']}.png",f'proc/s_{bc}.jpg'); r['shade']=f's_{bc}.jpg'
        if m['texture']: norm(f"off/{m['texture']}.png",f'proc/t_{bc}.jpg'); r['texture']=f't_{bc}.jpg'
        if m['dot']: r['hex']=hexof(f"off/{m['dot']}.png")
        out[bc]=r
    for bc,src in [('4059729246455','ms/2718385.jpg'),('4059729246462','ms/2718386.jpg')]:
        norm(src,f'proc/s_{bc}.jpg'); out[bc]={'shade':f's_{bc}.jpg','hex':'#1E1E1E' if bc.endswith('55') else '#5A5A5E'}
    json.dump(out,open('proc.json','w'))
    print(len(out), len(os.listdir('proc')))
