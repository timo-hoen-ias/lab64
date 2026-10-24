// Untergründe: worauf Moll gerade steht (für Pfoten-, Sprung- und Landegeräusche in audio.js).
// Welten setzen den Grund mit def.surface, Räume mit area.surface, Kisten/Hügel/Rampen/Deko mit surface: '…' bzw. userData.surface.
// Was nichts angibt, wird aus der Farbe geraten: grün = Gras, sandfarben = Sand, braun = Holz/Erde, grau = Stein/Fliesen.
import * as THREE from 'three';

export const SURFACES = ['grass', 'dirt', 'sand', 'wood', 'stone', 'tile', 'carpet', 'metal', 'water', 'snow', 'leaves'];

const hsl = {}, tmp = new THREE.Color();
// kind: 'ground' (Boden, Hügel, Rampen), 'solid' (Kisten, Möbel), 'flat' (flache Deko: Teppich, Dielen, Wegplatten)
export function guessSurface(color, kind = 'solid') {
  tmp.set(color).getHSL(hsl, THREE.SRGBColorSpace); const h = hsl.h * 360, s = hsl.s, l = hsl.l, x = tmp.getHex(), rgb = [x >> 16, x >> 8 & 255, x & 255], chroma = (Math.max(...rgb) - Math.min(...rgb)) / 255; // sRGB wie im Welt-Code
  if (chroma < 0.07 || l < 0.12) return l > 0.72 ? 'tile' : 'stone'; // Grau/Weiß (Buntheit statt HSL-Sättigung: fast Weiß hat sonst hohe Sättigung)
  if (h >= 65 && h < 170 && s > 0.2) return kind === 'solid' ? 'leaves' : 'grass'; // grüne Kiste = Hecke o. ä.
  if (h >= 15 && h < 58 && s < 0.75) return kind === 'flat' && s < 0.3 && l > 0.56 ? 'stone' : l > 0.56 ? (kind === 'solid' ? 'wood' : 'sand') : kind === 'ground' ? 'dirt' : 'wood';
  if (h >= 180 && h < 250 && s < 0.35) return 'metal'; // blaugrau = Blech
  return kind === 'flat' ? 'carpet' : 'wood'; // bunte flache Deko = Teppich/Matte, bunte Möbel = lackiertes Holz
}

// Flache Deko einsammeln (Holzböden, Teppiche, Wegplatten, Fliesen …): liegt ohne Kollision auf dem Boden und bestimmt trotzdem den Klang.
export function collectPatches(level, groups) {
  const solidMeshes = new Set(level.solids.map(s => s.mesh).filter(Boolean)), box = new THREE.Box3(), out = [];
  for (const g of groups) {
    g.updateMatrixWorld(true);
    g.traverse(m => {
      if (!m.isMesh || solidMeshes.has(m) || !m.material?.color) return;
      const gt = m.geometry.type; if (gt !== 'BoxGeometry' && gt !== 'CylinderGeometry' && gt !== 'PlaneGeometry' && gt !== 'CircleGeometry') return;
      box.setFromObject(m); const h = box.max.y - box.min.y, w = box.max.x - box.min.x, d = box.max.z - box.min.z;
      if (h > 0.35 || w * d < 0.8 || Math.min(w, d) < 0.5) return;
      const surface = m.userData.surface ?? guessSurface(m.material.color, 'flat');
      out.push({ min: { x: box.min.x, z: box.min.z }, max: { x: box.max.x, z: box.max.z }, y: box.max.y, surface });
    });
  }
  return out;
}

// Untergrund an Molls Füßen (x, y, z = Pfotenhöhe). Gewinnt die höchste Fläche knapp unter/auf Pfotenhöhe.
export function surfaceAt(level, x, y, z) {
  const wy = level.waterAt?.(x, z); if (wy !== null && wy !== undefined && y < wy + 0.3) return 'water';
  let best = null, by = -Infinity;
  const take = (top, surf, bonus = 0) => { if (top <= y + 0.15 && top >= y - 0.3 && top + bonus > by) { by = top + bonus; best = surf; } };
  // Von Hand gesetzte Flächen (l.surface) schlagen geratene Deko auf gleicher Höhe
  for (const p of level.patches || []) if (x > p.min.x && x < p.max.x && z > p.min.z && z < p.max.z) take(p.y, p.surface, p.explicit ? 0.2 : 0);
  for (const s of level.solids) {
    if (!s.active || x <= s.min.x || x >= s.max.x || z <= s.min.z || z >= s.max.z) continue;
    if (s.max.y > y + 0.15 || s.max.y < y - 0.3) continue;
    take(s.max.y, s.surface ?? (s === level.groundSolid || !s.mesh ? groundSurface(level) : guessSurface(s.mesh.material.color, 'solid')));
  }
  for (const t of level.terrain || []) {
    const v = level._terrainH(t, x, z); if (v === -Infinity || (t.bridge && y < v - 1.2)) continue;
    take(v, t.surface ?? (t.bridge ? 'wood' : t.color !== undefined ? guessSurface(t.color, 'ground') : groundSurface(level)));
  }
  return best ?? groundSurface(level);
}

export function groundSurface(level) {
  return level.bounds?.surface ?? level.def.surface ?? (level._groundSurf ??= guessSurface(level.def.ground ?? 0x6bbf59, 'ground'));
}
