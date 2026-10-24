# Moll und die kleinen Tiere/Spielereien als Low-Poly-GLB mit Drehpunkt-Knoten (Namen = userData-Schlüssel).
# Aufruf: blender --background --factory-startup --python tools/make_animals.py [-- name ...]
# Moll (makeDog): rig > body, front (Drehpunkt Körpermitte, y 0.75) > head, leg-0/1, rear > leg-2/3, tail.
# Im Kopf: earL, earR, tongue, eye-0 (x +0.22), eye-1 (x -0.22). Beinlänge 0.6 ab Drehpunkt, damit leg.scale.y passt.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_lib import reset, Part, Node, export

PI = math.pi
MODELS = {}
def model(rel):
    def reg(fn): MODELS[rel] = fn; return fn
    return reg


def dot_eye(parent, name, r, at, glint):
    e = Node(name, parent, at); p = Part(name + '-m', e)
    p.ball(r, 0x111111, scale=(1, 1, 0.75), uv=(8, 6)); p.ball(r * 0.35, 0xffffff, at=(glint * r * 0.3, r * 0.4, r * 0.65), uv=(4, 3)); p.done()
    return e


# ---- Moll, der braune Labrador ----
@model('figuren/moll')
def moll(root):
    brown, dark, light, nose = 0x8b5a2b, 0x5a3715, 0xa8743f, 0x2a1a0e
    rig = Node('rig', root)
    body = Node('body', rig); b = Part('body-m', body)
    b.ball(0.5, brown, at=(0, 0.76, 0), scale=(0.9, 0.62, 1.55), uv=(12, 8))
    b.ball(0.4, light, at=(0, 0.52, 0.02), scale=(0.85, 0.3, 1.45), uv=(10, 5))  # Bauch
    b.done()
    front = Node('front', rig, (0, 0.75, 0)); rear = Node('rear', rig, (0, 0.75, 0))
    f = Part('front-m', front)
    f.ball(0.5, brown, at=(0, -0.02, 0.5), scale=(0.97, 0.56, 0.6), uv=(12, 8))  # Brust
    f.cyl(0.24, 0.29, 0.5, brown, at=(0, 0.3, 0.75), rot=(0.45, 0, 0), seg=10)  # Hals
    f.cyl(0.3, 0.31, 0.13, 0xd63031, at=(0, 0.35, 0.79), rot=(0.45, 0, 0), seg=12)  # Halsband
    f.cyl(0.09, 0.09, 0.04, 0xffcc33, at=(0, 0.21, 1.06), rot=(PI / 2 + 0.2, 0, 0), seg=10)  # Hundemarke
    f.done()
    r = Part('rear-m', rear)
    r.ball(0.5, brown, at=(0, 0.06, -0.5), scale=(0.98, 0.6, 0.6), uv=(12, 8))  # Hüfte
    r.done()
    head = Node('head', front, (0, 0.55, 0.95)); h = Part('head-m', head)
    h.ball(0.38, brown, scale=(0.95, 0.82, 0.92), uv=(12, 8))
    h.box(0.4, 0.32, 0.46, light, at=(0, -0.1, 0.44), bevel=0.1)  # Schnauze
    h.ball(0.2, light, at=(0, -0.2, 0.45), scale=(1.05, 0.55, 1.1), uv=(10, 6))  # Lefzen
    h.ball(0.115, nose, at=(0, -0.01, 0.7), scale=(1.15, 0.8, 0.8), uv=(8, 6))
    h.box(0.26, 0.03, 0.04, nose, at=(0, -0.27, 0.66))
    for s in (-1, 1): h.box(0.2, 0.06, 0.12, dark, at=(s * 0.18, 0.24, 0.27), rot=(0.25, 0, s * 0.18), bevel=0.02)  # Augenbrauen
    h.done()
    for i, x in enumerate((0.22, -0.22)): dot_eye(head, f'eye-{i}', 0.085, (x, 0.1, 0.3), 1 if x > 0 else -1)
    for name, s in (('earL', 1), ('earR', -1)):
        e = Node(name, head, (s * 0.36, 0.18, -0.05)); e.ob.rotation_euler = (0, s * 0.25, 0)  # Spiel-rz = -s*0.25
        p = Part(name + '-m', e); p.box(0.14, 0.52, 0.3, dark, at=(s * 0.04, -0.22, 0), bevel=0.06); p.done()
    t = Node('tongue', head, (0, -0.3, 0.6)); p = Part('tongue-m', t)
    p.box(0.17, 0.05, 0.3, 0xff6b8a, bevel=0.02); p.box(0.02, 0.052, 0.18, 0xe0506f, at=(0, 0.002, 0.04)); p.done()
    for i, (x, z) in enumerate([(0.3, 0.45), (-0.3, 0.45), (0.3, -0.5), (-0.3, -0.5)]):
        grp = front if z > 0 else rear
        l = Node(f'leg-{i}', grp, (x, -0.2, z)); p = Part(f'leg-{i}-m', l)
        p.cyl(0.12, 0.14, 0.52, brown, at=(0, -0.26, 0), seg=8)
        p.ball(0.16, dark, at=(0, -0.58, 0.05), scale=(0.95, 0.5, 1.15), uv=(8, 5))  # Pfote
        p.done()
    tail = Node('tail', rear, (0, 0.2, -0.75)); p = Part('tail-m', tail)
    p.cone(0.1, 0.75, brown, at=(0, 0.15, -0.3), rot=(-0.6 - PI / 2, 0, 0), seg=7); p.done()
    # leg.rotation.x um den Drehpunkt; Schwanz zeigt nach hinten oben wie im alten Modell


