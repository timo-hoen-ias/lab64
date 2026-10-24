# Gegner und Figuren als Low-Poly-GLB mit Drehpunkt-Knoten für die Animationen in src/models.js.
# Aufruf: blender --background --factory-startup --python tools/make_creatures.py [-- name ...]
# Knotennamen = userData-Schlüssel der alten Modelle: head, body, belly, leg-0.., arm-0/1, wing-0/1 (darin tip-0/1),
# tail-0.. (Kette, jedes Glied Kind des vorigen), ear-0/1, eye-0/1 (zum Blinzeln über scale.y), claw-0/1, pincer-0/1,
# stalk-0/1, nozzle, blade, knob, lid, lamp. Lage und Drehpunkte wie in src/models.js, Ursprung am Boden, +Z vorne.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_lib import reset, Part, Node, export

PI = math.pi
MODELS = {}
def model(rel):
    def reg(fn): MODELS[rel] = fn; return fn
    return reg

def shade(c, k):
    return (min(255, int(((c >> 16) & 255) * k)) << 16) | (min(255, int(((c >> 8) & 255) * k)) << 8) | min(255, int((c & 255) * k))


def eye(parent, name, r, iris, at, white=False, pupil=True, slit=False, glint_side=1):
    e = Node(name, parent, at); p = Part(name + '-m', e)
    if white: p.ball(r * 1.35, 0xffffff, at=(0, 0, -r * 0.3), scale=(1, 1, 0.6), uv=(8, 6))
    p.ball(r, iris, scale=(1, 1, 0.6), uv=(8, 6))
    if slit: p.box(r * 0.28, r * 1.5, r * 0.2, 0x111111, at=(0, 0, r * 0.55))
    elif pupil: p.ball(r * 0.5, 0x111111, at=(0, 0, r * 0.42), scale=(1, 1, 0.6), uv=(6, 4))
    p.ball(r * 0.28, 0xffffff, at=(r * 0.3 * glint_side, r * 0.35, r * 0.62), uv=(4, 3))
    p.done(); return e


def brows(p, x, y, z, color, angry=0.35, w=0.26):
    for s in (-1, 1): p.box(w, 0.07, 0.07, color, at=(s * x, y, z), rot=(0, 0, -s * angry))


def chain(parent, n, length, r0, r1, color, at, tip=None, rot=(0, 0, 0)):
    """Schwanz aus Gliedern entlang -Z; jedes Glied ist Kind des vorigen (tail-0, tail-1 …)."""
    par, segs = parent, []
    for i in range(n):
        k = i / max(1, n - 1); r = r0 + (r1 - r0) * k
        nd = Node(f'tail-{i}', par, at if i == 0 else (0, 0, -length))
        if i == 0: nd.ob.rotation_euler = (rot[0], -rot[2], rot[1])
        p = Part(f'tail-{i}-m', nd)
        p.cyl(r * 0.9, r, length * 1.1, tip if (tip and i == n - 1) else color, at=(0, 0, -length / 2), rot=(PI / 2, 0, 0), seg=6)
        p.done(); par = nd; segs.append(nd)
    return segs


