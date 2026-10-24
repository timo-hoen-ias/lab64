// Low-Poly-Modelle als GLB unter assets/: selbst in Blender gebaute und heruntergeladene (CC0, Herkunft in CREDITS.md;
// fremde Modelle mit Textur-Palette vorher durch tools/lowpoly.py). Farben werden zu Vertexfarben, im Spiel bekommt alles
// dasselbe Toon-Material wie die Grundkörper-Modelle, und jedes Modell ist ein einziger Zeichenaufruf.
// loadAssets() lädt alles einmal vor dem Spielstart; asset(name) liefert danach sofort eine fertige Gruppe
// (oder null, wenn das Laden scheiterte – dann bauen die Welten ihre alten Grundkörper-Modelle).
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';
import { toonGradient, addSway } from './fx.js';

// name → Datei unter assets/ (ohne .glb). Neue Modelle hier eintragen und in CREDITS.md nennen.
export const ASSETS = {
  'auto-rot': 'autos/auto-rot', 'auto-blau': 'autos/auto-blau', 'auto-gelb': 'autos/auto-gelb', lieferwagen: 'autos/lieferwagen', // eigene, aus Blender (tools/make_cars.py)
  ...Object.fromEntries(['goldbone', 'crumb', 'sausage', 'bread', 'ham', 'cheese', 'fish', 'fries', 'shell', 'ice', 'bone', 'treat', 'sock', 'cup'].map(k => ['food-' + k, 'sammeln/' + k])), // Sammelobjekte (makeFood)
  ...Object.fromEntries(['moll', 'ratte', 'taube', 'moewe', 'katze', 'krabbe', 'staubsauger', 'dosenoeffner', 'einkaeufer', 'riesenmuschel'].map(k => [k, 'figuren/' + k])), // Figuren mit Knoten (rigAsset)
  tanne: 'pflanzen/tanne', laubbaum: 'pflanzen/laubbaum', apfelbaum: 'pflanzen/apfelbaum', busch: 'pflanzen/busch', gartenzwerg: 'deko/gartenzwerg', // Blender
  taxi: 'kenney-car/taxi', police: 'kenney-car/police', cone: 'kenney-car/cone', carton: 'kenney-car/box', // Kenney Car Kit (CC0)
};

const src = new Map(), geos = new Map();

export async function loadAssets(timeout = 8000) {
  const loader = new GLTFLoader(), base = new URL('../assets/', import.meta.url);
  const all = Promise.all(Object.entries(ASSETS).map(([name, file]) => loader.loadAsync(new URL(file + '.glb', base).href)
    .then(gltf => src.set(name, gltf.scene)).catch(e => console.warn('Modell fehlt:', name, e.message))));
  await Promise.race([all, new Promise(r => setTimeout(r, timeout))]);
}

export const hasAsset = name => src.has(name);

// Mesh → Geometrie nur mit Position, Normale und Farbe (alles Float32, damit Teile verschiedener Herkunft zusammenpassen).
// Modelle ohne Vertexfarben (z. B. aus Blender mit einfarbigen Materialien) bekommen die Materialfarbe als Vertexfarbe.
function flat(o, matrix) {
  const g = o.geometry, n = g.attributes.position.count, c = g.attributes.color, mc = [].concat(o.material)[0].color ?? new THREE.Color(1, 1, 1);
  const f = (a, k) => { const r = new Float32Array(n * 3); for (let i = 0; i < n; i++) { r[i * 3] = a.getX(i) * k.r; r[i * 3 + 1] = a.getY(i) * k.g; r[i * 3 + 2] = a.getZ(i) * k.b; } return new THREE.BufferAttribute(r, 3); };
  const one = { r: 1, g: 1, b: 1 }, out = new THREE.BufferGeometry();
  out.setAttribute('position', f(g.attributes.position, one));
  if (g.attributes.normal) out.setAttribute('normal', f(g.attributes.normal, one));
  out.setAttribute('color', c ? f(c, mc) : new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [mc.r, mc.g, mc.b][i % 3]), 3));
  out.setIndex(g.index ? [...g.index.array] : [...Array(n).keys()]);
  if (!g.attributes.normal) out.computeVertexNormals();
  return out.applyMatrix4(matrix);
}

