"""Bake transparent backgrounds into the sprite sheets.

The game used to guess the background at load time by flood-filling
grey-ish pixels from the border of each sprite. That guess failed in a few
ways (a stray dark corner pixel kept a whole grey box, background trapped
between the legs stayed grey, light shirts got eaten). This tool makes the
decision once, offline, where it can be reviewed, and writes the result as
real PNG transparency. lib/render.ts then only crops.

Usage (needs Python 3 with Pillow):
    python scripts/prepare-sheets.py [--src DIR] [--out DIR] [--preview DIR]

--src      folder with the source sheets (default: public/assets; RGB
           originals give the best result, but already-processed sheets work)
--out      where to write the sheets (default: public/assets)
--preview  optional folder for review images (sprites composited on magenta)

Sprite rectangles below mirror lib/render.ts and must be kept in sync.
"""
import argparse, os, sys
from collections import deque
from PIL import Image

NAMES = ["walk", "jump", "crouch", "kick", "punch", "special", "block"]
SPECS = []  # (sheet, [x, y, w, h], refW, refH, baseline, gray_predicate, label)

def add(sheet, rect, refW, refH, baseline, gray, label):
    SPECS.append((sheet, rect, refW, refH, baseline, gray, label))

hx=[135,333,530,775]; hy=[45,256,477,682,890,1080,1290]; hb=[248,457,660,874,1071,1268,1485]
for row in range(7):
    for col in range(4):
        w = 245 if col in (2, 3) else 200
        add('hiro-sheet.png', [hx[col],hy[row],w,hb[row]-hy[row]+1],1024,1536,hb[row]-hy[row],True,f"hiro/{NAMES[row]}/{col}")
add('hiro-sheet.png',[661,1100,112,154],1024,1536,153,True,"hiro/chicken")
mx=[244,548,846,1160]; my=[45,211,375,522,683,830]; mb=[205,374,520,675,827,1006]
for row in range(6):
    for col in range(4):
        w = 294 if col==3 else 320 if (row==5 and col==2) else 290
        add('marica-sheet.png',[mx[col],my[row],w,mb[row]-my[row]+1],1536,1024,mb[row]-my[row],True,f"marica/{NAMES[row]}/{col}")
for col in range(4):
    add('marica-defense.png',[col*512+24,174,480,410],2048,683,407,True,f"marica/block/{col}")
lx=[140,334,529,785]; ly=[58,279,489,689,896,1086,1293]; lb=[264,475,677,883,1077,1288,1493]; lw=[194,195,256,239]
for row in range(7):
    for col in range(4):
        w = 140 if (row==5 and col==2) else 145 if (row==5 and col==3) else lw[col]
        add('lobao-sheet.png',[lx[col],ly[row],w,lb[row]-ly[row]+1],1024,1536,lb[row]-ly[row],True,f"lobao/{NAMES[row]}/{col}")
add('lobao-sheet.png',[922,1124,96,92],1024,1536,91,True,"lobao/wolf")
rx=[150,337,528,775]; ry=[55,270,476,682,889,1085,1295]; rb=[264,473,677,882,1078,1289,1496]; rw=[197,200,268,239]
for row in range(7):
    for col in range(4):
        w = 145 if (row==5 and col in (2,3)) else rw[col]
        add('ratao-sheet.png',[rx[col],ry[row],w,rb[row]-ry[row]+1],1024,1536,rb[row]-ry[row],False,f"ratao/{NAMES[row]}/{col}")
add('ratao-sheet.png',[884,1128,138,126],1024,1536,125,False,"ratao/bike")
bx=[150,337,528,775]; by=[65,292,523,727,938,1145,1320]; bb=[272,506,710,920,1133,1306,1511]; bw=[197,200,260,245]
for row in range(7):
    if row == 5: continue
    for col in range(4):
        add('bale-sheet.png',[bx[col],by[row],bw[col],bb[row]-by[row]+1],1024,1536,bb[row]-by[row],False,f"bale/{NAMES[row]}/{col}")
add('bale-sheet.png',[120,1145,145,162],1024,1536,161,False,"bale/call")
add('bale-sheet.png',[670,1145,115,162],1024,1536,161,False,"bale/recover")
add('bale-sheet.png',[778,1158,246,148],1024,1536,147,False,"bale/miners")
add('bale-sheet.png',[610,1158,67,148],1024,1536,147,False,"bale/miner")
vx=[145,345,535,780]; vy=[82,290,525,730,935,1140,1324]; vb=[274,510,716,923,1136,1316,1520]; vw=[195,190,245,210]
for row in range(7):
    for col in range(4):
        w = 125 if (row==5 and col==2) else 145 if (row==5 and col==3) else vw[col]
        add('veio-sheet.png',[vx[col],vy[row],w,vb[row]-vy[row]+1],1024,1536,vb[row]-vy[row],False,f"veio/{NAMES[row]}/{col}")
add('veio-sheet.png',[650,1150,128,115],1024,1536,114,False,"veio/skull")

LEG_ZONE = 0.58  # trapped background whose top lies below this fraction of the sprite height is removed


