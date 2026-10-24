// Spielereien: kleine versteckte Details, die auf Moll reagieren – Uhren ticken, Feuer knistert, Bäume wackeln beim Trillern
// und lassen Äpfel fallen, Tiere erschrecken beim Bellen … Dazu Geräuschquellen, die mit der Entfernung leiser werden.
// Für alle Welten: Bäume und Büsche (Trillern, Bauchklatscher), Blumenbeete (lange schnüffeln = Niesen). Je Welt eigene Details in WORLDS.
// Bausteine: l.sound (Geräuschquelle), l.fun (reagiert auf spin/bark/stomp/bite/near), l.tween/l.ticks (Animationen), l.findAt (Deko der Welt finden).
import * as THREE from 'three';
import { box, cyl, sphere, cone, compact, makeBird } from './models.js';
import { SHAKE } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const lerp = (a, b, k) => a + (b - a) * k;
const TAU = Math.PI * 2;
const flame = c => new THREE.MeshBasicMaterial({ color: c });

// ---- Kleine Modelle (je ein Mesh nach compact(), bewegte Teile stehen in userData)
let APPLE, CONE;
function apple() {
  if (!APPLE) { const g = new THREE.Group(); g.add(sphere(0.2, 0xe53935, 0, 0.2, 0, 7)); g.add(box(0.03, 0.12, 0.03, 0x5d3f26, 0, 0.42, 0)); g.add(box(0.12, 0.02, 0.06, 0x4caa4c, 0.06, 0.4, 0)); APPLE = compact(g); }
  return APPLE.clone();
}
function pinecone() {
  if (!CONE) { const g = new THREE.Group(); const c = sphere(0.14, 0x8d5a2b, 0, 0.18, 0, 6); c.scale.y = 1.5; g.add(c); g.add(cone(0.1, 0.12, 0x6d4421, 0, 0.42, 0, 5)); CONE = compact(g); }
  return CONE.clone();
}
function makeClock(cuckoo = true, s = 1) {
  const g = new THREE.Group();
  g.add(box(1.1, 1.5, 0.22, 0x8d5a2b, 0, 0, 0));
  if (cuckoo) { [-1, 1].forEach(k => { const r = box(0.85, 0.12, 0.34, 0x5d3f26, k * 0.33, 0.92, 0); r.rotation.z = -k * 0.55; g.add(r); }); g.add(box(0.36, 0.3, 0.04, 0x3b2412, 0, 0.62, 0.11)); }
  const face = cyl(0.42, 0.42, 0.06, 0xfdf6e3, 0, 0.12, 0.12, 16); face.rotation.x = Math.PI / 2; g.add(face);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.add(box(0.04, i % 3 ? 0.05 : 0.1, 0.02, 0x2d3436, Math.sin(a) * 0.34, 0.12 + Math.cos(a) * 0.34, 0.16)); }
  const hand = (w, l) => { const h = new THREE.Group(); h.position.set(0, 0.12, 0.17); h.add(box(w, l, 0.02, 0x2d3436, 0, l / 2 - 0.03, 0)); g.add(h); return h; };
  const hour = hand(0.06, 0.24), minute = hand(0.04, 0.34);
  const pend = new THREE.Group(); pend.position.set(0, -0.7, 0.05); pend.add(box(0.04, 0.75, 0.02, 0xd4a017, 0, -0.37, 0)); pend.add(cyl(0.13, 0.13, 0.04, 0xf1c40f, 0, -0.78, 0, 10).rotateX(Math.PI / 2)); g.add(pend);
  if (cuckoo) [-0.22, 0.22].forEach(x => { g.add(cyl(0.015, 0.015, 0.9, 0x2d3436, x, -1.2, 0.05, 4)); g.add(cone(0.08, 0.3, 0x5d3f26, x, -1.75, 0.05, 6).rotateX(Math.PI)); }); // Ketten mit Tannenzapfen-Gewichten
  let bird = null;
  if (cuckoo) { bird = new THREE.Group(); bird.position.set(0, 0.62, -0.05); bird.add(sphere(0.12, 0xfdd835, 0, 0, 0, 6)); bird.add(cone(0.04, 0.12, 0xff8f00, 0, 0, 0.14, 4).rotateX(Math.PI / 2)); bird.add(sphere(0.02, 0x111111, 0.06, 0.04, 0.09, 4)); bird.add(sphere(0.02, 0x111111, -0.06, 0.04, 0.09, 4)); g.add(bird); }
  g.userData = { hour, minute, pend, bird }; g.scale.setScalar(s);
  return compact(g);
}
function makeFlames(s = 1) {
  const g = new THREE.Group(), list = [];
  [[0, 0xff7f27, 0.45, 1.3], [-0.3, 0xffb142, 0.3, 0.9], [0.32, 0xffd32a, 0.28, 0.8]].forEach(([x, c, r, h]) => { const f = new THREE.Mesh(new THREE.ConeGeometry(r * s, h * s, 6), flame(c)); f.position.set(x * s, h * s / 2, 0); g.add(f); list.push(f); });
  g.userData = { list }; return g;
}
function makeDuck(c = 0xffd32a, beak = 0xff7f27, s = 1) {
  const g = new THREE.Group(); const b = sphere(0.3, c, 0, 0.2, 0, 8); b.scale.set(1, 0.75, 1.3); g.add(b);
  g.add(sphere(0.18, c, 0, 0.5, 0.25, 7)); g.add(cone(0.08, 0.2, beak, 0, 0.47, 0.48, 5).rotateX(Math.PI / 2));
  [-1, 1].forEach(k => g.add(sphere(0.035, 0x111111, k * 0.1, 0.56, 0.38, 4))); g.add(cone(0.1, 0.2, c, 0, 0.32, -0.38, 5).rotateX(-1.1));
  g.scale.setScalar(s); return compact(g);
}
function makeFrog() {
  const g = new THREE.Group(); const b = sphere(0.3, 0x43a047, 0, 0.18, 0, 7); b.scale.set(1.1, 0.65, 1); g.add(b);
  [-1, 1].forEach(k => { g.add(sphere(0.1, 0x66bb6a, k * 0.15, 0.36, 0.14, 6)); g.add(sphere(0.05, 0x111111, k * 0.16, 0.39, 0.22, 4)); g.add(box(0.12, 0.06, 0.3, 0x2e7d32, k * 0.3, 0.05, -0.05)); });
  g.add(box(0.26, 0.03, 0.04, 0xc62828, 0, 0.14, 0.29)); return compact(g);
}
function makeCow() {
  const g = new THREE.Group(), W = 0xfafafa, K = 0x2d2d2d;
  g.add(box(1.3, 1.1, 2.2, W, 0, 1.5, 0)); [[0.66, 1.6, 0.3, 0.6], [-0.66, 1.4, -0.4, 0.7], [0.66, 1.3, -0.6, 0.5]].forEach(([x, y, z, s]) => g.add(box(0.02, s, s * 1.2, K, x, y, z)));
  g.add(box(0.5, 0.35, 0.6, K, 0.2, 2.06, -0.3));
  [[-0.45, -0.8], [0.45, -0.8], [-0.45, 0.8], [0.45, 0.8]].forEach(([x, z]) => g.add(box(0.25, 1, 0.25, W, x, 0.5, z)));
  const head = new THREE.Group(); head.position.set(0, 1.8, 1.2); g.add(head);
  head.add(box(0.7, 0.7, 0.75, W, 0, 0, 0.1)); head.add(box(0.72, 0.36, 0.3, 0xf8bbd0, 0, -0.2, 0.55));
  [-1, 1].forEach(k => { head.add(sphere(0.06, 0x111111, k * 0.2, 0.15, 0.48, 4)); head.add(cone(0.07, 0.3, 0xfff3e0, k * 0.28, 0.45, 0, 5)); head.add(box(0.3, 0.12, 0.08, W, k * 0.48, 0.15, -0.05)); });
  const tail = new THREE.Group(); tail.position.set(0, 1.9, -1.1); tail.add(box(0.06, 0.8, 0.06, W, 0, -0.4, 0)); tail.add(box(0.14, 0.18, 0.14, K, 0, -0.85, 0)); g.add(tail);
  g.userData = { head, tail }; return compact(g);
}
function makeFish(c = 0xff8f00, s = 1) {
  const g = new THREE.Group(); const b = sphere(0.2, c, 0, 0, 0, 7); b.scale.set(0.55, 0.8, 1.4); g.add(b);
  g.add(cone(0.16, 0.25, c, 0, 0, -0.38, 4).rotateX(-Math.PI / 2)); [-1, 1].forEach(k => g.add(sphere(0.03, 0x111111, k * 0.09, 0.05, 0.18, 4)));
  g.scale.setScalar(s); return compact(g);
}
function makeBall(r = 0.5) {
  const g = new THREE.Group(); g.add(sphere(r, 0xffffff, 0, 0, 0, 10));
  [[0xe74c3c, 0], [0x0984e3, Math.PI / 3], [0xfeca57, -Math.PI / 3]].forEach(([c, a]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 1.005, r * 0.17, 4, 20), new THREE.MeshToonMaterial({ color: c })); t.rotation.y = a; g.add(t); });
  return compact(g);
}