// Geometrie je Modell (und Lackfarbe) nur einmal bauen: alle Teile außer o.keep zu einem Mesh zusammengefasst.
// Teile in o.keep (Knotennamen-Anfänge) bleiben einzeln, mit ihrem Knoten-Ursprung als Drehpunkt.
function parts(name, paint, keep) {
  const key = `${name}|${paint ?? ''}|${keep.join()}`;
  if (geos.has(key)) return geos.get(key);
  const scene = src.get(name); scene.updateMatrixWorld(true);
  const body = [], sep = [], inv = new THREE.Matrix4();
  const walk = o => {
    if (o !== scene && keep.some(k => o.name.startsWith(k))) {
      inv.copy(o.matrixWorld).invert(); const list = [];
      o.traverse(m => { if (m.isMesh) list.push(flat(m, inv.clone().multiply(m.matrixWorld))); });
      if (list.length) sep.push({ name: o.name, geo: list.length > 1 ? mergeGeometries(list) : list[0], pos: new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), quat: new THREE.Quaternion().setFromRotationMatrix(o.matrixWorld) });
      return;
    }
    if (o.isMesh) body.push(flat(o, o.matrixWorld));
    o.children.forEach(walk);
  };
  walk(scene);
  const merged = body.length > 1 ? mergeGeometries(body) : body[0];
  if (paint !== undefined) repaint([merged, ...sep.map(s => s.geo)], paint);
  merged.computeBoundingBox();
  // Oberteil (alles über 62 % der Höhe, bei Autos die Fahrgastzelle) – daraus bauen Welten eine zweite Kollisionskiste
  const p = merged.attributes.position, cut = merged.boundingBox.max.y * 0.62, top = new THREE.Box3(), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) if (p.getY(i) > cut) top.expandByPoint(v.fromBufferAttribute(p, i));
  top.min.y = cut;
  const r = { body: merged, sep, top }; geos.set(key, r); return r;
}

// Lack umfärben: der häufigste kräftige Farbton (die Karosserie) bekommt den Farbton von paint, Helligkeitsverlauf bleibt.
const hsl = { h: 0, s: 0, l: 0 }, tmp = new THREE.Color(), want = { h: 0, s: 0, l: 0 };
function repaint(list, paint) {
  new THREE.Color(paint).getHSL(want, THREE.SRGBColorSpace);
  const bins = new Array(24).fill(0), read = (c, i) => tmp.setRGB(c.getX(i), c.getY(i), c.getZ(i)).getHSL(hsl, THREE.SRGBColorSpace);
  for (const g of list) { const c = g.attributes.color; for (let i = 0; i < c.count; i++) { read(c, i); if (hsl.s > 0.45 && hsl.l > 0.2 && hsl.l < 0.85) bins[Math.floor(hsl.h * 24) % 24]++; } }
  const top = bins.indexOf(Math.max(...bins)), hue = (top + 0.5) / 24; let lsum = 0, n = 0;
  const near = () => hsl.s > 0.45 && Math.min(Math.abs(hsl.h - hue), 1 - Math.abs(hsl.h - hue)) < 0.06;
  for (const g of list) { const c = g.attributes.color; for (let i = 0; i < c.count; i++) { read(c, i); if (near()) { lsum += hsl.l; n++; } } }
  const dl = want.l - lsum / Math.max(1, n);
  for (const g of list) {
    const c = g.attributes.color;
    for (let i = 0; i < c.count; i++) {
      read(c, i); if (!near()) continue;
      tmp.setHSL(want.h, want.s, THREE.MathUtils.clamp(hsl.l + dl, 0.05, 0.95), THREE.SRGBColorSpace); c.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    c.needsUpdate = true;
  }
}

// o.size = Länge der längsten Seite (Breite/Länge) in Spiel-Einheiten, o.scale = fester Maßstab,
// o.paint = neue Lackfarbe, o.material = gemeinsames Material (placeAsset nimmt eins je Welt, weil Welten Shader-Zusätze
// wie Kaustik oder Wolkenschatten an ihre Materialien hängen), o.keep = Namensanfänge von Teilen, die einzeln bleiben (z. B. ['wheel'] zum Drehen).
export function asset(name, o = {}) {
  if (!src.has(name)) return null;
  const material = o.material ?? toonMaterial();
  const { body, sep, top } = parts(name, o.paint, o.keep || []), b = body.boundingBox;
  const s = o.scale ?? (o.size ? o.size / Math.max(b.max.x - b.min.x, b.max.z - b.min.z) : 1);
  const g = new THREE.Group(), inner = new THREE.Group(); inner.scale.setScalar(s); g.add(inner);
  const m = new THREE.Mesh(body, material); m.castShadow = true; m.receiveShadow = true; inner.add(m);
  for (const p of sep) { const q = new THREE.Mesh(p.geo, material); q.name = p.name; q.position.copy(p.pos); q.quaternion.copy(p.quat); q.castShadow = true; inner.add(q); (g.userData.parts ??= []).push(q); }
  const S = new THREE.Matrix4().makeScale(s, s, s); g.userData.box = b.clone().applyMatrix4(S); g.userData.top = top.clone().applyMatrix4(S);
  g.userData.asset = name;
  return g;
}

const toonMaterial = () => new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonGradient() });

