# Zusätzliche Deko-Modelle je Welt als Low-Poly-GLB (einfarbige Materialien → Vertexfarben im Spiel).
# Aufruf: blender --background --factory-startup --python tools/make_extras.py [-- name ...]
#   name = extras/<welt>/<datei>, <welt>/<datei> oder nur <welt> (alle Modelle dieser Welt)
# Ausgabe assets/extras/<welt>/<datei>.glb; Maße in echten Metern (1 Einheit = 1 m), Ursprung unten mittig,
# Vorderseite +Z. Drinnen (Küche ≈ 2,4-fach, Büro ≈ 1,7-fach) wie die übrigen Requisiten mit s skalieren.
# Mesh-Teile heißen „…-m“; bewegliche Teile sind eigene Knoten ohne „-m“ (Drehpunkt am Knoten), siehe README.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector
from blender_lib import reset, Part, Node, export
# Werkzeuge aus make_deko (dort gebaute Grundkörper laufen über ein eigenes bmesh → keine ungültigen Vertex-Zeiger)
from make_deko import (put, hull, rod, beam, tube, sheet, rcyl, lth, grain_box, dk, fix_names, RX, RY, RZ, AX, AZ,
                       WOOD, DWOOD, LWOOD, STONE, DSTONE, METAL, DARK, WHITE, LEAF, ROOF0, BARK, CUT, SOIL, GLASS, LIGHT, ROPE)

PI = math.pi
MODELS = {}
def model(rel):
    def reg(fn): MODELS[rel] = fn; return fn
    return reg

RED, YEL, BLUE, GREEN, ORANGE, PINK = 0xd63031, 0xfdcb6e, 0x0984e3, 0x27ae60, 0xe67e22, 0xfd79a8
TERRA, CHROME, BRASS, CREAM, WATER = 0xc0703f, 0xb2bec3, 0xd4a017, 0xfff3d6, 0x4aa3df


def roof2(p, a, h, d, ye, c, t=0.03, o=0.05, x0=0, z0=0):
    """Satteldach aus zwei Brettern, First entlang z: halbe Breite a, Höhe h, Tiefe d, Traufe bei ye, Überstand o."""
    L = math.hypot(a, h); th = math.atan2(h, a)
    for s in (-1, 1):
        ux, uy, nx, ny = s * a / L, -h / L, s * h / L, a / L
        put(p, 'box', L + o, t, d, c, at=(x0 + s * a / 2 + nx * t / 2 + ux * o / 2, ye + h / 2 + ny * t / 2 + uy * o / 2, z0), rot=(0, 0, -s * th))


# ================================================================ Garten
@model('extras/garten/vogelhaus')
def vogelhaus(p, root):
    put(p, 'box', 0.08, 1.5, 0.08, WOOD, bevel=0.01, at=(0, 0.75, 0))
    for ry in (0, PI / 2): put(p, 'box', 0.5, 0.06, 0.08, DWOOD, bevel=0.01, at=(0, 0.03, 0), rot=(0, ry, 0))
    for k in range(4):
        a = k * PI / 2; rod(p, (math.cos(a) * 0.2, 0.05, math.sin(a) * 0.2), (math.cos(a) * 0.035, 0.34, math.sin(a) * 0.035), 0.015, DWOOD, seg=4)
    put(p, 'box', 0.46, 0.04, 0.42, LWOOD, bevel=0.01, at=(0, 1.52, 0))
    for s in (-1, 1):
        put(p, 'box', 0.46, 0.04, 0.02, LWOOD, at=(0, 1.56, s * 0.2))
        put(p, 'box', 0.02, 0.04, 0.42, LWOOD, at=(s * 0.22, 1.56, 0))
    hull(p, [(sx * 0.15, y, sz * 0.13) for sx in (-1, 1) for sz in (-1, 1) for y in (1.54, 1.78)] + [(0, 1.9, sz * 0.13) for sz in (-1, 1)], 0x74b9ff)
    roof2(p, 0.15, 0.12, 0.36, 1.78, ROOF0, t=0.025, o=0.06)
    put(p, 'box', 0.035, 0.035, 0.38, dk(ROOF0, 0.75), at=(0, 1.925, 0), rot=(0, 0, PI / 4))
    put(p, 'cyl', 0.045, 0.045, 0.01, DARK, seg=8, at=(0, 1.7, 0.131), rot=AZ)
    put(p, 'torus', 0.05, 0.008, WHITE, seg=8, ring=3, at=(0, 1.7, 0.134), rot=(PI / 2, 0, 0))
    rod(p, (0, 1.62, 0.12), (0, 1.62, 0.2), 0.008, DWOOD, seg=4)
    for i, (x, z) in enumerate([(-0.15, 0.15), (-0.1, 0.17), (0.12, 0.16), (0.16, 0.13), (0.08, 0.17), (-0.17, 0.1)]):
        put(p, 'ball', 0.015, 0xe1b12c if i % 2 else 0x8d6e4a, uv=(4, 3), at=(x, 1.55, z))


@model('extras/garten/hollywoodschaukel')
def hollywoodschaukel(p, root):
    F, CU, H = 0xdfe6e9, 0xe17055, 1.95
    for s in (-1, 1):
        for z in (-1, 1): rod(p, (s * 1.05, 0, z * 0.62), (s * 1.05, H, 0), 0.03, F, seg=6)
        rod(p, (s * 1.05, 0.03, -0.66), (s * 1.05, 0.03, 0.66), 0.03, F, seg=6)
        rod(p, (s * 1.05, 0.9, -0.335), (s * 1.05, 0.9, 0.335), 0.02, F, seg=5)
        for z in (-0.66, 0.66): put(p, 'ball', 0.04, DARK, uv=(5, 3), at=(s * 1.05, 0.03, z))
        for z in (-1, 1): rod(p, (s * 1.05, H, 0), (s * 1.12, H + 0.15 + 0.07 * z, z * 0.7), 0.015, F, seg=4)
    rod(p, (-1.12, H, 0), (1.12, H, 0), 0.04, F, seg=6)
    for i in range(5):  # gestreiftes Sonnendach, vorne etwas höher
        z = -0.6 + i * 0.3
        put(p, 'box', 2.34, 0.03, 0.3, 0x00b894 if i % 2 == 0 else WHITE, at=(0, H + 0.18 + 0.1 * z, z), rot=(-0.1, 0, 0))
    for z, c in ((0.76, 0x00b894), (-0.76, 0x00b894)):
        put(p, 'box', 2.34, 0.12, 0.02, c, at=(0, H + 0.18 + 0.1 * z - 0.06, z))
        for k in range(8): put(p, 'ball', 0.045, WHITE if k % 2 else c, uv=(5, 3), scale=(1.4, 1, 0.3), at=(-1.03 + k * 0.295, H + 0.18 + 0.1 * z - 0.12, z))
    sw = Node('schaukel', root, (0, H, 0)); q = Part('schaukel-m', sw)
    for x in (-0.86, 0.86):
        for z in (-0.2, 0.2): rod(q, (x, -0.02, 0), (x, -1.42, z), 0.01, METAL, seg=4)
    put(q, 'box', 1.8, 0.05, 0.52, F, bevel=0.01, at=(0, -1.45, 0))
    put(q, 'box', 1.7, 0.1, 0.48, CU, bevel=0.03, at=(0, -1.38, 0.02))
    put(q, 'box', 1.8, 0.62, 0.04, F, at=(0, -1.12, -0.27), rot=(-0.15, 0, 0))
    put(q, 'box', 1.7, 0.54, 0.1, CU, bevel=0.03, at=(0, -1.1, -0.2), rot=(-0.15, 0, 0))
    for x in (-0.86, 0.86):
        put(q, 'box', 0.06, 0.04, 0.52, F, at=(x, -1.17, 0))
        put(q, 'box', 0.04, 0.24, 0.04, F, at=(x, -1.3, 0.22))
    for x, c in ((-0.55, YEL), (0.55, 0x74b9ff)): put(q, 'ball', 0.17, c, uv=(6, 4), scale=(1, 0.8, 0.35), at=(x, -1.12, -0.11), rot=(-0.15, 0, 0.1 * x))
    q.done()


@model('extras/garten/schlauchwagen')
def schlauchwagen(p, root):
    O, G = 0xf39c12, 0x2ecc71
    for s in (-1, 1):
        x = s * 0.3
        hull(p, [(x + dx, y, z) for dx in (-0.015, 0.015) for y, z in ((0.1, -0.2), (0.1, 0.2), (0.62, 0.03), (0.62, -0.07))], O)
        rcyl(p, 0.12, 0.05, DARK, at=(s * 0.37, 0.12, -0.17), rot=AX, seg=10, b=0.015)
        put(p, 'cyl', 0.05, 0.05, 0.06, O, seg=6, at=(s * 0.375, 0.12, -0.17), rot=AX)
        rod(p, (x, 0.12, 0.17), (x, 0.0, 0.24), 0.02, O, seg=5)
        put(p, 'box', 0.06, 0.02, 0.08, DARK, at=(x, 0.01, 0.25))
        rod(p, (x, 0.55, -0.05), (x, 1.0, -0.3), 0.02, O, seg=5)
    rod(p, (-0.34, 1.0, -0.3), (0.34, 1.0, -0.3), 0.028, DARK, seg=6)
    rod(p, (-0.4, 0.12, -0.17), (0.4, 0.12, -0.17), 0.015, METAL, seg=4)
    rod(p, (-0.3, 0.12, 0.15), (0.3, 0.12, 0.15), 0.015, O, seg=4)
    tube(p, [(0.1, 0.3, 0.11), (0.12, 0.13, 0.24), (0.16, 0.035, 0.36), (0.32, 0.035, 0.48), (0.5, 0.035, 0.47)], 0.03, G)
    put(p, 'cyl', 0.025, 0.035, 0.12, O, seg=6, at=(0.58, 0.035, 0.47), rot=(0, 0, -PI / 2))
    dr = Node('trommel', root, (0, 0.42, 0)); q = Part('trommel-m', dr)
    rod(q, (-0.36, 0, 0), (0.36, 0, 0), 0.02, METAL, seg=5)
    for s in (-1, 1): put(q, 'cyl', 0.2, 0.2, 0.025, O, seg=12, at=(s * 0.265, 0, 0), rot=AX)
    put(q, 'cyl', 0.07, 0.07, 0.5, DARK, seg=8, rot=AX)
    for i in range(5): put(q, 'torus', 0.12, 0.045, G, seg=12, ring=5, at=(-0.19 + i * 0.095, 0, 0), rot=(0, 0, PI / 2))
    put(q, 'box', 0.03, 0.16, 0.03, O, at=(0.36, -0.07, 0))
    rod(q, (0.36, -0.14, 0), (0.45, -0.14, 0), 0.02, DARK, seg=5)
    q.done()


@model('extras/garten/rasenmaeher')
def rasenmaeher(p, root):
    put(p, 'box', 0.5, 0.16, 0.56, RED, bevel=0.05, at=(0, 0.2, 0.05))
    put(p, 'box', 0.52, 0.04, 0.58, dk(RED, 0.7), at=(0, 0.13, 0.05))
    rcyl(p, 0.14, 0.14, DARK, at=(0, 0.33, 0.1), seg=10, b=0.02)
    put(p, 'cyl', 0.07, 0.08, 0.03, METAL, seg=8, at=(0, 0.415, 0.1))
    put(p, 'box', 0.06, 0.04, 0.04, DARK, bevel=0.01, at=(0.12, 0.42, 0.04))
    for x in (-0.29, 0.29):
        for z in (0.26, -0.16):
            rcyl(p, 0.1, 0.05, DARK, at=(x, 0.1, z), rot=AX, seg=10, b=0.015)
            put(p, 'cyl', 0.045, 0.045, 0.056, 0xdfe6e9, seg=6, at=(x, 0.1, z), rot=AX)
    put(p, 'box', 0.38, 0.26, 0.32, 0x2e7d32, bevel=0.06, at=(0, 0.3, -0.36))
    put(p, 'box', 0.4, 0.05, 0.05, DARK, at=(0, 0.41, -0.22))
    for s in (-1, 1):
        rod(p, (s * 0.18, 0.28, -0.2), (s * 0.21, 0.95, -0.7), 0.016, METAL, seg=5)
    rod(p, (-0.23, 0.95, -0.7), (0.23, 0.95, -0.7), 0.024, DARK, seg=6)
    rod(p, (-0.2, 0.62, -0.47), (0.2, 0.62, -0.47), 0.012, METAL, seg=4)
    tube(p, [(-0.2, 0.93, -0.66), (-0.19, 0.88, -0.6), (0.19, 0.88, -0.6), (0.2, 0.93, -0.66)], 0.01, RED, ring=4)
    for i, (x, z) in enumerate([(-0.12, -0.53), (0.0, -0.54), (0.11, -0.53)]):
        put(p, 'cone', 0.04, 0.09, LEAF, seg=4, at=(x, 0.44, z + 0.05), rot=(-0.4, i, 0.2 * (i - 1)))


