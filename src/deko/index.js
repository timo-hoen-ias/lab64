// Deko-Füllung der Welten: nach dem Aufbau einer Welt werden leere Flächen mit passenden Requisiten belebt.
// Die Platzierung hält alles frei, was fürs Spielen wichtig ist (Sammelsachen, Türen, Rampen, Schalter, Wege),
// stellt nichts ins Wasser oder auf Kanten und gibt größeren Dingen eine Kollision (mesh: true = kein Gras darin).
import { compact } from '../models.js';
import { strasse } from './strasse.js';
import { park } from './park.js';
import { dorf } from './dorf.js';
import { hafen } from './hafen.js';
import { strand } from './strand.js';
import { kueche } from './kueche.js';
import { buero } from './buero.js';
import { kanal } from './kanal.js';

const WORLDS = { strasse, park, dorf, hafen, strand, kueche, buero, kanal };

function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class Deko {
  constructor(l) {
    this.l = l; this.rand = seeded('deko-' + l.key); this.keep = []; this.lines = []; this.anim = [];
    const K = (x, z, r) => this.keep.push({ x, z, r });
    for (const p of l.pickups) K(p.x, p.z, p.kind === 'goldbone' ? 3.5 : 2.2);
    for (const it of l.interact) K(it.x, it.z, it.r + 2.5);
    for (const d of l.doors) K(d.x, d.z, 4.5);
    for (const w of l.warps || []) K(w.x, w.z, 3.5);
    for (const p of l.portals) K(p.x, p.z, 5);
    for (const t of l.triggers || []) K(t.x, t.z, Math.min(t.r, 4) + 1);
    for (const t of [...(l.digSpots || []), ...(l.spinTargets || []), ...(l.stompPads || []), ...(l.barkTargets || []), ...(l.crates || []), ...(l.bubbles || [])]) K(t.x, t.z, 3);
    for (const c of l.courses || []) for (const r of c.rings) K(r.x, r.z, 3);
    for (const it of l.abilityItems || []) K(it.x, it.z, 3);
    for (const f of [...(l.fetchItems || []), ...(l.fetchGoals || [])]) if (f.x !== undefined) K(f.x, f.z, 3);
    for (const e of l.enemies) if (e.mesh) K(e.mesh.position.x, e.mesh.position.z, 3.5);
    if (l.bruno) K(l.bruno.x, l.bruno.z, 4);
    K(l.spawn.x, l.spawn.z, 6);
    this.size = (l.def.size || 40) - 2.5;
  }
  r(a = 0, b = 1) { return a + this.rand() * (b - a); }
  pick(a) { return a[Math.floor(this.rand() * a.length)]; }
  keepOut(x, z, r) { this.keep.push({ x, z, r }); }
  // Weg freihalten: Strecke (x0,z0)–(x1,z1) mit halber Breite w
  keepLine(x0, z0, x1, z1, w) { this.lines.push({ x0, z0, x1, z1, w }); }
  _lineD(L, x, z) { const dx = L.x1 - L.x0, dz = L.z1 - L.z0, k = Math.max(0, Math.min(1, ((x - L.x0) * dx + (z - L.z0) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - L.x0 - dx * k, z - L.z0 - dz * k); }
  // Breite, flache Kisten bis 2.6 m Höhe (Kaimauern, Gehwege, Plätze) zählen als Boden
  _floor(s) { const w = s.max.x - s.min.x, d = s.max.z - s.min.z; return Math.min(w, d) >= 5.9 && w * d >= 60 && s.max.y <= 2.6; }
  // Boden an (x,z): Gelände, Boden oder breite Kiste; null = Wasser, Gefahr oder zu tief
  ground(x, z) {
    const l = this.l; if (l.def.hazard && l.def.hazard(x, z)) return null; if (l.seaY === undefined && l.waterAt(x, z) !== null) return null; // am Meer entscheidet die Höhe (Kaimauern liegen über dem Wasser)
    const th = l.heightAt(x, z); let y = th > -Infinity ? th : (l.def.floorY || 0);
    for (const s of l.solids) if (s.active && s !== l.groundSolid && x > s.min.x && x < s.max.x && z > s.min.z && z < s.max.z && this._floor(s) && s.max.y > y) y = s.max.y;
    if (l.seaY !== undefined && y < l.seaY + 0.25) return null;
    return y;
  }
  // Freie Stelle für eine Grundfläche w × d (o.y = feste Höhe, z.B. Stockwerke). Rückgabe: Höhe oder null
  free(x, z, w, d, o = {}) {
    const l = this.l, hw = w / 2, hd = d / 2, m = o.margin ?? 0.6;
    if (!o.anywhere && (Math.abs(x) + hw > this.size || Math.abs(z) + hd > this.size)) return null;
    let y = o.y;
    if (y === undefined) {
      y = this.ground(x, z); if (y === null) return null;
      for (const [px, pz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd], [0, -hd], [0, hd], [-hw, 0], [hw, 0]]) { const g = this.ground(x + px, z + pz); if (g === null || Math.abs(g - y) > (o.slope ?? 0.5)) return null; }
    }
    for (const s of l.solids) {
      if (!s.active || s === l.groundSolid || (o.y === undefined && this._floor(s) && s.max.y <= y + 0.05)) continue;
      if (s.max.y <= y + 0.05 || s.min.y >= y + (o.clear ?? 2.6)) continue;
      if (x + hw + m > s.min.x && x - hw - m < s.max.x && z + hd + m > s.min.z && z - hd - m < s.max.z) return null;
    }
    for (const t of l.terrain) if (t.kind === 'ramp' && x + hw + 1 > t.min.x && x - hw - 1 < t.max.x && z + hd + 1 > t.min.z && z - hd - 1 < t.max.z) return null;
    const rr = Math.hypot(hw, hd);
    for (const k of this.keep) if (Math.hypot(k.x - x, k.z - z) < k.r + rr) return null;
    for (const L of this.lines) if (this._lineD(L, x, z) < L.w + rr) return null;
    return y;
  }
  // Ohne Prüfung hinstellen. o.solid = [w,h,d] (Kollision), o.ry = Drehung, o.y = Höhe, o.s = Maßstab, o.keep = Freiraum-Radius
  at(mesh, x, z, o = {}) {
    const l = this.l, y = o.y ?? this.ground(x, z) ?? 0, ry = o.ry || 0, k = o.s || 1;
    l.deco(mesh, x, y + (o.dy || 0), z, ry); if (k !== 1) mesh.scale.setScalar(k);
    if (o.solid) {
      let [w, h, d] = o.solid.map(v => v * k); const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); [w, d] = [w * c + d * s, w * s + d * c];
      l.solids.push({ min: { x: x - w / 2, y, z: z - d / 2 }, max: { x: x + w / 2, y: y + h, z: z + d / 2 }, active: true, mesh: true, cam: h > 2.2 });
    }
    const fw = (o.solid ? o.solid[0] : (o.w || 1)) * k, fd = (o.solid ? o.solid[2] : (o.d || 1)) * k;
    this.keep.push({ x, z, r: o.keep ?? Math.hypot(fw, fd) / 2 * 0.9 });
    if (mesh.userData.spin || mesh.userData.wave || mesh.userData.bob) { mesh.userData.static = false; compact(mesh); this.anim.push({ m: mesh, y: mesh.position.y, ph: this.r(0, 6) }); }
    return mesh;
  }
  // Prüfen, dann hinstellen. Grundfläche: o.solid oder o.w/o.d (Standard 1 × 1)
  put(mesh, x, z, o = {}) {
    const ry = o.ry || 0, k = o.s || 1, [w0, d0] = (o.solid ? [o.solid[0], o.solid[2]] : [o.w || 1, o.d || 1]).map(v => v * k), c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    const y = this.free(x, z, w0 * c + d0 * s, w0 * s + d0 * c, o); if (y === null) return null;
    return this.at(mesh, x, z, { ...o, y: o.y ?? y });
  }
  // n Versuche, Dinge in einem Rechteck [x0,x1,z0,z1] zu verteilen. make(i) → [mesh, opts]
  scatter(rect, n, make, tries = 6) {
    let placed = 0;
    for (let i = 0; i < n; i++) for (let k = 0; k < tries; k++) {
      const x = this.r(rect[0], rect[1]), z = this.r(rect[2], rect[3]), [mesh, o = {}] = make(i, x, z);
      if (this.put(mesh, x, z, { ry: this.r(0, Math.PI * 2), ...o })) { placed++; break; }
    }
    return placed;
  }
  // Reihe entlang einer Strecke, alle step Meter (Laternen, Bäume, Zäune). make(i) → [mesh, opts]
  row(x0, z0, x1, z1, step, make) { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(len / step)); for (let i = 0; i <= n; i++) { const t = i / n, [mesh, o = {}] = make(i); this.put(mesh, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, o); } }
  zone(x, z, r, fn) { return this.l.zone(x, z, r, () => fn(this)); }
}

// Nach dem Aufbau der Welt (vor den Zufallskrümeln) aufrufen
export function dekorate(l) {
  const f = WORLDS[l.key]; if (!f) return;
  const d = new Deko(l); f(d, l); if (d.anim.length) l.decoAnim = d.anim;
}
// Leichte Bewegung: Windräder drehen, Fahnen wehen, Bojen und Boote schaukeln
export function animateDeko(l, dt) {
  for (const a of l.decoAnim) {
    const u = a.m.userData, t = l.t + a.ph;
    if (u.spin) u.spin.rotation[u.axis || 'z'] += dt * (u.speed || 4);
    if (u.wave) u.wave.rotation.y = Math.sin(t * 3) * 0.35;
    if (u.bob) { a.m.position.y = a.y + Math.sin(t * 1.6) * 0.12; a.m.rotation.z = Math.sin(t * 1.1) * 0.06; a.m.rotation.x = Math.sin(t * 0.9) * 0.05; }
  }
}
