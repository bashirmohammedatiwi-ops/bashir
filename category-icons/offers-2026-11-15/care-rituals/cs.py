# contact sheet: cs.py out.jpg files...  (labels with index + size)
import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; fs=sys.argv[2:]; T=260; cols=6
ims=[]
for f in fs:
    try:
        im=Image.open(f); sz=im.size; im=im.convert('RGB'); im.thumbnail((T,T)); ims.append((f,sz,im))
    except Exception as e: pass
rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*(T+6),rows*(T+30)),'#888'); d=ImageDraw.Draw(S)
for i,(f,sz,im) in enumerate(ims):
    x=(i%cols)*(T+6); y=(i//cols)*(T+30); S.paste(im,(x,y)); d.text((x+2,y+T+2),f"{i} {sz[0]}x{sz[1]}",fill='white'); d.text((x+2,y+T+14),f.split('/')[-1][:40],fill='yellow')
S.save(out,quality=80)
for i,(f,sz,im) in enumerate(ims): print(i,f,sz)