# ---- Ratte ----
@model('figuren/ratte')
def rat(root):
    c, light, pink = 0x6f6f72, 0x9a9aa0, 0xffb6c1
    b = Part('body', root)
    b.ball(0.5, c, at=(0, 0.47, -0.05), scale=(0.75, 0.55, 1.25), uv=(10, 7))
    b.ball(0.42, c, at=(0, 0.52, -0.38), scale=(0.95, 0.75, 0.75), uv=(10, 7))
    b.ball(0.4, light, at=(0, 0.3, 0.05), scale=(0.7, 0.3, 1.15), uv=(8, 5))
    for i in range(4): b.cone(0.07, 0.22, shade(c, 0.75), at=(0, 0.88 - abs(i - 1.5) * 0.04, -0.4 + i * 0.22), rot=(-0.6, 0, 0), seg=4)
    b.done()
    head = Node('head', root, (0, 0.55, 0.8)); h = Part('head-m', head)
    h.ball(0.3, c, scale=(0.85, 0.75, 1), uv=(10, 7))
    h.cone(0.18, 0.45, pink, at=(0, -0.05, 0.42), rot=(PI / 2, 0, 0), seg=8)
    h.ball(0.075, 0xff6f91, at=(0, -0.05, 0.66), uv=(6, 4))
    for s in (-1, 1):
        h.box(0.06, 0.12, 0.04, 0xfff8e0, at=(s * 0.04, -0.2, 0.47))
        for dy in (0.04, -0.04): h.box(0.5, 0.012, 0.012, 0xdddddd, at=(s * 0.3, -0.05 + dy, 0.52), rot=(0, s * 0.2, s * dy * 4))
    brows(h, 0.17, 0.2, 0.26, 0x3a3a3c, 0.4, 0.18)
    h.done()
    for i, s in enumerate((-1, 1)):
        e = Node(f'ear-{i}', head, (s * 0.26, 0.28, -0.12)); p = Part(f'ear-{i}-m', e)
        p.ball(0.18, pink, scale=(1, 1, 0.35), uv=(8, 5)); p.ball(0.11, 0xff8fa3, at=(0, 0, 0.04), scale=(1, 1, 0.3), uv=(6, 4)); p.done()
        eye(head, f'eye-{i}', 0.07, 0xff2222, (s * 0.18, 0.1, 0.22), pupil=False, glint_side=s)
    chain(root, 6, 0.26, 0.06, 0.025, pink, (0, 0.4, -0.75), rot=(0.25, 0, 0))
    for i, (x, z) in enumerate([(0.25, 0.5), (-0.25, 0.5), (0.27, -0.45), (-0.27, -0.45)]):
        l = Node(f'leg-{i}', root, (x, 0.36, z)); p = Part(f'leg-{i}-m', l)
        p.cyl(0.07, 0.08, 0.32, c, at=(0, -0.16, 0), seg=6); p.box(0.18, 0.07, 0.24, pink, at=(0, -0.33, 0.05), bevel=0.02); p.done()


# ---- Möwe und Taube ----
def bird(root, gull):
    c = 0xf4f4f4 if gull else 0x7d8aa0; wing = 0xd9d9d9 if gull else 0x5b6880; tipc = 0x2d2d2d if gull else 0x3e4859
    beak = 0xffb21c if gull else 0x333333; s = 1.6 if gull else 1.0
    b = Part('body', root)
    b.ball(0.5 * s, c, at=(0, 0.42 * s, -0.05 * s), scale=(0.55, 0.45, 1.05), uv=(10, 7))
    b.ball(0.3 * s, c, at=(0, 0.45 * s, 0.3 * s), scale=(0.85, 0.9, 1), uv=(8, 6))
    for x in (-1, 1):
        b.cyl(0.03 * s, 0.03 * s, 0.3 * s, beak, at=(x * 0.12 * s, 0.12 * s, 0), seg=4)
        for a in (-0.5, 0, 0.5): b.box(0.03, 0.03, 0.14 * s, beak, at=(x * 0.12 * s + math.sin(a) * 0.06, 0.0, 0.06 * s), rot=(0, a, 0))
    b.done()
    head = Node('head', root, (0, 0.72 * s, 0.55 * s)); h = Part('head-m', head)
    h.ball(0.27 * s, c, uv=(10, 7))
    if not gull: h.ball(0.3 * s, 0x5fa88a, at=(0, -0.18 * s, -0.04 * s), scale=(1, 0.45, 1), uv=(10, 5))
    h.cone(0.1 * s, 0.4 * s, beak, at=(0, -0.02 * s, 0.38 * s), rot=(PI / 2, 0, 0), seg=6)
    h.cone(0.07 * s, 0.25 * s, shade(beak, 0.8), at=(0, -0.08 * s, 0.32 * s), rot=(PI / 2, 0, 0), seg=6)
    if gull: h.ball(0.04 * s, 0xe74c3c, at=(0, -0.08 * s, 0.44 * s), uv=(4, 3))
    brows(h, 0.14 * s, 0.17 * s, 0.22 * s, tipc, 0.45, 0.16 * s)
    h.done()
    for i, x in enumerate((-1, 1)): eye(head, f'eye-{i}', 0.06 * s, 0xffe066 if gull else 0xff7f27, (x * 0.15 * s, 0.08 * s, 0.17 * s), glint_side=x)
    for i, sx in enumerate((1, -1)):
        w = Node(f'wing-{i}', root, (sx * 0.25 * s, 0.52 * s, 0)); p = Part(f'wing-{i}-m', w)
        p.box(0.7 * s, 0.07 * s, 0.6 * s, wing, at=(sx * 0.35 * s, 0, 0), bevel=0.02 * s); p.done()
        t = Node(f'tip-{i}', w, (sx * 0.7 * s, 0, 0)); q = Part(f'tip-{i}-m', t)
        q.box(0.55 * s, 0.06 * s, 0.5 * s, wing, at=(sx * 0.27 * s, 0, -0.03 * s), bevel=0.02 * s)
        for k in range(3): q.box(0.32 * s, 0.05 * s, 0.13 * s, tipc, at=(sx * (0.55 + k * 0.05) * s, 0, (0.12 - k * 0.16) * s))
        q.done()
    tail = Node('tail', root, (0, 0.45 * s, -0.5 * s)); p = Part('tail-m', tail)
    for i in (-1, 0, 1): p.box(0.14 * s, 0.05 * s, 0.4 * s, wing if i else tipc, at=(i * 0.1 * s, 0, -0.18 * s), rot=(0, i * 0.3, 0))
    p.done()

