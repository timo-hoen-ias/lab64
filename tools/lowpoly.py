#!/usr/bin/env python3
# Wandelt fremde Low-Poly-Modelle (GLB/GLTF, z. B. Kenney, Quaternius) in schlanke GLBs fürs Spiel um:
# Texturfarben (Palette/„colormap“) und Materialfarben werden zu Vertexfarben gebacken, UVs/Tangenten fliegen raus,
# gleiche Ecken werden zusammengelegt, Normalen als int8 (KHR_mesh_quantization). Im Spiel bekommt alles
# ein Toon-Material – so passt der Stil zum Rest und jedes Modell ist nach compact() ein Zeichenaufruf.
# Benannte Teile (Räder, Türen) bleiben eigene Knoten mit ihrem Drehpunkt, damit man sie animieren kann.
#   python3 tools/lowpoly.py <eingabe.glb> <ausgabe.glb> [--scale 1]
import json, struct, sys, math, io, os
from PIL import Image

def load(path):
    if path.endswith('.gltf'):
        j = json.load(open(path)); base = os.path.dirname(path)
        bufs = [open(os.path.join(base, b['uri']), 'rb').read() for b in j['buffers']]
    else:
        f = open(path, 'rb').read(); n = struct.unpack_from('<I', f, 12)[0]
        j = json.loads(f[20:20 + n]); bufs = [f[20 + n + 8:]]; base = os.path.dirname(path)
    return j, bufs, base

COMP = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def accessor(j, bufs, i):
    a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; b = bufs[v.get('buffer', 0)]
    fmt, sz = COMP[a['componentType']]; n = NCOMP[a['type']]
    stride = v.get('byteStride') or sz * n; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    out = [struct.unpack_from('<' + fmt * n, b, off + k * stride) for k in range(a['count'])]
    if a.get('normalized'):
        d = {5121: 255, 5123: 65535, 5120: 127, 5122: 32767}[a['componentType']]
        out = [tuple(max(-1, x / d) for x in t) for t in out]
    return out

def image(j, bufs, base, idx, cache):
    if idx in cache: return cache[idx]
    im = j['images'][idx]
    if 'uri' in im: data = open(os.path.join(base, im['uri']), 'rb').read()
    else:
        v = j['bufferViews'][im['bufferView']]; o = v.get('byteOffset', 0); data = bufs[v.get('buffer', 0)][o:o + v['byteLength']]
    cache[idx] = Image.open(io.BytesIO(data)).convert('RGB'); return cache[idx]