// Modell in eine Welt stellen, mit Kollision: o.solid 'car' = Unterbau bis zum Oberteil + Oberteil (Fahrgastzelle),
// 'box' = ganze Hülle, false = keine. Drehung ry in Vierteldrehungen (Kollisionskisten sind achsparallel).
// Liefert { mesh, top } (top = Höhe des Dachs) oder null ohne Modell.
const R = new THREE.Matrix4();
export function placeAsset(l, name, x, y, z, ry = 0, o = {}) {
  const m = asset(name, { material: l._assetMat ??= toonMaterial(), ...o }); if (!m) return null;
  l.deco(m, x, y, z, ry); R.makeRotationY(ry);
  const add = (b, surface) => { b = b.clone().applyMatrix4(R); l.solids.push({ min: { x: x + b.min.x + 0.05, y: y + b.min.y, z: z + b.min.z + 0.05 }, max: { x: x + b.max.x - 0.05, y: y + b.max.y, z: z + b.max.z - 0.05 }, active: true, surface }); };
  const { box, top } = m.userData, surface = o.surface ?? 'metal';
  if (o.solid === 'car') { const low = box.clone(); low.max.y = top.min.y; low.min.y = 0; add(low, surface); add(top, surface); }
  else if (o.solid !== false) add(box, surface);
  return { mesh: m, top: y + box.max.y };
}

// Texturierte Modelle (z. B. die Sammelobjekte): Textur bleibt, Material wird Toon mit derselben Textur. Geometrie und
// Material je Modell nur einmal, jede Kopie ist ein Zeichenaufruf je Teil. o.emissive = Leuchtfarbe (Goldknochen).
const texMats = new Map();
export function texturedAsset(name, o = {}) {
  if (!src.has(name)) return null;
  const g = new THREE.Group(); src.get(name).updateMatrixWorld(true);
  src.get(name).traverse(m => {
    if (!m.isMesh) return;
    const sm = [].concat(m.material)[0], key = `${name}|${sm.uuid}|${o.emissive ?? ''}`;
    if (!texMats.has(key)) texMats.set(key, new THREE.MeshToonMaterial({ color: sm.color, map: sm.map, gradientMap: toonGradient(), ...(o.emissive !== undefined && { emissive: new THREE.Color(o.emissive) }) }));
    const q = new THREE.Mesh(m.geometry, texMats.get(key)); q.applyMatrix4(m.matrixWorld); q.castShadow = true; g.add(q);
  });
  return g;
}

// Sammelobjekte u. ä.: texturierte Modelle mit Textur, einfarbige als ein Mesh mit Vertexfarben
export function model(name, o = {}) {
  let tex = false; src.get(name)?.traverse(m => { if (m.isMesh && [].concat(m.material)[0].map) tex = true; });
  return tex ? texturedAsset(name, o) : asset(name, o);
}

