#!/usr/bin/env python3
"""Генератор вертолётной базы спасения: SVG + PDF для печати на A4.

Запуск:  python3 build.py
Результат в ./out/
"""
import math
import os
import random
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
OUT.mkdir(exist_ok=True)

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT = "'PT Sans','Helvetica Neue',Arial,sans-serif"

# ---------- Сетка печати ----------
# A4 210x297, поля 8 мм -> область печати 194x281, нахлёст 10 мм
MARGIN = 8
TW, TH = 194, 281
OV = 10
SX, SY = TW - OV, TH - OV
COLS, ROWS = 4, 3
W = (COLS - 1) * SX + TW  # 746
H = (ROWS - 1) * SY + TH  # 823
COL_NAMES = "ABCD"

# ---------- Палитра базы (сдержанная) ----------
GRASS = "#dde6c8"
GRASS_LIGHT = "#e5ecd3"
GRASS_DARK = "#cbd8b0"
TREE = "#a9c08a"
TREE_DARK = "#8fa872"
ROAD = "#dcd7ce"
ROAD_EDGE = "#c4beb3"
WATER = "#bfdbe6"
WATER_EDGE = "#9fc4d3"
INK = "#5a5560"
PAD = "#ecd5dc"
PAD_EDGE = "#c993a3"


# ================= Иконки (поле 0..100) =================
def ic_flame():
    return (
        '<path d="M50 4 C60 22 84 36 82 62 C80 84 66 96 50 96 C34 96 18 84 18 62 C18 46 28 38 34 22 '
        'C40 32 44 36 47 40 C50 28 52 16 50 4Z" fill="#f05a28"/>'
        '<path d="M50 34 C58 48 72 56 70 72 C69 86 60 92 50 92 C40 92 31 86 31 74 C31 64 38 58 42 50 '
        'C45 56 47 58 49 60 C51 52 52 44 50 34Z" fill="#ff9f1c"/>'
        '<path d="M50 62 C55 70 60 74 59 80 C58 86 54 89 50 89 C46 89 42 86 42 80 C42 74 47 70 50 62Z" fill="#ffd23f"/>'
    )


def ic_drop():
    return (
        '<path d="M50 6 C50 6 18 46 18 64 A32 32 0 0 0 82 64 C82 46 50 6 50 6Z" fill="#339af0"/>'
        '<ellipse cx="37" cy="64" rx="6" ry="11" fill="#fff" opacity=".6"/>'
    )


def ic_cross(color="#e5484d"):
    return (
        f'<rect x="35" y="10" width="30" height="80" rx="4" fill="{color}"/>'
        f'<rect x="10" y="35" width="80" height="30" rx="4" fill="{color}"/>'
    )


def ic_medkit():
    return (
        '<path d="M36 26 V18 a7 7 0 0 1 7-7 h14 a7 7 0 0 1 7 7 V26" stroke="#a61e24" stroke-width="6" fill="none"/>'
        '<rect x="8" y="24" width="84" height="66" rx="10" fill="#e5484d"/>'
        '<rect x="42" y="38" width="16" height="38" rx="2" fill="#fff"/>'
        '<rect x="31" y="49" width="38" height="16" rx="2" fill="#fff"/>'
    )


def ic_rope():
    c = "#c4874f"
    return (
        f'<circle cx="42" cy="58" r="32" stroke="{c}" stroke-width="7" fill="none"/>'
        f'<circle cx="42" cy="58" r="21" stroke="{c}" stroke-width="7" fill="none"/>'
        f'<circle cx="42" cy="58" r="10" stroke="{c}" stroke-width="7" fill="none"/>'
        f'<path d="M74 58 V22" stroke="{c}" stroke-width="7"/>'
        '<path d="M74 22 C74 8 94 8 94 20 C94 30 84 32 82 26" stroke="#6c757d" stroke-width="6" '
        'fill="none" stroke-linecap="round"/>'
    )


def ic_lifebuoy():
    seg = 2 * math.pi * 32 / 8
    return (
        '<circle cx="50" cy="50" r="32" stroke="#fff" stroke-width="22" fill="none"/>'
        f'<circle cx="50" cy="50" r="32" stroke="#e5484d" stroke-width="22" fill="none" '
        f'stroke-dasharray="{seg:.2f} {seg:.2f}"/>'
        '<circle cx="50" cy="50" r="43" stroke="#9b1c1c" stroke-width="2" fill="none"/>'
        '<circle cx="50" cy="50" r="21" stroke="#9b1c1c" stroke-width="2" fill="none"/>'
    )


def ic_sprout():
    return (
        '<ellipse cx="50" cy="86" rx="36" ry="10" fill="#8b5e3c"/>'
        '<path d="M50 86 V46" stroke="#2f9e44" stroke-width="6"/>'
        '<path d="M50 58 C30 60 16 46 18 30 C36 28 50 40 50 58Z" fill="#51cf66"/>'
        '<path d="M50 48 C66 50 82 36 80 20 C62 18 50 30 50 48Z" fill="#40c057"/>'
        '<ellipse cx="30" cy="84" rx="4" ry="3" fill="#f2d49b"/>'
        '<ellipse cx="68" cy="85" rx="4" ry="3" fill="#f2d49b"/>'
    )


def ic_flashlight():
    return (
        '<polygon points="56,36 98,12 98,88 56,64" fill="#ffe066" opacity=".85"/>'
        '<polygon points="38,32 58,27 58,73 38,68" fill="#495057"/>'
        '<rect x="4" y="38" width="36" height="24" rx="6" fill="#f59f00"/>'
        '<rect x="16" y="33" width="10" height="6" rx="2" fill="#495057"/>'
    )


def ic_wrench(bg):
    return (
        '<path d="M22 80 L58 44" stroke="#868e96" stroke-width="15" stroke-linecap="round"/>'
        '<circle cx="64" cy="36" r="22" fill="#868e96"/>'
        f'<circle cx="75" cy="25" r="11" fill="{bg}"/>'
    )