model('figuren/moewe')(lambda root: bird(root, True))
model('figuren/taube')(lambda root: bird(root, False))


# ---- Katze ----
@model('figuren/katze')
def cat(root):
    color = 0x3b3b3b; dark, light, pink = shade(color, 0.6), shade(color, 1.7), 0xff9aa9
    body = Node('body', root); b = Part('body-m', body)
    b.ball(0.5, color, at=(0, 0.88, 0), scale=(1.0, 0.72, 1.75), uv=(10, 7))
    b.ball(0.48, color, at=(0, 0.92, 0.65), scale=(0.95, 0.68, 0.6), uv=(10, 7))
    b.ball(0.5, color, at=(0, 0.92, -0.6), scale=(1.05, 0.66, 0.6), uv=(10, 7))
    b.ball(0.45, light, at=(0, 0.6, 0.05), scale=(0.85, 0.3, 1.4), uv=(8, 5))
    for i in range(3): b.box(1.02, 0.42, 0.12, dark, at=(0, 1.02, -0.45 + i * 0.35), bevel=0.04)
    b.done()
    head = Node('head', root, (0, 1.45, 1.0)); h = Part('head-m', head)
    h.ball(0.42, color, scale=(1, 0.8, 0.75), uv=(10, 7))
    h.ball(0.3, color, at=(0, -0.15, 0.05), scale=(1.6, 0.6, 0.8), uv=(10, 6))
    h.ball(0.15, light, at=(0, -0.17, 0.3), scale=(1.3, 0.75, 0.8), uv=(8, 5))
    h.ball(0.07, pink, at=(0, -0.06, 0.4), uv=(6, 4))
    h.box(0.2, 0.04, 0.04, 0x1a1a1a, at=(0, -0.28, 0.41))
    brows(h, 0.2, 0.2, 0.31, dark, 0.3, 0.24)
    for s in (-1, 1):
        for dy in (0.05, -0.05): h.box(0.55, 0.015, 0.015, 0xeeeeee, at=(s * 0.42, -0.16 + dy, 0.38), rot=(0, s * 0.2, s * dy * 4))
    h.done()
    for i, s in enumerate((-1, 1)):
        e = Node(f'ear-{i}', head, (s * 0.25, 0.3, -0.02)); p = Part(f'ear-{i}-m', e)
        p.cone(0.18, 0.4, color, at=(0, 0.16, 0), seg=4); p.cone(0.1, 0.26, pink, at=(0, 0.13, 0.07), seg=4); p.done()
        eye(head, f'eye-{i}', 0.1, 0xd8ff50, (s * 0.2, 0.06, 0.29), slit=True, glint_side=s)
    for i, (x, z) in enumerate([(0.33, 0.6), (-0.33, 0.6), (0.33, -0.62), (-0.33, -0.62)]):
        l = Node(f'leg-{i}', root, (x, 0.6, z)); p = Part(f'leg-{i}-m', l)
        p.cyl(0.11, 0.13, 0.62, color, at=(0, -0.3, 0), seg=7); p.ball(0.17, light, at=(0, -0.56, 0.05), scale=(1, 0.45, 1.15), uv=(8, 5)); p.done()
    chain(root, 5, 0.3, 0.08, 0.06, color, (0, 1.12, -0.85), tip=light, rot=(-0.5, 0, 0))


