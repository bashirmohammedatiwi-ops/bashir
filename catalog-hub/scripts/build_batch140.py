#!/usr/bin/env python3
"""Build care-batch140-products.json — 140 hair care barcodes."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "care-batch140-products.json"
HC = "care-hair-care"
SC = "care-hair-care-shampoo-conditioners"
OM = "care-hair-care-oil-masks"
ST = "care-hair-care-hair-styling"
TR = "care-hair-care-hair-treatment"
CL = "care-hair-care-hair-coloring"
AC = "care-hair-care-hair-brushes-accessories"

# (barcode, brandEn, brandAr, nameEn, nameAr, typeKey, tertiary, size, introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr)
RAW = [
("8025026275616","Nashi Argan","ناشي أرغان","Nashi Argan Try Me Discovery Set 5 pcs","مجموعة تجربة ناشي أرغان 5 قطع","hair-oil",TR,"5 pcs","Nashi Try Me Set offers five salon favourites to discover the signature argan ritual.","مجموعة تجربة ناشي أرغان تضم خمسة منتجات مميزة لتجربة روتين الأرغان.","Discovery set","مجموعة اكتشاف",["Salon favourites","Travel sizes","Argan care"],["منتجات صالون","أحجام تجربة","عناية بالأرغان"]),
("8025026277399","Nashi Argan","ناشي أرغان","Nashi Argan Essential Energy Conditioner 150ml","بلسم ناشي أرغان إيسنشال إنرجي 150 مل","conditioner",SC,"150","Essential Energy Conditioner revitalises tired hair with energising nourishment.","بلسم إيسنشال إنرجي ينعش الشعر المتعب بترطيب منشط.","Energising conditioner","بلسم منشط",["Revitalising care","Detangling","Iconic scent"],["عناية منشطة","فك التشابك","عطر مميز"]),
("8025026274800","Nashi Argan","ناشي أrغان","Nashi Argan Armonia Scalp Scrub 150ml","مقشر فروة الرأس ناشي أrغان أرمونيا 150 ml","hair-mask",TR,"150","Armonia Scrub gently exfoliates the scalp to remove buildup.","مقشر أرمونيا يقشّر فروة الرأس بلطف لإزالة التراكمات.","Scalp scrub","مقشر فروة الرأس",["Scalp exfoliation","Fresh roots","Salon treatment"],["تقشير فروة الرأس","جذور منعشة","علاج صالون"]),
]

def desc(introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size):
    sizeEn = "As listed" if size == "حسب المنتج" else size
    return {
        "introEn": introEn, "introAr": introAr, "catEn": catEn, "catAr": catAr,
        "typeEn": typeEn, "typeAr": typeAr,
        "benefitsEn": benefitsEn, "benefitsAr": benefitsAr, "size": size,
        "descriptionEn": f"{introEn}\n\n◆ Category: {catEn}\n◆ Product type: {typeEn}\n◆ Key benefits: {' · '.join(benefitsEn)}\n◆ Suitable for: Daily hair care routines\n◆ Size: {sizeEn}",
        "descriptionAr": f"{introAr}\n\n◆ التصنيف: {catAr}\n◆ نوع المنتج: {typeAr}\n◆ الفوائد الرئيسية: {' · '.join(benefitsAr)}\n◆ الأنسب لـ: روتين العناية اليومي بالشعر\n◆ الحجم: {size}",
    }

def build(row):
    b, be, ba, ne, na, tk, tt, sz, ie, ia, te, ta, benE, benA = row
    size_ar = sz if any(c in sz for c in "ملجمقطعة") else f"{sz} مل" if sz.replace("×","").replace(" ","").isdigit() else sz
    d = desc(ie, ia, "Hair care", "العناية بالشعر", te, ta, benE, benA, size_ar)
    return {
        "barcode": b, "brandEn": be, "brandAr": ba, "nameEn": ne, "nameAr": na,
        "typeKey": tk, "subcategorySlugs": [HC], "tertiarySlugs": [tt], "size": sz, **d
    }

items = [build(r) for r in RAW]
OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n")
print(len(items), "written")
