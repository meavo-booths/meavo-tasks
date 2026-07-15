#!/usr/bin/env python3
"""Generate Meavo Tasks PWA icons tuned for macOS dock and mobile home screens."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "public" / "icons"
APP_DIR = ROOT / "src" / "app"

BRAND_TOP = (48, 164, 108)  # #30A46C
BRAND_BOTTOM = (12, 143, 97)  # #0C8F61
BRAND_INK = (8, 108, 74)  # checklist marks on the white card
WHITE = (255, 255, 255)

# Geometry in a 56x56 design grid.
CARD = (7.0, 8.0, 49.0, 48.0)
CARD_RADIUS = 6.0
CHECK = [(14.0, 21.0), (18.5, 25.5), (29.0, 15.0)]
LINE_TOP = (14.0, 31.0, 42.0, 31.0)
LINE_BOTTOM = (14.0, 37.0, 33.0, 37.0)
STROKE = 3.2


def _lerp_color(
    start: tuple[int, int, int],
    end: tuple[int, int, int],
    amount: float,
) -> tuple[int, int, int]:
    return tuple(
        round(start[i] + (end[i] - start[i]) * amount) for i in range(3)
    )


def _draw_macos_gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    pixels = img.load()
    highlight_x = size * 0.5
    highlight_y = size * 0.28
    highlight_radius = size * 0.78

    for y in range(size):
        vertical = (y / max(size - 1, 1)) ** 0.9
        base = _lerp_color(BRAND_TOP, BRAND_BOTTOM, vertical)

        for x in range(size):
            distance = math.hypot(x - highlight_x, y - highlight_y)
            gloss = max(0.0, 1.0 - distance / highlight_radius) * 0.14
            edge = max(abs(x - size / 2), abs(y - size / 2)) / (size / 2)
            vignette = edge**2 * 0.08

            color = tuple(
                max(
                    0,
                    min(
                        255,
                        round(
                            channel * (1.0 - vignette) + (255 - channel) * gloss
                        ),
                    ),
                )
                for channel in base
            )
            pixels[x, y] = color

    return img


def _scale_point(
    ox: float,
    oy: float,
    scale: float,
    x: float,
    y: float,
) -> tuple[float, float]:
    return ox + x * scale, oy + y * scale


def draw_icon(size: int, content_scale: float) -> Image.Image:
    img = _draw_macos_gradient(size)
    draw = ImageDraw.Draw(img)

    scale = size * content_scale / 56
    stroke = max(3, round(STROKE * scale))
    ox = (size - 56 * scale) / 2
    oy = (size - 56 * scale) / 2

    card_x0, card_y0 = _scale_point(ox, oy, scale, CARD[0], CARD[1])
    card_x1, card_y1 = _scale_point(ox, oy, scale, CARD[2], CARD[3])
    draw.rounded_rectangle(
        [card_x0, card_y0, card_x1, card_y1],
        radius=max(2, round(CARD_RADIUS * scale)),
        fill=WHITE,
    )

    check = [
        _scale_point(ox, oy, scale, x, y) for x, y in CHECK
    ]
    draw.line(check, fill=BRAND_INK, width=stroke, joint="curve")

    draw.line(
        [
            _scale_point(ox, oy, scale, LINE_TOP[0], LINE_TOP[1]),
            _scale_point(ox, oy, scale, LINE_TOP[2], LINE_TOP[3]),
        ],
        fill=BRAND_INK,
        width=stroke,
    )
    draw.line(
        [
            _scale_point(ox, oy, scale, LINE_BOTTOM[0], LINE_BOTTOM[1]),
            _scale_point(ox, oy, scale, LINE_BOTTOM[2], LINE_BOTTOM[3]),
        ],
        fill=BRAND_INK,
        width=stroke,
    )

    return img


def draw_favicon(size: int, content_scale: float, corner_radius_ratio: float = 0.22) -> Image.Image:
    """Browser-tab favicon with rounded corners; dock icons stay square/full-bleed."""
    square = draw_icon(size, content_scale)
    radius = max(2, round(size * corner_radius_ratio))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)

    favicon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    favicon.paste(square, (0, 0), mask)
    return favicon


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    outputs = {
        ICONS_DIR / "icon-192.png": (192, 0.94),
        ICONS_DIR / "icon-512.png": (512, 0.94),
        ICONS_DIR / "icon-maskable.png": (512, 0.76),
        ICONS_DIR / "apple-touch-icon.png": (180, 0.96),
        APP_DIR / "apple-icon.png": (180, 0.96),
    }

    for path, (size, content_scale) in outputs.items():
        icon = draw_icon(size, content_scale)
        icon.save(path, format="PNG", optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({size}x{size})")

    favicon_outputs = {
        ICONS_DIR / "favicon-32.png": (32, 0.88),
        ICONS_DIR / "favicon-192.png": (192, 0.92),
    }

    for path, (size, content_scale) in favicon_outputs.items():
        icon = draw_favicon(size, content_scale)
        icon.save(path, format="PNG", optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