def ic_pump():
    return (
        '<rect x="18" y="18" width="44" height="70" rx="6" fill="#f08c00"/>'
        '<rect x="26" y="27" width="28" height="18" rx="3" fill="#fff3bf"/>'
        '<rect x="12" y="86" width="56" height="8" rx="2" fill="#495057"/>'
        '<path d="M62 40 H74 a8 8 0 0 1 8 8 V68" stroke="#495057" stroke-width="5" fill="none"/>'
        '<rect x="76" y="64" width="12" height="18" rx="3" fill="#495057"/>'
    )


def ic_radio():
    c = "#7048e8"
    return (
        f'<path d="M50 32 L30 94 M50 32 L70 94 M38 68 H62 M34 82 H66" stroke="{c}" stroke-width="5" '
        'stroke-linecap="round" fill="none"/>'
        f'<circle cx="50" cy="26" r="7" fill="{c}"/>'
        f'<path d="M30 10 A24 24 0 0 0 30 42 M70 10 A24 24 0 0 1 70 42 M39 17 A13 13 0 0 0 39 35 '
        f'M61 17 A13 13 0 0 1 61 35" stroke="{c}" stroke-width="4" fill="none" stroke-linecap="round"/>'
    )


def star_points(cx, cy, r_out, r_in, n=5):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = -math.pi / 2 + i * math.pi / n
        pts.append(f"{cx + r * math.cos(a):.2f},{cy + r * math.sin(a):.2f}")
    return " ".join(pts)


def ic_star(fill="#ffd43b", stroke="#e8a400"):
    return f'<polygon points="{star_points(50, 52, 46, 19)}" fill="{fill}" stroke="{stroke}" stroke-width="3" stroke-linejoin="round"/>'


def ic_tree():
    return (
        '<rect x="44" y="60" width="12" height="34" rx="2" fill="#8b5e3c"/>'
        '<circle cx="50" cy="40" r="30" fill="#40c057"/>'
        '<circle cx="30" cy="54" r="18" fill="#37b24d"/>'
        '<circle cx="70" cy="54" r="18" fill="#37b24d"/>'
    )


def ic_mountain():
    return (
        '<polygon points="2,94 38,26 74,94" fill="#868e96"/>'
        '<polygon points="40,94 68,44 98,94" fill="#adb5bd"/>'
        '<polygon points="38,26 27.2,47 33,43 39,49 45,43 48.8,47" fill="#fff"/>'
    )


def ic_bunny():
    return (
        '<ellipse cx="37" cy="26" rx="8" ry="20" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>'
        '<ellipse cx="63" cy="26" rx="8" ry="20" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>'
        '<ellipse cx="37" cy="28" rx="3.5" ry="13" fill="#ffc9d6"/>'
        '<ellipse cx="63" cy="28" rx="3.5" ry="13" fill="#ffc9d6"/>'
        '<circle cx="50" cy="62" r="28" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>'
        '<circle cx="40" cy="57" r="4" fill="#333"/><circle cx="60" cy="57" r="4" fill="#333"/>'
        '<circle cx="50" cy="67" r="3.5" fill="#ff8fab"/>'
        '<circle cx="33" cy="70" r="5" fill="#ffc9d6" opacity=".7"/>'
        '<circle cx="67" cy="70" r="5" fill="#ffc9d6" opacity=".7"/>'
    )


def ic_moon(bg):
    return f'<circle cx="46" cy="52" r="34" fill="#ffe066"/><circle cx="62" cy="40" r="30" fill="{bg}"/>'


def ic_waves(color="#1c7ed6"):
    return "".join(
        f'<path d="M2 {y} q12 -12 24 0 t24 0 t24 0 t24 0" stroke="{color}" stroke-width="6" '
        'fill="none" stroke-linecap="round"/>' for y in (36, 58, 80)
    )


def ic_sun():
    rays = "".join(
        f'<line x1="{50 + 30 * math.cos(a):.1f}" y1="{50 + 30 * math.sin(a):.1f}" '
        f'x2="{50 + 44 * math.cos(a):.1f}" y2="{50 + 44 * math.sin(a):.1f}" stroke="#fab005" '
        'stroke-width="6" stroke-linecap="round"/>'
        for a in [i * math.pi / 4 for i in range(8)]
    )
    return rays + '<circle cx="50" cy="50" r="22" fill="#ffd43b"/>'


def ic_flower_wilted():
    petals = "".join(
        f'<ellipse cx="70" cy="62" rx="7" ry="13" fill="#c9b28a" transform="rotate({a} 70 62) translate(0 12)"/>'
        for a in (0, 60, 120, 180, 240, 300)
    )
    return (
        '<path d="M44 96 C44 72 50 52 68 50" stroke="#a9a26a" stroke-width="5" fill="none"/>'
        '<path d="M45 80 C34 80 26 86 22 94 C34 94 42 90 45 80Z" fill="#b8b07a"/>'
        + petals + '<circle cx="70" cy="62" r="8" fill="#8d7b5a"/>'
    )


def ic_flower_bloom():
    petals = "".join(
        f'<ellipse cx="50" cy="34" rx="9" ry="15" fill="#ff6b9a" transform="rotate({a} 50 34) translate(0 -14)"/>'
        for a in (0, 60, 120, 180, 240, 300)
    )
    return (
        '<path d="M50 96 V44" stroke="#2f9e44" stroke-width="5"/>'
        '<path d="M50 74 C36 72 26 78 22 88 C36 90 46 84 50 74Z" fill="#40c057"/>'
        '<path d="M50 66 C64 64 74 70 78 80 C64 82 54 76 50 66Z" fill="#51cf66"/>'
        + petals + '<circle cx="50" cy="34" r="10" fill="#ffd43b"/>'
    )


def place(icon, x, y, size, opacity=1.0, extra=""):
    op = f' opacity="{opacity}"' if opacity != 1.0 else ""
    return f'<g transform="translate({x:.2f},{y:.2f}) scale({size / 100:.4f})"{op}{extra}>{icon}</g>'