# ---- Singvögel (critters.js makeSongbird): Grundgröße, das Spiel skaliert mit c.s * 2 ----
def songbird(root, body_c, belly_c, head_c, wing_c=None, beak=0x3e2723, cheeks=False):
    body = Node('body', root); b = Part('body-m', body)
    b.ball(0.22, body_c, at=(0, 0.3, 0), scale=(0.85, 0.8, 1.15), uv=(10, 7))
    b.ball(0.18, belly_c, at=(0, 0.26, 0.08), scale=(0.8, 0.8, 0.9), uv=(8, 6))
    b.box(0.13, 0.03, 0.26, wing_c or body_c, at=(0, 0.37, -0.3), rot=(-0.3, 0, 0), bevel=0.01)
    b.done()
    head = Node('head', body, (0, 0.46, 0.15)); h = Part('head-m', head)
    h.ball(0.14, head_c, uv=(10, 7)); h.cone(0.04, 0.12, beak, at=(0, -0.01, 0.16), rot=(PI / 2, 0, 0), seg=5)
    for s in (-1, 1):
        h.ball(0.03, 0x111111, at=(s * 0.09, 0.03, 0.09), uv=(5, 4))
        if cheeks: h.ball(0.06, 0xffffff, at=(s * 0.1, -0.02, 0.03), scale=(0.6, 1, 1), uv=(6, 4))
    h.done()
    for i, s in enumerate((-1, 1)):
        w = Node(f'wing-{i}', body, (s * 0.17, 0.36, 0)); p = Part(f'wing-{i}-m', w)
        p.box(0.26, 0.04, 0.26, wing_c or body_c, at=(s * 0.12, 0, -0.04), bevel=0.012); p.done()
    f = Part('feet', root)
    for s in (-1, 1): f.cyl(0.015, 0.015, 0.14, 0xff8f00, at=(s * 0.06, 0.07, 0), seg=4)
    f.done()

model('tiere/meise')(lambda r: songbird(r, 0x7cb342, 0xffd54f, 0x1e3a8a, cheeks=True))
model('tiere/spatz')(lambda r: songbird(r, 0x9c7a54, 0xe8d9c0, 0x6d5236))
model('tiere/moewe-klein')(lambda r: songbird(r, 0xeceff1, 0xffffff, 0xffffff, 0xb0bec5, 0xffb21c))