export function installDetails(Level) {
  // Fähigkeiten und Biss erreichen auch die Spielereien
  const wrap = (name, fn) => { const orig = Level.prototype[name]; Level.prototype[name] = function (...a) { const r = orig.apply(this, a); fn.apply(this, a); return r; }; };
  wrap('onSpin', function (point, r, hit) { this._funSpin(point, r, hit); });
  wrap('onBark', function (point, fwd) { this._funBark(point, fwd); });
  wrap('onStomp', function (point) { this._funStomp(point); });
  wrap('onBite', function (point, r) { this._funBite(point, r); });

  Object.assign(Level.prototype, {
    // Nach dem Aufbau der Welt, vor dem Zusammenbacken: Bäume/Büsche/Beete merken, dann die Details der Welt bauen
    _initDetails() {
      this.sounds = []; this.funs = []; this.anims = []; this.ticks = []; this.drops = []; this.shakeables = []; this.flowerBeds = [];
      this._shakeAmp = [0, 0, 0]; SHAKE.uShake.value.forEach(v => v.set(0, 0, 0, 1)); this._said = {}; this._sniffT = 0;
      for (const grp of [this.group, ...this.zones.map(z => z.group)]) for (const m of grp.children) {
        const u = m.userData, { x, y, z } = m.position, sc = m.scale.x;
        if (u.tree) this.shakeables.push({ x, y, z, r: u.tree.r * sc, top: u.tree.top * sc, apples: u.tree.apples, fir: u.tree.fir, n: 0, cd: 0 });
        else if (u.bush) this.shakeables.push({ x, y, z, r: u.bush * 0.6, top: 1.2, bush: true, n: 0, cd: 0 });
        else if (u.flowers) this.flowerBeds.push({ x, y, z, r: u.flowers * sc });
      }
      const w = WORLDS[this.key]; if (w) w(this, this.game);
    },
    // Einmal pro Welt einen Hinweis zeigen
    once(id, text, ms) { if (this._said[id]) return; this._said[id] = true; this.game.toast(text, ms); },
    // Deko der Welt an einer Stelle wiederfinden (z. B. um sie zu animieren)
    findAt(x, y, z, eps = 0.05) {
      for (const grp of [this.group, ...this.zones.map(zo => zo.group)]) for (const m of grp.children) if (Math.abs(m.position.x - x) < eps && Math.abs(m.position.y - y) < eps && Math.abs(m.position.z - z) < eps) return m;
      return null;
    },
    // Ein Detail in den Bereich hängen, in dem es steht (ferne Bereiche blendet das Level aus)
    put(mesh, x, y, z, ry = 0) {
      let grp = this.group, best = Infinity;
      for (const zo of this.zones) { const d = Math.hypot(zo.x - x, zo.z - z); if (d < zo.r && d < best) { best = d; grp = zo.group; } }
      mesh.position.set(x, y, z); mesh.rotation.y = ry; grp.add(mesh); return mesh;
    },
    // Geräuschquelle: play = Effektname oder fn(lautstärke). r = Hörweite (Infinity = überall gleich laut), every = [min, max] Sekunden
    sound(x, y, z, play, o = {}) {
      const ev = o.every ?? [2, 5], s = { x, y, z, play, r: o.r ?? 14, vol: o.vol ?? 1, every: ev, t: o.t ?? Math.random() * (Array.isArray(ev) ? ev[1] : ev), on: o.on };
      this.sounds.push(s); return s;
    },
    ambience(play, every, vol, on) { return this.sound(0, 0, 0, play, { r: Infinity, every, vol, on }); },
    // Lautstärke für ein Geräusch an (x, y, z) – leiser mit der Entfernung zu Moll
    volAt(x, y, z, r = 16, vol = 1) { const p = this.game.player.pos, d = Math.hypot(x - p.x, y - p.y, z - p.z); return d > r ? 0 : vol * Math.pow(1 - d / r, 1.5); },
    sfxAt(name, x, y, z, r, vol, delay) { const v = this.volAt(x, y, z, r, vol); if (v > 0.02) this.game.audio.sfx(name, v, delay); },
    // Reagierendes Ding: o.spin / o.bark / o.stomp / o.bite / o.near = fn(f); r = Reichweite, barkR = Bell-Reichweite
    fun(x, y, z, o = {}) { const f = { x, y, z, r: 1.5, cd: 0, ...o }; this.funs.push(f); return f; },
    tween(dur, fn, done) { this.anims.push({ t: 0, dur, fn, done }); },

    _funSpin(point, r, hit) {
      for (const f of this.funs) if (f.spin && !hit.has(f) && Math.hypot(f.x - point.x, f.z - point.z) < r + f.r && Math.abs(f.y - point.y) < 2.5 + (f.h || 0)) { hit.add(f); f.spin(f); }
      for (const t of this.shakeables) if (!hit.has(t) && Math.hypot(t.x - point.x, t.z - point.z) < r + Math.min(t.r, 1.2) + 0.4 && point.y > t.y - 1 && point.y < t.y + t.top) { hit.add(t); this.shakeTree(t, t.bush ? 0.22 : 0.32, point); }
    },
    _funBark(point, fwd) {
      for (const f of this.funs) {
        if (!f.bark || f.cd > 0 || Math.abs(f.y - point.y) > 8) continue;
        const dx = f.x - point.x, dz = f.z - point.z, d = Math.hypot(dx, dz), rr = f.barkR ?? 12;
        if (d < rr && (d < 2 || (dx * fwd.x + dz * fwd.z) / d > 0.3)) { f.cd = f.barkCd ?? 1; f.bark(f, d); }
      }
      if (this.echo) { this.game.audio.sfx('woof', 0.32, 0.34); this.game.audio.sfx('woof', 0.12, 0.7); }
    },
    _funStomp(point) {
      for (const f of this.funs) if (f.stomp && Math.hypot(f.x - point.x, f.z - point.z) < f.r + 3 && Math.abs(f.y - point.y) < 3 + (f.h || 0)) f.stomp(f);
      for (const t of this.shakeables) if (!t.bush && Math.hypot(t.x - point.x, t.z - point.z) < t.r + 2 && Math.abs(t.y - point.y) < 2) { t.cd = 0; this.shakeTree(t, 0.2, point); }
    },
    _funBite(point) {
      for (const f of this.funs) if (f.bite && f.cd <= 0 && Math.hypot(f.x - point.x, f.z - point.z) < f.r + 1 && Math.abs(f.y - point.y) < 2.5 + (f.h || 0)) { f.cd = 0.6; f.bite(f); }
    },

    // ---- Bäume und Büsche durchschütteln: Laub wackelt (Shader), Blätter fliegen, Äpfel und Tannenzapfen fallen
    shakeTree(t, amp, point) {
      if (t.cd > 0) return; t.cd = 1.1;
      const k = this._shakeAmp.indexOf(Math.min(...this._shakeAmp)); this._shakeAmp[k] = amp; SHAKE.uShake.value[k].set(t.x, t.z, amp, t.r + 1.3);
      const g = this.game, cy = t.y + t.top * (t.bush ? 0.6 : 0.68);
      this.sfxAt('rustle', t.x, cy, t.z, 20, 0.9);
      g.fx.burst({ x: t.x, y: cy, z: t.z }, { n: t.bush ? 8 : 14, color: [0x3d9a3d, 0x5fc25f, 0x8bc34a, 0xcddc39], speed: 3, up: 1.5, life: 1.3, size: 0.2, gravity: -2.5, drag: 1.5, spread: t.r * 0.7 });
      if (t.apples) {
        if (t.n >= 5) { this.once('leer', 'Der Apfelbaum ist leergeschüttelt.'); return; }
        const n = t.n === 0 ? 2 : 1; t.n += n;
        for (let i = 0; i < n; i++) { const a = Math.random() * TAU, rr = t.r * rnd(0.4, 0.8); this._drop('apple', t.x + Math.cos(a) * rr, t.y + t.top * 0.6, t.z + Math.sin(a) * rr); }
        if (t.n === n) this.once('apfel', 'Plumps! Äpfel! Ein Apfel bringt ein Herz zurück.');
      } else if (t.fir && Math.random() < 0.35 && point) {
        this._drop('cone', point.x, Math.min(t.y + t.top * 0.5, point.y + 4), point.z, { bonk: true });
      } else if (!t.bush && Math.random() < 0.3 || t.bush && Math.random() < 0.15) { // ein Vogel flattert empört heraus
        this.sfxAt('flap', t.x, cy, t.z, 20, 0.8); this.sfxAt('chirp', t.x, cy, t.z, 20, 0.8, 0.15);
        g.fx.burst({ x: t.x, y: cy + 0.5, z: t.z }, { n: 6, color: [0xffffff, 0x95a5a6, 0x8d6e63], speed: 2, up: 3, life: 1.6, size: 0.12, gravity: -1, drag: 1 });
      }
    },
    _drop(kind, x, y, z, o = {}) {
      const m = kind === 'apple' ? apple() : pinecone(); this.put(m, x, y, z, Math.random() * TAU);
      let ground = Math.max(this.groundAt(x, z, y - 0.3), this.def.floorY ?? -50, -50); if (this.seaY !== undefined && ground < this.seaY) ground = this.seaY - 0.15;
      this.drops.push({ kind, m, x, y, z, vx: rnd(-0.6, 0.6), vy: rnd(0, 1.5), vz: rnd(-0.6, 0.6), ground, life: 25, rest: false, ...o });
    },
    _updateDrops(dt, pp) {
      const g = this.game, pl = g.player;
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        if (!d.rest) {
          d.vy -= 22 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.m.rotation.x += dt * 4;
          if (d.bonk && d.vy < 0 && Math.hypot(d.x - pp.x, d.z - pp.z) < 0.9 && Math.abs(d.y - (pp.y + 1.3)) < 0.5) { // Tannenzapfen auf den Kopf
            d.bonk = false; d.vy = 4; d.vx = rnd(-2, 2); d.vz = rnd(-2, 2); g.audio.sfx('bonk'); pl.squash = 0.35;
            g.fx.burst({ x: pp.x, y: pp.y + 1.6, z: pp.z }, { n: 8, color: [0xfff3a0, 0xffffff, 0xffd32a], speed: 2.5, up: 0.5, life: 0.6, size: 0.16, gravity: 0, flat: true });
            this.once('zapfen', 'TOCK! Ein Tannenzapfen auf den Kopf. Autsch … aber nur ein bisschen.');
          }
          if (d.y <= d.ground) {
            d.y = d.ground; if (d.vy < -3) { d.vy *= -0.35; d.vx *= 0.6; d.vz *= 0.6; this.sfxAt('plop', d.x, d.y, d.z, 14, 0.8); } else { d.rest = true; d.m.rotation.x = 0; }
          }
          d.m.position.set(d.x, d.y, d.z);
        }
        d.life -= dt;
        if (d.kind === 'apple' && d.vy <= 0 && Math.hypot(d.x - pp.x, d.z - pp.z) < 0.95 && d.y < pp.y + 0.7 && d.y > pp.y - 1) { // Mampf
          d.life = 0; g.audio.sfx('chomp'); g.fx.burst({ x: d.x, y: d.y + 0.3, z: d.z }, { n: 10, color: [0xe53935, 0xfff3e0, 0x8bc34a], speed: 3, up: 3, life: 0.5, size: 0.14 });
          if (pl.hp < g.maxHp()) { pl.hp++; g.updateHearts(); g.toast('Mampf! Ein knackiger Apfel – ♥ zurück!'); } else this.once('mampf', 'Mampf! Knackig und süß.');
        }
        if (d.life < 1) d.m.scale.setScalar(Math.max(0.01, d.life));
        if (d.life <= 0) { d.m.removeFromParent(); this.drops.splice(i, 1); }
      }
    },

    // ---- Ein Ball, den man anstupsen kann (Biss, Bellen, Trillern, Bauchklatscher)
    kickBall(x, z, r = 0.5) {
      const m = makeBall(r), y = Math.max(0, this.top(x, z)); this.put(m, x, y + r, z);
      const b = { m, x, y: y + r, z, vx: 0, vy: 0, vz: 0, r, rest: false };
      const kick = (k, up) => { b.rest = false; const p = this.game.player.pos, dx = b.x - p.x, dz = b.z - p.z, l = Math.hypot(dx, dz) || 1; b.vx = dx / l * k; b.vz = dz / l * k; b.vy = up; this.sfxAt('boing', b.x, b.y, b.z, 18, 0.9); };
      const f = this.fun(x, y, z, { r: r + 0.4, bite: () => kick(7, 6), bark: () => kick(9, 4), barkR: 6, barkCd: 0.4, spin: () => kick(10, 8), stomp: () => kick(4, 11), near: () => kick(3.5, 2), nearR: r + 0.9 });
      this.ticks.push(dt => {
        if (b.rest) return; // liegt still: kein Rechnen nötig
        b.vy -= 20 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
        const bd = this.bounds, gr = Math.max(this.groundAt(b.x, b.z, b.y), this.seaY ?? -Infinity, this.def.floorY ?? -50) + b.r;
        if (b.x < bd.min.x + 1 || b.x > bd.max.x - 1) b.vx *= -1; if (b.z < bd.min.z + 1 || b.z > bd.max.z - 1) b.vz *= -1;
        if (b.y < gr) { b.y = gr; if (b.vy < -2.5) { b.vy *= -0.55; this.sfxAt('plop', b.x, b.y, b.z, 14, 0.5); } else b.vy = 0; const fr = Math.pow(0.4, dt); b.vx *= fr; b.vz *= fr; }
        b.m.position.set(b.x, b.y, b.z); b.m.rotation.x += b.vz * dt / b.r; b.m.rotation.z -= b.vx * dt / b.r;
        f.x = b.x; f.y = b.y - b.r; f.z = b.z; if (b.vy === 0 && Math.hypot(b.vx, b.vz) < 0.05) b.rest = true;
      });
      return b;
    },
    // ---- Ein Vogel, der auf einem Pfosten sitzt und wegfliegt, wenn Moll kommt oder bellt
    perchBird(x, y, z, kind = 'seagull', s = 0.6) {
      const m = makeBird(kind); m.scale.setScalar(s); this.put(m, x, y, z, Math.random() * TAU);
      const u = m.userData, b = { away: false, t: 0 };
      const fly = () => {
        if (b.away) return; b.away = true; const a = Math.random() * TAU, ry = m.rotation.y;
        this.sfxAt('flap', x, y, z, 20, 0.9); if (kind === 'seagull') this.sfxAt('gull', x, y, z, 30, 0.8, 0.2);
        this.tween(3, k => { m.position.set(x + Math.cos(a) * k * 30, y + k * k * 14 + k * 3, z + Math.sin(a) * k * 30); m.rotation.y = lerp(ry, Math.atan2(Math.cos(a), Math.sin(a)), Math.min(1, k * 4)); u.wings.forEach((w, i) => w.rotation.z = Math.sin(k * 60) * 0.9 * (i ? -1 : 1)); },
          () => { m.visible = false; this.game.later(rnd(15000, 25000), () => { m.visible = true; m.position.set(x, y, z); u.wings.forEach(w => w.rotation.z = 0); b.away = false; }); });
      };
      this.fun(x, y, z, { bark: fly, barkR: 16, near: fly, nearR: 3.5, bite: fly });
      this.ticks.push((dt, t) => { if (!b.away && u.head) u.head.rotation.y = Math.sin(t * 0.7 + x) * 0.6; });
      return b;
    },
    // ---- Wanduhr mit Pendel, echten Uhrzeigern und (optional) Kuckuck. Bellen = Kuckuck ruft, Zeiger drehen durch
    wallClock(x, y, z, ry = 0, o = {}) {
      const m = makeClock(o.cuckoo !== false, o.s ?? 1), u = m.userData; this.put(m, x, y, z, ry);
      const c = { busy: false, fast: 0, tick: 0 };
      const cuckoo = () => {
        if (c.busy || !u.bird) return; c.busy = true; this.sfxAt('cuckoo', x, y, z, 30, 1, 0.25);
        this.tween(1.9, k => { const out = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1; u.bird.position.z = -0.05 + out * 0.38; u.bird.rotation.x = Math.sin(k * 25) * 0.25 * out; }, () => { c.busy = false; });
      };
      c.cuckoo = cuckoo;
      this.sound(x, y, z, v => { c.tick ^= 1; this.game.audio.sfx(c.tick ? 'tick' : 'tock', v); }, { every: 1, r: o.r ?? 12, vol: 0.9 });
      this.fun(x, y - 1.5, z, { h: 3, bark: () => { c.fast = 1.6; cuckoo(); if (o.say) this.once('uhr' + x, o.say, 3500); }, barkR: 14, barkCd: 2.5 });
      this.ticks.push((dt, t) => {
        const d = new Date(), mi = d.getMinutes() + d.getSeconds() / 60;
        if (c.fast > 0) { c.fast -= dt; c.spin = (c.spin || 0) + dt * 25; } else c.spin = 0;
        u.minute.rotation.z = -mi / 60 * TAU - c.spin; u.hour.rotation.z = -((d.getHours() % 12) + mi / 60) / 12 * TAU - c.spin / 12;
        u.pend.rotation.z = Math.sin(t * Math.PI) * 0.28;
      });
      if (u.bird && o.auto) this.sound(x, y, z, () => cuckoo(), { every: o.auto, r: 16, vol: 1 });
      return c;
    },
    // ---- Flackernde Flammen mit Knistern; Bellen facht das Feuer an
    fireplace(x, y, z, s = 1, o = {}) {
      const m = makeFlames(s), fl = m.userData.list; this.put(m, x, y, z);
      this.sound(x, y + 0.5, z, 'crackle', { every: [0.35, 0.8], r: o.r ?? 10, vol: o.vol ?? 0.9 });
      this.ticks.push((dt, t) => fl.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i * 2) * 0.12, 1 + Math.sin(t * 13 + i) * 0.22 + Math.sin(t * 7.3 + i * 3) * 0.12, 1); f.rotation.y = t * (1 + i * 0.5); }));
      if (o.bark !== false) this.fun(x, y, z, { bark: () => { this.sfxAt('crackle', x, y, z, 20, 1.2); this.game.fx.burst({ x, y: y + 0.8 * s, z }, { n: 30, color: [0xff9f43, 0xffd32a, 0xff5e57, 0xffffff], speed: 3, up: 6, life: 1, size: 0.14, gravity: -1, drag: 0.5 }); fl.forEach(f => f.scale.y = 2); this.once('feuer', o.say || 'Fffffft! Das Feuer lodert auf.'); }, barkR: 9 });
      return m;
    },
    // ---- Rauch (Schornstein, Grill, Lok): o.on() = nur wenn sichtbar
    puffs(x, y, z, o = {}) {
      const rate = o.rate ?? 2.5;
      this.ticks.push(dt => { if (o.on && !o.on()) return; if (Math.random() < dt * rate) this.game.fx.burst({ x: x + rnd(-0.2, 0.2), y, z: z + rnd(-0.2, 0.2) }, { n: 1, color: o.color ?? [0xdfe6e9, 0xb2bec3], speed: 0.3, up: o.up ?? 1.6, life: o.life ?? 2.2, size: o.size ?? 0.45, gravity: 0, drag: 0.3 }); });
    },
    // ---- Gummitier: quietscht beim Biss und hüpft
    squeaky(x, y, z, mesh, o = {}) {
      this.put(mesh, x, y, z, o.ry ?? Math.random() * TAU); const y0 = y;
      const hop = () => { this.game.audio.sfx('squeak'); this.tween(0.5, k => { mesh.position.y = y0 + Math.sin(k * Math.PI) * 0.8; mesh.rotation.y += 0.25; mesh.scale.y = 1 - Math.sin(k * Math.PI * 2) * 0.15; }); if (o.say) this.once('quietsch' + x, o.say); };
      this.fun(x, y, z, { r: 0.8, bite: hop, spin: hop, stomp: hop });
      return mesh;
    },

    updateDetails(dt) {
      const pp = this.game.player.pos, t = this.t;
      for (let k = 0; k < 3; k++) if (this._shakeAmp[k] > 0) { this._shakeAmp[k] *= Math.exp(-dt * 2.2); if (this._shakeAmp[k] < 0.005) this._shakeAmp[k] = 0; SHAKE.uShake.value[k].z = this._shakeAmp[k]; }
      for (const s of this.shakeables) if (s.cd > 0) s.cd -= dt;
      for (const s of this.sounds) {
        if ((s.t -= dt) > 0) continue;
        s.t = Array.isArray(s.every) ? rnd(s.every[0], s.every[1]) : s.every;
        if (s.on && !s.on(s)) continue;
        const v = s.r === Infinity ? s.vol : this.volAt(s.x, s.y, s.z, s.r, s.vol); if (v < 0.02) continue;
        typeof s.play === 'function' ? s.play(v, s) : this.game.audio.sfx(s.play, v);
      }
      for (const f of this.funs) {
        if (f.cd > 0) f.cd -= dt;
        if (f.near) { const ins = Math.hypot(f.x - pp.x, f.z - pp.z) < (f.nearR ?? 3) && Math.abs(f.y - pp.y) < 3; if (ins && !f.inside) f.near(f); f.inside = ins; }
      }
      for (let i = this.anims.length - 1; i >= 0; i--) { const a = this.anims[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); a.fn(k, dt); if (k >= 1) { this.anims.splice(i, 1); a.done && a.done(); } }
      for (const fn of this.ticks) fn(dt, t);
      this._updateDrops(dt, pp);
      // Lange an Blumen schnüffeln kitzelt in der Nase
      const pl = this.game.player, bed = pl.sniffing && this.flowerBeds.find(b => Math.hypot(b.x - pp.x, b.z - pp.z) < b.r + 1.2 && Math.abs(b.y - pp.y) < 1.5);
      if (bed) {
        this._sniffT += dt;
        if (this._sniffT > 1.3) {
          this._sniffT = -2.5; this.game.audio.sfx('sneeze'); pl.vel.y = 6; pl.squash = 0.4;
          this.game.fx.burst({ x: pp.x + Math.sin(pl.yaw) * 0.9, y: pp.y + 0.9, z: pp.z + Math.cos(pl.yaw) * 0.9 }, { n: 16, color: [0xfff3a0, 0xffd93d, 0xffffff], speed: 3, up: 2, life: 0.9, size: 0.12, gravity: -1, drag: 1 });
          this.once('hatschi', 'HATSCHI! Blumen kitzeln in der Nase.');
        }
      } else if (this._sniffT > 0) this._sniffT = 0; else if (this._sniffT < 0) this._sniffT = Math.min(0, this._sniffT + dt);
    },
  });
}

