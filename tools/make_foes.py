# Kleine Gegner (src/models.js, Abschnitt „Kleine Gegner“) als Low-Poly-GLB.
# Aufruf: blender --background --factory-startup --python tools/make_foes.py [-- name ...]
# Bewegliche Teile sind Knoten ohne „-m“ (Namen = userData: wing-0/1, leg-0/1, legs, tail, jaw, head, lamp),
# alle festen Teile heißen „…-m“. Lage und Drehpunkte wie in src/models.js, Ursprung am Boden, +Z vorne.
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


def peepers(p, s, x, y, z, iris=0x111111, angry=0.4, brow=0x222222):
    """Glubschaugen mit Pupille, Glanzpunkt und böser Braue (wie peepers() in models.js)."""
    for k in (-1, 1):
        p.ball(s, 0xffffff, at=(k * x, y, z), scale=(1, 1, 0.65), uv=(7, 5))
        p.ball(s * 0.55, iris, at=(k * x, y, z + s * 0.42), scale=(1, 1, 0.6), uv=(5, 3))
        p.ball(s * 0.2, 0xffffff, at=(k * x + s * 0.18, y + s * 0.2, z + s * 0.62), uv=(4, 3))
        p.box(s * 2, s * 0.45, s * 0.45, brow, at=(k * x, y + s * 1.05, z + s * 0.3), rot=(0, 0, -k * angry), bevel=s * 0.08)


# ---- Schnecke ----
@model('gegner/schnecke')
def snail(root, shell=0xc8875a):
    skin, dark = 0xb8d27a, shade(shell, 0.7)
    p = Part('body-m', root)
    p.ball(0.3, skin, at=(0, 0.14, 0.05), scale=(0.85, 0.45, 2.2), uv=(10, 6))  # Fuß
    p.ball(0.24, skin, at=(0, 0.4, 0.6), scale=(0.9, 1.3, 0.8), uv=(10, 7))  # Kopf
    p.ball(0.52, shell, at=(0, 0.66, -0.18), scale=(0.72, 1, 1), uv=(10, 7))
    for s in (-1, 1):  # Spirale auf beiden Seiten: zwei Ringe und Mitte
        p.torus(0.27, 0.07, dark, at=(s * 0.35, 0.68, -0.18), rot=(0, 0, PI / 2), seg=14, ring=5)
        p.torus(0.13, 0.05, dark, at=(s * 0.38, 0.7, -0.15), rot=(0, 0, PI / 2), seg=10, ring=4)
        p.ball(0.06, dark, at=(s * 0.39, 0.7, -0.14), uv=(5, 4))
        p.cyl(0.03, 0.04, 0.45, skin, at=(s * 0.13, 0.8, 0.7), rot=(0, 0, -s * 0.25), seg=5)
    peepers(p, 0.085, 0.19, 1.04, 0.72, 0x111111, 0.45, 0x3b5323)
    p.box(0.22, 0.04, 0.04, 0x3b5323, at=(0, 0.34, 0.8))
    p.done()


# ---- Fliegende Insekten ----
BUGS = {'wespe': (0xf5c518, 0x222222, 0x222222), 'biene': (0xf6b93b, 0x3d2b1f, 0x3d2b1f),
        'fliege': (0x2f3640, 0x1e272e, 0xc0392b), 'bremse': (0x7f6e5d, 0x4b3f35, 0x27ae60)}

