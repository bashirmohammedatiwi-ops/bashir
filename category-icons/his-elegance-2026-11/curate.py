import json, re, sys
rows=[l.rstrip('\n').split('|') for l in open('all.txt')]
P=[(i,r) for i,r in enumerate(rows,1) if len(r)>=7 and r[5] in ('عطور رجالية','عطور للجنسين')]
def find(brand, pat, avoid=None):
    for i,r in P:
        t=(r[2]+' '+r[3]).lower()
        if (brand is None or r[0]==brand) and re.search(pat,t) and not (avoid and re.search(avoid,t)): return i
    return None
L={
'icons':[('christian-dior','sauvage'),('chanel','bleu'),('giorgio-armani','acqua di gio|أكوا دي جيو|اكوا دي جيو'),('versace','eros'),('paco-rabanne','million|مليون'),('jean-paul-gaultier','le male|لو مال'),
         ('yves-saint-laurent','nuit'),('paco-rabanne','invictus|إنفكتوس|انفكتوس'),('hugo-boss','bottled|بوتلد'),('montblanc','explorer|إكسبلورر|اكسبلورر'),('dolce--gabbana','the one|ذا ون'),
         ('carolina-herrera','bad boy|باد بوي'),('valentino','born in roma|بورن'),('givenchy','gentleman|جنتلمان'),('montblanc','legend|ليجند'),('dolce--gabbana',r'\bk\b|كي باي'),('giorgio-armani','code|كود'),('prada','luna|لونا')],
'fresh':[('giorgio-armani','acqua di gio|أكوا دي جيو|اكوا دي جيو'),('christian-dior','sauvage'),('dolce--gabbana','light blue|لايت بلو'),('versace','pour homme|بور هوم'),('chanel','allure.*sport|سبورت'),('prada','ocean|أوشن'),('hugo-boss','bottled|بوتلد'),('mancera','aqua|أكوا|cedrat|سيدرات'),('montale','aqua|أكوا|blue|أزرق'),('creed','silver|سيلفر')],
'woody':[('chanel','bleu'),('tom-ford','tuscan|توسكان|oud|عود'),('montblanc','explorer|إكسبلورر|اكسبلورر'),('bvlgari','wood|وود'),('givenchy','gentleman|جنتلمان'),('parfums-de-marly','haltane|هالتان'),('cartier','declaration|ديكلاراسيون'),('burberry','hero|هيرو'),('hermes','terre|تير')],
'oriental':[('xerjoff','alexandria|ألكسندريا|الكسندريا'),('mancera','aoud|عود'),('montale','oud|عود|aoud'),('tom-ford','myrrh|مير|oud|عود'),('amouage','.'),('parfums-de-marly','althair|ألتير|oajan|أوجان'),('xerjoff','naxos|ناكسوس|casamorati|كازاموراتي'),('sospiro','.'),('lorientale-fragrances','.')],
'leather':[('tom-ford','tuscan|توسكان|leather|ليذر'),('mancera','tobacco|توباكو'),('tom-ford','tobacco|توباكو|cherry smoke|سموك'),('yves-saint-laurent','nuit'),('jean-paul-gaultier','elixir|إليكسير|اليكسير'),('christian-dior','fahrenheit|فهرنهايت|فهرينهايت'),('paco-rabanne','million|مليون'),('parfums-de-marly','layton|لايتون|herod|هيرود')],
'citrus':[('tom-ford','neroli|نيرولي'),('dolce--gabbana','light blue|لايت بلو'),('versace','dylan|ديلان'),('chanel','allure|ألور|الور'),('bvlgari','neroli|نيرولي|pour homme|بور هوم'),('mancera','cedrat|سيدرات|aqua|أكوا'),('christian-dior','sport|سبورت|cologne|كولونيا')],
'work':[('chanel','bleu'),('christian-dior','dior homme|ديور هوم'),('giorgio-armani','acqua di gio|أكوا دي جيو|اكوا دي جيو'),('montblanc','legend|ليجند'),('hugo-boss','bottled|بوتلد'),('givenchy','gentleman|جنتلمان'),('cartier','declaration|ديكلاراسيون|pasha|باشا'),('bvlgari','man|مان')],
'night':[('yves-saint-laurent','nuit'),('jean-paul-gaultier','elixir|إليكسير|اليكسير|le male|لو مال'),('paco-rabanne','million|مليون'),('versace','eros|إيروس|ايروس'),('valentino','born in roma|بورن'),('carolina-herrera','bad boy|باد بوي|vip'),('dolce--gabbana','the one|ذا ون'),('tom-ford','.'),('giorgio-armani','code|كود')],
'summer':[('giorgio-armani','acqua di gio|أكوا دي جيو|اكوا دي جيو'),('dolce--gabbana','light blue|لايت بلو'),('tom-ford','neroli|نيرولي'),('versace','dylan|ديلان|pour homme'),('prada','ocean|أوشن'),('chanel','sport|سبورت|riviera'),('hugo-boss','.'),('mancera','aqua|أكوا|cedrat'),('montale','aqua|blue')],
'winter':[('tom-ford','tuscan|توسكان|tobacco|توباكو'),('parfums-de-marly','layton|لايتون|althair|ألتير'),('xerjoff','alexandria|ألكسندريا|الكسندريا|naxos'),('jean-paul-gaultier','elixir|إليكسير|اليكسير'),('yves-saint-laurent','nuit'),('mancera','tobacco|توباكو|aoud'),('christian-dior','elixir|إليكسير|اليكسير'),('montblanc','legend night|نايت|explorer')],
'classic':[('christian-dior','fahrenheit|فهرنهايت|فهرينهايت'),('giorgio-armani','eau pour homme|armani eau|ارماني او'),('cartier','pasha|باشا'),('chanel','antaeus|انتيوس'),('chanel','monsieur|موسيو'),('christian-dior','dior homme|ديور هوم'),('aramis','.'),('hermes','terre|تير'),('chanel','allure homme e|الور هوم او')],
'gift':[('christian-dior','sauvage'),('chanel','bleu'),('tom-ford','.'),('parfums-de-marly','layton|لايتون'),('creed','.'),('xerjoff','.'),('amouage','.'),('cartier','.'),('yves-saint-laurent','.')],
'unisex':[('tom-ford','.'),('xerjoff','.'),('mancera','.'),('montale','.'),('lorientale-fragrances','.'),('bdk','.'),('thomas-kosmala','.'),('etat-libre-d-orange','.'),('tom-ford','cherry|neroli|oud'),('xerjoff','erba|naxos'),('mancera','aoud|red tobacco'),('montale','.'),('essential','.'),('fugazzi','.'),('chanel','riviera'),('amouage','.')],
}
out={}
for k,qs in L.items():
    ids=[]
    for b,p in qs:
        i=None
        for ii,r in P:
            t=(r[2]+' '+r[3]).lower()
            if r[0]==b and re.search(p,t) and r[1] not in ids and not re.search(r'للسيدات|نسائي|women|femme|for her|pour femme',t): i=ii; break
        if i: ids.append(rows[i-1][1]); 
        else: print('  miss',k,b,p, file=sys.stderr)
    out[k]=ids
    print(k,len(ids),' / '.join(next(r[3][:28] or r[2][:28] for _,r in P if r[1]==x) for x in ids))
json.dump(out,open('lists.json','w'))
