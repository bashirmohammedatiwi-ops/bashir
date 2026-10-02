"""يحوّل الألوان المكتوبة يدوياً من الهوية الوردية القديمة إلى الليلكي والوردي.

الألوان الدلالية (نجاح، خطأ، واتساب) ما تتغير. تشغيل مرة وحدة:
    python3 tool/recolor_lilac.py
"""
import pathlib
import re

MAP = {
    # الهوية
    "D41F5C": "9B6BD8", "A01545": "6E45B0", "E83A72": "B08AE6", "8E1240": "5A3496",
    "5C1A38": "3F2670", "2A1220": "1E1433", "E2557A": "D16FA0", "E91E8C": "D96BA3",
    "FCE4EC": "FDEAF2", "E11D48": "E0457B",
    # تدرجات وردية فاتحة
    "FFF7F9": "FBF8FF", "FFE4EC": "EFE6FC", "FFF0F4": "F6F0FE", "FFF5F8": "FAF6FF",
    "FFF4F7": "F9F5FF", "FFF8FA": "FBF9FF", "FFFBFC": "FDFBFF", "FFFCFD": "FEFCFF",
    "FFFBFD": "FDFBFF", "FFF5F7": "FAF6FE", "FFE8EF": "F3EBFD", "F3E4EA": "E9E1F4",
    "F1E6EB": "ECE5F5", "F0E7EB": "ECE6F4", "EBDDE3": "E4DBF0", "F7F2F5": "F5F1FA",
    "EFE4E9": "EAE3F3", "F0E4EA": "EBE3F4", "F6E8EE": "F1E9F8", "F6D5DF": "EFD9F0",
    "F3D5DE": "ECD6EE", "EED6DE": "E8D6EC", "F8F0F2": "F6F1FA", "E7DDE2": "E2DAEC",
    # رماديات دافئة إلى رماديات ليلكية
    "E6E0E3": "E5E0EC", "ECE7EA": "ECE8F1", "F2EEF0": "F2EFF6", "F8F5F6": "F8F6FB",
    "F7F4F5": "F6F4FA", "F6F3F4": "F5F3F9", "F3F0F2": "F3F0F7", "F3F0F1": "F3F0F7",
    "F0EBED": "EFEBF4", "F0EAEC": "EFEAF4", "FBF8F9": "FAF8FC", "FBF7F8": "FAF7FC",
    "F9F7F8": "F8F7FB", "F9F6F7": "F8F6FB", "F7F5F6": "F6F5FA", "F6F4F5": "F5F4F9",
    "EDE9EB": "ECE9F1", "E8E3E6": "E6E2EC", "E8E2E5": "E6E1EC", "E7E2E4": "E5E1EB",
    "F1ECEF": "EFEBF5", "C4B9BF": "BFB7CC", "B9AEB4": "B3AAC2", "8E868C": "8A8397",
    "8A848C": "878197", "7A757F": "777185", "6E686C": "6C6679", "6A6570": "655F72",
    "6A646A": "666073", "5A5458": "575166", "3A3438": "36303F", "2A2428": "28222F",
    "2C272B": "2A2431", "14121A": "1A1426", "9B95A0": "9891A6", "9A949A": "9892A3",
    "D5D0D3": "D3CEDC", "E0D5C8": "DDD3E6",
    # كريمي وذهبي إلى وردي فاتح
    "B8954A": "C0679A", "F7F0E4": "FDEAF2", "F5EDE0": "F9E6EF", "F4F0EA": "F5EEF6",
    "FFFBF8": "FDFAFF", "FFFBF2": "FEF9FC", "FFF8F5": "FCF7FD", "FAF8F6": "F9F7FB",
    "F5E9CC": "F4E2EE", "8B7355": "8A5A86",
    # هوية الفيروزي الأقدم في السلة والحساب والرئيسية والافتتاح
    "3A9E8F": "9B6BD8", "2F7F73": "6E45B0", "45B0A1": "B08AE6", "2A7A6F": "7A52BF",
    "245F57": "4A2C86", "2F9E8F": "9B6BD8", "00897B": "7A52BF", "E8F5F3": "EFE6FC",
    "F4FAF9": "F8F5FE", "F6FAF9": "F8F6FB", "FAFCFB": "FAF8FD", "F8FBFA": "F9F7FD",
    "D4EDE8": "E3D6F7", "E3EDEA": "E7E1EF", "9AABA6": "9C95AA", "8A9693": "8B8499",
    "6B7A76": "6A647A", "F0F4F1": "F3EFF8", "F0F4EE": "F3EFF8", "D4E0CC": "DCD3E8",
    "2D2D2D": "2A2431",
}

pattern = re.compile(r"(Color\(0x)([0-9A-Fa-f]{2})([0-9A-Fa-f]{6})(\))")


def swap(match: re.Match) -> str:
    rgb = match.group(3).upper()
    new = MAP.get(rgb)
    return f"{match.group(1)}{match.group(2).upper()}{new}{match.group(4)}" if new else match.group(0)


changed = 0
root = pathlib.Path(__file__).resolve().parent.parent / "lib"
for path in root.rglob("*.dart"):
    if path.name == "app_colors.dart":
        continue
    text = path.read_text(encoding="utf-8")
    updated = pattern.sub(swap, text)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed += 1
print(f"files updated: {changed}")