def bug(root, kind):
    body, stripe, eyec = BUGS[kind]; striped = kind in ('wespe', 'biene'); big = kind in ('fliege', 'bremse')
    p = Part('body-m', root)
    p.ball(0.27, stripe if striped else body, at=(0, 0, 0.1), uv=(10, 7))
    p.ball(0.34, body, at=(0, -0.05, -0.4), scale=(0.85, 0.85, 1.25), uv=(10, 7))
    if striped:
        for i in range(2): p.torus(0.29 - i * 0.04, 0.06, stripe, at=(0, -0.05, -0.32 - i * 0.22), rot=(PI / 2, 0, 0), seg=12, ring=4)
    if kind == 'biene':
        p.ball(0.2, 0xfff3c4, at=(0, 0.06, 0.12), scale=(1.2, 0.8, 1), uv=(8, 5))  # Pelzkragen
    if kind == 'wespe': p.cone(0.06, 0.26, stripe, at=(0, -0.08, -0.92), rot=(-PI / 2, 0, 0), seg=5)
    p.ball(0.23, body, at=(0, 0.04, 0.42), uv=(10, 7))
    for s in (-1, 1):
        r = 0.15 if big else 0.11
        p.ball(r, eyec, at=(s * 0.14, 0.1, 0.52), uv=(8, 6))
        p.ball(0.035, 0xffffff, at=(s * 0.17, 0.17, 0.52 + r * 0.95), uv=(4, 3))
        p.box(0.18, 0.04, 0.04, stripe, at=(s * 0.12, 0.27, 0.56), rot=(0, 0, -s * 0.45))
        p.cyl(0.015, 0.015, 0.36, stripe, at=(s * 0.09, 0.36, 0.56), rot=(0.5, 0, -s * 0.35), seg=4)
        p.ball(0.03, stripe, at=(s * 0.15, 0.52, 0.65), uv=(4, 3))
        for i in range(3): p.box(0.04, 0.3, 0.04, stripe, at=(s * 0.12, -0.25, 0.2 - i * 0.12), rot=(0, 0, s * 0.3))
    p.done()
    for i, s in enumerate((-1, 1)):  # Flügel (im Spiel halb durchsichtig; hier hell und opak)
        w = Node(f'wing-{i}', root, (s * 0.12, 0.24, 0.05)); q = Part(f'wing-{i}-m', w)
        q.ball(0.34, 0xeaf6ff, at=(s * 0.32, 0, 0), scale=(1, 0.08, 0.5), uv=(10, 4))
        q.box(0.5, 0.02, 0.02, 0xb8c9d6, at=(s * 0.3, 0.02, 0)); q.done()

for k in BUGS: model('gegner/' + k)(lambda root, k=k: bug(root, k))


# ---- Käfer, Kakerlake, Einsiedler- und Hafenkrebs ----
def beetle(root, shell=0x6b3e1f, body=None, spots=None, spiral=None, claws=False, clawc=None, antenna=False):
    body = body if body is not None else shade(shell, 0.6)
    p = Part('body-m', root)
    if spiral:
        p.ball(0.55, spiral, at=(0, 0.72, -0.2), scale=(0.9, 1, 1.05), uv=(10, 7))
        p.cone(0.36, 0.62, shade(spiral, 0.85), at=(0, 1.3, -0.3), seg=8)
        for i in range(2): p.torus(0.46 - i * 0.14, 0.05, shade(spiral, 0.7), at=(0, 0.95 + i * 0.3, -0.24), seg=14, ring=4)
    else:
        p.ball(0.6, shell, at=(0, 0.45, -0.05), scale=(0.9, 0.55, 1.2), uv=(10, 7))
        p.box(0.03, 0.12, 1.3, shade(shell, 0.55), at=(0, 0.77, -0.05))
        p.ball(0.42, shade(shell, 1.3), at=(-0.15, 0.68, 0.1), scale=(0.5, 0.15, 0.7), uv=(6, 4))  # Glanz
        if spots:
            for x, z in ((0.25, 0.2), (-0.25, 0.2), (0.28, -0.35), (-0.28, -0.35)): p.ball(0.11, spots, at=(x, 0.72, z), scale=(1, 0.4, 1), uv=(6, 4))
    p.ball(0.27, body, at=(0, 0.38, 0.62), uv=(10, 7))
    peepers(p, 0.08, 0.12, 0.52, 0.78, 0x111111, 0.45, shade(body, 0.6))
    for s in (-1, 1):
        if claws:
            c = clawc if clawc is not None else body
            p.box(0.12, 0.12, 0.5, body, at=(s * 0.45, 0.35, 0.7), rot=(0, -s * 0.3, 0), bevel=0.03)
            p.ball(0.19, c, at=(s * 0.55, 0.4, 1.0), scale=(1, 0.85, 1.1), uv=(8, 6))
            p.cone(0.08, 0.28, c, at=(s * 0.52, 0.47, 1.2), rot=(PI / 2, 0, 0), seg=5)
            p.cone(0.06, 0.22, shade(c, 0.8), at=(s * 0.56, 0.33, 1.17), rot=(PI / 2, 0, 0), seg=5)
        if antenna:
            p.box(0.03, 0.03, 0.9, body, at=(s * 0.18, 0.62, 1.1), rot=(-0.5, s * 0.35, 0))
    p.done()
    for i, s in enumerate((-1, 1)):
        L = Node(f'leg-{i}', root, (s * 0.42, 0.32, 0)); q = Part(f'leg-{i}-m', L)
        for k in range(3):
            q.box(0.5, 0.07, 0.07, body, at=(s * 0.2, -0.12, -0.35 + k * 0.35), rot=(0, 0, -s * 0.5))
            q.ball(0.05, shade(body, 0.7), at=(s * 0.42, -0.25, -0.35 + k * 0.35), uv=(4, 3))
        q.done()

