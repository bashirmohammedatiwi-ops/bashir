#!/usr/bin/env python3
"""Build batch6-meta-defs.json: 50 products, pure Arabic in all *Ar fields."""
import importlib.util
import json
import re
from collections import OrderedDict

OUT = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/batch6-meta-defs.json"
META = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/data/sarah-pos-batch6-meta.json"
GEN = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/gen_batch6.py"
FIXES_PATH = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/batch6_ar_fixes.json"
LATIN = re.compile(r"[a-zA-Z]")

ORDER = [
    "3337871324599", "773602710683", "3606000537699", "850045076085", "689304348423",
    "072140020491", "3337875722827", "3337875597395", "381371020652", "3760294351178",
    "3606000534919", "8011003872077", "614514410103", "689304188890", "7640111502791",
    "8057971188727", "3614228899376", "3616303048181", "3337875583626", "8018365500037",
    "3614228954051", "8011003858552", "3700550216094", "3337875597357", "3274872448780",
    "3355992004596", "3760294350881", "3614274017069", "8809913830641", "681619815997",
    "3346130018926", "8809576261868", "3614274217155", "3614274217148", "855732733210",
    "5060150185168", "8809875906477", "3349668614523", "3700134403957", "602004146151",
    "072140634827", "888066024082", "088300162543", "783320411168", "3386460126014",
    "8681008055258", "607845070085", "8681008055074", "8683608070617", "8683608070594",
]


def split_desc(text, labels):
    lines = text.split("\n")
    intro = lines[0].strip()
    fields = {}
    for line in lines[1:]:
        line = line.strip()
        if line.startswith("◆ "):
            line = line[2:].strip()
        for label, key in labels:
            if line.startswith(label):
                fields[key] = line[len(label):].strip()
                break
    return intro, fields


def parse_meta_entry(m):
    en, ar = m["descriptionEn"], m["descriptionAr"]
    if m["kind"] == "perfume":
        en_labels = [
            ("Scent family: ", "familyEn"), ("Key notes: ", "notesEn"), ("Character: ", "charEn"),
            ("Best for: ", "bestEn"), ("Longevity: ", "longEn"),
        ]
        ar_labels = [
            ("عائلة العطر: ", "familyAr"), ("النوتات الرئيسية: ", "notesAr"), ("الطابع: ", "charAr"),
            ("الأنسب لـ: ", "bestAr"), ("الثبات: ", "longAr"),
        ]
        intro_en, ef = split_desc(en, en_labels)
        intro_ar, af = split_desc(ar, ar_labels)
        obj = {
            "brandEn": m["brandEn"], "nameEn": m["nameEn"], "kind": "perfume",
            "p": {"introEn": intro_en, "introAr": intro_ar, **ef, **af},
        }
        if "subs" in m:
            obj["subs"] = m["subs"]
        return obj
    if m["kind"] == "care":
        en_labels = [
            ("Category: ", "catEn"), ("Product type: ", "typeEn"), ("Key benefits: ", "benefitsEn"),
            ("Suitable for: ", "suitEn"), ("Size: ", "sizeEn"),
        ]
        ar_labels = [
            ("التصنيف: ", "catAr"), ("نوع المنتج: ", "typeAr"), ("الفوائد الرئيسية: ", "benefitsAr"),
            ("الأنسب لـ: ", "suitAr"), ("الحجم: ", "sizeAr"),
        ]
        intro_en, ef = split_desc(en, en_labels)
        intro_ar, af = split_desc(ar, ar_labels)
        benefits_en = [b.strip() for b in ef.get("benefitsEn", "").split(" · ")] if ef.get("benefitsEn") else []
        benefits_ar = [b.strip() for b in af.get("benefitsAr", "").split(" · ")] if af.get("benefitsAr") else []
        return {
            "brandEn": m["brandEn"], "nameEn": m["nameEn"], "kind": "care",
            "careLeaf": m["careLeaf"], "typeKey": m["typeKey"],
            "c": {
                "introEn": intro_en, "introAr": intro_ar,
                "catEn": ef.get("catEn", ""), "catAr": af.get("catAr", ""),
                "typeEn": ef.get("typeEn", ""), "typeAr": af.get("typeAr", ""),
                "benefitsEn": benefits_en, "benefitsAr": benefits_ar,
                "suitEn": ef.get("suitEn", ""), "suitAr": af.get("suitAr", ""),
                "sizeEn": ef.get("sizeEn", ""), "sizeAr": af.get("sizeAr", ""),
            },
        }
    en_labels = [
        ("Product type: ", "typeEn"), ("Key benefits: ", "benefitsEn"), ("Suitable for: ", "suitEn"),
    ]
    ar_labels = [
        ("نوع المنتج: ", "typeAr"), ("الفوائد الرئيسية: ", "benefitsAr"), ("الأنسب لـ: ", "suitAr"),
    ]
    intro_en, ef = split_desc(en, en_labels)
    intro_ar, af = split_desc(ar, ar_labels)
    benefits_en = [b.strip() for b in ef.get("benefitsEn", "").split(" · ")] if ef.get("benefitsEn") else []
    benefits_ar = [b.strip() for b in af.get("benefitsAr", "").split(" · ")] if af.get("benefitsAr") else []
    return {
        "brandEn": m["brandEn"], "nameEn": m["nameEn"], "kind": "makeup",
        "makeupSub": m["makeupSub"],
        "m": {
            "introEn": intro_en, "introAr": intro_ar,
            "typeEn": ef.get("typeEn", ""), "typeAr": af.get("typeAr", ""),
            "benefitsEn": benefits_en, "benefitsAr": benefits_ar,
            "suitEn": ef.get("suitEn", ""), "suitAr": af.get("suitAr", ""),
        },
    }