// =====================================================================================================================
// Die Details je Welt. Positionen passen zu den Bauplänen in src/worlds/*.js.
const outside = l => () => l.game.player.pos.x < 1000; // nicht in einem Innenraum abseits der Karte
const WORLDS = {
  // ---------------------------------------------------------------- Molls Garten
  hub(l, g) {
    // Kuckucksuhr im Wohnzimmer (Rückwand), Kamin knistert
    l.wallClock(0, 3.4, -23.36, 0, { auto: [45, 70], say: 'Kuckuck! Kuckuck! Die Uhr erschrickt sich.' });
    l.sound(-5.6, 0.8, -17, 'crackle', { every: [0.35, 0.8], r: 9 });
    l.fun(-5.6, 0.5, -17, { bark: () => { l.sfxAt('crackle', -5.6, 0.5, -17, 20, 1.2); g.fx.burst({ x: -5.5, y: 0.8, z: -17 }, { n: 26, color: [0xff9f43, 0xffd32a, 0xff5e57], speed: 2.5, up: 5, life: 0.9, size: 0.12, gravity: -1 }); l.once('kamin', 'Fffft! Der Kamin faucht zurück.'); }, barkR: 7 });
    // Wassernapf
    l.fun(-2.2, 0.3, -13.6, { r: 0.8, bite: () => { g.audio.sfx('slurp'); g.fx.burst({ x: -2.2, y: 0.5, z: -13.6 }, { n: 10, color: [0x9ad7ff, 0xffffff], speed: 2, up: 3, life: 0.5, size: 0.1 }); l.once('napf', 'Schlabber, schlabber – frisches Wasser!'); } });
    // Hundekörbchen: Bauchklatscher rein = Quietschen der Federn
    l.fun(-4.5, 0.45, -21.2, { r: 1.2, stomp: () => { g.audio.sfx('boing'); l.once('korb', 'Boing! Das Körbchen federt herrlich.'); } });
    // Briefkasten: Bellen klappt die Fahne hoch und ein Brief fliegt raus
    const flag = new THREE.Group(); flag.add(box(0.04, 0.4, 0.04, 0x636e72, 0, 0.2, 0)); flag.add(box(0.04, 0.16, 0.2, 0xe74c3c, 0, 0.34, 0.1)); l.put(flag, 4.28, 1.15, 4.1); flag.rotation.x = Math.PI / 2;
    const letters = ['Post für Moll: Werbung für Katzenfutter. Pfui!', 'Eine Postkarte von Opa Bruno: „Grüße vom Strand!“', 'Ein Brief vom Tierarzt … schnell wieder rein damit!', 'Ein Liebesbrief vom Pudel von nebenan. Hihi.', 'Ein Gutschein: „Einmal Bauchkraulen gratis“.'];
    let li = 0;
    l.fun(4, 1.3, 4, { bark: () => {
      g.audio.sfx('drawer'); l.tween(0.3, k => { flag.rotation.x = Math.PI / 2 * (1 - k); });
      g.fx.burst({ x: 4, y: 1.6, z: 4.3 }, { n: 3, color: 0xffffff, speed: 2, up: 5, life: 1.2, size: 0.3, gravity: -4, flat: true });
      g.toast(letters[li++ % letters.length], 3500); l.game.later(4000, () => { flag.rotation.x = Math.PI / 2; });
    }, barkR: 8, barkCd: 4 });
    // Gartenzwerge hüpfen beim Anbellen und kichern
    [[3, 0, 13], [-11, 0, 15], [-3, 0, -9.5]].forEach(([x, y, z]) => {
      const m = l.findAt(x, y, z); if (!m) return;
      l.fun(x, y, z, { bark: () => { l.sfxAt('giggle', x, 1, z, 16, 0.9, 0.1); l.tween(0.6, k => { m.position.y = Math.sin(k * Math.PI) * 0.9; m.rotation.y += 0.3; }); }, barkR: 9, barkCd: 1.5 });
    });
    // Frosch auf dem Seerosenblatt: quakt, springt beim Bellen ins Wasser und kommt später wieder
    const frog = makeFrog(); l.put(frog, -4, -0.14, 18, 0.5); let away = false;
    l.sound(-4, 0, 18, 'frog', { every: [3, 7], r: 16, on: () => !away });
    const jump = () => {
      if (away) return; away = true; g.audio.sfx('frog');
      const [x0, z0] = [frog.position.x, frog.position.z], x1 = x0 + rnd(-2, 2), z1 = z0 + rnd(1, 2);
      l.tween(0.6, k => frog.position.set(lerp(x0, x1, k), -0.14 + Math.sin(k * Math.PI) * 1.4, lerp(z0, z1, k)), () => {
        frog.visible = false; l.sfxAt('splish', x1, 0, z1, 16, 1); g.fx.burst({ x: x1, y: -0.2, z: z1 }, { n: 12, color: [0x9ad7ff, 0xffffff], speed: 2, up: 4, life: 0.6, size: 0.14 });
        g.later(9000, () => { const [x, z] = pick(l.lilies.map(p => [p.position.x, p.position.z])); frog.position.set(x, -0.14, z); frog.visible = true; away = false; });
      });
    };
    const ff = l.fun(-4, 0, 18, { bark: jump, barkR: 14, bite: jump, near: jump, nearR: 1.6 });
    l.ticks.push(() => { ff.x = frog.position.x; ff.z = frog.position.z; });
    // Vögel im Garten, am Vogelhaus besonders viele
    l.sound(52, 8.5, 30, 'chirp', { every: [1.5, 4], r: 22 });
    l.ambience('chirp', [5, 11], 0.18, outside(l));
    // Werkstatt im Schuppen: altes Radio auf der Werkbank (Biss = an/aus)
    const wx = 2000, radio = new THREE.Group();
    radio.add(box(1.2, 0.7, 0.5, 0x8d5a2b, 0, 0.35, 0)); radio.add(cyl(0.22, 0.22, 0.04, 0x3b2412, -0.25, 0.38, 0.25, 10).rotateX(Math.PI / 2)); radio.add(box(0.4, 0.15, 0.04, 0xfff3a0, 0.3, 0.45, 0.26)); radio.add(cyl(0.015, 0.015, 0.8, 0x95a5a6, 0.45, 1.0, 0, 4).rotateZ(-0.4));
    l.put(compact(radio), wx - 8, 1.6, -7.5);
    const tune = [0, 4, 7, 12, null, 9, 7, 4, 5, null, 9, null, 7, 4, 2, null, 0, 4, 7, 9, null, 12, 9, 7, 5, 4, 2, 4, 0, null, null, null];
    const rd = { on: false, t: 0, i: 0 };
    l.fun(wx - 8, 1.6, -7.5, { r: 1, bite: () => { rd.on = !rd.on; g.audio.sfx('click'); if (rd.on) l.once('radio', 'Radio Wuff FM 📻 – Musik für Hundeohren!'); } });
    l.ticks.push(dt => { if (!rd.on || Math.abs(g.player.pos.x - wx) > 20) return; rd.t -= dt; if (rd.t > 0) return; rd.t = 0.2; const n = tune[rd.i++ % tune.length]; if (n !== null) g.audio.note(n - 5, 'xylo', 0.9); if (rd.i % 4 === 1) g.audio.note(-17 + (Math.floor(rd.i / 8) % 2) * 5, 'marimba', 0.8); });
  },

  // ---------------------------------------------------------------- Erdgeschoss
  kueche(l, g) {
    // Standuhr im Flur tickt, Bellen = Gong
    const uhr = { busy: false };
    l.sound(53.5, 6, 56, v => { uhr.tk ^= 1; g.audio.sfx(uhr.tk ? 'tick' : 'tock', v); }, { every: 1.25, r: 15 });
    l.fun(53.5, 4, 56, { h: 5, bark: () => { [0, 1.3, 2.6].forEach(d => l.sfxAt('gong', 53.5, 7, 56, 40, 1, d)); l.once('gong', 'DONG! DONG! DONG! Die Standuhr schlägt.'); }, barkR: 14, barkCd: 4 });
    // Kamin im Wohnzimmer: Flammen und Knistern
    const logs = new THREE.Group(); [-0.5, 0.5].forEach(x => { const lg = cyl(0.16, 0.16, 1.4, 0x6d4421, x * 0.6, 0.16, 0, 6); lg.rotation.z = Math.PI / 2; lg.rotation.y = x * 0.8; logs.add(lg); }); l.put(compact(logs), -40, 0.02, -55.6);
    l.fireplace(-40, 0.2, -55.6, 0.9, { r: 13 });
    // Kühlschrank brummt; Biss = kalter Hauch
    l.sound(14, 2, -10, 'hum', { every: 1.2, r: 8, vol: 0.8 });
    l.fun(12, 1, -10, { r: 2.2, h: 3, bite: () => { g.audio.sfx('creak'); g.fx.burst({ x: 11.6, y: 2, z: -10 }, { n: 16, color: [0xdff9fb, 0xffffff], speed: 2, up: 1, life: 0.8, size: 0.2, gravity: 0 }); g.toast(pick(['Brrr, kalt! Und leider nur Senf drin.', 'Der Kühlschrank ist zu. Moll guckt sehr traurig.', 'Kalter Hauch … riecht nach Wurst!']), 2600); } });
    // Topf auf dem Herd: Deckel klappert, Dampf steigt auf
    const lid = new THREE.Group(); lid.add(cyl(1.18, 1.18, 0.08, 0xb2bec3, 0, 0, 0, 14)); lid.add(sphere(0.15, 0x2d3436, 0, 0.1, 0, 6)); l.put(compact(lid), 6, 2.14, -14);
    l.puffs(6, 2.4, -14, { color: [0xffffff, 0xdfe6e9], rate: 4, size: 0.35, life: 1.4 });
    l.sound(6, 2.2, -14, v => { g.audio.sfx('tick', v); g.audio.sfx('bubble', v * 0.6); l.tween(0.25, k => { lid.position.y = 2.14 + Math.sin(k * Math.PI) * 0.12; lid.rotation.z = Math.sin(k * 20) * 0.06; }); }, { every: [1.5, 3.5], r: 10 });
    // Toaster auf der Arbeitsplatte: Biss = Toast springt raus
    const toaster = new THREE.Group(); toaster.add(box(1.2, 0.75, 0.7, 0xdfe6e9, 0, 0.375, 0)); toaster.add(box(0.12, 0.2, 0.1, 0x2d3436, 0.65, 0.5, 0)); l.put(compact(toaster), -15, 1.4, -16.4);
    const slices = [-0.22, 0.22].map(x => { const s = box(0.5, 0.55, 0.08, 0xe0b46b, 0, 0, 0); l.put(s, -15 + x, 1.95, -16.4); return s; });
    l.fun(-15, 1.4, -16.4, { r: 1, bite: () => {
      g.audio.sfx('boing'); slices.forEach((s, i) => { const x0 = s.position.x, dx = (i ? 1 : -1) * rnd(0.3, 0.8); l.tween(0.9, k => { s.position.set(x0 + dx * k, 1.95 + Math.sin(k * Math.PI) * 2.2, -16.4 + k * 0.6); s.rotation.x = k * TAU; }, () => { s.position.set(x0, 1.95, -16.4); s.rotation.x = 0; }); });
      l.once('toast', 'PLOPP! Toast! … viel zu heiß für Hundeschnauzen.');
    } });
    // Bodenklavier im Wohnzimmer: Tasten spielen Töne. Wer „Alle meine Entchen“ spielt, bekommt Besuch.
    const keys = [], kx0 = -50, kz = -8.5, scale = [0, 2, 4, 5, 7, 9, 11, 12];
    for (let i = 0; i < 8; i++) { const k = box(1.15, 0.12, 3, 0xfafafa, 0, 0, 0); l.put(k, kx0 + i * 1.25, 0.06, kz); keys.push(k); }
    [0, 1, 3, 4, 5].forEach(i => l.put(box(0.6, 0.18, 1.6, 0x2d3436, 0, 0, 0), kx0 + i * 1.25 + 0.62, 0.09, kz - 0.7));
    l.put(box(10.4, 0.4, 0.3, 0x2d3436, 0, 0, 0), kx0 + 4.4, 0.2, kz - 1.65);
    const pi = { cur: -1, hist: [], duck: false }, ENTCHEN = '0,1,2,3,4,4';
    l.ticks.push(() => {
      const p = g.player.pos, i = Math.round((p.x - kx0) / 1.25), on = g.player.onGround && p.y < 0.6 && Math.abs(p.z - kz) < 1.5 && i >= 0 && i < 8 && Math.abs(p.x - (kx0 + i * 1.25)) < 0.6;
      const key = on ? i : -1;
      if (key !== pi.cur) {
        if (pi.cur >= 0) keys[pi.cur].position.y = 0.06;
        pi.cur = key;
        if (key >= 0) {
          keys[key].position.y = 0.0; g.audio.note(scale[key] - 12, 'marimba', 1.6); l.once('klavier', 'Ein Bodenklavier! Kennst du „Alle meine Entchen“? 🎵', 3500);
          pi.hist.push(key); if (pi.hist.length > 6) pi.hist.shift();
          if (!pi.duck && pi.hist.join() === ENTCHEN) {
            pi.duck = true; g.audio.sfx('quack', 1, 0.3); g.toast('🎵 Alle meine Entchen … QUAK! Ein Entchen kommt angewackelt!', 3500);
            const d = makeDuck(); l.put(d, kx0 + 4.4, 0, kz + 3); g.fx.burst({ x: kx0 + 4.4, y: 1, z: kz + 3 }, { n: 30, color: [0xffd32a, 0xff9ff3, 0x48dbfb, 0xffffff], speed: 5, up: 6, life: 1, size: 0.18 });
            l.squeaky(kx0 + 4.4, 0, kz + 3, d, { say: 'Quietsch! Das Entchen quakt zurück.' }); l.sound(kx0 + 4.4, 0, kz + 3, 'quack', { every: [6, 12], r: 10 });
          }
        }
      }
    });
    // Quietschknochen im Wohnzimmer
    const bone = new THREE.Group(); bone.add(box(0.8, 0.16, 0.16, 0xff7675, 0, 0.12, 0)); [-1, 1].forEach(k => [-1, 1].forEach(j => bone.add(sphere(0.13, 0xff7675, k * 0.42, 0.12, j * 0.1, 6))));
    l.squeaky(-30, 0, 4, compact(bone), { say: 'Quietsch! Moll liebt dieses Geräusch.' });
    // Waschmaschine im Keller: Trommel dreht sich, Bauchklatscher = Schleudergang
    const kx = 2000, drum = new THREE.Group(); drum.add(cyl(1.0, 1.0, 0.06, 0x5d7fa3, 0, 0, 0, 14).rotateX(Math.PI / 2)); [[0.5, 0.2, 0xff7675], [-0.4, -0.35, 0xfdcb6e], [0.1, -0.6, 0xffffff]].forEach(([x, y, c]) => drum.add(sphere(0.2, c, x, y, 0.05, 5)));
    const dr = l.put(compact(drum), kx - 12, 2, -7.78); let schleudern = 0;
    l.sound(kx - 12, 2, -8, 'brrr', { every: 1.05, r: 11, vol: 0.7 });
    l.ticks.push(dt => { schleudern = Math.max(0, schleudern - dt); dr.rotation.z += dt * (2 + schleudern * 8); });
    l.fun(kx - 12, 0, -10, { r: 2.5, h: 4, stomp: () => {
      schleudern = 3; g.audio.sfx('brrr'); g.audio.sfx('gurgle', 0.7, 0.4); l.once('schleudern', 'SCHLEUDERGANG! Die Waschmaschine hüpft vor Freude.');
      g.fx.burst({ x: kx - 12, y: 4, z: -9 }, { n: 24, color: [0xffffff, 0xdff9fb, 0x9ad7ff], speed: 2.5, up: 3, life: 1.5, size: 0.3, gravity: -0.5, drag: 1 });
    } });
  },

  // ---------------------------------------------------------------- Einkaufsstraße
  strasse(l, g) {
    // Mülltonnen: Bellen = Deckel fliegt hoch, Katze bzw. Ratte guckt raus
    [[-10, 'cat'], [10, 'rat']].forEach(([x, who]) => {
      const lid = cyl(0.78, 0.78, 0.12, 0x636e72, 0, 0, 0, 10); l.put(lid, x, 1.46, 0);
      const head = new THREE.Group();
      if (who === 'cat') { head.add(sphere(0.35, 0x3b3b3b, 0, 0, 0, 7)); [-1, 1].forEach(k => { head.add(cone(0.12, 0.25, 0x3b3b3b, k * 0.2, 0.32, 0, 4)); head.add(sphere(0.06, 0xffeb3b, k * 0.13, 0.05, 0.3, 4)); }); }
      else { head.add(sphere(0.25, 0x8d8d8d, 0, 0, 0, 7)); head.add(cone(0.12, 0.3, 0x8d8d8d, 0, -0.02, 0.3, 5).rotateX(Math.PI / 2)); [-1, 1].forEach(k => { head.add(sphere(0.12, 0xffab91, k * 0.2, 0.22, 0, 5)); head.add(sphere(0.04, 0x111111, k * 0.09, 0.08, 0.2, 4)); }); }
      const h = l.put(compact(head), x, 0.9, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2); h.visible = false;
      l.fun(x, 0.5, 0, { r: 1, h: 1, barkR: 10, barkCd: 3, bite: f => f.bark(f), bark: () => {
        g.audio.sfx('drawer'); l.sfxAt(who === 'cat' ? 'meow' : 'squeak', x, 1.5, 0, 20, 1, 0.3); h.visible = true;
        l.tween(2.4, k => { const up = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1; lid.position.y = 1.46 + Math.sin(Math.min(1, k * 2.5) * Math.PI) * 2.2; lid.rotation.x = Math.min(1, k * 2.5) * TAU; h.position.y = 0.9 + up * 0.8; }, () => { h.visible = false; lid.position.y = 1.46; lid.rotation.x = 0; });
        l.once('tonne' + who, who === 'cat' ? 'MIAU! Eine Katze in der Mülltonne – sie faucht empört.' : 'Fiep! Eine Ratte! Sie winkt kurz und taucht wieder ab.');
      } });
    });
    // Ladentüren: Biss = Türglocke und was es drinnen gibt
    [[-17.8, -24, 'Der Metzger winkt mit einer Wurst … und macht die Tür wieder zu.'], [-17.8, -8, 'Bimmel! Es duftet nach frischen Brötchen.'], [-17.8, 10, 'Bimmel! Fischgeruch … Moll leckt sich die Schnauze.'],
      [17.8, -24, 'Bimmel! Jemand bestellt einen Puppuccino.'], [17.8, -8, 'Bimmel! „Mit alles und scharf?“ – Moll nickt eifrig.'], [17.8, 10, 'Bimmel! Die Pommes zischen im Fett.']].forEach(([x, z, t]) =>
      l.fun(x, 0.5, z, { r: 1.6, h: 1, bite: f => { f.cd = 2; g.audio.sfx('chime'); if (t.includes('Pommes')) g.audio.sfx('sizzle', 0.8, 0.3); g.toast(t, 3000); } }));
    // Brunnenplatz: Fontänen plätschern
    l.sound(-110, 1, 0, 'splish', { every: [0.25, 0.6], r: 26, vol: 0.35 });
    // Baustelle: Betonmischer dreht sich und brummt, Trillern macht ihn schneller; Dixi-Klo ist besetzt
    const mixer = l.findAt(124, 0, 10); let mix = 0;
    if (mixer) { l.ticks.push(dt => { mix = Math.max(0, mix - dt * 0.5); mixer.rotateY(dt * (1.5 + mix * 6)); }); l.fun(124, 0, 10, { r: 1.5, spin: () => { mix = 3; g.audio.sfx('whirl'); } }); }
    l.sound(124, 1, 10, 'brrr', { every: 1.05, r: 14, vol: 0.6 });
    l.fun(116, 18.5, -3, { r: 1.8, h: 1, bite: f => { f.cd = 3; g.audio.sfx('gurgle'); g.toast(pick(['BESETZT!', 'Eine Stimme aus dem Klo: „Moment noch!“', 'Plätscher … „Ist ja gut, ich bin gleich fertig!“']), 2500); } });
    // Bahnhof: Lok pfeift beim Anbellen und dampft, Bahnhofsuhr mit echten Zeigern und Glocke
    l.puffs(-32.5, 5.6, 110, { rate: 1.5, size: 0.6 });
    l.fun(-31, 1, 110, { h: 3, bark: () => { l.sfxAt('toot', -31, 4, 110, 60, 1, 0.3); for (let i = 0; i < 6; i++) g.fx.burst({ x: -32.5, y: 5.8, z: 110 }, { n: 2, color: [0xffffff, 0xdfe6e9], speed: 1, up: 3 + i * 0.5, life: 2, size: 0.8, gravity: 0, drag: 0.5 }); l.once('lok', 'TUUUT! Die Lok grüßt zurück.'); }, barkR: 18, barkCd: 3 });
    const hands = new THREE.Group(), hh = new THREE.Group(), mm = new THREE.Group(); hh.add(box(0.14, 0.7, 0.05, 0x2d3436, 0, 0.3, 0)); mm.add(box(0.1, 1.1, 0.05, 0x2d3436, 0, 0.5, 0)); hands.add(hh, mm); l.put(hands, 20, 13, 121.25, Math.PI);
    l.ticks.push(() => { const d = new Date(), mi = d.getMinutes() + d.getSeconds() / 60; mm.rotation.z = -mi / 60 * TAU; hh.rotation.z = -((d.getHours() % 12) + mi / 60) / 12 * TAU; });
    l.fun(20, 7, 124, { h: 8, bark: () => { [0, 1.2].forEach(d => l.sfxAt('gong', 20, 13, 121, 60, 1, d)); }, barkR: 22, barkCd: 4 });
    // Tauben gurren nicht, aber Spatzen zwitschern
    l.ambience('chirp', [6, 12], 0.15, outside(l));
  },

  // ---------------------------------------------------------------- Hochhaus
  buero(l, g) {
    const F1 = 12, F2 = 24, cx = 2000;
    // Bürouhr im Großraumbüro: Bellen = Zeiger rasen, „Feierabend!“
    l.wallClock(0, 6, -31.3, 0, { cuckoo: false, s: 1.4, say: 'Die Bürouhr rattert: FEIERABEND! … ach nee, doch nicht.' });
    // Telefon klingelt ab und zu; Biss = abheben
    const ph = new THREE.Group(); ph.add(box(0.7, 0.2, 0.5, 0xd63031, 0, 0.1, 0)); ph.add(box(0.3, 0.06, 0.3, 0xffffff, 0.12, 0.22, 0)); const hs = box(0.7, 0.14, 0.18, 0xd63031, 0, 0.3, -0.12); ph.add(hs); ph.userData = { hs };
    const phone = l.put(compact(ph), -16.8, 1.4, -11.8, 0.3), pz = { ring: 0 };
    l.sound(-16.8, 1.6, -11.8, v => { pz.ring = 2.2; g.audio.sfx('ring', v); g.audio.sfx('ring', v, 0.6); }, { every: [16, 28], r: 16 });
    l.ticks.push(dt => { if (pz.ring > 0) { pz.ring -= dt; hs.position.y = 0.3 + Math.abs(Math.sin(pz.ring * 40)) * 0.06; phone.rotation.z = Math.sin(pz.ring * 50) * 0.03; } else { hs.position.y = 0.3; phone.rotation.z = 0; } });
    const calls = ['„Hallo? Hier ist die Katze vom Erdgeschoss. Miau!“ – Klick.', '„Spreche ich mit dem Chef?“ – „Wuff!“ – „Oh, Entschuldigung.“', '„Ihre Leckerli-Lieferung kommt morgen.“ Juhu!', '„Haben Sie Interesse an einem neuen Staubsauger?“ – NEIN!', 'Tuuut … tuuut … niemand dran.'];
    l.fun(-16.8, 1.4, -11.8, { r: 1, bite: f => { f.cd = 2; g.audio.sfx('click'); g.toast(pz.ring > 0 ? pick(calls.slice(0, 4)) : calls[4], 3500); pz.ring = 0; } });
    // Kopierer: Biss = Papierregen
    const copies = ['Brrrt! 50 Kopien von Molls Pfote.', 'Brrrt! Der Kopierer druckt ein Foto von Molls Po. Peinlich!', 'Papierstau. Natürlich.'];
    let ci = 0; l.fun(-12, F1, 18, { r: 1.8, h: 2, bite: f => { f.cd = 1.5; g.audio.sfx('brrr'); g.fx.burst({ x: -12, y: F1 + 2.2, z: 18 }, { n: 12, color: 0xffffff, speed: 3, up: 5, life: 1.6, size: 0.35, gravity: -3, flat: true, drag: 1 }); g.toast(copies[ci++ % copies.length], 2800); } });
    // Aquarium beim Chef: Fische schwimmen, Bellen erschreckt sie
    const fish = [0xff8f00, 0xe84393, 0x00cec9].map((c, i) => { const f = makeFish(c, 0.7); l.put(f, cx - 10, 1, -8.12); return { m: f, a: i * 2, y: 0.6 + i * 0.6, v: 0.6 + i * 0.2 }; });
    let panic = 0;
    l.ticks.push(dt => { panic = Math.max(0, panic - dt); for (const f of fish) { f.a += dt * f.v * (1 + panic * 3); const x = Math.sin(f.a) * 1.6; f.m.position.set(cx - 10 + x, f.y + Math.sin(f.a * 2.3) * 0.15, -8.12); f.m.rotation.y = Math.cos(f.a) > 0 ? Math.PI / 2 : -Math.PI / 2; } });
    l.sound(cx - 10, 1.5, -9, 'bubble', { every: [0.6, 1.5], r: 8, vol: 0.6 });
    l.fun(cx - 10, 0, -9, { h: 2, bark: () => { panic = 2.5; l.once('fische', 'Die Fische flitzen erschrocken im Kreis!'); }, barkR: 10 });
    // Serverraum brummt; Bellen = Fehlermeldung
    l.sound(0, F2 + 3, -18, 'hum', { every: 1.2, r: 14, vol: 0.9 });
    l.fun(-2, F2, -18, { r: 6, h: 6, bark: () => { g.audio.sfx('ring', 0.6); g.toast(pick(['SERVER: „ERROR 404 – Leckerli nicht gefunden.“', 'SERVER: „Bitte nicht anbellen, ich rechne gerade.“', 'SERVER: „Neustart in 3 … 2 … 1 … WUFF.“']), 3000); }, barkR: 9, barkCd: 3 });
    // Kaffeemaschine dampft und blubbert
    l.puffs(12, F2 + 3.7, 22, { rate: 2, size: 0.3, life: 1.6 });
    l.sound(12, F2 + 2.5, 22, 'gurgle', { every: [5, 9], r: 8 });
  },

  // ---------------------------------------------------------------- Grillpark
  park(l, g) {
    // Grills: Rauch, Brutzeln, Bellen = Stichflamme
    [[-6, -6], [6, 6]].forEach(([x, z]) => {
      l.puffs(x, 1.5, z, { rate: 3, size: 0.5 });
      l.sound(x, 1.3, z, 'sizzle', { every: [0.6, 1.2], r: 12, vol: 0.7 });
      l.fun(x, 0, z, { r: 1.2, h: 1, bark: () => { l.sfxAt('crackle', x, 1.3, z, 20, 1.2); g.fx.burst({ x, y: 1.5, z }, { n: 26, color: [0xff9f43, 0xffd32a, 0xff5e57], speed: 1.5, up: 6, life: 0.7, size: 0.22, gravity: 0 }); l.once('grill', 'WUSCH! Stichflamme – die Würstchen sind jetzt extra knusprig.'); }, barkR: 8, barkCd: 2 });
    });
    l.kickBall(-18, 22, 0.55);
    // Schaukel: Trillern stößt sie an
    const sw = l.findAt(110, 0, -20);
    if (sw) {
      sw.children[3].visible = false; const piv = new THREE.Group(); [-0.4, 0.4].forEach(x => piv.add(box(0.04, 2.5, 0.04, 0x95a5a6, x, -1.25, 0))); piv.add(box(0.9, 0.08, 0.4, 0xd63031, 0, -2.5, 0)); l.put(compact(piv), 110, 3.2, -20);
      const s = { a: 0, amp: 0 };
      l.ticks.push(dt => { s.amp *= Math.exp(-dt * 0.35); s.a += dt * 2.2; piv.rotation.x = Math.sin(s.a) * s.amp; });
      l.fun(110, 0, -20, { r: 1.5, spin: () => { s.amp = Math.min(1.1, s.amp + 0.6); l.sfxAt('creak', 110, 2, -20, 16, 0.8); }, stomp: () => { s.amp = 0.8; } });
      l.sound(110, 2, -20, 'creak', { every: 2.85, r: 12, vol: 0.5, on: () => s.amp > 0.25 });
    }
    // Karussell: Trillern dreht es
    const car = new THREE.Group(); [0xe74c3c, 0xfeca57, 0x0984e3, 0x00b894].forEach((c, i) => { const a = i / 4 * TAU, arm = box(2.6, 0.12, 0.12, 0xffffff, Math.cos(a) * 1.3, 0.9, Math.sin(a) * 1.3); arm.rotation.y = -a; car.add(arm); car.add(sphere(0.3, c, Math.cos(a) * 2.6, 0.9, Math.sin(a) * 2.6, 6)); });
    const cm = l.put(compact(car), 112, 0.4, 8); let cs = 0;
    l.ticks.push(dt => { cs *= Math.exp(-dt * 0.4); cm.rotation.y += cs * dt; });
    l.fun(112, 0.4, 8, { r: 3, spin: () => { cs = Math.min(9, cs + 4); g.audio.sfx('whirl', 0.7); l.once('karussell', 'Wiiiiie! Das Karussell dreht sich.'); } });
    // Enten auf dem See (critters.js) quaken, Bellen = empörtes Geschnatter
    l.sound(-10, 0, 100, 'quack', { every: [4, 9], r: 30 });
    l.fun(-10, 0, 100, { r: 25, bark: () => { g.audio.sfx('quack', 0.9, 0.2); g.audio.sfx('quack', 0.6, 0.6); l.sfxAt('flap', -10, 0, 100, 40, 0.8, 0.1); }, barkR: 30, barkCd: 3 });
    const boat = l.findAt(-14, -0.1, 88); if (boat) l.ticks.push((dt, t) => { boat.position.y = -0.1 + Math.sin(t * 1.3) * 0.06; boat.rotation.z = Math.sin(t * 0.9) * 0.05; });
    // Specht im Wald, Vögel überall
    l.sound(-100, 6, 10, v => { for (let i = 0; i < 8; i++) g.audio.sfx('tock', v, i * 0.07); }, { every: [7, 14], r: 50 });
    l.ambience('chirp', [4, 9], 0.2);
  },

  // ---------------------------------------------------------------- Badebucht
  strand(l, g) {
    l.ambience('wave', [2.6, 4.2], 0.4, () => g.player.pos.y > -1 && g.player.pos.y < 14 && !l._uw);
    l.ambience('gull', [7, 15], 0.2, () => !l._uw);
    l.kickBall(-16, -77, 0.6); l.kickBall(12, -92, 0.45);
    // Rettungsschwimmer Rex mag kein Gebell am Badestrand
    l.fun(7, 6, -121, { r: 1.5, bark: () => { g.audio.sfx('whistle', 1, 0.2); g.toast(pick(['Rex: „PFIFF! Bellen nur bei Haialarm!“', 'Rex: „Psst, die Badegäste dösen!“']), 3000); }, barkR: 12, barkCd: 4 });
    // Möwen auf dem Pier-Geländer
    [[63, 4.05, -40], [57, 4.05, -10], [63, 4.05, 14]].forEach(([x, y, z]) => l.perchBird(x, y, z, 'seagull', 0.55));
  },

  // ---------------------------------------------------------------- Hafen
  hafen(l, g) {
    const SEA = l.seaY ?? 1.3;
    l.ambience('gull', [6, 13], 0.22, () => !l._uw);
    l.ambience('creak', [8, 15], 0.15, outside(l));
    l.ambience('wave', [3.5, 6], 0.2, () => !l._uw && g.player.pos.x < 1000);
    // Schiffsglocke am Kai
    const bell = new THREE.Group(); bell.add(cyl(0.12, 0.12, 2.6, 0x5d4037, 0, 1.3, 0, 6)); bell.add(box(1, 0.12, 0.12, 0x5d4037, 0.4, 2.55, 0));
    const bp = new THREE.Group(); bp.position.set(0.8, 2.5, 0); bp.add(cone(0.35, 0.6, 0xf1c40f, 0, -0.35, 0, 10)); bp.add(sphere(0.08, 0xb8860b, 0, -0.68, 0, 5)); bell.add(bp); bell.userData = { bp };
    const bm = l.put(compact(bell), 2, 2, 27.2); let swing = 0;
    const ring = () => { swing = 1; l.sfxAt('chime', 2.8, 4, 27.2, 40, 1); l.sfxAt('chime', 2.8, 4, 27.2, 40, 0.6, 0.6); };
    l.ticks.push((dt, t) => { swing *= Math.exp(-dt * 1.2); bm.userData.bp.rotation.z = Math.sin(t * 8) * 0.5 * swing; });
    l.fun(2.8, 2, 27.2, { r: 1, h: 2, bite: ring, bark: ring, barkR: 8, barkCd: 1.2, spin: ring });
    // Frachtschiff antwortet aufs Bellen mit dem Horn
    l.puffs(76, 15.2, 92, { rate: 1.5, size: 0.7, color: [0x636e72, 0x95a5a6] });
    l.fun(60, 6.4, 92, { r: 22, h: 6, bark: () => { l.sfxAt('horn', 60, 8, 92, 90, 1, 0.6); for (let i = 0; i < 5; i++) g.fx.burst({ x: 76, y: 15.5, z: 92 }, { n: 2, color: [0x636e72, 0xb2bec3], speed: 1, up: 4 + i, life: 2.5, size: 1, gravity: 0, drag: 0.4 }); l.once('horn', 'TUUUUUT! Das Frachtschiff hupt zurück.'); }, barkR: 45, barkCd: 4 });
    // Bojen schaukeln
    [[-5, 45], [10, 60], [25, 72], [15, 88], [-2, 100]].forEach(([x, z], i) => {
      const a = l.findAt(x + 2.2, SEA - 0.4, z), b = l.findAt(x + 2.2, SEA + 0.6, z);
      l.ticks.push((dt, t) => { const dy = Math.sin(t * 1.6 + i) * 0.15, rz = Math.sin(t * 1.1 + i) * 0.08; if (a) { a.position.y = SEA - 0.4 + dy; a.rotation.z = rz; } if (b) { b.position.y = SEA + 0.6 + dy; b.rotation.z = rz; } });
    });
    // Möwen auf den Pollern
    [[-16, 3.1, 0], [16, 3.1, 20]].forEach(([x, y, z]) => l.perchBird(x, y, z, 'seagull', 0.5));
    // Fischmarkt: ein Fisch zappelt auf dem Stand
    const mx = 3000, f = makeFish(0x74b9ff, 1.4); l.put(f, mx + 1, 1.25, 4); f.rotation.z = Math.PI / 2;
    const flop = (big) => l.tween(big ? 1 : 0.4, k => { f.position.y = 1.25 + Math.abs(Math.sin(k * Math.PI * (big ? 3 : 1))) * (big ? 0.8 : 0.35); f.rotation.y = Math.sin(k * 20) * 0.6; });
    l.sound(mx + 1, 1.3, 4, v => { flop(false); g.audio.sfx('splish', v * 0.5); }, { every: [2, 5], r: 12 });
    l.fun(mx + 1, 1.1, 4, { r: 1, bite: f2 => { f2.cd = 2; flop(true); g.audio.sfx('splish'); g.toast(pick(['Fritz: „Pfoten weg von meinem Fisch!“', 'Der Fisch zappelt Moll eine Ohrfeige. Platsch!']), 2800); } });
  },

  // ---------------------------------------------------------------- Dorf
  dorf(l, g) {
    // Kirchturm: Glocke schlägt ab und zu, Bellen = Geläut
    l.sound(30, 9, -30, 'gong', { every: [35, 50], r: 70, vol: 0.8 });
    l.fun(30, 0, -30, { r: 2.5, h: 10, bark: () => { [0, 1, 2, 3].forEach(d => l.sfxAt('gong', 30, 9, -30, 70, 1, d * 0.9)); l.once('kirche', 'BIMM BAMM! Die Kirchenglocke läutet für Moll.'); }, barkR: 26, barkCd: 5 });
    // Brunnen auf dem Marktplatz: Echo beim Hineinbellen, ab und zu springt ein Goldfisch
    l.fun(0, 0.6, 0, { r: 2.8, h: 1, barkR: 6, barkCd: 1.5, bark: () => { g.audio.sfx('woof', 0.4, 0.4); g.audio.sfx('woof', 0.18, 0.8); g.audio.sfx('woof', 0.07, 1.2); l.once('echo', 'Wuff … wuff … wuff! Der Brunnen bellt zurück.'); },
      bite: () => { g.audio.sfx('splish'); g.fx.burst({ x: 0, y: 1.3, z: 0 }, { n: 14, color: [0x9ad7ff, 0xffffff], speed: 3, up: 4, life: 0.6, size: 0.14 }); } });
    const gf = makeFish(0xff9f43, 0.9); l.put(gf, 0, 1, 0); gf.visible = false;
    l.sound(0, 1, 0, () => { const a = Math.random() * TAU, [x0, z0, x1, z1] = [Math.cos(a) * 1.8, Math.sin(a) * 1.8, -Math.cos(a) * 1.8, -Math.sin(a) * 1.8]; gf.visible = true; l.sfxAt('splish', x0, 1, z0, 14, 0.6);
      l.tween(0.8, k => { gf.position.set(lerp(x0, x1, k), 1.1 + Math.sin(k * Math.PI) * 1.4, lerp(z0, z1, k)); gf.lookAt(lerp(x0, x1, k + 0.05), 1.1 + Math.sin((k + 0.05) * Math.PI) * 1.4, lerp(z0, z1, k + 0.05)); }, () => { gf.visible = false; l.sfxAt('splish', x1, 1, z1, 14, 0.6); }); }, { every: [6, 12], r: 16 });
    // Windmühle: Trillern am Mühlenfuß lässt die Flügel sausen
    let boost = 0; l.ticks.push(dt => { boost *= Math.exp(-dt * 0.5); if (l.mill) l.mill.rotation.z += dt * boost; });
    l.fun(0, 14, -105, { r: 4.2, spin: () => { boost = Math.min(10, boost + 5); l.sfxAt('creak', 0, 18, -105, 30, 1); l.once('muehle', 'Wusch! Die Mühlenflügel sausen im Trillerwind.'); } });
    // Hühner gackern, Kuh muht – Bellen erschreckt beide
    l.sound(110, 0.5, 28, 'cluck', { every: [2, 5], r: 22 });
    l.fun(110, 0, 28, { r: 11, bark: () => { [0, 0.15, 0.4].forEach(d => l.sfxAt('cluck', 110, 0.5, 28, 30, 1, d)); g.fx.burst({ x: 110, y: 1, z: 28 }, { n: 16, color: [0xffffff, 0xfff3e0], speed: 3, up: 3, life: 1.5, size: 0.14, gravity: -1, drag: 1, spread: 8 }); }, barkR: 18, barkCd: 2 });
    const cow = makeCow(), cu = cow.userData, cy = Math.max(0, l.top(86, -40)); l.put(cow, 86, cy, -40, 2.2);
    const moo = () => { l.sfxAt('moo', 86, cy + 2, -40, 40, 1); l.tween(1.2, k => { cu.head.rotation.x = -Math.sin(k * Math.PI) * 0.5; cow.position.y = cy + (k < 0.3 ? Math.sin(k / 0.3 * Math.PI) * 0.6 : 0); }); };
    l.sound(86, cy + 2, -40, () => moo(), { every: [14, 26], r: 30 });
    l.fun(86, cy, -40, { r: 1.8, h: 2, bark: moo, barkR: 14, barkCd: 2.5, stomp: moo, bite: f => { f.cd = 3; moo(); g.toast('Muh? Die Kuh leckt Moll einmal quer übers Gesicht. Schlabber!', 3000); } });
    l.ticks.push((dt, t) => { cu.tail.rotation.z = Math.sin(t * 2.3) * 0.4; });
    // Bäckerei: Ofen glüht und knistert, Biss = heiß!
    const oven = l.findAt(2291, 1.4, -4.9);
    if (oven) { oven.material = oven.material.clone(); oven.material.emissive = new THREE.Color(0xff5722); l.ticks.push((dt, t) => { oven.material.emissiveIntensity = 0.45 + Math.sin(t * 7) * 0.12 + Math.sin(t * 13.7) * 0.08; }); }
    l.sound(2291, 1.4, -5, 'crackle', { every: [0.4, 0.9], r: 10 });
    l.fun(2291, 0, -5, { r: 2, h: 2, bite: f => { f.cd = 2; g.audio.sfx('sizzle'); g.toast('Heiß, heiß, heiß! Moll pustet sich auf die Schnauze.', 2600); } });
    // Angler am Teich mag kein Gebell
    l.fun(-100, 0.3, 17, { r: 1.5, bark: () => g.toast('Angler Anton: „Pssst! Du verscheuchst ja alle Fische!“', 3000), barkR: 10, barkCd: 5 });
    // Abends: Grillen zirpen, Frösche quaken am Teich
    l.sound(-105, 0, 0, 'frog', { every: [2, 5], r: 34 });
    l.ambience('cricket', [1.2, 2.8], 0.14, outside(l));
  },

  // ---------------------------------------------------------------- Kanal
  kanal(l, g) {
    l.echo = true; // jedes Bellen hallt durch die Röhren
    l.ambience('drip', [0.6, 1.8], 0.3);
    l.ambience('squeak', [18, 35], 0.08);
    l.ambience('gurgle', [7, 14], 0.2);
    l.sound(0, 5, -48, 'hum', { every: 1.2, r: 18 });
    // Gummiente schwimmt in der Brühe-Rinne
    const duck = makeDuck(); l.put(duck, 3, 0.06, 0); const df = l.fun(3, 0.06, 0, { r: 1.2, h: 1 }); let spin = 0;
    const squeak = () => { g.audio.sfx('squeak'); spin = 2; l.once('ente', 'Quietsch! Eine Gummiente im Kanal. Wer die wohl verloren hat?'); };
    df.bite = squeak; df.spin = squeak; df.bark = () => { g.audio.sfx('quack', 0.8, 0.3); spin = 1.5; }; df.barkR = 10;
    l.ticks.push((dt, t) => { spin = Math.max(0, spin - dt); const z = Math.sin(t * 0.07) * 22; duck.position.set(3 + Math.sin(t * 0.5) * 0.4, 0.06 + Math.sin(t * 2) * 0.03, z); duck.rotation.y = (Math.cos(t * 0.07) > 0 ? 0 : Math.PI) + spin * spin * 3; df.x = duck.position.x; df.z = z; });
  },
};