model('gegner/kakerlake')(lambda r: beetle(r, shell=0x7b4a24, antenna=True))
model('gegner/kaefer')(lambda r: beetle(r, shell=0x2d6a4f, spots=0x95d5b2))
model('gegner/einsiedler')(lambda r: beetle(r, spiral=0xf3c1a8, body=0xe17055, claws=True))
model('gegner/krebs')(lambda r: beetle(r, shell=0xc0392b, body=0x922b21, claws=True, clawc=0xe74c3c))


# ---- Frosch und Kröte ----
def frog(root, color):
    belly, dark = 0xe8f5c8, shade(color, 0.7)
    p = Part('body-m', root)
    p.ball(0.55, color, at=(0, 0.45, 0), scale=(1.1, 0.75, 1), uv=(10, 7))
    p.ball(0.45, belly, at=(0, 0.36, 0.14), scale=(1, 0.6, 0.9), uv=(10, 6))
    for s in (-1, 1):
        p.ball(0.2, color, at=(s * 0.3, 0.8, 0.3), uv=(8, 6))
        p.cyl(0.07, 0.08, 0.32, color, at=(s * 0.38, 0.15, 0.42), seg=6)
        for a in (-0.4, 0, 0.4): p.box(0.06, 0.05, 0.16, dark, at=(s * 0.4 + math.sin(a) * 0.08, 0.02, 0.5 + math.cos(a) * 0.05), rot=(0, a, 0))
        for x, z, r in ((0.32, -0.2, 0.09), (0.12, -0.32, 0.07), (0.42, 0.05, 0.06)): p.ball(r, dark, at=(s * x, 0.74 - abs(z) * 0.2, z), scale=(1, 0.4, 1), uv=(6, 4))
    peepers(p, 0.12, 0.3, 0.86, 0.42, 0x111111, 0.35, dark)
    p.box(0.62, 0.05, 0.05, 0x3b5323, at=(0, 0.42, 0.56))
    p.done()
    legs = Node('legs', root, (0, 0.3, -0.3)); q = Part('legs-m', legs)
    for s in (-1, 1):
        q.ball(0.2, color, at=(s * 0.5, 0, 0), scale=(0.7, 0.6, 1.5), uv=(8, 6))
        q.box(0.3, 0.06, 0.42, dark, at=(s * 0.55, -0.24, 0.14), bevel=0.02)
    q.done()

model('gegner/frosch')(lambda r: frog(r, 0x6ab04c))
model('gegner/kroete')(lambda r: frog(r, 0x8d7b4a))