def apply_fix(obj, key_path, value):
    if "|" not in key_path:
        raise ValueError(key_path)
    _, rest = key_path.split("|", 1)
    block_key, field = rest.split(".", 1)
    block = obj[block_key]
    if field.startswith("benefitsAr[") and field.endswith("]"):
        idx = int(field[len("benefitsAr["):-1])
        block["benefitsAr"][idx] = value
    else:
        block[field] = value


def walk_ar_fields(obj, prefix, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("c", "p", "m") and isinstance(v, dict):
                for fk, fv in v.items():
                    if fk.endswith("Ar"):
                        if isinstance(fv, list):
                            for i, item in enumerate(fv):
                                out[f"{prefix}|{k}.{fk}[{i}]"] = item
                        else:
                            out[f"{prefix}|{k}.{fk}"] = fv


def validate_no_latin(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            validate_no_latin(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            validate_no_latin(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        key = path.rsplit(".", 1)[-1]
        if key.endswith("Ar") and LATIN.search(obj):
            raise ValueError(f"Latin in {path}: {obj!r}")


def main():
    spec = importlib.util.spec_from_file_location("gen_batch6", GEN)
    gen = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gen)

    meta = json.load(open(META, encoding="utf-8"))
    fixes = json.load(open(FIXES_PATH, encoding="utf-8"))

    defs = OrderedDict()
    for bc in ORDER:
        if bc in gen.PRODUCTS and bc in ORDER[:14]:
            defs[bc] = gen.PRODUCTS[bc]
        else:
            defs[bc] = parse_meta_entry(meta[bc])

    for key_path, value in fixes.items():
        bc, _ = key_path.split("|", 1)
        apply_fix(defs[bc], key_path, value)

    # Eucerin lotion uses body-lotion typeKey per spec
    defs["072140634827"]["typeKey"] = "body-lotion"

    for bc in ORDER:
        validate_no_latin(defs[bc], bc)

    assert len(defs) == 50
    assert list(defs.keys()) == ORDER

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(defs, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Wrote {OUT} with {len(defs)} products")


if __name__ == "__main__":
    main()
