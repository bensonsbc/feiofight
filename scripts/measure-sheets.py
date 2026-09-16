"""Measure a folder of sprite sheets and write the crop table the game uses.

Each sheet follows the house layout: a title at the top, seven rows labelled
ANDAR, PULAR, ABAIXAR, CHUTE, SOCO, ESPECIAL and DEFESA, four right-facing
figures per row, on a flat grey background. This tool finds the figures,
derives one crop per (action, frame), the anchor under the feet, the height
used for scaling and the detached special effect used as the projectile,
and writes everything to a JSON atlas. lib/render.ts and
scripts/prepare-sheets.py both read that atlas, so there is a single table.

Usage (Python 3 + Pillow):
    python scripts/measure-sheets.py --src art/source/rockstar --out art/source/rockstar/atlas.json [--preview DIR]

--preview writes each sheet with the crops (yellow), anchors (red) and the
projectile (magenta) drawn on top, for review.
"""
import argparse, json, os, sys
from collections import deque
from PIL import Image, ImageDraw

ACTIONS = ["walk", "jump", "crouch", "kick", "punch", "special", "block"]
LABEL_WIDTH = 112   # column of ANDAR/PULAR/... labels on the left
TITLE_HEIGHT = 60   # sheet title band
PAD = 6             # margin added around each figure
TOL = 42            # colour distance that still counts as background

# Hand overrides for what the detector cannot know. Keys are sheet ids.
# projectile: [x, y, w, h] on the sheet, when the effect is not detached in the last frame.
OVERRIDES = {
    # The crack and golden wave touch Elvis's feet, so they are not a detached component.
    "elvis-presley": {"projectile": [876, 1183, 148, 124]},
    # Sid keeps the bass in his hands in every frame; the body of the bass from frame 2 is thrown.
    "sid-vicious": {"projectile": [322, 1120, 100, 48], "spin": True},
    "lemmy-kilmister": {"spin": True},
    # The third-frame dog shares its rectangle with the fighter's outstretched hand; the fourth-frame dog stands clear.
    "iggy-pop": {"projectile": [889, 1195, 113, 91]},
}


def border_median(px, W, H):
    idx = list(range(W)) + [(H - 1) * W + x for x in range(W)] + [y * W for y in range(1, H - 1)] + [y * W + W - 1 for y in range(1, H - 1)]
    return tuple(sorted(px[i][c] for i in idx)[len(idx) >> 1] for c in range(3))


def is_shadow(p, d, dark):
    """Painted floor shadow: a bluish mid grey, darker than the sheet but far from black shoes."""
    return d < 115 and max(p) - min(p) < 25 and max(p) < dark


def figure_mask(im):
    """Returns (figure mask, label mask, bg). Labels live left of LABEL_WIDTH, figures right of it."""
    W, H = im.size
    px = list(im.getdata())
    bg = border_median(px, W, H)
    m = bytearray(W * H); labels = bytearray(W * H)
    dark = max(bg) - 30
    for i, p in enumerate(px):
        d = max(abs(p[0] - bg[0]), abs(p[1] - bg[1]), abs(p[2] - bg[2]))
        if d < TOL or i // W < TITLE_HEIGHT: continue
        if i % W < LABEL_WIDTH: labels[i] = 1; continue
        # The painted floor shadows are unsaturated grey a little darker than the background. They
        # are wide enough to touch the neighbouring figure's shadow, which would merge two fighters,
        # so they are not part of the figure mask. White shirts are lighter than the background and stay.
        if is_shadow(p, d, dark): continue
        m[i] = 1
    return m, labels, bg


def row_bands(m, labels, W, H):
    """Seven row bands: label blocks on the left give the row centres, figure content gives the extent."""
    label_c = [sum(labels[y * W:(y + 1) * W]) for y in range(H)]
    lab = merge_to(bands(label_c, 6), 7)
    if len(lab) != 7: raise SystemExit(f"expected 7 labels, found {len(lab)}")
    centres = [(a + b) / 2 for a, b in lab]
    cuts = [TITLE_HEIGHT] + [round((centres[i] + centres[i + 1]) / 2) for i in range(6)] + [H]
    rows_c = [sum(m[y * W:(y + 1) * W]) for y in range(H)]
    out = []
    for i in range(7):
        ys = [y for y in range(cuts[i], cuts[i + 1]) if rows_c[y]]
        if not ys: raise SystemExit(f"row {ACTIONS[i]} has no figures")
        out.append([ys[0], ys[-1]])
    return out