// Für Deko, die Level._mergeStatic nach Farbe zusammenbackt (Bäume, Büsche): ein Mesh je Materialfarbe mit eigenem
// Toon-Material, damit gleiche Farben über die ganze Welt ein Zeichenaufruf werden. o.sway = { knotenname: Stärke }
// gibt den Teilen unter diesem Knoten (z. B. 'laub') das Wind-/Wackel-Material (addSway), o.scale den Maßstab.
const flatGeos = new Map();
export function colorAsset(name, o = {}) {
  if (!src.has(name)) return null;
  const scene = src.get(name), g = new THREE.Group(), sway = o.sway || {}; scene.updateMatrixWorld(true);
  let i = 0;
  scene.traverse(m => {
    if (!m.isMesh) return;
    const key = `${name}|${i++}`; if (!flatGeos.has(key)) flatGeos.set(key, flat(m, m.matrixWorld));
    let amp; for (let p = m; p && amp === undefined; p = p.parent) amp = sway[p.name];
    const mt = new THREE.MeshToonMaterial({ color: [].concat(m.material)[0].color, gradientMap: toonGradient() });
    const q = new THREE.Mesh(flatGeos.get(key), amp === undefined ? mt : addSway(mt, amp)); q.scale.setScalar(o.scale ?? 1); q.castShadow = true; q.receiveShadow = true; g.add(q);
  });
  return g;
}

// Figuren mit beweglichen Teilen: Die Knoten-Hierarchie bleibt erhalten (Drehpunkte wie im alten Grundkörper-Modell),
// jeder Knoten wird eine Gruppe mit EINEM gebackenen Mesh (Vertexfarben). Kinder mit Namen „…-m“ und Meshes werden in
// ihren Knoten gebacken, alle anderen Kinder sind wieder bewegliche Knoten. Liefert { root, n(name), list(prefix) }:
// n('head') = Knoten, list('leg') = [leg-0, leg-1, …] (nur direkte Nummern, nicht leg-0-lo). o.paint färbt um,
// o.glow = { knotenname: Leuchtfarbe } (z. B. Lampe, rote Rattenaugen). Material je Figur eigen (Treffer-Blitz).
const rigGeos = new Map();
export function rigAsset(name, o = {}) {
  if (!src.has(name)) return null;
  const scene = src.get(name), key = `${name}|${o.paint ?? ''}`;
  if (!rigGeos.has(key)) {
    const geo = new Map(), inv = new THREE.Matrix4();
    const bakeInto = (node, ch) => { inv.copy(node.matrixWorld).invert(); ch.traverse(m => { if (m.isMesh) (geo.get(node) || geo.set(node, []).get(node)).push(flat(m, inv.clone().multiply(m.matrixWorld))); }); };
    const walk = node => node.children.forEach(ch => { if (ch.isMesh || ch.name.endsWith('-m')) bakeInto(node, ch); else walk(ch); });
    scene.updateMatrixWorld(true); walk(scene);
    for (const [node, list] of geo) geo.set(node, list.length > 1 ? mergeGeometries(list) : list[0]);
    if (o.paint !== undefined) repaint([...geo.values()], o.paint);
    rigGeos.set(key, geo);
  }
  const geo = rigGeos.get(key), byName = {}, glow = o.glow || {};
  const material = toonMaterial();
  const copy = node => {
    const g = new THREE.Group(); g.name = node.name; g.position.copy(node.position); g.quaternion.copy(node.quaternion); g.scale.copy(node.scale);
    if (geo.has(node)) {
      const mt = glow[node.name] !== undefined ? new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonGradient(), emissive: new THREE.Color(glow[node.name]) }) : material;
      const m = new THREE.Mesh(geo.get(node), mt); m.castShadow = true; m.receiveShadow = true; g.add(m);
    }
    node.children.forEach(ch => { if (!ch.isMesh && !ch.name.endsWith('-m')) g.add(copy(ch)); });
    byName[node.name] = g; return g;
  };
  const root = copy(scene);
  const list = p => Object.keys(byName).filter(k => new RegExp(`^${p}-\\d+$`).test(k)).sort((a, b) => a.split('-').pop() - b.split('-').pop()).map(k => byName[k]);
  return { root, n: k => byName[k], list };
}