# ---- Maulwurf und Gullyratte ----
def mole(root, color, nose, ears):
    paw = 0xf0c0a8
    p = Part('body-m', root)
    p.ball(0.6, color, at=(0, 0.6, 0), scale=(1, 1.15, 0.9), uv=(10, 7))
    p.ball(0.3, shade(color, 1.3), at=(0, 0.68, 0.38), scale=(1, 0.9, 1), uv=(10, 7))
    p.ball(0.16, nose, at=(0, 0.78, 0.6), uv=(8, 6))
    peepers(p, 0.08, 0.18, 0.98, 0.46, 0x111111, 0.5, shade(color, 0.6))
    for s in (-1, 1):
        p.box(0.07, 0.12, 0.04, 0xffffff, at=(s * 0.05, 0.55, 0.64))
        p.box(0.36, 0.1, 0.3, paw, at=(s * 0.55, 0.7, 0.32), rot=(0, 0, s * 0.5), bevel=0.03)
        for k in range(3): p.cone(0.035, 0.14, 0xfff8e0, at=(s * (0.62 + k * 0.0) + s * 0.05, 0.78 + k * 0.0, 0.42 + (k - 1) * 0.08), rot=(PI / 2, 0, 0), seg=4)
        if ears: p.ball(0.17, nose, at=(s * 0.34, 1.22, 0), scale=(1, 1, 0.4), uv=(8, 5))
        for dy in (0.03, -0.03): p.box(0.4, 0.012, 0.012, 0x2d2d2d, at=(s * 0.3, 0.74 + dy, 0.55), rot=(0, s * 0.2, s * dy * 4))
    p.done()

model('gegner/maulwurf')(lambda r: mole(r, 0x4a3b33, 0xff9aa9, False))
model('gegner/gullyratte')(lambda r: mole(r, 0x7a7a80, 0xff9aa9, True))


@model('gegner/wollmaus')
def dust_bunny(root):
    p = Part('body-m', root)
    p.ball(0.45, 0xa4b0be, at=(0, 0.5, 0), sub=2, jitter=0.08, seed=3)
    for i in range(10):
        a = i / 10 * 2 * PI
        p.ball(0.26 + (i % 3) * 0.05, 0xb2bec3 if i % 2 else 0x8395a7, at=(math.cos(a) * 0.36, 0.5 + math.sin(i * 2.3) * 0.2, math.sin(a) * 0.36), sub=1, jitter=0.15, seed=i)
    for i in range(5): p.box(0.03, 0.4, 0.03, 0x636e72, at=((i - 2) * 0.12, 1.0, -0.1), rot=(0, 0, (i - 2) * 0.3))
    peepers(p, 0.13, 0.17, 0.62, 0.48, 0x111111, 0.45, 0x2d3436)
    p.box(0.26, 0.05, 0.05, 0x2d3436, at=(0, 0.36, 0.56))
    p.done()


@model('gegner/miniratte')
def mini_rat(root):
    c, pink = 0x6f6f72, 0xffb6c1
    p = Part('body-m', root)
    p.ball(0.45, c, at=(0, 0.42, 0), scale=(0.8, 0.75, 1.3), uv=(10, 7))
    p.cone(0.28, 0.6, c, at=(0, 0.48, 0.7), rot=(PI / 2, 0, 0), seg=8)
    p.ball(0.07, 0xff6f91, at=(0, 0.48, 1.0), uv=(6, 4))
    for s in (-1, 1):
        p.ball(0.15, pink, at=(s * 0.22, 0.78, 0.45), scale=(1, 1, 0.4), uv=(8, 5))
        p.ball(0.055, 0xd63031, at=(s * 0.11, 0.6, 0.72), uv=(5, 4))
        p.ball(0.08, pink, at=(s * 0.22, 0.06, 0.35), scale=(0.8, 0.5, 1.2), uv=(6, 4))
        p.ball(0.08, pink, at=(s * 0.22, 0.06, -0.35), scale=(0.8, 0.5, 1.2), uv=(6, 4))
        p.box(0.13, 0.03, 0.03, 0x3a3a3c, at=(s * 0.11, 0.68, 0.73), rot=(0, 0, -s * 0.5))
        for dy in (0.03, -0.03): p.box(0.35, 0.01, 0.01, 0xdddddd, at=(s * 0.22, 0.5 + dy, 0.88), rot=(0, s * 0.3, s * dy * 4))
    p.box(0.1, 0.1, 0.04, 0xfff8e0, at=(0, 0.36, 0.92))
    p.done()
    t = Node('tail', root, (0, 0.38, -0.55)); q = Part('tail-m', t)
    q.cyl(0.02, 0.045, 0.9, pink, at=(0, 0, -0.45), rot=(PI / 2, 0, 0), seg=5); q.done()


