// Kleine Gegner im Banjo-Kazooie-Stil: jede Welt hat ihre eigenen Typen, die in Gruppen herumlaufen, hüpfen, fliegen
// oder aus dem Boden schießen. BISS oder TRILLERN besiegt sie, gepanzerte erst per Trillern (oder Bauchklatscher) umdrehen
// und dann beißen. BELLEN macht sie kurz benommen. Jeder besiegte Gegner gibt einen Krümel fürs Portemonnaie und,
// wenn Moll verletzt ist, oft ein Leckerli, das ein Herz heilt (wie die Honigwaben bei Banjo).
import * as THREE from 'three';
import { FX } from './fx.js';
import { rigAsset } from './assets.js';
import { makeFood, makeSnail, makeBug, makeBeetle, makeFrog, makeMole, makeDustBunny, makeMiniRat, makeRobo, makeStapler, makeDrone, makeBat, makeFowl, makeMiniGull, animateLife, cyl, sphere } from './models.js';

// move: walk (läuft, stürmt kurz vor), hop (springt auf Moll zu), fly (kreist, stößt herab), pop (schießt aus dem Boden)
const KINDS = {
  schnecke: { name: 'Schnecke', make: () => makeSnail(), move: 'walk', speed: 0.9, chase: 1.9, radius: 0.7, aggro: 7, puff: [0xb8d27a, 0xc8875a] },
  wespe: { name: 'Wespe', make: () => makeBug('wespe'), move: 'fly', speed: 3, chase: 5, radius: 0.6, aggro: 11, fly: 2.6, puff: [0xf5c518, 0x222222] },
  biene: { name: 'Biene', make: () => makeBug('biene'), move: 'fly', speed: 2.6, chase: 4.5, radius: 0.6, aggro: 10, fly: 2.2, puff: [0xf6b93b, 0x3d2b1f] },
  fliege: { name: 'Stubenfliege', make: () => makeBug('fliege'), move: 'fly', speed: 3.5, chase: 5.5, radius: 0.6, aggro: 10, fly: 2.4, puff: [0x2f3640, 0xc0392b] },
  bremse: { name: 'Bremse', make: () => makeBug('bremse'), move: 'fly', speed: 3.2, chase: 5.2, radius: 0.6, aggro: 11, fly: 2.8, puff: [0x7f6e5d, 0x27ae60] },
  frosch: { name: 'Frosch', make: () => makeFrog(), move: 'hop', speed: 4.2, radius: 0.75, aggro: 9, puff: [0x6ab04c, 0xe8f5c8] },
  kroete: { name: 'Kröte', make: () => makeFrog(0x8d7b4a), move: 'hop', speed: 3.6, radius: 0.75, aggro: 8, puff: [0x8d7b4a, 0xe8f5c8] },
  maulwurf: { name: 'Maulwurf', make: () => makeMole(), move: 'pop', radius: 0.8, aggro: 7, mound: 0x6d4c33, puff: [0x6d4c33, 0x4a3b33] },
  gullyratte: { name: 'Gullyratte', make: () => makeMole(0x7a7a80, 0xff9aa9, true), move: 'pop', radius: 0.8, aggro: 7, mound: 0x2d3436, flat: true, puff: [0x7a7a80, 0xffb6c1] },
  wollmaus: { name: 'Wollmaus', make: makeDustBunny, move: 'walk', speed: 2, chase: 4.4, radius: 0.7, aggro: 9, puff: [0xb2bec3, 0x8395a7, 0xffffff] },
  kakerlake: { name: 'Kakerlake', make: () => makeBeetle({ shell: 0x7b4a24, antenna: true }), move: 'walk', armor: true, speed: 2.4, chase: 5, radius: 0.8, aggro: 9, puff: [0x7b4a24, 0x3e2412] },
  kaefer: { name: 'Mistkäfer', make: () => makeBeetle({ shell: 0x2d6a4f, spots: 0x95d5b2 }), move: 'walk', armor: true, speed: 2, chase: 4.4, radius: 0.8, aggro: 9, puff: [0x2d6a4f, 0x95d5b2] },
  einsiedler: { name: 'Einsiedlerkrebs', make: () => makeBeetle({ spiral: 0xf3c1a8, body: 0xe17055, claws: true }), move: 'walk', armor: true, speed: 2, chase: 4.6, radius: 0.85, aggro: 9, puff: [0xf3c1a8, 0xe17055] },
  krebs: { name: 'Hafenkrebs', make: () => makeBeetle({ shell: 0xc0392b, body: 0x922b21, claws: true, clawC: 0xe74c3c }), move: 'walk', armor: true, speed: 2.4, chase: 5, radius: 0.85, aggro: 9, puff: [0xc0392b, 0xffffff] },
  ratte: { name: 'Ratte', make: makeMiniRat, move: 'walk', speed: 3, chase: 5.8, radius: 0.7, aggro: 10, puff: [0x6f6f72, 0xffb6c1] },
  saugi: { name: 'Putzroboter', make: makeRobo, move: 'walk', speed: 2.4, chase: 5, radius: 0.8, aggro: 9, puff: [0x2d3436, 0xfdcb6e, 0x81ecec] },
  tacker: { name: 'Tacker', make: makeStapler, move: 'hop', speed: 4.6, radius: 0.7, aggro: 9, puff: [0xd63031, 0xb2bec3] },
  drohne: { name: 'Drohne', make: makeDrone, move: 'fly', speed: 3, chase: 5, radius: 0.75, aggro: 11, fly: 3, puff: [0xdfe6e9, 0x636e72] },
  fledermaus: { name: 'Fledermaus', make: makeBat, move: 'fly', speed: 3.4, chase: 5.4, radius: 0.65, aggro: 10, fly: 2.8, puff: [0x4b3f5c, 0x8e7cc3] },
  huhn: { name: 'Huhn', make: () => makeFowl(false), move: 'walk', speed: 2.4, chase: 4.6, radius: 0.75, aggro: 8, puff: [0xb9773a, 0xe8c39e, 0xffffff] },
  gans: { name: 'Gans', make: () => makeFowl(true), move: 'walk', speed: 2.4, chase: 5.4, radius: 0.85, aggro: 10, puff: [0xffffff, 0xf39c12] },
  moewe: { name: 'Möwe', make: makeMiniGull, move: 'fly', speed: 3.4, chase: 5.6, radius: 0.7, aggro: 12, fly: 3.4, puff: [0xffffff, 0xbfc7cc] },
};