def bands(counts, min_gap):
    """Runs of positive counts; runs separated by less than min_gap are merged."""
    runs = []; start = None
    for i, c in enumerate(counts + [0]):
        if c and start is None: start = i
        elif not c and start is not None:
            runs.append([start, i - 1]); start = None
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] <= min_gap: merged[-1][1] = r[1]
        else: merged.append(r)
    return merged


def merge_to(runs, n):
    """Merge the closest neighbours until only n runs remain."""
    runs = [list(r) for r in runs]
    while len(runs) > n:
        gaps = [(runs[i + 1][0] - runs[i][1], i) for i in range(len(runs) - 1)]
        _, i = min(gaps)
        runs[i][1] = runs[i + 1][1]; del runs[i + 1]
    return runs


def components(m, W, box):
    """4-connected components of the mask inside box=(x0,y0,x1,y1); returns bboxes with pixel counts."""
    x0, y0, x1, y1 = box
    seen = set(); out = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            i = y * W + x
            if not m[i] or i in seen: continue
            q = deque([i]); seen.add(i); bx0 = bx1 = x; by0 = by1 = y; n = 0
            while q:
                j = q.popleft(); n += 1; jx, jy = j % W, j // W
                bx0 = min(bx0, jx); bx1 = max(bx1, jx); by0 = min(by0, jy); by1 = max(by1, jy)
                for k in (j - 1, j + 1, j - W, j + W):
                    kx, ky = k % W, k // W
                    if x0 <= kx < x1 and y0 <= ky < y1 and m[k] and k not in seen:
                        seen.add(k); q.append(k)
            out.append((bx0, by0, bx1, by1, n))
    return out


BIG = 2500  # pixels: a component this large is a fighter, anything smaller is a fragment or an effect


def gap(a, b):
    """Distance between two bboxes (0 when they touch or overlap)."""
    dx = max(0, max(a[0], b[0]) - min(a[2], b[2])); dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
    return (dx * dx + dy * dy) ** .5


