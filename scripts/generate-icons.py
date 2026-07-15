#!/usr/bin/env python3
"""Generate Meavo Tasks PWA icons with full-bleed brand-green backgrounds."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "public" / "icons"
APP_DIR = ROOT / "src" / "app"

BRAND = (12, 143, 97)  # #0C8F61
WHITE = (250, 249, 247)  # #FAF9F7


def draw_icon(size: int, content_scale: float) -> Image.Image:
    img = Image.new("RGB", (size, size), BRAND)
    draw = ImageDraw.Draw(img)

    scale = size * content_scale / 56
    stroke = max(2, round(2 * scale))
    ox = (size - 56 * scale) / 2
    oy = (size - 56 * scale) / 2

    x0, y0 = ox + 16 * scale, oy + 17 * scale
    x1, y1 = ox + 40 * scale, oy + 39 * scale
    draw.rounded_rectangle(
        [x0, y0, x1, y1],
        radius=max(1, round(3 * scale)),
        outline=WHITE,
        width=stroke,
    )

    check = [
        (ox + 21 * scale, oy + 24 * scale),
        (ox + 24 * scale, oy + 27 * scale),
        (ox + 31 * scale, oy + 20 * scale),
    ]
    draw.line(check, fill=WHITE, width=stroke)

    draw.line(
        [(ox + 21 * scale, oy + 33 * scale), (ox + 35 * scale, oy + 33 * scale)],
        fill=WHITE,
        width=stroke,
    )
    draw.line(
        [(ox + 21 * scale, oy + 37 * scale), (ox + 31 * scale, oy + 37 * scale)],
        fill=WHITE,
        width=stroke,
    )

    return img


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    outputs = {
        ICONS_DIR / "icon-192.png": (192, 0.86),
        ICONS_DIR / "icon-512.png": (512, 0.86),
        ICONS_DIR / "icon-maskable.png": (512, 0.68),
        ICONS_DIR / "apple-touch-icon.png": (180, 0.88),
        APP_DIR / "apple-icon.png": (180, 0.88),
    }

    for path, (size, content_scale) in outputs.items():
        icon = draw_icon(size, content_scale)
        icon.save(path, format="PNG", optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
