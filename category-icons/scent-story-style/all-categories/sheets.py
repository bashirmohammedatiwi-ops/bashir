import json, sys
from PIL import Image, ImageDraw, ImageFont
SC=sys.argv[1]
r=json.load(open(f'{SC}/cats/ranked.json')); allc={x['id']:x for x in json.load(open(f'{SC}/cats/all.json'))}
def order_key(cid):
    c=allc[cid]; chain=[]
    while c: chain.insert(0,(c['pos'],c['name'])); c=allc.get(c['parent']) if c['parent'] else None
    return chain
cids=sorted(r, key=order_key)
json.dump(cids,open(f'{SC}/cats/order.json','w'))
T=150; N=10; ROWS=12
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
for si in range(0,len(cids),ROWS):
    chunk=cids[si:si+ROWS]
    sheet=Image.new('RGB',(70+N*T,len(chunk)*(T+6)),'white'); dr=ImageDraw.Draw(sheet)
    for ri,cid in enumerate(chunk):
        y=ri*(T+6); dr.text((6,y+60),str(si+ri),fill='red',font=font)
        for j,x in enumerate(r[cid][:N]):
            try: im=Image.open(f"{SC}/cats/thumb/{x['pid'][:12]}.webp").convert('RGB')
            except Exception: continue
            im.thumbnail((T-4,T-4)); sheet.paste(im,(70+j*T+(T-im.width)//2,y+(T-im.height)//2))
            dr.text((70+j*T+3,y+2),str(j),fill='blue',font=font)
    sheet.save(f'{SC}/cats/sheet_{si//ROWS}.jpg',quality=85)
for i,cid in enumerate(cids):
    c=allc[cid]; print(i, c['name'], '<', c['pname'] or '-', 'n=',c['n'])
