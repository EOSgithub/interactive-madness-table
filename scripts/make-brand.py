"""Draws the ToolsmithDev icons and the link preview image in public/.

The icon of the browser tab is not made here: it is public/favicon.svg, the
tool's own moon, drawn by hand.

    python scripts/make-brand.py <ToolsmithDev icon, PNG> <Cinzel variable font, TTF>

The outputs are committed, so this only needs running when the look changes.
Needs Pillow.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public")

BG = (12, 8, 7)
GLOW = (34, 19, 15)
GOLD = (201, 161, 74)
GOLD_LIGHT = (230, 200, 125)
IVORY_SOFT = (184, 173, 149)


def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    f.set_variation_by_axes([weight])
    return f


def spaced(draw, xy, text, f, fill, gap):
    """Text with letter spacing, centred on xy[0]."""
    widths = [draw.textlength(ch, font=f) for ch in text]
    x = xy[0] - (sum(widths) + gap * (len(text) - 1)) / 2
    for ch, w in zip(text, widths):
        draw.text((x, xy[1]), ch, font=f, fill=fill)
        x += w + gap


def main():
    icon_path, font_path = sys.argv[1], sys.argv[2]
    os.makedirs(OUT, exist_ok=True)
    icon = Image.open(icon_path).convert("RGBA")

    for size, name in ((180, "apple-touch-icon.png"), (192, "icon-192.png")):
        icon.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)

    # The preview image for shared links: 1200 x 630, the size the big platforms ask for.
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)
    px = img.load()
    for y in range(h):
        for x in range(w):
            d = min(1.0, (((x - w / 2) / (w * 0.62)) ** 2 + ((y - h / 2) / (h * 0.62)) ** 2) ** 0.5)
            k = (1 - d) ** 1.6
            px[x, y] = tuple(round(BG[i] + (GLOW[i] - BG[i]) * k) for i in range(3))
    draw = ImageDraw.Draw(img)

    spaced(draw, (w / 2, 150), "A DRAMATIC ROLLER FOR ANY MADNESS TABLE", font(font_path, 26, 500), GOLD, 5)
    spaced(draw, (w / 2, 215), "INTERACTIVE", font(font_path, 96, 600), GOLD_LIGHT, 6)
    spaced(draw, (w / 2, 320), "MADNESS TABLE", font(font_path, 96, 600), GOLD_LIGHT, 6)
    draw.line((w / 2 - 120, 462, w / 2 + 120, 462), fill=(58, 35, 29), width=2)

    mark = icon.resize((64, 64), Image.LANCZOS)
    label = "A TOOLSMITHDEV TOOL"
    f = font(font_path, 24, 500)
    gap = 4
    text_w = sum(draw.textlength(ch, font=f) for ch in label) + gap * (len(label) - 1)
    left = (w - (64 + 18 + text_w)) / 2
    img.paste(mark, (round(left), 498), mark)
    spaced(draw, (left + 64 + 18 + text_w / 2, 516), label, f, IVORY_SOFT, gap)

    img.save(os.path.join(OUT, "og.png"), optimize=True)
    print("wrote", ", ".join(sorted(os.listdir(OUT))))


if __name__ == "__main__":
    main()