# ---- Krabbe ----
@model('figuren/krabbe')
def crab(root):
    color = 0xe0503a; dark, light = shade(color, 0.7), shade(color, 1.25)
    b = Part('body', root)
    b.ball(0.8, color, at=(0, 0.7, 0), scale=(1.3, 0.55, 1), sub=2)
    b.ball(0.75, 0xf6d7b0, at=(0, 0.6, 0), scale=(1.2, 0.4, 0.9), uv=(10, 6))
    for x, z, r in [(0.35, 0.2, 0.12), (-0.4, 0.1, 0.1), (0.05, -0.35, 0.09), (-0.1, 0.35, 0.07), (0.55, -0.25, 0.08)]:
        b.ball(r, light, at=(x, 1.1 - abs(x) * 0.25, z), scale=(1, 0.5, 1), uv=(6, 4))
    b.box(0.4, 0.12, 0.1, 0x7a1d12, at=(0, 0.62, 0.78))
    for i in range(2): b.box(0.04, 0.16, 0.04, dark, at=(-0.06 + i * 0.12, 0.52, 0.8))
    b.done()
    for i, sx in enumerate((-1, 1)):
        c = Node(f'claw-{i}', root, (sx * 1.0, 0.8, 0.7)); p = Part(f'claw-{i}-m', c)
        p.box(0.25, 0.25, 0.7, dark, at=(0, 0, 0.3), bevel=0.05); p.done()
        pin = Node(f'pin-{i}', c, (0, 0, 0.75)); q = Part(f'pin-{i}-m', pin)
        q.ball(0.34, color, at=(0, 0, 0.15), uv=(10, 7)); q.cone(0.15, 0.48, color, at=(0, 0.12, 0.48), rot=(PI / 2, 0, 0), seg=6)
        for k in range(3): q.box(0.04, 0.08, 0.04, 0xfff3e0, at=(0, 0, 0.32 + k * 0.1))
        q.done()
        jaw = Node(f'pincer-{i}', pin, (0, -0.08, 0.25)); r = Part(f'pincer-{i}-m', jaw)
        r.cone(0.12, 0.42, dark, at=(0, -0.04, 0.18), rot=(PI / 2, 0, 0), seg=6); r.done()
    for i in range(6):
        sx = -1 if i < 3 else 1; k = i % 3
        l = Node(f'leg-{i}', root, (sx * 0.85, 0.6, -0.3 + k * 0.35)); p = Part(f'leg-{i}-m', l)
        p.box(0.6, 0.13, 0.13, dark, at=(sx * 0.28, 0.08, 0), rot=(0, 0, sx * 0.4))
        p.done()
        lo = Node(f'leg-{i}-lo', l, (sx * 0.55, 0.2, 0)); lo.ob.rotation_euler = (0, sx * 1.1, 0); q = Part(f'leg-{i}-lo-m', lo)
        q.box(0.55, 0.1, 0.1, color, at=(sx * 0.27, 0, 0)); q.cone(0.05, 0.2, dark, at=(sx * 0.6, 0, 0), rot=(0, 0, sx * -PI / 2), seg=4); q.done()
    for i, x in enumerate((-0.25, 0.25)):
        st = Node(f'stalk-{i}', root, (x, 1.0, 0.55)); p = Part(f'stalk-{i}-m', st)
        p.cyl(0.035, 0.04, 0.4, dark, at=(0, 0.15, 0), seg=5); p.done()
        eye(st, f'eye-{i}', 0.11, 0x111111, (0, 0.38, 0.02), white=True, pupil=False, glint_side=1 if x > 0 else -1)


