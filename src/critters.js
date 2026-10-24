// Tiere, die einfach da sind: Singvögel hüpfen und fliegen auf, Hühner scharren, Enten paddeln, Frösche springen ins Wasser,
// Fische hüpfen aus dem Wasser, Schmetterlinge flattern. Reine Deko, keine Kollision.
// Hüpf- und Flattertiere wandern mit Moll mit: Wer zu weit weg ist, taucht außer Sicht an einem freien Platz in seiner Nähe neu auf.
import * as THREE from 'three';
import { box, sphere, cone, cyl, makeButterfly, compact, makeFood } from './models.js';
import { FX } from './fx.js';

// Welche Tiere wo (Anzahl bei Grafik „Hoch“). Teiche bekommen automatisch Enten und Frösche, Wasser springende Fische.
const SETS = {
  hub: { birds: ['robin', 'tit', 'robin', 'tit', 'sparrow', 'tit'], fly: 0 },
  park: { birds: ['robin', 'tit', 'sparrow', 'robin', 'tit', 'sparrow', 'robin'], fly: 6 },
  dorf: { birds: ['sparrow', 'robin', 'tit', 'sparrow'], chickens: 6, fly: 5 },
  strasse: { birds: ['sparrow', 'sparrow', 'sparrow', 'tit', 'sparrow'], fly: 2 },
  hafen: { birds: ['gull', 'gull', 'gull', 'sparrow'], fly: 0 },
  strand: { birds: ['gull', 'gull', 'gull', 'gull'], fly: 2 },
  buero: { birds: ['sparrow', 'sparrow'], fly: 0 },
};
const BIRD = {
  robin: { body: 0x8d6e63, belly: 0xff7043, head: 0x8d6e63, s: 0.55 },
  tit: { body: 0x7cb342, belly: 0xffd54f, head: 0x1e3a8a, s: 0.5 },
  sparrow: { body: 0x9c7a54, belly: 0xe8d9c0, head: 0x6d5236, s: 0.5 },
  gull: { body: 0xeceff1, belly: 0xffffff, head: 0xffffff, wing: 0xb0bec5, beak: 0xffb21c, s: 0.85 },
};

function makeSongbird(kind) {
  const c = BIRD[kind], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = sphere(0.22, c.body, 0, 0.3, 0, 8); b.scale.set(0.85, 0.8, 1.15); body.add(b);
  const be = sphere(0.18, c.belly, 0, 0.26, 0.08, 8); be.scale.set(0.8, 0.8, 0.9); body.add(be);
  body.add(box(0.12, 0.04, 0.24, c.wing ?? c.body, 0, 0.36, -0.28)); // Schwanz
  const head = new THREE.Group(); head.position.set(0, 0.46, 0.15); body.add(head);
  head.add(sphere(0.14, c.head, 0, 0, 0, 8)); head.add(cone(0.04, 0.12, c.beak ?? 0x3e2723, 0, -0.01, 0.16).rotateX(Math.PI / 2));
  [-1, 1].forEach(s => { head.add(sphere(0.03, 0x111111, s * 0.09, 0.03, 0.09, 4)); if (kind === 'tit') head.add(sphere(0.06, 0xffffff, s * 0.1, -0.02, 0.03, 4)); });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.17, 0.36, 0); w.add(box(0.26, 0.04, 0.26, c.wing ?? c.body, s * 0.12, 0, -0.04)); body.add(w); return w; });
  [-1, 1].forEach(s => g.add(cyl(0.015, 0.015, 0.14, 0xff8f00, s * 0.06, 0.07, 0, 4)));
  g.scale.setScalar(c.s * 2);
  g.userData = { body, head, wings };
  return compact(g);
}

