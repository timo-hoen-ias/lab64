# Macht ein generiertes GLB (z. B. aus Scenario/Meshy) spieltauglich fürs Handy:
# Textur auf N64-Größe verkleinern, Ursprung unten mittig, auf Zielgröße skalieren, als GLB speichern.
# Aufruf: blender --background --factory-startup --python tools/shrink_glb.py -- ein.glb aus.glb [größe_m] [textur_px] [name]
import bpy, sys, os
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, dst = args[0], args[1]
size = float(args[2]) if len(args) > 2 else 1.0   # längste Kante in Metern
tex = int(args[3]) if len(args) > 3 else 256
name = args[4] if len(args) > 4 else os.path.splitext(os.path.basename(dst))[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in [o for o in bpy.context.scene.objects if o is not ob]: bpy.data.objects.remove(o)
ob.name = ob.data.name = name

# Ursprung unten mittig, längste Kante = size
vs = [v.co for v in ob.data.vertices]
lo = Vector([min(v[i] for v in vs) for i in range(3)]); hi = Vector([max(v[i] for v in vs) for i in range(3)])
s = size / max(hi - lo)
off = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for v in ob.data.vertices: v.co = (v.co - off) * s

for img in bpy.data.images:
    if img.size[0] > tex: img.scale(tex, tex)
for m in bpy.data.materials:  # matt wie der Rest des Spiels
    b = m.node_tree and m.node_tree.nodes.get('Principled BSDF')
    if b: b.inputs['Metallic'].default_value = 0; b.inputs['Roughness'].default_value = 1
    if b:
        for k in ('Metallic', 'Roughness', 'Normal'):
            for l in list(b.inputs[k].links): m.node_tree.links.remove(l)

os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85,
                          export_animations=False, export_yup=True)
tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
d = (hi - lo) * s
print(f'{dst}: {tris} Dreiecke, {d.x:.2f}×{d.z:.2f}×{d.y:.2f} m, {os.path.getsize(dst) // 1024} KB')