// GLB-Modelle aus Blender (assets/gegner, Name = Typ): bewegliche Knoten werden die userData-Teile der Grundkörper-Fabriken
function foeModel(kind) {
  const r = rigAsset('foe-' + kind, { glow: { lamp: 0xd00000 } }); if (!r) return null;
  const u = {}, wings = r.list('wing'), legs = r.list('leg');
  if (wings.length) u.wings = wings; if (legs.length) u.legs = legs; else if (r.n('legs')) u.legs = r.n('legs');
  for (const k of ['tail', 'jaw', 'head']) if (r.n(k)) u[k] = r.n(k);
  if (r.n('lamp')) u.lamp = r.n('lamp').children[0];
  r.root.userData = u; return r.root;
}

// Gruppen je Welt: [Typ, Anzahl Gruppen, Gegner pro Gruppe]. Der Garten ist der Hub: nur Gegner, die man ohne Trillern schafft.
export const WORLD_FOES = {
  hub: [['schnecke', 3, 2], ['wespe', 3, 1], ['frosch', 2, 2]],
  kueche: [['wollmaus', 5, 3], ['kakerlake', 4, 2], ['fliege', 4, 1]],
  strasse: [['ratte', 6, 3], ['gullyratte', 6, 1], ['wespe', 5, 2]],
  buero: [['saugi', 5, 2], ['tacker', 5, 2], ['drohne', 5, 1]],
  park: [['wespe', 5, 2], ['maulwurf', 7, 1], ['frosch', 5, 3], ['kaefer', 4, 2]],
  strand: [['einsiedler', 6, 2], ['bremse', 5, 2], ['moewe', 4, 1]],
  hafen: [['ratte', 6, 3], ['krebs', 5, 2], ['moewe', 5, 1]],
  dorf: [['huhn', 5, 3], ['gans', 4, 2], ['biene', 5, 2], ['kroete', 4, 2]],
  kanal: [['ratte', 5, 3], ['kakerlake', 4, 2], ['fledermaus', 5, 1]],
};

