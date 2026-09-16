#!/usr/bin/env python3
"""Web-sized portraits for the lobby, the VS screen and the arcade ending.

Sources are the full-size portraits (about 1024 x 1536 RGB, more than 1 MB each): the original
crew in public/assets/<hero>.png at the time of writing, the rock stars in the folder given with
--rockstar. Each is centre-cropped to 2:3, reduced with Lanczos and quantized with dithering:

  public/assets/portraits/<hero>.png        320 x 480, about 60 KB, shown on the VS and ending screens
  public/assets/portraits/<hero>-thumb.png   96 x 144, about 10 KB, shown on the lobby buttons

Usage: python scripts/make-portraits.py --turma public/assets --rockstar ../rockstar --out public/assets/portraits
"""
import argparse, json, os, re
from PIL import Image

TURMA = ["marica", "hiro", "lobao", "ratao", "bale", "veio", "catlaca"]


def fit(im, w, h):
    """Centre-crop to w:h then resize; the head sits in the upper half of every portrait, so the
    crop keeps the top when the source is taller than 2:3."""
    ratio = w / h
    sw, sh = im.size
    if sw / sh > ratio:
        nw = round(sh * ratio); x0 = (sw - nw) // 2; im = im.crop((x0, 0, x0 + nw, sh))
    else:
        nh = round(sw / ratio); im = im.crop((0, 0, sw, nh))
    return im.resize((w, h), Image.LANCZOS)


def save(im, path):
    q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(path, optimize=True)
    return os.path.getsize(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--turma", default="public/assets"); ap.add_argument("--rockstar", required=True); ap.add_argument("--out", default="public/assets/portraits")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    sources = {h: os.path.join(a.turma, h + ".png") for h in TURMA}
    for name in sorted(os.listdir(a.rockstar)):
        if name.endswith(".png") and not name.endswith("-sheet.png") and "arena" not in name:
            sources[name[:-4]] = os.path.join(a.rockstar, name)
    total = 0
    for hero, src in sources.items():
        if not os.path.exists(src): print("missing", src); continue
        im = Image.open(src).convert("RGB")
        total += save(fit(im, 320, 480), os.path.join(a.out, hero + ".png"))
        total += save(fit(im, 96, 144), os.path.join(a.out, hero + "-thumb.png"))
        print(f"{hero:16} ok")
    print("portraits:", len(sources), "total", total // 1024, "KB")


if __name__ == "__main__":
    main()
