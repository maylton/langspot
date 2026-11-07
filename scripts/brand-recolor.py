#!/usr/bin/env python3
"""Recolours LangSpot's UI to the brand palette by colour family.

Palette (coolors.co/eac435-345995-03cea4-fb4d3d-ca1551):
  Dusk Blue #345995 primary · Saffron #eac435 accent/warning · Mint Leaf #03cea4 success
  Rosewood #ca1551 danger · Tomato #fb4d3d vivid alerts.
Slate neutrals (hue 195–235, low saturation) and greys are kept: they already match Dusk Blue.
Usage: recolor.py FILE... (rewrites in place, prints a summary).
"""
import colorsys
import re
import sys
from collections import Counter

DUSK_H, MINT_H, ROSE_H, TOMATO_H, SAFFRON_H, AMBER_H = 217, 168, 340, 5, 47, 40
# Lightness curve for the purple → Dusk Blue move: #7655f3 (L .64) must land on #345995 (L .39).
BLUE_L = [(0.0, 0.0), (0.28, 0.24), (0.64, 0.39), (0.76, 0.53), (0.90, 0.87), (1.0, 1.0)]


def interp(points, x):
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return x


def to_hex(h, l, s):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, max(0, min(1, l)), max(0, min(1, s)))
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))


EXACT = {'#7655f3': '#345995', '#684be1': '#2b4a7d', '#eeeaff': '#e8eef8', '#fff': '#fff', '#ffffff': '#ffffff'}


def family_map(rgb):
    r, g, b = (c / 255 for c in rgb)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h *= 360
    if s < 0.12:
        return None
    if 195 <= h < 236 and s < 0.45:          # slate neutrals: keep
        return None
    if 195 <= h < 305:                        # blue/indigo/violet/purple → Dusk Blue
        nl = interp(BLUE_L, l)
        cap = 0.6 if nl > 0.8 else 0.45 if nl < 0.25 else 0.52
        return to_hex(DUSK_H, nl, min(s, cap))
    if 85 <= h < 195:                         # green/teal → Mint Leaf
        return to_hex(MINT_H, l, s)
    if h >= 305 or h < 12:                    # red/pink → Rosewood (vivid light reds → Tomato)
        if s > 0.75 and 0.55 <= l <= 0.72:
            return to_hex(TOMATO_H, l, s)
        return to_hex(ROSE_H, l, s)
    if 12 <= h < 35:                          # orange → Tomato when vivid, else amber
        if s > 0.6 and 0.45 <= l <= 0.7:
            return to_hex(TOMATO_H, l, s)
        return to_hex(AMBER_H, l, s)
    return to_hex(SAFFRON_H, l, s)            # yellow → Saffron


def map_hex(value):
    low = value.lower()
    if low in EXACT:
        return EXACT[low]
    if len(low) == 4:
        low = '#' + ''.join(c * 2 for c in low[1:])
    rgb = tuple(int(low[i:i + 2], 16) for i in (1, 3, 5))
    return family_map(rgb) or value


HEX = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGBA = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)')

changes = Counter()
for path in sys.argv[1:]:
    text = open(path, encoding='utf-8').read()

    def sub_hex(match):
        new = map_hex(match.group(0))
        if new.lower() != match.group(0).lower():
            changes[(match.group(0).lower(), new)] += 1
        return new

    def sub_rgba(match):
        rgb = tuple(int(match.group(i)) for i in (1, 2, 3))
        new = family_map(rgb)
        if not new:
            return match.group(0)
        nr, ng, nb = (int(new[i:i + 2], 16) for i in (1, 3, 5))
        alpha = match.group(4) or ''
        out = f"rgba({nr},{ng},{nb}{alpha.replace(' ', '')})" if alpha else f"rgb({nr},{ng},{nb})"
        changes[(match.group(0), out)] += 1
        return out

    new_text = RGBA.sub(sub_rgba, HEX.sub(sub_hex, text))
    if new_text != text:
        open(path, 'w', encoding='utf-8').write(new_text)

print(f'{sum(changes.values())} replacements, {len(changes)} distinct')
for (old, new), n in changes.most_common(25):
    print(f'  {old:>28} → {new}  ×{n}')