const FAR = 55, LEASH = 18;
// Steht bei (x,z) auf Höhe y eine Wand/Kiste im Weg (höher als eine Stufe)?
// Nass = Wasser über dem Boden (Kaimauern und Stege über dem Meer zählen als trocken)
const wet = (lvl, x, z, g) => { const w = lvl.waterAt(x, z); return w !== null && g < w - 0.2; };
const blocked = (lvl, x, y, z, r) => { for (const s of lvl.solids) if (s.active && s.max.y > y + 0.7 && s.min.y < y + 1.1 && x + r > s.min.x && x - r < s.max.x && z + r > s.min.z && z - r < s.max.z) return true; return false; };

export class Foe {
  constructor(game, lvl, kind, x, y, z, rnd = Math.random) {
    const K = this.K = KINDS[kind]; this.game = game; this.lvl = lvl; this.kind = kind; this.name = K.name;
    this.mesh = foeModel(kind) ?? K.make(); this.mesh.position.set(x, y, z); this.mesh.rotation.y = rnd() * Math.PI * 2;
    this.home = { x, y, z }; this.radius = K.radius; this.dead = false; this.t = rnd() * 10; this.seed = rnd() * 7;
    this.state = K.move === 'pop' ? 'under' : 'roam'; this.timer = rnd() * 2; this.goal = null; this.vy = 0; this.hv = null;
    this.stun = 0; this.flip = 0; this.cool = 0; this.air = false; this.base = this.mesh.scale.x; this._last = { x, z }; this.moveK = 0;
    if (K.move === 'fly') this.mesh.position.y = y + K.fly;
    if (K.move === 'pop') {
      this.mesh.visible = false; this.mesh.position.y = y - 1.3;
      const md = K.flat ? cyl(0.75, 0.75, 0.06, K.mound, 0, 0, 0, 10) : sphere(0.75, K.mound, 0, 0, 0, 7); if (!K.flat) md.scale.set(1.2, 0.3, 1.2);
      md.position.set(x, y + 0.03, z); md.castShadow = false; lvl.group.add(md); this.moundMesh = md;
    }
  }
  get pos() { return this.mesh.position; }
  hittable() { return !this.dead && this.state !== 'under' && this.state !== 'gone'; }

  update(dt, lvl) {
    const m = this.mesh, p = m.position, pl = this.game.player, K = this.K;
    const dx = pl.pos.x - p.x, dz = pl.pos.z - p.z, d = Math.hypot(dx, dz) || 0.001;
    if (this.game.foesOff) return; // Testhilfe: Knochen-Tests prüfen Erreichbarkeit, Kämpfe prüft tests/gegner.mjs
    const far = d > FAR; if (this.state !== 'under') m.visible = !far; if (far) return;
    // Bossbühne: keine kleinen Gegner im Weg
    const b = lvl.boss; if (b && !b.dead && b !== this && Math.hypot(b.pos.x - p.x, b.pos.z - p.z) < 24) { this.vanish(); return; }
    this.t += dt; if (this.cool > 0) this.cool -= dt;
    const sp = Math.hypot(p.x - this._last.x, p.z - this._last.z) / Math.max(dt, 1e-3); this._last.x = p.x; this._last.z = p.z;
    this.moveK += (Math.min(1, sp / 5) - this.moveK) * Math.min(1, dt * 8);
    this.animate(dt);
    if (this.flip > 0) { this.flip -= dt; if (this.flip <= 0) { m.rotation.z = 0; p.y = this.flipY; this.cool = 0.5; } return; }
    if (this.stun > 0) {
      this.stun -= dt; m.rotation.z = Math.sin(this.t * 20) * 0.15;
      if (K.move === 'fly') p.y += (lvl.groundAt(p.x, p.z, p.y) + 0.4 - p.y) * Math.min(1, dt * 6);
      if (Math.random() < dt * 8) this.game.fx.burst({ x: p.x + Math.cos(this.t * 6) * 0.5, y: p.y + 1.3, z: p.z + Math.sin(this.t * 6) * 0.5 }, { n: 1, color: [0xffe066, 0xffffff], speed: 0.3, up: 0.5, life: 0.5, size: 0.2, gravity: 0 });
      if (this.stun <= 0) m.rotation.z = 0; return;
    }
    const homeD = Math.hypot(pl.pos.x - this.home.x, pl.pos.z - this.home.z);
    const aggro = !pl.frozen && d < K.aggro && homeD < LEASH && Math.abs(pl.pos.y - this.home.y) < 3 && !lvl.isHidden(pl.pos);
    this[K.move](dt, lvl, aggro, d, dx / d, dz / d);
  }

