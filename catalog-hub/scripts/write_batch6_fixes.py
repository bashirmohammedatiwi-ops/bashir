#!/usr/bin/env python3
"""Write validated Arabic fixes for batch6 products 15-50."""
import json
import re

OUT = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/batch6_ar_fixes.json"
LATIN = re.compile(r"[a-zA-Z]")


def ar(s: str) -> str:
    if LATIN.search(s):
        raise ValueError(f"Latin in Arabic: {s!r}")
    return s


FIXES = {
    "7640111502791|p.introAr": ar("إنكر نوار إكستريم يعمّق نفحات فيتيفر الأسطورية بسرو وأخشاب داكنة لحضور رجالي جريء."),
    "7640111502791|p.notesAr": ar("فيتيفر، سرو، خشب ناعم، مسك"),
    "8057971188727|p.introAr": ar("ذا ون قولد عطر رجالي جديد غني بالعنبر والتوابل بدفء ذهبي فاخر."),
    "3614228899376|p.introAr": ar("بارادايس فاوند عطر نسائي زهري استوائي يجسّد جنة مشمسة."),
    "3616303048181|p.introAr": ar("عطر نسائي جديد من قوتشي يحتفي بالياسمين المشرق مع الكمثرى وخشب الصندل."),
    "3616303048181|p.notesAr": ar("ياسمين، كمثرى، خشب الصندل، بنزوين"),
    "3337875583626|c.introAr": ar("سيروم لاروش بوزيه هيalu ب5 يعيد امتلاء البشرة بحمض الهيalورونيك النقي وفيتamin ب5."),
}

if __name__ == "__main__":
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(FIXES, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(FIXES)} fixes")