def crop_box(im, rect, refW, refH):
    sx = im.width / refW; sy = im.height / refH
    x, y, w, h = rect
    W = round(w * sx); H = round(h * sy)
    return (round(x * sx), round(y * sy), round(x * sx) + W, round(y * sy) + H), W, H, sy


def border_median(px, W, H):
    idx = list(range(W)) + [(H - 1) * W + x for x in range(W)] + [y * W for y in range(1, H - 1)] + [y * W + W - 1 for y in range(1, H - 1)]
    return tuple(sorted(px[i][c] for i in idx)[len(idx) >> 1] for c in range(3))


def is_background(p, gray, bg):
    r, g, b = p
    if gray:  # light, unsaturated pixel (grey sheets)
        return max(r, g, b) - min(r, g, b) < 30 and min(r, g, b) > 100
    return max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2])) < 42  # close to the sampled sheet colour


def sprite_mask(im, spec):
    """Pixels of one sprite crop that are background. Returns (box, W, H, bytearray)."""
    sheet, rect, refW, refH, baseline, gray, label = spec
    box, W, H, sy = crop_box(im, rect, refW, refH)
    px = list(im.crop(box).getdata()); n = W * H
    bg = border_median(px, W, H)
    match = [is_background(p, gray, bg) for p in px]
    seen = bytearray(n); rem = bytearray(n); q = deque()

    def visit(i):
        if i < 0 or i >= n or seen[i]: return
        seen[i] = 1
        if match[i]: q.append(i); rem[i] = 1

    # 1. Everything background-coloured that connects to the crop border.
    for x in range(W): visit(x); visit((H - 1) * W + x)
    for y in range(H): visit(y * W); visit(y * W + W - 1)
    while q:
        i = q.popleft()
        if i % W > 0: visit(i - 1)
        if i % W < W - 1: visit(i + 1)
        visit(i - W); visit(i + W)
    # 2. Background trapped between the legs: components never reached from the border
    #    whose top lies in the leg zone. Shirts sit higher and are left alone.
    done = bytearray(n); limit = round(H * LEG_ZONE)
    for i in range(limit * W, n):
        if match[i] and not rem[i] and not done[i]:
            comp = []; top = H; qq = deque([i]); done[i] = 1
            while qq:
                j = qq.popleft(); comp.append(j); top = min(top, j // W)
                for k in ((j - 1) if j % W > 0 else -1, (j + 1) if j % W < W - 1 else -1, j - W, j + W):
                    if 0 <= k < n and not done[k] and match[k] and not rem[k]:
                        done[k] = 1; qq.append(k)
            if top >= limit:
                for j in comp: rem[j] = 1
    # 3. The painted floor shadow: the game draws its own.
    for y in range(round(baseline * sy), H):
        for x in range(W): rem[y * W + x] = 1
    return box, W, H, rem


def process(sheet, src_dir, out_dir, preview_dir):
    src = os.path.join(src_dir, sheet)
    im = Image.open(src).convert('RGB')
    alpha = bytearray(b'\xff' * (im.width * im.height))
    specs = [s for s in SPECS if s[0] == sheet]
    for spec in specs:
        box, W, H, rem = sprite_mask(im, spec)
        for i in range(W * H):
            if rem[i]:
                alpha[(box[1] + i // W) * im.width + box[0] + i % W] = 0
    # Flatten transparent pixels to one colour so they cost nothing in the palette, then quantize.
    pix = im.load(); bg = border_median(list(im.getdata()), im.width, im.height)
    for i, a in enumerate(alpha):
        if a == 0: pix[i % im.width, i // im.width] = bg
    # 255 colours for the art plus one reserved palette index for the transparent background,
    # so no opaque pixel ever shares the key.
    q = im.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    key = 255
    pal = (q.getpalette() or [])[:765]
    pal += [0] * (765 - len(pal)) + list(bg)
    q.putpalette(pal)
    qp = q.load()
    for i, a in enumerate(alpha):
        if a == 0: qp[i % im.width, i // im.width] = key
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, sheet)
    q.save(dst, optimize=True, transparency=key)
    # Verify the saved file carries exactly the intended alpha.
    back = Image.open(dst).convert('RGBA').getchannel('A').tobytes()
    bad = sum(1 for a, b in zip(alpha, back) if (a == 0) != (b == 0))
    transparent = alpha.count(0)
    print(f"{sheet:20} {os.path.getsize(src) // 1024:5} KB -> {os.path.getsize(dst) // 1024:4} KB  transparentes={transparent}  erros={bad}")
    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)
        shown = Image.open(dst).convert('RGBA')
        canvas = Image.new('RGBA', shown.size, (255, 0, 255, 255))
        canvas.alpha_composite(shown)
        canvas.convert('RGB').save(os.path.join(preview_dir, sheet))
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='public/assets')
    ap.add_argument('--out', default='public/assets')
    ap.add_argument('--preview', default=None)
    args = ap.parse_args()
    errors = 0
    for sheet in sorted({s[0] for s in SPECS}):
        errors += process(sheet, args.src, args.out, args.preview)
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