  animate(dt) {
    const m = this.mesh, u = m.userData, t = this.t, k = this.moveK, b = this.base;
    if (u.wings) u.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(t * (this.kind === 'fledermaus' || this.kind === 'moewe' ? 14 : 45)) * 0.7; });
    if (u.legs?.length) u.legs.forEach((l, i) => { l.rotation.x = this.flip > 0 ? Math.sin(t * 22 + i * 3) * 0.6 : Math.sin(t * 20 + i * Math.PI) * 0.45 * k; });
    if (u.legs && !u.legs.length) u.legs.rotation.x = this.air ? -0.9 : 0;
    if (u.tail) u.tail.rotation.y = Math.sin(t * 6) * 0.5;
    if (u.head) u.head.rotation.x = this.state === 'wind' ? 0.6 : Math.max(0, Math.sin(t * 2.2 + this.seed) - 0.85) * 4;
    if (u.jaw) u.jaw.rotation.x = this.air || this.state === 'wind' ? -0.5 - Math.abs(Math.sin(t * 12)) * 0.3 : 0;
    if (u.lamp) u.lamp.material.emissiveIntensity = 0.5 + Math.sin(t * 10) * 0.5;
    if (this.K.move === 'walk' && this.flip <= 0) { const s = this.state === 'wind' ? -0.12 : Math.sin(t * 14) * 0.06 * k; m.scale.set(b * (1 + s * 0.5), b * (1 - s), b * (1 + s * 0.5)); }
  }
  face(x, z, dt, speed = 8) { const a = Math.atan2(x, z); let r = a - this.mesh.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); this.mesh.rotation.y += r * Math.min(1, dt * speed); }
  // Wände und Abgründe: Läufer bleiben auf ihrer Fläche und laufen nicht durch Kisten
  wall(lvl, x, y, z) { return blocked(lvl, x, y, z, this.radius * 0.6); }
  free(lvl, x, z, y) {
    const g = lvl.groundAt(x, z, y + 0.7);
    if (g === -Infinity || g < y - 0.9 || wet(lvl, x, z, g) || lvl.def.hazard?.(x, z) || this.wall(lvl, x, y, z)) return null;
    return g;
  }
  step(lvl, mx, mz) { const p = this.mesh.position, g = this.free(lvl, p.x + mx, p.z + mz, p.y); if (g === null) { this.goal = null; return false; } p.x += mx; p.z += mz; p.y = g; return true; }
  wander(dt, r = 5) {
    this.timer -= dt; const p = this.mesh.position;
    if (!this.goal || this.timer <= 0 || Math.hypot(this.goal.x - p.x, this.goal.z - p.z) < 0.4) { const a = Math.random() * Math.PI * 2, rr = Math.random() * r; this.goal = { x: this.home.x + Math.cos(a) * rr, z: this.home.z + Math.sin(a) * rr }; this.timer = 2 + Math.random() * 3; }
    const dx = this.goal.x - p.x, dz = this.goal.z - p.z, l = Math.hypot(dx, dz) || 1; return { x: dx / l, z: dz / l };
  }
  // Berührung: Moll verliert ein Herz und wird weggeschubst, der Gegner weicht kurz zurück
  bump(d, dx, dz, reach = 0.65, dyMax = 1.3) {
    const pl = this.game.player, p = this.mesh.position;
    if (d < this.radius + reach && Math.abs(pl.pos.y - p.y) < dyMax && pl.hurt(1)) { pl.vel.x += dx * 9; pl.vel.z += dz * 9; this.cool = 1.4; this.state = 'roam'; return true; }
    return false;
  }

  walk(dt, lvl, aggro, d, dx, dz) {
    const K = this.K;
    if (this.state === 'wind') { this.timer -= dt; this.face(dx, dz, dt, 12); if (this.timer <= 0) { this.state = 'lunge'; this.timer = 0.42; this.dir = { x: dx, z: dz }; } return; }
    if (this.state === 'lunge') { this.timer -= dt; this.step(lvl, this.dir.x * K.chase * 2.4 * dt, this.dir.z * K.chase * 2.4 * dt); this.bump(d, dx, dz); if (this.timer <= 0 && this.state === 'lunge') { this.state = 'roam'; this.cool = 0.9; } return; }
    let dir, speed;
    if (aggro && this.cool <= 0) { dir = { x: dx, z: dz }; speed = K.chase; if (d < 3.2) { this.state = 'wind'; this.timer = 0.38; } }
    else { dir = this.wander(dt); speed = K.speed; if (this.cool > 0 && aggro) { dir = { x: -dx, z: -dz }; } }
    // Leine: nicht zu weit von zu Hause weg
    const p = this.mesh.position; if (Math.hypot(p.x - this.home.x, p.z - this.home.z) > LEASH) { const hx = this.home.x - p.x, hz = this.home.z - p.z, l = Math.hypot(hx, hz); dir = { x: hx / l, z: hz / l }; }
    this.step(lvl, dir.x * speed * dt, dir.z * speed * dt); this.face(dir.x, dir.z, dt);
    this.bump(d, dx, dz);
  }

  hop(dt, lvl, aggro, d, dx, dz) {
    const p = this.mesh.position, K = this.K;
    if (this.air) {
      this.vy -= 24 * dt; const ny = p.y + this.vy * dt;
      const nx = p.x + this.hv.x * dt, nz = p.z + this.hv.z * dt;
      const gn = lvl.groundAt(nx, nz, ny + 0.5); if (!this.wall(lvl, nx, ny, nz) && !wet(lvl, nx, nz, gn) && !lvl.def.hazard?.(nx, nz) && gn > this.home.y - 1.5) { p.x = nx; p.z = nz; }
      const g = lvl.groundAt(p.x, p.z, p.y + 0.5); p.y = ny;
      if (this.vy < 0 && p.y <= g) { p.y = g; this.air = false; this.timer = 0.7 + Math.random() * 0.8; this.mesh.scale.set(this.base * 1.2, this.base * 0.75, this.base * 1.2); }
      this.bump(d, dx, dz, 0.7, 1.6); return;
    }
    const b = this.base; this.mesh.scale.lerp(new THREE.Vector3(b, b, b), Math.min(1, dt * 10));
    this.timer -= dt; const chase = aggro && this.cool <= 0;
    if (chase) this.face(dx, dz, dt, 10);
    if (this.timer <= 0) {
      let dir = chase ? { x: dx, z: dz } : this.wander(0, 5);
      if (Math.hypot(p.x - this.home.x, p.z - this.home.z) > LEASH) { const hx = this.home.x - p.x, hz = this.home.z - p.z, l = Math.hypot(hx, hz); dir = { x: hx / l, z: hz / l }; }
      const s = chase ? Math.min(K.speed * 1.3, d * 1.6 + 1) : K.speed * 0.6;
      this.hv = { x: dir.x * s, z: dir.z * s }; this.vy = chase ? 8 : 6; this.air = true; this.mesh.rotation.y = Math.atan2(dir.x, dir.z); this.goal = null;
    }
    this.bump(d, dx, dz);
  }

  fly(dt, lvl, aggro, d, dx, dz) {
    const p = this.mesh.position, K = this.K, pl = this.game.player, hover = this.home.y + K.fly;
    const moveTo = (x, y, z, s) => { const ex = x - p.x, ez = z - p.z, l = Math.hypot(ex, ez); if (l > 0.05) { const k = Math.min(l, s * dt) / l; p.x += ex * k; p.z += ez * k; } p.y += (y - p.y) * Math.min(1, dt * 3); };
    if (this.state === 'wind') { this.timer -= dt; p.x += Math.sin(this.t * 60) * 0.02; this.face(dx, dz, dt, 12); if (this.timer <= 0) { this.state = 'dive'; this.timer = 0; this.from = p.clone(); this.to = new THREE.Vector3(pl.pos.x, pl.pos.y + 0.6, pl.pos.z); } return; }
    if (this.state === 'dive') {
      this.timer += dt; const k = Math.min(1, this.timer / 0.55); p.lerpVectors(this.from, this.to, k);
      this.bump(d, dx, dz, 0.7, 1.4);
      if (k >= 1 && this.state === 'dive') { this.state = 'rest'; this.timer = 1.1; }
      return;
    }
    if (this.state === 'rest') { this.timer -= dt; p.y += Math.sin(this.t * 8) * 0.01; this.bump(d, dx, dz, 0.5, 1.2); if (this.timer <= 0) { this.state = 'roam'; this.cool = 1.2; } return; }
    const leash = Math.hypot(p.x - this.home.x, p.z - this.home.z) > LEASH;
    if (aggro && this.cool <= 0 && !leash) {
      if (this.state !== 'stalk') { this.state = 'stalk'; this.timer = 1.4 + Math.random() * 1.2; }
      const a = this.t * 1.1 + this.seed; moveTo(pl.pos.x + Math.cos(a) * 3.5, pl.pos.y + 2.6, pl.pos.z + Math.sin(a) * 3.5, K.chase); this.face(dx, dz, dt, 6);
      this.timer -= dt; if (this.timer <= 0) { this.state = 'wind'; this.timer = 0.45; }
    } else {
      this.state = 'roam'; const a = this.t * 0.7 + this.seed, tx = this.home.x + Math.cos(a) * 4, tz = this.home.z + Math.sin(a) * 4;
      moveTo(tx, hover + Math.sin(this.t * 2) * 0.3, tz, K.speed); this.face(tx - p.x, tz - p.z, dt, 4);
    }
  }

  pop(dt, lvl, aggro, d, dx, dz) {
    const p = this.mesh.position, h = this.home;
    if (this.state === 'under') {
      if (aggro && this.cool <= 0 && d < 7) { this.state = 'rise'; this.timer = 0.3; this.mesh.visible = true; this.snapped = false; FX.dust(this.game.fx, { x: p.x, y: h.y + 0.1, z: p.z }, 10); this.game.audio.sfx('dig'); }
      else if (Math.random() < dt * 2) this.game.fx.burst({ x: p.x, y: h.y + 0.2, z: p.z }, { n: 1, color: this.K.puff, speed: 1, up: 1.5, life: 0.4, size: 0.12 }); // es wühlt
      return;
    }
    this.face(dx, dz, dt, 8);
    if (this.state === 'rise') { this.timer -= dt; p.y = h.y - 1.3 * Math.max(0, this.timer / 0.3); if (this.timer <= 0) { this.state = 'out'; this.timer = 2.4; } return; }
    if (this.state === 'out') {
      this.timer -= dt; p.y = h.y + Math.abs(Math.sin(this.t * 6)) * 0.08;
      if (!this.snapped && d < 2.3 && this.timer < 1.9) { this.snapped = true; this.mesh.scale.set(this.base * 0.9, this.base * 1.25, this.base * 0.9); if (!this.bump(d, dx, dz, 1.4, 1.6)) this.game.audio.sfx('chomp'); }
      else this.mesh.scale.lerp(new THREE.Vector3(this.base, this.base, this.base), Math.min(1, dt * 8));
      if (this.timer <= 0) { this.state = 'sink'; this.timer = 0.3; }
      return;
    }
    if (this.state === 'sink') {
      this.timer -= dt; p.y = h.y - 1.3 * (1 - Math.max(0, this.timer / 0.3));
      if (this.timer <= 0) { this.state = 'under'; this.mesh.visible = false; this.cool = 1.2 + Math.random(); }
    }
  }
  // ---- Treffer
  onBite() {
    if (!this.hittable()) return;
    if (this.K.armor && this.flip <= 0 && this.stun <= 0) {
      this.game.audio.sfx('hit'); this.cool = 0.8; const now = performance.now();
      if (!Foe._armorTip || now - Foe._armorTip > 6000) { Foe._armorTip = now; this.game.toast(this.game.has('trillern') ? `${this.name} hat einen Panzer – erst TRILLERN, dann beißen!` : `${this.name} hat einen Panzer – ein BAUCHKLATSCHER oder BELLEN hilft!`, 2500); }
      return;
    }
    this.die();
  }
  onSpin() {
    if (!this.hittable()) return;
    if (this.K.armor && this.flip <= 0) { this.flip = 3.5; this.state = 'roam'; this.mesh.rotation.z = Math.PI; this.flipY = this.mesh.position.y; this.mesh.position.y += 0.9; this.game.audio.sfx('hit'); FX.dust(this.game.fx, this.mesh.position, 8); return; }
    if (this.K.armor) { this.flip = 3.5; return; } // liegt schon auf dem Rücken: jetzt beißen!
    this.die();
  }
  onStomp() { if (this.hittable()) this.die(); }
  onBark() { if (!this.hittable() || this.flip > 0) return; this.stun = 2.4; this.state = this.K.move === 'pop' ? 'out' : 'roam'; this.timer = 2.6; this.game.audio.sfx('hit'); }

  hide() { this.dead = true; this.mesh.visible = false; this.state = 'gone'; if (this.moundMesh) this.moundMesh.visible = false; }
  // Weg ohne Belohnung (Bossbühne)
  vanish() { if (this.dead) return; this.hide(); this.lvl.foesGone++; FX.dust(this.game.fx, this.mesh.position, 6); }
  die() {
    if (this.dead) return; const g = this.game, p = this.mesh.position, at = { x: p.x, y: p.y + 0.6, z: p.z };
    this.hide(); this.lvl.foesDown++;
    FX.hit(g.fx, at); g.fx.burst(at, { n: 18, color: this.K.puff, speed: 6, up: 5, life: 0.7, size: 0.22 }); g.fx.burst(at, { n: 6, color: [0xffffff, 0xffe066], speed: 3, up: 3, life: 0.5, size: 0.3, gravity: 0 });
    g.audio.sfx('poof'); g.input.vibrate(60); g.shake(0.08);
    g.save.crumbs += 1; g.pop(g.hud.counter);
    const pl = g.player; if (pl.hp < g.maxHp() && Math.random() < 0.6) this.lvl.addEnemy(new Treat(g, at.x, at.y, at.z));
    const lv = this.lvl, total = lv.foes.length;
    if (lv.foesDown + lv.foesGone >= total) {
      const st = g.worldState(lv.key); if (!st.foesCleared) { st.foesCleared = true; g.save.crumbs += 25; g.audio.sfx('big'); g.toast(`Alle ${total} Gegner in dieser Welt besiegt! +25 ✦`, 3500); }
    }
    g.persist();
  }
}