@model('extras/garten/pflanztisch')
def pflanztisch(p, root):
    for x in (-0.55, 0.55):
        for z in (-0.22, 0.22): put(p, 'box', 0.05, 0.9, 0.05, WOOD, at=(x, 0.45, z))
        put(p, 'box', 0.05, 0.55, 0.05, WOOD, at=(x, 1.17, -0.22))
    grain_box(p, 1.2, 0.04, 0.55, LWOOD, at=(0, 0.92, 0))
    put(p, 'box', 1.15, 0.03, 0.5, LWOOD, at=(0, 0.25, 0))
    put(p, 'box', 1.2, 0.03, 0.18, LWOOD, at=(0, 1.3, -0.17))
    put(p, 'box', 1.1, 0.3, 0.02, WOOD, at=(0, 1.1, -0.24))
    def tpot(x, y, z, r, plant=None):
        lth(p, [(r * 0.7, 0), (r, r * 1.3), (r * 1.12, r * 1.33), (r * 1.12, r * 1.55), (r * 1.0, r * 1.56)], TERRA, at=(x, y, z), seg=8)
        if plant: put(p, 'ball', r * 1.1, LEAF, uv=(6, 4), scale=(1, 0.8, 1), at=(x, y + r * 1.75, z))
        if plant and plant != LEAF: put(p, 'ball', r * 0.35, plant, uv=(5, 3), at=(x + r * 0.3, y + r * 2.4, z + r * 0.4))
    tpot(-0.42, 0.94, 0.08, 0.07, 0xff6b9d); tpot(-0.25, 0.94, -0.05, 0.06, LEAF); tpot(0.42, 0.94, -0.1, 0.08, YEL)
    for x, c in ((-0.35, 0xff7675), (0, 0xa29bfe), (0.35, LEAF)): tpot(x, 1.315, -0.17, 0.05, c)
    put(p, 'box', 0.32, 0.05, 0.2, DARK, bevel=0.01, at=(0.05, 0.965, 0.08))
    for i in range(6): put(p, 'cone', 0.025, 0.05, 0x7bc043, seg=4, at=(-0.06 + (i % 3) * 0.11, 1.01, 0.03 + (i // 3) * 0.1))
    put(p, 'box', 0.03, 0.015, 0.12, DWOOD, at=(0.3, 0.948, 0.15), rot=(0, 0.5, 0))
    put(p, 'box', 0.06, 0.008, 0.1, METAL, at=(0.25, 0.944, 0.25), rot=(0, 0.5, 0))
    for k in range(3): lth(p, [(0.1, 0), (0.07, 0.12)], TERRA, at=(-0.35, 0.265 + k * 0.04, 0.05), seg=8)
    put(p, 'box', 0.4, 0.26, 0.26, 0x8d6e63, bevel=0.07, at=(0.25, 0.4, 0.02), rot=(0, -0.2, 0))
    put(p, 'box', 0.42, 0.06, 0.2, 0x6d4c41, bevel=0.03, at=(0.25, 0.55, 0.02), rot=(0, -0.2, 0))


@model('extras/garten/rosenbogen')
def rosenbogen(p, root):
    F, R = 0xf5f6fa, 0.7
    for s in (-1, 1):
        for z in (-0.2, 0.2): rod(p, (s * R, 0, z), (s * R, 1.6, z), 0.025, F, seg=5)
        for y in (0.4, 0.8, 1.2): rod(p, (s * R, y, -0.2), (s * R, y, 0.2), 0.015, F, seg=4)
    arc = [(math.cos(i * PI / 8) * R, 1.6 + math.sin(i * PI / 8) * R) for i in range(9)]
    for z in (-0.2, 0.2): tube(p, [(x, y, z) for x, y in arc], 0.025, F, ring=5)
    for x, y in arc[1:-1]: rod(p, (x, y, -0.2), (x, y, 0.2), 0.015, F, seg=4)
    leaves = [0x3d9a3d, 0x4caa4c, 0x5fc25f]; k = 0
    spots = [(s * 0.72, y, 0) for s in (-1, 1) for y in (0.25, 0.65, 1.05, 1.45)] + [(math.cos(i * PI / 6) * 0.72, 1.6 + math.sin(i * PI / 6) * 0.72, 0) for i in range(7)]
    for i, (x, y, z) in enumerate(spots):
        put(p, 'ball', 0.15 if y > 1 else 0.12, leaves[i % 3], uv=(6, 3), scale=(0.9, 0.85, 1.6), at=(x, y, z + 0.03 * ((i % 3) - 1)), rot=(0, 0, 0.5 * i))
    for i, (x, y, z) in enumerate(spots):
        sz = 1 if i % 2 else -1
        put(p, 'ball', 0.05, (0xe84393, 0xd63031, 0xff9ff3)[i % 3], uv=(5, 3), at=(x + 0.04 * sz, y + 0.05, sz * 0.24))


@model('extras/garten/insektenhotel')
def insektenhotel(p, root):
    for s in (-1, 1):
        put(p, 'box', 0.05, 0.36, 0.05, DWOOD, at=(s * 0.2, 0.18, 0))
        put(p, 'box', 0.03, 0.64, 0.2, WOOD, at=(s * 0.235, 0.67, 0))
    for y in (0.36, 0.56, 0.77, 0.98): put(p, 'box', 0.5, 0.025, 0.2, WOOD, at=(0, y, 0))
    put(p, 'box', 0.025, 0.4, 0.2, WOOD, at=(0, 0.565, 0))
    put(p, 'box', 0.47, 0.64, 0.015, DWOOD, at=(0, 0.67, -0.095))
    hull(p, [(sx * 0.25, 0.99, z) for sx in (-1, 1) for z in (-0.1, 0.1)] + [(0, 1.12, z) for z in (-0.1, 0.1)], WOOD)
    roof2(p, 0.25, 0.13, 0.28, 0.99, 0x6d4c41, t=0.025, o=0.06)
    put(p, 'cyl', 0.03, 0.03, 0.01, DARK, seg=6, at=(0, 1.05, 0.101), rot=AZ)
    for x, y in ((-0.17, 0.42), (-0.06, 0.42), (-0.115, 0.5)):  # Holzklötze mit Bohrlöchern
        put(p, 'cyl', 0.05, 0.05, 0.18, BARK, seg=7, at=(x, y, 0), rot=AZ)
        put(p, 'cyl', 0.043, 0.043, 0.01, CUT, seg=7, at=(x, y, 0.09), rot=AZ)
        for k in range(3): put(p, 'cyl', 0.008, 0.008, 0.01, DARK, seg=4, at=(x + 0.02 * math.cos(k * 2.1), y + 0.02 * math.sin(k * 2.1), 0.095), rot=AZ)
    for i, x in enumerate((0.06, 0.13, 0.2)):  # Zapfen
        put(p, 'ball', 0.04, 0x8d5524, uv=(6, 4), jitter=0.08, seed=i, scale=(1, 1.4, 1), at=(x, 0.43, 0.03 * (i - 1)), rot=(PI / 2, 0, 0))
    for ix in range(3):  # Bambusröhrchen
        for iy in range(3):
            x, y = -0.18 + ix * 0.06, 0.6 + iy * 0.055
            put(p, 'cyl', 0.027, 0.027, 0.19, LWOOD, seg=6, at=(x, y, 0), rot=AZ)
            put(p, 'cyl', 0.014, 0.014, 0.01, DARK, seg=5, at=(x, y, 0.095), rot=AZ)
    for i in range(7): put(p, 'box', 0.2, 0.012, 0.18, 0xe1c16e, at=(0.12, 0.59 + i * 0.024, 0.005 * (i % 2)), rot=(0, 0.15 * ((i % 3) - 1), 0.05 * ((i % 2) * 2 - 1)))
    for x in (-0.115, 0.115):  # Lochziegel
        put(p, 'box', 0.21, 0.17, 0.18, 0xb5523b, bevel=0.01, at=(x, 0.87, 0))
        for k in range(4): put(p, 'box', 0.03, 0.12, 0.01, dk(0xb5523b, 0.5), at=(x - 0.06 + k * 0.04, 0.87, 0.091))


@model('extras/garten/windrad')
def windrad(p, root):
    rod(p, (0, 0, 0), (0, 1.42, 0), 0.025, WHITE, seg=6)
    put(p, 'cyl', 0.1, 0.12, 0.05, DARK, seg=8, at=(0, 0.025, 0))
    put(p, 'box', 0.1, 0.1, 0.3, RED, bevel=0.02, at=(0, 1.46, -0.04))
    rod(p, (0, 1.46, -0.18), (0, 1.5, -0.5), 0.012, WHITE, seg=4)
    hull(p, [(dx, y, z) for dx in (-0.01, 0.01) for y, z in ((1.42, -0.42), (1.62, -0.48), (1.62, -0.7), (1.45, -0.66))], YEL)
    w = Node('rad', root, (0, 1.46, 0.13)); q = Part('rad-m', w)
    put(q, 'cyl', 0.045, 0.045, 0.06, WHITE, seg=8, rot=AZ)
    put(q, 'cone', 0.045, 0.05, RED, seg=8, at=(0, 0, 0.055), rot=(PI / 2, 0, 0))
    for i in range(8):
        a = i * PI / 4
        put(q, 'box', 0.1, 0.3, 0.012, (RED, WHITE, YEL, WHITE)[i % 4], m=RZ(a - PI / 2) @ RY(0.45), at=(math.cos(a) * 0.21, math.sin(a) * 0.21, 0))
    q.done()


# ================================================================ Küche (echte Maße; im Erdgeschoss wie die Möbel ≈ 2,4-fach)
@model('extras/kueche/toaster')
def toaster(p, root):
    put(p, 'box', 0.28, 0.18, 0.16, CHROME, bevel=0.035, at=(0, 0.1, 0))
    put(p, 'box', 0.285, 0.03, 0.165, RED, at=(0, 0.06, 0))
    for z in (-0.035, 0.035):
        put(p, 'box', 0.2, 0.01, 0.03, DARK, at=(0, 0.188, z))
        put(p, 'box', 0.16, 0.12, 0.014, 0xb5651d, at=(0, 0.22, z))
        put(p, 'box', 0.14, 0.1, 0.018, 0xf3d9a6, at=(0, 0.215, z))
    put(p, 'box', 0.012, 0.09, 0.01, DARK, at=(0.1, 0.12, 0.08))
    put(p, 'box', 0.04, 0.02, 0.035, DARK, bevel=0.005, at=(0.1, 0.15, 0.095))
    put(p, 'cyl', 0.018, 0.018, 0.015, DARK, seg=8, at=(-0.09, 0.1, 0.083), rot=AZ)
    for x in (-0.11, 0.11):
        for z in (-0.06, 0.06): put(p, 'cyl', 0.012, 0.012, 0.012, DARK, seg=5, at=(x, 0.006, z))


@model('extras/kueche/kochtopf')
def kochtopf(p, root):
    lth(p, [(0.14, 0), (0.16, 0.02), (0.16, 0.15), (0.166, 0.155)], RED, seg=12)
    put(p, 'cyl', 0.162, 0.162, 0.02, WHITE, seg=12, at=(0, 0.13, 0))
    lth(p, [(0.17, 0.155), (0.16, 0.172), (0.06, 0.2), (0, 0.205)], CHROME, seg=12)
    put(p, 'cyl', 0.02, 0.025, 0.03, DARK, seg=6, at=(0, 0.22, 0))
    put(p, 'ball', 0.025, DARK, uv=(6, 3), scale=(1, 0.6, 1), at=(0, 0.24, 0))
    for s in (-1, 1): put(p, 'box', 0.06, 0.025, 0.06, DARK, bevel=0.008, at=(s * 0.19, 0.125, 0))


@model('extras/kueche/mixer')
def mixer(p, root):
    c = PINK
    put(p, 'box', 0.2, 0.05, 0.34, c, bevel=0.02, at=(0, 0.025, 0))
    put(p, 'box', 0.11, 0.26, 0.11, c, bevel=0.03, at=(0, 0.17, -0.11))
    put(p, 'ball', 0.1, c, uv=(8, 5), scale=(0.9, 0.8, 1.7), at=(0, 0.33, -0.02))
    put(p, 'cyl', 0.06, 0.06, 0.02, CHROME, seg=8, at=(0, 0.33, -0.19), rot=AZ)
    put(p, 'box', 0.02, 0.03, 0.05, DARK, bevel=0.005, at=(0.09, 0.32, -0.08))
    lth(p, [(0.05, 0.05), (0.08, 0.06), (0.11, 0.14), (0.115, 0.155)], CHROME, at=(0, 0, 0.06), seg=8)
    put(p, 'ball', 0.1, CREAM, uv=(6, 4), jitter=0.06, seed=3, scale=(1, 0.35, 1), at=(0, 0.16, 0.06))
    rod(p, (0, 0.27, 0.07), (0, 0.18, 0.07), 0.008, CHROME, seg=4)
    put(p, 'ball', 0.028, CHROME, uv=(6, 4), scale=(1, 1.3, 1), at=(0, 0.18, 0.07))


@model('extras/kueche/salz-pfeffer')
def salz_pfeffer(p, root):
    put(p, 'box', 0.2, 0.015, 0.1, LWOOD, bevel=0.005, at=(0, 0.0075, 0))
    for x, c in ((-0.045, WHITE), (0.045, DARK)):
        lth(p, [(0.03, 0.015), (0.033, 0.022), (0.03, 0.085), (0.026, 0.095)], c, at=(x, 0, 0), seg=8)
        lth(p, [(0.027, 0.095), (0.027, 0.105), (0.018, 0.118), (0, 0.122)], CHROME, at=(x, 0, 0), seg=8)
        for k in range(3): put(p, 'box', 0.006, 0.004, 0.006, dk(CHROME, 0.4), at=(x + 0.008 * (k - 1), 0.12, 0.004 * (k % 2)))
    put(p, 'box', 0.012, 0.02, 0.002, DARK, at=(-0.045, 0.06, 0.032))
    put(p, 'box', 0.012, 0.02, 0.002, WHITE, at=(0.045, 0.06, 0.032))


@model('extras/kueche/brotkasten')
def brotkasten(p, root):
    c, w = 0xc0392b, 0.42
    put(p, 'box', w, 0.14, 0.26, c, bevel=0.02, at=(0, 0.075, 0))
    put(p, 'cyl', 0.13, 0.13, w, c, seg=12, at=(0, 0.145, 0), rot=AX)
    for k, a in enumerate((0.35, 0.75, 1.15)):  # Rolldeckel-Rillen
        put(p, 'box', w + 0.004, 0.006, 0.01, dk(c, 0.75), at=(0, 0.145 + math.sin(a) * 0.131, math.cos(a) * 0.131), rot=(-(PI / 2 - a), 0, 0))
    put(p, 'box', 0.12, 0.025, 0.025, CREAM, bevel=0.008, at=(0, 0.14, 0.14))
    for s in (-1, 1): put(p, 'cyl', 0.131, 0.131, 0.012, CREAM, seg=12, at=(s * (w / 2 + 0.004), 0.145, 0), rot=AX)
    for x in (-0.17, 0.17):
        for z in (-0.1, 0.1): put(p, 'cyl', 0.015, 0.015, 0.01, DARK, seg=5, at=(x, 0.005, z))
    put(p, 'ball', 0.1, 0xd9a066, uv=(6, 4), scale=(1.4, 0.55, 0.8), at=(0.03, 0.3, 0))


@model('extras/kueche/wasserkocher')
def wasserkocher(p, root):
    c = 0x74b9ff
    rcyl(p, 0.095, 0.02, DARK, at=(0, 0.01, 0), seg=10, b=0.005)
    lth(p, [(0.075, 0.02), (0.088, 0.04), (0.084, 0.17), (0.064, 0.215), (0.058, 0.22)], c, seg=10)
    put(p, 'cyl', 0.06, 0.06, 0.008, WHITE, seg=10, at=(0, 0.222, 0))
    put(p, 'box', 0.03, 0.015, 0.02, DARK, bevel=0.004, at=(0, 0.232, 0))
    tube(p, [(0, 0.19, -0.075), (0, 0.205, -0.125), (0, 0.13, -0.14), (0, 0.06, -0.125), (0, 0.05, -0.085)], 0.014, c, ring=5)
    rod(p, (0, 0.13, 0.07), (0, 0.19, 0.15), 0.024, c, seg=6, rt=0.012)
    put(p, 'box', 0.02, 0.1, 0.005, WATER, at=(0.07, 0.11, 0.045), rot=(0, 0.9, 0))
    put(p, 'box', 0.02, 0.014, 0.02, RED, bevel=0.003, at=(0, 0.06, -0.135))


@model('extras/kueche/obstschale')
def obstschale(p, root):
    lth(p, [(0.06, 0), (0.07, 0.012), (0.16, 0.075), (0.17, 0.085), (0.15, 0.08)], LWOOD, seg=10)
    for i, (x, z, c) in enumerate([(-0.06, 0.04, RED), (0.05, 0.05, 0x7bc043), (0.0, -0.06, RED)]):
        put(p, 'ball', 0.045, c, uv=(6, 3), scale=(1, 0.9, 1), at=(x, 0.11 + 0.01 * i, z))
        rod(p, (x, 0.145 + 0.01 * i, z), (x + 0.01, 0.17 + 0.01 * i, z), 0.004, DWOOD, seg=3)
    put(p, 'ball', 0.045, ORANGE, uv=(6, 3), at=(0.08, 0.12, -0.05))
    put(p, 'ball', 0.05, 0xc5e17a, uv=(6, 3), scale=(0.9, 1.4, 0.9), at=(-0.09, 0.14, -0.05), rot=(0, 0, 0.3))
    tube(p, [(-0.12, 0.16, 0.08), (-0.05, 0.135, 0.11), (0.04, 0.135, 0.11), (0.11, 0.16, 0.07)], 0.02, YEL, ring=5)
    for x in (-0.13, 0.12): put(p, 'box', 0.012, 0.012, 0.012, DWOOD, at=(x, 0.165, 0.075 + 0.005 * (x < 0)))
    for i in range(5):
        a = i * 1.25; put(p, 'ball', 0.02, 0x6c3483, uv=(4, 3), at=(0.03 + math.cos(a) * 0.025, 0.19 - 0.012 * (i % 3), -0.0 + math.sin(a) * 0.025))
    put(p, 'ball', 0.012, 0x3d9a3d, uv=(4, 3), scale=(1.5, 0.4, 1), at=(-0.05, 0.16, 0.04))


@model('extras/kueche/schneidebrett')
def schneidebrett(p, root):
    put(p, 'box', 0.4, 0.025, 0.26, LWOOD, bevel=0.008, at=(0, 0.0125, 0))
    put(p, 'box', 0.08, 0.025, 0.08, LWOOD, bevel=0.008, at=(0.23, 0.0125, 0))
    put(p, 'cyl', 0.015, 0.015, 0.027, DWOOD, seg=6, at=(0.245, 0.0125, 0))
    put(p, 'cone', 0.022, 0.17, ORANGE, seg=6, at=(-0.05, 0.047, -0.06), rot=(0, 0.2, -PI / 2))
    for k in range(3): put(p, 'cone', 0.012, 0.07, LEAF, seg=4, at=(-0.17, 0.06, -0.035 - 0.02 * k), rot=(0.3 * (k - 1), 0, PI / 2 + 0.3))
    for i in range(4): put(p, 'cyl', 0.021, 0.021, 0.008, ORANGE if i % 2 else 0xf0932b, seg=7, at=(0.09 + i * 0.035, 0.029 + 0.002 * (i % 2), -0.04), rot=(0.1 * i, 0, 0.15))
    put(p, 'box', 0.17, 0.004, 0.036, CHROME, at=(0.02, 0.03, 0.08), rot=(0, 0.1, 0))
    put(p, 'box', 0.09, 0.018, 0.024, DARK, bevel=0.005, at=(-0.11, 0.035, 0.093), rot=(0, 0.1, 0))
    put(p, 'ball', 0.035, RED, uv=(6, 4), scale=(1, 0.85, 1), at=(-0.12, 0.055, 0.03))
    for k in range(3): put(p, 'box', 0.025, 0.004, 0.006, LEAF, at=(-0.12, 0.085, 0.03), rot=(0, k * PI / 3, 0))


# ================================================================ Büro (echte Maße; im Büro ≈ 1,7-fach)
@model('extras/buero/kopierer')
def kopierer(p, root):
    g1, g2 = 0xb2bec3, 0xdfe6e9
    put(p, 'box', 0.8, 0.45, 0.6, g1, bevel=0.02, at=(0, 0.255, 0))
    put(p, 'box', 0.78, 0.04, 0.58, DARK, at=(0, 0.02, 0))
    for y in (0.15, 0.36):
        put(p, 'box', 0.74, 0.19, 0.02, dk(g1, 1.07), at=(0, y, 0.3))
        put(p, 'box', 0.24, 0.03, 0.03, DARK, bevel=0.008, at=(0, y + 0.05, 0.315))
    put(p, 'box', 0.9, 0.36, 0.65, g2, bevel=0.03, at=(0, 0.66, 0))
    put(p, 'box', 0.84, 0.05, 0.58, 0x636e72, bevel=0.01, at=(0, 0.865, -0.03))
    put(p, 'box', 0.3, 0.04, 0.14, DARK, bevel=0.01, at=(0.24, 0.85, 0.3), rot=(0.35, 0, 0))
    put(p, 'box', 0.1, 0.006, 0.05, 0x55efc4, at=(0.17, 0.872, 0.3), rot=(0.35, 0, 0))
    for i, c in enumerate((0x2ecc71, YEL, RED, WHITE)): put(p, 'box', 0.025, 0.012, 0.025, c, at=(0.26 + (i % 2) * 0.05, 0.875, 0.27 + (i // 2) * 0.045), rot=(0.35, 0, 0))
    put(p, 'box', 0.28, 0.02, 0.4, g1, at=(-0.56, 0.6, 0), rot=(0, 0, 0.15))
    for k in range(4): put(p, 'box', 0.21, 0.008, 0.29, WHITE, at=(-0.56 - 0.008 * k, 0.615 + k * 0.009, 0.01 * (k % 2)), rot=(0, 0.05 * (k - 1.5), 0.15))
    put(p, 'box', 0.03, 0.15, 0.4, dk(g2, 0.85), at=(0.465, 0.6, 0))


@model('extras/buero/kaffeemaschine')
def kaffeemaschine(p, root):
    put(p, 'box', 0.22, 0.04, 0.26, DARK, bevel=0.012, at=(0, 0.02, 0))
    put(p, 'box', 0.22, 0.34, 0.1, DARK, bevel=0.015, at=(0, 0.19, -0.08))
    put(p, 'box', 0.18, 0.2, 0.012, WATER, at=(0, 0.22, -0.131))
    put(p, 'box', 0.22, 0.09, 0.22, DARK, bevel=0.015, at=(0, 0.38, -0.02))
    put(p, 'cyl', 0.08, 0.08, 0.008, 0x636e72, seg=10, at=(0, 0.044, 0.045))
    lth(p, [(0.055, 0.048), (0.075, 0.08), (0.073, 0.15), (0.05, 0.18), (0.052, 0.2)], GLASS, at=(0, 0, 0.045), seg=8)
    put(p, 'cyl', 0.076, 0.076, 0.06, 0x6d4c41, seg=8, at=(0, 0.09, 0.045))
    put(p, 'cyl', 0.055, 0.055, 0.015, DARK, seg=8, at=(0, 0.2, 0.045))
    tube(p, [(0, 0.17, 0.115), (0, 0.17, 0.15), (0, 0.09, 0.15), (0, 0.09, 0.115)], 0.01, DARK, ring=4)
    put(p, 'box', 0.03, 0.015, 0.012, RED, bevel=0.003, at=(0.07, 0.025, 0.13))
    put(p, 'box', 0.03, 0.03, 0.012, LIGHT, at=(0.07, 0.4, 0.09))


@model('extras/buero/drucker')
def drucker(p, root):
    c = 0xdfe6e9
    put(p, 'box', 0.45, 0.18, 0.35, c, bevel=0.025, at=(0, 0.09, 0))
    put(p, 'box', 0.43, 0.02, 0.33, dk(c, 0.85), at=(0, 0.181, -0.005))
    put(p, 'box', 0.36, 0.04, 0.012, DARK, at=(0, 0.1, 0.176))
    put(p, 'box', 0.34, 0.012, 0.18, dk(c, 0.85), at=(0, 0.07, 0.25))
    put(p, 'box', 0.21, 0.006, 0.17, WHITE, at=(0, 0.08, 0.245), rot=(0, 0.05, 0))
    put(p, 'box', 0.34, 0.25, 0.012, dk(c, 0.85), at=(0, 0.28, -0.2), rot=(-0.35, 0, 0))
    put(p, 'box', 0.21, 0.24, 0.006, WHITE, at=(0, 0.3, -0.19), rot=(-0.35, 0, 0))
    put(p, 'box', 0.1, 0.02, 0.05, DARK, at=(0.15, 0.185, 0.13))
    for i, cc in enumerate((0x2ecc71, ORANGE)): put(p, 'cyl', 0.01, 0.01, 0.01, cc, seg=5, at=(0.12 + i * 0.04, 0.196, 0.13))


@model('extras/buero/aktenstapel')
def aktenstapel(p, root):
    for i, c in enumerate((RED, BLUE, 0x2ecc71, YEL, 0x6c5ce7)):  # stehende Ordner
        x = -0.32 + i * 0.085
        put(p, 'box', 0.08, 0.32, 0.28, c, at=(x, 0.16, 0), rot=(0, 0, -0.12 if i == 4 else 0))
        put(p, 'box', 0.05, 0.08, 0.004, WHITE, at=(x + (0.007 if i == 4 else 0), 0.22, 0.141), rot=(0, 0, -0.12 if i == 4 else 0))
        put(p, 'cyl', 0.016, 0.016, 0.006, DARK, seg=6, at=(x - (0.008 if i == 4 else 0), 0.09, 0.14), rot=AZ)
    y = 0
    for k in range(7):  # Papierstapel mit Mappen
        h = 0.035 if k % 2 == 0 else 0.012
        put(p, 'box', 0.24, h, 0.31, WHITE if k % 2 == 0 else (0xfab1a0, 0x81ecec, 0xffeaa7)[k // 2 % 3], at=(0.2 + 0.01 * math.sin(k * 2), y + h / 2, 0.01 * math.cos(k * 3)), rot=(0, 0.06 * math.sin(k * 1.7), 0))
        y += h
    put(p, 'box', 0.06, 0.004, 0.05, YEL, at=(0.25, y + 0.002, 0.08), rot=(0, 0.4, 0))
    put(p, 'box', 0.3, 0.004, 0.22, WHITE, at=(0.0, 0.004, 0.27), rot=(0, 0.25, 0))


@model('extras/buero/ventilator')
def ventilator(p, root):
    c = 0xf5f6fa
    rcyl(p, 0.18, 0.04, c, at=(0, 0.02, 0), seg=12, b=0.012)
    rod(p, (0, 0.04, 0), (0, 1.0, 0), 0.02, CHROME, seg=6)
    put(p, 'cyl', 0.03, 0.03, 0.12, c, seg=6, at=(0, 0.1, 0))
    for i, cc in enumerate((0x2ecc71, YEL, RED)): put(p, 'box', 0.025, 0.012, 0.025, cc, at=(-0.05 + i * 0.05, 0.045, 0.12))
    put(p, 'ball', 0.035, c, uv=(6, 4), at=(0, 1.02, -0.02))
    put(p, 'ball', 0.08, c, uv=(8, 6), scale=(1, 1, 1.5), at=(0, 1.08, -0.07))
    for z in (0.0, 0.12):
        put(p, 'torus', 0.24, 0.008, CHROME, seg=16, ring=3, at=(0, 1.08, z), rot=(PI / 2, 0, 0))
    for k in range(8):
        a = k * PI / 4; x, y = math.cos(a) * 0.24, 1.08 + math.sin(a) * 0.24
        rod(p, (x, y, 0), (x, y, 0.12), 0.005, CHROME, seg=3)
    for k in range(4):
        a = k * PI / 4; put(p, 'box', 0.46, 0.008, 0.008, CHROME, at=(0, 1.08, 0.125), rot=(0, 0, a))
    put(p, 'cyl', 0.04, 0.04, 0.012, 0x74b9ff, seg=8, at=(0, 1.08, 0.13), rot=AZ)
    f = Node('fluegel', root, (0, 1.08, 0.06)); q = Part('fluegel-m', f)
    put(q, 'cyl', 0.035, 0.035, 0.04, c, seg=8, rot=AZ)
    for k in range(3):
        a = k * 2 * PI / 3
        put(q, 'ball', 0.1, 0x74b9ff, uv=(6, 3), scale=(1, 0.55, 0.1), m=RZ(a) @ RX(0.35), at=(math.cos(a) * 0.12, math.sin(a) * 0.12, 0))
    q.done()


@model('extras/buero/schreibtischlampe')
def schreibtischlampe(p, root):
    c = 0x00b894
    rcyl(p, 0.08, 0.03, c, at=(0, 0.015, 0), seg=10, b=0.01)
    a, b, e = (0, 0.03, -0.02), (0, 0.27, -0.1), (0, 0.4, 0.07)
    for s in (-1, 1):
        rod(p, (s * 0.012, a[1], a[2]), (s * 0.012, b[1], b[2]), 0.007, CHROME, seg=4)
        rod(p, (s * 0.012, b[1], b[2]), (s * 0.012, e[1], e[2]), 0.007, CHROME, seg=4)
    rod(p, (0, 0.06, -0.03), (0, 0.33, 0.0), 0.004, DARK, seg=3)  # Feder
    for q in (a, b, e): put(p, 'cyl', 0.016, 0.016, 0.04, c, seg=6, at=q, rot=AX)
    lth(p, [(0.075, -0.1), (0.07, -0.09), (0.035, -0.02), (0.02, 0.0)], c, at=e, rot=(-0.8, 0, 0), seg=10)
    put(p, 'ball', 0.035, LIGHT, uv=(6, 4), at=(0, 0.35, 0.125))


@model('extras/buero/pinnwand')
def pinnwand(p, root):
    for s in (-1, 1):
        put(p, 'box', 0.04, 1.6, 0.04, CHROME, at=(s * 0.48, 0.8, 0))
        put(p, 'box', 0.06, 0.03, 0.45, DARK, bevel=0.01, at=(s * 0.48, 0.015, 0))
    put(p, 'box', 0.92, 0.66, 0.04, WOOD, bevel=0.01, at=(0, 1.2, 0))
    put(p, 'box', 0.84, 0.58, 0.02, 0xc8a066, at=(0, 1.2, 0.015))
    notes = [(-0.28, 1.36, 0.16, 0.12, YEL, 0.1), (-0.05, 1.33, 0.2, 0.26, WHITE, -0.05), (0.25, 1.38, 0.15, 0.15, 0xff9ff3, 0.08),
             (-0.27, 1.08, 0.2, 0.15, 0x74b9ff, -0.08), (0.03, 1.02, 0.14, 0.14, YEL, 0.15), (0.26, 1.08, 0.2, 0.18, WHITE, 0.0)]
    for i, (x, y, w, h, c, r) in enumerate(notes):
        put(p, 'box', w, h, 0.004, c, at=(x, y, 0.028), rot=(0, 0, r))
        put(p, 'ball', 0.012, (RED, BLUE, 0x2ecc71)[i % 3], uv=(4, 3), at=(x, y + h / 2 - 0.02, 0.036))
        if c == WHITE:
            for k in range(3): put(p, 'box', w * 0.7, 0.008, 0.002, 0x95a5a6, at=(x, y + 0.04 - k * 0.04, 0.031), rot=(0, 0, r))
    tube(p, [(-0.28, 1.1, 0.033), (-0.1, 1.2, 0.033), (0.03, 1.05, 0.033), (0.25, 1.1, 0.033)], 0.004, RED, ring=3)
    put(p, 'box', 0.84, 0.03, 0.06, CHROME, at=(0, 0.87, 0.04))


@model('extras/buero/computer')
def computer(p, root):
    c = 0xdfd3b8
    put(p, 'box', 0.22, 0.03, 0.2, c, bevel=0.01, at=(0, 0.015, -0.05))
    put(p, 'box', 0.1, 0.05, 0.1, c, at=(0, 0.05, -0.05))
    put(p, 'box', 0.38, 0.32, 0.3, c, bevel=0.03, at=(0, 0.23, -0.02))
    hull(p, [(sx * 0.14, 0.23 + sy * 0.11, -0.3) for sx in (-1, 1) for sy in (-1, 1)] + [(sx * 0.17, 0.23 + sy * 0.14, -0.15) for sx in (-1, 1) for sy in (-1, 1)], c)
    put(p, 'box', 0.3, 0.23, 0.012, 0x1e5f5f, bevel=0.004, at=(0, 0.245, 0.13))
    for k in range(4): put(p, 'box', 0.06 + 0.05 * (k % 3), 0.012, 0.004, 0x55efc4, at=(-0.11 + 0.025 * (k % 3) + 0.03, 0.32 - k * 0.03, 0.137))
    put(p, 'box', 0.02, 0.012, 0.004, 0x55efc4, at=(-0.12, 0.2, 0.137))
    put(p, 'box', 0.012, 0.012, 0.006, 0x2ecc71, at=(0.15, 0.09, 0.131))
    put(p, 'box', 0.42, 0.03, 0.15, c, bevel=0.01, at=(0, 0.015, 0.26), rot=(-0.06, 0, 0))
    for r in range(3): put(p, 'box', 0.36, 0.012, 0.03, dk(c, 0.75), at=(0, 0.035 - r * 0.003, 0.22 + r * 0.04), rot=(-0.06, 0, 0))
    put(p, 'ball', 0.035, c, uv=(6, 4), scale=(0.8, 0.45, 1.2), at=(0.3, 0.015, 0.26))
    tube(p, [(0.3, 0.02, 0.21), (0.29, 0.01, 0.12), (0.23, 0.01, 0.05)], 0.004, DARK, ring=3)


# ================================================================ Einkaufsstraße
@model('extras/strasse/ampel')
def ampel(p, root):
    g, h = 0x636e72, 0x2d3436
    rcyl(p, 0.14, 0.12, g, at=(0, 0.06, 0), seg=8, b=0.02)
    rod(p, (0, 0, 0), (0, 2.45, 0), 0.06, g, seg=8)
    put(p, 'box', 0.3, 0.86, 0.22, h, bevel=0.03, at=(0, 2.85, 0.08))
    put(p, 'box', 0.42, 1.0, 0.03, DARK, bevel=0.01, at=(0, 2.85, -0.04))
    for i, (c, on) in enumerate(((0xe74c3c, 1), (0xf1c40f, 0), (0x2ecc71, 0))):
        y = 3.12 - i * 0.27
        put(p, 'cyl', 0.095, 0.095, 0.02, c if on else dk(c, 0.45), seg=10, at=(0, y, 0.2), rot=AZ)
        put(p, 'box', 0.24, 0.02, 0.12, h, at=(0, y + 0.11, 0.25), rot=(0.25, 0, 0))
    put(p, 'box', 0.14, 0.22, 0.1, YEL, bevel=0.02, at=(0, 1.05, 0.1))
    put(p, 'box', 0.08, 0.04, 0.02, DARK, at=(0, 1.1, 0.155))
    put(p, 'cyl', 0.025, 0.025, 0.02, RED, seg=6, at=(0, 1.0, 0.155), rot=AZ)
    put(p, 'cyl', 0.07, 0.07, 0.04, h, seg=8, at=(0, 3.32, 0.08))


@model('extras/strasse/litfasssaeule')
def litfasssaeule(p, root):
    g = 0x2e7d32
    lth(p, [(0.72, 0), (0.72, 0.12), (0.64, 0.18), (0.6, 0.25)], g, seg=12)
    put(p, 'cyl', 0.6, 0.6, 2.4, 0xf5f6fa, seg=12, at=(0, 1.45, 0))
    lth(p, [(0.62, 2.62), (0.72, 2.7), (0.72, 2.8), (0.5, 3.0), (0.2, 3.12), (0.0, 3.15)], g, seg=12)
    put(p, 'ball', 0.09, BRASS, uv=(6, 4), at=(0, 3.2, 0))
    cols = (0xe17055, 0x0984e3, YEL, 0x6c5ce7, 0x00b894, 0xff7675)
    for i in range(6):
        a = i * PI / 3 + PI / 12
        m = RY(-a + PI / 2)
        ox, oz = math.cos(a) * 0.61, math.sin(a) * 0.61
        put(p, 'box', 0.56, 1.25, 0.02, cols[i], at=(ox, 1.55, oz), m=m)
        put(p, 'box', 0.4, 0.3, 0.025, WHITE, at=(ox, 1.85, oz), m=m)
        put(p, 'box', 0.3, 0.06, 0.03, DARK, at=(ox, 1.3, oz), m=m)
        put(p, 'ball', 0.13, cols[(i + 2) % 6], uv=(6, 3), scale=(1, 1, 0.12), at=(math.cos(a) * 0.625, 1.55, math.sin(a) * 0.625), m=m)


@model('extras/strasse/briefkasten')
def briefkasten(p, root):
    y0 = 0.9
    rod(p, (0, 0, 0), (0, y0, 0), 0.04, METAL, seg=6)
    put(p, 'box', 0.16, 0.04, 0.16, METAL, at=(0, 0.02, 0))
    put(p, 'box', 0.42, 0.42, 0.26, 0xf9ca24, bevel=0.025, at=(0, y0 + 0.21, 0))
    put(p, 'cyl', 0.21, 0.21, 0.26, 0xf9ca24, seg=12, at=(0, y0 + 0.42, 0), rot=AZ)
    put(p, 'box', 0.44, 0.02, 0.28, dk(0xf9ca24, 0.8), at=(0, y0 + 0.42, 0))
    put(p, 'box', 0.26, 0.03, 0.03, DARK, at=(0, y0 + 0.5, 0.125))
    put(p, 'box', 0.3, 0.012, 0.06, dk(0xf9ca24, 0.8), at=(0, y0 + 0.54, 0.15), rot=(0.4, 0, 0))
    put(p, 'torus', 0.05, 0.012, DARK, seg=8, ring=3, at=(0, y0 + 0.25, 0.132), rot=(PI / 2, 0, 0))
    put(p, 'cone', 0.03, 0.06, DARK, seg=6, at=(0.07, y0 + 0.25, 0.135), rot=(0, 0, -PI / 2))
    put(p, 'box', 0.16, 0.1, 0.01, WHITE, at=(0, y0 + 0.08, 0.131))
    for k in range(3): put(p, 'box', 0.11, 0.008, 0.004, DARK, at=(0, y0 + 0.11 - k * 0.025, 0.137))


@model('extras/strasse/parkuhr')
def parkuhr(p, root):
    rod(p, (0, 0, 0), (0, 1.05, 0), 0.035, METAL, seg=6)
    put(p, 'cyl', 0.09, 0.1, 0.04, DARK, seg=8, at=(0, 0.02, 0))
    put(p, 'box', 0.08, 0.06, 0.08, METAL, at=(0, 1.06, 0))
    hull(p, [(sx * 0.13, y, sz * 0.09) for sx in (-1, 1) for sz in (-1, 1) for y in (1.09, 1.33)] + [(sx * 0.09, 1.42, sz * 0.09) for sx in (-1, 1) for sz in (-1, 1)], 0x7f8c8d)
    put(p, 'cyl', 0.07, 0.07, 0.02, WHITE, seg=10, at=(0, 1.29, 0.09), rot=AZ)
    put(p, 'box', 0.012, 0.06, 0.006, DARK, at=(0.015, 1.31, 0.1), rot=(0, 0, -0.5))
    put(p, 'box', 0.06, 0.03, 0.01, RED, at=(-0.03, 1.27, 0.101), rot=(0, 0, 0.3))
    put(p, 'box', 0.04, 0.006, 0.02, DARK, at=(0, 1.39, 0.08))
    put(p, 'cyl', 0.022, 0.022, 0.03, BRASS, seg=6, at=(0.09, 1.17, 0.09), rot=AZ)
    put(p, 'box', 0.14, 0.05, 0.012, BLUE, at=(0, 1.15, 0.091))


@model('extras/strasse/telefonzelle')
def telefonzelle(p, root):
    c, w, h = 0xf9ca24, 1.0, 2.3
    put(p, 'box', w + 0.1, 0.08, w + 0.1, DSTONE, bevel=0.02, at=(0, 0.04, 0))
    for sx in (-1, 1):
        for sz in (-1, 1): put(p, 'box', 0.08, h, 0.08, c, bevel=0.01, at=(sx * (w / 2 - 0.04), 0.08 + h / 2, sz * (w / 2 - 0.04)))
    for ry in (0, PI / 2, PI, -PI / 2):  # Glaswände mit Sprossen
        m = RY(ry); L = lambda x, y, z: tuple(m.to_3x3() @ Vector((x, y, z)))
        put(p, 'box', w - 0.16, 1.7, 0.02, GLASS, at=L(0, 1.25, w / 2 - 0.04), m=m)
        put(p, 'box', w - 0.16, 0.5, 0.04, c, at=L(0, 0.33, w / 2 - 0.04), m=m)
        for y in (0.82, 1.4, 1.98): put(p, 'box', w - 0.16, 0.04, 0.04, c, at=L(0, y, w / 2 - 0.04), m=m)
        put(p, 'box', 0.04, 1.7, 0.04, c, at=L(0, 1.25, w / 2 - 0.04), m=m)
    put(p, 'box', 0.1, 0.03, 0.05, DARK, at=(0.3, 1.2, w / 2 - 0.0))
    put(p, 'box', w + 0.08, 0.25, w + 0.08, c, bevel=0.02, at=(0, h + 0.2, 0))
    for ry in (0, PI / 2, PI, -PI / 2):
        m = RY(ry); v = m.to_3x3() @ Vector((0, h + 0.2, w / 2 + 0.045))
        put(p, 'box', 0.7, 0.14, 0.01, WHITE, at=tuple(v), m=m)
        for k in range(4): put(p, 'box', 0.1, 0.07, 0.006, DARK, at=tuple(m.to_3x3() @ Vector((-0.24 + k * 0.16, h + 0.2, w / 2 + 0.051))), m=m)
    put(p, 'box', w, 0.06, w, dk(c, 0.8), at=(0, h + 0.35, 0))
    put(p, 'box', 0.3, 0.4, 0.15, DARK, bevel=0.02, at=(0, 1.35, -w / 2 + 0.15))
    put(p, 'box', 0.22, 0.06, 0.07, 0x636e72, bevel=0.02, at=(0, 1.5, -w / 2 + 0.25))
    tube(p, [(-0.1, 1.48, -w / 2 + 0.26), (-0.16, 1.3, -w / 2 + 0.25), (-0.1, 1.2, -w / 2 + 0.23)], 0.008, DARK, ring=3)


@model('extras/strasse/kaugummiautomat')
def kaugummiautomat(p, root):
    lth(p, [(0.2, 0), (0.2, 0.04), (0.08, 0.1), (0.06, 0.7), (0.12, 0.78), (0.14, 0.84)], RED, seg=10)
    put(p, 'box', 0.18, 0.16, 0.12, RED, bevel=0.03, at=(0, 0.88, 0.04))
    put(p, 'cyl', 0.045, 0.045, 0.03, CHROME, seg=10, at=(0, 0.9, 0.11), rot=AZ)
    put(p, 'box', 0.06, 0.012, 0.012, DARK, at=(0, 0.9, 0.13))
    put(p, 'box', 0.08, 0.05, 0.05, CHROME, at=(0, 0.83, 0.1))
    put(p, 'ball', 0.19, 0xdff3ff, uv=(10, 7), at=(0, 1.15, 0))
    cols = (RED, YEL, BLUE, 0x2ecc71, PINK, ORANGE)
    n = 26
    for i in range(n):  # Kaugummikugeln, gleichmäßig (Fibonacci) auf der unteren 3/4-Kugel
        yy = -0.95 + 1.55 * (i + 0.5) / n; rr = math.sqrt(1 - yy * yy); a = i * 2.39996
        put(p, 'ball', 0.042, cols[i % 6], uv=(5, 3), at=(math.cos(a) * rr * 0.165, 1.15 + yy * 0.165, math.sin(a) * rr * 0.165))
    put(p, 'cyl', 0.12, 0.13, 0.05, RED, seg=10, at=(0, 1.34, 0))
    put(p, 'ball', 0.04, CHROME, uv=(6, 3), at=(0, 1.38, 0))


@model('extras/strasse/verkehrsschild')
def verkehrsschild(p, root):
    rod(p, (0, 0, 0), (0, 2.35, 0), 0.035, METAL, seg=6)
    put(p, 'ball', 0.04, DARK, uv=(6, 3), at=(0, 2.36, 0))
    put(p, 'cyl', 0.3, 0.3, 0.02, RED, seg=16, at=(0, 2.05, 0.05), rot=AZ)
    put(p, 'cyl', 0.24, 0.24, 0.026, WHITE, seg=16, at=(0, 2.05, 0.05), rot=AZ)
    put(p, 'ball', 0.06, 0x8d5524, uv=(8, 4), scale=(1.2, 1, 0.12), at=(-0.03, 2.0, 0.066))  # Pfote
    for k in range(3): put(p, 'ball', 0.025, 0x8d5524, uv=(5, 3), scale=(1, 1, 0.3), at=(-0.09 + k * 0.06, 2.09 + 0.02 * (k == 1), 0.066))
    put(p, 'box', 0.46, 0.3, 0.02, BLUE, bevel=0.005, at=(0, 1.55, 0.05))
    put(p, 'box', 0.4, 0.24, 0.022, WHITE, at=(0, 1.55, 0.05))
    put(p, 'box', 0.36, 0.2, 0.024, BLUE, at=(0, 1.55, 0.05))
    put(p, 'box', 0.035, 0.15, 0.026, WHITE, at=(-0.04, 1.55, 0.052))
    for y in (1.61, 1.555): put(p, 'box', 0.1, 0.03, 0.026, WHITE, at=(0.0, y, 0.052))
    put(p, 'box', 0.03, 0.085, 0.026, WHITE, at=(0.045, 1.5825, 0.052))
    for y in (2.05, 1.55): put(p, 'box', 0.08, 0.04, 0.06, METAL, at=(0, y, 0.01))


# ================================================================ Grillpark
@model('extras/park/kugelgrill')
def kugelgrill(p, root):
    lth(p, [(0.05, 0.5), (0.2, 0.55), (0.28, 0.66), (0.3, 0.8), (0.29, 0.82)], DARK, seg=12)
    for k in range(3):
        a = k * 2 * PI / 3 + PI / 2
        rod(p, (math.cos(a) * 0.16, 0.58, math.sin(a) * 0.16), (math.cos(a) * 0.3, 0.0, math.sin(a) * 0.3), 0.018, METAL, seg=5)
    for s in (-1, 1): rcyl(p, 0.08, 0.035, DARK, at=(s * 0.27, 0.08, -0.17), rot=AX, seg=8, b=0.01)
    rod(p, (-0.29, 0.08, -0.17), (0.29, 0.08, -0.17), 0.01, METAL, seg=4)
    put(p, 'cyl', 0.2, 0.22, 0.015, METAL, seg=10, at=(0, 0.3, 0))
    lth(p, [(0.1, 0.38), (0.12, 0.33), (0.08, 0.31)], CHROME, seg=8)
    for k in range(7): put(p, 'box', 0.56 - abs(k - 3) * 0.06, 0.008, 0.008, CHROME, at=(0, 0.825, -0.21 + k * 0.07))
    for i, (x, z) in enumerate([(-0.1, -0.06), (0.0, -0.08), (0.1, -0.06)]):
        put(p, 'cyl', 0.03, 0.03, 0.22, 0xb5651d, seg=6, at=(x, 0.86, z + 0.03), rot=(PI / 2, 0, 0))
        for s in (-1, 1): put(p, 'ball', 0.03, 0xb5651d, uv=(6, 3), at=(x, 0.86, z + 0.03 + s * 0.11))
    for k in range(3): put(p, 'box', 0.012, 0.006, 0.14, DARK, at=(-0.13 + k * 0.1, 0.892, -0.03), rot=(0, 0.2 * (k - 1), 0))
    put(p, 'ball', 0.07, LEAF, uv=(6, 3), scale=(1, 0.5, 1), at=(0.12, 0.84, 0.13))
    lid = [(0.3, 0), (0.29, 0.1), (0.22, 0.2), (0.1, 0.26), (0, 0.27)]
    lth(p, lid, DARK, at=(0.345, 0.6, 0.0), rot=(0, 0, -1.35), seg=12)
    put(p, 'box', 0.03, 0.08, 0.1, CHROME, at=(0.32, 0.78, 0.0), rot=(0, 0, -0.3))
    rod(p, (0.29, 0.8, 0), (0.33, 0.85, 0), 0.01, CHROME, seg=4)


@model('extras/park/schaukel')
def schaukel(p, root):
    H, W = 2.2, 1.2
    for s in (-1, 1):
        for z in (-1, 1): rod(p, (s * W, 0, z * 0.75), (s * W, H, 0), 0.06, WOOD, seg=6)
        rod(p, (s * W, 0.8, -0.48), (s * W, 0.8, 0.48), 0.04, DWOOD, seg=5)
    put(p, 'box', 2.65, 0.14, 0.14, WOOD, bevel=0.02, at=(0, H + 0.04, 0))
    for s in (-1, 1): put(p, 'box', 0.03, 0.02, 0.16, METAL, at=(s * 0.55 + 0.22, H - 0.04, 0))
    for i, (x, c) in enumerate(((-0.55, RED), (0.55, BLUE))):
        n = Node('schaukel%d' % (i + 1), root, (x, H - 0.03, 0)); q = Part('schaukel%d-m' % (i + 1), n)
        for sx in (-0.22, 0.22): rod(q, (sx, 0, 0), (sx, -1.72, 0), 0.012, ROPE, seg=4)
        put(q, 'box', 0.5, 0.05, 0.22, c, bevel=0.015, at=(0, -1.75, 0))
        q.done()


@model('extras/park/wippe')
def wippe(p, root):
    put(p, 'box', 0.36, 0.08, 0.5, DSTONE, bevel=0.02, at=(0, 0.04, 0))
    hull(p, [(sx * 0.1, 0.08, sz * 0.2) for sx in (-1, 1) for sz in (-1, 1)] + [(sx * 0.06, 0.42, sz * 0.2) for sx in (-1, 1) for sz in (-1, 1)], YEL)
    put(p, 'cyl', 0.05, 0.05, 0.44, METAL, seg=8, at=(0, 0.45, 0), rot=AZ)
    for s in (-1, 1):
        put(p, 'torus', 0.14, 0.06, DARK, seg=10, ring=5, at=(s * 1.45, 0.045, 0))
    w = Node('brett', root, (0, 0.45, 0)); q = Part('brett-m', w)
    put(q, 'box', 3.2, 0.08, 0.3, 0x0984e3, bevel=0.02, at=(0, 0.06, 0))
    for s in (-1, 1):
        put(q, 'box', 0.4, 0.06, 0.32, RED, bevel=0.02, at=(s * 1.3, 0.13, 0))
        rod(q, (s * 1.05, 0.1, -0.12), (s * 1.05, 0.42, -0.12), 0.02, YEL, seg=5)
        rod(q, (s * 1.05, 0.1, 0.12), (s * 1.05, 0.42, 0.12), 0.02, YEL, seg=5)
        rod(q, (s * 1.05, 0.42, -0.2), (s * 1.05, 0.42, 0.2), 0.025, DARK, seg=5)
    q.done()


@model('extras/park/rutsche')
def rutsche(p, root):
    F, S, PH = BLUE, RED, 1.5
    pz = -0.6
    for sx in (-1, 1):
        for sz in (-1, 1): rod(p, (sx * 0.35, 0, pz + sz * 0.35), (sx * 0.35, PH + 0.75, pz + sz * 0.35), 0.035, F, seg=6)
        rod(p, (sx * 0.35, PH + 0.5, pz - 0.35), (sx * 0.35, PH + 0.5, pz + 0.35), 0.025, F, seg=5)
    rod(p, (-0.35, PH + 0.5, pz - 0.35), (0.35, PH + 0.5, pz - 0.35), 0.025, F, seg=5)
    put(p, 'box', 0.76, 0.06, 0.76, YEL, bevel=0.015, at=(0, PH, pz))
    hull(p, [(sx * 0.45, PH + 0.75, pz + sz * 0.45) for sx in (-1, 1) for sz in (-1, 1)] + [(0, PH + 1.15, pz)], S)
    for sx in (-1, 1):  # Leiter hinten
        rod(p, (sx * 0.25, 0, -1.45), (sx * 0.25, PH + 0.3, pz - 0.35), 0.03, F, seg=5)
    for k in range(5):
        f = (k + 1) / 6; y = f * (PH + 0.3); z = -1.45 + f * (1.45 + pz - 0.35)
        rod(p, (-0.25, y, z), (0.25, y, z), 0.02, YEL, seg=4)
    a, b = (0, PH + 0.02, pz + 0.38), (0, 0.32, 1.45)
    d = (b[2] - a[2], b[1] - a[1]); L = math.hypot(*d); nz, ny = -d[1] / L, d[0] / L
    beam(p, a, b, 0.6, 0.04, S)
    for sx in (-1, 1): beam(p, (sx * 0.31, a[1] + ny * 0.08, a[2] + nz * 0.08), (sx * 0.31, b[1] + ny * 0.08, b[2] + nz * 0.08), 0.04, 0.18, S)
    put(p, 'box', 0.6, 0.04, 0.5, S, at=(0, 0.3, 1.7), rot=(0.05, 0, 0))
    for sx in (-1, 1):
        put(p, 'box', 0.04, 0.18, 0.5, S, at=(sx * 0.31, 0.38, 1.7))
        rod(p, (sx * 0.25, 0, 1.75), (sx * 0.25, 0.29, 1.75), 0.03, F, seg=5)


@model('extras/park/picknickkorb')
def picknickkorb(p, root):
    wk, dw = 0xd4a35a, 0xa87532
    put(p, 'box', 0.46, 0.26, 0.32, wk, bevel=0.025, at=(0, 0.13, 0))
    for k in range(4): put(p, 'box', 0.465, 0.012, 0.325, dw, at=(0, 0.04 + k * 0.06, 0))
    put(p, 'box', 0.47, 0.03, 0.165, wk, bevel=0.01, at=(0, 0.275, -0.08))  # hinterer Deckel zu
    th = 1.0  # vorderer Deckel aufgeklappt (Scharnier entlang x in der Mitte)
    put(p, 'box', 0.47, 0.03, 0.165, wk, bevel=0.01, at=(0, 0.275 + 0.0825 * math.sin(th), 0.0825 * math.cos(th)), rot=(-th, 0, 0))
    for k in range(3): put(p, 'box', 0.08, 0.1, 0.012, RED if k % 2 == 0 else WHITE, at=(-0.16 + k * 0.08, 0.23, 0.166))  # Tuch über der Kante
    for k in range(3): put(p, 'box', 0.08, 0.012, 0.12, RED if k % 2 else WHITE, at=(-0.16 + k * 0.08, 0.262, 0.1))
    put(p, 'cyl', 0.035, 0.03, 0.34, 0xd9a066, seg=6, at=(0.07, 0.3, 0.07), rot=(0, 0, 1.1))
    lth(p, [(0.03, 0.2), (0.035, 0.32), (0.015, 0.36), (0.015, 0.4)], 0x1e8449, at=(0.15, 0, 0.06), seg=6)
    tube(p, [(-0.2, 0.27, 0), (-0.18, 0.43, 0), (0, 0.48, 0), (0.18, 0.43, 0), (0.2, 0.27, 0)], 0.015, dw, ring=4)


@model('extras/park/trinkbrunnen')
def trinkbrunnen(p, root):
    put(p, 'box', 0.7, 0.08, 0.5, DSTONE, bevel=0.02, at=(0, 0.04, 0.06))
    lth(p, [(0.15, 0.08), (0.13, 0.15), (0.11, 0.85), (0.15, 0.9)], STONE, seg=8)
    lth(p, [(0.1, 0.88), (0.24, 0.92), (0.26, 1.0), (0.22, 1.0), (0.2, 0.95)], STONE, seg=10)
    put(p, 'cyl', 0.21, 0.205, 0.02, WATER, seg=10, at=(0, 0.965, 0))
    put(p, 'cyl', 0.03, 0.03, 0.12, CHROME, seg=6, at=(0, 1.02, 0))
    rod(p, (0, 1.08, 0), (0, 1.1, 0.06), 0.015, CHROME, seg=5)
    put(p, 'cyl', 0.03, 0.03, 0.03, BLUE, seg=6, at=(0, 0.75, 0.12), rot=AZ)
    lth(p, [(0.1, 0.08), (0.14, 0.16), (0.12, 0.16), (0.1, 0.11)], RED, at=(0.17, 0, 0.17), seg=10)  # Hundenapf unten
    put(p, 'cyl', 0.115, 0.11, 0.02, WATER, seg=10, at=(0.17, 0.125, 0.17))
    for k in range(4): put(p, 'ball', 0.015, 0x8d5524, uv=(4, 3), scale=(1, 0.3, 1), at=(-0.2 + 0.03 * math.cos(k * 1.6), 0.083, 0.2 + 0.03 * math.sin(k * 1.6)))
    put(p, 'ball', 0.025, 0x8d5524, uv=(5, 3), scale=(1, 0.3, 1.1), at=(-0.2, 0.083, 0.2))


@model('extras/park/karussell')
def karussell(p, root):
    put(p, 'cyl', 1.05, 1.1, 0.06, DSTONE, seg=14, at=(0, 0.03, 0))
    put(p, 'cyl', 0.12, 0.15, 0.12, DARK, seg=8, at=(0, 0.1, 0))
    d = Node('dreh', root, (0, 0.12, 0)); q = Part('dreh-m', d)
    cols = (RED, YEL, BLUE, 0x2ecc71, RED, YEL)
    for i in range(6):
        a0 = i * PI / 3
        hull(q, [(0, y, 0) for y in (0.08, 0.14)] + [(math.cos(a0 + k * PI / 6) * 1.0, y, math.sin(a0 + k * PI / 6) * 1.0) for k in (0, 1, 2) for y in (0.08, 0.14)], cols[i])
    put(q, 'cyl', 1.02, 1.02, 0.04, METAL, seg=14, at=(0, 0.06, 0))
    rod(q, (0, 0.14, 0), (0, 0.85, 0), 0.05, METAL, seg=8)
    put(q, 'ball', 0.08, RED, uv=(6, 4), at=(0, 0.88, 0))
    for i in range(3):
        a = i * 2 * PI / 3 + PI / 6
        x, z = math.cos(a) * 0.82, math.sin(a) * 0.82
        rod(q, (x, 0.14, z), (x * 0.8, 0.72, z * 0.8), 0.025, YEL, seg=5)
        rod(q, (x * 0.8, 0.72, z * 0.8), (0, 0.8, 0), 0.025, YEL, seg=5)
        a2 = a + 2 * PI / 3; x2, z2 = math.cos(a2) * 0.82 * 0.8, math.sin(a2) * 0.82 * 0.8
        rod(q, (x * 0.8, 0.6, z * 0.8), (x2, 0.6, z2), 0.02, YEL, seg=5)
    q.done()


# ================================================================ Dorf
@model('extras/dorf/milchkannen')
def milchkannen(p, root):
    put(p, 'box', 1.1, 0.06, 0.5, LWOOD, bevel=0.01, at=(0, 0.5, 0))
    for x in (-0.48, 0.48):
        for z in (-0.2, 0.2): put(p, 'box', 0.07, 0.47, 0.07, WOOD, at=(x, 0.235, z))
    put(p, 'box', 0.98, 0.04, 0.04, WOOD, at=(0, 0.15, 0.2))
    prof = [(0.12, 0), (0.15, 0.02), (0.15, 0.36), (0.07, 0.48), (0.07, 0.54), (0.085, 0.56), (0.085, 0.6)]
    for x, y, k in ((-0.28, 0.53, 1), (0.05, 0.53, 0.9), (0.8, 0, 1)):
        lth(p, [(r * k, h * k) for r, h in prof], CHROME, at=(x, y, 0), seg=10)
        put(p, 'cyl', 0.152 * k, 0.152 * k, 0.03, METAL, seg=10, at=(x, y + 0.3 * k, 0))
        put(p, 'ball', 0.04 * k, METAL, uv=(6, 3), scale=(1, 0.5, 1), at=(x, y + 0.61 * k, 0))
        for s in (-1, 1): put(p, 'torus', 0.04, 0.008, METAL, seg=6, ring=3, at=(x + s * 0.12 * k, y + 0.44 * k, 0), rot=(PI / 2, 0, s * 0.6))
    put(p, 'box', 0.05, 0.002, 0.05, WHITE, at=(0.2, 0.531, 0.1))


@model('extras/dorf/wassertrog')
def wassertrog(p, root):
    put(p, 'box', 1.6, 0.2, 0.6, STONE, bevel=0.03, at=(0, 0.15, 0))
    for s in (-1, 1):
        put(p, 'box', 1.6, 0.42, 0.09, STONE, bevel=0.03, at=(0, 0.34, s * 0.255))
        put(p, 'box', 0.09, 0.42, 0.6, STONE, bevel=0.03, at=(s * 0.755, 0.34, 0))
    put(p, 'box', 1.44, 0.3, 0.44, WATER, at=(0, 0.35, 0))
    for x in (-0.6, 0.6): put(p, 'box', 0.25, 0.1, 0.62, DSTONE, bevel=0.02, at=(x, 0.05, 0))
    for i, (x, z) in enumerate([(-0.3, 0.05), (0.35, -0.08)]): put(p, 'cyl', 0.07, 0.07, 0.008, 0x3d9a3d, seg=6, at=(x, 0.503, z))
    put(p, 'ball', 0.025, 0xff9ff3, uv=(5, 3), at=(-0.3, 0.52, 0.05))
    for i in range(5): put(p, 'ball', 0.08, (0x3d9a3d, 0x4caa4c)[i % 2], uv=(5, 3), scale=(1, 0.6, 1), at=(-0.75 + 0.06 * i, 0.04, 0.3 + 0.03 * (i % 2)))
    put(p, 'box', 0.3, 0.04, 0.6, WOOD, bevel=0.01, at=(0.5, 0.56, 0), rot=(0, 0.1, 0))


@model('extras/dorf/huehnerstall')
def huehnerstall(p, root):
    W, D, y0 = 1.3, 1.0, 0.45
    for sx in (-1, 1):
        for sz in (-1, 1): put(p, 'box', 0.08, y0, 0.08, DWOOD, at=(sx * (W / 2 - 0.05), y0 / 2, sz * (D / 2 - 0.05)))
    put(p, 'box', W + 0.04, 0.06, D + 0.04, DWOOD, at=(0, y0 + 0.03, 0))
    put(p, 'box', W, 0.7, D, 0xc0392b, bevel=0.02, at=(0, y0 + 0.41, 0))
    for k in range(5): put(p, 'box', W + 0.01, 0.015, D + 0.01, dk(0xc0392b, 0.8), at=(0, y0 + 0.14 + k * 0.14, 0))
    hull(p, [(sx * W / 2, y0 + 0.76, sz * D / 2) for sx in (-1, 1) for sz in (-1, 1)] + [(0, y0 + 1.1, sz * D / 2) for sz in (-1, 1)], 0xc0392b)
    roof2(p, W / 2, 0.34, D + 0.2, y0 + 0.76, 0x5d4037, t=0.04, o=0.12)
    put(p, 'box', 0.28, 0.36, 0.02, DARK, at=(0.3, y0 + 0.24, D / 2 + 0.005))
    for s in (-1, 1): put(p, 'box', 0.04, 0.4, 0.03, WHITE, at=(0.3 + s * 0.16, y0 + 0.26, D / 2 + 0.01))
    put(p, 'box', 0.36, 0.04, 0.03, WHITE, at=(0.3, y0 + 0.46, D / 2 + 0.01))
    put(p, 'box', 0.28, 0.2, 0.02, WHITE, at=(-0.3, y0 + 0.5, D / 2 + 0.005))
    put(p, 'box', 0.24, 0.16, 0.025, 0x9ad7ff, at=(-0.3, y0 + 0.5, D / 2 + 0.006))
    a, b = (0.3, y0 + 0.04, D / 2 + 0.05), (0.3, 0.0, D / 2 + 0.75)
    beam(p, a, b, 0.3, 0.03, LWOOD)
    for k in range(4):
        f = (k + 0.6) / 4.5; put(p, 'box', 0.3, 0.02, 0.03, DWOOD, at=(0.3, a[1] + (b[1] - a[1]) * f + 0.025, a[2] + (b[2] - a[2]) * f))
    put(p, 'box', 0.4, 0.3, 0.4, 0xc0392b, bevel=0.02, at=(-W / 2 - 0.2, y0 + 0.25, -0.1))
    put(p, 'box', 0.46, 0.04, 0.46, 0x5d4037, at=(-W / 2 - 0.2, y0 + 0.42, -0.1), rot=(0, 0, 0.2))
    for k in range(3): put(p, 'ball', 0.04, CREAM, uv=(6, 4), scale=(1, 1.25, 1), at=(-0.05 + k * 0.08, 0.04, D / 2 + 0.25 - 0.03 * k))
    put(p, 'ball', 0.1, 0xe1c16e, uv=(6, 3), scale=(1.6, 0.3, 1.2), at=(0.05, 0.03, D / 2 + 0.25))


@model('extras/dorf/schwengelpumpe')
def schwengelpumpe(p, root):
    g = 0x2e7d32
    put(p, 'box', 0.7, 0.12, 0.7, STONE, bevel=0.03, at=(0, 0.06, 0))
    lth(p, [(0.12, 0.12), (0.1, 0.2), (0.08, 0.95), (0.1, 1.0), (0.1, 1.1), (0.06, 1.16), (0.03, 1.22)], g, seg=10)
    for y in (0.3, 0.9): put(p, 'cyl', 0.1, 0.1, 0.03, dk(g, 0.75), seg=10, at=(0, y, 0))
    rod(p, (0, 0.82, 0.05), (0, 0.78, 0.3), 0.035, g, seg=6, rt=0.03)
    put(p, 'cyl', 0.035, 0.04, 0.06, g, seg=6, at=(0, 0.75, 0.3))
    put(p, 'ball', 0.04, BRASS, uv=(6, 3), at=(0, 1.24, 0))
    lth(p, [(0.1, 0.12), (0.12, 0.14), (0.14, 0.38), (0.15, 0.4), (0.13, 0.4)], WOOD, at=(0, 0, 0.3), seg=10)
    put(p, 'cyl', 0.135, 0.135, 0.01, WATER, seg=10, at=(0, 0.36, 0.3))
    for y in (0.2, 0.34): put(p, 'cyl', 0.145, 0.145, 0.02, METAL, seg=10, at=(0, y, 0.3))
    put(p, 'box', 0.1, 0.06, 0.08, g, at=(0, 1.1, -0.1))
    s = Node('schwengel', root, (0, 1.12, -0.12)); q = Part('schwengel-m', s)
    for x in (-0.03, 0.03): put(q, 'box', 0.015, 0.06, 0.08, g, at=(x, 0, 0.0))
    rod(q, (0, 0, 0.02), (0, 0.2, -0.65), 0.025, g, seg=6)
    put(q, 'ball', 0.04, DARK, uv=(6, 4), scale=(1, 1, 1.3), at=(0, 0.2, -0.67))
    rod(q, (0, -0.02, 0.06), (0, -0.25, 0.08), 0.015, METAL, seg=4)
    q.done()


@model('extras/dorf/hofladen')
def hofladen(p, root):
    W = 1.7
    for x in (-W / 2 + 0.05, W / 2 - 0.05):
        put(p, 'box', 0.08, 1.9, 0.08, WOOD, at=(x, 0.95, -0.3))
        put(p, 'box', 0.08, 0.9, 0.08, WOOD, at=(x, 0.45, 0.3))
    put(p, 'box', W, 0.05, 0.7, LWOOD, bevel=0.01, at=(0, 0.9, 0))
    put(p, 'box', W, 0.04, 0.6, LWOOD, at=(0, 0.3, 0))
    put(p, 'box', W, 0.4, 0.03, WOOD, at=(0, 0.6, 0.33))
    for k in range(3): put(p, 'box', W - 0.02, 0.012, 0.035, dk(WOOD, 0.8), at=(0, 0.48 + k * 0.12, 0.335))
    put(p, 'box', W, 0.25, 0.03, WOOD, at=(0, 1.35, -0.33))
    roof = [(-W / 2 - 0.1, 1.9, -0.45), (W / 2 + 0.1, 1.9, -0.45), (-W / 2 - 0.1, 1.55, 0.55), (W / 2 + 0.1, 1.55, 0.55)]
    hull(p, roof + [(x, y + 0.05, z) for x, y, z in roof], ROOF0)
    for k in range(5): put(p, 'box', W + 0.2, 0.02, 0.05, dk(ROOF0, 0.8), at=(0, 1.88 - k * 0.07 + 0.04, -0.45 + k * 0.2 + 0.1), rot=(math.atan2(0.35, 1.0), 0, 0))
    for x in (-W / 2 + 0.05, W / 2 - 0.05): rod(p, (x, 0.9, 0.3), (x, 1.6, 0.4), 0.03, WOOD, seg=5)
    def kiste(x, z, c, n):
        put(p, 'box', 0.4, 0.14, 0.3, WOOD, bevel=0.01, at=(x, 0.995, z))
        for i in range(n):
            put(p, 'ball', 0.055, c, uv=(5, 3), at=(x - 0.13 + (i % 3) * 0.13, 1.08, z - 0.07 + (i // 3) * 0.13))
    kiste(-0.55, 0.05, RED, 6); kiste(-0.1, 0.05, 0x7bc043, 6)
    for i in range(6): put(p, 'cone', 0.03, 0.18, ORANGE, seg=5, at=(0.3 + (i % 3) * 0.08, 0.96, 0.0 + (i // 3) * 0.1), rot=(PI / 2, 0, 0.15 * i))
    put(p, 'box', 0.2, 0.07, 0.14, 0x95a5a6, bevel=0.01, at=(0.65, 0.96, 0.1))
    for i in range(6): put(p, 'ball', 0.025, CREAM, uv=(5, 4), scale=(1, 1.25, 1), at=(0.6 + (i % 3) * 0.045, 1.01, 0.07 + (i // 3) * 0.06))
    put(p, 'box', 0.14, 0.1, 0.1, 0x2d3436, bevel=0.01, at=(0.6, 0.97, -0.2))
    put(p, 'box', 0.06, 0.006, 0.01, BRASS, at=(0.6, 1.023, -0.2))
    put(p, 'box', 0.6, 0.4, 0.03, DARK, at=(0, 1.35, -0.31))
    for k in range(3): put(p, 'box', 0.4 - k * 0.08, 0.025, 0.005, WHITE, at=(0, 1.45 - k * 0.08, -0.293))
    for i in range(3): put(p, 'ball', 0.1, 0xe1c16e, uv=(6, 4), jitter=0.1, seed=i, scale=(1.1, 0.8, 1), at=(-0.5 + i * 0.4, 0.4, 0.0))


@model('extras/dorf/hackklotz')
def hackklotz(p, root):
    lth(p, [(0.33, 0), (0.3, 0.05), (0.28, 0.45), (0.27, 0.5)], BARK, seg=9)
    put(p, 'cyl', 0.26, 0.26, 0.01, CUT, seg=9, at=(0, 0.5, 0))
    for r in (0.08, 0.17): put(p, 'torus', r, 0.004, dk(CUT, 0.8), seg=9, ring=3, at=(0, 0.505, 0))
    rod(p, (0.03, 0.55, 0.03), (0.22, 0.95, 0.12), 0.022, LWOOD, seg=6)
    hull(p, [(dx, y, z) for dx in (-0.012, 0.012) for y, z in ((-0.06, -0.08), (-0.06, 0.08), (0.05, 0.05), (0.05, -0.03))], METAL, at=(0.03, 0.53, 0.03), rot=(0, -0.45, -0.4))
    for i in range(5):
        a = i * 1.3 + 0.5; x, z = math.cos(a) * 0.6, math.sin(a) * 0.55
        pts = [(xx, yy, zz) for xx, zz in ((-0.08, -0.06), (0.08, -0.06), (0.0, 0.08)) for yy in (0, 0.42)]
        hull(p, pts, CUT if i % 2 else 0xc8a87a, at=(x, 0.08, z), m=RY(a) @ RX(PI / 2)) if i < 3 else hull(p, pts, CUT if i % 2 else 0xc8a87a, at=(x, 0.0, z), m=RY(a))
    for i in range(7):
        a = i * 0.9; put(p, 'box', 0.06, 0.012, 0.03, CUT, at=(math.cos(a) * 0.4, 0.006, math.sin(a) * 0.38), rot=(0, a, 0))


@model('extras/dorf/wetterhahn')
def wetterhahn(p, root):
    put(p, 'box', 0.3, 0.3, 0.3, STONE, bevel=0.03, at=(0, 0.15, 0))
    rod(p, (0, 0.3, 0), (0, 2.3, 0), 0.025, DARK, seg=6)
    for ry, (a, b) in ((0, ('N', 'S')), (PI / 2, ('O', 'W'))):
        put(p, 'box', 0.7, 0.02, 0.02, DARK, at=(0, 1.9, 0), rot=(0, ry, 0))
        for s in (-1, 1):
            put(p, 'ball', 0.04, BRASS, uv=(5, 3), at=(s * 0.35 * math.cos(ry), 1.9, -s * 0.35 * math.sin(ry)))
    put(p, 'ball', 0.04, BRASS, uv=(6, 3), at=(0, 2.0, 0))
    h = Node('hahn', root, (0, 2.3, 0)); q = Part('hahn-m', h)
    t = 0.015
    def flat(pts, c):
        hull(q, [(x, y, dz) for x, y in pts for dz in (-t, t)], c)
    G = BRASS
    flat([(-0.15, 0.05), (0.12, 0.05), (0.18, 0.18), (0.05, 0.22), (-0.15, 0.15)], G)  # Körper
    flat([(0.12, 0.15), (0.2, 0.15), (0.22, 0.32), (0.13, 0.3)], G)  # Hals/Kopf
    flat([(0.14, 0.32), (0.18, 0.37), (0.22, 0.32)], RED)  # Kamm
    flat([(0.22, 0.26), (0.28, 0.27), (0.22, 0.29)], ORANGE)  # Schnabel
    flat([(-0.14, 0.12), (-0.3, 0.38), (-0.22, 0.4), (-0.08, 0.2)], G)  # Schwanzfedern
    flat([(-0.16, 0.08), (-0.34, 0.25), (-0.3, 0.3), (-0.12, 0.14)], dk(G, 0.85))
    flat([(-0.02, 0.0), (0.02, 0.0), (0.02, 0.06), (-0.02, 0.06)], DARK)
    put(q, 'ball', 0.012, DARK, uv=(4, 3), at=(0.18, 0.28, 0.016))
    put(q, 'ball', 0.012, DARK, uv=(4, 3), at=(0.18, 0.28, -0.016))
    put(q, 'cone', 0.03, 0.08, G, seg=6, at=(0.36, 0.0, 0), rot=(0, 0, -PI / 2))
    rod(q, (-0.4, 0.0, 0), (0.33, 0.0, 0), 0.008, G, seg=4)
    flat([(-0.4, -0.06), (-0.3, -0.06), (-0.3, 0.06), (-0.4, 0.06)], G)
    q.done()


# ================================================================ Hafen
@model('extras/hafen/fischkiste')
def fischkiste(p, root):
    c = 0x0984e3
    put(p, 'box', 0.62, 0.25, 0.42, c, bevel=0.02, at=(0, 0.125, 0))
    for s in (-1, 1): put(p, 'box', 0.03, 0.05, 0.14, DARK, at=(s * 0.312, 0.19, 0))
    for k in range(3): put(p, 'box', 0.63, 0.012, 0.43, dk(c, 0.8), at=(0, 0.05 + k * 0.06, 0))
    put(p, 'box', 0.56, 0.02, 0.36, WHITE, at=(0, 0.25, 0))
    for i, (x, z, r, col) in enumerate([(-0.12, -0.09, 0.2, 0x95a5a6), (0.1, 0.07, -0.15, 0xb2bec3), (-0.1, 0.09, 0.1, 0xe17055), (0.13, -0.09, 0.4, 0x95a5a6)]):
        put(p, 'ball', 0.075, col, uv=(6, 3), scale=(1.5, 0.4, 0.55), at=(x, 0.285, z), rot=(0, r, 0))
        m = RY(r)
        tx = tuple(m.to_3x3() @ Vector((-0.095, 0, 0)))
        hull(p, [(0, 0, 0), (-0.06, 0.0, 0.04), (-0.06, 0.0, -0.04), (0, 0.02, 0), (-0.06, 0.02, 0.04), (-0.06, 0.02, -0.04)], col, at=(x + tx[0], 0.275, z + tx[2]), rot=(0, r, 0))
        ex = tuple(m.to_3x3() @ Vector((0.08, 0, 0.0)))
        put(p, 'ball', 0.012, DARK, uv=(4, 3), at=(x + ex[0], 0.305, z + ex[2]))
    for i in range(4): put(p, 'ball', 0.035, WHITE, uv=(4, 3), jitter=0.2, seed=i, at=(-0.22 + i * 0.15, 0.27, 0.15 * (-1) ** i))


@model('extras/hafen/gabelstapler')
def gabelstapler(p, root):
    Y = 0xf1c40f
    put(p, 'box', 1.1, 0.5, 1.6, Y, bevel=0.06, at=(0, 0.5, -0.1))
    put(p, 'box', 1.12, 0.5, 0.4, DARK, bevel=0.08, at=(0, 0.6, -0.85))
    put(p, 'box', 0.9, 0.1, 0.8, DARK, at=(0, 0.8, -0.05))
    put(p, 'box', 0.5, 0.12, 0.45, DARK, bevel=0.04, at=(0, 0.9, -0.25))
    put(p, 'box', 0.5, 0.5, 0.1, DARK, bevel=0.04, at=(0, 1.15, -0.48), rot=(-0.15, 0, 0))
    put(p, 'box', 0.2, 0.3, 0.2, Y, bevel=0.03, at=(0, 0.95, 0.42))
    rod(p, (0, 1.05, 0.42), (0, 1.25, 0.32), 0.025, DARK, seg=5)
    put(p, 'torus', 0.14, 0.018, DARK, seg=10, ring=4, at=(0, 1.27, 0.3), rot=(-0.6, 0, 0))
    for sx in (-1, 1):
        for z in (-0.6, 0.5): rod(p, (sx * 0.5, 0.78, z), (sx * 0.5, 2.1, z * 0.9), 0.035, DARK, seg=6)
        rod(p, (sx * 0.5, 2.1, -0.54), (sx * 0.5, 2.1, 0.45), 0.035, DARK, seg=6)
    for k in range(4): rod(p, (-0.5, 2.1, -0.5 + k * 0.31), (0.5, 2.1, -0.5 + k * 0.31), 0.025, DARK, seg=5)
    put(p, 'cyl', 0.06, 0.06, 0.05, ORANGE, seg=8, at=(0, 2.16, -0.3))
    put(p, 'ball', 0.055, ORANGE, uv=(6, 3), at=(0, 2.2, -0.3))
    for sx in (-1, 1):
        for z, r in ((0.45, 0.28), (-0.65, 0.24)):
            rcyl(p, r, 0.24, DARK, at=(sx * 0.5, r, z), rot=AX, seg=10, b=0.04)
            put(p, 'cyl', r * 0.5, r * 0.5, 0.26, Y, seg=8, at=(sx * 0.5, r, z), rot=AX)
        put(p, 'box', 0.08, 2.4, 0.1, 0x636e72, at=(sx * 0.35, 1.2, 0.78))
    for y in (0.3, 1.2, 2.3): put(p, 'box', 0.78, 0.07, 0.08, 0x636e72, at=(0, y, 0.78))
    g = Node('gabel', root, (0, 0.0, 0.85)); q = Part('gabel-m', g)
    put(q, 'box', 0.85, 0.5, 0.06, DARK, at=(0, 0.35, 0.0))
    for k in range(4): put(q, 'box', 0.85, 0.02, 0.02, 0x636e72, at=(0, 0.15 + k * 0.13, 0.035))
    for sx in (-1, 1):
        put(q, 'box', 0.1, 0.5, 0.05, DARK, at=(sx * 0.25, 0.32, 0.05))
        put(q, 'box', 0.1, 0.05, 1.0, DARK, at=(sx * 0.25, 0.085, 0.55))
    q.done()
    put(p, 'box', 0.25, 0.08, 0.15, ORANGE, at=(0, 0.88, -1.05))


@model('extras/hafen/schiffsglocke')
def schiffsglocke(p, root):
    put(p, 'box', 0.9, 0.08, 0.4, DWOOD, bevel=0.02, at=(0, 0.04, 0))
    for s in (-1, 1):
        put(p, 'box', 0.1, 1.5, 0.1, WOOD, bevel=0.015, at=(s * 0.35, 0.79, 0))
        beam(p, (s * 0.35, 0.08, 0.17), (s * 0.35, 0.5, 0.04), 0.06, 0.06, WOOD)
        beam(p, (s * 0.35, 0.08, -0.17), (s * 0.35, 0.5, -0.04), 0.06, 0.06, WOOD)
    put(p, 'box', 0.9, 0.12, 0.14, WOOD, bevel=0.02, at=(0, 1.6, 0))
    put(p, 'box', 1.0, 0.04, 0.18, DWOOD, at=(0, 1.68, 0))
    tube(p, [(0.35, 0.9, 0.06), (0.3, 0.75, 0.08), (0.36, 0.6, 0.07)], 0.015, ROPE, ring=4)
    b = Node('glocke', root, (0, 1.54, 0)); q = Part('glocke-m', b)
    put(q, 'box', 0.08, 0.06, 0.08, DARK, at=(0, -0.03, 0))
    put(q, 'torus', 0.03, 0.01, DARK, seg=6, ring=3, at=(0, -0.01, 0), rot=(PI / 2, 0, 0))
    lth(q, [(0.17, -0.42), (0.16, -0.4), (0.12, -0.32), (0.1, -0.2), (0.09, -0.1), (0.06, -0.06), (0, -0.05)], BRASS, seg=12)
    put(q, 'cyl', 0.176, 0.176, 0.03, dk(BRASS, 0.8), seg=12, at=(0, -0.4, 0))
    rod(q, (0, -0.1, 0), (0, -0.4, 0), 0.008, DARK, seg=4)
    put(q, 'ball', 0.035, DARK, uv=(6, 4), at=(0, -0.42, 0))
    tube(q, [(0, -0.45, 0), (0.02, -0.6, 0.02), (0, -0.75, 0)], 0.012, ROPE, ring=4)
    put(q, 'ball', 0.03, ROPE, uv=(5, 3), at=(0, -0.78, 0))
    q.done()


@model('extras/hafen/container')
def container(p, root):
    c, L, H, W = 0xc0392b, 6.06, 2.59, 2.44
    put(p, 'box', L - 0.1, H - 0.1, W - 0.1, c, at=(0, H / 2, 0))
    for sx in (-1, 1):  # Eckpfosten und Rahmen
        for sz in (-1, 1):
            put(p, 'box', 0.16, H, 0.16, dk(c, 0.75), at=(sx * (L / 2 - 0.08), H / 2, sz * (W / 2 - 0.08)))
            for y in (0.07, H - 0.07): put(p, 'box', 0.18, 0.14, 0.18, METAL, at=(sx * (L / 2 - 0.08), y, sz * (W / 2 - 0.08)))
    for y in (0.07, H - 0.07):
        for sz in (-1, 1): put(p, 'box', L - 0.2, 0.14, 0.12, dk(c, 0.75), at=(0, y, sz * (W / 2 - 0.06)))
        for sx in (-1, 1): put(p, 'box', 0.12, 0.14, W - 0.2, dk(c, 0.75), at=(sx * (L / 2 - 0.06), y, 0))
    n = 16
    for k in range(n):  # Wellblech an den Längsseiten
        x = -L / 2 + 0.35 + k * (L - 0.7) / (n - 1)
        for sz in (-1, 1): put(p, 'box', 0.14, H - 0.3, 0.06, dk(c, 0.9), at=(x, H / 2, sz * (W / 2 - 0.03)))
    for k in range(5):
        z = -W / 2 + 0.35 + k * (W - 0.7) / 4
        put(p, 'box', 0.06, H - 0.3, 0.14, dk(c, 0.9), at=(-L / 2 + 0.03, H / 2, z))
    for z in (-0.6, -0.3, 0.3, 0.6):  # Türverschlüsse an der Stirnseite +x
        rod(p, (L / 2 + 0.02, 0.2, z), (L / 2 + 0.02, H - 0.2, z), 0.025, METAL, seg=5)
        put(p, 'box', 0.06, 0.25, 0.04, METAL, at=(L / 2 + 0.04, 1.1, z + 0.06))
    put(p, 'box', 0.02, H - 0.3, 0.02, DARK, at=(L / 2 - 0.04, H / 2, 0))
    put(p, 'box', 1.6, 0.35, 0.01, WHITE, at=(-1.6, H - 0.45, W / 2 - 0.005))
    put(p, 'box', 0.6, 0.2, 0.01, WHITE, at=(2.1, H - 0.4, W / 2 - 0.005))


@model('extras/hafen/steuerrad')
def steuerrad(p, root):
    put(p, 'box', 0.5, 0.08, 0.4, DWOOD, bevel=0.02, at=(0, 0.04, 0))
    lth(p, [(0.14, 0.08), (0.1, 0.18), (0.09, 0.85), (0.12, 0.92), (0.12, 1.0)], WOOD, seg=8, at=(0, 0, -0.05))
    put(p, 'box', 0.2, 0.18, 0.2, WOOD, bevel=0.02, at=(0, 1.0, -0.05))
    put(p, 'cyl', 0.03, 0.03, 0.2, BRASS, seg=6, at=(0, 1.0, 0.1), rot=AZ)
    r = Node('rad', root, (0, 1.0, 0.2)); q = Part('rad-m', r)
    put(q, 'cyl', 0.08, 0.08, 0.08, WOOD, seg=10, rot=AZ)
    put(q, 'cyl', 0.05, 0.05, 0.1, BRASS, seg=10, rot=AZ)
    put(q, 'torus', 0.38, 0.03, WOOD, seg=16, ring=4, rot=(PI / 2, 0, 0))
    put(q, 'torus', 0.38, 0.033, dk(WOOD, 0.8), seg=16, ring=3, rot=(PI / 2, 0, 0), arc=0.3)
    for k in range(8):
        a = k * PI / 4
        rod(q, (math.cos(a) * 0.07, math.sin(a) * 0.07, 0), (math.cos(a) * 0.5, math.sin(a) * 0.5, 0), 0.022, WOOD, seg=5, rt=0.03)
        put(q, 'ball', 0.035, WOOD, uv=(5, 4), scale=(1, 1, 1), at=(math.cos(a) * 0.53, math.sin(a) * 0.53, 0))
    q.done()


@model('extras/hafen/seilwinde')
def seilwinde(p, root):
    put(p, 'cyl', 0.42, 0.45, 0.12, DSTONE, seg=10, at=(0, 0.06, 0))
    put(p, 'cyl', 0.36, 0.38, 0.08, METAL, seg=10, at=(0, 0.16, 0))
    for k in range(8):
        a = k * PI / 4; put(p, 'box', 0.08, 0.06, 0.08, BRASS, at=(math.cos(a) * 0.33, 0.21, math.sin(a) * 0.33), rot=(0, -a, 0))
    w = Node('winde', root, (0, 0.2, 0)); q = Part('winde-m', w)
    lth(q, [(0.26, 0), (0.24, 0.06), (0.18, 0.15), (0.16, 0.45), (0.2, 0.58), (0.26, 0.64), (0.26, 0.72), (0.18, 0.76)], DARK, seg=10)
    for k in range(4): put(q, 'torus', 0.17, 0.03, ROPE, seg=10, ring=4, at=(0, 0.2 + k * 0.055, 0))
    put(q, 'ball', 0.08, BRASS, uv=(6, 3), scale=(1, 0.5, 1), at=(0, 0.77, 0))
    for k in range(4):
        a = k * PI / 2; ca, sa = math.cos(a), math.sin(a)
        rod(q, (ca * 0.2, 0.68, sa * 0.2), (ca * 0.65, 0.7, sa * 0.65), 0.03, WOOD, seg=6)
    q.done()
    tube(p, [(0.15, 0.4, 0.08), (0.35, 0.3, 0.25), (0.55, 0.06, 0.4), (0.9, 0.04, 0.5)], 0.03, ROPE, ring=4)


@model('extras/hafen/seesack')
def seesack(p, root):
    c = 0x3d5a80
    lth(p, [(0.18, 0), (0.24, 0.05), (0.26, 0.35), (0.22, 0.6), (0.12, 0.7), (0.07, 0.74)], c, seg=10)
    put(p, 'cyl', 0.08, 0.06, 0.08, c, seg=8, at=(0, 0.78, 0))
    put(p, 'torus', 0.075, 0.018, ROPE, seg=8, ring=4, at=(0, 0.74, 0))
    for k in range(5):
        a = k * 1.25; put(p, 'box', 0.06, 0.12, 0.012, c, at=(math.cos(a) * 0.08, 0.84, math.sin(a) * 0.08), rot=(0, -a + PI / 2, 0.3))
    put(p, 'cyl', 0.266, 0.266, 0.06, WHITE, seg=10, at=(0, 0.25, 0))
    tube(p, [(0.05, 0.74, 0.06), (0.15, 0.6, 0.2), (0.25, 0.35, 0.22), (0.23, 0.12, 0.2)], 0.015, ROPE, ring=4)
    put(p, 'torus', 0.03, 0.008, CHROME, seg=6, ring=3, at=(0.23, 0.12, 0.2), rot=(PI / 2, 0, 0))
    put(p, 'box', 0.12, 0.12, 0.012, 0xc0392b, at=(0, 0.48, 0.25), rot=(-0.07, 0, 0))
    put(p, 'box', 0.03, 0.08, 0.016, WHITE, at=(0, 0.48, 0.25), rot=(-0.07, 0, 0.785))


# ================================================================ Badebucht
@model('extras/strand/strandkorb')
def strandkorb(p, root):
    wk, st = 0xe9d8a6, 0x0984e3
    W, D = 1.25, 0.85
    put(p, 'box', W, 0.45, D, wk, bevel=0.04, at=(0, 0.225, 0))
    for k in range(3): put(p, 'box', W + 0.01, 0.015, D + 0.01, dk(wk, 0.8), at=(0, 0.1 + k * 0.12, 0))
    put(p, 'box', W - 0.2, 0.1, D - 0.15, WHITE, bevel=0.03, at=(0, 0.5, 0.05))
    put(p, 'box', W, 1.27, 0.12, wk, bevel=0.03, at=(0, 1.085, -D / 2 + 0.06))
    for s in (-1, 1):
        put(p, 'box', 0.12, 0.6, D, wk, bevel=0.03, at=(s * (W / 2 - 0.06), 0.75, 0))
        put(p, 'box', 0.14, 0.05, D * 0.85, LWOOD, bevel=0.015, at=(s * (W / 2 - 0.06), 0.72, 0.05))
    for s in (-1, 1):  # Haubenseiten
        hull(p, [(s * (W / 2 - dx), y, z) for dx in (0, 0.1) for z, y in ((-D / 2, 0.8), (0.05, 0.8), (-0.05, 1.62), (-D / 2, 1.72))], wk)
    roof = [(sx * W / 2, y, z) for sx in (-1, 1) for z, y in ((-D / 2, 1.72), (-0.05, 1.62))]
    hull(p, roof + [(x, y + 0.07, z) for x, y, z in roof], wk)
    put(p, 'box', W, 0.12, 0.03, st, at=(0, 1.58, -0.04), rot=(-0.2, 0, 0))
    for k in range(5):  # gestreifter Stoff innen
        x = -W / 2 + 0.17 + k * (W - 0.34) / 4
        put(p, 'box', (W - 0.34) / 5 + 0.01, 1.08, 0.02, st if k % 2 == 0 else WHITE, at=(x, 1.08, -D / 2 + 0.13))
    for s in (-1, 1):
        put(p, 'box', 0.4, 0.06, 0.35, wk, bevel=0.02, at=(s * 0.3, 0.2, D / 2 + 0.17))
        put(p, 'box', 0.4, 0.08, 0.04, st, at=(s * 0.3, 0.21, D / 2 + 0.34))
    put(p, 'box', 0.3, 0.08, 0.012, WHITE, at=(0, 0.33, D / 2 + 0.002))


@model('extras/strand/sandeimer')
def sandeimer(p, root):
    lth(p, [(0.09, 0), (0.1, 0.01), (0.13, 0.2), (0.135, 0.21), (0.12, 0.21)], RED, seg=10, at=(-0.12, 0, 0))
    put(p, 'cyl', 0.12, 0.12, 0.01, 0xe8d29f, seg=10, at=(-0.12, 0.2, 0))
    tube(p, [(-0.25, 0.18, 0), (-0.2, 0.32, 0), (-0.04, 0.32, 0), (0.01, 0.18, 0)], 0.008, YEL, ring=3)
    beam(p, (0.17, 0.1, -0.06), (0.03, 0.3, -0.06), 0.025, 0.02, YEL)  # Schaufel, an den Eimer gelehnt
    hull(p, [(x, y, z) for x, y in ((0.14, 0.0), (0.25, 0.0), (0.21, 0.12), (0.14, 0.11)) for z in (-0.07, -0.05)], BLUE)
    put(p, 'box', 0.07, 0.03, 0.03, YEL, bevel=0.008, at=(0.025, 0.31, -0.06), rot=(0, 0, 0.6))
    sand = 0xe8d29f
    lth(p, [(0.15, 0), (0.12, 0.04), (0.11, 0.18), (0, 0.19)], sand, seg=8, at=(0.12, 0, 0.22))
    for k in range(4): put(p, 'box', 0.05, 0.05, 0.05, sand, at=(0.12 + math.cos(k * PI / 2) * 0.09, 0.21, 0.22 + math.sin(k * PI / 2) * 0.09))
    rod(p, (0.12, 0.19, 0.22), (0.12, 0.35, 0.22), 0.005, DARK, seg=3)
    hull(p, [(0, 0, 0), (0.08, 0.03, 0), (0, 0.06, 0), (0, 0, 0.004), (0.08, 0.03, 0.004), (0, 0.06, 0.004)], RED, at=(0.125, 0.29, 0.22))
    for k in range(5):  # Seestern-Förmchen
        a = k * 2 * PI / 5; put(p, 'box', 0.1, 0.03, 0.045, ORANGE, at=(-0.2 + math.cos(a) * 0.05, 0.015, 0.25 + math.sin(a) * 0.05), rot=(0, -a, 0))


@model('extras/strand/kuehlbox')
def kuehlbox(p, root):
    put(p, 'box', 0.55, 0.32, 0.36, BLUE, bevel=0.03, at=(0, 0.16, 0))
    put(p, 'box', 0.57, 0.08, 0.38, WHITE, bevel=0.03, at=(0, 0.36, 0))
    put(p, 'box', 0.57, 0.015, 0.38, dk(BLUE, 0.7), at=(0, 0.315, 0))
    for s in (-1, 1): put(p, 'box', 0.03, 0.12, 0.04, WHITE, at=(s * 0.28, 0.43, 0))
    rod(p, (-0.28, 0.48, 0), (0.28, 0.48, 0), 0.02, WHITE, seg=6)
    put(p, 'box', 0.12, 0.04, 0.02, WHITE, at=(0, 0.3, 0.19))
    for i, (x, z, c) in enumerate([(0.38, 0.1, RED), (0.42, -0.05, 0x2ecc71)]):
        put(p, 'cyl', 0.033, 0.033, 0.12, c, seg=8, at=(x, 0.06, z))
        put(p, 'cyl', 0.03, 0.03, 0.005, CHROME, seg=8, at=(x, 0.123, z))
    put(p, 'cyl', 0.033, 0.033, 0.12, YEL, seg=8, at=(-0.36, 0.033, 0.18), rot=(0, 0.6, PI / 2))


@model('extras/strand/strandusche')
def strandusche(p, root):
    put(p, 'box', 0.9, 0.06, 0.9, LWOOD, bevel=0.01, at=(0, 0.03, 0))
    for k in range(5): put(p, 'box', 0.9, 0.008, 0.02, dk(LWOOD, 0.75), at=(0, 0.062, -0.36 + k * 0.18))
    rod(p, (0, 0.06, -0.38), (0, 2.2, -0.38), 0.05, BLUE, seg=8)
    put(p, 'box', 0.16, 0.04, 0.16, BLUE, at=(0, 0.08, -0.38))
    tube(p, [(0, 2.15, -0.38), (0, 2.28, -0.36), (0, 2.3, -0.2), (0, 2.25, -0.05)], 0.035, BLUE, ring=6)
    lth(p, [(0.03, 0.06), (0.12, 0.0), (0.13, -0.03), (0.0, -0.035)], CHROME, seg=10, at=(0, 2.2, -0.05))
    put(p, 'cyl', 0.07, 0.07, 0.03, RED, seg=8, at=(0, 1.1, -0.33), rot=AZ)
    put(p, 'box', 0.03, 0.12, 0.025, RED, at=(0, 1.1, -0.31))
    rod(p, (0, 0.5, -0.38), (0, 0.5, -0.25), 0.02, CHROME, seg=5)
    put(p, 'box', 0.05, 0.06, 0.08, CHROME, at=(0, 0.5, -0.24))


@model('extras/strand/windschutz')
def windschutz(p, root):
    pts = [(-1.5, 0.1), (-0.75, -0.08), (0.0, 0.1), (0.75, -0.08), (1.5, 0.1)]
    for i, (x, z) in enumerate(pts): rod(p, (x, -0.0, z), (x, 1.15, z), 0.025, LWOOD, seg=5)
    for i in range(4):
        (x0, z0), (x1, z1) = pts[i], pts[i + 1]
        L, th = math.hypot(x1 - x0, z1 - z0), -math.atan2(z1 - z0, x1 - x0)
        for k in range(3):
            c = (RED, YEL, BLUE)[k] if i % 2 == 0 else (WHITE, RED, WHITE)[k]
            put(p, 'box', L - 0.04, 0.3, 0.015, c, at=((x0 + x1) / 2, 0.25 + k * 0.3, (z0 + z1) / 2), rot=(0, th, 0))
    for i, (x, z) in enumerate(pts): put(p, 'ball', 0.03, LWOOD, uv=(5, 3), at=(x, 1.16, z))


@model('extras/strand/schwimmring')
def schwimmring(p, root):
    put(p, 'torus', 0.36, 0.14, 0xffe0b2, seg=12, ring=6, at=(0, 0.121, 0))
    put(p, 'torus', 0.36, 0.125, PINK, seg=12, ring=5, at=(0, 0.151, 0), rot=(0, 0.2, 0))
    rnd = random.Random(5)
    for i in range(9):
        a = rnd.uniform(0, 2 * PI); r = 0.36 + rnd.uniform(-0.08, 0.08)
        put(p, 'box', 0.05, 0.012, 0.012, (WHITE, YEL, BLUE, 0x2ecc71)[i % 4], at=(math.cos(a) * r, 0.281, math.sin(a) * r), rot=(0, rnd.uniform(0, PI), 0))
    put(p, 'cyl', 0.02, 0.02, 0.04, WHITE, seg=6, at=(0.36, 0.281, 0.12))


@model('extras/strand/treibholz')
def treibholz(p, root):
    c = 0xc8b8a0
    tube(p, [(-1.0, 0.12, 0.1), (-0.5, 0.15, 0.0), (0.0, 0.14, -0.05), (0.5, 0.12, 0.05), (0.9, 0.1, 0.2)], 0.12, c, ring=6)
    tube(p, [(-0.3, 0.17, 0.02), (-0.1, 0.35, 0.3), (0.0, 0.5, 0.45)], 0.04, c, ring=5)
    tube(p, [(0.4, 0.14, 0.03), (0.6, 0.3, -0.2), (0.7, 0.45, -0.3)], 0.035, c, ring=5)
    tube(p, [(-0.8, 0.14, 0.05), (-1.0, 0.08, -0.25), (-1.15, 0.04, -0.35)], 0.04, c, ring=5)
    for i in range(4): put(p, 'ball', 0.08, 0x2e7d32, uv=(5, 3), scale=(1.5, 0.3, 0.7), at=(-0.2 + i * 0.3, 0.24 + 0.02 * (i % 2), 0.02 * i), rot=(0, i, 0))
    put(p, 'ball', 0.05, 0xffeaa7, uv=(6, 3), scale=(1, 0.5, 1.1), at=(0.25, 0.025, 0.35))
    for k in range(4): put(p, 'box', 0.005, 0.01, 0.09, 0xe0c080, at=(0.25 + 0.02 * (k - 1.5), 0.045, 0.35), rot=(0, 0.2 * (k - 1.5), 0))


# ================================================================ Kanalsystem
@model('extras/kanal/ventilrad')
def ventilrad(p, root):
    put(p, 'box', 0.4, 0.06, 0.4, DSTONE, bevel=0.02, at=(0, 0.03, 0))
    rcyl(p, 0.12, 0.7, 0x7f8c8d, at=(0, 0.41, 0), seg=10, b=0.02)
    for y in (0.12, 0.72): put(p, 'cyl', 0.16, 0.16, 0.05, METAL, seg=10, at=(0, y, 0))
    for k in range(6):
        a = k * PI / 3
        for y in (0.12, 0.72): put(p, 'cyl', 0.018, 0.018, 0.07, DARK, seg=5, at=(math.cos(a) * 0.135, y, math.sin(a) * 0.135))
    rod(p, (0, 0.75, 0), (0, 1.0, 0), 0.025, CHROME, seg=6)
    rod(p, (0.12, 0.45, 0), (0.45, 0.45, 0), 0.08, 0x7f8c8d, seg=8)
    put(p, 'cyl', 0.11, 0.11, 0.04, METAL, seg=8, at=(0.45, 0.45, 0), rot=AX)
    r = Node('rad', root, (0, 0.98, 0)); q = Part('rad-m', r)
    put(q, 'torus', 0.2, 0.025, RED, seg=14, ring=4)
    for k in range(4):
        a = k * PI / 2 + PI / 4; put(q, 'box', 0.2, 0.025, 0.025, RED, at=(math.cos(a) * 0.1, 0, math.sin(a) * 0.1), rot=(0, -a, 0))
    put(q, 'cyl', 0.04, 0.04, 0.06, RED, seg=8)
    put(q, 'cyl', 0.02, 0.025, 0.06, RED, seg=6, at=(0.2, 0.04, 0))
    q.done()


@model('extras/kanal/manometer')
def manometer(p, root):
    rcyl(p, 0.08, 1.2, 0xb87333, at=(0, 0.6, 0), seg=8, b=0.015)
    for y in (0.05, 0.4, 1.15): put(p, 'cyl', 0.1, 0.1, 0.05, 0x8e5a26, seg=8, at=(0, y, 0))
    rod(p, (0, 0.85, 0.07), (0, 0.85, 0.16), 0.02, BRASS, seg=6)
    rcyl(p, 0.14, 0.06, BRASS, at=(0, 0.85, 0.19), rot=AZ, seg=14, b=0.01)
    put(p, 'cyl', 0.12, 0.12, 0.012, WHITE, seg=14, at=(0, 0.85, 0.221), rot=AZ)
    for k in range(7):
        a = PI * 1.25 - k * PI * 1.5 / 6
        put(p, 'box', 0.012, 0.025, 0.004, DARK, at=(math.cos(a) * 0.1, 0.85 + math.sin(a) * 0.1, 0.228), rot=(0, 0, a - PI / 2))
    put(p, 'box', 0.06, 0.025, 0.004, RED, at=(0.075, 0.82, 0.228), rot=(0, 0, -0.9))
    z = Node('zeiger', root, (0, 0.85, 0.232)); q = Part('zeiger-m', z)
    hull(q, [(-0.008, 0, 0), (0.008, 0, 0), (0, 0.09, 0), (-0.008, 0, 0.004), (0.008, 0, 0.004), (0, 0.09, 0.004)], RED, rot=(0, 0, -0.6))
    put(q, 'cyl', 0.012, 0.012, 0.01, DARK, seg=6, rot=AZ)
    q.done()
    rod(p, (0, 0.6, 0.07), (0, 0.6, 0.12), 0.02, BRASS, seg=6)
    put(p, 'cyl', 0.06, 0.06, 0.02, RED, seg=8, at=(0, 0.6, 0.13), rot=AZ)


@model('extras/kanal/stromkasten')
def stromkasten(p, root):
    g = 0x95a5a6
    put(p, 'box', 0.7, 1.0, 0.32, g, bevel=0.025, at=(0, 0.6, 0))
    put(p, 'box', 0.72, 0.1, 0.34, dk(g, 0.7), at=(0, 0.05, 0))
    put(p, 'box', 0.76, 0.04, 0.38, dk(g, 0.85), at=(0, 1.115, 0))
    put(p, 'box', 0.012, 0.9, 0.01, dk(g, 0.6), at=(0, 0.6, 0.162))
    for s in (-1, 1): put(p, 'box', 0.03, 0.12, 0.03, DARK, at=(s * 0.06, 0.6, 0.17))
    hull(p, [(0, 0.15, 0), (-0.13, -0.08, 0), (0.13, -0.08, 0), (0, 0.15, 0.008), (-0.13, -0.08, 0.008), (0.13, -0.08, 0.008)], YEL, at=(-0.18, 0.88, 0.162))
    hull(p, [(0.0, 0.09, 0), (-0.03, 0.0, 0), (0.01, 0.0, 0), (-0.01, -0.07, 0), (0.0, 0.09, 0.004), (-0.03, 0.0, 0.004), (0.01, 0.0, 0.004), (-0.01, -0.07, 0.004)], DARK, at=(-0.18, 0.85, 0.17))
    put(p, 'box', 0.18, 0.1, 0.01, WHITE, at=(0.18, 0.88, 0.162))
    for i, c in enumerate((0x2ecc71, RED)): put(p, 'cyl', 0.02, 0.02, 0.02, c, seg=6, at=(0.13 + i * 0.1, 0.72, 0.165), rot=AZ)
    put(p, 'box', 0.05, 0.15, 0.04, DARK, at=(0.42, 0.65, 0))
    rod(p, (0.42, 0.65, 0), (0.48, 0.78, 0.05), 0.015, DARK, seg=4)
    put(p, 'ball', 0.03, RED, uv=(5, 3), at=(0.48, 0.79, 0.05))
    for x, c in ((-0.2, DARK), (0.0, 0x2d3436), (0.2, ORANGE)):
        tube(p, [(x, 0.1, -0.05), (x, 0.0 + 0.03, -0.12), (x + 0.1, 0.03, -0.35)], 0.025, c, ring=4)


@model('extras/kanal/mausefalle')
def mausefalle(p, root):
    put(p, 'box', 0.18, 0.025, 0.4, LWOOD, bevel=0.006, at=(0, 0.0125, 0))
    for k in range(2): put(p, 'box', 0.012, 0.003, 0.38, dk(LWOOD, 0.8), at=(-0.04 + k * 0.08, 0.026, 0))
    for s in (-1, 1):
        put(p, 'torus', 0.022, 0.005, CHROME, seg=6, ring=3, at=(s * 0.06, 0.045, -0.02), rot=(0, 0, PI / 2))
    rod(p, (-0.08, 0.045, -0.02), (0.08, 0.045, -0.02), 0.004, CHROME, seg=3)
    put(p, 'box', 0.04, 0.008, 0.06, BRASS, at=(0, 0.03, 0.08))
    hull(p, [(-0.05, 0, -0.035), (0.05, 0, -0.035), (0.0, 0, 0.04), (-0.05, 0.05, -0.035), (0.05, 0.05, -0.035), (0.0, 0.05, 0.04)], 0xf6c445, at=(0, 0.034, 0.1), rot=(0, 0.3, 0))
    for x, z in ((0.01, 0.07), (-0.015, 0.1)): put(p, 'cyl', 0.008, 0.008, 0.052, 0xd4a017, seg=5, at=(x, 0.06, z))
    b = Node('buegel', root, (0, 0.045, -0.02)); q = Part('buegel-m', b)
    tube(q, [(-0.065, 0, 0), (-0.065, 0.0, -0.15), (0.065, 0.0, -0.15), (0.065, 0, 0)], 0.005, CHROME, ring=3)
    q.done()
    rod(p, (0, 0.03, -0.15), (0, 0.03, 0.06), 0.003, CHROME, seg=3)


@model('extras/kanal/absperrbake')
def absperrbake(p, root):
    for s in (-1, 1):
        for dz in (-1, 1): rod(p, (s * 0.65, 0.0, dz * 0.25), (s * 0.65, 1.0, 0), 0.025, WHITE, seg=5)
        put(p, 'box', 0.08, 0.04, 0.55, RED, at=(s * 0.65, 0.02, 0))
    put(p, 'box', 1.5, 0.22, 0.03, WHITE, at=(0, 0.88, 0.04))
    put(p, 'box', 1.5, 0.15, 0.03, WHITE, at=(0, 0.5, 0.04))
    for y, h in ((0.88, 0.22), (0.5, 0.15)):
        for k in range(5):
            c = -0.6 + k * 0.3
            hull(p, [(c + dx, y + dy, z) for dx, dy in ((-0.13, -h / 2), (0.0, -h / 2), (0.13, h / 2), (0.0, h / 2)) for z in (0.023, 0.057)], RED)
    put(p, 'box', 0.1, 0.1, 0.1, DARK, at=(-0.65, 1.04, 0))
    put(p, 'cyl', 0.07, 0.07, 0.12, ORANGE, seg=8, at=(-0.65, 1.15, 0.0), rot=AZ)
    put(p, 'cyl', 0.075, 0.075, 0.02, DARK, seg=8, at=(-0.65, 1.15, 0.07), rot=AZ)


@model('extras/kanal/warnleuchte')
def warnleuchte(p, root):
    put(p, 'box', 0.3, 0.05, 0.3, DSTONE, bevel=0.015, at=(0, 0.025, 0))
    rod(p, (0, 0.05, 0), (0, 1.1, 0), 0.03, YEL, seg=6)
    for k in range(4): put(p, 'cyl', 0.032, 0.032, 0.06, DARK, seg=6, at=(0, 0.2 + k * 0.25, 0))
    put(p, 'cyl', 0.12, 0.13, 0.08, DARK, seg=10, at=(0, 1.14, 0))
    l = Node('licht', root, (0, 1.18, 0)); q = Part('licht-m', l)
    lth(q, [(0.1, 0), (0.1, 0.15), (0.07, 0.21), (0.0, 0.23)], ORANGE, seg=10)
    for s in (-1, 1): put(q, 'box', 0.04, 0.14, 0.02, LIGHT, at=(0, 0.09, s * 0.1))
    q.done()
    put(p, 'cyl', 0.06, 0.06, 0.03, DARK, seg=8, at=(0, 1.42, 0))


@model('extras/kanal/wandleiter')
def wandleiter(p, root):
    H, c = 3.0, 0x7f8c8d
    for s in (-1, 1):
        put(p, 'box', 0.05, H, 0.07, c, at=(s * 0.22, H / 2, 0))
        for y in (0.6, 1.6, 2.6): put(p, 'box', 0.04, 0.05, 0.2, dk(c, 0.75), at=(s * 0.22, y, -0.13))
        put(p, 'box', 0.1, 0.12, 0.02, dk(c, 0.75), at=(s * 0.22, H - 0.05, -0.23))
    for k in range(10): rod(p, (-0.22, 0.25 + k * 0.28, 0), (0.22, 0.25 + k * 0.28, 0), 0.016, CHROME, seg=5)
    for k in range(4):  # Rückenschutz-Bügel
        y = 1.5 + k * 0.45
        tube(p, [(-0.22, y, 0.0), (-0.32, y, 0.25), (-0.15, y, 0.45), (0.15, y, 0.45), (0.32, y, 0.25), (0.22, y, 0.0)], 0.014, YEL, ring=3)
    for x in (-0.25, 0.0, 0.25): rod(p, (x, 1.5, 0.45 - 0.02 * abs(x) * 4), (x, H - 0.15, 0.45 - 0.02 * abs(x) * 4), 0.012, YEL, seg=4)
    for s in (-1, 1): put(p, 'box', 0.12, 0.04, 0.12, DARK, at=(s * 0.22, 0.02, 0))


def world_of(rel):
    return rel.split('/')[1]


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    want = []
    for a in args:
        a = a if a.startswith('extras/') else 'extras/' + a
        want += [r for r in MODELS if r == a or r.startswith(a.rstrip('/') + '/')]
    for rel in (want or list(MODELS)):
        reset(); name = os.path.basename(rel); root = Node(name)
        p = Part(name + '-m', root); MODELS[rel](p, root); p.done()
        fix_names(); export(root, rel)