@model('gegner/putzroboter')
def robo(root):
    p = Part('body-m', root)
    p.cyl(0.6, 0.65, 0.3, 0x2d3436, at=(0, 0.2, 0), seg=16)
    p.cyl(0.5, 0.55, 0.06, 0x636e72, at=(0, 0.37, 0), seg=16)
    p.torus(0.63, 0.04, 0x111111, at=(0, 0.1, 0), seg=16, ring=4)
    p.box(0.9, 0.2, 0.16, 0xfdcb6e, at=(0, 0.16, 0.56), bevel=0.04)
    for i in range(5): p.box(0.08, 0.205, 0.05, 0x2d3436, at=(-0.32 + i * 0.16, 0.16, 0.63), rot=(0, 0, 0.6))  # Warnstreifen
    p.box(0.56, 0.14, 0.05, 0x111111, at=(0, 0.3, 0.6), bevel=0.02)
    for s in (-1, 1):
        p.box(0.12, 0.07, 0.03, 0x81ecec, at=(s * 0.14, 0.31, 0.63))
        p.box(0.16, 0.03, 0.03, 0xfdcb6e, at=(s * 0.14, 0.4, 0.62), rot=(0, 0, -s * 0.4))
        p.cyl(0.16, 0.16, 0.03, 0xb2bec3, at=(s * 0.5, 0.05, 0.5), seg=8)
        for k in range(3): p.box(0.3, 0.01, 0.02, 0x636e72, at=(s * 0.5, 0.07, 0.5), rot=(0, k / 3 * PI, 0))  # Bürsten
    p.done()
    l = Node('lamp', root, (0, 0.46, -0.1)); q = Part('lamp-m', l)
    q.ball(0.09, 0xff5252, uv=(8, 5)); q.cyl(0.1, 0.1, 0.04, 0x636e72, at=(0, -0.06, 0), seg=8); q.done()


@model('gegner/tacker')
def stapler(root):
    red = 0xd63031
    p = Part('body-m', root)
    p.box(0.5, 0.15, 1.3, 0x2d3436, at=(0, 0.08, 0), bevel=0.05)
    p.box(0.3, 0.2, 0.3, 0x636e72, at=(0, 0.25, -0.5), bevel=0.04)
    p.cyl(0.08, 0.08, 0.34, 0xb2bec3, at=(0, 0.3, -0.55), rot=(0, 0, PI / 2), seg=6)
    p.box(0.3, 0.02, 0.2, 0xb2bec3, at=(0, 0.17, 0.5))  # Amboss
    p.done()
    jaw = Node('jaw', root, (0, 0.3, -0.55)); q = Part('jaw-m', jaw)
    q.box(0.46, 0.28, 1.25, red, at=(0, 0.16, 0.6), bevel=0.07)
    q.box(0.48, 0.05, 1.22, 0xb2bec3, at=(0, 0.0, 0.62), bevel=0.015)
    peepers(q, 0.09, 0.12, 0.38, 1.1, 0x111111, 0.5, 0x2d3436)
    for i in range(4): q.box(0.06, 0.08, 0.04, 0xffffff, at=(-0.15 + i * 0.1, -0.06, 1.2))
    q.done()