@model('tiere/huhn')
def chicken(root):
    body = Node('body', root); b = Part('body-m', body)
    b.ball(0.3, 0xffffff, at=(0, 0.45, 0), scale=(0.8, 0.85, 1.1), uv=(10, 7))
    for k, a in enumerate((-0.3, 0, 0.3)): b.cone(0.09, 0.32, 0xf5f5f5, at=(a * 0.25, 0.64, -0.3), rot=(-0.9, a, 0), seg=5)
    b.done()
    head = Node('head', body, (0, 0.78, 0.22)); h = Part('head-m', head)
    h.ball(0.14, 0xffffff, uv=(10, 7))
    for k in range(3): h.ball(0.045, 0xe53935, at=(0, 0.13 + (k == 1) * 0.02, -0.05 + k * 0.06), uv=(5, 4))  # Kamm
    h.ball(0.04, 0xe53935, at=(0, -0.11, 0.1), scale=(0.7, 1.3, 0.7), uv=(5, 4))
    h.cone(0.05, 0.12, 0xffb300, at=(0, -0.02, 0.17), rot=(PI / 2, 0, 0), seg=5)
    for s in (-1, 1): h.ball(0.025, 0x111111, at=(s * 0.09, 0.03, 0.08), uv=(5, 4))
    h.done()
    for i, s in enumerate((-1, 1)):
        w = Node(f'wing-{i}', body, (s * 0.22, 0.48, 0)); p = Part(f'wing-{i}-m', w)
        p.ball(0.18, 0xeeeeee, at=(s * 0.03, 0, -0.02), scale=(0.3, 0.7, 1), uv=(8, 5)); p.done()
        l = Node(f'leg-{i}', root, (s * 0.1, 0.22, 0)); p = Part(f'leg-{i}-m', l)
        p.cyl(0.025, 0.025, 0.22, 0xffb300, at=(0, -0.11, 0), seg=4)
        for a in (-0.4, 0, 0.4): p.box(0.025, 0.02, 0.12, 0xffb300, at=(math.sin(a) * 0.05, -0.22, 0.05), rot=(0, a, 0))
        p.done()


@model('tiere/wildente')
def wild_duck(root):
    body = Node('body', root); b = Part('body-m', body)
    b.ball(0.3, 0x8d6e63, at=(0, 0.12, 0), scale=(0.8, 0.6, 1.2), uv=(10, 7))
    b.cone(0.12, 0.25, 0x6d4c41, at=(0, 0.22, -0.36), rot=(-1.1, 0, 0), seg=5)
    for s in (-1, 1):
        b.ball(0.2, 0x5d4037, at=(s * 0.2, 0.2, -0.04), scale=(0.3, 0.35, 1), uv=(8, 5)); b.box(0.07, 0.05, 0.1, 0x3949ab, at=(s * 0.235, 0.22, -0.1))
    b.done()
    head = Node('head', body, (0, 0.38, 0.28)); h = Part('head-m', head)
    h.cyl(0.07, 0.09, 0.2, 0x8d6e63, at=(0, -0.12, 0), seg=6); h.cyl(0.075, 0.075, 0.04, 0xffffff, at=(0, -0.08, 0), seg=6)
    h.ball(0.13, 0x2e7d32, uv=(10, 7)); h.box(0.12, 0.04, 0.17, 0xffb300, at=(0, -0.03, 0.16), bevel=0.015)
    for s in (-1, 1): h.ball(0.025, 0x111111, at=(s * 0.09, 0.03, 0.07), uv=(5, 4))
    h.done()


@model('tiere/teichfrosch')
def pond_frog(root):  # critters.js makeFrog
    body = Node('body', root); b = Part('body-m', body)
    b.ball(0.2, 0x66bb6a, at=(0, 0.14, 0), scale=(1, 0.6, 1.1), uv=(10, 7)); b.ball(0.15, 0xc5e1a5, at=(0, 0.1, 0.06), scale=(1, 0.7, 1), uv=(8, 5))
    for s in (-1, 1):
        b.ball(0.07, 0x66bb6a, at=(s * 0.1, 0.27, 0.1), uv=(6, 5)); b.ball(0.04, 0x111111, at=(s * 0.12, 0.3, 0.15), uv=(5, 4))
        b.ball(0.11, 0x43a047, at=(s * 0.18, 0.06, -0.08), scale=(0.6, 0.45, 1.1), uv=(6, 4)); b.box(0.06, 0.04, 0.1, 0x43a047, at=(s * 0.12, 0.03, 0.18), bevel=0.01)
    b.done()
    t = Node('throat', body, (0, 0.07, 0.17)); p = Part('throat-m', t); p.ball(0.08, 0xdcedc8, uv=(6, 5)); p.done()


