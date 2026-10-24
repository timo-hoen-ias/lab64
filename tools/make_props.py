# Sammelobjekte, Pflanzen und Deko als Low-Poly-GLB (einfarbige Materialien → Vertexfarben im Spiel).
# Aufruf: blender --background --factory-startup --python tools/make_props.py [-- name ...]
# Ursprung unten mittig, 1 Einheit = 1 m, Maße wie die alten Grundkörper-Modelle in src/models.js.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_lib import reset, Part, Node, export

PI = math.pi
MODELS = {}
def model(rel):
    def reg(fn): MODELS[rel] = fn; return fn
    return reg


# ---- Sammelobjekte (makeFood) ----
@model('sammeln/ice')
def ice(root):
    p = Part('eis', root)
    p.lathe([(0.02, 0.0), (0.12, 0.25), (0.22, 0.55), (0.24, 0.6)], 0xd9a066, seg=8)  # Waffel
    for i in range(4):  # Rautenmuster als dunkle Ringe
        p.cyl(0.05 + i * 0.045, 0.04 + i * 0.045, 0.02, 0xb07a40, at=(0, 0.12 + i * 0.12, 0), seg=8)
    p.ball(0.27, 0xffb3c6, at=(0, 0.72, 0), scale=(1, 0.85, 1), sub=1, jitter=0.05, seed=1)
    p.ball(0.21, 0xfff3d6, at=(0.03, 0.95, 0.02), scale=(1, 0.9, 1), sub=1, jitter=0.05, seed=2)
    p.ball(0.06, 0xe74c3c, at=(0.04, 1.15, 0.03), uv=(6, 4))
    p.cyl(0.012, 0.012, 0.12, 0x3d9a3d, at=(0.05, 1.22, 0.03), rot=(0, 0, 0.4), seg=4)
    p.done()


@model('sammeln/bone')
def bone(root):
    p = Part('knochen', root)
    p.cyl(0.09, 0.09, 0.62, 0xffe9a8, at=(0, 0.3, 0), rot=(0, 0, PI / 2), seg=8)
    for x in (-0.33, 0.33):
        for z in (-0.1, 0.1): p.ball(0.15, 0xffe9a8, at=(x, 0.3, z), sub=1)
    p.done()


@model('sammeln/treat')
def treat(root):
    p = Part('leckerli', root)
    p.box(0.62, 0.2, 0.26, 0xd9a066, at=(0, 0.2, 0), bevel=0.05)
    for x in (-0.34, 0.34):
        for z in (-0.1, 0.1): p.cyl(0.16, 0.16, 0.2, 0xd9a066, at=(x, 0.2, z), seg=8)
    for i, (x, z) in enumerate([(-0.15, 0.04), (0.0, -0.05), (0.15, 0.03), (-0.3, -0.1), (0.32, 0.1)]):
        p.ball(0.035, 0xa86f3a, at=(x, 0.31, z), uv=(5, 3))
    p.done()


@model('sammeln/sock')
def sock(root):
    p = Part('socke', root)
    pink, white, dark = 0xe84393, 0xffffff, 0xc2185b
    p.box(0.32, 0.5, 0.22, pink, at=(0, 0.5, 0), bevel=0.04)
    for i in range(3): p.box(0.335, 0.045, 0.235, white, at=(0, 0.36 + i * 0.14, 0))
    p.box(0.36, 0.12, 0.26, white, at=(0, 0.78, 0), bevel=0.03)  # Bündchen
    p.box(0.32, 0.22, 0.42, pink, at=(0, 0.16, 0.12), bevel=0.06)  # Fuß
    p.box(0.33, 0.2, 0.12, dark, at=(0, 0.16, 0.3), bevel=0.04)  # Spitze
    p.box(0.33, 0.24, 0.12, dark, at=(0, 0.2, -0.08), bevel=0.04)  # Ferse
    p.done()


@model('sammeln/cup')
def cup(root):
    p = Part('tasse', root)
    p.lathe([(0.18, 0.05), (0.22, 0.08), (0.25, 0.5), (0.26, 0.55), (0.22, 0.55), (0.21, 0.5)], 0xffffff, seg=12)
    p.cyl(0.18, 0.18, 0.05, 0xffffff, at=(0, 0.075, 0), seg=12)
    p.cyl(0.215, 0.215, 0.02, 0x6d4c41, at=(0, 0.48, 0), seg=12)  # Kaffee
    p.cyl(0.255, 0.252, 0.06, 0xe74c3c, at=(0, 0.38, 0), seg=12)  # roter Streifen
    p.torus(0.13, 0.04, 0xffffff, at=(0.27, 0.3, 0), rot=(PI / 2, 0, 0), seg=10, ring=5)
    p.done()


# ---- Pflanzen (makeTree, makeRoundTree, makeBush) ----
@model('pflanzen/tanne')
def fir(root):
    p = Part('stamm', root)
    p.cyl(0.2, 0.38, 1.6, 0x7a4a1f, at=(0, 0.8, 0), seg=7)
    p.done()
    q = Part('laub', root)
    for i, (r, h, y, c) in enumerate([(1.5, 1.6, 1.9, 0x3f9a46), (1.2, 1.5, 2.8, 0x4caa4c), (0.9, 1.3, 3.6, 0x5fc25f), (0.55, 1.0, 4.3, 0x6fd06a)]):
        v = q.cone(r, h, c, at=(0, y, 0), rot=(0, i * 0.45, 0), seg=7)
        rnd = random.Random(i)
        for x in v:  # Zweigspitzen leicht hängen lassen
            if abs(x.co.z - (y - h / 2)) < 0.01: x.co.z -= rnd.uniform(0.05, 0.25)
    q.done()


