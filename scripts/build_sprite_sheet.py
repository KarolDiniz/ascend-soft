"""
Build 6-frame platform sprite sheets from pixel-art idle images.
Removes light/white/cream backgrounds, keeps crisp nearest-neighbor feel.

Usage:
  python scripts/build_sprite_sheet.py --all
  python scripts/build_sprite_sheet.py butter src/assets/platforms/source/butter-pixel.png
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

# Extra-fluid squash curves — exaggerated for satisfying land juice
SQUASH_BY_MATERIAL: dict[str, list[tuple[float, float]]] = {
    "jelly": [
        (1.00, 1.00),
        (1.12, 0.84),
        (1.28, 0.62),
        (1.38, 0.48),
        (1.18, 0.72),
        (0.86, 1.22),
    ],
    "butter": [
        (1.00, 1.00),
        (1.14, 0.82),
        (1.32, 0.58),
        (1.48, 0.38),
        (1.55, 0.28),
        (1.22, 0.68),
    ],
    "mochi": [
        (1.00, 1.00),
        (1.16, 0.80),
        (1.34, 0.54),
        (1.44, 0.40),
        (1.20, 0.70),
        (0.82, 1.28),
    ],
    "chocolate": [
        (1.00, 1.00),
        (1.06, 0.90),
        (1.14, 0.76),
        (1.26, 0.58),
        (1.34, 0.46),
        (1.08, 0.88),
    ],
    "citrus": [
        (1.00, 1.00),
        (1.10, 0.86),
        (1.22, 0.68),
        (1.32, 0.52),
        (1.38, 0.42),
        (1.04, 0.94),
    ],
    "honeycomb": [
        (1.00, 1.00),
        (1.08, 0.88),
        (1.18, 0.70),
        (1.28, 0.52),
        (1.34, 0.40),
        (0.96, 1.08),
    ],
    "glycerin": [
        (1.00, 1.00),
        (1.04, 0.94),
        (1.10, 0.86),
        (1.14, 0.78),
        (1.08, 0.90),
        (0.96, 1.06),
    ],
    "whipped": [
        (1.00, 1.00),
        (1.10, 0.82),
        (1.22, 0.58),
        (1.36, 0.36),
        (1.46, 0.24),
        (1.12, 0.66),
    ],
    "kinetic": [
        (1.00, 1.00),
        (1.12, 0.84),
        (1.24, 0.66),
        (1.34, 0.48),
        (1.40, 0.36),
        (1.16, 0.74),
    ],
    "iceSoap": [
        (1.00, 1.00),
        (1.03, 0.95),
        (1.06, 0.90),
        (1.10, 0.84),
        (1.05, 0.92),
        (0.98, 1.04),
    ],
    "clearSlime": [
        (1.00, 1.00),
        (1.18, 0.78),
        (1.36, 0.52),
        (1.48, 0.34),
        (1.22, 0.66),
        (0.84, 1.22),
    ],
    "butterSlime": [
        (1.00, 1.00),
        (1.14, 0.82),
        (1.28, 0.60),
        (1.38, 0.46),
        (1.18, 0.72),
        (0.88, 1.18),
    ],
}

DEFAULT_SQUASH = [
    (1.00, 1.00),
    (1.08, 0.88),
    (1.18, 0.72),
    (1.26, 0.58),
    (1.14, 0.78),
    (0.94, 1.10),
]

MELT_DARKEN = {"butter", "chocolate", "honeycomb", "whipped", "kinetic"}


def remove_bg(img: Image.Image) -> Image.Image:
    """Remove white/cream/near-white and magenta chroma keys."""
    img = img.convert("RGBA")
    px = img.load()
    assert px is not None
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            # Magenta / hot pink key
            if r > 200 and b > 180 and g < 120:
                px[x, y] = (0, 0, 0, 0)
                continue
            # Near-white / cream studio bg
            if r >= 235 and g >= 230 and b >= 220:
                px[x, y] = (0, 0, 0, 0)
                continue
            if min(r, g, b) > 210 and max(r, g, b) - min(r, g, b) < 25:
                fade = int(255 * (230 - min(r, g, b)) / 20) if min(r, g, b) < 230 else 0
                px[x, y] = (r, g, b, max(0, min(255, fade)))
    return img


def crop_content(img: Image.Image, pad: int = 6) -> Image.Image:
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
    """Nearest-neighbor scale for crisp pixel art."""
    margin = 10
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
    # NEAREST keeps chunky pixels when upscaling pixel art
    resized = img.resize((nw, nh), Image.Resampling.NEAREST)
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - nw) // 2
    y = FRAME_H - margin - nh
    if sy > 1.0:
        y = max(margin, y - int((sy - 1.0) * nh * 0.28))
    frame.paste(resized, (x, y), resized)
    return frame


def tint_squash(frame: Image.Image, material_id: str, frame_idx: int) -> Image.Image:
    if material_id not in MELT_DARKEN or frame_idx < 2:
        return frame
    factor = 1.0 - (frame_idx - 1) * 0.03
    frame = ImageEnhance.Brightness(frame).enhance(factor)
    if frame_idx >= 3:
        frame = ImageEnhance.Color(frame).enhance(1.04 + (frame_idx - 3) * 0.03)
    return frame


def make_sheet(src: str, material_id: str) -> str:
    cut = crop_content(remove_bg(Image.open(src)))
    curves = SQUASH_BY_MATERIAL.get(material_id, DEFAULT_SQUASH)
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for i, (sx, sy) in enumerate(curves):
        frame = fit_frame(cut, sx, sy)
        frame = tint_squash(frame, material_id, i)
        sheet.paste(frame, (i * FRAME_W, 0), frame)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"{material_id}.png")
    sheet.save(out, "PNG")
    return out


def resolve_source(mid: str) -> str | None:
    candidates = [
        os.path.join(SOURCE_DIR, f"{mid}-pixel.png"),
        os.path.join(SOURCE_DIR, f"{mid}-idle-v2.png"),
        os.path.join(SOURCE_DIR, f"{mid}-idle.png"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("material_id", nargs="?")
    p.add_argument("source_image", nargs="?")
    p.add_argument("--all", action="store_true")
    args = p.parse_args()

    if args.all:
        for mid in SQUASH_BY_MATERIAL:
            src = resolve_source(mid)
            if not src:
                print(f"skip {mid}: no source", file=sys.stderr)
                continue
            print(f"Wrote {make_sheet(src, mid)} from {os.path.basename(src)}")
        return

    if not args.material_id or not args.source_image:
        p.print_help()
        sys.exit(1)
    if not os.path.isfile(args.source_image):
        print(f"missing: {args.source_image}", file=sys.stderr)
        sys.exit(1)
    print(f"Wrote {make_sheet(args.source_image, args.material_id)}")


if __name__ == "__main__":
    main()
