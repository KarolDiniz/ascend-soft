"""
Build 6-frame platform sprite sheets from AI idle images.

Each material gets a unique squash/rebound curve matching its gameplay feel.

Usage:
  python scripts/build_sprite_sheet.py butter src/assets/platforms/source/butter-idle.png
  python scripts/build_sprite_sheet.py --all

Output: public/assets/platforms/{id}.png (1536x160)
"""

from __future__ import annotations

import argparse
import os
import sys

from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "assets", "platforms")
SOURCE_DIR = os.path.join(ROOT, "src", "assets", "platforms", "source")
FRAME_W, FRAME_H = 256, 160
FRAMES = 6

# (sx, sy) per frame: idle → squash1–4 → rebound
# Curves tuned so each material "reads" differently in 6 frames.
SQUASH_BY_MATERIAL: dict[str, list[tuple[float, float]]] = {
    # elastic wobble — deep bounce, tall rebound
    "jelly": [
        (1.00, 1.00),
        (1.10, 0.86),
        (1.22, 0.68),
        (1.28, 0.58),
        (1.12, 0.78),
        (0.90, 1.16),
    ],
    # melt — spreads wide, flattens hard, weak rebound (almost puddle)
    "butter": [
        (1.00, 1.00),
        (1.12, 0.84),
        (1.28, 0.62),
        (1.42, 0.42),
        (1.48, 0.34),
        (1.20, 0.72),
    ],
    # extreme soft bounce
    "mochi": [
        (1.00, 1.00),
        (1.14, 0.82),
        (1.30, 0.60),
        (1.38, 0.48),
        (1.18, 0.74),
        (0.86, 1.22),
    ],
    # dense ganache — subtle flex then soft melt flatten
    "chocolate": [
        (1.00, 1.00),
        (1.05, 0.92),
        (1.12, 0.80),
        (1.22, 0.64),
        (1.30, 0.52),
        (1.08, 0.88),
    ],
    # squeeze — pulp compress, juice flatten
    "citrus": [
        (1.00, 1.00),
        (1.08, 0.88),
        (1.18, 0.72),
        (1.26, 0.58),
        (1.32, 0.48),
        (1.04, 0.94),
    ],
    # sticky honey stretch
    "honeycomb": [
        (1.00, 1.00),
        (1.06, 0.90),
        (1.14, 0.74),
        (1.20, 0.58),
        (1.24, 0.48),
        (0.98, 1.06),
    ],
    # rigid soap — small dent, crisp rebound
    "glycerin": [
        (1.00, 1.00),
        (1.04, 0.94),
        (1.08, 0.86),
        (1.12, 0.78),
        (1.06, 0.90),
        (0.96, 1.06),
    ],
    # foam peaks collapse → pop flatten
    "whipped": [
        (1.00, 1.00),
        (1.08, 0.84),
        (1.18, 0.64),
        (1.30, 0.42),
        (1.38, 0.30),
        (1.10, 0.70),
    ],
    # sand mound → footprint compress → settle
    "kinetic": [
        (1.00, 1.00),
        (1.10, 0.86),
        (1.20, 0.70),
        (1.28, 0.55),
        (1.32, 0.45),
        (1.14, 0.78),
    ],
    # ice — almost rigid, micro crack squash
    "iceSoap": [
        (1.00, 1.00),
        (1.02, 0.96),
        (1.05, 0.90),
        (1.08, 0.84),
        (1.04, 0.92),
        (0.98, 1.03),
    ],
    # slime blob spread + elastic snap
    "clearSlime": [
        (1.00, 1.00),
        (1.16, 0.80),
        (1.32, 0.58),
        (1.42, 0.40),
        (1.20, 0.70),
        (0.88, 1.18),
    ],
    # butter slime dough fold
    "butterSlime": [
        (1.00, 1.00),
        (1.12, 0.84),
        (1.26, 0.64),
        (1.34, 0.50),
        (1.16, 0.76),
        (0.92, 1.14),
    ],
}

DEFAULT_SQUASH = [
    (1.00, 1.00),
    (1.06, 0.90),
    (1.14, 0.76),
    (1.18, 0.68),
    (1.10, 0.82),
    (0.96, 1.08),
]