function makeChicken() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = sphere(0.3, 0xffffff, 0, 0.45, 0, 8); b.scale.set(0.8, 0.85, 1.1); body.add(b);
  body.add(cone(0.16, 0.3, 0xf5f5f5, 0, 0.62, -0.3, 6).rotateX(-0.9)); // Schwanzfedern
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.22); body.add(head);
  head.add(sphere(0.14, 0xffffff, 0, 0, 0, 8)); head.add(box(0.04, 0.12, 0.16, 0xe53935, 0, 0.14, 0)); head.add(box(0.05, 0.08, 0.05, 0xe53935, 0, -0.12, 0.1));
  head.add(cone(0.05, 0.12, 0xffb300, 0, -0.02, 0.17).rotateX(Math.PI / 2)); [-1, 1].forEach(s => head.add(sphere(0.025, 0x111111, s * 0.09, 0.03, 0.08, 4)));
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.22, 0.48, 0); w.add(box(0.06, 0.24, 0.36, 0xeeeeee, s * 0.03, 0, -0.02)); body.add(w); return w; });
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * 0.1, 0.22, 0); l.add(cyl(0.025, 0.025, 0.22, 0xffb300, 0, -0.11, 0, 4)); l.add(box(0.12, 0.02, 0.14, 0xffb300, 0, -0.22, 0.04)); g.add(l); return l; });
  g.userData = { body, head, wings, legs };
  return compact(g);
}

function makeDuck() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = sphere(0.3, 0x8d6e63, 0, 0.12, 0, 8); b.scale.set(0.8, 0.6, 1.2); body.add(b);
  body.add(cone(0.12, 0.25, 0x6d4c41, 0, 0.22, -0.36, 5).rotateX(-1.1));
  [-1, 1].forEach(s => { const w = box(0.06, 0.12, 0.38, 0x5d4037, s * 0.22, 0.2, -0.04); body.add(w); body.add(box(0.07, 0.05, 0.1, 0x3949ab, s * 0.23, 0.22, -0.1)); });
  const head = new THREE.Group(); head.position.set(0, 0.38, 0.28); body.add(head);
  head.add(cyl(0.07, 0.09, 0.2, 0xffffff, 0, -0.12, 0, 6)); head.add(sphere(0.13, 0x2e7d32, 0, 0, 0, 8));
  head.add(box(0.12, 0.04, 0.16, 0xffb300, 0, -0.03, 0.15)); [-1, 1].forEach(s => head.add(sphere(0.025, 0x111111, s * 0.09, 0.03, 0.07, 4)));
  g.userData = { body, head };
  return compact(g);
}

function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = sphere(0.2, 0x66bb6a, 0, 0.14, 0, 8); b.scale.set(1, 0.6, 1.1); body.add(b);
  body.add(sphere(0.15, 0xc5e1a5, 0, 0.1, 0.06, 6));
  [-1, 1].forEach(s => { body.add(sphere(0.07, 0x66bb6a, s * 0.1, 0.27, 0.1, 6)); body.add(sphere(0.04, 0x111111, s * 0.12, 0.3, 0.15, 4)); body.add(box(0.1, 0.06, 0.22, 0x43a047, s * 0.18, 0.05, -0.08)); body.add(box(0.06, 0.04, 0.1, 0x43a047, s * 0.12, 0.03, 0.18)); });
  const throat = sphere(0.08, 0xdcedc8, 0, 0.07, 0.17, 6); body.add(throat);
  g.userData = { body, throat };
  return compact(g);
}

// Freier Platz auf offenem Boden: kein Wasser, keine Gefahr, nichts Hohes darüber
function freeSpot(L, cx, cz, r0, r1, tries = 12) {
  const b = L.mainArea, hz = L.def.hazard;
  for (let i = 0; i < tries; i++) {
    const a = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (x < b.min.x + 2 || x > b.max.x - 2 || z < b.min.z + 2 || z > b.max.z - 2) continue;
    if (L.waterAt(x, z) !== null || (hz && hz(x, z))) continue;
    const top = L.top(x, z), th = L.heightAt(x, z);
    if (top === -Infinity || top > Math.max(th, 0) + 0.05 || (L.seaY !== undefined && top < L.seaY + 0.3)) continue;
    return { x, y: top, z };
  }
  return null;
}

