# Restliche Modelle: Qualle, Schmetterling, Taucherbrille, Flammen, Portal-Rahmen, Holzschild-Rahmen.
# Aufruf: blender --background --factory-startup --python tools/make_rest.py [-- name ...]
# Durchsichtige/leuchtende Teile sind hier opak in Pastellfarben; Transparenz und Leuchten setzt bei Bedarf der Lader.
# Bewegliche Knoten (ohne „-m“): Qualle bell, core, tent-0..7 mit tentSeg-0..23 (je drei Glieder als Kette),
# Schmetterling wing-0/1, Flammen list-0..2. Alle festen Teile heißen „…-m“.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_lib import reset, Part, Node, export

PI = math.pi
MODELS = {}
def model(rel):
    def reg(fn): MODELS[rel] = fn; return fn
    return reg


@model('figuren/qualle')
def jelly(root):  # makeJelly: Glocke um y 0, Tentakel hängen nach unten
    pink, frill, core = 0xff9ff3, 0xff7fe0, 0xffd6f6
    bell = Node('bell', root); p = Part('bell-m', bell)
    p.lathe([(0.62, 0.0), (0.6, 0.18), (0.52, 0.36), (0.38, 0.5), (0.2, 0.58), (0, 0.6)], pink, seg=14)
    p.cyl(0.58, 0.58, 0.02, shade_mul(pink, 0.85), at=(0, 0.01, 0), seg=14)  # Unterseite
    p.torus(0.6, 0.06, frill, seg=18, ring=4)
    for k in range(7): p.ball(0.06, 0xffe0fa, at=(math.cos(k * 0.9) * 0.3, 0.42 + (k % 2) * 0.06, math.sin(k * 0.9) * 0.3), uv=(5, 3))  # Punkte
    p.done()
    c = Node('core', bell, (0, 0.05, 0)); q = Part('core-m', c); q.ball(0.3, core, scale=(1, 0.8, 1), uv=(10, 5)); q.done()
    for s in (-1, 1):  # freundliche Augen auf der Glocke
        q = Part(f'auge-{s}-m', bell); q.ball(0.07, 0x5a1e4f, at=(s * 0.18, 0.32, 0.47), scale=(1, 1.2, 0.6), uv=(6, 4)); q.ball(0.025, 0xffffff, at=(s * 0.18 + 0.02, 0.36, 0.51), uv=(4, 3)); q.done()
    n = 0
    for i in range(8):
        a = i / 8 * 2 * PI; par = Node(f'tent-{i}', root, (math.cos(a) * 0.38, 0, math.sin(a) * 0.38))
        for k in range(3):
            sgn = Node(f'tentSeg-{n}', par, (0, 0 if k == 0 else -0.42, 0)); n += 1
            q = Part(f'tentSeg-{n - 1}-m', sgn); q.cyl(0.03 - k * 0.008, 0.035 - k * 0.008, 0.44, pink if k < 2 else frill, at=(0, -0.21, 0), seg=4); q.done()
            par = sgn


def shade_mul(c, k):
    return (min(255, int(((c >> 16) & 255) * k)) << 16) | (min(255, int(((c >> 8) & 255) * k)) << 8) | min(255, int((c & 255) * k))


@model('tiere/schmetterling')
def butterfly(root):  # makeButterfly: Körper entlang z, Flügel an Gelenken (Farbe per paint)
    col = 0xff9ff3
    p = Part('body-m', root)
    p.ball(0.04, 0x333333, at=(0, 0, 0.06), scale=(1, 1, 1.6), uv=(6, 4)); p.ball(0.035, 0x333333, at=(0, 0, -0.07), scale=(1, 1, 2.2), uv=(6, 4))
    p.ball(0.035, 0x333333, at=(0, 0.01, 0.15), uv=(6, 4))
    for s in (-1, 1): p.box(0.01, 0.01, 0.14, 0x333333, at=(s * 0.03, 0.04, 0.22), rot=(0.6, s * 0.4, 0))
    p.done()
    for i, sx in enumerate((1, -1)):
        w = Node(f'wing-{i}', root); q = Part(f'wing-{i}-m', w)
        q.cyl(0.13, 0.13, 0.012, col, at=(sx * 0.15, 0, 0.06), seg=6, scale=(1, 1, 1.15))  # Vorderflügel
        q.cyl(0.1, 0.1, 0.012, shade_mul(col, 0.8), at=(sx * 0.12, 0, -0.1), seg=6)  # Hinterflügel
        q.cyl(0.04, 0.04, 0.014, 0xffffff, at=(sx * 0.18, 0.001, 0.08), seg=6)  # Fleck
        q.cyl(0.025, 0.025, 0.014, 0x333333, at=(sx * 0.12, 0.001, -0.1), seg=5)
        q.done()


@model('deko/taucherbrille')
def goggles(root):  # makeGoggles (ohne die 1,3-Skalierung); steht aufrecht, Mitte bei y 0
    p = Part('brille-m', root)
    for x in (-0.32, 0.32):
        p.torus(0.26, 0.07, 0xff7f27, at=(x, 0, 0), rot=(PI / 2, 0, 0), seg=16, ring=5)
        p.cyl(0.24, 0.24, 0.03, 0x9be7ff, at=(x, 0, 0.01), rot=(PI / 2, 0, 0), seg=16)
        p.box(0.08, 0.06, 0.02, 0xffffff, at=(x - 0.08, 0.1, 0.035), rot=(0, 0, 0.6))  # Glanz
    p.box(0.2, 0.08, 0.08, 0xff7f27, bevel=0.02)
    p.torus(0.62, 0.04, 0x2d3436, at=(0, 0, -0.05), seg=20, ring=4, arc=PI)
    p.done()