def measure(path, sheet_id):
    im = Image.open(path).convert("RGB"); W, H = im.size
    m, labels, bg = figure_mask(im)
    # Row centres come from the seven labels on the left. Figures overlap the neighbouring row's
    # band (high kicks, floor shadows), so rows are never cut as horizontal bands.
    label_c = [sum(labels[y * W:(y + 1) * W]) for y in range(H)]
    # A label is tall and wide; a heel poking into the label column is tall but only a few pixels wide.
    lab = [b for b in bands(label_c, 6) if b[1] - b[0] >= 15 and max(label_c[b[0]:b[1]]) >= 40]
    lab = merge_to(lab, 7)
    if len(lab) != 7: raise SystemExit(f"{sheet_id}: expected 7 labels, found {len(lab)}")
    # Row windows: between two labels, cut at the emptiest scanline. Figures of neighbouring rows
    # can touch (feet against hair, effects against figures), so components are found per window.
    tops = [a for a, b in lab]
    rows_c = [sum(m[y * W:(y + 1) * W]) for y in range(H)]
    cuts = [TITLE_HEIGHT]
    for i in range(1, 7):
        lo = max(TITLE_HEIGHT, tops[i] - 130); hi = tops[i] - 30
        cuts.append(min(range(lo, hi), key=lambda y: (rows_c[y], y)))
    cuts.append(H)
    cells = {}; fighters = {}; frags = []
    for r in range(7):
        cs = [c for c in components(m, W, (LABEL_WIDTH, cuts[r], W, cuts[r + 1])) if c[4] >= 30]
        bigs = sorted([c for c in cs if c[4] >= BIG], key=lambda c: -c[4])
        # An effect (petals, cigarettes) can bridge two fighters into one component: split the widest
        # component at the emptiest column of its middle third until the row has four fighters.
        while len(bigs) < 4:
            widest = max(bigs, key=lambda c: c[2] - c[0]); bigs.remove(widest)
            x0, y0, x1, y1, _ = widest
            cols = {x: sum(m[y * W + x] for y in range(y0, y1 + 1)) for x in range(x0 + (x1 - x0) // 3, x1 - (x1 - x0) // 3)}
            cut = min(cols, key=lambda x: (cols[x], x))
            for lo, hi in ((x0, cut - 1), (cut, x1)):
                xs = [(x, y) for y in range(y0, y1 + 1) for x in range(lo, hi + 1) if m[y * W + x]]
                if xs: bigs.append((min(p[0] for p in xs), min(p[1] for p in xs), max(p[0] for p in xs), max(p[1] for p in xs), len(xs)))
            if len(bigs) < 2: raise SystemExit(f"{sheet_id}: row {ACTIONS[r]} cannot be split into four fighters")
        bigs.sort(key=lambda c: -c[4])
        # Fighters are the four largest; a lizard or a bat is big but still smaller than a fighter.
        for k, c in enumerate(sorted(bigs[:4], key=lambda c: (c[0] + c[2]) / 2)):
            cells[(r, k)] = [c]; fighters[c] = (r, k)
        frags += bigs[4:] + [c for c in cs if c[4] < BIG]
    # Letters of a long label (ABAIXAR, ESPECIAL) spill past the label column. They are small
    # components hugging the left edge; they are not part of any figure and get erased from the sheet.
    erase = [c for c in frags if c[2] < LABEL_WIDTH + 65 and c[4] < 600 and c[3] - c[1] < 60]
    # The bottom of the title letters hangs below the title band into the first row. Those are
    # short components glued to the band edge, far smaller than a head; they get erased too.
    erase += [c for c in frags if c not in erase and c[1] <= TITLE_HEIGHT and c[3] - c[1] < 28 and c[4] < 600]
    frags = [c for c in frags if c not in erase]
    # Every fragment joins the nearest fighter, so a shadow stays with its own figure. In the special
    # row a sizeable detached effect flies to the right of whoever threw it, so it joins the nearest
    # fighter to its LEFT (a bottle halfway between frames 3 and 4 belongs to frame 3).
    special = [f for f, (r, k) in fighters.items() if r == 5]
    for c in frags:
        cx = (c[0] + c[2]) / 2; cy = (c[1] + c[3]) / 2
        # A figure whose box overlaps the effect on its left half is not its thrower: that is the
        # previous frame's projectile flying into this frame's space. An effect on a figure's right
        # half (a dog at the fighter's hand) belongs to that figure.
        throwers = [f for f in special if (f[0] + f[2]) / 2 < cx and not (f[0] <= cx < (f[0] + f[2]) / 2 and f[1] <= cy <= f[3])]
        if c[4] >= 300 and cuts[5] <= cy < cuts[6] and throwers:
            best = max(throwers, key=lambda f: (f[0] + f[2]) / 2)
        else:
            best = min(fighters, key=lambda f: gap(c, f))
        cells[fighters[best]].append(c)
    frames = {}; anchors_dbg = []; projectile = None
    for r in range(7):
        crops = []
        for k in range(4):
            group = cells.get((r, k))
            if not group: raise SystemExit(f"{sheet_id}: row {ACTIONS[r]} frame {k} has no figure")
            figure = max(group, key=lambda c: c[4])
            x0 = max(LABEL_WIDTH, min(c[0] for c in group) - PAD); x1 = min(W - 1, max(c[2] for c in group) + PAD)
            y0 = max(TITLE_HEIGHT, min(c[1] for c in group) - PAD); y1 = min(H - 1, max(c[3] for c in group) + PAD)
            # The body is the figure plus its fragments: a white suit breaks into pieces where its
            # shading matches the sheet. Not body: effects flying right of the figure in the special
            # row, and the short wide floor shadow left under an airborne figure.
            body = [c for c in group if not (r == 5 and c[0] > figure[2]) and not (c[1] > figure[3] - 5 and c[3] - c[1] < 24)]
            bx0 = min(c[0] for c in body); by0 = min(c[1] for c in body); bx1 = max(c[2] for c in body); by1 = max(c[3] for c in body)
            feet = by1  # the strict shadow rule of figure_mask keeps the painted shadow out of the body
            if r == 0 and k == 0: walk_height = feet - by0 + 1
            # anchor: horizontal centre of the body's lowest 25% (the feet), relative to the crop
            fy0 = feet - (feet - by0) // 4
            xs = [x for y in range(fy0, feet + 1) for x in range(bx0, bx1 + 1) if m[y * W + x]]
            anchor = round(sum(xs) / len(xs)) - x0 if xs else (bx0 + bx1) // 2 - x0
            crops.append([x0, y0, x1 - x0 + 1, y1 - y0 + 1, anchor, feet + 1])
        # The four frames of a row stand on one floor line (jumps excepted). A frame whose feet line
        # strays from the row median by more than 12 px was measured on a broken figure: it takes the
        # median, so no frame sinks into or floats above the floor mid-animation.
        if r != 1:
            med = sorted(c[5] for c in crops)[2]
            for c in crops:
                if abs(c[5] - med) > 12: c[5] = med
        for c in crops:
            anchors_dbg.append((c[0] + c[4], c[5] - 1))
            c[5] -= c[1]  # baseline relative to the crop; rows below it (the painted shadow) are cleared in-game
        frames[ACTIONS[r]] = crops
    # Projectile: the largest detached effect to the right of its thrower among the special frames.
    best_area = 0
    for k in (3, 2, 1):
        group = cells[(5, k)]; figure = max(group, key=lambda c: c[4])
        fcx = (figure[0] + figure[2]) / 2
        effect = [c for c in group if c is not figure and (c[0] + c[2]) / 2 > fcx + 20 and c[2] > figure[2]]
        area = sum(c[4] for c in effect)
        if effect and area >= 600 and area > best_area:  # stray specks never qualify
            ex0 = min(c[0] for c in effect); ey0 = min(c[1] for c in effect); ex1 = max(c[2] for c in effect); ey1 = max(c[3] for c in effect)
            projectile = [ex0 - 3, ey0 - 3, ex1 - ex0 + 7, ey1 - ey0 + 7]; best_area = area
    standing = round(walk_height * 0.9)  # renders a touch under the crop, like the existing cast
    ov = OVERRIDES.get(sheet_id, {})
    if "projectile" in ov: projectile = ov["projectile"]
    if projectile is None:
        for k in range(4):
            print(f"  special frame {k}:", sorted(cells[(5, k)], key=lambda c: -c[4])[:6], file=sys.stderr)
        raise SystemExit(f"{sheet_id}: no detached effect in the special frames; add an override")
    px, py, pw, ph = projectile
    entry = {"sheet": os.path.basename(path), "ref": [W, H], "standing": standing, "frames": frames,
             "projectile": [px, py, pw, ph, pw // 2, ph - 1], "spin": bool(ov.get("spin", False)),
             "erase": [[c[0], c[1], c[2] - c[0] + 1, c[3] - c[1] + 1] for c in erase]}
    return entry, im, anchors_dbg


def preview(im, entry, anchors, dst):
    d = ImageDraw.Draw(im)
    for action, crops in entry["frames"].items():
        for x, y, w, h, a, b in crops:
            d.rectangle([x, y, x + w - 1, y + h - 1], outline=(255, 220, 0))
    for ax, ay in anchors:
        d.ellipse([ax - 3, ay - 3, ax + 3, ay + 3], fill=(255, 40, 40))
    x, y, w, h, a, b = entry["projectile"]
    d.rectangle([x, y, x + w - 1, y + h - 1], outline=(255, 0, 255), width=2)
    im.save(dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True); ap.add_argument("--out", required=True); ap.add_argument("--preview")
    args = ap.parse_args()
    atlas = {}
    for name in sorted(os.listdir(args.src)):
        if not name.endswith("-sheet.png"): continue
        sheet_id = name[:-len("-sheet.png")]
        entry, im, anchors = measure(os.path.join(args.src, name), sheet_id)
        atlas[sheet_id] = entry
        print(f"{sheet_id:16} standing={entry['standing']:3} projectile={entry['projectile'][:4]}")
        if args.preview:
            os.makedirs(args.preview, exist_ok=True)
            preview(im, entry, anchors, os.path.join(args.preview, name))
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(atlas, f, indent=1)
    print("atlas:", args.out, "sheets:", len(atlas))


if __name__ == "__main__":
    main()
