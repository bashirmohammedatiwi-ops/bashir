#!/usr/bin/env python3
"""Generate batch6_ar_fixes.json — pure Arabic overrides for products 15-50."""
import json
import re

OUT = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/batch6_ar_fixes.json"
L = re.compile(r"[a-zA-Z]")


def a(s: str) -> str:
    if L.search(s):
        raise ValueError(repr(s))
    return s


FIXES = {
    # 15 Lalique
    "7640111502791|p.introAr": a("إنكر نوار إكستريم يعمّق نفحات فيتيفر الأسطورية بسرو وأخشاب داكنة لحضور رجالي جريء."),
    "7640111502791|p.notesAr": a("فيتيفر، سرو، خشب ناعم، مسك"),
    # 16 D&G The One Gold
    "8057971188727|p.introAr": a("ذا ون قولد عطر رجالي جديد غني بالعنبر والتوابل بدفء ذهبي فاخر."),
    # 17 Cavalli Paradise Found 75ml
    "3614228899376|p.introAr": a("بارادايس فاوند عطر نسائي زهري استوائي يجسّد جنة مشمسة."),
    # 18 Gucci Flora
    "3616303048181|p.introAr": a("عطر نسائي جديد من قوتشي يحتفي بالياسمين المشرق مع الكمثرى وخشب الصندل."),
    "3616303048181|p.notesAr": a("ياسمين، كمثرى، خشب الصندل، بنزوين"),
    # 19 LRP Hyalu B5
    "3337875583626|c.introAr": a("سيروم لاروش بوزيه هيالو ب٥ يعيد امتلاء البشرة بحمض الهيالورونيك النقي وفيتامين ب٥."),
    "3337875583626|c.typeAr": a("سيروم هيالورونيك"),
    "3337875583626|c.benefitsAr[0]": a("حمض الهيالورونيك"),
    "3337875583626|c.benefitsAr[1]": a("فيتامين ب٥"),
    # 20 Versace Man Eau Fraiche
    "8018365500037|p.introAr": a("مان أو فريش من فرزاتشي عطر رجالي منعش مائي بالحمضيات والمسك للاستخدام اليومي."),
    "8018365500037|p.notesAr": a("ليمون، برغموت، ورد، مسك، عنبر"),
    # 21 Cavalli Paradise Found 50ml
    "3614228954051|p.introAr": a("بارادايس فاوند أو دو تواليت ٥٠ مل من روبرتو كفالي بنفس العطر الاستوائي الزهري."),
    # 22 Versace Dylan Turquoise
    "8011003858552|p.introAr": a("ديلان توركواز من فرزاتشي يجسّد نضارة البحر المتوسط بالحمضيات والياسمين والمسك."),
    "8011003858552|p.notesAr": a("ليمون، يوسفي، ياسمين، مسك، أرز"),
    # 23 Kilian Angels' Share
    "3700550216094|p.introAr": a("حصة الملائك عطر نيش غذائي فاخر يمزج الكونياك والبلوط والحلوى بفخامة للجنسين."),
    "3700550216094|p.familyAr": a("شرقي غذائي"),
    "3700550216094|p.notesAr": a("كونياك، بلوط، قرفة، حلوى، فانيلا"),
    # 24 LRP Toleriane
    "3337875597357|c.introAr": a("مرطب لاروش بوزيه توليريان يهدئ البشرة الحساسة بتركيبة بسيطة خالية من العطر."),
    "3337875597357|c.benefitsAr[2]": a("عناية ما قبل الحيوية"),
    # 25 Givenchy Gentleman Society
    "3274872448780|p.introAr": a("جentleman society عطر رجali khashbi عطري عصري بالmeramia والfetiver بأnaqa."),
    "3274872448780|p.notesAr": a("meramia، fetiver، أrز، باتشولي، فanيلa"),
}

if __name__ == "__main__":
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(FIXES, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(len(FIXES))