@model('tiere/frosch')
def frog(root):  # details.js makeFrog
    p = Part('frosch', root)
    p.ball(0.3, 0x43a047, at=(0, 0.18, 0), scale=(1.1, 0.65, 1), uv=(10, 7)); p.ball(0.22, 0x9ccc65, at=(0, 0.12, 0.08), scale=(1.1, 0.6, 1), uv=(8, 5))
    for k in (-1, 1):
        p.ball(0.1, 0x66bb6a, at=(k * 0.15, 0.36, 0.14), uv=(6, 5)); p.ball(0.05, 0x111111, at=(k * 0.16, 0.39, 0.22), uv=(5, 4))
        p.ball(0.16, 0x2e7d32, at=(k * 0.28, 0.08, -0.05), scale=(0.5, 0.4, 1.1), uv=(6, 4))
    p.box(0.26, 0.03, 0.04, 0xc62828, at=(0, 0.14, 0.29))
    p.done()


@model('tiere/quietscheente')
def rubber_duck(root):  # details.js makeDuck (Farbe per paint)
    p = Part('ente', root); c, beak = 0xffd32a, 0xff7f27
    p.ball(0.3, c, at=(0, 0.2, 0), scale=(1, 0.75, 1.3), uv=(12, 8)); p.ball(0.18, c, at=(0, 0.5, 0.25), uv=(10, 7))
    p.ball(0.09, beak, at=(0, 0.46, 0.44), scale=(1.1, 0.45, 1.2), uv=(8, 5))
    for k in (-1, 1): p.ball(0.035, 0x111111, at=(k * 0.1, 0.56, 0.38), uv=(5, 4)); p.ball(0.12, c, at=(k * 0.22, 0.25, -0.02), scale=(0.35, 0.6, 1), uv=(6, 4))
    p.cone(0.1, 0.2, c, at=(0, 0.32, -0.38), rot=(-1.1, 0, 0), seg=5)
    p.done()


@model('tiere/kuh')
def cow(root):
    W, K = 0xfafafa, 0x2d2d2d
    b = Part('body', root)
    b.box(1.3, 1.1, 2.2, W, at=(0, 1.5, 0), bevel=0.2)
    for x, y, z, s in [(0.66, 1.6, 0.3, 0.6), (-0.66, 1.4, -0.4, 0.7), (0.66, 1.3, -0.6, 0.5)]: b.box(0.04, s, s * 1.2, K, at=(x, y, z), bevel=0.01)
    b.box(0.5, 0.06, 0.6, K, at=(0.2, 2.06, -0.3))
    b.ball(0.22, 0xf8bbd0, at=(0, 0.95, -0.55), scale=(1, 0.6, 1), uv=(8, 5))  # Euter
    for x, z in [(-0.45, -0.8), (0.45, -0.8), (-0.45, 0.8), (0.45, 0.8)]:
        b.cyl(0.13, 0.14, 0.9, W, at=(x, 0.55, z), seg=7); b.cyl(0.15, 0.15, 0.12, K, at=(x, 0.06, z), seg=7)
    b.done()
    head = Node('head', root, (0, 1.8, 1.2)); h = Part('head-m', head)
    h.box(0.7, 0.7, 0.75, W, at=(0, 0, 0.1), bevel=0.12); h.box(0.74, 0.38, 0.32, 0xf8bbd0, at=(0, -0.2, 0.55), bevel=0.1)
    for k in (-1, 1):
        h.ball(0.06, 0x111111, at=(k * 0.2, 0.15, 0.48), uv=(6, 4)); h.ball(0.04, 0x7a4a4a, at=(k * 0.12, -0.18, 0.72), uv=(5, 4))
        h.cone(0.07, 0.3, 0xfff3e0, at=(k * 0.28, 0.45, 0), rot=(0, 0, -k * 0.3), seg=5); h.box(0.3, 0.12, 0.1, W, at=(k * 0.48, 0.15, -0.05), bevel=0.03)
    h.done()
    t = Node('tail', root, (0, 1.9, -1.1)); p = Part('tail-m', t)
    p.cyl(0.03, 0.03, 0.8, W, at=(0, -0.4, 0), seg=4); p.ball(0.1, K, at=(0, -0.85, 0), scale=(1, 1.4, 1), uv=(6, 4)); p.done()