@model('gegner/drohne')
def drone(root):
    p = Part('body-m', root)
    p.box(0.6, 0.22, 0.6, 0xdfe6e9, bevel=0.07)
    p.ball(0.25, 0xdfe6e9, at=(0, 0.1, 0), scale=(1, 0.45, 1), uv=(10, 5))
    for r in (PI / 4, -PI / 4): p.box(1.5, 0.08, 0.1, 0x636e72, rot=(0, r, 0), bevel=0.02)
    for x, z in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        p.cyl(0.07, 0.07, 0.14, 0x2d3436, at=(x * 0.53, 0.08, z * 0.53), seg=6)
        p.box(0.6, 0.015, 0.07, 0xc8d6e5, at=(x * 0.53, 0.16, z * 0.53), rot=(0, x * z * 0.5, 0), bevel=0.005)  # Rotorblätter
        p.torus(0.31, 0.02, 0x636e72, at=(x * 0.53, 0.16, z * 0.53), seg=12, ring=3)
    p.cyl(0.17, 0.17, 0.1, 0x2d3436, at=(0, -0.08, 0.22), seg=10)
    p.ball(0.15, 0x111111, at=(0, -0.12, 0.25), uv=(8, 6)); p.ball(0.05, 0xffffff, at=(0.05, -0.08, 0.38), uv=(4, 3))
    p.done()
    l = Node('lamp', root, (0, 0.14, 0.25)); q = Part('lamp-m', l); q.ball(0.06, 0xff5252, uv=(6, 4)); q.done()


@model('gegner/fledermaus')
def bat(root):
    c, inner = 0x4b3f5c, 0x8e7cc3
    p = Part('body-m', root)
    p.ball(0.3, c, scale=(0.9, 1, 1.1), uv=(10, 7)); p.ball(0.24, c, at=(0, 0.12, 0.26), uv=(10, 7))
    for s in (-1, 1):
        p.cone(0.09, 0.26, c, at=(s * 0.14, 0.38, 0.22), seg=4); p.cone(0.05, 0.16, inner, at=(s * 0.14, 0.36, 0.25), seg=4)
        p.ball(0.06, 0xffd32a, at=(s * 0.09, 0.17, 0.46), uv=(6, 4)); p.ball(0.025, 0x111111, at=(s * 0.09, 0.17, 0.51), uv=(4, 3))
        p.cone(0.02, 0.08, 0xffffff, at=(s * 0.05, -0.02, 0.48), rot=(PI, 0, 0), seg=4)
        p.cyl(0.02, 0.02, 0.15, c, at=(s * 0.1, -0.33, -0.05), seg=4)
    p.done()
    for i, s in enumerate((-1, 1)):
        w = Node(f'wing-{i}', root, (s * 0.22, 0.05, 0)); q = Part(f'wing-{i}-m', w)
        q.box(0.8, 0.04, 0.5, c, at=(s * 0.42, 0, 0)); q.box(0.6, 0.045, 0.3, inner, at=(s * 0.4, -0.01, -0.05))
        for k in range(3):
            q.box(0.05, 0.06, 0.55, shade(c, 0.7), at=(s * (0.25 + k * 0.25), 0.01, -0.02))
            q.cone(0.1, 0.14, c, at=(s * (0.3 + k * 0.25), 0, -0.3), rot=(-PI / 2, 0, 0), seg=3, scale=(1, 1, 0.3))  # Zacken am Rand
        q.done()