def text(x, y, s, size, fill=INK, anchor="middle", weight="bold", extra=""):
    return (
        f'<text x="{x:.2f}" y="{y:.2f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
        f'fill="{fill}" text-anchor="{anchor}"{extra}>{s}</text>'
    )


EQUIPMENT = [
    # key, label, icon, цвет
    ("water", "Вода", ic_drop(), "#339af0"),
    ("rope", "Трос", ic_rope(), "#c4874f"),
    ("medkit", "Аптечка", ic_medkit(), "#e5484d"),
    ("buoy", "Спасательный круг", ic_lifebuoy(), "#e5484d"),
    ("seeds", "Семена", ic_sprout(), "#40c057"),
    ("light", "Прожектор", ic_flashlight(), "#f59f00"),
]
EQ = {k: (label, icon, color) for k, label, icon, color in EQUIPMENT}


# ================= База =================
C = (373, 420)
RING_R, ROAD_W = 178, 38

BUILDINGS = {
    "fire": dict(x=24, y=40, w=208, h=168, fill="#efd3c7", stroke="#d29c88", label="Пожарная часть", door=(180, 208)),
    "hospital": dict(x=514, y=40, w=208, h=168, fill="#edf3f0", stroke="#a9c7bb", label="Больница", door=(566, 208)),
    "tower": dict(x=318, y=26, w=110, h=104, fill="#e0d8ea", stroke="#ab9dc4", label="Диспетчер", door=(373, 130)),
    "hangar": dict(x=24, y=612, w=232, h=192, fill="#d7dee5", stroke="#9fb0bf", label="Ангар · ремонт", door=(200, 612)),
    "store": dict(x=490, y=628, w=232, h=176, fill="#ede1c8", stroke="#c8b086", label="Склад оборудования", door=(546, 628)),
    "fuel": dict(x=604, y=350, w=118, h=140, fill="#f1e6c0", stroke="#cdb46a", label="Заправка", door=(604, 420)),
}


def foundation(b, studs=True):
    x, y, w, h = b["x"], b["y"], b["w"], b["h"]
    s = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{b["fill"]}" stroke="{b["stroke"]}" stroke-width="2.5"/>'
    ]
    if studs:
        s.append(f'<rect x="{x + 5}" y="{y + 5}" width="{w - 10}" height="{h - 10}" rx="4" fill="url(#studs)"/>')
    # табличка с названием
    lw = min(w - 16, len(b["label"]) * 6.4 + 16)
    s.append(
        f'<rect x="{x + w / 2 - lw / 2:.1f}" y="{y + 7}" width="{lw:.1f}" height="17" rx="8.5" '
        f'fill="#fff" fill-opacity=".85" stroke="{b["stroke"]}" stroke-width="1.2"/>'
    )
    s.append(text(x + w / 2, y + 19.5, b["label"], 11))
    return "".join(s)


def tree(x, y, r):
    return (
        f'<circle cx="{x + r * 0.15:.1f}" cy="{y + r * 0.2:.1f}" r="{r}" fill="{TREE_DARK}" opacity=".55"/>'
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="{TREE}"/>'
        f'<circle cx="{x - r * 0.3:.1f}" cy="{y - r * 0.3:.1f}" r="{r * 0.35:.1f}" fill="#bdd09f"/>'
    )