# ---- Staubsauger ----
@model('figuren/staubsauger')
def vacuum(root):
    red, dred, grey = 0xcc3333, 0xa62828, 0x444444
    body = Node('body', root); b = Part('body-m', body)
    b.lathe([(0.98, 0.05), (1.0, 0.3), (0.95, 0.95), (0.9, 1.0), (0.62, 1.22), (0.62, 1.28), (0, 1.29)], red, seg=16)
    b.torus(0.98, 0.09, 0x2d2d2d, at=(0, 0.16, 0), seg=16, ring=5)
    b.cyl(0.63, 0.63, 0.06, 0xe8e8e8, at=(0, 1.26, 0), seg=16)
    b.ball(0.32, 0x333333, at=(0, 1.3, -0.1), scale=(1, 0.8, 1), uv=(10, 5))
    b.torus(0.42, 0.07, 0x2d2d2d, at=(0, 1.3, -0.45), rot=(PI / 2, 0, 0), seg=10, ring=5, arc=PI)
    for s in (-1, 1): b.box(0.18, 0.08, 0.1, 0xffd34d, at=(s * 0.45, 1.18, 0.55), bevel=0.02)
    brows(b, 0.35, 1.08, 0.92, 0x2d2d2d, 0.45, 0.32)
    b.box(0.8, 0.16, 0.08, 0x1a1a1a, at=(0, 0.5, 0.95))
    for i in range(4): b.box(0.1, 0.08, 0.04, 0xffffff, at=(-0.28 + i * 0.19, 0.55, 0.99))
    for x, z in [(0.6, 0.6), (-0.6, 0.6), (0, -0.7)]:
        b.cyl(0.2, 0.2, 0.15, 0x222222, at=(x, 0.2, z), rot=(0, 0, PI / 2), seg=10)
        b.cyl(0.08, 0.08, 0.17, 0xbbbbbb, at=(x, 0.2, z), rot=(0, 0, PI / 2), seg=6)
    b.cyl(0.04, 0.04, 1.2, 0x222222, at=(0, 0.3, -1.4), rot=(PI / 2 + 0.2, 0, 0), seg=4)
    b.box(0.2, 0.15, 0.28, 0xeeeeee, at=(0, 0.18, -2.0), bevel=0.02)
    b.done()
    lamp = Node('lamp', root, (0, 1.62, -0.1)); p = Part('lamp-m', lamp); p.ball(0.1, 0x7fffd4, uv=(6, 4)); p.done()
    for i, s in enumerate((-1, 1)): eye(root, f'eye-{i}', 0.14, 0x111111, (s * 0.35, 0.85, 0.92), white=True, pupil=False, glint_side=s)
    hose = Node('hose', root, (0, 0.9, 1.3)); hose.ob.rotation_euler = (PI / 2 - 0.3, 0, 0); p = Part('hose-m', hose)
    p.cyl(0.12, 0.12, 2.2, grey, seg=8)
    for i in range(6): p.torus(0.13, 0.035, 0x333333, at=(0, -0.9 + i * 0.36, 0), seg=10, ring=4)
    p.done()
    nz = Node('nozzle', root, (0, 0.15, 2.3)); p = Part('nozzle-m', nz)
    p.box(1.4, 0.3, 0.5, 0x222222, bevel=0.05); p.box(1.3, 0.08, 0.1, 0xffcc33, at=(0, 0.16, 0.2))
    for i in range(7): p.box(0.06, 0.1, 0.42, 0x888888, at=(-0.6 + i * 0.2, -0.17, 0))
    p.done()