def fowl(root, goose):
    c = 0xf5f6fa if goose else 0xb9773a; light = 0xffffff if goose else 0xe8c39e; beak = 0xf39c12; s = 1.25 if goose else 1
    p = Part('body-m', root)
    p.ball(0.45 * s, c, at=(0, 0.62 * s, 0), scale=(0.85, 0.8, 1.15), uv=(10, 7))
    p.ball(0.38 * s, light, at=(0, 0.55 * s, 0.12 * s), scale=(0.8, 0.7, 0.9), uv=(10, 6))
    for k in (-1, 1):
        p.ball(0.3 * s, shade(c, 0.85), at=(k * 0.36 * s, 0.68 * s, -0.05), scale=(0.25, 0.6, 1), uv=(8, 5))
        p.cyl(0.04, 0.04, 0.35 * s, beak, at=(k * 0.15, 0.17 * s, 0), seg=4)
        for a in (-0.4, 0, 0.4): p.box(0.05, 0.04, 0.18, beak, at=(k * 0.15 + math.sin(a) * 0.06, 0.02, 0.08), rot=(0, a, 0))
    for k in (-1, 0, 1): p.box(0.1, 0.4 * s, 0.1, shade(c, 0.8), at=(k * 0.1, 0.9 * s, -0.5 * s), rot=(-0.6, 0, k * 0.3), bevel=0.03)
    if goose: p.cyl(0.11 * s, 0.13 * s, 0.6 * s, c, at=(0, 0.98 * s, 0.38 * s), seg=7)
    p.done()
    head = Node('head', root, (0, 1.32 * s if goose else 1.0, 0.42 * s if goose else 0.38)); h = Part('head-m', head)
    h.ball(0.2 * s, c, uv=(10, 7)); h.cone(0.08 * s, 0.26 * s, beak, at=(0, -0.03, 0.26 * s), rot=(PI / 2, 0, 0), seg=6)
    if goose: h.ball(0.05 * s, 0x2d2d2d, at=(0, 0.02, 0.37 * s), scale=(1, 0.6, 1), uv=(5, 3))
    peepers(h, 0.05 * s, 0.11 * s, 0.06, 0.13 * s, 0x111111, 0.55, 0x2d2d2d)
    if not goose:
        for i, z in enumerate((-0.08, 0.02, 0.12)): h.ball(0.06 + (i % 2) * 0.02, 0xe74c3c, at=(0, 0.2 + (i % 2) * 0.03, z), scale=(0.6, 1.2, 1), uv=(6, 4))
        h.ball(0.06, 0xe74c3c, at=(0, -0.16, 0.18), scale=(0.7, 1.2, 0.7), uv=(5, 4))
    h.done()

model('gegner/huhn')(lambda r: fowl(r, False))
model('gegner/gans')(lambda r: fowl(r, True))


@model('gegner/minimoewe')
def mini_gull(root):
    c, wing, tip = 0xf4f4f4, 0xbfc7cc, 0x2d2d2d
    p = Part('body-m', root)
    p.ball(0.3, c, scale=(0.8, 0.8, 1.5), uv=(10, 7)); p.ball(0.22, c, at=(0, 0.18, 0.4), uv=(10, 7))
    p.cone(0.07, 0.3, 0xffb21c, at=(0, 0.14, 0.7), rot=(PI / 2, 0, 0), seg=5); p.ball(0.035, 0xe74c3c, at=(0, 0.1, 0.72), uv=(4, 3))
    peepers(p, 0.05, 0.11, 0.26, 0.55, 0xffe066, 0.5, tip)
    for k in (-1, 0, 1): p.box(0.12, 0.05, 0.32, wing if k else tip, at=(k * 0.09, 0.02, -0.5), rot=(0, k * 0.3, 0))
    p.done()
    for i, s in enumerate((-1, 1)):
        w = Node(f'wing-{i}', root, (s * 0.18, 0.08, 0)); q = Part(f'wing-{i}-m', w)
        q.box(0.9, 0.05, 0.42, wing, at=(s * 0.45, 0, 0), bevel=0.015); q.box(0.32, 0.055, 0.38, tip, at=(s * 0.95, 0, -0.02), bevel=0.015); q.done()


if __name__ == '__main__':
    want = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else list(MODELS)
    for rel in want:
        reset(); root = Node(os.path.basename(rel)); MODELS[rel](root); export(root, rel)
