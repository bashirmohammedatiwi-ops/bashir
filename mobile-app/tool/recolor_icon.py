"""يلوّن أيقونة التطبيق بالهوية الليلكية: الأخضر إلى ليلكي، والخط الداكن إلى بنفسجي عميق.

    python3 tool/recolor_icon.py
"""
import colorsys
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "images"
LILAC = (0x9B, 0x6B, 0xD8)
DEEP = (0x3A, 0x24, 0x66)


def blend(target, amount):
    return tuple(round(255 + (c - 255) * amount) for c in target)


def recolor(path: pathlib.Path):
    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            hue = h * 360
            if v < 0.45:
                amount = max(0.0, min(1.0, (1 - v) / (1 - 0.18)))
                pixels[x, y] = (*blend(DEEP, amount), a)
            elif s > 0.18 and 120 <= hue <= 200:
                pixels[x, y] = (*blend(LILAC, max(0.0, min(1.0, s / 0.83))), a)
            elif v < 0.7 and s < 0.4:
                amount = max(0.0, min(1.0, (1 - v) / (1 - 0.18)))
                pixels[x, y] = (*blend(DEEP, amount), a)
    image.save(path)


for name in ["app_icon_source.png", "app_icon.png", "app_icon_transparent.png"]:
    target = ROOT / name
    if target.exists():
        recolor(target)
        print("recolored", name)