@model('tiere/fisch')
def fish(root):  # details.js makeFish (Farbe per paint)
    p = Part('fisch', root); c = 0xff8f00
    p.ball(0.2, c, scale=(0.55, 0.8, 1.4), uv=(10, 7))
    p.cone(0.16, 0.25, c, at=(0, 0, -0.38), rot=(-PI / 2, 0, 0), seg=4, scale=(0.3, 1, 1))
    p.cone(0.08, 0.14, c, at=(0, 0.17, -0.02), seg=4, scale=(0.3, 1, 1.6))
    for k in (-1, 1): p.ball(0.035, 0x111111, at=(k * 0.09, 0.05, 0.18), uv=(5, 4)); p.ball(0.015, 0xffffff, at=(k * 0.11, 0.065, 0.2), uv=(4, 3))
    p.done()


@model('deko/ball')
def ball(root):  # details.js makeBall(0.5); Mitte bei y 0
    p = Part('ball', root); r = 0.5
    p.ball(r, 0xffffff, uv=(14, 9))
    for c, a in [(0xe74c3c, 0), (0x0984e3, PI / 3), (0xfeca57, -PI / 3)]:
        p.torus(r * 1.005, r * 0.12, c, rot=(PI / 2, a, 0), seg=20, ring=4)
    p.done()


@model('deko/kuckucksuhr')
def clock(root):  # details.js makeClock(true); Mitte des Gehäuses bei y 0
    b = Part('body', root)
    b.box(1.1, 1.5, 0.22, 0x8d5a2b, bevel=0.04)
    for k in (-1, 1): b.box(0.85, 0.12, 0.34, 0x5d3f26, at=(k * 0.33, 0.92, 0), rot=(0, 0, -k * 0.55), bevel=0.02)
    b.box(0.36, 0.3, 0.04, 0x3b2412, at=(0, 0.62, 0.11))
    b.cyl(0.42, 0.42, 0.06, 0xfdf6e3, at=(0, 0.12, 0.12), rot=(PI / 2, 0, 0), seg=16)
    b.torus(0.43, 0.03, 0xd4a017, at=(0, 0.12, 0.15), rot=(PI / 2, 0, 0), seg=16, ring=4)
    for i in range(12):
        a = i / 12 * 2 * PI; b.box(0.04, 0.05 if i % 3 else 0.1, 0.02, 0x2d3436, at=(math.sin(a) * 0.34, 0.12 + math.cos(a) * 0.34, 0.16), rot=(0, 0, -a))
    for x in (-0.22, 0.22):
        b.cyl(0.015, 0.015, 0.9, 0x2d3436, at=(x, -1.2, 0.05), seg=4)
        b.ball(0.09, 0x6d4421, at=(x, -1.75, 0.05), scale=(1, 1.9, 1), uv=(6, 6))  # Tannenzapfen
    b.done()
    for name, w, l in (('hour', 0.06, 0.24), ('minute', 0.04, 0.34)):
        n = Node(name, root, (0, 0.12, 0.17)); p = Part(name + '-m', n); p.box(w, l, 0.02, 0x2d3436, at=(0, l / 2 - 0.03, 0)); p.done()
    pe = Node('pend', root, (0, -0.7, 0.05)); p = Part('pend-m', pe)
    p.box(0.04, 0.75, 0.02, 0xd4a017, at=(0, -0.37, 0)); p.cyl(0.13, 0.13, 0.04, 0xf1c40f, at=(0, -0.78, 0), rot=(PI / 2, 0, 0), seg=10); p.done()
    bd = Node('bird', root, (0, 0.62, -0.05)); p = Part('bird-m', bd)
    p.ball(0.12, 0xfdd835, uv=(8, 6)); p.cone(0.04, 0.12, 0xff8f00, at=(0, 0, 0.14), rot=(PI / 2, 0, 0), seg=4)
    for x in (0.06, -0.06): p.ball(0.02, 0x111111, at=(x, 0.04, 0.09), uv=(4, 3))
    p.done()


if __name__ == '__main__':
    want = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else list(MODELS)
    for rel in want:
        reset(); root = Node(os.path.basename(rel)); MODELS[rel](root); export(root, rel)