@model('deko/flammen')
def flames(root):  # makeFlames: drei Flammenkegel, einzeln animierbar
    for i, (x, c, r, h) in enumerate([(0, 0xff7f27, 0.45, 1.3), (-0.3, 0xffb142, 0.3, 0.9), (0.32, 0xffd32a, 0.28, 0.8)]):
        n = Node(f'list-{i}', root, (x, h / 2, 0)); p = Part(f'list-{i}-m', n)
        v = p.cone(r, h, c, seg=6)
        for k, vt in enumerate(v):  # Flammenspitze leicht verdreht, Rand gewellt
            if vt.co.z > 0.01: vt.co.x += 0.05 * (1 if i % 2 else -1)
        p.cone(r * 0.55, h * 0.6, 0xfff3a0, at=(0, -h * 0.18, 0.05), seg=6)  # heller Kern
        p.done()
    q = Part('glut-m', root)
    for k in range(5):
        a = k / 5 * 2 * PI; q.box(0.5, 0.12, 0.12, 0x5d3f26, at=(math.cos(a) * 0.25, 0.06, math.sin(a) * 0.25), rot=(0, -a, 0), bevel=0.03)
    q.done()


@model('deko/portal-rahmen')
def portal_frame(root):  # Steinsockel, Säulen und Ring von level.portal(); Strudel, Edelsteine und Kugeln bleiben im Code
    p = Part('rahmen-m', root)
    p.cyl(2.3, 2.5, 0.3, 0xb8b0a0, at=(0, 0.15, 0), seg=10)
    p.cyl(1.9, 2.1, 0.15, 0xd6cfc0, at=(0, 0.37, 0), seg=10)
    for k in range(10):  # Fugen im Sockel
        a = k / 10 * 2 * PI; p.box(0.04, 0.31, 0.3, 0x9a9280, at=(math.cos(a) * 2.35, 0.15, math.sin(a) * 2.35), rot=(0, -a, 0))
    for sx in (-1, 1):
        p.box(0.45, 3.4, 0.45, 0xcfc6b4, at=(sx * 2.05, 2.0, 0), bevel=0.05)
        for k in range(4): p.box(0.47, 0.05, 0.47, 0xb8b0a0, at=(sx * 2.05, 0.9 + k * 0.8, 0))  # Steinlagen
        p.box(0.7, 0.3, 0.7, 0xb8b0a0, at=(sx * 2.05, 0.45, 0), bevel=0.05)
        p.box(0.7, 0.25, 0.7, 0xb8b0a0, at=(sx * 2.05, 3.8, 0), bevel=0.05)
        p.cyl(0.2, 0.28, 0.12, 0x9a9080, at=(sx * 2.05, 3.98, 0), seg=8)  # Schale für die Kugel
    p.torus(1.6, 0.2, 0x9a9080, at=(0, 2.2, 0), rot=(PI / 2, 0, 0), seg=32, ring=6)
    for k in range(12):  # Fassungen der Edelsteine
        a = k / 12 * 2 * PI; p.box(0.34, 0.34, 0.2, 0x8a8070, at=(math.cos(a) * 1.6, 2.2 + math.sin(a) * 1.6, -0.12), rot=(0, 0, a + PI / 4))
    p.done()


def sign_frame(root, post):  # makeSign-Rahmen (w 2,6): Brett ohne Schrift (die Schrift bleibt Canvas-Textur im Code)
    w, h, dark, wood = 2.6, 0.65, 0x5a3715, 0xc8955a
    p = Part('schild-m', root)
    y = post + h / 2
    p.box(w + 0.14, h + 0.14, 0.12, dark, at=(0, y, 0), bevel=0.03)
    for k in range(4): p.box(w, 0.012, 0.125, 0x7a4a1f, at=(0, y - h / 2 + 0.12 + k * 0.14, 0))  # Brettfugen
    for sx in (-1, 1):
        for sz in (-1, 1): p.cyl(0.035, 0.035, 0.02, 0x9a9a9a, at=(sx * (w / 2 - 0.02), y + 0.22 * sz, 0.065), rot=(PI / 2, 0, 0), seg=6)  # Nägel
    if post:
        for sx in (-1, 1):
            ph = post + h + 0.12
            p.box(0.16, ph, 0.16, dark, at=(sx * (w / 2 + 0.15), ph / 2, 0), bevel=0.03)
            p.cone(0.11, 0.14, dark, at=(sx * (w / 2 + 0.15), ph + 0.07, 0), seg=4, rot=(0, PI / 4, 0))
    p.done()

model('deko/schild')(lambda root: sign_frame(root, 0))
model('deko/schild-pfosten')(lambda root: sign_frame(root, 1.2))


if __name__ == '__main__':
    want = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else list(MODELS)
    for rel in want:
        reset(); root = Node(os.path.basename(rel)); MODELS[rel](root); export(root, rel)