// Leckerli: springt aus besiegten Gegnern, heilt ein Herz. Verschwindet nach einer Weile.
export class Treat {
  constructor(game, x, y, z) {
    this.game = game; this.mesh = makeFood('treat'); this.mesh.scale.setScalar(1.3); this.mesh.position.set(x, y, z); this.dead = false; this.radius = 0.4; this.isDrop = true;
    this.vy = 6; this.life = 14; this.t = 0; this.ground = null; const a = Math.random() * Math.PI * 2; this.hv = { x: Math.cos(a) * 1.5, z: Math.sin(a) * 1.5 };
  }
  update(dt, lvl) {
    const p = this.mesh.position, pl = this.game.player; this.t += dt; this.life -= dt;
    if (this.ground === null) {
      this.vy -= 18 * dt; p.y += this.vy * dt; p.x += this.hv.x * dt; p.z += this.hv.z * dt;
      const g = lvl.groundAt(p.x, p.z, p.y + 0.5); if (this.vy < 0 && p.y <= g + 0.3) { this.ground = Math.max(g, -50) + 0.3; p.y = this.ground; }
      if (p.y < (lvl.killY ?? -25)) this.life = 0;
    } else p.y = this.ground + Math.sin(this.t * 4) * 0.1;
    this.mesh.rotation.y += dt * 3;
    this.mesh.visible = this.life > 3 || Math.sin(this.t * 25) > 0;
    if (this.life <= 0) { this.dead = true; this.mesh.visible = false; return; }
    if (Math.hypot(p.x - pl.pos.x, p.z - pl.pos.z) < 1.3 && Math.abs(p.y - pl.pos.y - 0.4) < 1.8 && this.t > 0.3) {
      this.dead = true; this.mesh.visible = false; const g = this.game;
      if (pl.hp < g.maxHp()) { pl.hp++; g.updateHearts(); g.pop(g.hud.hearts); }
      g.audio.sfx('collect'); FX.sparkle(g.fx, { x: p.x, y: p.y + 0.3, z: p.z });
    }
  }
}