export class Critters {
  constructor(level) {
    this.L = level; this.list = []; this.t = 0; this.fishT = 2;
    const set = SETS[level.key] || {}, q = level.game.q.ambient ?? 1, n = k => Math.max(k ? 1 : 0, Math.round(k * q));
    this.group = new THREE.Group(); level.scene.add(this.group);
    const add = (kind, mesh, extra = {}) => { this.group.add(mesh); mesh.visible = false; this.list.push({ kind, mesh, state: 'away', t: Math.random() * 3, ...extra }); };
    (set.birds || []).slice(0, n(set.birds?.length || 0)).forEach(k => add('bird', makeSongbird(k), { gull: k === 'gull' }));
    for (let i = 0; i < n(set.chickens || 0); i++) add('chicken', makeChicken());
    const fc = [0xff9ff3, 0xfeca57, 0x48dbfb, 0xffffff, 0xff7675, 0xa29bfe];
    for (let i = 0; i < n(set.fly || 0); i++) add('fly', makeButterfly(fc[i % fc.length]));
    // Teiche: Enten paddeln, Frösche sitzen am Rand (nicht im Kanal)
    if (level.key !== 'kanal') for (const p of level.ponds || []) {
      for (let i = 0; i < Math.min(3, Math.ceil(p.rx / 8)); i++) { const m = makeDuck(); this.group.add(m); this.list.push({ kind: 'duck', mesh: m, pond: p, a: Math.random() * 7, r: 0.35 + Math.random() * 0.35, sp: (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.05), t: Math.random() * 5 }); }
      for (let i = 0; i < 3; i++) { const m = makeFrog(); this.group.add(m); const f = { kind: 'frog', mesh: m, pond: p, t: 0, state: 'sit' }; this._frogSpot(f); this.list.push(f); }
    }
    this.water = level.seaY !== undefined || (level.ponds || []).length > 0;
    if (this.water) { this.fish = makeFood('fish'); this.fish.children[0].material = this.fish.children[0].material.clone(); this.fish.children[0].material.color.set(0xffa25e); this.fish.scale.setScalar(1.4); this.fish.visible = false; this.group.add(this.fish); }
  }
  _frogSpot(f) {
    const p = f.pond, a = Math.random() * Math.PI * 2, x = p.x + Math.cos(a) * p.rx * 1.08, z = p.z + Math.sin(a) * p.rz * 1.08;
    f.home = { x, y: Math.max(0, this.L.top(x, z)), z }; f.mesh.position.set(x, f.home.y, z); f.mesh.rotation.y = Math.atan2(p.x - x, p.z - z) + Math.PI; f.mesh.visible = true; f.state = 'sit';
  }
  update(dt) {
    this.t += dt; const L = this.L, pp = L.game.player.pos, fx = L.game.fx;
    for (const c of this.list) {
      const m = c.mesh, u = m.userData, d = Math.hypot(m.position.x - pp.x, m.position.z - pp.z);
      if (c.kind === 'duck') {
        // paddeln im Kreis, nicken; Moll im Wasser in der Nähe → schneller weg
        const p = c.pond, flee = d < 4 ? 4 : 1; c.a += c.sp * dt * flee; c.t += dt;
        const x = p.x + Math.cos(c.a) * p.rx * c.r, z = p.z + Math.sin(c.a) * p.rz * c.r;
        m.rotation.y = Math.atan2(x - m.position.x, z - m.position.z) || m.rotation.y; m.position.set(x, p.y - 0.02 + Math.sin(c.t * 2.5) * 0.03, z);
        u.head.rotation.x = Math.max(0, Math.sin(c.t * 0.7) - 0.85) * 8; u.body.rotation.z = Math.sin(c.t * 2) * 0.06;
        continue;
      }
      if (c.kind === 'frog') {
        c.t += dt;
        if (c.state === 'sit') { u.throat.scale.setScalar(1 + Math.max(0, Math.sin(c.t * 5)) * 0.5); if (d < 3.5) { c.state = 'jump'; c.t = 0; c.from = m.position.clone(); const p = c.pond; c.to = new THREE.Vector3(m.position.x + (p.x - m.position.x) * 0.15, p.y - 0.4, m.position.z + (p.z - m.position.z) * 0.15); } }
        else if (c.state === 'jump') {
          const k = Math.min(1, c.t / 0.5); m.position.lerpVectors(c.from, c.to, k); m.position.y += Math.sin(k * Math.PI) * 1.1; u.body.rotation.x = -0.5 + k;
          if (k >= 1) { c.state = 'gone'; c.t = 0; m.visible = false; L.game.fx.burst({ x: c.to.x, y: c.pond.y, z: c.to.z }, { n: 8, color: [0xffffff, 0x9ad7ff], speed: 1.5, up: 3, life: 0.5, size: 0.12, gravity: -14 }); }
        } else if (c.t > 8) { u.body.rotation.x = 0; this._frogSpot(c); if (Math.hypot(c.home.x - pp.x, c.home.z - pp.z) < 6) { m.visible = false; c.state = 'gone'; c.t = 4; } }
        continue;
      }
      // Hüpf- und Flattertiere: zu weit weg → außer Sicht in Molls Nähe neu auftauchen
      if (c.state === 'away' || d > 48) {
        c.t -= dt; if (c.t > 0) continue;
        const s = freeSpot(L, pp.x, pp.z, 14, 34); if (!s) { c.t = 0.5; continue; }
        m.position.set(s.x, s.y + (c.kind === 'fly' ? 1.2 + Math.random() : 0), s.z); m.rotation.set(0, Math.random() * 7, 0); m.visible = true;
        c.state = c.kind === 'fly' ? 'flutter' : 'ground'; c.t = Math.random(); c.home = m.position.clone(); c.hop = null; continue;
      }
      c.t += dt;
      if (c.kind === 'fly') {
        m.position.set(c.home.x + Math.sin(c.t * 0.5) * 3, c.home.y + Math.sin(c.t * 1.7) * 0.5, c.home.z + Math.cos(c.t * 0.37) * 3);
        m.rotation.y = Math.atan2(Math.cos(c.t * 0.5) * 1.5, -Math.sin(c.t * 0.37) * 1.1);
        u.wings.forEach((w, i) => { w.rotation.z = Math.sin(c.t * 18) * 0.9 * (i ? -1 : 1); });
        continue;
      }
      if (c.state === 'ground') {
        const scared = d < (c.kind === 'chicken' ? 3.5 : 5);
        if (scared && c.kind === 'bird') { c.state = 'fly'; c.t = 0; const a = Math.atan2(m.position.x - pp.x, m.position.z - pp.z) + (Math.random() - 0.5); c.vel = new THREE.Vector3(Math.sin(a) * 6, 5, Math.cos(a) * 6); m.rotation.y = a; continue; }
        if (!c.hop && (c.t > 0.5 + Math.random() * 1.5 || scared)) {
          // Hüpfer (Huhn: Trippelschritte); erschrocken: weg von Moll
          const a = scared ? Math.atan2(m.position.x - pp.x, m.position.z - pp.z) + (Math.random() - 0.5) : m.rotation.y + (Math.random() - 0.5) * 2.4;
          const len = c.kind === 'chicken' ? (scared ? 2.2 : 0.8) : 0.45, x = m.position.x + Math.sin(a) * len, z = m.position.z + Math.cos(a) * len, y = L.top(x, z);
          if (y !== -Infinity && Math.abs(y - m.position.y) < 0.5 && L.waterAt(x, z) === null) { c.hop = { from: m.position.clone(), to: new THREE.Vector3(x, y, z), k: 0, dur: c.kind === 'chicken' ? (scared ? 0.35 : 0.5) : 0.22 }; m.rotation.y = a; }
          c.t = 0;
          if (scared && c.kind === 'chicken' && Math.random() < 0.3) L.game.fx.burst({ x: m.position.x, y: m.position.y + 0.5, z: m.position.z }, { n: 3, color: 0xffffff, speed: 1.5, up: 1.5, life: 0.6, size: 0.1, gravity: -2 }); // Federn
        }
        if (c.hop) {
          const h = c.hop; h.k = Math.min(1, h.k + dt / h.dur); m.position.lerpVectors(h.from, h.to, h.k); m.position.y += Math.sin(h.k * Math.PI) * (c.kind === 'chicken' ? 0.08 : 0.18);
          if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = Math.sin(h.k * Math.PI * 2 + i * Math.PI) * 0.6; });
          if (u.wings && c.kind === 'chicken' && d < 3.5) u.wings.forEach((w, i) => { w.rotation.z = Math.sin(this.t * 30) * 0.6 * (i ? -1 : 1); });
          if (h.k >= 1) c.hop = null;
          u.body.rotation.x = 0;
        } else {
          // picken
          const peck = Math.max(0, Math.sin(c.t * 9)) * (Math.sin(c.t * 1.3 + m.id) > 0.3 ? 1 : 0);
          u.body.rotation.x = peck * 0.5; u.head.rotation.y = Math.sin(c.t * 1.7 + m.id) * 0.5;
          if (u.wings) u.wings.forEach(w => { w.rotation.z = 0; });
        }
        continue;
      }
      if (c.state === 'fly') {
        m.position.addScaledVector(c.vel, dt); c.vel.y = Math.max(1.5, c.vel.y - dt * 2); u.body.rotation.x = -0.3;
        u.wings.forEach((w, i) => { w.rotation.z = Math.sin(this.t * 40) * 1.0 * (i ? -1 : 1); });
        if (c.t > 2.8) { c.state = 'away'; c.t = 2 + Math.random() * 4; m.visible = false; }
      }
    }
    // Ab und zu springt ein Fisch aus dem Wasser
    if (this.fish) {
      const f = this.fish;
      if (f.visible) {
        f.userData.k += dt / 0.9; const k = f.userData.k, a = f.userData;
        f.position.set(a.x + a.dx * k, a.y - 0.4 + Math.sin(k * Math.PI) * 1.6, a.z + a.dz * k); f.rotation.set(0, Math.atan2(a.dx, a.dz) - Math.PI / 2, (0.5 - k) * 2.2);
        if (k >= 1) { f.visible = false; fx.burst({ x: f.position.x, y: a.y, z: f.position.z }, { n: 10, color: [0xffffff, 0x9ad7ff], speed: 1.8, up: 4, life: 0.6, size: 0.14, gravity: -16 }); FX.land(fx, { x: f.position.x, y: a.y, z: f.position.z }, 0.3); }
      } else if ((this.fishT -= dt) <= 0) {
        this.fishT = 2 + Math.random() * 4;
        for (let i = 0; i < 6; i++) {
          const ang = Math.random() * 7, r = 7 + Math.random() * 18, x = pp.x + Math.cos(ang) * r, z = pp.z + Math.sin(ang) * r, wy = L.waterAt(x, z);
          if (wy === null || L.groundAt(x, z, wy) > wy - 1.2 || (L.key === 'kanal')) continue;
          const dir = Math.random() * 7; Object.assign(f.userData, { x, y: wy, z, dx: Math.sin(dir) * 2.2, dz: Math.cos(dir) * 2.2, k: 0 }); f.visible = true;
          fx.burst({ x, y: wy, z }, { n: 6, color: 0xffffff, speed: 1.2, up: 3, life: 0.5, size: 0.12, gravity: -16 }); break;
        }
      }
    }
  }
}
