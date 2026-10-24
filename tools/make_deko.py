# Deko-Requisiten aus src/props.js als Low-Poly-GLB (einfarbige Materialien → Vertexfarben im Spiel).
# Aufruf: blender --background --factory-startup --python tools/make_deko.py [-- name ...]   (name = JS-Funktionsname)
# Je Funktion eine Datei assets/requisiten/<funktionsname>.glb mit den Standard-Parametern der JS-Funktion:
# gleicher Ursprung, gleiche Maße/Ausrichtung und Farben, nur schöner (Fasen, Rundungen, kleine Details).
# Mesh-Teile heißen „…-m“; bewegliche Teile sind Knoten mit dem userData-Namen: pinwheel > spin, flagPole > wave.
import sys, os, math, random
import bpy, bmesh
from mathutils import Matrix, Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_lib import reset, Part, Node, export, to_bl

PI = math.pi
MODELS = {}
def model(rel):
    def reg(fn): MODELS[rel] = fn; return fn
    return reg

WOOD, DWOOD, LWOOD, STONE, DSTONE, METAL, DARK, WHITE = 0x8d6e4a, 0x5d4037, 0xc49a6c, 0x9e9e9e, 0x7f8c8d, 0x636e72, 0x2d3436, 0xf5f6fa
LEAF, ROOF0, WALL0 = 0x4caa4c, 0xb71c1c, 0xf3d9a6
BARK, DBARK, CUT, SOIL, GLASS, LIGHT, ROPE = 0x7a4a1f, 0x5e3815, 0xd7b98e, 0x5d3f26, 0x9ad7ff, 0xfff3a0, 0xd7b98e
AX, AZ = (0, 0, PI / 2), (PI / 2, 0, 0)  # Zylinderachse entlang x bzw. z


# ---------------- Werkzeuge: Spiel-Koordinaten, Drehung wie three.js (Euler XYZ: R = Rx·Ry·Rz)
_C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1))); _CI = _C.inverted()
def RX(a): return Matrix.Rotation(a, 4, 'X')
def RY(a): return Matrix.Rotation(a, 4, 'Y')
def RZ(a): return Matrix.Rotation(a, 4, 'Z')
def SC(x, y, z): return Matrix.Diagonal((x, y, z, 1))
def E(r): return RX(r[0]) @ RY(r[1]) @ RZ(r[2])


def dk(c, f=0.8):
    return (int(((c >> 16) & 255) * f) << 16) | (int(((c >> 8) & 255) * f) << 8) | int((c & 255) * f)


def place(p, vs, at=(0, 0, 0), rot=(0, 0, 0), m=None, post=None):
    """Vertices eines mit new()/hull() gebauten Stücks verschieben/drehen und ins Teil übernehmen."""
    g = m if m is not None else E(rot)
    tmp = getattr(p, '_tmp', None)
    bmesh.ops.transform(tmp or p.bm, matrix=Matrix.Translation(to_bl(*at)) @ _C @ g @ _CI, verts=vs)
    if post: post(vs)
    if tmp is not None:  # über ein Mesh anhängen: bmesh-Operatoren können Vertex-Zeiger ungültig machen
        me = bpy.data.meshes.new('tmp'); tmp.to_mesh(me); p.bm.from_mesh(me); bpy.data.meshes.remove(me); tmp.free(); p._tmp = None
    return vs


def new(p, kind, *a, **k):
    """Grundkörper in einem eigenen bmesh am Ursprung bauen und seine Vertices liefern (place() hängt ihn an)."""
    old = p.bm; p.bm = bmesh.new()
    try: getattr(p, kind)(*a, **k)
    finally: p._tmp, p.bm = p.bm, old
    return list(p._tmp.verts)


def put(p, kind, *a, at=(0, 0, 0), rot=(0, 0, 0), m=None, post=None, **k):
    return place(p, new(p, kind, *a, **k), at, rot, m, post)


def flat_bottom(vs):
    for v in vs:
        if v.co.z < 0.0: v.co.z = 0.0


def ring_index(vs, n):
    """Winkelindex (0..n-1) um die Spiel-y-Achse für Vertices am Ursprung."""
    a0 = next(math.atan2(v.co.y, v.co.x) for v in vs if math.hypot(v.co.x, v.co.y) > 1e-6)
    return lambda v: round((math.atan2(v.co.y, v.co.x) - a0) / (2 * PI / n)) % n


def ribs(vs, n, k):
    """Jede zweite Längsreihe nach innen ziehen (Kürbis, Kaktus, Blütenstern)."""
    idx = ring_index(vs, n)
    for v in vs:
        if math.hypot(v.co.x, v.co.y) > 1e-6 and idx(v) % 2: v.co.x *= k; v.co.y *= k
    return vs


def wobble(vs, amp, seed=0):
    """Radius je Winkel leicht verändern (Facetten-Variation für Organisches)."""
    for v in vs:
        a = math.atan2(v.co.y, v.co.x); f = 1 + amp * (0.6 * math.sin(3 * a + seed) + 0.4 * math.sin(5 * a + 2.3 * seed))
        v.co.x *= f; v.co.y *= f
    return vs


def rcyl(p, r, h, color, at=(0, 0, 0), rot=(0, 0, 0), m=None, seg=10, b=0.03, rt=None):
    """Zylinder mit gefasten Kanten (Mitte bei at)."""
    rt = r if rt is None else rt
    return put(p, 'lathe', [(r - b, -h / 2), (r, -h / 2 + b), (rt, h / 2 - b), (rt - b, h / 2)], color, seg=seg, at=at, rot=rot, m=m)


def lth(p, prof, color, at=(0, 0, 0), rot=(0, 0, 0), m=None, seg=10):
    return put(p, 'lathe', prof, color, seg=seg, at=at, rot=rot, m=m)


def hull(p, pts, color, at=(0, 0, 0), rot=(0, 0, 0), m=None):
    """Konvexe Hülle um Punkte (Spiel-Koordinaten, lokal zu at/rot)."""
    bm = bmesh.new(); vs = [bm.verts.new(to_bl(*q)) for q in pts]
    r = bmesh.ops.convex_hull(bm, input=vs, use_existing_faces=False)
    junk = [g for g in r['geom_interior'] + r['geom_unused'] if isinstance(g, bmesh.types.BMVert)]
    if junk: bmesh.ops.delete(bm, geom=junk, context='VERTS')
    idx = p._slot(color)
    for f in bm.faces: f.material_index = idx
    p._tmp = bm
    return place(p, list(bm.verts), at, rot, m)


def _orient(a, b):
    a, b = Vector(a), Vector(b); d = b - a
    return a, b, d.length, Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4()


def rod(p, a, b, r, color, seg=6, rt=None):
    """Stab von a nach b (rt = Radius am Ende b)."""
    a, b, L, q = _orient(a, b)
    return put(p, 'cyl', r if rt is None else rt, r, L, color, seg=seg, at=tuple((a + b) / 2), m=q)


def beam(p, a, b, w, d, color, bevel=0):
    """Kantholz von a nach b."""
    a, b, L, q = _orient(a, b)
    return put(p, 'box', w, L, d, color, bevel=bevel, at=tuple((a + b) / 2), m=q)


def tube(p, pts, r, color, ring=5, closed=False):
    """Schlauch (Seil, Reling) entlang einer Punktfolge, Rahmen per Parallelverschiebung."""
    pts = [Vector(q) for q in pts]; n = len(pts); bm = p.bm; rings = []; u = None
    for i, q in enumerate(pts):
        t = (pts[(i + 1) % n] - pts[i - 1]) if closed else (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)])
        t.normalize()
        if u is None: u = t.cross(Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))).normalized()
        else: u = (u - t * u.dot(t)).normalized()
        w = t.cross(u)
        rings.append([bm.verts.new(to_bl(*(q + r * math.cos(2 * PI * k / ring) * u + r * math.sin(2 * PI * k / ring) * w))) for k in range(ring)])
    fs = []
    for i in range(n if closed else n - 1):
        a, b = rings[i], rings[(i + 1) % n]
        for k in range(ring): fs.append(bm.faces.new((a[k], b[k], b[(k + 1) % ring], a[(k + 1) % ring])))
    if not closed: fs += [bm.faces.new(rings[0]), bm.faces.new(list(reversed(rings[-1])))]
    idx = p._slot(color)
    for f in fs: f.material_index = idx


def sheet(p, pts, hy, t, color):
    """Dünnes, gewelltes Tuch: pts = [(x, z), …] entlang der Länge, Höhe ±hy, Dicke t."""
    bm = p.bm; rows = []
    for x, z in pts:
        rows.append([bm.verts.new(to_bl(x, y, z + dz)) for y, dz in ((-hy, -t / 2), (hy, -t / 2), (hy, t / 2), (-hy, t / 2))])
    fs = []
    for a, b in zip(rows, rows[1:]):
        for k in range(4): fs.append(bm.faces.new((a[k], b[k], b[(k + 1) % 4], a[(k + 1) % 4])))
    fs += [bm.faces.new(rows[0]), bm.faces.new(list(reversed(rows[-1])))]
    idx = p._slot(color)
    for f in fs: f.material_index = idx


def loc(at, ry, x, y, z):
    v = Matrix.Rotation(ry, 3, 'Y') @ Vector((x, y, z))
    return (at[0] + v.x, at[1] + v.y, at[2] + v.z)


def grain_box(p, w, h, d, color, at, rot=(0, 0, 0), bevel=0.015, n=2, along='x'):
    """Brett mit Maserungsleisten auf der Oberseite (entlang x oder z)."""
    put(p, 'box', w, h, d, color, bevel=bevel, at=at, rot=rot)
    g = dk(color, 0.8); R = E(rot).to_3x3()
    for i in range(n):
        f = (i + 1) / (n + 1) - 0.5; k = 0.5 + 0.25 * (i % 2)
        if along == 'x': off, size = Vector((0.08 * (i - 0.5) * w, h / 2 + 0.002, f * d)), (w * k, 0.006, 0.018)
        else: off, size = Vector((f * w, h / 2 + 0.002, 0.08 * (i - 0.5) * d)), (0.018, 0.006, d * k)
        c = Vector(at) + R @ off
        put(p, 'box', *size, g, at=tuple(c), rot=rot)


def rock_into(p, s, c, at, ry=0, seed=0, chip=True):
    put(p, 'ball', s, c, sub=2 if chip else 1, jitter=0.08, seed=seed, scale=(1, 0.65, 0.85), at=at, rot=(0, ry, 0))
    if chip:
        R = RY(ry).to_3x3(); o = R @ Vector((0.42 * s, 0.12 * s, 0.25 * s))
        put(p, 'ball', 0.5 * s, c, sub=1, jitter=0.15, seed=seed + 7, scale=(1, 0.6, 0.9), at=(at[0] + o.x, at[1] + o.y, at[2] + o.z), rot=(0, ry + 1, 0))


# ================================================================ Natur
@model('requisiten/rock')
def rock(p, root):
    rock_into(p, 1, STONE, (0, 0.35, 0), ry=7, seed=1)


@model('requisiten/rocks')
def rocks(p, root):
    rock_into(p, 1, STONE, (0, 0.35, 0), ry=7, seed=1)
    for i, (x, z, k) in enumerate([(0.9, 0.3, 0.45), (-0.8, -0.5, 0.35), (0.2, -0.9, 0.3)]):
        rock_into(p, k, STONE if k > 0.4 else DSTONE, (x, k * 0.3, z), ry=k * 7, seed=10 + i, chip=False)


@model('requisiten/stump')
def stump(p, root):
    vs = new(p, 'lathe', [(0.6, 0), (0.53, 0.07), (0.47, 0.3), (0.45, 0.6)], BARK, seg=9)
    place(p, wobble(vs, 0.05, 1))
    for i in range(4):
        a = i / 4 * 2 * PI + 0.4
        p.cone(0.18, 0.6, DBARK, at=(math.cos(a) * 0.45, 0.18, math.sin(a) * 0.45), rot=(-math.sin(a) * 0.8, 0, math.cos(a) * 0.8), seg=5)
    for r, h, c in ((0.43, 0.05, CUT), (0.3, 0.054, 0xb8935f), (0.22, 0.058, CUT), (0.09, 0.062, 0xb8935f)):
        put(p, 'cyl', r, r, h, c, seg=9, at=(0, 0.6, 0))
    p.box(0.08, 0.02, 0.5, 0x8a6a45, at=(0.05, 0.63, 0.02), rot=(0, 0.5, 0))  # Riss


def log_into(p, L, at):
    x0, y0, z0 = at
    vs = new(p, 'cyl', 0.35, 0.35, L, BARK, seg=9)
    place(p, wobble(vs, 0.04, 2), at=at, rot=AX)
    for s in (-1, 1):
        x = x0 + s * (L / 2 + 0.005)
        for r, w, c in ((0.3, 0.03, CUT), (0.2, 0.034, 0xb8935f), (0.08, 0.038, CUT)):
            put(p, 'cyl', r, r, w, c, seg=9, at=(x, y0, z0), rot=AX)
    for i, t in enumerate((0.7, 2.6, 4.4)):  # Rindenleisten
        put(p, 'box', L * (0.45 + 0.1 * i), 0.04, 0.07, DBARK, at=(x0 + (i - 1) * L * 0.18, y0 + math.cos(t) * 0.35, z0 + math.sin(t) * 0.35), rot=(t, 0, 0))
    rod(p, (x0 + L * 0.15, y0 + 0.28, z0 + 0.05), (x0 + L * 0.2, y0 + 0.55, z0 + 0.12), 0.08, BARK, seg=6, rt=0.06)  # Aststumpf
    put(p, 'cyl', 0.055, 0.055, 0.02, CUT, seg=6, at=(x0 + L * 0.2, y0 + 0.55, z0 + 0.12), m=Vector((0, 1, 0)).rotation_difference(Vector((0.05, 0.27, 0.07)).normalized()).to_matrix().to_4x4())


@model('requisiten/log')
def log(p, root):
    log_into(p, 3, (0, 0.35, 0))


@model('requisiten/logPile')
def logPile(p, root):
    for z, y in ((-0.4, 0.3), (0.4, 0.3), (0, 0.85)): log_into(p, 2.4, (0, y, z))
    for x in (-0.95, 0.95):
        for z in (-0.82, 0.82): rod(p, (x, 0, z), (x, 0.72, z), 0.05, DWOOD, seg=5)


def mushrooms_into(p, n, cap):
    for i in range(n):
        a = i * 2.4; r = 0.25 + (i % 3) * 0.2; h = 0.25 + (i % 2) * 0.15; cr = 0.18 + (i % 2) * 0.06
        x, z = math.cos(a) * r, math.sin(a) * r
        lth(p, [(0.08, 0), (0.065, h * 0.5), (0.055, h)], 0xfff3e0, at=(x, 0, z), seg=6)
        lth(p, [(0.35 * cr, -0.12 * cr), (cr, 0.0), (0.8 * cr, 0.4 * cr), (0.06 * cr, 0.62 * cr)], cap, at=(x, h, z), seg=7)
        for k in range(2):
            b = a + 1 + k * 2.5
            put(p, 'ball', 0.04 + 0.01 * k, 0xfff3e0, uv=(4, 3), scale=(1, 0.5, 1), at=(x + math.cos(b) * 0.55 * cr, h + 0.36 * cr, z + math.sin(b) * 0.55 * cr))


@model('requisiten/mushrooms')
def mushrooms(p, root):
    mushrooms_into(p, 4, 0xe74c3c)


def blade(p, base, h, a, t, w, color):
    """Gebogenes Grasblatt: zwei Stücke, das obere stärker geneigt."""
    m1 = RY(-a) @ RZ(-t); m2 = RY(-a) @ RZ(-2.4 * t)
    b = Vector(base); top = b + (m1 @ Vector((0, h * 0.5, 0, 0))).to_3d()
    put(p, 'cyl', 0.6 * w, w, h * 0.5, color, seg=4, scale=(1, 1, 0.45), at=tuple(b + (m1 @ Vector((0, h * 0.25, 0, 0))).to_3d()), m=m1)
    put(p, 'cone', 0.6 * w, h * 0.55, color, seg=4, scale=(1, 1, 0.45), at=tuple(top + (m2 @ Vector((0, h * 0.27, 0, 0))).to_3d()), m=m2)


@model('requisiten/tallGrass')
def tallGrass(p, root):
    for i in range(7):
        a = i * 2.1; r = (i % 3) * 0.18; h = 0.6 + (i % 4) * 0.2
        blade(p, (math.cos(a) * r, 0, math.sin(a) * r), h, a, 0.12 + 0.06 * (i % 3), 0.07, 0x6ab04c)
        blade(p, (math.cos(a) * r + 0.06, 0, math.sin(a) * r - 0.04), h * 0.7, a + 2, 0.2, 0.06, 0x5a9a3e)


@model('requisiten/reeds')
def reeds(p, root):
    n = 5
    for k in range(n):
        x, z, H = (k - n / 2) * 0.2, (k % 2) * 0.2, 1.5 + k * 0.15
        lth(p, [(0.05, 0), (0.045, H * 0.5), (0.035, H)], 0x6ab04c, at=(x, 0, z), seg=5)
        blade(p, (x + 0.03, 0, z), H * 0.75, k * 1.7 + 0.5, 0.12, 0.06, 0x5a9a3e)
        if k % 2:
            y = 1.55 + k * 0.15
            lth(p, [(0.03, -0.2), (0.07, -0.15), (0.085, 0), (0.07, 0.15), (0.03, 0.19)], 0x6d4c41, at=(x, y, z), seg=6)
            rod(p, (x, y + 0.18, z), (x, y + 0.36, z), 0.015, 0x6ab04c, seg=3)


@model('requisiten/flowerPatch')
def flowerPatch(p, root):
    w = 2; cols = [0xff6b9d, 0xffd93d, 0xffffff, 0xa29bfe]
    for i in range(10):
        a = i * 2.39; r = math.sqrt(i / 10) * w * 0.5; x, z = math.cos(a) * r, math.sin(a) * r; c = cols[i % 4]
        put(p, 'cyl', 0.025, 0.03, 0.4, 0x3d9a3d, seg=3, at=(x, 0.2, z))
        vs = new(p, 'cone', 0.15, 0.07, c, seg=10)
        idx = ring_index([v for v in vs if v.co.z < 0], 10)
        for v in vs:
            if v.co.z < 0 and idx(v) % 2: v.co.x *= 0.5; v.co.y *= 0.5
        place(p, vs, at=(x, 0.43, z), rot=(PI + 0.15 * math.sin(a), a, 0.15 * math.cos(a)))
        put(p, 'ball', 0.05, 0xe67e22 if c == 0xffd93d else 0xffd93d, uv=(4, 3), scale=(1, 0.6, 1), at=(x, 0.46, z))
        put(p, 'cone', 0.06, 0.2, 0x3d9a3d, seg=3, scale=(1, 1, 0.35), at=(x + math.cos(a + 1) * 0.06, 0.12, z + math.sin(a + 1) * 0.06), rot=(0.5 * math.sin(a + 1), 0, -0.5 * math.cos(a + 1)))


@model('requisiten/hedge')
def hedge(p, root):
    L, h = 4, 1.2; rnd = random.Random(3)
    put(p, 'box', L, h - 0.15, 1, 0x3d8b3d, bevel=0.08, at=(0, (h - 0.15) / 2, 0))
    put(p, 'box', L + 0.1, 0.25, 1.1, LEAF, bevel=0.08, at=(0, h - 0.05, 0))
    for i in range(7):
        x = -L / 2 + 0.3 + i * (L - 0.6) / 6
        put(p, 'ball', 0.32, LEAF if i % 2 else 0x58b84f, uv=(6, 4), jitter=0.15, seed=i, scale=(1.1, 0.5, 1), at=(x, h + 0.02, rnd.uniform(-0.2, 0.2)))
    for i, (x, s) in enumerate(((-1.3, 1), (0.4, 1), (-0.5, -1), (1.2, -1))):
        put(p, 'ball', 0.3, 0x46a646, uv=(5, 4), jitter=0.15, seed=20 + i, scale=(1, 0.9, 0.4), at=(x, 0.5 + 0.15 * (i % 2), s * 0.5))


@model('requisiten/birch')
def birch(p, root):
    vs = new(p, 'lathe', [(0.24, 0), (0.2, 0.3), (0.17, 2.0), (0.13, 3.4)], 0xf5f5f5, seg=7)
    place(p, wobble(vs, 0.05, 4))
    rnd = random.Random(5)
    for i in range(9):  # Birkenrinde: dunkle Querstriche rundherum
        y = 0.4 + i * 0.32; t = i * 2.3; r = 0.21 - y * 0.022
        put(p, 'box', 0.1 + rnd.random() * 0.1, 0.05, 0.05, DARK, at=(math.cos(t) * r, y, math.sin(t) * r), rot=(0, -(t + PI / 2), 0))
    rod(p, (0, 2.2, 0), (0.6, 2.95, 0.3), 0.06, 0xf5f5f5, seg=5, rt=0.03)
    rod(p, (0, 2.5, 0), (-0.5, 3.05, -0.3), 0.06, 0xf5f5f5, seg=5, rt=0.03)
    for i, (x, y, z, r, c) in enumerate([(0, 3.6, 0, 1.2, 0x8bc34a), (0.6, 3.1, 0.3, 0.9, 0x9ccc65), (-0.5, 3.2, -0.3, 0.9, 0x7cb342),
                                          (0.35, 3.95, -0.45, 0.6, 0x9ccc65), (-0.3, 2.85, 0.5, 0.55, 0x8bc34a)]):
        put(p, 'ball', r, c, sub=2 if r > 0.8 else 1, jitter=0.1, seed=i, at=(x, y, z), scale=(1, 0.9, 1))