// Gegner nach dem Aufbau verteilen: in Gruppen auf freien, flachen Flächen, gern dort, wo Krümel liegen (so auch auf oberen
// Ebenen und in Innenräumen), nie zu nah am Start, an Opa Bruno, an Portalen, Türen oder Goldknochen.
export function placeFoes(lvl, rand) {
  const plan = WORLD_FOES[lvl.key]; lvl.foes = []; lvl.foesDown = 0; lvl.foesGone = 0; if (!plan) return;
  const S = (lvl.def.size || 40) - 4, def = lvl.def, wall = (x, y, z) => blocked(lvl, x, y, z, 0.45);
  const avoid = [{ x: lvl.spawn.x, z: lvl.spawn.z, r: 16 }];
  if (lvl.bruno) avoid.push({ x: lvl.bruno.x, z: lvl.bruno.z, r: 8 });
  for (const po of lvl.portals) avoid.push({ x: po.x, z: po.z, r: 7 });
  for (const d of lvl.doors) avoid.push({ x: d.x, z: d.z, r: 5 }, { x: d.to.x, z: d.to.z, r: 7 });
  for (const q of lvl.pickups) if (q.kind === 'goldbone') avoid.push({ x: q.x, z: q.z, r: 4 });
  for (const e of lvl.enemies) avoid.push({ x: e.mesh.position.x, z: e.mesh.position.z, r: 6 });
  for (const it of lvl.interact) avoid.push({ x: it.x, z: it.z, r: 2.5 });
  const near = (x, z, list) => list.some(a => Math.hypot(a.x - x, a.z - z) < a.r);
  // Fläche frei und flach genug zum Herumlaufen? Liefert die Bodenhöhe oder null
  const spot = (x, z, y, r = 1.6) => {
    if (def.hazard?.(x, z)) return null;
    const g = lvl.groundAt(x, z, y + 0.7); if (g === -Infinity || Math.abs(g - y) > 0.6 || wet(lvl, x, z, g) || wall(x, g, z)) return null;
    if (def.minFloor !== undefined && g < def.minFloor) return null;
    for (const [ax, az] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const g2 = lvl.groundAt(x + ax, z + az, g + 0.7); if (g2 === -Infinity || Math.abs(g2 - g) > 0.5 || wall(x + ax, g, z + az) || wet(lvl, x + ax, z + az, g2)) return null; }
    return g;
  };
  // Kandidaten: Krümel-Plätze (alle Ebenen) und Zufallspunkte am Boden, gemischt
  const cand = lvl.pickups.filter(q => !q.goal && !q.special && q.kind !== 'goldbone' && !q.buried && !q.hidden).map(q => ({ x: q.x, z: q.z, y: q.y - 0.3 }));
  for (let i = 0; i < 400; i++) { const x = (rand() * 2 - 1) * S, z = (rand() * 2 - 1) * S, th = lvl.heightAt(x, z), y = lvl.groundAt(x, z, Math.max(th, def.minFloor ?? 0) + 2.6); if (y > -Infinity) cand.push({ x, z, y }); }
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  const centers = [], gap = S > 80 ? 15 : 9;
  for (const [kind, packs, size] of plan) {
    let made = 0;
    for (const c of cand) {
      if (made >= packs) break;
      if (c.used || near(c.x, c.z, avoid) || centers.some(o => Math.hypot(o.x - c.x, o.z - c.z) < gap && Math.abs(o.y - c.y) < 4)) continue;
      const y = spot(c.x, c.z, c.y, 2); if (y === null) continue; c.used = true;
      centers.push({ x: c.x, z: c.z, y }); made++;
      for (let i = 0; i < size; i++) {
        let fx = c.x, fz = c.z, fy = y;
        if (i) { for (let k = 0; k < 12; k++) { const a = rand() * Math.PI * 2, r = 1.6 + rand() * 1.8, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, g = spot(x, z, y, 0.8); if (g !== null && Math.abs(g - y) < 0.3) { fx = x; fz = z; fy = g; break; } } }
        const f = new Foe(lvl.game, lvl, kind, fx, fy, fz, rand); lvl.foes.push(f); lvl.addEnemy(f);
      }
    }
  }
}