def round_tree(root, apples):
    p = Part('stamm', root)
    bark, dbark = 0x7a4a1f, 0x5e3815
    p.cyl(0.26, 0.42, 2.3, bark, at=(0, 1.15, 0), seg=7)
    for i in range(4):
        a = i / 4 * 2 * PI + 0.4
        p.cone(0.2, 0.75, dbark, at=(math.cos(a) * 0.36, 0.25, math.sin(a) * 0.36), rot=(-math.sin(a) * 0.7, 0, math.cos(a) * 0.7), seg=5)
    for x, z in ((0.6, 1), (-0.7, -0.6)):
        p.cyl(0.08, 0.14, 1.3, bark, at=(x * 0.5, 2.4, z * 0.5), rot=(z * 0.7, 0, -x * 0.7), seg=5)
    p.done()
    q = Part('laub', root)
    leaf = [0x3d9a3d, 0x4caa4c, 0x5fc25f, 0x6ccf62]
    for i, (x, y, z, r, c) in enumerate([(0, 3.1, 0, 1.6, 1), (0.95, 2.7, 0.35, 1.1, 0), (-0.85, 2.75, -0.4, 1.2, 0), (0.25, 3.95, -0.3, 1.1, 2),
                                         (-0.45, 2.55, 0.95, 1.0, 0), (0.65, 3.45, -0.95, 0.95, 1), (-0.6, 3.7, 0.5, 0.9, 3)]):
        q.ball(r, leaf[c], at=(x, y, z), sub=1, jitter=0.12, seed=i)
    if apples:
        for i in range(7):
            a = i / 7 * 2 * PI
            q.ball(0.16, 0xe53935, at=(math.cos(a) * 1.55, 2.6 + (i % 3) * 0.5, math.sin(a) * 1.55), uv=(6, 4))
            q.cyl(0.015, 0.015, 0.1, 0x5e3815, at=(math.cos(a) * 1.55, 2.78 + (i % 3) * 0.5, math.sin(a) * 1.55), seg=3)
    q.done()

model('pflanzen/laubbaum')(lambda root: round_tree(root, False))
model('pflanzen/apfelbaum')(lambda root: round_tree(root, True))


@model('pflanzen/busch')
def bush(root):  # Breite 2 (makeBush(w) skaliert)
    q = Part('laub', root); w = 2; rnd = random.Random(7)
    cols = [0x3d9a3d, 0x4fb24f, 0x46a646, 0x5cbf55]
    for i in range(6):
        a = i / 6 * 2 * PI + rnd.random(); r = w * (0.3 + rnd.random() * 0.12)
        q.ball(r, cols[i % 4], at=(math.cos(a) * w * 0.28, 0.45 + rnd.random() * 0.3, math.sin(a) * w * 0.28), sub=1, jitter=0.12, seed=i)
    q.ball(w * 0.42, 0x58b84f, at=(0, 0.75, 0), sub=1, jitter=0.1, seed=9)
    for i in range(7):
        a = rnd.random() * 7
        q.ball(0.09, 0xffffff if i % 2 else 0xff9ff3, at=(math.cos(a) * w * 0.55, 0.7 + rnd.random() * 0.4, math.sin(a) * w * 0.55), uv=(5, 3))
    q.done()


# ---- Deko ----
@model('deko/gartenzwerg')
def gnome(root):
    p = Part('zwerg', root); skin = 0xf5c9a2
    p.lathe([(0.3, 0), (0.3, 0.1), (0.26, 0.45), (0.2, 0.52)], 0x2e86de, seg=8)  # Kittel
    p.cyl(0.275, 0.275, 0.06, 0x5d3f26, at=(0, 0.4, 0), seg=8); p.box(0.09, 0.08, 0.03, 0xffcc33, at=(0, 0.4, 0.27))
    for s in (-1, 1):
        p.box(0.14, 0.1, 0.24, 0x5d3f26, at=(s * 0.12, 0.05, 0.1), bevel=0.03)
        p.ball(0.08, skin, at=(s * 0.3, 0.32, 0.1), uv=(6, 4))
        p.ball(0.03, 0x111111, at=(s * 0.075, 0.7, 0.175), uv=(4, 3))
    p.ball(0.2, skin, at=(0, 0.65, 0), uv=(8, 6))
    p.ball(0.065, 0xf0a888, at=(0, 0.63, 0.2), uv=(6, 4))
    p.cone(0.2, 0.32, 0xffffff, at=(0, 0.48, 0.13), rot=(PI, 0, 0), seg=6)  # Bart
    v = p.cone(0.23, 0.55, 0xe74c3c, at=(0, 1.02, 0), seg=8)  # Zipfelmütze, Spitze nach hinten geknickt
    for x in v:
        if x.co.z > 1.2: x.co.y += 0.12
    p.done()


if __name__ == '__main__':
    want = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else list(MODELS)
    for rel in want:
        reset(); root = Node(os.path.basename(rel)); MODELS[rel](root); export(root, rel)
