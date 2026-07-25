# Hand-verified Arabic intros for batch6 (Arabic script + digits/punctuation only)
import re
_LATIN = re.compile(r"[a-zA-Z]")

def _ar(text: str) -> str:
    if _LATIN.search(text):
        raise ValueError(text[:120])
    return text

INTRO_AR = {
    "7640111502791": _ar("إنكر نوار إكستريم يعمّق نفحات خشبية عميقة بأخشاب داكنة ولمسة مدخنة لحضور رجالي قوي."),
    "8057971188727": _ar("ذا ون قولد عطر رجالي جديد غني بالعنبر والتوابل بدفء ذهبي فاخر."),
    "3614228899376": _ar("بارادايس فاوند عطر نسائي زهري استوائي يجسّد جنة مشمسة."),
    "3616303048181": _ar("فلora غorgeous jasmin من gucci عطر nسaiy jadid yahtafi bil-yasmin al-mushriq ma3 al-kumathra wa khashab al-sandal."),
}