# ---- Dosenöffner ----
@model('figuren/dosenoeffner')
def can_opener(root):
    steel, dsteel, grip = 0xbfc5cc, 0x8a9099, 0xd63031
    for i, (x, rz) in enumerate([(-0.6, 0.12), (0.6, -0.12)]):
        a = Node(f'arm-{i}', root, (x, 2.5, 0)); a.ob.rotation_euler = (0, -rz, 0); p = Part(f'arm-{i}-m', a)
        p.box(0.5, 4.5, 0.4, steel, bevel=0.06); p.box(0.62, 2.6, 0.52, grip, at=(0, 0.6, 0), bevel=0.12)
        for k in range(4): p.box(0.64, 0.08, 0.54, shade(grip, 0.7), at=(0, -0.4 + k * 0.6, 0))
        p.ball(0.1, 0xdddddd, at=(0, -1.9, 0.22), uv=(6, 4)); p.done()
    b = Part('body', root)
    b.box(1.4, 0.9, 0.6, dsteel, at=(0, 4.9, 0), bevel=0.08); b.box(1.5, 0.15, 0.7, steel, at=(0, 5.38, 0), bevel=0.04)
    brows(b, 0.32, 5.38, 0.36, 0x333333, 0.4, 0.34)
    b.box(0.6, 0.1, 0.06, 0x222222, at=(0, 4.66, 0.31))
    b.done()
    for i, s in enumerate((-1, 1)): eye(root, f'eye-{i}', 0.18, 0x111111, (s * 0.3, 5.1, 0.32), white=True, pupil=False, glint_side=s)
    bl = Node('blade', root, (0, 0.5, 0.2)); p = Part('blade-m', bl)
    p.cyl(0.6, 0.6, 0.15, 0xdfe6ee, rot=(PI / 2, 0, 0), seg=16); p.cyl(0.2, 0.2, 0.2, dsteel, rot=(PI / 2, 0, 0), seg=8)
    for k in range(10):
        a = k / 10 * 2 * PI; p.box(0.16, 0.16, 0.08, 0xffffff, at=(math.cos(a) * 0.62, math.sin(a) * 0.62, 0), rot=(0, 0, a + PI / 4))
    p.done()
    kn = Node('knob', root, (0, 4.9, 0.8)); p = Part('knob-m', kn)
    p.cyl(0.25, 0.25, 0.9, 0x555555, rot=(PI / 2, 0, 0), seg=10)
    for k in range(3): p.box(0.9, 0.14, 0.14, 0x666666, at=(0, 0, 0.35), rot=(0, 0, k / 3 * PI))
    p.done()


