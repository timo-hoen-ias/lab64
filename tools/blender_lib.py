# Gemeinsame Bausteine für die Blender-Skripte (tools/make_*.py): Low-Poly-Grundkörper mit einfarbigen Materialien.
# Im Spiel werden Materialfarben zu Vertexfarben (src/assets.js), also keine Texturen, nur Farben.
# Koordinaten in Spiel-Sicht: x = rechts, y = oben, z = vorne (glTF). Intern Blender: (x, -z, y).
import bpy, bmesh, math, os, random
from mathutils import Matrix, Vector, Euler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
_mats = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def mat(hexcol):
    if hexcol in _mats: return _mats[hexcol]
    m = bpy.data.materials.new('c%06x' % hexcol)
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    col = tuple(lin(((hexcol >> s) & 255) / 255) for s in (16, 8, 0)) + (1,)
    m.diffuse_color = col; m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = col; b.inputs['Roughness'].default_value = 1
    _mats[hexcol] = m
    return m


def to_bl(x, y, z):
    return Vector((x, -z, y))


class Part:
    """Ein Mesh-Objekt, das aus mehreren Grundkörpern (mit je einer Farbe) zusammengesetzt wird."""
    def __init__(self, name, parent=None, at=(0, 0, 0)):
        self.bm = bmesh.new(); self.colors = []; self.name = name
        me = bpy.data.meshes.new(name); self.ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(self.ob)
        if parent is not None: self.ob.parent = parent.ob if isinstance(parent, (Part, Node)) else parent
        self.ob.location = to_bl(*at)

    def _add(self, geom_verts, color, at, rot, scale):
        idx = self._slot(color)
        m = Matrix.Translation(to_bl(*at)) @ Euler((rot[0], -rot[2], rot[1]), 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((scale[0], scale[2], scale[1], 1))
        bmesh.ops.transform(self.bm, matrix=m, verts=geom_verts)
        for f in {f for v in geom_verts for f in v.link_faces}: f.material_index = idx
        return geom_verts

    def _slot(self, color):
        if color not in self.colors: self.colors.append(color)
        return self.colors.index(color)

    def box(self, w, h, d, color, at=(0, 0, 0), rot=(0, 0, 0), bevel=0):
        r = bmesh.ops.create_cube(self.bm, size=1)['verts']
        self._add(r, color, at, rot, (w, h, d))
        if bevel:
            edges = list({e for v in r for e in v.link_edges})
            bmesh.ops.bevel(self.bm, geom=edges, offset=bevel, segments=1, affect='EDGES', profile=0.5)
        return r

    def cyl(self, rt, rb, h, color, at=(0, 0, 0), rot=(0, 0, 0), seg=8, scale=(1, 1, 1)):
        r = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=rb, radius2=rt, depth=h)['verts']
        return self._add(r, color, at, rot, scale)

    def cone(self, r, h, color, at=(0, 0, 0), rot=(0, 0, 0), seg=8, scale=(1, 1, 1)):
        return self.cyl(0, r, h, color, at, rot, seg, scale)

    def ball(self, r, color, at=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), sub=1, jitter=0, seed=0, uv=None):
        if uv: v = bmesh.ops.create_uvsphere(self.bm, u_segments=uv[0], v_segments=uv[1], radius=r)['verts']
        else: v = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r)['verts']
        if jitter:
            rnd = random.Random(seed)
            for p in v: p.co *= 1 + rnd.uniform(-jitter, jitter)
        return self._add(v, color, at, rot, scale)

    def torus(self, R, r, color, at=(0, 0, 0), rot=(0, 0, 0), seg=10, ring=5, arc=2 * math.pi):
        verts, rings = [], []
        n = seg if arc >= 2 * math.pi - 1e-6 else seg + 1
        for i in range(n):
            a = arc * i / seg; ringv = []
            for k in range(ring):
                b = 2 * math.pi * k / ring
                ringv.append(self.bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
            rings.append(ringv); verts += ringv
        for i in range(n if n == seg else n - 1):
            a, b = rings[i], rings[(i + 1) % n]
            for k in range(ring): self.bm.faces.new((a[k], b[k], b[(k + 1) % ring], a[(k + 1) % ring]))
        # liegt flach (Spiel-xz-Ebene); rot dreht ihn
        return self._add(verts, color, at, rot, (1, 1, 1))

    def lathe(self, profile, color, at=(0, 0, 0), rot=(0, 0, 0), seg=10):
        """Drehkörper aus [(radius, höhe), ...] von unten nach oben."""
        rings = []
        for r, y in profile:
            rings.append([self.bm.verts.new((r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), y)) for k in range(seg)])
        for a, b in zip(rings, rings[1:]):
            for k in range(seg): self.bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
        if profile[0][0] > 0: self.bm.faces.new(list(reversed(rings[0])))
        if profile[-1][0] > 0: self.bm.faces.new(rings[-1])
        return self._add([v for r in rings for v in r], color, at, rot, (1, 1, 1))

    def done(self):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-5)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(self.ob.data); self.bm.free()
        for c in self.colors: self.ob.data.materials.append(mat(c))
        for p in self.ob.data.polygons: p.use_smooth = False
        return self.ob


class Node:
    """Leerer Knoten (Drehpunkt für bewegliche Teile oder Wurzel)."""
    def __init__(self, name, parent=None, at=(0, 0, 0)):
        self.ob = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(self.ob)
        if parent is not None: self.ob.parent = parent.ob
        self.ob.location = to_bl(*at)


def export(root, rel):
    bpy.ops.object.select_all(action='DESELECT')
    stack = [root.ob]
    while stack:
        o = stack.pop(); o.select_set(True); stack += list(o.children)
    path = os.path.join(ROOT, rel + '.glb'); os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format='GLB', export_yup=True,
                              export_apply=True, export_animations=False)
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.context.selected_objects if o.type == 'MESH')
    print(f'{rel}.glb: {tris} Dreiecke, {os.path.getsize(path) // 1024} KB')
