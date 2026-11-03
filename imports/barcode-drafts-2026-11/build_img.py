import sys, os, json, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0,'.')
from manifest import NEW, EXISTING, CROP, ROT
S=1600
def studio(src,dst,margin=0.07):
    im=Image.open(src).convert('RGBA'); bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); rgb=bg.convert('RGB')
    a=np.asarray(rgb).astype(int); ys,xs=np.where(a.min(2)<246)
    if len(xs): rgb=rgb.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    w,h=rgb.size; s=min(S*(1-2*margin)/w,S*(1-2*margin)/h); rgb=rgb.resize((round(w*s),round(h*s)),Image.LANCZOS)
    can=Image.new('RGB',(S,S),'white'); can.paste(rgb,((S-rgb.width)//2,(S-rgb.height)//2)); can.save(dst,quality=92)
def boxshot(src,dst,key):
    im=Image.open(src).convert('RGB')
    if key in CROP:
        l,t,r,b=CROP[key]; w,h=im.size; im=im.crop((int(l*w),int(t*h),int(r*w),int(b*h)))
    if key in ROT: im=im.rotate(ROT[key],expand=True)
    w,h=im.size; s=min(S*0.8/w,S*0.8/h); im=im.resize((round(w*s),round(h*s)),Image.LANCZOS)
    can=Image.new('RGB',(S,S),'white'); x,y=(S-im.width)//2,(S-im.height)//2
    sh=Image.new('L',(S,S),0); sh.paste(70,(x+18,y+26,x+im.width+18,y+im.height+26)); sh=sh.filter(ImageFilter.GaussianBlur(28))
    can.paste(Image.new('RGB',(S,S),(120,120,120)),(0,0),sh); can.paste(im,(x,y)); can.save(dst,quality=92)
out={}
for i,p in list(NEW.items())+[(k,dict(img=[v['img']])) for k,v in EXISTING.items() if v.get('img')]:
    files=[]
    for j,src in enumerate(p['img']):
        if src.startswith('EXISTING:'): files.append(src); continue
        dst=f'final/n{i}_{j}.jpg'
        if src.startswith('rect/'): boxshot(src,dst,os.path.basename(src)[:-4])
        else: studio(src,dst)
        files.append(os.path.basename(dst))
    out[i]=files
json.dump(out,open('final/images.json','w')); print(len(out))
