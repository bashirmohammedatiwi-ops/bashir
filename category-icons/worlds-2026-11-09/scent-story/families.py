import json,re
d=json.load(open('current.json'))
P=[]
for b in d['brands']:
  for p in b['top']: P.append({**p,'brand':b['slug']})
F={
 'floral':[r"miss dior",r"j.?adore",r"\bjoy\b",r"chance",r"gabrielle",r"coco mademoiselle",r"id[oô]le",r"bloom",r"flora\b",r"born in roma donna|donna born in roma",r"valentina",r"delina",r"musky garden",r"jasmin exclusif",r"bright crystal",r"love,? chlo|chlo[ée] eau de parfum|roses de chlo|signature le parfum",r"my way",r"mon guerlain",r"irresistible",r"paradoxe",r"dolce shine|dolce lily",r"daisy",r"po[eê]me|tr[ée]sor",r"valaya",r"pink extasy|new rose|candy rose|powder flowers",r"burberry her\b|her elixir|my burberry",r"l'interdit",r"si passione|giorgio armani si\b|\bs[iì] eau",r"la belle\b",r"gucci guilty pour femme|rush 2",r"narciso poudr|narciso rodriguez for her|pure musc|all of me",r"omnia",r"elie saab",r"devotion intense|my devotion"],
 'amber':[r"black opium",r"good girl",r"black orchid|velvet orchid",r"crystal noir",r"scandal",r"euphoria",r"habit rouge",r"ambre samar|amberful|amber",r"1 million(?! .*oud)|million gold|million night",r"\bthe one\b",r"le male",r"\bcode\b",r"noir eau de parfum|tom ford - noir",r"kalan",r"bad boy",r"wanted",r"la petite robe noire",r"l'instant magic",r"212 vip",r"phantom",r"divine",r"myslf",r"la nuit de l'homme",r"habit rouge",r"\bk eau de parfum|\bk parfum"],
 'woody':[r"santal",r"oud wood",r"ombr[ée] leather",r"eternal wood",r"cedrat bois",r"bleu de chanel|chanel bleu",r"fahrenheit",r"vetiver|v[ée]tiver",r"gentleman",r"wood (neroli|essence)|wood & wood",r"guilty (pour homme|elixir)",r"boss bottled|the scent",r"layton|haltane|castley",r"explorer",r"coromandel",r"egoiste",r"allure homme(?! [ée]dition)",r"sauvage",r"terrae",r"red tobacco",r"saint laurent y eau",r"l'homme id[ée]al",r"kouros"],
 'fresh':[r"acqua di gi",r"light blue",r"ck one",r"eternity air",r"l'eau d'issey|eau bleue|le sel d'issey",r"invictus",r"\beros\b",r"versace pour homme|p homme|versace l'homme",r"luna rossa|luna ocean",r"costa azzurra",r"soleil blanc",r"eau fra[iî]che|chance fresh|eau tendre",r"[ée]dition blanche",r"neroli",r"french riviera",r"rain essence|glacial",r"chrome",r"legend(?! red| night)",r"driven blue|desire blue",r"naxos",r"dolce amalfi",r"40 knots",r"green stravaganza|coral fantasy",r"pure xs",r"hugo (reversed|dark blue|man\b)"],
 'gourmand':[r"lost cherry|electric cherry|cherry cherry",r"tonka cola",r"coco vanille",r"roses vanille",r"la vie est belle",r"\bcandy\b",r"khamrah",r"eclaire",r"althair",r"italica",r"arabians? tonka",r"born in roma (uomo )?(intense|extradose)",r"golden oud",r"sweet chemistry",r"peach n roses|my way nectar|flowerbomb nectar|viola nectar",r"over red",r"habit rouge parfum",r"sweet ferocious",r"tobacco vanille"],
 'oud':[r"\boud\b|\baoud\b",r"alexandria",r"arabians?|arabiance",r"musamam",r"asad",r"oud stars",r"golden oud",r"purple oud",r"coromandel",r"louban",r"dukhan"],
}
out={}
for k,pats in F.items():
  rx=re.compile('|'.join(pats),re.I)
  m=[p for p in P if rx.search(p['en']) and p['stock']>=2 and p['img'] and not re.search(r'body mist|hair|gift set|body spray|deodor',p['en'],re.I) and p['brand'] not in ('generic','ilove','fogg','banana-republic')]
  # brand diversity: round-robin by brand, higher stock first
  m.sort(key=lambda p:-p['stock']); by={}
  for p in m: by.setdefault(p['brand'],[]).append(p)
  order=[];i=0
  while len(order)<24 and any(by.values()):
    for b in list(by):
      if by[b]: order.append(by[b].pop(0))
      if len(order)>=24: break
  # dedupe
  seen=set(); fin=[]
  for p in order:
    if p['id'] not in seen: seen.add(p['id']); fin.append(p)
  out[k]=fin
  print('##',k,len(m),len(fin))
  for p in fin: print('  ',p['stock'],p['brand'],'|',p['en'][:70])
json.dump({k:[p['id'] for p in v] for k,v in out.items()},open('families.json','w'),indent=1)