@model('requisiten/palmTree')
def palmTree(p, root):
    h = 6; L = h / 6
    for i in range(6):
        rt, rb = 0.25 - i * 0.02, 0.28 - i * 0.02
        lth(p, [(rb * 1.02, -L * 0.52), (rb * 0.9, -L * 0.3), (rt * 0.95, L * 0.32), (rt * 1.15, L * 0.52)], 0x9c7a4a if i % 2 else 0x8a6a3e,
            at=(math.sin(i * 0.4) * 0.3, h / 12 + i * L, 0), rot=(0, 0, -0.06 * i), seg=7)
    top = Vector((0.2, h, 0))
    for i in range(7):
        a = i / 7 * 2 * PI + 0.3; P = top.copy(); c = 0x4caf50 if i % 2 else 0x3e9a45
        for j, (wa, wb, pitch) in enumerate(((0.3, 0.55, -0.25), (0.55, 0.5, 0.35), (0.5, 0.12, 0.95))):
            m = RY(PI / 2 - a) @ RX(pitch); seg = 0.95
            pts = [(-wa / 2, 0, 0), (wa / 2, 0, 0), (0, 0.06, 0), (0, -0.02, 0), (-wb / 2, 0, seg), (wb / 2, 0, seg), (0, 0.06, seg), (0, -0.02, seg)]
            hull(p, pts, c, at=tuple(P), m=m)
            P = P + (m @ Vector((0, 0, seg, 0))).to_3d()
    for x, y, z in ((0.45, h - 0.25, 0.15), (0.0, h - 0.28, 0.2), (0.2, h - 0.22, -0.25)):
        put(p, 'ball', 0.22, 0x6d4c41, uv=(6, 4), at=(x, y, z))
    put(p, 'ball', 0.3, 0x8a6a3e, uv=(6, 4), scale=(1, 0.6, 1), at=(0.2, h - 0.02, 0))


@model('requisiten/cactus')
def cactus(p, root):
    g = 0x4caf50
    place(p, ribs(new(p, 'lathe', [(0.35, 0), (0.33, 1.2), (0.3, 1.9), (0.24, 2.12), (0.12, 2.24), (0.02, 2.27)], g, seg=12), 12, 0.86))
    rod(p, (0.2, 0.95, 0), (0.48, 0.95, 0), 0.16, g, seg=8)
    put(p, 'ball', 0.165, g, uv=(8, 5), at=(0.5, 0.95, 0))
    place(p, ribs(new(p, 'lathe', [(0.165, 0), (0.17, 0.5), (0.12, 0.7), (0.02, 0.76)], g, seg=10), 10, 0.85), at=(0.5, 0.95, 0))
    rod(p, (-0.2, 1.4, 0), (-0.42, 1.4, 0), 0.13, g, seg=8)
    put(p, 'ball', 0.135, g, uv=(8, 5), at=(-0.44, 1.4, 0))
    place(p, ribs(new(p, 'lathe', [(0.135, 0), (0.13, 0.3), (0.09, 0.42), (0.02, 0.46)], g, seg=10), 10, 0.85), at=(-0.44, 1.4, 0))
    vs = new(p, 'cone', 0.12, 0.06, 0xff6b9d, seg=10); ribs([v for v in vs if v.co.z < 0], 10, 0.5); place(p, vs, at=(0, 2.3, 0), rot=(PI, 0, 0))
    put(p, 'ball', 0.04, 0xffd93d, uv=(4, 3), at=(0, 2.33, 0))


# ================================================================ Garten und Hof
@model('requisiten/fence')
def fence(p, root):
    L, c, h = 4, WHITE, 1; n = 4
    for i in range(n + 1):
        x = -L / 2 + i * L / n
        put(p, 'box', 0.14, h - 0.08, 0.14, c, bevel=0.02, at=(x, (h - 0.08) / 2, 0))
        put(p, 'cone', 0.1, 0.14, c, seg=4, at=(x, h - 0.01, 0), rot=(0, PI / 4, 0))
        if i < n:
            put(p, 'box', 0.1, h * 0.78, 0.045, c, at=(x + L / n / 2, h * 0.39, 0.055))
            put(p, 'cone', 0.072, 0.1, c, seg=4, scale=(1, 1, 0.45), at=(x + L / n / 2, h * 0.78 + 0.05, 0.055), rot=(0, PI / 4, 0))
    for y in (0.35, 0.75): put(p, 'box', L, 0.1, 0.06, c, bevel=0.015, at=(0, y * h, 0))


@model('requisiten/woodFence')
def woodFence(p, root):
    L = 4; n = 2
    for i in range(n + 1):
        x = -L / 2 + i * L / n
        put(p, 'cyl', 0.1, 0.11, 1.05, DWOOD, seg=6, at=(x, 0.525, 0))
        put(p, 'cone', 0.1, 0.12, DWOOD, seg=6, at=(x, 1.11, 0))
    for j in range(n):
        for k, y in enumerate((0.4, 0.85)):
            s = 1 if (j + k) % 2 else -1
            grain_box(p, L / n + 0.2, 0.12, 0.07, WOOD, (-L / 2 + (j + 0.5) * L / n, y + 0.02 * s, 0), rot=(0, 0, 0.025 * s), n=1)


@model('requisiten/bench')
def bench(p, root):
    for z in (-0.2, 0, 0.2): grain_box(p, 2.2, 0.08, 0.18, WOOD, (0, 0.52, z), n=1)
    for y, z in ((0.8, -0.31), (1.02, -0.34)): grain_box(p, 2.2, 0.15, 0.06, WOOD, (0, y, z), rot=(-0.12, 0, 0), n=1, along='x')
    for x in (-0.9, 0.9):
        put(p, 'box', 0.08, 0.7, 0.08, DARK, bevel=0.015, at=(x, 0.35, 0.22))
        beam(p, (x, 0, -0.22), (x, 1.12, -0.38), 0.08, 0.08, DARK)
        put(p, 'box', 0.08, 0.06, 0.6, DARK, at=(x, 0.45, 0))
        put(p, 'box', 0.1, 0.05, 0.55, DARK, bevel=0.015, at=(x, 0.72, 0.0))
        put(p, 'box', 0.12, 0.03, 0.16, DARK, at=(x, 0.015, 0.22))


@model('requisiten/picnicTable')
def picnicTable(p, root):
    for z in (-0.42, -0.14, 0.14, 0.42): grain_box(p, 2.4, 0.1, 0.26, LWOOD, (0, 0.8, z))
    for s in (-1, 1):
        for dz in (-0.1, 0.1): grain_box(p, 2.4, 0.08, 0.18, LWOOD, (0, 0.45, s * 0.85 + dz), n=1)
    for x in (-0.9, 0.9):
        for a in (0.75, -0.75): put(p, 'box', 0.12, 1.1, 0.12, WOOD, bevel=0.02, at=(x, 0.4, 0), rot=(a, 0, 0))
        put(p, 'box', 0.1, 0.1, 2.1, WOOD, bevel=0.015, at=(x, 0.36, 0))
        put(p, 'box', 0.1, 0.08, 1.05, WOOD, at=(x, 0.71, 0))


@model('requisiten/birdbath')
def birdbath(p, root):
    lth(p, [(0.45, 0), (0.45, 0.1), (0.36, 0.16), (0.17, 0.2), (0.13, 0.45), (0.16, 0.7), (0.12, 0.95), (0.16, 1.03), (0.4, 1.08),
            (0.6, 1.22), (0.62, 1.27), (0.55, 1.27)], STONE, seg=10)
    put(p, 'cyl', 0.54, 0.54, 0.02, 0x74b9ff, seg=10, at=(0, 1.272, 0))
    for i in range(6):
        a = i / 6 * 2 * PI
        put(p, 'box', 0.12, 0.05, 0.12, DSTONE, at=(math.cos(a) * 0.4, 0.13, math.sin(a) * 0.4), rot=(0, -a, 0))
    put(p, 'ball', 0.07, LEAF, uv=(5, 3), scale=(1, 0.15, 0.6), at=(0.2, 1.285, 0.1), rot=(0, 0.6, 0))


@model('requisiten/wheelbarrow')
def wheelbarrow(p, root):
    g, rim = 0x27ae60, 0x1e8449
    hull(p, [(sx * 0.5, 0.92, z) for sx in (-1, 1) for z in (-0.6, 0.7)] + [(sx * 0.32, 0.48, z) for sx in (-1, 1) for z in (-0.35, 0.35)], g)
    tube(p, [(-0.5, 0.93, -0.6), (0.5, 0.93, -0.6), (0.5, 0.93, 0.7), (-0.5, 0.93, 0.7)], 0.035, rim, ring=4, closed=True)
    hull(p, [(sx * 0.42, 0.9, z) for sx in (-1, 1) for z in (-0.52, 0.62)] + [(sx * 0.42, 0.935, z) for sx in (-1, 1) for z in (-0.52, 0.62)], 0x6d4c41)  # Erde
    rcyl(p, 0.28, 0.12, DARK, at=(0, 0.3, 0.75), rot=AX, seg=12, b=0.04)
    rcyl(p, 0.1, 0.16, METAL, at=(0, 0.3, 0.75), rot=AX, seg=8, b=0.02)
    for s in (-1, 1):
        rod(p, (s * 0.09, 0.3, 0.75), (s * 0.3, 0.55, 0.35), 0.025, METAL, seg=5)
        rod(p, (s * 0.3, 0.48, 0.6), (s * 0.36, 0.6, -1.4), 0.04, WOOD, seg=6)
        rod(p, (s * 0.355, 0.598, -1.15), (s * 0.362, 0.603, -1.42), 0.05, DARK, seg=6)
        rod(p, (s * 0.35, 0.53, -0.3), (s * 0.35, 0.03, -0.3), 0.035, METAL, seg=5)
        put(p, 'box', 0.08, 0.03, 0.22, METAL, at=(s * 0.35, 0.015, -0.3))


@model('requisiten/pot')
def pot(p, root):
    c, plant = 0xd35400, 0x3d9a3d
    lth(p, [(0.24, 0), (0.26, 0.04), (0.33, 0.4), (0.37, 0.41), (0.37, 0.5), (0.33, 0.5)], c, seg=10)
    put(p, 'cyl', 0.32, 0.32, 0.02, SOIL, seg=10, at=(0, 0.505, 0))
    put(p, 'cyl', 0.335, 0.31, 0.04, dk(c, 0.85), seg=10, at=(0, 0.33, 0))
    put(p, 'ball', 0.42, plant, sub=2, jitter=0.12, seed=3, at=(0, 0.75, 0))
    put(p, 'ball', 0.2, dk(plant, 1.15), uv=(6, 4), jitter=0.12, seed=4, at=(0.28, 0.62, 0.15))
    put(p, 'ball', 0.18, dk(plant, 1.15), uv=(6, 4), jitter=0.12, seed=5, at=(-0.22, 0.6, -0.22))


@model('requisiten/bigPlant')
def bigPlant(p, root):
    lth(p, [(0.33, 0), (0.35, 0.04), (0.44, 0.62), (0.47, 0.63), (0.47, 0.7), (0.42, 0.7)], 0xecf0f1, seg=10)
    put(p, 'cyl', 0.41, 0.41, 0.02, SOIL, seg=10, at=(0, 0.705, 0))
    put(p, 'cyl', 0.05, 0.05, 0.8, 0x3d9a3d, seg=4, at=(0, 1, 0))
    for i in range(12):
        a = i / 9 * 2 * PI if i < 9 else (i - 9) / 3 * 2 * PI + 0.5
        t = (0.35 if i % 2 else 0.7) if i < 9 else 1.15; L = 0.65 if i < 9 else 0.5
        d = Vector((math.cos(a) * math.cos(t), math.sin(t), math.sin(a) * math.cos(t)))
        c = Vector((math.cos(a) * 0.1, 0.78 if i < 9 else 1.2, math.sin(a) * 0.1)) + d * L
        put(p, 'ball', 0.5, 0x2e8b57 if i % 2 else 0x3d9a3d, uv=(6, 3), scale=(0.28, 0.05, 2 * L), at=tuple(c), m=RY(PI / 2 - a) @ RX(-t))


@model('requisiten/wateringCan')
def wateringCan(p, root):
    c, band = 0x16a085, 0x117a65
    lth(p, [(0.23, 0), (0.25, 0.03), (0.25, 0.38), (0.2, 0.42), (0.12, 0.44)], c, seg=10)
    put(p, 'cyl', 0.255, 0.255, 0.04, band, seg=10, at=(0, 0.3, 0))
    put(p, 'cyl', 0.12, 0.12, 0.02, band, seg=10, at=(0, 0.445, 0))
    rod(p, (0.18, 0.12, 0), (0.5, 0.5, 0), 0.05, c, seg=6, rt=0.03)
    rod(p, (0.49, 0.49, 0), (0.56, 0.57, 0), 0.04, band, seg=8, rt=0.075)
    put(p, 'torus', 0.17, 0.028, c, seg=8, ring=4, arc=PI, at=(-0.03, 0.42, 0), m=RX(PI / 2))
    put(p, 'torus', 0.1, 0.025, c, seg=6, ring=4, arc=PI, at=(-0.24, 0.24, 0), m=RZ(PI / 2) @ RX(PI / 2))


@model('requisiten/steppingStones')
def steppingStones(p, root):
    n, dx = 5, 1.2; rnd = random.Random(2)
    for i in range(n):
        vs = new(p, 'lathe', [(0.5, 0), (0.48, 0.06), (0.4, 0.09)], 0xbdbdbd, seg=8)
        place(p, wobble(vs, 0.1, i * 1.7), at=(i * dx, 0, (i % 2) * 0.3), rot=(0, rnd.random() * 6, 0))
        if i < n - 1:
            for k in range(2):
                put(p, 'ball', 0.06 + 0.02 * k, STONE, uv=(4, 3), jitter=0.2, seed=i * 3 + k, scale=(1, 0.5, 1),
                    at=(i * dx + 0.6 + rnd.uniform(-0.1, 0.1), 0.01, (i % 2) * 0.3 + rnd.uniform(-0.5, 0.5)))


@model('requisiten/scarecrow')
def scarecrow(p, root):
    shirt, straw, skin = 0x2980b9, 0xe1b12c, 0xffe0b2
    put(p, 'box', 0.12, 2.6, 0.12, DWOOD, bevel=0.02, at=(0, 1.3, 0))
    put(p, 'box', 2, 0.1, 0.1, DWOOD, bevel=0.02, at=(0, 1.9, 0))
    put(p, 'box', 0.8, 0.9, 0.35, shirt, bevel=0.06, at=(0, 1.75, 0))
    for s in (-1, 1):
        rod(p, (s * 0.35, 1.97, 0), (s * 0.92, 1.92, 0), 0.15, shirt, seg=7, rt=0.13)
        put(p, 'cone', 0.12, 0.32, straw, seg=5, at=(s * 1.05, 1.91, 0), rot=(0, 0, -s * PI / 2))
    for i, x in enumerate((-0.25, 0.0, 0.22)): put(p, 'cone', 0.09, 0.22, straw, seg=4, at=(x, 1.24, 0.05 * (i - 1)), rot=(PI, i, 0))
    put(p, 'box', 0.82, 0.07, 0.37, LWOOD, at=(0, 1.42, 0))
    put(p, 'box', 0.2, 0.2, 0.02, 0xe74c3c, at=(0.18, 1.62, 0.18), rot=(0, 0, 0.15))
    for y in (1.6, 1.8, 2.0): put(p, 'ball', 0.03, DARK, uv=(4, 3), at=(-0.08, y, 0.18))
    put(p, 'cone', 0.16, 0.18, straw, seg=6, at=(0, 2.22, 0), rot=(PI, 0, 0))
    put(p, 'ball', 0.32, skin, uv=(8, 6), scale=(1, 1.05, 0.95), at=(0, 2.5, 0))
    for s in (-1, 1): put(p, 'cyl', 0.05, 0.05, 0.03, DARK, seg=6, at=(s * 0.11, 2.56, 0.29), rot=AZ)
    put(p, 'cone', 0.045, 0.16, 0xe67e22, seg=5, at=(0, 2.48, 0.36), rot=AZ)
    for i in range(4): put(p, 'box', 0.035, 0.03, 0.02, DARK, at=(-0.09 + i * 0.06, 2.37 - 0.01 * (i in (0, 3)), 0.285))
    lth(p, [(0.62, 2.6), (0.6, 2.65), (0.33, 2.67), (0.3, 2.86), (0.17, 3.05), (0.04, 3.1)], straw, seg=10)
    put(p, 'cyl', 0.335, 0.335, 0.06, DWOOD, seg=10, at=(0, 2.7, 0))


@model('requisiten/pumpkin')
def pumpkin(p, root):
    vs = new(p, 'ball', 0.45, 0xe67e22, uv=(12, 6))
    place(p, ribs(vs, 12, 0.88), m=SC(1, 0.75, 1), at=(0, 0.35, 0))
    rod(p, (0, 0.6, 0), (0.02, 0.75, 0), 0.06, 0x27ae60, seg=5, rt=0.045)
    rod(p, (0.02, 0.74, 0), (0.1, 0.8, 0.02), 0.04, 0x27ae60, seg=5, rt=0.03)
    put(p, 'ball', 0.5, 0x27ae60, uv=(5, 3), scale=(0.36, 0.04, 0.2), at=(0.16, 0.66, 0.06), rot=(0, -0.4, -0.25))
    put(p, 'torus', 0.06, 0.012, 0x27ae60, seg=6, ring=3, arc=1.5 * PI, at=(-0.12, 0.66, -0.05), rot=(0.4, 0, 0.3))


@model('requisiten/veggieRow')
def veggieRow(p, root):
    L, c, fruit = 6, 0x27ae60, 0xe74c3c
    put(p, 'box', L, 0.2, 1.2, SOIL, bevel=0.06, at=(0, 0.1, 0))
    put(p, 'box', L - 0.2, 0.08, 0.5, dk(SOIL, 1.12), bevel=0.03, at=(0, 0.22, 0))
    i = 0
    while i < L / 0.8:
        x = -L / 2 + 0.4 + i * 0.8
        put(p, 'ball', 0.3, c, uv=(6, 4), jitter=0.15, seed=i, scale=(1, 0.8, 1), at=(x, 0.45, 0))
        for k in (-1, 1): put(p, 'ball', 0.5, dk(c, 1.15), uv=(5, 3), scale=(0.24, 0.04, 0.6), at=(x + k * 0.22, 0.32, -k * 0.1), rot=(0, 0.6 + i, k * 0.4))
        if fruit and i % 2:
            put(p, 'ball', 0.12, fruit, uv=(6, 4), at=(x, 0.6, 0.2))
            put(p, 'cone', 0.04, 0.05, c, seg=4, at=(x, 0.72, 0.2))
        i += 1


@model('requisiten/field')
def field(p, root):
    w, d, c = 12, 8, 0xe1b12c; rnd = random.Random(4)
    put(p, 'box', w, 0.12, d, 0x6d4c41, bevel=0.04, at=(0, 0.06, 0))
    z = -d / 2 + 0.6
    while z < d / 2:
        put(p, 'box', w - 0.6, 0.5, 0.55, c, bevel=0.1, at=(0, 0.35, z))
        x = -w / 2 + 0.7
        while x < w / 2 - 0.5:
            put(p, 'cone', 0.11, 0.3, c, seg=4, at=(x + rnd.uniform(-0.15, 0.15), 0.72, z + rnd.uniform(-0.12, 0.12)), rot=(rnd.uniform(-0.2, 0.2), rnd.random(), rnd.uniform(-0.2, 0.2)))
            x += 0.8
        z += 1.2


@model('requisiten/hayBale')
def hayBale(p, root):
    rcyl(p, 0.8, 1.2, 0xf6c445, at=(0, 0.8, 0), rot=AX, seg=12, b=0.08)
    for s in (-1, 1):
        for r, w, col in ((0.68, 0.03, 0xe1b12c), (0.45, 0.034, 0xf6c445), (0.2, 0.038, 0xe1b12c)):
            put(p, 'cyl', r, r, w, col, seg=12, at=(s * 0.6, 0.8, 0), rot=AX)
        put(p, 'cyl', 0.812, 0.812, 0.05, 0xe1b12c, seg=12, at=(s * 0.3, 0.8, 0), rot=AX)
    for i in range(3):
        a = 0.8 + i * 1.9
        put(p, 'cone', 0.05, 0.25, 0xf6c445, seg=3, at=(0.2 - i * 0.2, 0.8 + math.sin(a) * 0.82, math.cos(a) * 0.82), rot=(a, 0, 0.3))


