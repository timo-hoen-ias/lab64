# Baut die Low-Poly-Autos der Einkaufsstraße und exportiert sie als GLB nach assets/autos/.
# Aufruf: blender --background --factory-startup --python tools/make_cars.py
# Konvention: Ursprung am Boden, glTF +Z = vorne (Blender -Y), 1 Einheit = 1 m,
# Räder als eigene Knoten wheel-fl/-fr/-rl/-rr mit Ursprung in der Radmitte.
import bpy, bmesh, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'autos')


def mat(name, hexcol):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    r, g, b = [((hexcol >> s) & 255) / 255 for s in (16, 8, 0)]
    srgb = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    m.diffuse_color = (srgb(r), srgb(g), srgb(b), 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = m.diffuse_color
    bsdf.inputs['Roughness'].default_value = 1.0
    return m


def link(ob, parent):
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    return ob


def prism(name, profile, width, material, parent, taper=0.0, x0=0.0):
    """Seitenprofil [(vorne, hoch), ...] (gegen den Uhrzeigersinn) quer extrudieren.
    taper verjüngt nach oben: oben ist die Breite um taper kleiner (Dach/Seitenscheiben)."""
    zs = [p[1] for p in profile]; zmin, zmax = min(zs), max(zs)
    bm = bmesh.new()
    rings = []
    for side in (-1, 1):
        ring = []
        for f, z in profile:
            t = (z - zmin) / (zmax - zmin) if zmax > zmin else 0
            ring.append(bm.verts.new((x0 + side * (width / 2 - t * taper / 2), -f, z)))
        rings.append(ring)
    n = len(profile)
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[1])))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((rings[0][j], rings[0][i], rings[1][i], rings[1][j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(material)
    return link(bpy.data.objects.new(name, me), parent)


def block(name, cx, cf, cz, sx, sf, sz, material, parent):
    h = [(cf - sf / 2, cz - sz / 2), (cf + sf / 2, cz - sz / 2), (cf + sf / 2, cz + sz / 2), (cf - sf / 2, cz + sz / 2)]
    return prism(name, h, sx, material, parent, x0=cx)


def wheel(name, x, f, r, w, parent, tire, hub):
    # Rad als eigener Knoten, Ursprung in der Radmitte, damit es sich drehen lässt
    bm = bmesh.new()
    seg = 8
    for (rad, half, m) in ((r, w / 2, 0), (r * 0.5, w / 2 + 0.03, 1)):
        left = [bm.verts.new((-half, rad * math.cos(2 * math.pi * k / seg + math.pi / seg), rad * math.sin(2 * math.pi * k / seg + math.pi / seg))) for k in range(seg)]
        right = [bm.verts.new((half, v.co.y, v.co.z)) for v in left]
        faces = [bm.faces.new(left), bm.faces.new(list(reversed(right)))]
        for k in range(seg):
            l = (k + 1) % seg
            faces.append(bm.faces.new((left[k], left[l], right[l], right[k])))
        for fc in faces: fc.material_index = m
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(tire); me.materials.append(hub)
    ob = link(bpy.data.objects.new(name, me), parent)
    ob.location = (x, -f, r)
    return ob


M = {}
def common():
    M.update(tire=mat('reifen', 0x2d3436), hub=mat('felge', 0xdfe6e9), glass=mat('scheibe', 0x2f3e5c),
             light=mat('licht', 0xfff3b0), tail=mat('ruecklicht', 0xe84118), trim=mat('stossstange', 0x4b4b4b),
             plate=mat('kennzeichen', 0xf5f6fa))


def car(name, color, body, cabin, roof, L, W=3.8, wheel_r=0.6, wheels_f=None, extras=None, roof_w=None):
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    paint = mat('lack-' + name, color)
    prism(name + '-karosserie', body, W, paint, root, taper=0.25)
    prism(name + '-kabine', cabin, W - 0.35, M['glass'], root, taper=0.55)
    prism(name + '-dach', roof, roof_w or W - 0.85, paint, root)
    front, back = L / 2, -L / 2
    # Stoßstangen, Lichter, Kennzeichen
    for f in (front + 0.08, back - 0.08):
        block(name + '-stoss', 0, f, 0.55, W + 0.06, 0.25, 0.3, M['trim'], root)
        block(name + '-schild', 0, f + (0.1 if f > 0 else -0.1), 0.6, 0.9, 0.05, 0.22, M['plate'], root)
    for s in (-1, 1):
        block(name + '-scheinwerfer', s * (W / 2 - 0.5), front + 0.01, 1.0, 0.6, 0.06, 0.28, M['light'], root)
        block(name + '-ruecklicht', s * (W / 2 - 0.45), back - 0.01, 1.0, 0.5, 0.06, 0.3, M['tail'], root)
    wf = wheels_f or (L / 2 - 1.25, -L / 2 + 1.25)
    for tag, f in (('f', wf[0]), ('r', wf[1])):
        for side, x in (('l', W / 2 - 0.15), ('r', -W / 2 + 0.15)):  # Blickrichtung -Y: links ist +X
            wheel('wheel-' + tag + side, x, f, wheel_r, 0.5, root, M['tire'], M['hub'])
    if extras: extras(root, paint)
    return root


def export(root):
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for c in root.children: c.select_set(True)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, root.name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format='GLB', export_yup=True,
                              export_apply=True, export_animations=False, export_materials='EXPORT')
    tris = sum(sum(len(p.vertices) - 2 for p in c.data.polygons) for c in root.children if c.type == 'MESH')
    print(f'{path}: {tris} Dreiecke')


def build():
    # jedes Auto in einer leeren Szene, damit die Knotennamen nicht .001 usw. bekommen
    cars = []
    # Rot: kurzes Fließheck (Kabine bis ganz hinten, Heck steil)
    cars.append(lambda: car('auto-rot', 0xd63031,
        body=[(-3.2, 0.35), (3.2, 0.35), (3.3, 0.8), (3.1, 1.35), (1.4, 1.55), (-3.2, 1.55), (-3.3, 0.8)],
        cabin=[(-3.05, 1.5), (1.45, 1.5), (0.2, 2.55), (-2.85, 2.55)],
        roof=[(-2.95, 2.5), (0.25, 2.5), (0.15, 2.7), (-2.85, 2.7)], L=6.6))
    # Blau: Stufenheck-Limousine mit Kofferraum
    cars.append(lambda: car('auto-blau', 0x0984e3,
        body=[(-3.3, 0.35), (3.3, 0.35), (3.4, 0.8), (3.2, 1.3), (1.5, 1.45), (-1.9, 1.45), (-3.25, 1.4), (-3.4, 0.8)],
        cabin=[(-1.95, 1.4), (1.55, 1.4), (0.5, 2.45), (-1.35, 2.45)],
        roof=[(-1.45, 2.4), (0.55, 2.4), (0.45, 2.6), (-1.35, 2.6)], L=6.8))
    # Gelb: rundlicher Käfer-Typ, alles abgeschrägt
    cars.append(lambda: car('auto-gelb', 0xfdcb6e,
        body=[(-2.8, 0.35), (2.8, 0.35), (3.15, 0.75), (2.9, 1.2), (1.3, 1.5), (-1.9, 1.5), (-3.05, 1.15), (-3.15, 0.75)],
        cabin=[(-2.05, 1.45), (1.35, 1.45), (0.45, 2.4), (-1.15, 2.55), (-1.75, 2.3)],
        roof=[(-1.6, 2.45), (0.35, 2.45), (0.2, 2.65), (-1.15, 2.7)], L=6.3, wheel_r=0.62))
    # Lieferwagen: hoher Kastenaufbau, kurze Schnauze, Werbestreifen
    def van_extras(root, paint):
        for s in (-1, 1):
            block('lieferwagen-streifen', s * 1.9, -1.9, 2.3, 0.06, 3.6, 0.45, mat('streifen', 0xe17055), root)
    cars.append(lambda: car('lieferwagen', 0xf5f6fa,
        body=[(-3.7, 0.4), (3.6, 0.4), (3.75, 0.85), (3.6, 1.4), (2.6, 1.6), (-3.7, 1.6)],
        cabin=[(-0.2, 1.55), (2.65, 1.55), (1.6, 2.75), (-0.2, 2.75)],
        roof=[(-3.7, 1.55), (-0.15, 1.55), (-0.15, 3.4), (-3.7, 3.4)], L=7.4, wheel_r=0.65,
        wheels_f=(2.3, -2.5), extras=van_extras, roof_w=3.75))
    return cars


if __name__ == '__main__':
    for make in build():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        M.clear(); common()
        export(make())