def base_body():
    rnd = random.Random(7)
    s = []
    s.append(
        '<defs><pattern id="studs" width="8" height="8" patternUnits="userSpaceOnUse">'
        '<circle cx="4" cy="4" r="1.4" fill="#000" fill-opacity=".07"/></pattern>'
        f'<path id="padArc" d="M{C[0] - 145} {C[1]} A145 145 0 0 1 {C[0] + 145} {C[1]}"/>'
        f'<path id="padArcBottom" d="M{C[0] - 149} {C[1]} A149 149 0 0 0 {C[0] + 149} {C[1]}"/>'
        '</defs>'
    )
    # трава
    s.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{GRASS}"/>')
    for _ in range(26):
        s.append(
            f'<ellipse cx="{rnd.uniform(0, W):.0f}" cy="{rnd.uniform(0, H):.0f}" rx="{rnd.uniform(30, 70):.0f}" '
            f'ry="{rnd.uniform(20, 45):.0f}" fill="{GRASS_LIGHT}"/>'
        )
    for _ in range(90):
        tx, ty = rnd.uniform(5, W - 5), rnd.uniform(5, H - 5)
        s.append(
            f'<path d="M{tx - 3:.1f} {ty:.1f} l1.5 -4 M{tx:.1f} {ty:.1f} l0 -5 M{tx + 3:.1f} {ty:.1f} l-1.5 -4" '
            f'stroke="{GRASS_DARK}" stroke-width="1" stroke-linecap="round"/>'
        )

    # дороги: края -> заливка -> разметка
    spokes = [b["door"] for b in BUILDINGS.values()]
    for d in spokes:
        s.append(f'<line x1="{C[0]}" y1="{C[1]}" x2="{d[0]}" y2="{d[1]}" stroke="{ROAD_EDGE}" stroke-width="{ROAD_W + 5}"/>')
    s.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="{RING_R}" fill="none" stroke="{ROAD_EDGE}" stroke-width="{ROAD_W + 5}"/>')
    for d in spokes:
        s.append(f'<line x1="{C[0]}" y1="{C[1]}" x2="{d[0]}" y2="{d[1]}" stroke="{ROAD}" stroke-width="{ROAD_W}"/>')
    s.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="{RING_R}" fill="none" stroke="{ROAD}" stroke-width="{ROAD_W}"/>')
    s.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="{RING_R}" fill="none" stroke="#fff" stroke-width="1.8" stroke-dasharray="9 8"/>')
    edge = RING_R + ROAD_W / 2 + 3
    for d in spokes:
        dx, dy = d[0] - C[0], d[1] - C[1]
        L = math.hypot(dx, dy)
        sx, sy = C[0] + dx / L * edge, C[1] + dy / L * edge
        s.append(
            f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{d[0]}" y2="{d[1]}" stroke="#fff" stroke-width="1.8" stroke-dasharray="9 8"/>'
        )

    # островок с площадкой
    island_r = RING_R - ROAD_W / 2 - 2.5
    s.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="{island_r}" fill="{GRASS}" stroke="{ROAD_EDGE}" stroke-width="1.5"/>')
    for i in range(16):
        a = i * math.pi / 8 + math.pi / 16
        fx, fy = C[0] + 149 * math.cos(a), C[1] + 149 * math.sin(a)
        if math.sin(a) > 0.2:  # только снизу, сверху надпись
            s.append(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="2.6" fill="#f3c6d3"/><circle cx="{fx:.1f}" cy="{fy:.1f}" r="1" fill="#f7e08a"/>')
    s.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="132" fill="{PAD}" stroke="{PAD_EDGE}" stroke-width="3"/>')
    s.append(f'<circle cx="{C[0]}" cy="{C[1]}" r="117" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="11 8"/>')
    for i in range(12):
        a = i * math.pi / 6
        lx, ly = C[0] + 125 * math.cos(a), C[1] + 125 * math.sin(a)
        s.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="3.2" fill="#f6e7aa" stroke="#cdb46a" stroke-width="1"/>')
    hp = [(-43, -50), (-24, -50), (-24, -9), (24, -9), (24, -50), (43, -50), (43, 50), (24, 50), (24, 9), (-24, 9), (-24, 50), (-43, 50)]
    s.append(
        '<polygon points="' + " ".join(f"{C[0] + px},{C[1] + py}" for px, py in hp)
        + f'" fill="#fff" stroke="{PAD_EDGE}" stroke-width="2.2" stroke-linejoin="round"/>'
    )
    s.append(
        f'<text font-family="{FONT}" font-size="14" font-weight="bold" fill="#9c7484" letter-spacing="3">'
        '<textPath href="#padArc" startOffset="50%" text-anchor="middle">БАЗА СПАСЕНИЯ</textPath></text>'
    )

    # озеро
    lx, ly = 92, 420
    s.append(f'<ellipse cx="{lx}" cy="{ly}" rx="70" ry="112" fill="{WATER}" stroke="{WATER_EDGE}" stroke-width="3"/>')
    s.append(f'<ellipse cx="{lx - 8}" cy="{ly - 10}" rx="48" ry="84" fill="#cde4ec"/>')
    for wy in (360, 400, 470):
        s.append(f'<path d="M{lx - 30} {wy} q7 -6 14 0 t14 0 t14 0" stroke="#9fc4d3" stroke-width="2" fill="none"/>')
    s.append(f'<rect x="150" y="{ly - 9}" width="26" height="18" fill="#cfb08a" stroke="#a88a64" stroke-width="1.5"/>')
    for px in (156, 163, 170):
        s.append(f'<line x1="{px}" y1="{ly - 9}" x2="{px}" y2="{ly + 9}" stroke="#a88a64" stroke-width="1"/>')
    s.append(place(ic_drop(), lx - 22, ly - 8, 44, 0.45))
    s.append(f'<rect x="{lx - 28}" y="{ly + 40}" width="56" height="17" rx="8.5" fill="#fff" fill-opacity=".85" stroke="{WATER_EDGE}" stroke-width="1.2"/>')
    s.append(text(lx, ly + 52.5, "Озеро", 11))

    # здания
    b = BUILDINGS
    s.append(foundation(b["fire"]))
    s.append(place(ic_flame(), b["fire"]["x"] + 64, b["fire"]["y"] + 40, 80, 0.4))
    s.append(foundation(b["hospital"]))
    hx, hy = b["hospital"]["x"], b["hospital"]["y"]
    s.append(place(ic_cross("#d9776f"), hx + 18, hy + 52, 70, 0.6))
    for i in range(2):
        bx = hx + 104 + i * 52
        s.append(f'<rect x="{bx}" y="{hy + 46}" width="42" height="96" rx="5" fill="#fff" stroke="#a9c7bb" stroke-width="1.8"/>')
        s.append(f'<rect x="{bx + 6}" y="{hy + 52}" width="30" height="16" rx="5" fill="#e6f0ec" stroke="#a9c7bb" stroke-width="1.2"/>')
        s.append(f'<rect x="{bx + 3}" y="{hy + 78}" width="36" height="60" rx="4" fill="#cfe3f0"/>')
    s.append(foundation(b["tower"]))
    s.append(place(ic_radio(), b["tower"]["x"] + 25, b["tower"]["y"] + 30, 62, 0.5))
    s.append(foundation(b["fuel"]))
    s.append(place(ic_pump(), b["fuel"]["x"] + 22, b["fuel"]["y"] + 40, 76, 0.45))
    # ангар со стоянкой
    g = b["hangar"]
    s.append(foundation(g))
    s.append(
        f'<rect x="{g["x"] + 36}" y="{g["y"] + 30}" width="160" height="154" rx="8" fill="#fff" fill-opacity=".35" '
        f'stroke="#9fb0bf" stroke-width="2" stroke-dasharray="7 5"/>'
    )
    s.append(place(ic_wrench(g["fill"]), g["x"] + 76, g["y"] + 67, 80, 0.45))
    # склад с ячейками
    st = b["store"]
    s.append(foundation(st))
    cell, gap = 58, 12
    ox = st["x"] + (st["w"] - (3 * cell + 2 * gap)) / 2
    oy = st["y"] + 34
    for i, (k, label, icon, color) in enumerate(EQUIPMENT):
        cx_, cy_ = ox + (i % 3) * (cell + gap), oy + (i // 3) * (cell + gap)
        s.append(
            f'<rect x="{cx_:.1f}" y="{cy_:.1f}" width="{cell}" height="{cell}" rx="7" fill="#fff" fill-opacity=".75" '
            f'stroke="{st["stroke"]}" stroke-width="1.8" stroke-dasharray="5 3"/>'
        )
        s.append(place(icon, cx_ + 11, cy_ + 9, 36, 0.4))
    # доска героя
    hb = dict(x=262, y=648, w=222, h=156, fill="#f5ecd6", stroke="#d9c28a", label="Доска героя")
    s.append(foundation(hb, studs=False))
    medal_pos = [(-66, 0), (0, 0), (66, 0), (-33, 62), (33, 62)]
    for dx, dy in medal_pos:
        mx, my = hb["x"] + hb["w"] / 2 + dx, hb["y"] + 62 + dy
        s.append(f'<circle cx="{mx}" cy="{my}" r="27" fill="#fff" fill-opacity=".6" stroke="#d9c28a" stroke-width="2" stroke-dasharray="5 4"/>')
        s.append(place(ic_star("#f3e3b0", "#e2cd8c"), mx - 13, my - 13, 26, 0.8))

    # деревья
    trees = [
        (262, 52, 17), (285, 108, 13), (464, 108, 13), (488, 52, 17), (300, 158, 11), (446, 158, 11),
        (40, 246, 18), (86, 236, 13), (150, 262, 15), (612, 250, 16), (660, 240, 13), (712, 268, 15),
        (34, 566, 15), (78, 580, 12), (138, 566, 17), (632, 540, 15), (690, 556, 18), (590, 590, 11),
        (708, 312, 11), (530, 566, 10), (230, 570, 10), (250, 254, 9),
    ]
    for t in trees:
        s.append(tree(*t))
    return "".join(s)


def base_svg_standalone(body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">{body}</svg>'
    )


# ================= Страницы печати базы =================
PAGE_CSS = """
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: %s; color: #333; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
.content { position: absolute; left: 8mm; top: 8mm; width: 194mm; height: 281mm; }
.m { position: absolute; font-size: 2.6mm; color: #888; white-space: nowrap; }
""" % FONT


def tile_page(c, r):
    x0, y0 = c * SX, r * SY
    pid = f"{COL_NAMES[c]}{r + 1}"
    guides = []
    if c < COLS - 1:
        gx = x0 + SX
        guides.append(f'<line x1="{gx}" y1="{y0}" x2="{gx}" y2="{y0 + TH}" stroke="#555" stroke-width=".35" stroke-dasharray="2 1.5"/>')
        for yy in (y0 + 30, y0 + TH / 2, y0 + TH - 30):
            guides.append(f'<polygon points="{gx + 1},{yy} {gx + 5},{yy - 3} {gx + 5},{yy + 3}" fill="#555"/>')
    if r < ROWS - 1:
        gy = y0 + SY
        guides.append(f'<line x1="{x0}" y1="{gy}" x2="{x0 + TW}" y2="{gy}" stroke="#555" stroke-width=".35" stroke-dasharray="2 1.5"/>')
        for xx in (x0 + 30, x0 + TW / 2, x0 + TW - 30):
            guides.append(f'<polygon points="{xx},{gy + 1} {xx - 3},{gy + 5} {xx + 3},{gy + 5}" fill="#555"/>')
    marks = []
    if c > 0:
        marks.append(
            '<div class="m" style="left:2.5mm;top:148mm;transform:rotate(-90deg);transform-origin:left top;">'
            "✂ отрезать белое поле по краю картинки</div>"
        )
    if r > 0:
        marks.append('<div class="m" style="left:60mm;top:3mm;">✂ отрезать белое поле по краю картинки</div>')
    right = f"← {COL_NAMES[c + 1]}{r + 1} ложится сюда до пунктира" if c < COLS - 1 else ""
    below = f"↑ {COL_NAMES[c]}{r + 2} ложится до пунктира" if r < ROWS - 1 else ""
    marks.append(
        f'<div class="m" style="left:8mm;top:290.5mm;"><b style="color:#333;font-size:3.4mm">{pid}</b>'
        f'&nbsp;&nbsp;колонка {COL_NAMES[c]}, ряд {r + 1}&nbsp;&nbsp;&nbsp;{below}&nbsp;&nbsp;&nbsp;{right}</div>'
    )
    return (
        '<div class="page">'
        f'<svg class="content" viewBox="{x0} {y0} {TW} {TH}" width="194mm" height="281mm">'
        f'<use href="#base"/>{"".join(guides)}</svg>{"".join(marks)}</div>'
    )


def back_page(c, r):
    """Оборот листа (для двусторонней печати с переворотом по длинному краю).
    Лист лицом вниз виден зеркально по горизонтали, поэтому мини-карта зеркальная."""
    pid = f"{COL_NAMES[c]}{r + 1}"
    cw, ch, gap = 24, 33, 3
    gw = COLS * cw + (COLS - 1) * gap
    cells = []
    for rr in range(ROWS):
        for cc in range(COLS):
            mc = COLS - 1 - cc  # зеркально
            x = mc * (cw + gap)
            y = rr * (ch + gap)
            on = cc == c and rr == r
            cells.append(
                f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" rx="2" fill="{"#c993a3" if on else "#f1f1f1"}" '
                f'stroke="#999" stroke-width=".4"/>'
                f'<text x="{x + cw / 2}" y="{y + ch / 2 + 2.5}" font-size="7" font-weight="bold" text-anchor="middle" '
                f'font-family="{FONT}" fill="{"#fff" if on else "#999"}">{COL_NAMES[cc]}{rr + 1}</text>'
            )
    gh = ROWS * ch + (ROWS - 1) * gap
    return (
        '<div class="page"><div class="content" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8mm">'
        f'<div style="font-size:70mm;font-weight:bold;color:#e3c3cd;line-height:1">{pid}</div>'
        f'<svg width="{gw}mm" height="{gh}mm" viewBox="0 0 {gw} {gh}">{"".join(cells)}</svg>'
        '<div style="font-size:4mm;color:#777;text-align:center">Листы лежат <b>лицом вниз</b> — вот так.<br>'
        '↑ верх базы (пожарная часть, больница)</div></div></div>'
    )


# ================= Жетоны =================
def card_mission(x, y, n, title, color, where, scene, take):
    w, h = 92, 88
    s = [f'<g transform="translate({x},{y})">']
    s.append(f'<rect x="0" y="0" width="{w}" height="{h}" rx="5" fill="{color}"/>')
    s.append(f'<circle cx="9" cy="8.5" r="5.5" fill="#fff"/>')
    s.append(text(9, 10.8, str(n), 6.5, fill=color))
    s.append(text(17, 10.8, title, 6, fill="#fff", anchor="start"))
    s.append(f'<rect x="4" y="16" width="84" height="48" rx="3" fill="{scene[0]}"/>')
    s.append(f'<g transform="translate(4,16)">{scene[1]}</g>')
    s.append(text(86, 62, f"где: {where}", 3.2, fill="#666" if scene[0] != "#22305a" else "#c9d3f0", anchor="end", weight="normal"))
    if take:
        s.append(text(5, 78, "ВОЗЬМИ:", 4.2, fill="#fff", anchor="start"))
        for i, k in enumerate(take):
            cx_ = 36 + i * 22
            s.append(f'<circle cx="{cx_}" cy="76" r="9.5" fill="#fff"/>')
            s.append(place(EQ[k][1], cx_ - 7, 69, 14))
    s.append("</g>")
    return "".join(s)


def scenes():
    fire = (
        "#fff8e6",
        place(ic_tree(), 2, 4, 40) + place(ic_tree(), 26, 0, 46) + place(ic_tree(), 54, 6, 38)
        + place(ic_flame(), 12, 6, 20) + place(ic_flame(), 40, 2, 22) + place(ic_flame(), 64, 10, 18),
    )
    mountain = (
        "#e7f5ff",
        place(ic_mountain(), 12, 0, 48) + place(ic_bunny(), 26, -2, 17)
        + text(70, 18, "SOS!", 8, fill="#e5484d"),
    )
    garden = (
        "#fff9db",
        place(ic_sun(), 62, 1, 20) + place(ic_flower_wilted(), 0, 14, 32) + place(ic_flower_wilted(), 22, 16, 30)
        + place(ic_flower_wilted(), 44, 18, 28),
    )
    sea = (
        "#d0ebff",
        place(ic_bunny(), 34, 2, 22) + place(ic_waves(), 4, 10, 37) + place(ic_waves(), 41, 10, 37)
        + text(14, 12, "Помогите!", 4.5, fill="#1c7ed6", anchor="start"),
    )
    night = (
        "#22305a",
        place(ic_moon("#22305a"), 4, 2, 26)
        + "".join(place(ic_star("#ffe066", "#ffe066"), sx, sy, 7) for sx, sy in ((36, 6), (52, 14), (70, 4), (44, 30)))
        + place(ic_bunny(), 62, 22, 18, 0.35),
    )
    own = ("#f8f9fa", text(42, 28, "?", 22, fill="#ced4da") + text(42, 42, "нарисуй свою миссию", 3.6, fill="#adb5bd", weight="normal"))
    return fire, mountain, garden, sea, night, own


MISSIONS = [
    (1, "ПОЖАР В ЛЕСУ", "#f03e3e", "обеденный стол", ["water"]),
    (2, "СПАСЕНИЕ В ГОРАХ", "#7048e8", "диван", ["rope", "medkit"]),
    (3, "ЗАСУХА В САДУ", "#37b24d", "кухня", ["seeds", "water"]),
    (4, "СПАСЕНИЕ НА ВОДЕ", "#1c7ed6", "детская", ["buoy"]),
    (5, "НОЧНАЯ МИССИЯ", "#364fc7", "ванная", ["light"]),
    (6, "СВОЯ МИССИЯ", "#868e96", "", []),
]


def tokens_page_missions():
    sc = scenes()
    s = []
    for i, (n, title, color, where, take) in enumerate(MISSIONS):
        x = (i % 2) * 102
        y = (i // 2) * 94
        s.append(card_mission(x, y, n, title, color, where if where else "…", sc[i], take))
    return s


def tokens_page_equipment():
    s = [text(0, 6, "Оборудование — кладётся на склад, в ячейку с такой же картинкой", 4.5, anchor="start", fill="#555")]
    size = 52
    for i, (k, label, icon, color) in enumerate(EQUIPMENT):
        x = (i % 3) * 66 + 4
        y = 12 + (i // 3) * 64
        s.append(f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="7" fill="{color}" fill-opacity=".16" stroke="{color}" stroke-width="1.6"/>')
        s.append(place(icon, x + 9, y + 4, 34))
        s.append(text(x + size / 2, y + 47, label, 4.6 if len(label) < 12 else 3.6, fill="#333"))
    s.append(text(0, 152, "Медали — после миссии на «Доску героя»", 4.5, anchor="start", fill="#555"))
    medals = [
        ("#f03e3e", ic_flame()), ("#7048e8", ic_mountain()), ("#37b24d", ic_sprout()),
        ("#1c7ed6", ic_lifebuoy()), ("#364fc7", ic_flashlight()),
    ]
    for i, (color, icon) in enumerate(medals):
        cx_ = 32 + (i % 3) * 66 if i < 3 else 65 + (i - 3) * 66
        cy_ = 186 if i < 3 else 245
        s.append(f'<circle cx="{cx_}" cy="{cy_}" r="25" fill="#ffd43b" stroke="#e8a400" stroke-width="1.6"/>')
        s.append(f'<circle cx="{cx_}" cy="{cy_}" r="20" fill="{color}"/>')
        s.append(f'<circle cx="{cx_}" cy="{cy_}" r="15" fill="#fff"/>')
        s.append(place(icon, cx_ - 11, cy_ - 11, 22))
        for a in (-50, 0, 50):
            sx = cx_ + 22.5 * math.sin(math.radians(a))
            sy = cy_ - 22.5 * math.cos(math.radians(a))
            s.append(place(ic_star("#fff", "#e8a400"), sx - 3, sy - 3, 6))
    return s


def tokens_page_flames_flowers():
    s = [text(0, 6, "Огоньки: нижнюю полоску загнуть назад — огонёк стоит. Потушил — забрал на базу.", 4.2, anchor="start", fill="#555")]
    for i in range(6):
        x = (i % 3) * 66 + 6
        y = 12 + (i // 3) * 76
        s.append(f'<rect x="{x}" y="{y}" width="50" height="70" rx="4" fill="#fff4e0" stroke="#f08c00" stroke-width="1.2"/>')
        s.append(place(ic_flame(), x + 3, y + 3, 44))
        s.append(f'<line x1="{x}" y1="{y + 54}" x2="{x + 50}" y2="{y + 54}" stroke="#999" stroke-width=".5" stroke-dasharray="2 1.5"/>')
        s.append(text(x + 25, y + 63, "загнуть", 3.6, fill="#c08a3a", weight="normal"))
    s.append(text(0, 176, "Сад: увядшие цветы. Полил — заменил на цветущий.", 4.2, anchor="start", fill="#555"))
    for i in range(8):
        bloom = i >= 4
        x = (i % 4) * 49 + 2
        y = 182 + (i // 4) * 50
        s.append(
            f'<rect x="{x}" y="{y}" width="44" height="46" rx="4" fill="{"#ebfbee" if bloom else "#f1ebe0"}" '
            f'stroke="{"#40c057" if bloom else "#b8a68a"}" stroke-width="1.2"/>'
        )
        s.append(place(ic_flower_bloom() if bloom else ic_flower_wilted(), x + 4, y + 3, 40))
    return s


def tent(x, y, label, icon, color):
    w, half = 88, 36
    face = lambda: (
        f'<rect x="0" y="0" width="{w}" height="{half}" fill="{color}" fill-opacity=".18"/>'
        + place(icon, 4, 4, 28) + text(36, 21, label, 6.2 if len(label) < 11 else 5, anchor="start", fill="#333")
    )
    return (
        f'<g transform="translate({x},{y})">'
        f'<g transform="rotate(180 {w / 2} {half / 2})">{face()}</g>'
        f'<g transform="translate(0,{half})">{face()}</g>'
        f'<rect x="0" y="0" width="{w}" height="{2 * half}" rx="2" fill="none" stroke="{color}" stroke-width="1.2"/>'
        f'<line x1="0" y1="{half}" x2="{w}" y2="{half}" stroke="#999" stroke-width=".5" stroke-dasharray="2 1.5"/>'
        "</g>"
    )


def tokens_page_signs():
    s = [text(0, 6, "Таблички на лего-здания: согнуть по пунктиру домиком.", 4.2, anchor="start", fill="#555")]
    signs = [
        ("Пожарная часть", ic_flame(), "#f03e3e"),
        ("Больница", ic_cross(), "#e5484d"),
        ("Ангар", ic_wrench("#fff"), "#868e96"),
        ("Склад", ic_medkit(), "#c8a24a"),
        ("Диспетчер", ic_radio(), "#7048e8"),
        ("Заправка", ic_pump(), "#f08c00"),
    ]
    for i, (label, icon, color) in enumerate(signs):
        x = (i % 2) * 100 + 2
        y = 14 + (i // 2) * 84
        s.append(tent(x, y, label, icon, color))
    return s


def svg_page(parts):
    return (
        '<div class="page"><svg class="content" viewBox="0 0 194 281" width="194mm" height="281mm">'
        + "".join(parts) + "</svg></div>"
    )


# ================= Шпаргалка =================
CHEAT = """
<div class="page"><div class="content" style="font-size:3.5mm;line-height:1.38">
<h1 style="font-size:7mm;margin:0 0 2mm">Шпаргалка диспетчера 🚁</h1>
<h2 style="font-size:4.6mm;margin:3mm 0 1mm">Сборка (≈ 45 минут)</h2>
<ol style="margin:0;padding-left:5mm">
<li><b>Печать</b> базы: 12 листов, масштаб <b>100% / «фактический размер»</b>, не «по размеру страницы». Жетоны — 4 листа, по возможности на плотной бумаге.</li>
<li><b>Разложить</b> листы сеткой 4×3: A1 B1 C1 D1 / A2 … / A3 … (номер — внизу листа и на обороте).</li>
<li><b>Отрезать</b> белое поле там, где написано ✂ (у колонок B–D слева, у рядов 2–3 сверху).</li>
<li><b>Склеить ряды</b>: клей-карандаш на полосу за пунктиром, сверху кладём соседний лист обрезанным краем ровно по пунктиру (по стрелкам). Потом ряды между собой так же.</li>
<li><b>Перевернуть</b> и пройтись скотчем по швам с изнанки — по базе будут ходить.</li>
<li>Пока взрослые клеят — ребёнок строит из лего <b>больницу</b> и <b>ангар</b> (в ангар должен заезжать вертолёт 15×15).</li>
<li>Жетоны вырезать по прямой — без фигурной резки. Оборудование разложить по ячейкам склада.</li>
</ol>
<h2 style="font-size:4.6mm;margin:3mm 0 1mm">Как идёт любая миссия</h2>
<p style="margin:0">🔔 <b>Вызов</b> («Диспетчер вызывает базу! Приём!») → показать <b>карточку</b> → <b>склад</b>: взять оборудование с картинки
→ <b>взлёт</b> с площадки «3-2-1» → <b>миссия</b> → <b>посадка</b> → спасённых в <b>больницу</b>, вертолёт на <b>заправку</b> / в <b>ангар</b>
→ <b>медаль</b> на доску героя. Не то оборудование — не беда: «Ой, семена огонь не тушат! Летим на склад!»</p>
<h2 style="font-size:4.6mm;margin:3mm 0 1mm">Миссии</h2>
<table style="border-collapse:collapse;width:100%;font-size:3.3mm">
<tr style="background:#f1f3f5"><th style="text-align:left;padding:1mm">Миссия</th><th style="text-align:left;padding:1mm">Где и что подготовить</th><th style="text-align:left;padding:1mm">Как играем</th></tr>
<tr><td style="padding:1mm;vertical-align:top"><b>1 🔥 Пожар в лесу</b><br>вода</td><td style="padding:1mm;vertical-align:top">Под обеденным столом (ножки стульев — деревья) расставить 6 огоньков.</td><td style="padding:1mm;vertical-align:top">Сначала к озеру — «набрать воду». Робот «поливает» огонёк «пшшш» — огонёк забираем. Считаем вслух, сколько осталось.</td></tr>
<tr style="background:#f8f9fa"><td style="padding:1mm;vertical-align:top"><b>2 ⛰ Спасение в горах</b><br>трос + аптечка</td><td style="padding:1mm;vertical-align:top">Игрушка на спинке дивана или между подушками. Ленточка со скрепкой-крючком.</td><td style="padding:1mm;vertical-align:top">Зависнуть над «горой», спустить трос, поднять. Аптечка — «перевязать лапку». В больницу на кровать.</td></tr>
<tr><td style="padding:1mm;vertical-align:top"><b>3 🌱 Засуха в саду</b><br>семена + вода</td><td style="padding:1mm;vertical-align:top">На кухне на полу/подоконнике 4 увядших цветка.</td><td style="padding:1mm;vertical-align:top">Сначала «посеять», потом «полить» — заменить на цветущие. Можно полить и настоящий цветок 🙂</td></tr>
<tr style="background:#f8f9fa"><td style="padding:1mm;vertical-align:top"><b>4 🛟 Спасение на воде</b><br>спасательный круг</td><td style="padding:1mm;vertical-align:top">В детской синее покрывало — море. Игрушка «тонет» посередине.</td><td style="padding:1mm;vertical-align:top">Бросить круг, вытянуть на «берег», согреть пледом, в больницу.</td></tr>
<tr><td style="padding:1mm;vertical-align:top"><b>5 🌙 Ночная миссия</b><br>прожектор (фонарик)</td><td style="padding:1mm;vertical-align:top">В ванной спрятать зверька, выключить свет. <b>Взрослый — рядом</b>, дверь открыта.</td><td style="padding:1mm;vertical-align:top">Светить фонариком, искать по подсказкам «тепло-холодно». Нашли — домой на базу.</td></tr>
<tr style="background:#f8f9fa"><td style="padding:1mm;vertical-align:top"><b>6 ? Своя миссия</b></td><td style="padding:1mm;vertical-align:top" colspan="2">Пусть ребёнок сам нарисует, что случилось. Прихожая — «перевал», через который летим в дальние комнаты.</td></tr>
</table>
<p style="margin:3mm 0 0;color:#777">Если устала — миссия может закончиться за 2 минуты. Главное — вызов, взлёт, посадка и медаль.</p>
</div></div>
"""


# ================= Сборка =================
def html_doc(body, defs=""):
    return (
        f'<!doctype html><html><head><meta charset="utf-8"><style>{PAGE_CSS}</style></head><body>'
        f'{defs}{body}</body></html>'
    )


def base_defs(body):
    return f'<svg width="0" height="0" style="position:absolute"><defs><g id="base">{body}</g></defs></svg>'


def chrome_pdf(html_path, pdf_path):
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--user-data-dir=/tmp/hb-chrome",
         f"--print-to-pdf={pdf_path}", html_path.as_uri()],
        check=True, capture_output=True,
    )


def chrome_png(html_path, png_path, w, h):
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=/tmp/hb-chrome",
         f"--screenshot={png_path}", f"--window-size={w},{h}", html_path.as_uri()],
        check=True, capture_output=True,
    )


def main():
    body = base_body()
    (OUT / "base.svg").write_text(base_svg_standalone(body), encoding="utf-8")

    tiles = [(c, r) for r in range(ROWS) for c in range(COLS)]
    front = "".join(tile_page(c, r) for c, r in tiles)
    duplex = "".join(tile_page(c, r) + back_page(c, r) for c, r in tiles)
    tok = "".join(svg_page(p) for p in (
        tokens_page_missions(), tokens_page_equipment(), tokens_page_flames_flowers(), tokens_page_signs()))

    work = OUT / "_html"
    work.mkdir(exist_ok=True)
    jobs = {
        "1-baza-12-listov.pdf": html_doc(front, base_defs(body)),
        "1-baza-12-listov-dvustoronnyaya.pdf": html_doc(duplex, base_defs(body)),
        "2-zhetony-4-lista.pdf": html_doc(tok),
        "3-shpargalka.pdf": html_doc(CHEAT),
    }
    for name, html in jobs.items():
        hp = work / (name + ".html")
        hp.write_text(html, encoding="utf-8")
        chrome_pdf(hp, OUT / name)
        print("ok", name)

    # превью для проверки
    pv = work / "preview-base.html"
    pv.write_text(
        '<html><body style="margin:0">' + base_svg_standalone(body).replace(f'width="{W}mm" height="{H}mm"', 'width="1119" height="1234"')
        + "</body></html>", encoding="utf-8")
    chrome_png(pv, OUT / "preview-base.png", 1119, 1234)
    for i, p in enumerate((tokens_page_missions(), tokens_page_equipment(), tokens_page_flames_flowers(), tokens_page_signs()), 1):
        tp = work / f"preview-tok{i}.html"
        tp.write_text(
            '<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="776" height="1124" viewBox="0 0 194 281">'
            + "".join(p) + "</svg></body></html>", encoding="utf-8")
        chrome_png(tp, work / f"preview-tok{i}.png", 776, 1124)
    print("ok previews")


if __name__ == "__main__":
    main()
