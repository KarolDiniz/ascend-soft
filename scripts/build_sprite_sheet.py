"""
Build 6-frame platform sprite sheets from AI idle images.

Usage:
  python scripts/build_sprite_sheet.py butter src/assets/platforms/source/butter-idle.png
  python scripts/build_sprite_sheet.py whipped src/assets/platforms/source/whipped-idle.png

Output: public/assets/platforms/{id}.png (1536x160)
"""

from __future__ import annotations

import argparse
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "assets", "platforms")
FRAME_W, FRAME_H = 256, 160
FRAMES = 6
SQUASH = [
    (1.00, 1.00),
    (1.06, 0.90),
    (1.14, 0.76),
    (1.18, 0.68),
    (1.10, 0.82),
    (0.96, 1.08),
]


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


def make_sheet(src: str, material_id: str) -> str:
    cut = crop_content(remove_bg(Image.open(src)))
    sheet = Image.new("RGBA", (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for i, (sx, sy) in enumerate(SQUASH):
        frame = fit_frame(cut, sx, sy)
        sheet.paste(frame, (i * FRAME_W, 0), frame)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"{material_id}.png")
    sheet.save(out, "PNG")
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("material_id")
    p.add_argument("source_image")
    args = p.parse_args()
    if not os.path.isfile(args.source_image):
        print(f"missing: {args.source_image}", file=sys.stderr)
        sys.exit(1)
    out = make_sheet(args.source_image, args.material_id)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