@model('requisiten/well')
def well(p, root):
    lth(p, [(1.2, 0), (1.15, 0.9), (1.16, 0.95), (0.9, 0.95), (0.88, 0.82)], STONE, seg=12)
    put(p, 'cyl', 0.88, 0.88, 0.02, 0x1e3799, seg=12, at=(0, 0.85, 0))
    for i in range(12):
        t = i / 12 * 2 * PI + 0.13
        put(p, 'box', 0.55, 0.13, 0.32, STONE if i % 2 else DSTONE, at=(math.cos(t) * 1.03, 1.0, math.sin(t) * 1.03), rot=(0, -(t + PI / 2), 0))
    rnd = random.Random(8)
    for i in range(10):
        t = rnd.random() * 2 * PI; y = 0.15 + rnd.random() * 0.6
        put(p, 'box', 0.38, 0.2, 0.06, DSTONE, at=(math.cos(t) * 1.17, y, math.sin(t) * 1.17), rot=(0, -(t + PI / 2), 0))
    for x in (-1, 1): put(p, 'box', 0.15, 2.4, 0.15, DWOOD, bevel=0.02, at=(x, 1.2, 0))
    put(p, 'cone', 1.6, 0.9, ROOF0, seg=4, at=(0, 2.7, 0), rot=(0, PI / 4, 0))
    put(p, 'cyl', 1.6, 1.68, 0.08, dk(ROOF0, 0.75), seg=4, at=(0, 2.23, 0), rot=(0, PI / 4, 0))
    for k in range(4):
        a = k * PI / 2 + PI / 4
        rod(p, (math.cos(a) * 1.6, 2.26, math.sin(a) * 1.6), (0, 3.16, 0), 0.04, DWOOD, seg=4)
    put(p, 'ball', 0.08, DWOOD, uv=(5, 4), at=(0, 3.18, 0))
    rcyl(p, 0.12, 2.1, WOOD, at=(0, 1.9, 0), rot=AX, seg=8, b=0.02)
    rod(p, (1.1, 1.9, 0), (1.1, 1.62, 0.12), 0.035, DWOOD, seg=5); rod(p, (1.1, 1.62, 0.12), (1.28, 1.62, 0.12), 0.04, DWOOD, seg=5)
    for i in range(3): put(p, 'cyl', 0.125, 0.125, 0.04, ROPE, seg=8, at=(-0.1 + i * 0.07, 1.9, 0), rot=AX)
    rod(p, (0, 1.78, 0), (0, 1.47, 0), 0.02, ROPE, seg=4)
    lth(p, [(0.12, 1.13), (0.15, 1.45), (0.16, 1.47), (0.14, 1.47)], WOOD, seg=8)
    for y in (1.18, 1.4): put(p, 'cyl', 0.157 if y > 1.3 else 0.13, 0.15 if y > 1.3 else 0.125, 0.03, METAL, seg=8, at=(0, y, 0))
    put(p, 'torus', 0.15, 0.012, METAL, seg=6, ring=3, arc=PI, at=(0, 1.47, 0), m=RX(PI / 2))