# Slight brightness/contrast nudge per late squash frames for melt/foam readability
MELT_DARKEN = {"butter", "chocolate", "honeycomb", "whipped", "kinetic"}


def remove_bg(img: Image.Image, threshold: int = 245) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    assert px is not None
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, _a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
            else:
                m = min(r, g, b)
                if m > 220:
                    fade = int(255 * (245 - m) / 25)
                    px[x, y] = (r, g, b, max(0, min(255, fade)))
    return img


def crop_content(img: Image.Image, pad: int = 8) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop(
        (
            max(0, l - pad),
            max(0, t - pad),
            min(img.width, r + pad),
            min(img.height, b + pad),
        )
    )


def fit_frame(img: Image.Image, sx: float, sy: float) -> Image.Image:
    margin = 12
    max_w = FRAME_W - margin * 2
    max_h = FRAME_H - margin * 2
    scale = min(max_w / img.width, max_h / img.height)
    nw = max(1, int(img.width * scale * sx))
    nh = max(1, int(img.height * scale * sy))
    if nw > max_w:
        nh = max(1, int(nh * max_w / nw))
        nw = max_w
    if nh > max_h:
        nw = max(1, int(nw * max_h / nh))
        nh = max_h
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - nw) // 2
    y = FRAME_H - margin - nh
    if sy > 1.0:
        y = max(margin, y - int((sy - 1.0) * nh * 0.3))
    frame.paste(resized, (x, y), resized)
    return frame


def soften_edges(frame: Image.Image) -> Image.Image:
    """Tiny blur on alpha edge for creamier ASMR feel."""
    r, g, b, a = frame.split()
    a = a.filter(ImageFilter.GaussianBlur(radius=0.6))
    return Image.merge("RGBA", (r, g, b, a))


def tint_squash(frame: Image.Image, material_id: str, frame_idx: int) -> Image.Image:
    if material_id not in MELT_DARKEN or frame_idx < 2:
        return frame
    # Progressive warmth / density as squash deepens
    factor = 1.0 - (frame_idx - 1) * 0.035
    enh = ImageEnhance.Brightness(frame)
    frame = enh.enhance(factor)
    if frame_idx >= 3:
        frame = ImageEnhance.Color(frame).enhance(1.05 + (frame_idx - 3) * 0.04)
    return frame


def make_sheet(src: str, material_id: str) -> str:
    cut = crop_content(remove_bg(Image.open(src)))
    curves = SQUASH_BY_MATERIAL.get(material_id, DEFAULT_SQUASH)
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for i, (sx, sy) in enumerate(curves):
        frame = fit_frame(cut, sx, sy)
        frame = tint_squash(frame, material_id, i)
        frame = soften_edges(frame)
        sheet.paste(frame, (i * FRAME_W, 0), frame)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"{material_id}.png")
    sheet.save(out, "PNG")
    return out


def build_all(source_map: dict[str, str]) -> None:
    for mid, path in source_map.items():
        if not os.path.isfile(path):
            print(f"skip {mid}: missing {path}", file=sys.stderr)
            continue
        out = make_sheet(path, mid)
        print(f"Wrote {out}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("material_id", nargs="?")
    p.add_argument("source_image", nargs="?")
    p.add_argument("--all", action="store_true")
    args = p.parse_args()

    if args.all:
        # Prefer *-idle-v2.png then *-idle.png in source/
        ids = list(SQUASH_BY_MATERIAL.keys())
        source_map: dict[str, str] = {}
        for mid in ids:
            v2 = os.path.join(SOURCE_DIR, f"{mid}-idle-v2.png")
            v1 = os.path.join(SOURCE_DIR, f"{mid}-idle.png")
            if os.path.isfile(v2):
                source_map[mid] = v2
            elif os.path.isfile(v1):
                source_map[mid] = v1
        build_all(source_map)
        return

    if not args.material_id or not args.source_image:
        p.print_help()
        sys.exit(1)
    if not os.path.isfile(args.source_image):
        print(f"missing: {args.source_image}", file=sys.stderr)
        sys.exit(1)
    out = make_sheet(args.source_image, args.material_id)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