def mat4(node):
    if 'matrix' in node: m = node['matrix']; return [[m[c * 4 + r] for c in range(4)] for r in range(4)]
    t = node.get('translation', [0, 0, 0]); x, y, z, w = node.get('rotation', [0, 0, 0, 1]); s = node.get('scale', [1, 1, 1])
    r = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
         [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
         [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]
    return [[r[i][0] * s[0], r[i][1] * s[1], r[i][2] * s[2], t[i]] for i in range(3)] + [[0, 0, 0, 1]]

def mul(a, b): return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
def ap(m, p, w=1): return [m[i][0] * p[0] + m[i][1] * p[1] + m[i][2] * p[2] + m[i][3] * w for i in range(3)]
def srgb2lin(x): return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4  # Texturen sind sRGB, Vertexfarben in glTF linear

def convert(src, dst, scale=1.0):
    j, bufs, base = load(src); cache = {}
    scene = j['scenes'][j.get('scene', 0)]
    parts = []  # (name, Drehpunkt, [Dreiecke als (pos, nor, col)])
    def walk(ni, parent, top):
        node = j['nodes'][ni]; m = mul(parent, mat4(node))
        if 'mesh' in node:
            pivot = ap(m, [0, 0, 0]) if top else None
            verts, idx = [], []
            for prim in j['meshes'][node['mesh']]['primitives']:
                if prim.get('mode', 4) != 4: continue
                at = prim['attributes']; P = accessor(j, bufs, at['POSITION'])
                N = accessor(j, bufs, at['NORMAL']) if 'NORMAL' in at else None
                mt = j['materials'][prim['material']] if 'material' in prim else {}
                pbr = mt.get('pbrMetallicRoughness', {}); fac = pbr.get('baseColorFactor', [1, 1, 1, 1])
                tex = pbr.get('baseColorTexture'); U = accessor(j, bufs, at['TEXCOORD_%d' % tex.get('texCoord', 0)]) if tex else None
                C = accessor(j, bufs, at['COLOR_0']) if 'COLOR_0' in at else None
                img = image(j, bufs, base, j['textures'][tex['index']]['source'], cache) if tex else None
                I = [i[0] for i in accessor(j, bufs, prim['indices'])] if 'indices' in prim else list(range(len(P)))
                o = len(verts)
                for k, p in enumerate(P):
                    col = list(fac[:3])
                    if img:
                        u, v = U[k]; px = img.getpixel((min(img.width - 1, max(0, int((u % 1) * img.width))), min(img.height - 1, max(0, int((v % 1) * img.height)))))
                        col = [col[c] * srgb2lin(px[c] / 255) for c in range(3)]
                    if C: col = [col[c] * C[k][c] for c in range(3)]
                    verts.append((p, N[k] if N else None, col))
                idx += [i + o for i in I]
            parts.append((node.get('name', 'teil'), m, pivot, verts, idx))
        for c in node.get('children', []): walk(c, m, False)
    I4 = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
    for ni in scene['nodes']: walk(ni, I4, j['nodes'][ni].get('mesh') is not None)
    # Nur Knoten mit eigenem Namen behalten, der Rest kommt in den Rumpf
    out_nodes, blob, views, accs = [], bytearray(), [], []
    def view(data, target, stride=None):
        while len(blob) % 4: blob.append(0)
        v = {'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(data), 'target': target}
        if stride: v['byteStride'] = stride
        blob.extend(data); views.append(v); return len(views) - 1
    meshes = []
    for name, m, pivot, verts, idx in parts:
        piv = [x * scale for x in pivot] if pivot else [0, 0, 0]
        nm = [[m[i][k] for k in range(3)] for i in range(3)]
        uniq, remap, P, N, C = {}, [], [], [], []
        for p, n, col in verts:
            wp = [x * scale - piv[i] for i, x in enumerate(ap(m, p))]
            if n:
                wn = [nm[i][0] * n[0] + nm[i][1] * n[1] + nm[i][2] * n[2] for i in range(3)]; l = math.sqrt(sum(x * x for x in wn)) or 1; wn = [x / l for x in wn]
            else: wn = [0, 1, 0]
            qn = tuple(max(-127, min(127, round(x * 127))) for x in wn); qc = tuple(max(0, min(255, round(c * 255))) for c in col)  # linear, wie three.js Vertexfarben erwartet
            key = (tuple(round(x, 4) for x in wp), qn, qc)
            if key not in uniq: uniq[key] = len(P); P.append(wp); N.append(qn); C.append(qc)
            remap.append(uniq[key])
        tri = [remap[i] for i in idx]
        if not tri: continue
        mn = [min(p[i] for p in P) for i in range(3)]; mx = [max(p[i] for p in P) for i in range(3)]
        pv = view(b''.join(struct.pack('<3f', *p) for p in P), 34962)
        nv = view(b''.join(struct.pack('<3bx', *n) for n in N), 34962, 4)
        cv = view(b''.join(struct.pack('<4B', *c, 255) for c in C), 34962, 4)
        big = len(P) > 65535
        iv = view(b''.join(struct.pack('<I' if big else '<H', i) for i in tri), 34963)
        a0 = len(accs)
        accs += [{'bufferView': pv, 'componentType': 5126, 'count': len(P), 'type': 'VEC3', 'min': mn, 'max': mx},
                 {'bufferView': nv, 'componentType': 5120, 'normalized': True, 'count': len(N), 'type': 'VEC3'},
                 {'bufferView': cv, 'componentType': 5121, 'normalized': True, 'count': len(C), 'type': 'VEC4'},
                 {'bufferView': iv, 'componentType': 5125 if big else 5123, 'count': len(tri), 'type': 'SCALAR'}]
        meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': a0, 'NORMAL': a0 + 1, 'COLOR_0': a0 + 2}, 'indices': a0 + 3, 'material': 0}]})
        out_nodes.append({'name': name, 'mesh': len(meshes) - 1, 'translation': piv})
    while len(blob) % 4: blob.append(0)
    g = {'asset': {'version': '2.0', 'generator': 'moll64 tools/lowpoly.py'}, 'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
         'scene': 0, 'scenes': [{'nodes': list(range(len(out_nodes)))}], 'nodes': out_nodes, 'meshes': meshes,
         'materials': [{'name': 'toon', 'pbrMetallicRoughness': {'metallicFactor': 0}}],
         'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    js = json.dumps(g, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob)
    open(dst, 'wb').write(out)
    tris = sum(accs[m['primitives'][0]['indices']]['count'] // 3 for m in meshes)
    print(f'{os.path.basename(dst)}: {len(out) // 1024} KB, {len(out_nodes)} Teile, {tris} Dreiecke')

if __name__ == '__main__':
    a = sys.argv[1:]; s = float(a[a.index('--scale') + 1]) if '--scale' in a else 1.0
    convert(a[0], a[1], s)
