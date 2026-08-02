#!/usr/bin/env python3
"""Generate KURA's app icons as PNGs, with no third-party dependencies.

The mark is original artwork: a vault/box outline (蔵 = storehouse) containing
three ascending bars (a portfolio). Deliberately geometric so it stays legible
at 48px on a home screen, and so it carries no third-party rights — SPEC §1.2
forbids shipping anyone else's brand imagery.

Run:  python3 assets/generate-icons.py
"""

import struct
import zlib

INK = (15, 23, 32, 255)        # #0F1720
ACCENT = (31, 111, 235, 255)   # #1F6FEB
WHITE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)


class Canvas:
    def __init__(self, size, background):
        self.size = size
        self.px = [[background for _ in range(size)] for _ in range(size)]

    def blend(self, x, y, color, alpha=1.0):
        """Alpha-composite `color` over the existing pixel."""
        if not (0 <= x < self.size and 0 <= y < self.size):
            return
        a = alpha * (color[3] / 255)
        if a <= 0:
            return
        dst = self.px[y][x]
        da = dst[3] / 255
        out_a = a + da * (1 - a)
        if out_a <= 0:
            self.px[y][x] = CLEAR
            return
        out = tuple(
            int(round((color[i] * a + dst[i] * da * (1 - a)) / out_a)) for i in range(3)
        )
        self.px[y][x] = (out[0], out[1], out[2], int(round(out_a * 255)))

    def rounded_rect(self, x0, y0, x1, y1, radius, color, samples=4):
        """Filled rounded rectangle, supersampled so edges are not jagged."""
        step = 1.0 / samples
        for y in range(int(y0) - 1, int(y1) + 2):
            for x in range(int(x0) - 1, int(x1) + 2):
                hits = 0
                for sy in range(samples):
                    for sx in range(samples):
                        px = x + (sx + 0.5) * step
                        py = y + (sy + 0.5) * step
                        if self._inside_rounded(px, py, x0, y0, x1, y1, radius):
                            hits += 1
                if hits:
                    self.blend(x, y, color, hits / (samples * samples))

    @staticmethod
    def _inside_rounded(px, py, x0, y0, x1, y1, r):
        if not (x0 <= px <= x1 and y0 <= py <= y1):
            return False
        # Outside the corner arcs?
        cx = min(max(px, x0 + r), x1 - r)
        cy = min(max(py, y0 + r), y1 - r)
        return (px - cx) ** 2 + (py - cy) ** 2 <= r * r

    def to_png(self, path):
        raw = bytearray()
        for row in self.px:
            raw.append(0)  # filter type 0
            for r, g, b, a in row:
                raw += bytes((r, g, b, a))

        def chunk(tag, data):
            out = struct.pack(">I", len(data)) + tag + data
            return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

        header = struct.pack(">IIBBBBB", self.size, self.size, 8, 6, 0, 0, 0)
        png = (
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b"")
        )
        with open(path, "wb") as fh:
            fh.write(png)
        print(f"wrote {path} ({self.size}x{self.size}, {len(png)} bytes)")


def draw_mark(canvas, cx, cy, scale, body, accent):
    """Vault outline with three ascending bars inside."""
    unit = scale
    half = unit / 2

    # Vault outline: an open box drawn as four bars, leaving the interior clear.
    thickness = unit * 0.085
    left, top = cx - half, cy - half
    right, bottom = cx + half, cy + half
    radius = unit * 0.16

    # Outer rounded square, then punch the interior back out.
    canvas.rounded_rect(left, top, right, bottom, radius, body)
    canvas.rounded_rect(
        left + thickness,
        top + thickness,
        right - thickness,
        bottom - thickness,
        max(radius - thickness, 1),
        CLEAR if body[3] == 255 else CLEAR,
    )

    # Interior bars. Heights ascend left→right: a portfolio going up.
    bar_w = unit * 0.13
    gap = unit * 0.075
    base = bottom - thickness * 2.2
    total = bar_w * 3 + gap * 2
    start = cx - total / 2
    heights = [unit * 0.20, unit * 0.34, unit * 0.48]

    for i, h in enumerate(heights):
        x = start + i * (bar_w + gap)
        color = accent if i == 2 else body
        canvas.rounded_rect(x, base - h, x + bar_w, base, bar_w / 2, color)


def punch_interior(canvas, cx, cy, scale):
    """Clear the vault interior so the bars sit inside an outline, not a slab."""
    unit = scale
    half = unit / 2
    thickness = unit * 0.085
    radius = unit * 0.16
    for y in range(canvas.size):
        for x in range(canvas.size):
            if canvas._inside_rounded(
                x + 0.5,
                y + 0.5,
                cx - half + thickness,
                cy - half + thickness,
                cx + half - thickness,
                cy + half - thickness,
                max(radius - thickness, 1),
            ):
                canvas.px[y][x] = CLEAR


def build_icon(size=1024):
    """Store icon: light background, dark mark. Must be fully opaque for iOS."""
    c = Canvas(size, WHITE)
    # iOS icons are shown edge to edge, so the mark should fill most of the
    # canvas — a small mark reads as a mistake next to other apps.
    scale = size * 0.74
    cx = cy = size / 2
    c.rounded_rect(
        cx - scale / 2, cy - scale / 2, cx + scale / 2, cy + scale / 2, scale * 0.16, INK
    )
    punch_interior(c, cx, cy, scale)
    # Re-fill the punched interior with the background, then draw the bars.
    for y in range(size):
        for x in range(size):
            if c.px[y][x][3] == 0:
                c.px[y][x] = WHITE
    _bars(c, cx, cy, scale, INK, ACCENT)
    c.to_png("assets/icon.png")


def build_adaptive(size=1024):
    """Android adaptive foreground: transparent, mark inside the 66% safe zone."""
    c = Canvas(size, CLEAR)
    scale = size * 0.40  # keeps the mark within the circular mask
    cx = cy = size / 2
    c.rounded_rect(
        cx - scale / 2, cy - scale / 2, cx + scale / 2, cy + scale / 2, scale * 0.16, INK
    )
    punch_interior(c, cx, cy, scale)
    _bars(c, cx, cy, scale, INK, ACCENT)
    c.to_png("assets/adaptive-icon.png")


def build_splash(size=512):
    """Splash mark on transparency; app.json supplies the background colour."""
    c = Canvas(size, CLEAR)
    scale = size * 0.62
    cx = cy = size / 2
    c.rounded_rect(
        cx - scale / 2, cy - scale / 2, cx + scale / 2, cy + scale / 2, scale * 0.16, INK
    )
    punch_interior(c, cx, cy, scale)
    _bars(c, cx, cy, scale, INK, ACCENT)
    c.to_png("assets/splash.png")


def _bars(canvas, cx, cy, scale, body, accent):
    unit = scale
    half = unit / 2
    thickness = unit * 0.085
    bar_w = unit * 0.13
    gap = unit * 0.075
    base = cy + half - thickness * 2.2
    total = bar_w * 3 + gap * 2
    start = cx - total / 2
    for i, h in enumerate([unit * 0.20, unit * 0.34, unit * 0.48]):
        x = start + i * (bar_w + gap)
        canvas.rounded_rect(
            x, base - h, x + bar_w, base, bar_w / 2, accent if i == 2 else body
        )


if __name__ == "__main__":
    build_icon()
    build_adaptive()
    build_splash()