def wheel(p, at, R, w, color, hub, spokes=6, axis='z'):
    m_t = RX(PI / 2) if axis == 'z' else RY(PI / 2) @ RX(PI / 2)
    put(p, 'torus', R - w / 2, w / 2, color, seg=12, ring=4, at=at, m=m_t)
    rcyl(p, R * 0.22, w * 1.6, hub, at=at, rot=AZ if axis == 'z' else AX, seg=8, b=0.02)
    for k in range(spokes // 2):
        a = k * 2 * PI / spokes
        put(p, 'box', 0.05, 2 * R - w * 0.6, 0.04, color, at=at, m=(RZ(a) if axis == 'z' else RX(a)))


def hay_square(p, at):
    x, y, z = at
    put(p, 'box', 1.6, 0.8, 1, 0xf6c445, bevel=0.05, at=(x, y, z))
    for dy in (-0.1, 0.15): put(p, 'box', 1.62, 0.06, 1.02, 0xe1b12c, at=(x, y + dy, z))


@model('requisiten/cart')
def cart(p, root):
    put(p, 'box', 2.2, 0.6, 1.4, WOOD, bevel=0.03, at=(0, 0.9, 0))
    for s in (-1, 1):
        for y in (0.8, 1.0): put(p, 'box', 2.12, 0.02, 0.02, DWOOD, at=(0, y, s * 0.705))
        for x in (-1.05, 1.05): put(p, 'box', 0.1, 0.95, 0.1, DWOOD, bevel=0.015, at=(x, 1.075, s * 0.68))
        for y in (1.25, 1.45): put(p, 'box', 2.0, 0.15, 0.06, LWOOD, bevel=0.015, at=(0, y, s * 0.68))
        wheel(p, (0, 0.55, s * 0.78), 0.55, 0.12, DWOOD, METAL)
        rod(p, (1.0, 0.82, s * 0.4), (2.7, 0.7, s * 0.4), 0.045, DWOOD, seg=6)
    put(p, 'box', 0.08, 0.08, 0.88, DWOOD, at=(2.62, 0.7, 0))
    hay_square(p, (0, 1.5, 0))


@model('requisiten/beehive')
def beehive(p, root):
    for x in (-0.32, 0.32):
        for z in (-0.32, 0.32): put(p, 'box', 0.08, 0.15, 0.08, WOOD, at=(x, 0.075, z))
    put(p, 'box', 0.8, 0.15, 0.8, WOOD, bevel=0.02, at=(0, 0.225, 0))
    for (w, h, y, c) in ((0.7, 0.35, 0.47, 0xf6c445), (0.75, 0.35, 0.82, 0xe1b12c), (0.7, 0.3, 1.14, 0xf6c445)):
        put(p, 'box', w, h, w, c, bevel=0.03, at=(0, y, 0))
        put(p, 'box', 0.2, 0.05, 0.02, dk(c, 0.7), at=(0, y + 0.05, w / 2 + 0.005))
    put(p, 'box', 0.3, 0.05, 0.02, DARK, at=(0, 0.33, 0.355))
    put(p, 'box', 0.4, 0.03, 0.12, WOOD, at=(0, 0.31, 0.42))
    put(p, 'box', 0.9, 0.08, 0.9, WOOD, bevel=0.015, at=(0, 1.33, 0))
    hull(p, [(sx * 0.46, 1.37, sz * 0.46) for sx in (-1, 1) for sz in (-1, 1)] + [(sx * 0.46, 1.49, 0) for sx in (-1, 1)], dk(WOOD, 0.85))


@model('requisiten/tent')
def tent(p, root):
    c = 0xe17055; k = 1.8 / math.sqrt(2)
    corners = [(sx * k, 0, sz * k * 1.4) for sx, sz in ((-1, 1), (1, 1), (1, -1), (-1, -1))]
    hull(p, corners + [(0, 2, 0)], c)
    n = Vector((0, 1.782, 2)).normalized(); A = Vector((0, 1.3, 0.624)); B1 = Vector((-0.5, 0, 1.782)); B2 = Vector((0.5, 0, 1.782))
    hull(p, [tuple(v + n * o) for v in (A, B1, B2) for o in (-0.01, 0.02)], DARK)
    for s in (-1, 1): rod(p, tuple(Vector((s * 0.55, 0.05, 1.79)) + n * 0.04), tuple(Vector((s * 0.06, 1.33, 0.64)) + n * 0.04), 0.06, dk(c, 0.85), seg=5)
    for cx, cy, cz in corners:
        tube(p, [(cx * 0.94, 0.03, cz * 0.94), (0, 2.02, 0)], 0.025, dk(c, 0.75), ring=4)
        a = Vector((cx * 0.65, 0.7, cz * 0.65)); b = Vector((cx * 1.25, 0.0, cz * 1.2))
        rod(p, tuple(a), tuple(b), 0.012, ROPE, seg=3)
        put(p, 'box', 0.05, 0.2, 0.05, WOOD, at=(b.x, 0.07, b.z))
    put(p, 'cyl', 0.05, 0.05, 2.3, WOOD, seg=5, at=(0, 1.15, 0))
    hull(p, [(0, 2.3, 0), (0, 2.12, 0), (0.28, 2.23, 0.01), (0, 2.3, 0.02), (0, 2.12, 0.02)], c)


@model('requisiten/campfire')
def campfire(p, root):
    for i in range(7):
        a = i / 7 * 2 * PI
        put(p, 'ball', 0.22 * (0.9 + 0.2 * (i % 3) / 2), DSTONE if i % 3 else STONE, uv=(6, 4), jitter=0.15, seed=i, scale=(1, 0.65, 0.85), at=(math.cos(a) * 0.65, 0.077, math.sin(a) * 0.65), rot=(0, a, 0))
    for a in (0, 1.2, 2.4):
        r = (0, a, PI / 2 - 0.3); d = (E(r) @ Vector((0, 1, 0, 0))).to_3d()
        put(p, 'cyl', 0.07, 0.07, 1, BARK, seg=6, at=(0, 0.18, 0), rot=r)
        for s in (-1, 1): put(p, 'cyl', 0.06, 0.06, 0.02, CUT, seg=6, at=tuple(Vector((0, 0.18, 0)) + d * s * 0.505), rot=r)
    put(p, 'cyl', 0.4, 0.45, 0.06, 0x3d3d3d, seg=8, at=(0, 0.03, 0))
    for i in range(4):
        a = i * 1.7 + 0.3
        put(p, 'box', 0.1, 0.05, 0.07, DARK, at=(math.cos(a) * 0.25, 0.075, math.sin(a) * 0.25), rot=(0, a, 0))


@model('requisiten/signpost')
def signpost(p, root):
    c = LWOOD
    put(p, 'box', 0.15, 2, 0.15, DWOOD, bevel=0.02, at=(0, 1, 0))
    put(p, 'cone', 0.11, 0.12, DWOOD, seg=4, at=(0, 2.06, 0), rot=(0, PI / 4, 0))
    for (L, x, y, ang, s) in ((1.2, 0.45, 1.7, 0.05, 1), (1.0, -0.35, 1.3, -0.05, -1)):
        h2 = 0.15; tip = L * 0.15
        pts = [(s * xx, yy, zz) for xx, yy in ((-L / 2, -h2), (-L / 2, h2), (L / 2 - tip, -h2), (L / 2 - tip, h2), (L / 2, 0)) for zz in (-0.03, 0.03)]
        hull(p, pts, c, at=(x, y, 0.11), rot=(0, 0, ang))
        for k, (ox, wl) in enumerate(((-0.05, 0.55), (-0.1, 0.4))):
            put(p, 'box', wl * L, 0.03, 0.01, DWOOD, at=(x + s * ox * L, y + 0.05 - k * 0.09 + ang * s * ox, 0.145), rot=(0, 0, ang))
        for xx in (-0.06, 0.06): put(p, 'ball', 0.018, METAL, uv=(4, 3), at=(xx, y, 0.145))


@model('requisiten/lantern')
def lantern(p, root):
    h, c = 2.6, DARK
    lth(p, [(0.18, 0), (0.17, 0.08), (0.1, 0.14), (0.09, 0.4), (0.075, h - 0.05), (0.1, h - 0.02), (0.1, h)], c, seg=6)
    put(p, 'box', 0.34, 0.04, 0.34, c, at=(0, h + 0.02, 0))
    put(p, 'box', 0.24, 0.28, 0.24, LIGHT, at=(0, h + 0.18, 0))
    for x in (-0.13, 0.13):
        for z in (-0.13, 0.13): put(p, 'box', 0.04, 0.3, 0.04, c, at=(x, h + 0.18, z))
    put(p, 'box', 0.36, 0.04, 0.36, c, at=(0, h + 0.34, 0))
    put(p, 'cone', 0.27, 0.2, c, seg=4, at=(0, h + 0.46, 0), rot=(0, PI / 4, 0))
    put(p, 'ball', 0.04, c, uv=(5, 4), at=(0, h + 0.58, 0))


@model('requisiten/pinwheel')
def pinwheel(p, root):
    c = 0xff7675
    put(p, 'box', 0.06, 1.2, 0.06, WHITE, bevel=0.01, at=(0, 0.6, 0))
    spin = Node('spin', root, (0, 1.2, 0.08)); q = Part('spin-m', spin)
    for i, cc in enumerate([c, 0xfeca57, 0x48dbfb, 0x1dd1a1]):
        pts = [(0.02, 0, 0), (0.34, -0.02, 0), (0.29, 0.16, 0.06), (0.02, 0, 0.015), (0.34, -0.02, 0.015), (0.29, 0.16, 0.075)]
        hull(q, pts, cc, m=RZ(i * PI / 2))
    q.ball(0.04, WHITE, at=(0, 0, 0.05), uv=(5, 4))
    q.cyl(0.015, 0.015, 0.14, WHITE, at=(0, 0, -0.03), rot=AZ, seg=4)
    q.done()


# ================================================================ Gebäude
def gable_roof(p, w, d, rh, h, roof, ridge, t=0.16, lines=3):
    """Satteldach als zwei Platten (Überstand), First entlang x; Unterkante bei h, Firsthöhe rh."""
    hd = d / 2; ln = math.hypot(hd, rh)
    for s in (-1, 1):
        nrm = Vector((0, hd / ln, s * rh / ln))
        bot = [(x, h, s * hd) for x in (-w / 2, w / 2)] + [(x, h + rh, 0) for x in (-w / 2, w / 2)]
        hull(p, bot + [tuple(Vector(q) + nrm * t) for q in bot], roof)
        th = math.atan2(rh, hd)
        for k in range(1, lines + 1):
            f = k / (lines + 1)
            c = Vector((0, h + rh * f, s * hd * (1 - f))) + nrm * (t + 0.01)
            put(p, 'box', w, 0.04, 0.12, dk(roof, 0.8), at=tuple(c), rot=(s * th, 0, 0))
    put(p, 'box', w + 0.06, 0.2, 0.2, ridge, at=(0, h + rh + t * 1.1, 0), rot=(PI / 4, 0, 0))


def window(p, at, ry, gw=0.9, gh=0.9, glass=GLASS, frame=WHITE, sill=True, flowers=False, muntin=True):
    L = lambda x, y, z: loc(at, ry, x, y, z)
    m = RY(ry)
    put(p, 'box', gw, gh, 0.06, glass, at=L(0, 0, 0.03), m=m)
    for s in (-1, 1):
        put(p, 'box', gw + 0.16, 0.08, 0.1, frame, at=L(0, s * (gh / 2 + 0.04), 0.05), m=m)
        put(p, 'box', 0.08, gh, 0.1, frame, at=L(s * (gw / 2 + 0.04), 0, 0.05), m=m)
    if muntin:
        put(p, 'box', 0.05, gh, 0.08, frame, at=L(0, 0, 0.05), m=m)
        put(p, 'box', gw, 0.05, 0.08, frame, at=L(0, 0, 0.05), m=m)
    if sill: put(p, 'box', gw + 0.3, 0.08, 0.18, frame, at=L(0, -gh / 2 - 0.1, 0.09), m=m)
    if flowers:
        put(p, 'box', gw + 0.1, 0.18, 0.2, WOOD, bevel=0.02, at=L(0, -gh / 2 - 0.25, 0.14), m=m)
        for i, c in enumerate((0xff6b9d, 0xffd93d, 0xff6b9d)):
            put(p, 'ball', 0.12, LEAF, uv=(5, 3), scale=(1, 0.6, 1), at=L(-0.3 + i * 0.3, -gh / 2 - 0.13, 0.15))
            put(p, 'ball', 0.06, c, uv=(4, 3), at=L(-0.3 + i * 0.3 + 0.05, -gh / 2 - 0.07, 0.2))


@model('requisiten/cottage')
def cottage(p, root):
    w, d, h, wall, roof = 6, 5, 3, WALL0, ROOF0; rh = d * 0.45
    put(p, 'box', w, h, d, wall, at=(0, h / 2, 0))
    put(p, 'box', w + 0.2, 0.25, d + 0.2, WOOD, bevel=0.03, at=(0, 0.125, 0))
    for x in (-1, 1):
        for z in (-1, 1): put(p, 'box', 0.2, h - 0.2, 0.2, DWOOD, bevel=0.02, at=(x * w / 2, h / 2 + 0.05, z * d / 2))
    put(p, 'box', w + 0.08, 0.18, d + 0.08, DWOOD, at=(0, h - 0.09, 0))
    hd = d / 2 + 0.3; ye = h + rh * (1 - (d / 2) / hd)
    hull(p, [(x, y, z) for x in (-w / 2, w / 2) for (y, z) in ((h, -d / 2), (h, d / 2), (ye, -d / 2), (ye, d / 2), (h + rh, 0))], wall)
    gable_roof(p, w + 0.6, d + 0.6, rh, h, roof, DWOOD)
    cx, cz = w * 0.25, -d * 0.15
    put(p, 'box', 0.6, 1.4, 0.6, 0x8d6e63, bevel=0.02, at=(cx, h + d * 0.45, cz))
    put(p, 'box', 0.75, 0.1, 0.75, dk(0x8d6e63, 0.75), at=(cx, h + d * 0.45 + 0.75, cz))
    for k in range(3): put(p, 'box', 0.62, 0.03, 0.62, dk(0x8d6e63, 0.85), at=(cx, h + d * 0.45 + 0.1 + k * 0.22, cz))
    put(p, 'box', 1, 1.75, 0.1, DWOOD, bevel=0.02, at=(0, 1.125, d / 2 + 0.03))
    for x in (-0.25, 0.25): put(p, 'box', 0.03, 1.6, 0.02, dk(DWOOD, 0.75), at=(x, 1.125, d / 2 + 0.085))
    put(p, 'ball', 0.05, 0xe1b12c, uv=(5, 4), at=(0.36, 1.1, d / 2 + 0.1))
    put(p, 'box', 1.2, 0.12, 0.14, WHITE, at=(0, 2.06, d / 2 + 0.05))
    for s in (-1, 1): put(p, 'box', 0.1, 1.8, 0.12, WHITE, at=(s * 0.56, 1.15, d / 2 + 0.04))
    put(p, 'box', 1.4, 0.12, 0.5, STONE, bevel=0.02, at=(0, 0.06, d / 2 + 0.35))
    for s in (-1, 1):
        window(p, (s * w * 0.3, h * 0.55, d / 2), 0, flowers=True)
        window(p, (s * w * 0.3, h * 0.55, -d / 2), PI, sill=False)
        window(p, (s * w / 2, h * 0.55, 0), s * PI / 2, sill=False)


@model('requisiten/shed')
def shed(p, root):
    w, d, c = 3, 2.5, WOOD
    put(p, 'box', w, 2.2, d, c, at=(0, 1.1, 0))
    for s in (-1, 1):
        x = -w / 2 + 0.5
        while x < w / 2 - 0.2:
            if abs(x) > 0.55 or s < 0: put(p, 'box', 0.035, 2.1, 0.02, dk(c, 0.75), at=(x, 1.07, s * (d / 2 + 0.005)))
            x += 0.5
        z = -d / 2 + 0.5
        while z < d / 2 - 0.2:
            put(p, 'box', 0.02, 2.1, 0.035, dk(c, 0.75), at=(s * (w / 2 + 0.005), 1.07, z)); z += 0.5
        for z in (-1, 1): put(p, 'box', 0.12, 2.2, 0.12, DWOOD, at=(s * w / 2, 1.1, z * d / 2))
    put(p, 'box', w + 0.4, 0.15, d + 0.6, DWOOD, bevel=0.02, at=(0, 2.35, 0), rot=(0.12, 0, 0))
    for k in (-1, 0, 1):
        put(p, 'box', w + 0.42, 0.02, 0.06, dk(DWOOD, 0.7), at=(0, 2.43 - k * 0.12 * 0.8, k * 0.8), rot=(0.12, 0, 0))
    put(p, 'box', 0.9, 1.7, 0.06, DWOOD, bevel=0.01, at=(0, 0.85, d / 2 + 0.03))
    for y in (0.3, 1.4): put(p, 'box', 0.8, 0.1, 0.03, c, at=(0, y, d / 2 + 0.07))
    put(p, 'box', 0.08, 1.25, 0.03, c, at=(0, 0.85, d / 2 + 0.07), rot=(0, 0, 0.62))
    put(p, 'box', 0.04, 0.15, 0.04, METAL, at=(0.33, 0.85, d / 2 + 0.09))
    window(p, (w / 2, 1.4, 0), PI / 2, gw=0.6, gh=0.5, frame=DWOOD, sill=False)


def city_block(p, w, d, h, wall, win, roof, door_x=0, canopy=True):
    put(p, 'box', w, h, d, wall, at=(0, h / 2, 0))
    put(p, 'box', w + 0.1, 0.6, d + 0.1, dk(wall, 0.85), at=(0, 0.3, 0))
    floors = math.floor((h - 3) / 3)
    for f in range(floors): put(p, 'box', w + 0.12, 0.15, d + 0.12, roof, at=(0, 2.85 + f * 3, 0))
    for s in (-1, 1):  # Attika statt Dachkasten
        put(p, 'box', w + 0.4, 0.4, 0.3, roof, at=(0, h + 0.2, s * (d / 2 + 0.05)))
        put(p, 'box', 0.3, 0.4, d - 0.2, roof, at=(s * (w / 2 + 0.05), h + 0.2, 0))
    put(p, 'box', w, 0.1, d, dk(roof, 0.8), at=(0, h + 0.05, 0))
    put(p, 'box', 1.6, 2.4, 0.1, DARK, at=(door_x, 1.2, d / 2 + 0.05))
    put(p, 'box', 1.9, 0.12, 0.12, roof, at=(door_x, 2.46, d / 2 + 0.06))
    put(p, 'box', 0.04, 2.3, 0.02, dk(DARK, 1.6), at=(door_x, 1.15, d / 2 + 0.105))
    put(p, 'box', 2.0, 0.12, 0.5, STONE, at=(door_x, 0.06, d / 2 + 0.25))
    if canopy: put(p, 'box', 2.2, 0.12, 0.8, roof, bevel=0.02, at=(door_x, 2.65, d / 2 + 0.4))
    for f in range(floors):
        y = 4 + f * 3
        for s in (-1, 1):
            x = -w / 2 + 1.5
            while x <= w / 2 - 1.4:
                at = (x, y, s * (d / 2 + 0.05)); ry = 0 if s > 0 else PI
                put(p, 'box', 1.2, 1.4, 0.1, win, at=at)
                put(p, 'box', 0.06, 1.4, 0.12, wall, at=at)
                put(p, 'box', 1.4, 0.1, 0.22, roof, at=loc(at, ry, 0, -0.75, 0.06))
                put(p, 'box', 1.4, 0.1, 0.14, roof, at=loc(at, ry, 0, 0.75, 0.02))
                x += 2.4
            z = -d / 2 + 1.5
            while z <= d / 2 - 1.4:
                at = (s * (w / 2 + 0.05), y, z); ry = s * PI / 2
                put(p, 'box', 0.1, 1.4, 1.2, win, at=at)
                put(p, 'box', 0.12, 1.4, 0.06, wall, at=at)
                put(p, 'box', 1.4, 0.1, 0.22, roof, at=loc(at, ry, 0, -0.75, 0.06), m=RY(ry))
                put(p, 'box', 1.4, 0.1, 0.14, roof, at=loc(at, ry, 0, 0.75, 0.02), m=RY(ry))
                z += 2.4
    vx, vz = w * 0.25, -d * 0.2
    put(p, 'box', 1.2, 1.4, 1.2, METAL, bevel=0.03, at=(vx, h + 0.8, vz))
    for k in range(3): put(p, 'box', 1.0, 0.05, 0.02, dk(METAL, 0.7), at=(vx, h + 0.55 + k * 0.25, vz + 0.61))
    put(p, 'cyl', 0.3, 0.35, 0.25, dk(METAL, 0.85), seg=8, at=(vx, h + 1.62, vz))
    rod(p, (-w * 0.3, h + 0.1, d * 0.2), (-w * 0.3, h + 2.2, d * 0.2), 0.03, DARK, seg=4)
    rod(p, (-w * 0.3 - 0.4, h + 1.9, d * 0.2), (-w * 0.3 + 0.4, h + 1.9, d * 0.2), 0.02, DARK, seg=4)


@model('requisiten/cityBlock')
def cityBlock(p, root):
    city_block(p, 10, 8, 12, 0xdfe6e9, 0x74b9ff, DSTONE)


@model('requisiten/awningShop')
def awningShop(p, root):
    w, d, wall, aw = 8, 6, 0xffeaa7, 0xe74c3c
    city_block(p, w, d, 5, wall, 0x74b9ff, DSTONE, door_x=-2.5, canopy=False)
    put(p, 'box', 4.8, 1.4, 0.1, GLASS, at=(0.8, 1.4, d / 2 + 0.06))
    for s in (-1, 1):
        put(p, 'box', 5.0, 0.1, 0.16, WHITE, at=(0.8, 1.4 + s * 0.75, d / 2 + 0.08))
        put(p, 'box', 0.1, 1.6, 0.16, WHITE, at=(0.8 + s * 2.45, 1.4, d / 2 + 0.08))
    put(p, 'box', 0.06, 1.4, 0.14, WHITE, at=(0.8, 1.4, d / 2 + 0.08))
    put(p, 'box', 5.0, 0.55, 0.12, dk(wall, 0.8), at=(0.8, 0.38, d / 2 + 0.06))
    zc, th = d / 2 + 0.65, 0.35; fz, fy = zc + 0.7 * math.cos(th), 2.95 - 0.7 * math.sin(th)
    for i in range(8):
        x = -2.8 + i * 0.8; c = aw if i % 2 == 0 else WHITE
        put(p, 'box', 0.8, 0.08, 1.4, c, at=(x, 2.95, zc), rot=(th, 0, 0))
        put(p, 'box', 0.8, 0.22, 0.04, c, at=(x, fy - 0.1, fz))
        put(p, 'cyl', 0.14, 0.14, 0.04, c, seg=6, at=(x, fy - 0.2, fz), rot=AZ)
    for s in (-1, 1): rod(p, (s * 3.0, 2.4, d / 2), (s * 3.1, fy - 0.02, fz - 0.05), 0.03, METAL, seg=4)
    put(p, 'box', 5, 0.7, 0.12, WHITE, bevel=0.02, at=(0, 3.9, d / 2 + 0.08))
    for s in (-1, 1): put(p, 'box', 5.05, 0.1, 0.14, aw, at=(0, 3.9 + s * 0.32, d / 2 + 0.09))
    for i, wl in enumerate((0.6, 0.4, 0.7, 0.5, 0.45)): put(p, 'box', wl, 0.25, 0.02, DARK, at=(-1.7 + i * 0.85, 3.9, d / 2 + 0.15))


@model('requisiten/warehouse')
def warehouse(p, root):
    w, d, h, c = 16, 10, 7, 0x95a5a6; rc = 0x7f8c8d
    put(p, 'box', w, h, d, c, at=(0, h / 2, 0))
    put(p, 'box', w + 0.1, 0.5, d + 0.1, DSTONE, at=(0, 0.25, 0))
    for s in (-1, 1):
        x = -w / 2 + 0.5
        while x < w / 2:
            if not (s > 0 and abs(x) < 2.2): put(p, 'box', 0.08, h - 0.6, 0.04, dk(c, 0.85), at=(x, (h + 0.5) / 2, s * (d / 2 + 0.02)))
            x += 1.0
        z = -d / 2 + 0.5
        while z < d / 2:
            if not (s > 0 and abs(z - 2) < 0.7): put(p, 'box', 0.04, h - 0.6, 0.08, dk(c, 0.85), at=(s * (w / 2 + 0.02), (h + 0.5) / 2, z))
            z += 1.0
    arc = [(5 * math.cos(t * PI / 10), h + 1.75 * math.sin(t * PI / 10)) for t in range(11)]
    hull(p, [(x, y, z) for x in (-(w + 0.3) / 2, (w + 0.3) / 2) for z, y in arc], rc)
    for k in range(9):
        x = -w / 2 + 0.15 + k * (w - 0.3) / 8
        tube(p, [(x, y + 0.03, z) for z, y in arc], 0.06, dk(rc, 0.8), ring=4)
    put(p, 'box', 4, 4.5, 0.1, 0x57606f, at=(0, 2.25, d / 2 + 0.05))
    for k in range(8): put(p, 'box', 3.9, 0.05, 0.12, dk(0x57606f, 0.75), at=(0, 0.4 + k * 0.55, d / 2 + 0.06))
    for s in (-1, 1): put(p, 'box', 0.25, 4.7, 0.2, dk(c, 0.75), at=(s * 2.12, 2.35, d / 2 + 0.08))
    put(p, 'box', 4.5, 0.25, 0.2, dk(c, 0.75), at=(0, 4.6, d / 2 + 0.08))
    x = -w / 2 + 2
    while x < w / 2 - 1:
        put(p, 'box', 1.6, 0.8, 0.1, 0xb3e5fc, at=(x, h - 1.2, d / 2 + 0.05))
        put(p, 'box', 1.8, 0.1, 0.18, dk(c, 0.75), at=(x, h - 1.65, d / 2 + 0.08))
        x += 3
    put(p, 'box', 0.1, 2.2, 1.1, 0x57606f, at=(w / 2 + 0.05, 1.1, 2))
    for sx in (-1, 1):
        for sz in (-1, 1): rod(p, (sx * (w / 2 + 0.12), h, sz * (d / 2 + 0.12)), (sx * (w / 2 + 0.12), 0.05, sz * (d / 2 + 0.12)), 0.08, METAL, seg=6)


@model('requisiten/beachHut')
def beachHut(p, root):
    c = 0x48dbfb
    put(p, 'box', 2.7, 0.15, 2.9, LWOOD, bevel=0.02, at=(0, 0.075, 0.25))
    for k in range(5): put(p, 'box', 0.02, 0.005, 2.88, dk(LWOOD, 0.8), at=(-1.08 + k * 0.54, 0.152, 0.25))
    put(p, 'box', 2.4, 2.3, 2.2, WHITE, at=(0, 1.3, 0))
    for i in range(4): put(p, 'box', 0.3, 2.32, 2.22, c, at=(-0.9 + i * 0.6, 1.3, 0))
    k = 1.9 / math.sqrt(2)
    hull(p, [(sx * k, 2.4, sz * k) for sx in (-1, 1) for sz in (-1, 1)] + [(0, 3.4, 0)], c)
    for sx in (-1, 1):
        for sz in (-1, 1): rod(p, (sx * k, 2.42, sz * k), (0, 3.42, 0), 0.04, WHITE, seg=4)
    put(p, 'cyl', 1.9, 1.9, 0.08, WHITE, seg=4, at=(0, 2.4, 0), rot=(0, PI / 4, 0))
    put(p, 'ball', 0.09, WHITE, uv=(6, 4), at=(0, 3.45, 0))
    put(p, 'box', 0.9, 1.7, 0.06, DWOOD, bevel=0.01, at=(0, 1.0, 1.12))
    put(p, 'cyl', 0.15, 0.15, 0.04, GLASS, seg=8, at=(0, 1.45, 1.16), rot=AZ)
    put(p, 'torus', 0.15, 0.03, WHITE, seg=8, ring=4, at=(0, 1.45, 1.16), m=RX(PI / 2))
    put(p, 'ball', 0.04, 0xe1b12c, uv=(4, 3), at=(0.33, 0.95, 1.17))
    put(p, 'torus', 0.25, 0.07, 0xff7675, seg=10, ring=4, at=(1.25, 1.5, 0.3), m=RZ(PI / 2) @ RX(PI / 2))


@model('requisiten/kiosk')
def kiosk(p, root):
    c = 0x1dd1a1
    put(p, 'box', 3, 2.4, 2.4, WHITE, bevel=0.04, at=(0, 1.2, 0))
    put(p, 'box', 3.04, 0.3, 2.44, dk(c, 0.8), at=(0, 0.15, 0))
    put(p, 'box', 2.4, 0.9, 0.1, GLASS, at=(0, 1.6, 1.21))
    for s in (-1, 1):
        put(p, 'box', 2.56, 0.08, 0.12, c, at=(0, 1.6 + s * 0.49, 1.22))
        put(p, 'box', 0.08, 0.98, 0.12, c, at=(s * 1.24, 1.6, 1.22))
    put(p, 'box', 3, 0.15, 0.6, c, bevel=0.03, at=(0, 1.05, 1.4))
    for x in (-1.2, 1.2): beam(p, (x, 0.6, 1.22), (x, 0.98, 1.6), 0.08, 0.08, dk(c, 0.8))
    put(p, 'box', 3.4, 0.2, 2.9, c, bevel=0.04, at=(0, 2.5, 0.15))
    for i in range(8): put(p, 'cyl', 0.22, 0.22, 0.04, c if i % 2 else WHITE, seg=6, at=(-1.47 + i * 0.42, 2.4, 1.61), rot=AZ)
    put(p, 'box', 2, 0.5, 0.1, WHITE, bevel=0.02, at=(0, 2.9, 0.6))
    put(p, 'box', 1.6, 0.18, 0.02, c, at=(0, 2.9, 0.66))
    for i, cc in enumerate((0xe74c3c, 0xfeca57, 0x48dbfb)): put(p, 'box', 0.35, 0.04, 0.25, cc, at=(-0.8 + i * 0.4, 1.145 + i * 0.01, 1.4), rot=(0, 0.2 * (i - 1), 0))


@model('requisiten/marketStall')
def marketStall(p, root):
    c = 0xef5350
    put(p, 'box', 2.9, 0.9, 1.3, WOOD, bevel=0.02, at=(0, 0.45, 0))
    for i in range(6): put(p, 'box', 0.03, 0.85, 0.02, DWOOD, at=(-1.2 + i * 0.48, 0.45, 0.655))
    put(p, 'box', 3.1, 0.1, 1.5, WOOD, bevel=0.02, at=(0, 0.95, 0))
    for x in (-1.4, 1.4):
        for z in (-0.6, 0.6): put(p, 'box', 0.1, 2.4, 0.1, DWOOD, bevel=0.015, at=(x, 1.2, z))
    th = 0.15; fz, fy = math.cos(th), 2.45 - math.sin(th)
    for i in range(6):
        x = -1.375 + i * 0.55; cc = c if i % 2 == 0 else WHITE
        put(p, 'box', 0.55, 0.08, 2.0, cc, at=(x, 2.45, 0), rot=(th, 0, 0))
        put(p, 'cyl', 0.14, 0.14, 0.03, cc, seg=6, at=(x, fy - 0.03, fz), rot=AZ)
    for x, cc, r in ((-0.9, 0xe74c3c, 0.09), (0, 0xf1c40f, 0.08), (0.9, 0x27ae60, 0.13)):
        put(p, 'box', 0.8, 0.2, 0.9, LWOOD, bevel=0.02, at=(x, 1.1, 0))
        for s in (-1, 1): put(p, 'box', 0.82, 0.03, 0.02, dk(LWOOD, 0.75), at=(x, 1.1, s * 0.455))
        for k in range(5):
            put(p, 'ball', r, cc, uv=(5, 4), jitter=0.05, seed=k, at=(x - 0.24 + (k % 3) * 0.24, 1.2 + r * 0.6, -0.2 + (k // 3) * 0.35 + 0.05 * (k % 2)))


# ================================================================ Straße
@model('requisiten/streetLamp')
def streetLamp(p, root):
    h = 4.5
    lth(p, [(0.22, 0), (0.2, 0.15), (0.14, 0.25), (0.13, 0.6), (0.16, 0.65), (0.11, 0.72), (0.09, h - 0.1), (0.11, h - 0.05), (0.08, h + 0.08)], DARK, seg=8)
    put(p, 'ball', 0.07, DARK, uv=(5, 4), at=(0, h + 0.12, 0))
    rod(p, (0, h, 0), (0.85, h + 0.02, 0), 0.05, DARK, seg=6)
    rod(p, (0, h - 0.5, 0), (0.45, h - 0.01, 0), 0.03, DARK, seg=5)
    put(p, 'torus', 0.12, 0.02, DARK, seg=8, ring=3, at=(0.2, h - 0.12, 0), m=RX(PI / 2))
    hull(p, [(0.9 + sx * 0.18, h + 0.1, sz * 0.1) for sx in (-1, 1) for sz in (-1, 1)] + [(0.9 + sx * 0.27, h - 0.12, sz * 0.16) for sx in (-1, 1) for sz in (-1, 1)], DARK)
    put(p, 'box', 0.44, 0.05, 0.26, LIGHT, at=(0.9, h - 0.14, 0))


def car_wheels(p, xs, zs, r, w):
    for x in xs:
        for z in zs:
            rcyl(p, r, w, DARK, at=(x, r, z), rot=AZ, seg=12, b=0.05)
            put(p, 'cyl', r * 0.52, r * 0.52, w + 0.02, METAL, seg=8, at=(x, r, z), rot=AZ)
            put(p, 'cyl', r * 0.15, r * 0.15, w + 0.04, WHITE, seg=6, at=(x, r, z), rot=AZ)


@model('requisiten/car')
def car(p, root):
    c = 0xe74c3c
    put(p, 'box', 3.8, 0.78, 1.8, c, bevel=0.1, at=(0, 0.71, 0))
    for x in (-1.2, 1.2): rcyl(p, 0.45, 1.82, DARK, at=(x, 0.38, 0), rot=AZ, seg=12, b=0.02)
    def cab(y, e=0):
        t = (y - 1.08) / 0.7
        x0, x1, zh = -1.3 + t * 0.2 - e, 0.9 - t * 0.45 + e, 0.82 - t * 0.1 + e
        return [(x, y, z) for x in (x0, x1) for z in (-zh, zh)]
    hull(p, cab(1.08) + cab(1.78), c)
    hull(p, cab(1.2, 0.015) + cab(1.66, 0.015), GLASS)
    put(p, 'box', 0.12, 0.5, 1.68, c, at=(-0.3, 1.43, 0))
    for s in (-1, 1):
        rod(p, (0.9, 1.1, s * 0.82), (0.45, 1.78, s * 0.72), 0.05, c, seg=4)
        rod(p, (-1.3, 1.1, s * 0.82), (-1.1, 1.78, s * 0.72), 0.06, c, seg=4)
        put(p, 'cyl', 0.12, 0.12, 0.05, LIGHT, seg=8, at=(1.9, 0.82, s * 0.6), rot=AX)
        put(p, 'box', 0.04, 0.14, 0.3, 0xc0392b, at=(-1.91, 0.85, s * 0.62))
        put(p, 'box', 0.14, 0.1, 0.06, c, bevel=0.02, at=(0.75, 1.2, s * 0.95))
        put(p, 'box', 0.02, 0.6, 0.01, dk(c, 0.7), at=(-0.3, 0.75, s * 0.905))
        put(p, 'box', 0.16, 0.04, 0.03, METAL, at=(-0.05, 0.92, s * 0.91))
    put(p, 'box', 0.04, 0.18, 0.7, DARK, at=(1.91, 0.62, 0))
    for x in (-1.93, 1.93):
        put(p, 'box', 0.14, 0.14, 1.84, METAL, bevel=0.04, at=(x, 0.42, 0))
        put(p, 'box', 0.03, 0.12, 0.4, WHITE, at=(x + (0.07 if x > 0 else -0.07), 0.45, 0))
    car_wheels(p, (-1.2, 1.2), (-0.85, 0.85), 0.38, 0.25)


@model('requisiten/van')
def van(p, root):
    c = 0xecf0f1
    hull(p, [(x, y, z) for y, xs, zh in ((0.42, (-2.3, 2.3), 1.0), (1.4, (-2.3, 2.3), 1.0), (2.4, (-2.3, 1.7), 0.95)) for x in xs for z in (-zh, zh)], c)
    for x in (-1.5, 1.5): rcyl(p, 0.47, 2.02, DARK, at=(x, 0.4, 0), rot=AZ, seg=12, b=0.02)
    n = Vector((1.0, 0.6, 0)).normalized()
    hull(p, [tuple(Vector(q) + n * o) for q in ((2.27, 1.48, -0.85), (2.27, 1.48, 0.85), (1.76, 2.3, -0.82), (1.76, 2.3, 0.82)) for o in (-0.01, 0.02)], GLASS)
    for s in (-1, 1):
        put(p, 'box', 0.6, 0.5, 0.04, GLASS, at=(1.45, 1.85, s * 1.0))
        put(p, 'box', 0.03, 1.5, 0.02, dk(c, 0.7), at=(0.9, 1.3, s * 1.005))
        put(p, 'box', 0.03, 1.5, 0.02, dk(c, 0.7), at=(-0.6, 1.3, s * 1.005))
        put(p, 'box', 0.18, 0.04, 0.03, METAL, at=(0.7, 1.3, s * 1.01))
        put(p, 'box', 0.14, 0.12, 0.08, c, bevel=0.02, at=(1.7, 1.75, s * 1.06))
        put(p, 'box', 0.04, 0.16, 0.3, LIGHT, at=(2.31, 1.0, s * 0.7))
        put(p, 'box', 0.04, 0.3, 0.16, 0xc0392b, at=(-2.31, 1.2, s * 0.85))
    put(p, 'box', 4.62, 0.18, 2.02, DARK, at=(0, 0.6, 0))
    put(p, 'box', 0.03, 1.7, 0.02, dk(c, 0.7), at=(-2.31, 1.45, 0))
    for x in (-2.38, 2.38): put(p, 'box', 0.14, 0.16, 2.0, METAL, bevel=0.04, at=(x, 0.5, 0))
    car_wheels(p, (-1.5, 1.5), (-0.95, 0.95), 0.4, 0.25)


@model('requisiten/bin')
def bin(p, root):
    c = 0x27ae60
    lth(p, [(0.28, 0), (0.3, 0.03), (0.35, 0.84), (0.37, 0.85), (0.37, 0.87)], c, seg=10)
    put(p, 'cyl', 0.343, 0.333, 0.05, dk(c, 0.8), seg=10, at=(0, 0.6, 0))
    lth(p, [(0.39, 0.86), (0.39, 0.91), (0.3, 0.96), (0.1, 0.99)], DARK, seg=10)
    put(p, 'box', 0.22, 0.04, 0.06, DARK, bevel=0.01, at=(0, 1.02, 0))
    for s in (-1, 1):
        put(p, 'box', 0.04, 0.05, 0.16, DARK, at=(s * 0.37, 0.76, 0))
        put(p, 'cyl', 0.07, 0.07, 0.05, DARK, seg=8, at=(s * 0.2, 0.07, -0.3), rot=AX)


@model('requisiten/hydrant')
def hydrant(p, root):
    r, dr = 0xe74c3c, 0xc0392b
    lth(p, [(0.24, 0), (0.24, 0.06), (0.19, 0.09), (0.18, 0.6), (0.21, 0.62), (0.21, 0.68), (0.17, 0.7)], r, seg=8)
    put(p, 'ball', 0.19, r, uv=(8, 4), scale=(1, 0.9, 1), at=(0, 0.7, 0))
    put(p, 'cyl', 0.05, 0.06, 0.08, dr, seg=5, at=(0, 0.89, 0))
    put(p, 'cyl', 0.08, 0.08, 0.6, r, seg=6, at=(0, 0.45, 0), rot=AX)
    for s in (-1, 1):
        put(p, 'cyl', 0.1, 0.1, 0.06, dr, seg=8, at=(s * 0.28, 0.45, 0), rot=AX)
        put(p, 'cyl', 0.04, 0.04, 0.06, dr, seg=5, at=(s * 0.33, 0.45, 0), rot=AX)
    put(p, 'cyl', 0.1, 0.1, 0.12, r, seg=8, at=(0, 0.42, 0.2), rot=AZ)
    put(p, 'cyl', 0.115, 0.115, 0.05, dr, seg=8, at=(0, 0.42, 0.27), rot=AZ)
    for i in range(6):
        a = i / 6 * 2 * PI
        put(p, 'ball', 0.02, dr, uv=(4, 3), at=(math.cos(a) * 0.21, 0.07, math.sin(a) * 0.21))


@model('requisiten/planterTree')
def planterTree(p, root):
    from make_props import round_tree
    t = Node('baum-m', root, (0, 0.4, 0)); round_tree(t, False)
    put(p, 'box', 1.6, 0.5, 1.6, DSTONE, bevel=0.04, at=(0, 0.25, 0))
    for s in (-1, 1):
        put(p, 'box', 1.7, 0.1, 0.16, STONE, bevel=0.02, at=(0, 0.52, s * 0.77))
        put(p, 'box', 0.16, 0.1, 1.38, STONE, bevel=0.02, at=(s * 0.77, 0.52, 0))
    put(p, 'box', 1.4, 0.04, 1.4, SOIL, at=(0, 0.49, 0))
    for i, (x, z) in enumerate(((0.45, 0.4), (-0.5, 0.3), (0.3, -0.5))):
        put(p, 'ball', 0.15, LEAF, uv=(5, 3), jitter=0.15, seed=i, scale=(1, 0.6, 1), at=(x, 0.53, z))


@model('requisiten/busStop')
def busStop(p, root):
    gr = 0x95a5a6
    put(p, 'box', 3.2, 0.1, 1.4, gr, bevel=0.03, at=(0, 2.4, 0))
    put(p, 'box', 3.24, 0.18, 0.06, DARK, at=(0, 2.4, 0.71))
    put(p, 'box', 3.0, 2.0, 0.04, 0xb3e5fc, at=(0, 1.3, -0.65))
    for y in (0.3, 2.3): put(p, 'box', 3.1, 0.06, 0.06, DARK, at=(0, y, -0.65))
    for x in (-0.5, 0.5): put(p, 'box', 0.05, 2.0, 0.06, DARK, at=(x, 1.3, -0.65))
    put(p, 'box', 0.04, 2.0, 1.0, 0xb3e5fc, at=(-1.55, 1.3, -0.1))
    put(p, 'box', 0.06, 0.06, 1.0, DARK, at=(-1.55, 2.3, -0.1)); put(p, 'box', 0.06, 0.06, 1.0, DARK, at=(-1.55, 0.3, -0.1))
    for x in (-1.55, 1.55):
        put(p, 'box', 0.1, 2.4, 0.1, DARK, bevel=0.015, at=(x, 1.2, -0.6))
        rod(p, (x, 2.0, -0.6), (x, 2.36, 0.5), 0.03, DARK, seg=4)
    for z in (-0.5, -0.3): grain_box(p, 2.4, 0.06, 0.18, WOOD, (0, 0.5, z), n=1)
    for x in (-1.0, 1.0): put(p, 'box', 0.06, 0.47, 0.3, METAL, at=(x, 0.235, -0.4))
    put(p, 'cyl', 0.04, 0.04, 2.8, DARK, seg=6, at=(2, 1.4, 0.4))
    rcyl(p, 0.3, 0.05, 0xf1c40f, at=(2, 2.8, 0.4), rot=AZ, seg=12, b=0.01)
    for s in (-1, 1):
        for x in (-0.08, 0.08): put(p, 'box', 0.05, 0.28, 0.02, 0x27ae60, at=(2 + x, 2.8, 0.4 + s * 0.03))
        put(p, 'box', 0.16, 0.05, 0.02, 0x27ae60, at=(2, 2.8, 0.4 + s * 0.03))
    put(p, 'box', 0.3, 0.4, 0.04, WHITE, at=(2, 1.6, 0.44))


@model('requisiten/cone3')
def cone3(p, root):
    c = 0xff7f27
    lth(p, [(0.25, 0.05), (0.24, 0.1), (0.05, 0.68), (0.03, 0.7)], c, seg=10)
    put(p, 'box', 0.5, 0.05, 0.5, c, bevel=0.015, at=(0, 0.025, 0))
    r = lambda y: 0.24 - (y - 0.1) / 0.58 * 0.19
    for y, h in ((0.37, 0.1), (0.54, 0.06)): put(p, 'cyl', r(y + h / 2) + 0.006, r(y - h / 2) + 0.006, h, WHITE, seg=10, at=(0, y, 0))


@model('requisiten/bikeRack')
def bikeRack(p, root):
    for i in range(4):
        x = -0.9 + i * 0.6
        put(p, 'torus', 0.35, 0.04, METAL, seg=8, ring=4, arc=PI, at=(x, 0.02, 0), m=RY(PI / 2) @ RX(PI / 2))
        for z in (-0.35, 0.35): put(p, 'box', 0.1, 0.02, 0.1, DARK, at=(x, 0.01, z))
    for z in (-0.35, 0.35): put(p, 'box', 2.0, 0.04, 0.05, METAL, at=(0, 0.02, z))


@model('requisiten/bike')
def bike(p, root):
    c = 0x0984e3
    for x in (-0.5, 0.5):
        put(p, 'torus', 0.33, 0.04, DARK, seg=14, ring=4, at=(x, 0.35, 0), m=RX(PI / 2))
        put(p, 'cyl', 0.04, 0.04, 0.1, METAL, seg=6, at=(x, 0.35, 0), rot=AZ)
        for k in range(3): put(p, 'box', 0.015, 0.6, 0.012, METAL, at=(x, 0.35, 0), m=RZ(k * PI / 3))
    R, BB, S, H, Hb, F = (-0.5, 0.35, 0), (-0.05, 0.33, 0), (-0.2, 0.78, 0), (0.4, 0.8, 0), (0.43, 0.66, 0), (0.5, 0.35, 0)
    for a, b in ((BB, S), (S, H), (BB, Hb), (Hb, H)): rod(p, a, b, 0.028, c, seg=5)
    for s in (-1, 1):
        rod(p, (R[0], R[1], s * 0.04), BB, 0.018, c, seg=4)
        rod(p, (R[0], R[1], s * 0.04), (-0.18, 0.72, 0), 0.016, c, seg=4)
        rod(p, Hb, (F[0], F[1], s * 0.04), 0.02, c, seg=4)
    rod(p, H, (0.42, 0.9, 0), 0.02, METAL, seg=4)
    put(p, 'box', 0.05, 0.05, 0.48, DARK, at=(0.42, 0.9, 0))
    for s in (-1, 1): put(p, 'cyl', 0.03, 0.03, 0.1, DARK, seg=5, at=(0.42, 0.9, s * 0.25), rot=AZ)
    hull(p, [(-0.34, 0.83, sz * 0.04) for sz in (-1, 1)] + [(-0.1, 0.83, sz * 0.09) for sz in (-1, 1)] + [(-0.12, 0.85, sz * 0.08) for sz in (-1, 1)] + [(-0.32, 0.86, 0)], DARK)
    rod(p, S, (-0.2, 0.83, 0), 0.015, METAL, seg=4)
    put(p, 'cyl', 0.07, 0.07, 0.04, METAL, seg=8, at=BB, rot=AZ)
    for s, a in ((1, 0.6), (-1, 0.6 + PI)):
        e = (BB[0] + math.cos(a) * 0.14, BB[1] - math.sin(a) * 0.14, s * 0.06)
        rod(p, (BB[0], BB[1], s * 0.04), e, 0.015, METAL, seg=4)
        put(p, 'box', 0.08, 0.025, 0.07, DARK, at=(e[0], e[1], s * 0.1))


@model('requisiten/cafeTable')
def cafeTable(p, root):
    c = 0xe74c3c
    lth(p, [(0.28, 0), (0.28, 0.03), (0.06, 0.07)], METAL, seg=10)
    put(p, 'cyl', 0.04, 0.04, 0.68, METAL, seg=6, at=(0, 0.4, 0))
    rcyl(p, 0.45, 0.05, WHITE, at=(0, 0.75, 0), seg=12, b=0.015)
    put(p, 'cyl', 0.035, 0.035, 2.2, WHITE, seg=6, at=(0, 1.4, 0))
    for k in range(8):
        a0, a1 = k * PI / 4, (k + 1) * PI / 4; cc = c if k % 2 == 0 else WHITE
        rim = [(math.cos(a) * 1.3, 2.25, math.sin(a) * 1.3) for a in (a0, a1)]
        pts = [(0, 2.75, 0)] + rim + [(0, 2.72, 0)] + [(x * 0.97, y - 0.03, z * 0.97) for x, y, z in rim]
        hull(p, pts, cc)
        am = (a0 + a1) / 2
        hull(p, rim + [(math.cos(am) * 1.24, 2.12, math.sin(am) * 1.24)] + [(x * 0.985, y, z * 0.985) for x, y, z in rim], cc)
    put(p, 'ball', 0.06, WHITE, uv=(5, 4), at=(0, 2.78, 0))
    for x in (0.75, -0.75):
        s = 1 if x > 0 else -1
        put(p, 'box', 0.45, 0.05, 0.45, METAL, bevel=0.01, at=(x, 0.45, 0))
        put(p, 'box', 0.05, 0.42, 0.45, METAL, bevel=0.01, at=(x + s * 0.22, 0.7, 0))
        for dx in (-0.18, 0.18):
            for dz in (-0.18, 0.18): rod(p, (x + dx, 0.43, dz), (x + dx * 1.15, 0, dz * 1.15), 0.018, METAL, seg=4)


@model('requisiten/billboard')
def billboard(p, root):
    c = 0xfeca57
    for x in (-1.5, 1.5):
        put(p, 'box', 0.25, 3, 0.25, DARK, bevel=0.03, at=(x, 1.5, 0))
        put(p, 'box', 0.5, 0.08, 0.5, DARK, at=(x, 0.04, 0))
    rod(p, (-1.5, 0.4, -0.08), (1.5, 2.6, -0.08), 0.04, DARK, seg=4); rod(p, (1.5, 0.4, -0.08), (-1.5, 2.6, -0.08), 0.04, DARK, seg=4)
    put(p, 'box', 4.4, 2.2, 0.2, WHITE, bevel=0.04, at=(0, 4, 0))
    put(p, 'box', 4, 1.8, 0.22, c, at=(0, 4, 0))
    put(p, 'box', 1.4, 0.6, 0.24, 0xe74c3c, bevel=0.02, at=(-0.8, 4.3, 0))
    for y, wl in ((4.38, 1.0), (4.22, 0.7)): put(p, 'box', wl, 0.08, 0.25, WHITE, at=(-0.8, y, 0))
    for y, wl in ((3.6, 1.6), (3.4, 1.2)): put(p, 'box', wl, 0.1, 0.24, dk(c, 0.7), at=(-0.6, y, 0))
    rcyl(p, 0.5, 0.12, 0x8d6e4a, at=(1, 3.9, 0.15), rot=AZ, seg=12, b=0.03)
    for i, (dx, dy) in enumerate(((0.2, 0.15), (-0.15, 0.2), (0.05, -0.2), (-0.25, -0.1), (0.28, -0.15))):
        put(p, 'ball', 0.05, DWOOD, uv=(4, 3), at=(1 + dx, 3.9 + dy, 0.21))
    put(p, 'box', 4.4, 0.06, 0.5, DARK, at=(0, 2.85, 0.3))
    for x in (-1, 1):
        rod(p, (x, 5.1, 0.1), (x, 5.35, 0.55), 0.03, DARK, seg=4)
        put(p, 'box', 0.3, 0.08, 0.15, DARK, at=(x, 5.32, 0.6))


@model('requisiten/fountainSmall')
def fountainSmall(p, root):
    W = 0x74b9ff
    lth(p, [(2.2, 0), (2.15, 0.1), (2.0, 0.5), (2.05, 0.55), (2.05, 0.62), (1.85, 0.62), (1.82, 0.5)], STONE, seg=14)
    put(p, 'cyl', 1.83, 1.83, 0.04, W, seg=14, at=(0, 0.54, 0))
    lth(p, [(0.4, 0.5), (0.38, 0.6), (0.25, 0.7), (0.22, 1.2), (0.28, 1.3), (0.22, 1.4), (0.2, 1.62)], STONE, seg=8)
    lth(p, [(0.2, 1.6), (0.35, 1.66), (0.8, 1.84), (0.82, 1.9), (0.72, 1.9), (0.7, 1.86)], STONE, seg=10)
    put(p, 'cyl', 0.71, 0.71, 0.03, W, seg=10, at=(0, 1.875, 0))
    lth(p, [(0.1, 1.86), (0.12, 1.95), (0.06, 2.05), (0.08, 2.12), (0.02, 2.2)], DSTONE, seg=6)
    for k in range(4):
        a = k * PI / 2 + PI / 4; ca, sa = math.cos(a), math.sin(a)
        tube(p, [(ca * r, y, sa * r) for r, y in ((0.82, 1.88), (0.92, 1.75), (1.0, 1.35), (1.05, 0.9), (1.08, 0.56))], 0.05, W, ring=4)


# ================================================================ Hafen und Strand
def barrel_into(p, c):
    prof = [(0.4, 0), (0.44, 0.2), (0.47, 0.55), (0.44, 0.9), (0.4, 1.1)]
    lth(p, prof, c, seg=12)
    def r(y):
        for (r0, y0), (r1, y1) in zip(prof, prof[1:]):
            if y0 <= y <= y1: return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
    for y in (0.1, 0.3, 0.8, 1.0): put(p, 'cyl', r(y + 0.04) + 0.015, r(y - 0.04) + 0.015, 0.08, METAL, seg=12, at=(0, y, 0))
    put(p, 'cyl', 0.36, 0.36, 0.02, dk(c, 0.8), seg=12, at=(0, 1.1, 0))
    put(p, 'cyl', 0.05, 0.05, 0.04, dk(c, 0.6), seg=6, at=(0.2, 1.12, 0.05))


@model('requisiten/barrel')
def barrel(p, root):
    barrel_into(p, 0x8d6e4a)


def crate_into(p, s, c, at=(0, 0, 0)):
    x0, y0, z0 = at; t = 0.12 * s; e = s / 2 - t / 2
    put(p, 'box', s * 0.96, s * 0.96, s * 0.96, c, at=(x0, y0 + s / 2, z0))
    for a in (-1, 1):
        for b in (-1, 1):
            put(p, 'box', s, t, t, WOOD, at=(x0, y0 + s / 2 + a * e, z0 + b * e))
            put(p, 'box', t, t, s - 2 * t, WOOD, at=(x0 + a * e, y0 + s / 2 + b * e, z0))
            put(p, 'box', t, s - 2 * t, t, WOOD, at=(x0 + a * e, y0 + s / 2, z0 + b * e))
    dl = (s - 2 * t) * math.sqrt(2)
    for zz in (-1, 1): put(p, 'box', dl, t * 0.8, t * 0.5, WOOD, at=(x0, y0 + s / 2, z0 + zz * (s / 2 - t * 0.2)), rot=(0, 0, zz * PI / 4))
    for xx in (-1, 1): put(p, 'box', t * 0.5, t * 0.8, dl, WOOD, at=(x0 + xx * (s / 2 - t * 0.2), y0 + s / 2, z0), rot=(xx * PI / 4, 0, 0))
    for k in (-1, 1): put(p, 'box', s * 0.74, 0.012, s * 0.97, dk(c, 0.8), at=(x0, y0 + s / 2 + k * s * 0.12, z0))


@model('requisiten/crate')
def crate(p, root):
    crate_into(p, 1, LWOOD)


@model('requisiten/crates')
def crates(p, root):
    crate_into(p, 1.2, LWOOD)
    crate_into(p, 1.1, LWOOD, (1.3, 0, 0.1))
    crate_into(p, 1, LWOOD, (0.6, 1.2, 0))


def pallet_into(p, y0, bevel=0.01):
    for i in range(5):
        put(p, 'box', 0.2, 0.05, 1.2, LWOOD, bevel=bevel, at=(-0.5 + i * 0.25, y0 + 0.17, 0))
        if bevel: put(p, 'box', 0.012, 0.006, 0.9, dk(LWOOD, 0.8), at=(-0.5 + i * 0.25 + 0.03 * (i % 2 - 0.5), y0 + 0.197, 0))
    for z in (-0.45, 0, 0.45):
        put(p, 'box', 1.2, 0.04, 0.15, WOOD, at=(0, y0 + 0.125, z))
        for x in (-0.5, 0, 0.5): put(p, 'box', 0.15, 0.105, 0.15, WOOD, at=(x, y0 + 0.0525, z))


@model('requisiten/pallet')
def pallet(p, root):
    pallet_into(p, 0)


@model('requisiten/palletStack')
def palletStack(p, root):
    n = 4
    for k in range(n): pallet_into(p, k * 0.2, bevel=0)
    y0 = n * 0.2
    for ly in range(2):
        for x in (-0.28, 0.28):
            for z in (-0.28, 0.28):
                put(p, 'box', 0.54, 0.44, 0.54, 0xc0905a, bevel=0.015, at=(x, y0 + 0.22 + ly * 0.45, z))
                if ly: put(p, 'box', 0.12, 0.012, 0.55, 0xe1b12c, at=(x, y0 + 0.895, z))


@model('requisiten/ropeCoil')
def ropeCoil(p, root):
    pts = []
    for i in range(43):
        t = i / 14; a = 2 * PI * t
        pts.append((math.cos(a) * (0.42 - 0.04 * t), 0.07 + 0.12 * t, math.sin(a) * (0.42 - 0.04 * t)))
    pts += [(0.45, 0.25, 0.12), (0.55, 0.1, 0.25), (0.7, 0.06, 0.3), (0.85, 0.06, 0.28)]
    tube(p, pts, 0.07, ROPE, ring=4)
    put(p, 'cyl', 0.34, 0.34, 0.02, dk(ROPE, 0.75), seg=8, at=(0, 0.01, 0))


@model('requisiten/fishNet')
def fishNet(p, root):
    n = 0x6c7a89
    put(p, 'ball', 0.9, n, sub=2, jitter=0.12, seed=1, scale=(1.3, 0.35, 1), at=(0, 0.25, 0))
    put(p, 'ball', 0.45, dk(n, 0.85), sub=1, jitter=0.2, seed=2, scale=(1, 0.5, 1), at=(0.55, 0.38, 0.3))
    put(p, 'ball', 0.4, n, sub=1, jitter=0.2, seed=3, scale=(1, 0.55, 1), at=(-0.5, 0.35, -0.25))
    for z0, x0 in ((0.25, -1.0), (-0.3, -0.9)):
        tube(p, [(x, 0.25 + 0.33 * math.sqrt(max(0, 1 - (x / 1.25) ** 2 - (z0 / 1.0) ** 2)) + 0.02, z0 + 0.15 * math.sin(x * 2)) for x in [x0 + k * 0.27 for k in range(8)]], 0.025, ROPE, ring=4)
    for x, y, z in ((0.6, 0.45, 0.2), (-0.5, 0.42, -0.3), (0.1, 0.5, -0.55)): put(p, 'ball', 0.12, 0xff7675, uv=(6, 4), scale=(1, 0.8, 1), at=(x, y, z))


@model('requisiten/lobsterPot')
def lobsterPot(p, root):
    put(p, 'box', 1, 0.12, 0.7, DWOOD, bevel=0.02, at=(0, 0.06, 0))
    put(p, 'cyl', 0.33, 0.33, 0.96, 0x6c7a89, seg=12, at=(0, 0.3, 0), rot=AX)
    for x in (-0.45, 0, 0.45): put(p, 'torus', 0.34, 0.03, DWOOD, seg=8, ring=4, arc=PI, at=(x, 0.3, 0), m=RY(PI / 2) @ RX(PI / 2))
    for a in (PI / 2, PI / 4, 3 * PI / 4): rod(p, (-0.5, 0.3 + math.sin(a) * 0.34, math.cos(a) * 0.34), (0.5, 0.3 + math.sin(a) * 0.34, math.cos(a) * 0.34), 0.018, DWOOD, seg=4)
    put(p, 'torus', 0.12, 0.025, DWOOD, seg=8, ring=4, at=(0.49, 0.32, 0), m=RY(PI / 2) @ RX(PI / 2))
    put(p, 'cyl', 0.11, 0.11, 0.02, DARK, seg=8, at=(0.485, 0.32, 0), rot=AX)
    tube(p, [(0.25, 0.63, 0), (0.45, 0.6, 0.15), (0.6, 0.4, 0.3), (0.62, 0.22, 0.38)], 0.018, ROPE, ring=4)
    put(p, 'ball', 0.12, 0xff7675, uv=(6, 4), at=(0.62, 0.12, 0.4))


@model('requisiten/bollard')
def bollard(p, root):
    lth(p, [(0.42, 0), (0.42, 0.05), (0.36, 0.08), (0.32, 0.3), (0.28, 0.55), (0.3, 0.7), (0.42, 0.78), (0.48, 0.84), (0.48, 0.92), (0.4, 0.95), (0.2, 0.97)], DARK, seg=10)
    put(p, 'cyl', 0.315, 0.32, 0.04, METAL, seg=10, at=(0, 0.4, 0))
    for i in range(6):
        a = i / 6 * 2 * PI
        put(p, 'cyl', 0.025, 0.025, 0.03, METAL, seg=5, at=(math.cos(a) * 0.38, 0.055, math.sin(a) * 0.38))


@model('requisiten/anchorDeco')
def anchorDeco(p, root):
    rcyl(p, 0.1, 1.6, METAL, at=(0, 0.95, 0), seg=8, b=0.02)
    put(p, 'torus', 0.14, 0.04, METAL, seg=10, ring=4, at=(0, 1.93, 0), m=RX(PI / 2))
    rod(p, (-0.4, 1.6, 0), (0.4, 1.6, 0), 0.06, METAL, seg=6)
    for s in (-1, 1): put(p, 'ball', 0.08, METAL, uv=(6, 4), at=(s * 0.42, 1.6, 0))
    R, cy = 0.8, 0.95
    put(p, 'torus', R, 0.09, METAL, seg=10, ring=5, arc=2 * PI / 3, at=(0, cy, 0), m=RZ(7 * PI / 6) @ RX(PI / 2))
    put(p, 'ball', 0.14, METAL, uv=(6, 4), at=(0, cy - R, 0))
    for ang, sgn in ((7 * PI / 6, -1), (11 * PI / 6, 1)):
        e = Vector((math.cos(ang) * R, cy + math.sin(ang) * R, 0))
        tg = Vector((-math.sin(ang), math.cos(ang), 0)) * (1 if sgn > 0 else -1); nr = Vector((math.cos(ang), math.sin(ang), 0))
        tip = e + tg * 0.38
        pts = [tip, e + nr * 0.18 - tg * 0.04, e - nr * 0.18 - tg * 0.04]
        hull(p, [tuple(q + Vector((0, 0, dz))) for q in pts for dz in (-0.05, 0.05)], METAL)


@model('requisiten/lifebuoyStand')
def lifebuoyStand(p, root):
    put(p, 'box', 0.12, 2.2, 0.12, WHITE, bevel=0.015, at=(0, 1.1, 0))
    put(p, 'cone', 0.1, 0.1, WHITE, seg=4, at=(0, 2.25, 0), rot=(0, PI / 4, 0))
    rod(p, (0, 1.85, 0.06), (0, 1.88, 0.2), 0.02, METAL, seg=4)
    for k in range(8): put(p, 'torus', 0.4, 0.12, 0xff7675 if k % 2 == 0 else WHITE, seg=2, ring=6, arc=PI / 4, at=(0, 1.4, 0.1), m=RX(PI / 2) @ RY(-k * PI / 4))
    pts = []
    for i in range(16):
        a = i / 16 * 2 * PI; r = 0.53 if i % 4 == 2 else 0.5
        pts.append((math.cos(a + PI / 8) * r, 1.4 + math.sin(a + PI / 8) * r, 0.1))
    tube(p, pts, 0.015, ROPE, ring=4, closed=True)
    put(p, 'box', 0.4, 0.25, 0.03, WHITE, bevel=0.01, at=(0, 0.75, 0.075))
    put(p, 'box', 0.25, 0.06, 0.035, 0xe74c3c, at=(0, 0.75, 0.077)); put(p, 'box', 0.06, 0.18, 0.035, 0xe74c3c, at=(0, 0.75, 0.077))


def boat_outline(y, levels):
    """Umriss eines Bootsrumpfs auf Höhe y: Liste [(z, halbe Breite)] → Punkte links/rechts."""
    return [(s * hw, y, z) for z, hw in levels for s in ((-1, 1) if hw > 0 else (1,))]


@model('requisiten/rowboat')
def rowboat(p, root):
    c = 0xe17055
    top = [(-1.7, 0.6), (0, 0.72), (1.3, 0.55), (2.55, 0)]
    hull(p, boat_outline(0.02, [(-1.55, 0.4), (0, 0.55), (1.6, 0.2)]) + boat_outline(0.5, top) + [(0, 0.7, 2.55)], c)
    hull(p, boat_outline(0.49, [(z, hw * 0.86) for z, hw in top[:3]] + [(2.25, 0)]) + boat_outline(0.515, [(z, hw * 0.86) for z, hw in top[:3]] + [(2.25, 0)]), LWOOD)
    rim = [(-0.6, -1.7), (-0.72, 0), (-0.55, 1.3), (0, 2.55), (0.55, 1.3), (0.72, 0), (0.6, -1.7)]
    tube(p, [(x, 0.53 + (0.15 if z > 2 else 0), z) for x, z in rim], 0.05, WOOD, ring=4, closed=True)
    tube(p, [(x * 0.82, 0.27, z * 0.97) for x, z in rim], 0.025, dk(c, 0.75), ring=4)
    for z, w in ((0.4, 1.2), (-1.2, 1.0)): grain_box(p, w, 0.08, 0.3, LWOOD, (0, 0.57, z), n=1)
    d = Vector((math.sin(0.3), 0, math.cos(0.3)))
    a = Vector((0.75, 0.55, 0)) - d * 1.2; b = Vector((0.75, 0.55, 0)) + d * 1.2
    rod(p, tuple(a), tuple(b), 0.035, WOOD, seg=5)
    put(p, 'box', 0.18, 0.03, 0.5, WOOD, at=tuple(b - d * 0.2), rot=(0, 0.3, 0))


@model('requisiten/fishingBoat')
def fishingBoat(p, root):
    c = 0x0984e3
    top = [(-4.0, 1.5), (2.5, 1.5), (4.6, 0.75), (6.1, 0)]
    hull(p, boat_outline(0.05, [(-3.9, 1.1), (2.5, 1.0), (4.5, 0.15)]) + boat_outline(1.2, top), c)
    hull(p, boat_outline(1.2, top) + boat_outline(1.45, [(z, hw * 1.02) for z, hw in top[:3]] + [(6.15, 0)]), WHITE)
    deck = [(z, hw * 0.92) for z, hw in top[:3]] + [(5.7, 0)]
    hull(p, boat_outline(1.44, deck) + boat_outline(1.5, deck), LWOOD)
    tube(p, [(x, 1.52, z) for x, z in ((-1.5, -4.0), (-1.5, 2.5), (-0.76, 4.6), (0, 6.15), (0.76, 4.6), (1.5, 2.5), (1.5, -4.0))], 0.06, WHITE, ring=4, closed=True)
    put(p, 'box', 1.8, 1.6, 1.8, WHITE, bevel=0.04, at=(0, 2.25, -1.8))
    put(p, 'box', 2.1, 0.15, 2.2, 0xe74c3c, bevel=0.03, at=(0, 3.12, -1.8))
    for x in (-0.38, 0.38): put(p, 'box', 0.7, 0.5, 0.06, GLASS, at=(x, 2.6, -0.88))
    for s in (-1, 1):
        put(p, 'box', 0.06, 0.45, 0.6, GLASS, at=(s * 0.91, 2.6, -1.6))
        for z in (-3.0, -0.5, 1.8): put(p, 'cyl', 0.12, 0.12, 0.45, DARK, seg=6, at=(s * 1.58, 0.95, z))
    put(p, 'box', 0.7, 1.25, 0.06, DARK, at=(0, 2.1, -2.71))
    put(p, 'torus', 0.25, 0.07, 0xff7675, seg=10, ring=4, at=(0.95, 2.4, -2.4), m=RZ(PI / 2) @ RX(PI / 2))
    rcyl(p, 0.07, 3.5, WHITE, at=(0, 3.2, 1.2), seg=6, b=0.01)
    rod(p, (-0.8, 4.2, 1.2), (0.8, 4.2, 1.2), 0.04, WHITE, seg=4)
    put(p, 'ball', 0.1, LIGHT, uv=(5, 4), at=(0, 5.0, 1.2))
    rod(p, (0, 4.9, 1.2), (0, 1.55, 5.9), 0.012, DARK, seg=3)
    rod(p, (0, 4.9, 1.2), (0, 3.2, -0.9), 0.012, DARK, seg=3)
    for x, z in ((-0.6, -3.3), (0.5, -3.2)): crate_into(p, 0.6, LWOOD, (x, 1.5, z))
    put(p, 'ball', 0.6, 0x6c7a89, sub=1, jitter=0.15, seed=4, scale=(1.2, 0.4, 1), at=(0.2, 1.62, 3.0))


@model('requisiten/sailboat')
def sailboat(p, root):
    c = WHITE
    top = [(-2.75, 1.0), (1.2, 1.0), (2.8, 0.5), (4.3, 0)]
    hull(p, boat_outline(0.05, [(-2.6, 0.7), (1.5, 0.6), (3.2, 0)]) + boat_outline(0.9, top) + [(0, 1.0, 4.3)], c)
    deck = [(z, hw * 0.9) for z, hw in top[:3]] + [(3.9, 0)]
    hull(p, boat_outline(0.89, deck) + boat_outline(0.94, deck), LWOOD)
    tube(p, [(x * 1.005, 0.65, z) for x, z in ((-1.0, -2.75), (-1.0, 1.2), (-0.5, 2.8), (0, 4.3), (0.5, 2.8), (1.0, 1.2), (1.0, -2.75))], 0.035, 0x48dbfb, ring=4)
    put(p, 'box', 1.0, 0.35, 1.4, c, bevel=0.05, at=(0, 1.1, -0.6))
    for s in (-1, 1): put(p, 'box', 0.03, 0.12, 0.8, GLASS, at=(s * 0.5, 1.12, -0.6))
    rcyl(p, 0.06, 6.5, LWOOD, at=(0, 3.9, 0.6), seg=6, b=0.01)
    rod(p, (0, 1.3, 0.6), (0, 1.25, -2.3), 0.045, LWOOD, seg=5)
    sail = 0xfffaf0
    hull(p, [(dx, y, z) for y, z in ((1.38, 0.52), (6.8, 0.58), (1.38, -2.2)) for dx in (-0.015, 0.015)] + [(0.14, 3.0, -0.45)], sail)
    hull(p, [(dx, y, z) for y, z in ((6.2, 0.68), (1.15, 3.85), (1.5, 1.0)) for dx in (-0.015, 0.015)] + [(-0.1, 2.6, 2.0)], sail)
    rod(p, (0, 7.1, 0.6), (0, 0.95, -2.7), 0.01, DARK, seg=3)
    rod(p, (0, 6.25, 0.65), (0, 1.0, 4.05), 0.01, DARK, seg=3)


@model('requisiten/buoyBob')
def buoyBob(p, root):
    c = 0xff7675
    lth(p, [(0.6, -0.55), (0.58, -0.5), (0.45, 0.5), (0.38, 0.55)], c, seg=10)
    r = lambda y: 0.58 - (y + 0.5) * 0.13
    put(p, 'cyl', r(0.09) + 0.01, r(-0.09) + 0.01, 0.18, WHITE, seg=10, at=(0, 0, 0))
    put(p, 'cone', 0.25, 0.5, WHITE, seg=6, at=(0, 0.8, 0))
    put(p, 'torus', 0.3, 0.03, DARK, seg=10, ring=3, at=(0, 0.57, 0))
    put(p, 'ball', 0.07, DARK, uv=(5, 4), at=(0, 1.07, 0))
    put(p, 'torus', 0.1, 0.025, DARK, seg=6, ring=3, at=(0, -0.62, 0), m=RX(PI / 2))


@model('requisiten/umbrella')
def umbrella(p, root):
    c = 0xe74c3c
    rcyl(p, 0.04, 2.5, WHITE, at=(0, 1.25, 0), seg=6, b=0.01)
    put(p, 'cyl', 0.055, 0.055, 0.08, WHITE, seg=6, at=(0, 1.8, 0))
    for k in range(8):
        a0, a1 = k * PI / 4, (k + 1) * PI / 4; cc = c if k % 2 == 0 else WHITE
        rim = [(math.cos(a) * 1.4, 2.28, math.sin(a) * 1.4) for a in (a0, a1)]
        hull(p, [(0, 2.83, 0)] + rim + [(0, 2.79, 0)] + [(x * 0.97, y - 0.04, z * 0.97) for x, y, z in rim], cc)
        am = (a0 + a1) / 2
        hull(p, rim + [(math.cos(am) * 1.33, 2.15, math.sin(am) * 1.33)] + [(x * 0.985, y, z * 0.985) for x, y, z in rim], cc)
    put(p, 'ball', 0.06, WHITE, uv=(5, 4), at=(0, 2.86, 0))


@model('requisiten/towel')
def towel(p, root):
    c = 0x48dbfb
    put(p, 'box', 1, 0.03, 2, c, bevel=0.01, at=(0, 0.02, 0))
    for s in (-1, 1):
        put(p, 'box', 1.02, 0.035, 0.3, WHITE, at=(0, 0.025, s * 0.5))
        put(p, 'box', 1.02, 0.034, 0.06, WHITE, at=(0, 0.024, s * 0.78))
        for i in range(6): put(p, 'box', 0.05, 0.012, 0.08, WHITE, at=(-0.42 + i * 0.168, 0.008, s * 1.03))


@model('requisiten/deckChair')
def deckChair(p, root):
    c = 0x1dd1a1
    for (L, y, z, rx) in ((1.2, 0.45, 0.2, -0.1), (0.9, 0.8, -0.6, 0.9)):
        put(p, 'box', 0.7, 0.03, L, c, at=(0, y, z), rot=(rx, 0, 0))
        for x in (-0.2, 0.2): put(p, 'box', 0.12, 0.035, L, WHITE, at=(x, y, z), rot=(rx, 0, 0))
        for x in (-0.38, 0.38): put(p, 'box', 0.05, 0.06, L, WOOD, bevel=0.01, at=(x, y - 0.01, z), rot=(rx, 0, 0))
    for x in (-0.38, 0.38):
        put(p, 'box', 0.06, 0.45, 0.06, WOOD, bevel=0.01, at=(x, 0.22, 0.7))
        put(p, 'box', 0.06, 0.8, 0.06, WOOD, bevel=0.01, at=(x, 0.4, -0.5))
    rod(p, (-0.38, 0.4, 0.7), (0.38, 0.4, 0.7), 0.025, WOOD, seg=5)
    rod(p, (-0.38, 0.15, -0.5), (0.38, 0.15, -0.5), 0.025, WOOD, seg=5)


@model('requisiten/sandcastle')
def sandcastle(p, root):
    c = 0xe8cf91; d = dk(c, 0.82)
    put(p, 'ball', 1.3, c, sub=1, jitter=0.08, seed=2, scale=(1, 0.12, 1), at=(0, 0.02, 0))
    put(p, 'box', 1.6, 0.6, 1.6, c, bevel=0.04, at=(0, 0.3, 0))
    for x in (-0.3, 0, 0.3):
        for s in (-1, 1):
            put(p, 'box', 0.16, 0.14, 0.16, c, at=(x, 0.67, s * 0.72))
            put(p, 'box', 0.16, 0.14, 0.16, c, at=(s * 0.72, 0.67, x))
    put(p, 'box', 0.9, 0.5, 0.9, c, bevel=0.03, at=(0, 0.85, 0))
    for s in (-1, 1):
        for x in (-0.25, 0.25):
            put(p, 'box', 0.14, 0.12, 0.14, c, at=(x, 1.16, s * 0.38))
            put(p, 'box', 0.14, 0.12, 0.14, c, at=(s * 0.38, 1.16, x))
    for x in (-1, 1):
        for z in (-1, 1):
            vs = new(p, 'lathe', [(0.27, 0), (0.24, 0.85), (0.29, 0.88), (0.29, 0.93)], c, seg=6)
            place(p, wobble(vs, 0.04, x + 2 * z), at=(x * 0.8, 0, z * 0.8))
            put(p, 'cone', 0.3, 0.35, c, seg=6, at=(x * 0.8, 1.1, z * 0.8))
            put(p, 'box', 0.08, 0.12, 0.04, d, at=(x * 0.8 + x * 0.18, 0.62, z * 0.8 + z * 0.18), rot=(0, -math.atan2(z, x) + PI / 2, 0))
    put(p, 'box', 0.3, 0.3, 0.04, d, at=(0, 0.15, 0.805))
    put(p, 'cyl', 0.15, 0.15, 0.04, d, seg=8, at=(0, 0.3, 0.805), rot=AZ)
    rod(p, (0, 1.1, 0), (0, 1.7, 0), 0.02, WHITE, seg=3)
    hull(p, [(0.02, 1.69, -0.01), (0.02, 1.51, -0.01), (0.32, 1.6, 0.0), (0.02, 1.69, 0.01), (0.02, 1.51, 0.01)], 0xe74c3c)
    put(p, 'ball', 0.06, 0xff7f50, uv=(5, 3), scale=(1, 0.4, 1), at=(0.6, 0.03, 1.0))
    put(p, 'ball', 0.05, WHITE, uv=(5, 3), scale=(1, 0.5, 1.3), at=(-0.9, 0.03, 0.8))


@model('requisiten/surfboard')
def surfboard(p, root):
    c = 0xfeca57; m = E((-1.3, 0, 0)); at = (0, 1, 0)
    for col, sc in ((c, (0.55, 0.08, 2.1)), (WHITE, (0.05, 0.085, 2.08))):
        vs = new(p, 'ball', 0.5, col, uv=(10, 6))
        for v in vs:  # Nase spitzer (Spiel-z = -Blender-y)
            z = -v.co.y
            if z > 0: v.co.x *= 1 - 0.55 * (z / 0.5) ** 2
        place(p, vs, at=at, m=m @ SC(*[s * 1 for s in sc]))
    hull(p, [(0, -0.04, -0.75), (0, -0.04, -0.95), (0, -0.2, -0.95), (0.012, -0.04, -0.85), (-0.012, -0.04, -0.85)], c, at=at, m=m)
    put(p, 'ball', 0.35, 0xe8cf91, uv=(6, 4), jitter=0.1, seed=3, scale=(1, 0.3, 1), at=(0, 0, -0.28))


@model('requisiten/starfish')
def starfish(p, root):
    c = 0xff7f50; light = 0xffb38a
    put(p, 'ball', 0.11, c, uv=(5, 3), scale=(1, 0.45, 1), at=(0, 0.03, 0))
    for i in range(5):
        a = i / 5 * 2 * PI
        put(p, 'cone', 0.075, 0.32, c, seg=6, at=(math.cos(a) * 0.17, 0.03, math.sin(a) * 0.17), m=RY(PI / 2 - a) @ RX(PI / 2) @ SC(1, 1, 0.45))
        put(p, 'ball', 0.018, light, uv=(4, 3), at=(math.cos(a) * 0.14, 0.058, math.sin(a) * 0.14))
        put(p, 'ball', 0.014, light, uv=(4, 3), at=(math.cos(a) * 0.23, 0.05, math.sin(a) * 0.23))


@model('requisiten/lifeguardTower')
def lifeguardTower(p, root):
    red = 0xe74c3c
    for x in (-0.9, 0.9):
        for z in (-0.9, 0.9): put(p, 'box', 0.15, 3, 0.15, WHITE, bevel=0.02, at=(x, 1.5, z))
    for s in (-1, 1):
        rod(p, (s * 0.9, 0.3, -0.9), (s * 0.9, 2.7, 0.9), 0.035, WHITE, seg=4); rod(p, (s * 0.9, 2.7, -0.9), (s * 0.9, 0.3, 0.9), 0.035, WHITE, seg=4)
    rod(p, (-0.9, 0.3, -0.9), (0.9, 2.7, -0.9), 0.035, WHITE, seg=4); rod(p, (0.9, 0.3, -0.9), (-0.9, 2.7, -0.9), 0.035, WHITE, seg=4)
    put(p, 'box', 2.2, 0.15, 2.2, LWOOD, bevel=0.02, at=(0, 3, 0))
    for k in range(4): put(p, 'box', 0.02, 0.005, 2.18, dk(LWOOD, 0.8), at=(-0.66 + k * 0.44, 3.078, 0))
    for s in (-1, 1):
        put(p, 'box', 0.75, 1, 0.1, red, bevel=0.02, at=(s * 0.725, 3.6, 1.05))
        put(p, 'box', 0.1, 0.06, 2.1, WHITE, at=(s * 1.05, 3.6, 0)); put(p, 'box', 0.1, 0.06, 2.1, WHITE, at=(s * 1.05, 3.3, 0))
    put(p, 'box', 2.1, 0.06, 0.1, WHITE, at=(0, 3.6, -1.05)); put(p, 'box', 2.1, 0.06, 0.1, WHITE, at=(0, 3.3, -1.05))
    put(p, 'box', 0.32, 0.08, 0.02, WHITE, at=(0.725, 3.65, 1.105)); put(p, 'box', 0.08, 0.32, 0.02, WHITE, at=(0.725, 3.65, 1.105))
    put(p, 'box', 2.4, 0.15, 2.4, red, bevel=0.03, at=(0, 4.9, 0))
    for x in (-1.05, 1.05):
        for z in (-1.05, 1.05): put(p, 'box', 0.1, 1.8, 0.1, WHITE, at=(x, 4, z))
    rod(p, (0.9, 4.95, -0.9), (0.9, 5.7, -0.9), 0.02, WHITE, seg=4)
    hull(p, [(0.9, 5.7, -0.9), (0.9, 5.45, -0.9), (1.3, 5.58, -0.9), (0.9, 5.7, -0.88), (0.9, 5.45, -0.88)], 0xfeca57)
    rx = 0.96; d = Vector((0, -math.sin(rx), math.cos(rx)))
    put(p, 'box', 0.6, 0.1, 3.66, LWOOD, bevel=0.015, at=(0, 1.5, 2.15), rot=(rx, 0, 0))
    for k in range(8):
        c = Vector((0, 1.5, 2.15)) + d * (-1.5 + k * 0.42) + Vector((0, math.cos(rx), math.sin(rx))) * 0.06
        put(p, 'box', 0.6, 0.04, 0.05, WOOD, at=tuple(c), rot=(rx, 0, 0))
    for s in (-1, 1):
        a = Vector((s * 0.33, 0.9, 3.2)); b = Vector((s * 0.33, 3.9, 1.1))
        rod(p, tuple(a), tuple(b), 0.03, WHITE, seg=4); rod(p, (s * 0.33, 0, 3.2), tuple(a), 0.03, WHITE, seg=4)


@model('requisiten/volleyNet')
def volleyNet(p, root):
    for x in (-4, 4):
        rcyl(p, 0.07, 2.6, WHITE, at=(x, 1.3, 0), seg=8, b=0.015)
        put(p, 'cyl', 0.15, 0.15, 0.05, DARK, seg=8, at=(x, 0.025, 0))
        rod(p, (x, 2.55, 0), (x * 1.2, 0.02, 0), 0.012, ROPE, seg=3)
        put(p, 'box', 0.05, 0.15, 0.05, WOOD, at=(x * 1.2, 0.07, 0))
    put(p, 'box', 8, 0.08, 0.05, WHITE, at=(0, 2.5, 0))
    put(p, 'box', 8, 0.04, 0.03, WHITE, at=(0, 1.7, 0))
    x = -3.8
    while x < 3.85: put(p, 'box', 0.02, 0.8, 0.02, 0xecf0f1, at=(x, 2.1, 0)); x += 0.4
    for y in (1.9, 2.1, 2.3): put(p, 'box', 8, 0.02, 0.02, 0xecf0f1, at=(0, y, 0))
    put(p, 'ball', 0.22, 0xfeca57, uv=(8, 6), at=(2, 0.22, 2))
    for m in (RX(PI / 2), RZ(PI / 2)): put(p, 'torus', 0.22, 0.018, WHITE, seg=12, ring=3, at=(2, 0.22, 2), m=m @ RY(0.3))


@model('requisiten/iceCart')
def iceCart(p, root):
    body, pink, yel = 0x81ecec, 0xff9ff3, 0xfeca57
    put(p, 'box', 2, 1, 1, body, bevel=0.05, at=(0, 0.9, 0))
    put(p, 'box', 2.02, 0.12, 1.02, pink, at=(0, 0.75, 0))
    put(p, 'box', 1.6, 0.05, 0.8, WHITE, bevel=0.01, at=(0, 1.42, 0))
    for s in (-1, 1):
        for x in (-0.6, 0.6):
            rcyl(p, 0.35, 0.1, DARK, at=(x, 0.35, s * 0.55), rot=AZ, seg=12, b=0.03)
            put(p, 'cyl', 0.15, 0.15, 0.12, WHITE, seg=8, at=(x, 0.35, s * 0.55), rot=AZ)
        rod(p, (-1.0, 1.15, s * 0.35), (-1.35, 1.35, s * 0.35), 0.03, METAL, seg=5)
    rod(p, (-1.35, 1.35, -0.4), (-1.35, 1.35, 0.4), 0.04, DARK, seg=6)
    for i, cc in enumerate((0xe74c3c, yel, pink)):
        put(p, 'ball', 0.07, cc, uv=(5, 4), at=(-0.6 + i * 0.6, 0.95, 0.51), scale=(1, 1, 0.3))
    put(p, 'cyl', 0.04, 0.04, 1.6, WHITE, seg=5, at=(0.8, 2.2, 0))
    for k in range(8):
        a0, a1 = k * PI / 4, (k + 1) * PI / 4; cc = pink if k % 2 == 0 else WHITE
        rim = [(0.8 + math.cos(a) * 1.1, 2.75, math.sin(a) * 1.1) for a in (a0, a1)]
        hull(p, [(0.8, 3.25, 0)] + rim + [(0.8, 3.21, 0)] + [(0.8 + (x - 0.8) * 0.97, y - 0.04, z * 0.97) for x, y, z in rim], cc)
    put(p, 'ball', 0.06, WHITE, uv=(5, 4), at=(0.8, 3.28, 0))
    for x, cc in ((-0.3, pink), (0.3, yel)):
        put(p, 'cyl', 0.22, 0.2, 0.14, WHITE, seg=8, at=(x, 1.51, 0))
        put(p, 'ball', 0.22, cc, uv=(8, 5), jitter=0.05, seed=int(x * 10), scale=(1, 0.8, 1), at=(x, 1.62, 0))


@model('requisiten/flagPole')
def flagPole(p, root):
    c = 0xe74c3c
    lth(p, [(0.2, 0), (0.2, 0.1), (0.1, 0.15), (0.08, 0.3), (0.06, 5.0)], WHITE, seg=6)
    put(p, 'ball', 0.08, 0xfeca57, uv=(6, 4), at=(0, 5.05, 0))
    rod(p, (0.075, 0.9, 0), (0.075, 4.9, 0), 0.01, DARK, seg=3)
    put(p, 'box', 0.04, 0.12, 0.04, METAL, at=(0.09, 0.9, 0))
    wave = Node('wave', root, (0, 4.5, 0)); q = Part('wave-m', wave)
    sheet(q, [(0.02 + 1.38 * i / 7, 0.07 * math.sin(i * 1.1)) for i in range(8)], 0.4, 0.04, c)
    q.box(0.06, 0.82, 0.06, WHITE, at=(0.03, 0, 0))
    q.done()


# ================================================================ Drinnen
def legs4(p, xs, zs, h, color, r=0.04):
    for x in xs:
        for z in zs: lth(p, [(r * 0.7, 0), (r, h * 0.6), (r * 0.9, h)], color, at=(x, 0, z), seg=6)


@model('requisiten/armchair')
def armchair(p, root):
    c, cu = 0x6c5ce7, 0xa29bfe
    legs4(p, (-0.6, 0.6), (-0.55, 0.55), 0.09, DWOOD)
    put(p, 'box', 1.4, 0.5, 1.3, c, bevel=0.08, at=(0, 0.33, 0))
    put(p, 'box', 1.4, 0.95, 0.32, c, bevel=0.1, at=(0, 0.95, -0.49))
    for s in (-1, 1):
        put(p, 'box', 0.26, 0.34, 1.3, c, bevel=0.06, at=(s * 0.57, 0.74, 0))
        rcyl(p, 0.14, 1.3, c, at=(s * 0.57, 0.9, 0), rot=AZ, seg=8, b=0.04)
    put(p, 'box', 1.0, 0.17, 0.95, cu, bevel=0.06, at=(0, 0.66, 0.1))
    put(p, 'box', 0.95, 0.6, 0.14, cu, bevel=0.05, at=(0, 1.0, -0.28), rot=(-0.1, 0, 0))
    for x in (-0.25, 0, 0.25): put(p, 'ball', 0.025, dk(cu, 0.75), uv=(4, 3), at=(x, 1.02, -0.205))


@model('requisiten/sofa')
def sofa(p, root):
    c, w = 0x2980b9, 3.4
    legs4(p, (-w / 2 + 0.15, w / 2 - 0.15), (-0.55, 0.55), 0.09, DWOOD)
    put(p, 'box', w, 0.5, 1.3, c, bevel=0.08, at=(0, 0.33, 0))
    put(p, 'box', w, 0.95, 0.32, c, bevel=0.1, at=(0, 0.95, -0.49))
    for s in (-1, 1):
        put(p, 'box', 0.3, 0.32, 1.3, c, bevel=0.06, at=(s * (w / 2 - 0.15), 0.74, 0))
        rcyl(p, 0.16, 1.3, c, at=(s * (w / 2 - 0.15), 0.9, 0), rot=AZ, seg=8, b=0.04)
        put(p, 'box', (w - 0.6) / 2 - 0.03, 0.17, 0.95, c, bevel=0.06, at=(s * (w - 0.6) / 4, 0.66, 0.1))
        put(p, 'box', (w - 0.6) / 2 - 0.05, 0.55, 0.14, c, bevel=0.05, at=(s * (w - 0.6) / 4, 1.02, -0.28), rot=(-0.1, 0, 0))
    for x, cc in ((-w / 4, 0xfeca57), (w / 4, 0xff7675)):
        put(p, 'ball', 0.3, cc, uv=(6, 4), scale=(1, 0.85, 0.3), at=(x, 0.95, -0.12), rot=(-0.25, 0.1 * x, 0.1))


def table_into(p, w, d, h, c):
    put(p, 'box', w, 0.12, d, c, bevel=0.03, at=(0, h, 0))
    for k in range(3): put(p, 'box', w - 0.1, 0.006, 0.02, dk(c, 0.8), at=(0, h + 0.061, -d / 2 + (k + 1) * d / 4))
    for s in (-1, 1):
        put(p, 'box', w - 0.3, 0.14, 0.05, WOOD, at=(0, h - 0.13, s * (d / 2 - 0.15)))
        put(p, 'box', 0.05, 0.14, d - 0.3, WOOD, at=(s * (w / 2 - 0.15), h - 0.13, 0))
    for x in (-1, 1):
        for z in (-1, 1):
            lth(p, [(0.05, 0), (0.06, 0.05), (0.045, 0.15), (0.065, h - 0.25), (0.055, h - 0.06)], WOOD, at=(x * (w / 2 - 0.15), 0, z * (d / 2 - 0.15)), seg=6)


@model('requisiten/table')
def table(p, root):
    table_into(p, 2.4, 1.4, 1, LWOOD)


def chair_into(p, c, at=(0, 0, 0), ry=0, simple=False):
    L = lambda x, y, z: loc(at, ry, x, y, z); m = RY(ry)
    put(p, 'box', 0.6, 0.08, 0.6, c, bevel=0 if simple else 0.015, at=L(0, 0.55, 0), m=m)
    for x in (-0.25, 0.25):
        put(p, 'box', 0.06, 0.55, 0.06, c, at=L(x, 0.27, 0.25), m=m)
        put(p, 'box', 0.06, 1.3, 0.06, c, at=L(x * 1.08, 0.65, -0.27), m=m)
    put(p, 'box', 0.6, 0.12, 0.06, c, bevel=0 if simple else 0.015, at=L(0, 1.22, -0.27), m=m)
    put(p, 'box', 0.5, 0.06, 0.04, c, at=L(0, 0.95, -0.27), m=m)
    for x in ((-0.08, 0.08) if simple else (-0.12, 0, 0.12)): put(p, 'box', 0.06, 0.25, 0.03, c, at=L(x, 1.04, -0.27), m=m)
    if not simple:
        for s in (-1, 1): put(p, 'box', 0.04, 0.04, 0.5, c, at=L(s * 0.25, 0.15, 0), m=m)


@model('requisiten/chair')
def chair(p, root):
    chair_into(p, WOOD)


@model('requisiten/diningSet')
def diningSet(p, root):
    table_into(p, 3, 1.6, 1.1, LWOOD)
    for x, z, r in ((-0.8, 1.2, PI), (0.8, 1.2, PI), (-0.8, -1.2, 0), (0.8, -1.2, 0)):
        chair_into(p, WOOD, (x, 0, z), r, simple=True)
        put(p, 'cyl', 0.18, 0.18, 0.02, 0xffffff, seg=10, at=(x, 1.17, z * 0.45))
    lth(p, [(0.1, 1.16), (0.17, 1.25), (0.14, 1.42), (0.09, 1.5), (0.11, 1.53)], 0xffffff, seg=8)
    for i, (dx, dz, hh) in enumerate(((0.06, 0, 1.68), (-0.06, 0.05, 1.62), (0, -0.07, 1.6))):
        rod(p, (0, 1.45, 0), (dx, hh, dz), 0.012, 0x3d9a3d, seg=3)
        put(p, 'ball', 0.08, 0xe74c3c, uv=(5, 4), scale=(1, 0.8, 1), at=(dx, hh + 0.03, dz))
    put(p, 'ball', 0.5, 0x3d9a3d, uv=(4, 3), scale=(0.1, 0.02, 0.2), at=(0.08, 1.52, -0.05), rot=(0.4, 0.5, 0))


@model('requisiten/floorLamp')
def floorLamp(p, root):
    lth(p, [(0.3, 0), (0.3, 0.03), (0.22, 0.06), (0.06, 0.09)], DARK, seg=10)
    put(p, 'cyl', 0.03, 0.03, 2.0, DARK, seg=5, at=(0, 1.08, 0))
    put(p, 'box', 0.05, 0.08, 0.04, DARK, at=(0.04, 1.0, 0))
    put(p, 'cyl', 0.05, 0.05, 0.06, DARK, seg=6, at=(0, 2.06, 0))
    lth(p, [(0.46, 2.05), (0.45, 2.07), (0.32, 2.53), (0.3, 2.55)], 0xfff3e0, seg=10)
    put(p, 'cyl', 0.466, 0.466, 0.025, dk(0xfff3e0, 0.75), seg=10, at=(0, 2.06, 0))
    put(p, 'cyl', 0.305, 0.305, 0.02, dk(0xfff3e0, 0.75), seg=10, at=(0, 2.545, 0))


@model('requisiten/rug')
def rug(p, root):
    w, d, c, y2 = 3, 2, 0xe17055, 0xfeca57
    put(p, 'box', w, 0.04, d, c, bevel=0.015, at=(0, 0.02, 0))
    put(p, 'box', w * 0.75, 0.045, d * 0.65, y2, at=(0, 0.022, 0))
    put(p, 'box', w * 0.5, 0.05, d * 0.35, c, at=(0, 0.025, 0))
    hull(p, [(x, y, z) for (x, z) in ((-0.35, 0), (0.35, 0), (0, -0.2), (0, 0.2)) for y in (0.0, 0.054)], y2)
    for s in (-1, 1):
        for i in range(8): put(p, 'box', 0.1, 0.012, 0.03, y2, at=(s * (w / 2 + 0.04), 0.008, -d / 2 + 0.15 + i * (d - 0.3) / 7))


@model('requisiten/shelf')
def shelf(p, root):
    w, h, c = 2, 2.4, WOOD; cols = [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12]
    for s in (-1, 1): put(p, 'box', 0.06, h, 0.5, c, bevel=0.01, at=(s * (w / 2 - 0.03), h / 2, 0))
    put(p, 'box', w, 0.06, 0.5, c, bevel=0.01, at=(0, h - 0.03, 0))
    put(p, 'box', w, 0.12, 0.5, c, at=(0, 0.06, 0))
    put(p, 'box', w - 0.1, h - 0.1, 0.03, dk(c, 0.7), at=(0, h / 2, -0.235))
    y = 0.5; row = 0
    while y < h - 0.2:
        put(p, 'box', w - 0.12, 0.05, 0.48, c, at=(0, y - 0.175, 0))
        x = -w / 2 + 0.25; i = 0
        while x < w / 2 - 0.2:
            col = cols[math.floor(x * 7 + y * 3 + 0.5) & 3]
            for k, dx in enumerate((-0.055, 0.055)):
                bh = 0.5 * (0.78 + 0.22 * ((i * 3 + k + row * 2) % 4) / 3)
                tilt = 0.12 if (i == 4 and k == 1) else 0
                put(p, 'box', 0.1, bh, 0.35, col if k == 0 else dk(col, 0.82), at=(x + dx + tilt * 0.3, y - 0.15 + bh / 2, 0.05), rot=(0, 0, -tilt))
                put(p, 'box', 0.102, 0.03, 0.352, dk(col, 0.6) if k == 0 else WHITE, at=(x + dx + tilt * 0.3, y - 0.15 + bh * 0.75, 0.05), rot=(0, 0, -tilt))
            x += 0.3; i += 1
        y += 0.7; row += 1


@model('requisiten/tvStand')
def tvStand(p, root):
    for x in (-1.1, 1.1):
        for z in (-0.25, 0.25): put(p, 'box', 0.06, 0.08, 0.06, DARK, at=(x, 0.04, z))
    put(p, 'box', 2.4, 0.5, 0.6, DWOOD, bevel=0.03, at=(0, 0.33, 0))
    for x in (-0.6, 0.6):
        put(p, 'box', 1.1, 0.38, 0.02, dk(DWOOD, 1.25), at=(x, 0.33, 0.305))
        put(p, 'box', 0.2, 0.03, 0.03, METAL, at=(x - 0.3 * (1 if x > 0 else -1), 0.4, 0.32))
    put(p, 'box', 0.6, 0.03, 0.3, DARK, at=(0, 0.595, -0.1))
    put(p, 'box', 0.1, 0.12, 0.06, DARK, at=(0, 0.66, -0.12))
    put(p, 'box', 1.8, 1.1, 0.1, DARK, bevel=0.02, at=(0, 1.25, -0.1))
    put(p, 'box', 1.68, 0.98, 0.02, 0x34495e, at=(0, 1.25, -0.045))
    put(p, 'box', 0.15, 0.9, 0.005, 0x4a6683, at=(-0.4, 1.28, -0.034), rot=(0, 0, 0.5))
    put(p, 'box', 0.4, 0.08, 0.3, DARK, bevel=0.01, at=(0.75, 0.62, 0.05))
    put(p, 'box', 0.06, 0.02, 0.01, 0x2ed573, at=(0.85, 0.62, 0.205))


@model('requisiten/plantBox')
def plantBox(p, root):
    w, c = 2, 0xd35400
    put(p, 'box', w, 0.45, 0.6, c, bevel=0.03, at=(0, 0.275, 0))
    put(p, 'box', w + 0.08, 0.06, 0.68, dk(c, 0.82), at=(0, 0.5, 0))
    put(p, 'box', w - 0.04, 0.05, 0.56, dk(c, 0.82), at=(0, 0.025, 0))
    put(p, 'box', w - 0.08, 0.03, 0.52, SOIL, at=(0, 0.52, 0))
    x = -w / 2 + 0.3; i = 0
    while x < w / 2:
        put(p, 'ball', 0.28, LEAF, uv=(6, 4), jitter=0.15, seed=i, at=(x, 0.65, 0))
        for k, cc in enumerate((0xff6b9d, 0xffd93d)): put(p, 'ball', 0.05, cc, uv=(4, 3), at=(x + 0.12 - 0.24 * k, 0.8 - 0.05 * k, 0.15 - 0.1 * k))
        x += 0.5; i += 1


@model('requisiten/toys')
def toys(p, root):
    vs = new(p, 'ball', 0.3, 0xe74c3c, uv=(10, 6))
    wi = p._slot(WHITE)
    for f in {f for v in vs for f in v.link_faces}:
        if abs(f.calc_center_median().z) < 0.1: f.material_index = wi
    place(p, vs, at=(0, 0.3, 0))
    for (s, y, cc, inner, ry) in ((0.5, 0.25, 0x48dbfb, 0xfeca57, 0), (0.4, 0.7, 0xfeca57, 0xe74c3c, 0.3)):
        put(p, 'box', s, s, s, cc, bevel=0.04, at=(0.8, y, 0.3), rot=(0, ry, 0))
        for ang in (0, PI / 2):
            put(p, 'box', s * 0.6, s * 0.6, 0.02, inner, at=loc((0.8, y, 0.3), ry + ang, 0, 0, s / 2 + 0.005), m=RY(ry + ang))
    a, b = Vector((-0.9, 0.12, 0.3)), Vector((-0.3, 0.12, 0.7)); d = (b - a).normalized(); n = Vector((-d.z, 0, d.x))
    rod(p, tuple(a + d * 0.05), tuple(b - d * 0.05), 0.06, WHITE, seg=6)
    for e in (a, b):
        for s in (-1, 1): put(p, 'ball', 0.09, WHITE, uv=(6, 4), at=tuple(e + n * s * 0.07))


@model('requisiten/coatRack')
def coatRack(p, root):
    for k in range(3):
        a = k * 2 * PI / 3
        rod(p, (0, 0.25, 0), (math.cos(a) * 0.32, 0.03, math.sin(a) * 0.32), 0.035, DWOOD, seg=5)
        put(p, 'ball', 0.04, DWOOD, uv=(5, 3), at=(math.cos(a) * 0.32, 0.03, math.sin(a) * 0.32))
    lth(p, [(0.05, 0.2), (0.045, 1.9), (0.06, 1.94), (0.05, 2.0)], DWOOD, seg=6)
    for k in range(4):
        a = k * PI / 2 + PI / 4
        rod(p, (0, 1.88, 0), (math.cos(a) * 0.18, 1.97, math.sin(a) * 0.18), 0.02, DWOOD, seg=4)
        put(p, 'ball', 0.03, DWOOD, uv=(4, 3), at=(math.cos(a) * 0.18, 1.97, math.sin(a) * 0.18))
    for (cx, cy, cz, col, ry, sc) in ((0.15, 1.4, 0.15, 0xc0392b, 0.6, 1.0), (-0.15, 1.45, -0.15, 0x2c3e50, -0.9, 0.9)):
        hw, hh = 0.3 * sc, 0.45 * sc
        hull(p, [(sx * hw * 0.8, hh, sz * 0.12) for sx in (-1, 1) for sz in (-1, 1)] + [(sx * hw * 1.05, -hh, sz * 0.16) for sx in (-1, 1) for sz in (-1, 1)], col, at=(cx, cy, cz), m=RY(ry))
        put(p, 'box', hw * 1.2, 0.08, 0.3, dk(col, 0.8), at=(cx, cy + hh - 0.02, cz), rot=(0, ry, 0))
        for k in range(3): put(p, 'ball', 0.025, DARK, uv=(4, 3), at=loc((cx, cy, cz), ry, 0, hh * 0.5 - k * 0.25, 0.14 + 0.01 * k))
    put(p, 'cyl', 0.25, 0.25, 0.03, 0x27ae60, seg=10, at=(0, 2.06, 0))
    put(p, 'cyl', 0.14, 0.16, 0.18, 0x27ae60, seg=10, at=(0, 2.16, 0))
    put(p, 'cyl', 0.162, 0.162, 0.04, DARK, seg=10, at=(0, 2.1, 0))


@model('requisiten/shoeRack')
def shoeRack(p, root):
    for s in (-1, 1): put(p, 'box', 0.05, 0.6, 0.45, LWOOD, bevel=0.01, at=(s * 0.775, 0.3, 0))
    put(p, 'box', 1.6, 0.05, 0.45, LWOOD, bevel=0.01, at=(0, 0.575, 0))
    for y in (0.3, 0.05): put(p, 'box', 1.5, 0.04, 0.43, LWOOD, at=(0, y, 0))
    put(p, 'box', 1.5, 0.55, 0.02, dk(LWOOD, 0.8), at=(0, 0.3, -0.215))
    def shoe(x, y, z, c, ry=0):
        sole = WHITE if c == DARK else DARK
        hull(p, [(sx * 0.09, 0.03, zz) for sx in (-1, 1) for zz in (-0.19, 0.19)] + [(sx * 0.085, 0.15, zz) for sx in (-1, 1) for zz in (-0.19, -0.02)] + [(sx * 0.07, 0.09, 0.19) for sx in (-1, 1)], c, at=(x, y, z), m=RY(ry))
        put(p, 'box', 0.2, 0.03, 0.41, sole, at=(x, y + 0.015, z), rot=(0, ry, 0))
    for x, c in ((-0.5, 0xe74c3c), (0, DARK), (0.5, 0x2980b9)):
        shoe(x - 0.1, 0.6, 0, c); shoe(x + 0.12, 0.6, 0.02, c, 0.1)
    for x, c in ((-0.45, DARK), (0.35, 0xe74c3c)):
        shoe(x - 0.11, 0.32, 0.02, c); shoe(x + 0.11, 0.32, 0.02, c)


@model('requisiten/boxes')
def boxes(p, root):
    for i in range(3):
        w = 0.9 - i * 0.12; at = ((i % 2) * 0.1, 0.3 + i * 0.6, 0); ry = (i - 1) * 0.06
        put(p, 'box', w, 0.6, 0.7, 0xc0905a, bevel=0.015, at=at, rot=(0, ry, 0))
        put(p, 'box', w * 0.98, 0.005, 0.012, dk(0xc0905a, 0.7), at=loc(at, ry, 0, 0.301, 0), rot=(0, ry, 0))
        put(p, 'box', w + 0.02, 0.012, 0.16, 0xe1b12c, at=loc(at, ry, 0, 0.302, 0), rot=(0, ry, 0))
        for s in (-1, 1): put(p, 'box', 0.012, 0.2, 0.16, 0xe1b12c, at=loc(at, ry, s * (w / 2 + 0.004), 0.2, 0), rot=(0, ry, 0))
        put(p, 'box', 0.25, 0.15, 0.01, WHITE, at=loc(at, ry, -w * 0.2, 0.05, 0.355), rot=(0, ry, 0))
        put(p, 'box', 0.15, 0.02, 0.012, DARK, at=loc(at, ry, -w * 0.2, 0.08, 0.358), rot=(0, ry, 0))


@model('requisiten/sack')
def sack(p, root):
    c = 0xd7ccc8
    put(p, 'ball', 0.45, c, uv=(10, 7), jitter=0.04, seed=3, scale=(1, 1.2, 0.8), at=(0, 0.45, 0), post=flat_bottom)
    lth(p, [(0.24, 0.9), (0.13, 1.02), (0.15, 1.1), (0.22, 1.18), (0.12, 1.2)], c, seg=8)
    put(p, 'torus', 0.14, 0.025, DWOOD, seg=8, ring=3, at=(0, 1.03, 0))
    put(p, 'box', 0.2, 0.2, 0.02, dk(c, 0.82), at=(-0.15, 0.4, 0.36), rot=(0.25, 0.3, 0.12))
    put(p, 'box', 0.25, 0.04, 0.02, dk(c, 0.6), at=(0.08, 0.62, 0.36), rot=(0.1, 0, 0))


@model('requisiten/jarShelf')
def jarShelf(p, root):
    for y in (1.2, 0.5): put(p, 'box', 2.4, 0.08, 0.6, LWOOD, bevel=0.01, at=(0, y, 0))
    for x in (-1.2, 1.2): put(p, 'box', 0.08, 1.4, 0.6, WOOD, bevel=0.01, at=(x, 0.7, 0))
    def jar(x, y, c):
        lth(p, [(0.12, 0), (0.15, 0.03), (0.15, 0.27), (0.11, 0.31), (0.11, 0.33)], c, at=(x, y, 0), seg=7)
        put(p, 'cyl', 0.125, 0.125, 0.05, METAL, seg=7, at=(x, y + 0.34, 0))
        put(p, 'cyl', 0.153, 0.153, 0.1, WHITE, seg=7, at=(x, y + 0.15, 0))
    for i, c in enumerate((0xe74c3c, 0xf1c40f, 0x27ae60, 0xe67e22)):
        jar(-0.9 + i * 0.6, 0.545, c); jar(-0.6 + i * 0.5, 1.245, c)


@model('requisiten/waterCooler')
def waterCooler(p, root):
    put(p, 'box', 0.6, 1.1, 0.6, WHITE, bevel=0.04, at=(0, 0.55, 0))
    put(p, 'box', 0.4, 0.28, 0.02, DARK, at=(0, 0.85, 0.3))
    for x, c in ((-0.08, 0xe74c3c), (0.08, 0x0984e3)): put(p, 'cyl', 0.025, 0.025, 0.07, c, seg=6, at=(x, 0.9, 0.33), rot=AZ)
    put(p, 'box', 0.3, 0.03, 0.12, METAL, at=(0, 0.72, 0.33))
    put(p, 'cyl', 0.18, 0.2, 0.04, WHITE, seg=10, at=(0, 1.12, 0))
    lth(p, [(0.06, 1.1), (0.07, 1.15), (0.24, 1.24), (0.28, 1.32), (0.28, 1.72), (0.25, 1.8), (0.15, 1.82)], 0x74b9ff, seg=10)
    for y in (1.42, 1.6): put(p, 'cyl', 0.287, 0.287, 0.03, GLASS, seg=10, at=(0, y, 0))
    put(p, 'cyl', 0.05, 0.05, 0.25, WHITE, seg=6, at=(0.34, 0.75, 0))


@model('requisiten/officeChair')
def officeChair(p, root):
    c = DARK
    put(p, 'cyl', 0.07, 0.07, 0.08, METAL, seg=6, at=(0, 0.1, 0))
    for k in range(5):
        a = k * 2 * PI / 5
        beam(p, (0, 0.1, 0), (math.cos(a) * 0.33, 0.08, math.sin(a) * 0.33), 0.05, 0.04, METAL)
        put(p, 'ball', 0.045, c, uv=(5, 3), at=(math.cos(a) * 0.35, 0.045, math.sin(a) * 0.35))
    put(p, 'cyl', 0.04, 0.04, 0.35, METAL, seg=6, at=(0, 0.27, 0))
    put(p, 'cyl', 0.055, 0.055, 0.12, c, seg=6, at=(0, 0.38, 0))
    put(p, 'box', 0.6, 0.12, 0.6, c, bevel=0.05, at=(0, 0.5, 0))
    put(p, 'box', 0.06, 0.32, 0.04, METAL, at=(0, 0.6, -0.33))
    put(p, 'box', 0.55, 0.65, 0.1, c, bevel=0.05, at=(0, 0.95, -0.3), rot=(-0.08, 0, 0))
    for s in (-1, 1):
        put(p, 'box', 0.04, 0.2, 0.04, METAL, at=(s * 0.32, 0.62, 0))
        put(p, 'box', 0.08, 0.04, 0.3, c, bevel=0.015, at=(s * 0.32, 0.73, 0))


@model('requisiten/cabinet')
def cabinet(p, root):
    c, h = 0x95a5a6, 1.4
    put(p, 'box', 0.8, h, 0.7, c, bevel=0.02, at=(0, h / 2, 0))
    put(p, 'box', 0.78, 0.06, 0.66, DARK, at=(0, 0.03, 0))
    dh = (h - 0.1) / 3
    for k in range(3):
        y = 0.07 + dh * (k + 0.5)
        put(p, 'box', 0.72, dh - 0.04, 0.03, dk(c, 1.08), at=(0, y, 0.36))
        put(p, 'box', 0.3, 0.06, 0.04, DARK, bevel=0.01, at=(0, y + dh * 0.15, 0.39))
        put(p, 'box', 0.14, 0.06, 0.01, WHITE, at=(0, y + dh * 0.32, 0.38))


@model('requisiten/acUnit')
def acUnit(p, root):
    c = 0xb2bec3
    put(p, 'box', 2, 1.2, 1.4, c, bevel=0.04, at=(0, 0.6, 0))
    put(p, 'cyl', 0.5, 0.5, 0.05, DARK, seg=12, at=(0, 1.22, 0))
    for k in range(3): put(p, 'box', 0.4, 0.02, 0.12, METAL, at=(math.cos(k * 2.1) * 0.2, 1.235, math.sin(k * 2.1) * 0.2), rot=(0.3, -k * 2.1, 0))
    for R in (0.5, 0.3): put(p, 'torus', R, 0.02, METAL, seg=12, ring=3, at=(0, 1.26, 0))
    for ry in (0, PI / 2): put(p, 'box', 1.0, 0.03, 0.03, METAL, at=(0, 1.26, 0), rot=(0, ry, 0))
    put(p, 'box', 2.04, 0.1, 0.1, METAL, at=(0, 0.9, 0.7))
    for k in range(6): put(p, 'box', 1.8, 0.04, 0.03, dk(c, 0.75), at=(0, 0.2 + k * 0.11, 0.71))
    for k in range(4): put(p, 'box', 0.03, 0.04, 1.1, dk(c, 0.75), at=(1.01, 0.3 + k * 0.15, 0))
    for z in (-0.4, -0.2):
        tube(p, [(-1.0, 0.4, z), (-1.15, 0.4, z), (-1.15, 0.02, z)], 0.035, 0xb87333, ring=4)


@model('requisiten/solarPanel')
def solarPanel(p, root):
    rx = 0.4; m = E((rx, 0, 0)); at = Vector((0, 0.65, 0))
    def P(x, y, z): return tuple(at + (m @ Vector((x, y, z, 0))).to_3d())
    put(p, 'box', 3, 0.08, 1.8, 0x1e3799, at=tuple(at), rot=(rx, 0, 0))
    put(p, 'box', 3.08, 0.06, 1.88, METAL, at=P(0, -0.02, 0), rot=(rx, 0, 0))
    for z in (-0.6, 0, 0.6): put(p, 'box', 2.96, 0.006, 0.025, 0x4a69bd, at=P(0, 0.041, z), rot=(rx, 0, 0))
    for x in (-1.0, -0.5, 0, 0.5, 1.0): put(p, 'box', 0.025, 0.006, 1.76, 0x4a69bd, at=P(x, 0.042, 0), rot=(rx, 0, 0))
    for x in (-1.1, 1.1):
        put(p, 'box', 0.1, 0.42, 0.1, METAL, at=(x, 0.21, 0.5))
        put(p, 'box', 0.1, 0.84, 0.1, METAL, at=(x, 0.42, -0.5))
        put(p, 'box', 0.25, 0.04, 1.3, METAL, at=(x, 0.02, 0))
    rod(p, (-1.1, 0.6, -0.5), (1.1, 0.6, -0.5), 0.03, METAL, seg=4)


# ================================================================ Kanal
@model('requisiten/pipeStack')
def pipeStack(p, root):
    c = 0x8395a7
    for x, y, z in ((0, 0.4, 0), (0.85, 0.4, 0), (0.42, 1.1, 0)):
        rcyl(p, 0.4, 3, c, at=(x, y, z), rot=AZ, seg=10, b=0.03)
        put(p, 'cyl', 0.32, 0.32, 3.02, DARK, seg=10, at=(x, y, z), rot=AZ)
        for s in (-1, 1): put(p, 'cyl', 0.42, 0.42, 0.1, dk(c, 0.85), seg=10, at=(x, y, z + s * 1.42), rot=AZ)
    for x, s in ((-0.42, 1), (1.27, -1)):
        for z in (-1.1, 1.1): hull(p, [(x - s * 0.08, 0, z - 0.1), (x - s * 0.08, 0, z + 0.1), (x + s * 0.14, 0, z - 0.1), (x + s * 0.14, 0, z + 0.1), (x + s * 0.14, 0.18, z - 0.1), (x + s * 0.14, 0.18, z + 0.1)], WOOD)


@model('requisiten/toxicBarrel')
def toxicBarrel(p, root):
    g = 0xc4e538
    barrel_into(p, 0x27ae60)
    put(p, 'ball', 0.3, g, uv=(8, 4), jitter=0.1, seed=2, scale=(1, 0.12, 1), at=(0, 1.11, 0))
    for a in (0.6, 2.2): put(p, 'ball', 0.06, g, uv=(4, 3), scale=(1, 2.5, 0.6), at=(math.cos(a) * 0.415, 0.98, math.sin(a) * 0.415), rot=(0, -a, 0))
    hull(p, [(x, y, z) for x, y in ((-0.16, 0.42), (0.16, 0.42), (0, 0.7)) for z in (0.465, 0.49)], g)
    put(p, 'ball', 0.035, DARK, uv=(4, 3), at=(0, 0.51, 0.49))


@model('requisiten/junk')
def junk(p, root):
    def dent(vs):
        for v in vs:
            if v.co.z > 0.4 and v.co.x > 0: v.co.z -= 0.06
    put(p, 'box', 0.8, 0.5, 0.6, 0x57606f, bevel=0.03, at=(0, 0.25, 0), post=dent)
    put(p, 'box', 0.82, 0.06, 0.62, 0xb87333, at=(0, 0.33, 0))
    put(p, 'torus', 0.3, 0.14, DARK, seg=10, ring=5, at=(0.9, 0.45, 0.2), rot=(PI / 2, 0, 0.3))
    put(p, 'cyl', 0.16, 0.16, 0.2, METAL, seg=8, at=(0.9, 0.45, 0.2), rot=(PI / 2, 0, 0.3))
    put(p, 'box', 0.6, 0.06, 0.6, 0xb87333, bevel=0.01, at=(-0.62, 0.48, 0.25), rot=(0, 0.5, 0.45))
    put(p, 'box', 0.6, 0.06, 0.6, 0xb87333, bevel=0.01, at=(-0.12, 0.62, -0.05), rot=(0, 0.5, 0.1))
    put(p, 'ball', 0.35, 0x2d3436, sub=2, jitter=0.12, seed=3, at=(-0.7, 0.3, -0.4))
    put(p, 'cone', 0.07, 0.14, 0x2d3436, seg=4, at=(-0.7, 0.68, -0.4))
    rod(p, (0.3, 0.06, -0.55), (1.2, 0.06, -0.35), 0.06, METAL, seg=6)
    put(p, 'cyl', 0.07, 0.07, 0.18, 0xe74c3c, seg=8, at=(0.4, 0.07, 0.55), rot=(0, 0.4, PI / 2))


@model('requisiten/trashBags')
def trashBags(p, root):
    for i, (r, c, x, y, z) in enumerate(((0.45, 0x2d3436, 0, 0.4, 0), (0.4, 0x353b48, 0.65, 0.35, 0.2), (0.35, 0x2d3436, 0.3, 0.75, -0.1))):
        put(p, 'ball', r, c, sub=2, jitter=0.08, seed=i, scale=(1, 0.95, 1), at=(x, y, z), post=flat_bottom if i < 2 else None)
        put(p, 'cone', r * 0.22, r * 0.4, c, seg=5, at=(x, y + r * 1.0, z))
        for s in (-1, 1): put(p, 'cone', r * 0.08, r * 0.35, c, seg=4, at=(x + s * r * 0.12, y + r * 1.22, z), rot=(0, 0, -s * 0.8))


@model('requisiten/glowShrooms')
def glowShrooms(p, root):
    mushrooms_into(p, 5, 0x7bed9f)


@model('requisiten/rubberDuck')
def rubberDuck(p, root):
    y, o = 0xfeca57, 0xff7f27
    put(p, 'ball', 0.3, y, uv=(10, 6), scale=(1.15, 0.85, 1), at=(0, 0.25, 0))
    put(p, 'cone', 0.12, 0.22, y, seg=6, at=(-0.33, 0.38, 0), rot=(0, 0, 1.0))
    for s in (-1, 1): put(p, 'ball', 0.14, 0xf6c445, uv=(6, 4), scale=(1.3, 0.6, 0.4), at=(-0.04, 0.3, s * 0.27), rot=(0, 0, 0.2))
    put(p, 'ball', 0.18, y, uv=(8, 6), at=(0.18, 0.55, 0))
    put(p, 'cone', 0.04, 0.08, y, seg=4, at=(0.15, 0.75, 0), rot=(0, 0, 0.4))
    put(p, 'ball', 0.08, o, uv=(6, 3), scale=(1.3, 0.35, 1), at=(0.37, 0.53, 0))
    put(p, 'ball', 0.07, o, uv=(6, 3), scale=(1.2, 0.3, 0.9), at=(0.35, 0.5, 0))
    for s in (-1, 1): put(p, 'ball', 0.03, DARK, uv=(4, 3), at=(0.3, 0.6, s * 0.11))


@model('requisiten/tire')
def tire(p, root):
    vs = new(p, 'torus', 0.4, 0.17, DARK, seg=16, ring=6)
    idx = ring_index(vs, 16)
    for v in vs:
        rr = math.hypot(v.co.x, v.co.y)
        if rr > 0.4 + 0.17 * 0.9 and idx(v) % 2 == 0: v.co.x *= 1.05; v.co.y *= 1.05
    place(p, vs, at=(0, 0.17, 0))
    put(p, 'cyl', 0.27, 0.27, 0.2, dk(DARK, 1.4), seg=12, at=(0, 0.17, 0))


@model('requisiten/cart2')
def cart2(p, root):
    hull(p, [(sx * 0.6, 1.1, sz * 0.4) for sx in (-1, 1) for sz in (-1, 1)] + [(sx * 0.52, 0.42, sz * 0.34) for sx in (-1, 1) for sz in (-1, 1)], METAL)
    tube(p, [(-0.6, 1.11, -0.4), (0.6, 1.11, -0.4), (0.6, 1.11, 0.4), (-0.6, 1.11, 0.4)], 0.03, dk(METAL, 0.75), ring=4, closed=True)
    put(p, 'box', 1.12, 0.005, 0.72, dk(METAL, 0.6), at=(0, 1.103, 0))
    for s in (-1, 1): rod(p, (-0.58, 1.0, s * 0.35), (-0.72, 1.32, s * 0.35), 0.025, METAL, seg=5)
    rod(p, (-0.72, 1.32, -0.42), (-0.72, 1.32, 0.42), 0.035, DARK, seg=6)
    for x in (-0.45, 0.45):
        for z in (-0.35, 0.35):
            put(p, 'box', 0.05, 0.3, 0.05, METAL, at=(x, 0.27, z))
            put(p, 'box', 0.04, 0.08, 0.08, METAL, at=(x, 0.1, z))
            put(p, 'cyl', 0.07, 0.07, 0.05, DARK, seg=8, at=(x, 0.07, z), rot=AZ)
    put(p, 'box', 0.95, 0.03, 0.75, METAL, at=(0, 0.2, 0))


def fix_names():
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and not o.name.endswith('-m'):
            base = o.name.replace('.', '_'); n = base + '-m'; i = 1
            while bpy.data.objects.get(n): n = f'{base}{i}-m'; i += 1
            o.name = n


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    want = [a if '/' in a else 'requisiten/' + a for a in args] or list(MODELS)
    for rel in want:
        reset(); name = os.path.basename(rel); root = Node(name)
        p = Part(name + '-m', root); MODELS[rel](p, root); p.done()
        fix_names(); export(root, rel)