# ---- Dicker Mann (Einkäufer) ----
@model('figuren/einkaeufer')
def fat_man(root):
    skin, shirt, pants = 0xf5c9a2, 0xf2c744, 0x3a5fa8
    b = Part('body', root)
    b.cyl(0.5, 0.9, 1.0, pants, at=(0, 1.3, 0), seg=12)
    b.cyl(0.97, 0.97, 0.16, 0x4a3020, at=(0, 1.68, 0), seg=14); b.box(0.3, 0.2, 0.1, 0xffcc33, at=(0, 1.68, 0.96))
    b.cyl(0.45, 0.6, 0.2, 0xffffff, at=(0, 2.98, 0), seg=12)
    b.done()
    belly = Node('belly', root, (0, 2.3, 0)); p = Part('belly-m', belly)
    p.ball(1.0, shirt, scale=(1.0, 0.72, 0.95), uv=(14, 9)); p.ball(0.85, shirt, at=(0, -0.15, 0.3), scale=(1, 0.9, 0.8), uv=(12, 8))
    for i in range(3): p.ball(0.06, 0xffffff, at=(0, 0.4 - i * 0.35, 0.97 - abs(i - 1) * 0.07), uv=(4, 3))
    p.done()
    head = Node('head', root, (0, 3.4, 0)); h = Part('head-m', head)
    h.ball(0.55, skin, uv=(12, 8)); h.ball(0.14, 0xf0a888, at=(0, -0.05, 0.54), uv=(6, 4))
    for s in (-1, 1): h.ball(0.13, skin, at=(s * 0.55, 0, 0), uv=(6, 4)); h.ball(0.12, 0xf7a8a0, at=(s * 0.3, -0.15, 0.43), scale=(1, 1, 0.5), uv=(6, 4))
    brows(h, 0.2, 0.25, 0.5, 0x3b2412, -0.15, 0.22)
    h.box(0.42, 0.1, 0.12, 0x3b2412, at=(0, -0.2, 0.5), bevel=0.03)
    h.cyl(0.6, 0.6, 0.2, 0x8b1e1e, at=(0, 0.45, 0), seg=12); h.ball(0.4, 0x8b1e1e, at=(0, 0.55, 0), scale=(1, 0.7, 1), uv=(10, 5)); h.box(0.7, 0.06, 0.4, 0x8b1e1e, at=(0, 0.36, 0.55), bevel=0.02)
    h.done()
    for i, s in enumerate((-1, 1)): eye(head, f'eye-{i}', 0.07, 0x111111, (s * 0.2, 0.1, 0.48), pupil=False, glint_side=s)
    for i, s in enumerate((1, -1)):
        a = Node(f'arm-{i}', root, (s * 1.05, 2.9, 0)); p = Part(f'arm-{i}-m', a)
        p.ball(0.24, shirt, at=(0, -0.2, 0), scale=(1, 1.3, 1), uv=(8, 6)); p.cyl(0.15, 0.17, 0.8, skin, at=(0, -0.85, 0), seg=8); p.ball(0.2, skin, at=(0, -1.3, 0), uv=(8, 6))
        if i == 0:  # Einkaufstüte mit Brot, Wurst, Lauch
            p.box(0.9, 1.0, 0.6, 0xd9a066, at=(0.05, -1.65, 0.3), bevel=0.04); p.box(0.5, 0.2, 0.5, 0xffe08a, at=(0.05, -1.05, 0.3), bevel=0.06)
            p.cyl(0.18, 0.18, 0.5, 0xe8a04a, at=(-0.15, -0.95, 0.3), seg=8); p.box(0.06, 0.4, 0.06, 0x2ecc71, at=(0.3, -0.9, 0.4))
        p.done()
    for i, x in enumerate((0.35, -0.35)):
        l = Node(f'leg-{i}', root, (x, 0.95, 0)); p = Part(f'leg-{i}-m', l)
        p.cyl(0.21, 0.23, 0.9, pants, at=(0, -0.45, 0), seg=8); p.box(0.46, 0.18, 0.62, 0x2d1a10, at=(0, -0.86, 0.1), bevel=0.06); p.done()


# ---- Riesenmuschel ----
@model('figuren/riesenmuschel')
def clam(root):
    b = Part('body', root); b.ball(1.0, 0x8e7cc3, scale=(1.2, 0.35, 1), sub=2); b.ball(0.25, 0xffffff, at=(0, 0.3, 0), uv=(10, 7)); b.done()
    lid = Node('lid', root, (0, 0.15, -0.9)); p = Part('lid-m', lid)
    p.ball(1.0, 0xa593e0, at=(0, 0, 0.9), scale=(1.2, 0.35, 1), sub=2)
    for i in range(7):
        a = (i - 3) * 0.32; p.box(0.08, 0.06, 1.7, 0xc2b5ef, at=(math.sin(a) * 0.55, 0.3, 0.9 + math.cos(a) * 0.05 - 0.05), rot=(0, a, 0))
    p.done()


if __name__ == '__main__':
    want = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else list(MODELS)
    for rel in want:
        reset(); root = Node(os.path.basename(rel)); MODELS[rel](root); export(root, rel)
