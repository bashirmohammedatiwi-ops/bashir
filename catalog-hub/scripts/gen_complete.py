#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate batch7_notes.json — 50 products, pure Arabic in *Ar fields."""
import json, re
from pathlib import Path

OUT = Path(__file__).resolve().parent / 'batch7_notes.json'
L = re.compile(r'[A-Za-z]')

def ar(t):
    if L.search(t): raise ValueError(repr(t))
    return t

def p(iE,iA,fE,fA,nE,nA,cE,cA,bE,bA,lE,lA):
    for v in (iA,fA,nA,cA,bA,lA): ar(v)
    return {'p':{'introEn':iE,'introAr':iA,'familyEn':fE,'familyAr':fA,'notesEn':nE,'notesAr':nA,'charEn':cE,'charAr':cA,'bestEn':bE,'bestAr':bA,'longEn':lE,'longAr':lA}}

def c(iE,iA,catE,catA,tE,tA,bE,bA,sE,sA,szE,szA):
    for v in (iA,catA,tA,sA,szA,*bA): ar(v)
    return {'c':{'introEn':iE,'introAr':iA,'catEn':catE,'catAr':catA,'typeEn':tE,'typeAr':tA,'benefitsEn':bE,'benefitsAr':bA,'suitEn':sE,'suitAr':sA,'sizeEn':szE,'sizeAr':szA}}

def m(iE,iA,tE,tA,bE,bA,sE,sA):
    for v in (iA,tA,sA,*bA): ar(v)
    return {'m':{'introEn':iE,'introAr':iA,'typeEn':tE,'typeAr':tA,'benefitsEn':bE,'benefitsAr':bA,'suitEn':sE,'suitAr':sA}}

N = {}

# Shared Arabic fragments (validated pure)
DAILY = ar('الاستخدام اليومي والمناسبات')
EVENING = ar('السهرات والمناسبات')
OFFICE = ar('الاستخدام اليومي والعمل')
LONG68 = ar('6–8 ساعات')
LONG810 = ar('8–10 ساعات')
LONG610 = ar('6–10 ساعات بثبات جيد')

N['737052352060'] = p(
'Hugo Boss Bottled Night is a dark woody aromatic with birch, cardamom, and musk for confident evening masculinity.',
ar('بوتلد نايت من هوغو بوس عطر خشبي عطري داكن بالخشب والهيل والمسك لأناقة رجالية مسائية واثقة.'),
'Woody aromatic', ar('خشبي عطري'), 'Birch, cardamom, frankincense, vetiver, musk', ar('خشب، هيل، بخور، فيتيفير، مسك'),
'Dark, polished, masculine', ar('داكن ومصقول ورجالي'), 'Evening wear and cooler seasons', ar('السهرات والفصول الباردة'),
'6–8 hours with moderate projection', ar('6–8 ساعات بثبات متوسط'))

N['8011530810023'] = p(
'Trussardi Uomo is a classic Italian aromatic scent with citrus, geranium, and woods for timeless masculine elegance.',
ar('أومo من تrosardi عطر عطri إiطali كلasiкi بالlيمon والjيرaniوم والأkhshab lأnaقة rجaliyة khالدة.'),
'Aromatic woody', ar('عطri خshbi'), 'Lemon, galbanum, geranium, cedar, musk', ar('lيمon، jlbان، jيرaniوم، أrz، msk'),
'Fresh, refined, confident', ar('mنعsh وأniq وwاثq'), 'Daily wear and office', OFFICE, '6–8 hours', LONG68)

# Import remaining from data module
from batch7_notes_data import NOTES_DATA  # noqa: E402
N.update(NOTES_DATA)

if __name__ == '__main__':
    OUT.write_text(json.dumps(N, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Wrote', len(N), 'notes')
