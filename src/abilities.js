// Fähigkeiten: Texte, Krümel-Laden und die Bausteine, die Welten für Fähigkeiten-Rätsel benutzen
// (Opa Bruno als Lehrer, Drehknöpfe, Bell-Ziele, Bodenschalter, Kisten, Erdhügel, Kletterwände, Aufwind, Apportieren).
import * as THREE from 'three';
import { box, cyl, sphere, cone, makeNpcDog } from './models.js';
import { FX } from './fx.js';

// Ball: Radius und Sitz im Maul (Mittelpunkt, im Koordinatensystem von Molls Kopf: vorn an der Schnauze, auf Höhe der Lefzen)
const BALL_R = 0.26, MOUTH = new THREE.Vector3(0, -0.31, 0.95);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _ax = new THREE.Vector3(), _q = new THREE.Quaternion();

// Tasten: TRILLER = C / Gamepad B / Touch 🌀, BELLEN = V / Gamepad RB / Touch 📢
export const ABILITIES = {
  apportieren: { name: 'Apportieren', icon: '🎾', how: 'BISS neben einem Ball oder Stock hebt ihn auf, nochmal BISS legt ihn ab.' },
  trillern: { name: 'Trillern', icon: '🌀', how: 'TRILLER-Taste (C · Gamepad B · 🌀): Moll dreht sich blitzschnell und trifft alles ringsum.' },
  bellen: { name: 'Bellen', icon: '📢', how: 'BELL-Taste (V · Gamepad RB · 📢): Ein lautes WUFF nach vorn – erschreckt Tiere und löst Dinge aus.' },
  bauchklatscher: { name: 'Bauchklatscher', icon: '💥', how: 'In der Luft BISS: Moll saust senkrecht runter und stampft. Zerbricht Kisten, drückt Bodenschalter.' },
  buddeln: { name: 'Buddeln', icon: '⛏️', how: 'BISS an einem Erdhügel: Moll buddelt aus, was darunter liegt.' },
  zoomies: { name: 'Zoomies', icon: '💨', how: 'Lauf mit vollem Tempo geradeaus – nach einem Moment rast Moll los und springt viel weiter.' },
  gleiten: { name: 'Helikopter-Ohren', icon: '🚁', how: 'In der Luft TRILLER halten: Moll gleitet mit den Ohren. In Aufwinden geht es sogar nach oben!' },
  wandsprung: { name: 'Wandsprung', icon: '🧱', how: 'An Backsteinwänden: gegen die Wand springen, dann SPRUNG – Moll stößt sich ab. Immer im Zickzack nach oben!' },
  tornado: { name: 'Tornado-Trillern', icon: '🌪️', how: 'Am Boden TRILLER gedrückt halten, bis es funkelt, dann loslassen: Moll schießt als Wirbelsturm nach oben.' },
};

// Krümel-Laden bei Opa Bruno im Garten: nur Werte, für keinen Goldknochen nötig
export const UPGRADES = [
  { id: 'herz4', name: 'Viertes Herz', icon: '❤️', price: 150, text: 'Moll hält einen Treffer mehr aus.' },
  { id: 'herz5', name: 'Fünftes Herz', icon: '❤️', price: 300, needs: 'herz4', text: 'Noch ein Herz obendrauf.' },
  { id: 'trillernPlus', name: 'Trillern+', icon: '🌀', price: 100, needs: 'trillern', text: 'Größerer Wirbel, kürzere Pause dazwischen.' },
  { id: 'langeOhren', name: 'Lange Ohren', icon: '🚁', price: 200, needs: 'gleiten', text: 'Gleiten hält fast doppelt so lange.' },
  { id: 'supernase', name: 'Supernase', icon: '👃', price: 120, text: 'Schnüffeln findet Verstecke aus viel größerer Entfernung.' },
];

const BRICK = 0xb5523b, MORTAR = 0xe0c9a6;

// Ameisenstraße: kleiner Schwarm, der Moll zwickt. Beißen bringt nichts – nur Trillern wirbelt sie weg.
export class AntSwarm {
  constructor(game, x, y, z, r = 2.2) {
    this.game = game; this.home = { x, y, z }; this.r = r; this.radius = r * 0.7; this.dead = false; this.t = Math.random() * 10;
    this.mesh = new THREE.Group(); this.mesh.position.set(x, y, z); this.ants = [];
    for (let i = 0; i < 26; i++) { const a = sphere(0.09, 0x1e1e1e, 0, 0.09, 0, 5); a.add(sphere(0.06, 0x1e1e1e, 0, 0, 0.12, 4)); a.userData = { a: Math.random() * 7, rr: Math.random() * r, s: 0.6 + Math.random() }; this.mesh.add(a); this.ants.push(a); }
  }
  update(dt) {
    this.t += dt;
    for (const a of this.ants) { const u = a.userData; u.a += dt * u.s; a.position.set(Math.cos(u.a) * u.rr, 0, Math.sin(u.a * 1.3) * u.rr); a.rotation.y = -u.a; }
    const p = this.game.player; if (Math.hypot(p.pos.x - this.home.x, p.pos.z - this.home.z) < this.r && Math.abs(p.pos.y - this.home.y) < 1) p.hurt(1);
  }
  onBite() { this.game.toast('Zu viele Ameisen zum Beißen – TRILLERN!'); }
  onSpin() { this.dead = true; this.mesh.visible = false; this.game.audio.sfx('collect'); this.game.fx.burst({ x: this.home.x, y: this.home.y + 0.3, z: this.home.z }, { n: 30, color: 0x1e1e1e, speed: 7, up: 5, life: 0.8, size: 0.12 }); this.game.toast('Ameisen weggewirbelt!'); }
}

export function installGadgets(Level) {
  Object.assign(Level.prototype, {
    // ---- Opa Bruno: bringt am Welteingang die Fähigkeit der Welt bei. Im Garten verkauft er Upgrades gegen Krümel.
    teacher(x, z, ability, o = {}) {
      const y = o.y ?? Math.max(0, this.top(x, z)), g = this.game;
      const m = makeNpcDog(0xc9c2b4, 0x2e7d32); m.scale.setScalar(1.1); this.deco(m, x, y, z, o.ry ?? Math.atan2(this.spawn.x - x, this.spawn.z - z));
      m.userData.head.add(box(0.5, 0.06, 0.06, 0xeeeeee, 0, -0.18, 0.62)); // weißer Schnauzbart
      this.solids.push({ min: { x: x - 0.5, y, z: z - 0.5 }, max: { x: x + 0.5, y: y + 1.4, z: z + 0.5 }, active: true });
      this.bruno = { x, y, z, mesh: m, ability };
      // Gespräch und Tipp zum Rätsel stehen in dialog.js („bruno.<fähigkeit>“)
      if (ability) this.trigger(x, y, z, 4.5, () => { if (!g.has(ability)) g.learn(ability, true, m); });
      this.interactable(x, y, z, 1.6, it => {
        it.used = false;
        if (ability && !g.has(ability)) g.learn(ability, true, m);
        else if (o.shop) g.openShop();
        else if (ability) g.learn(ability, true, m);
      }, o.shop ? 'BISS = Leckerli-Laden' : 'BISS = Opa fragen');
      return this.bruno;
    },

    // ---- Drehknopf / Ventil / Drehkreuz: Trillern in der Nähe dreht ihn
    spinTarget(x, y, z, cb, o = {}) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = o.ry || 0;
      const wheel = new THREE.Group(); g.add(wheel);
      if (o.kind === 'valve') { wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 6, 16), new THREE.MeshLambertMaterial({ color: 0xd63031 }))); wheel.add(box(1.4, 0.12, 0.12, 0xd63031)); wheel.add(box(0.12, 1.4, 0.12, 0xd63031)); wheel.rotation.x = 0; }
      else { wheel.add(cyl(0.45, 0.5, 0.3, 0x2d3436, 0, 0, 0, 12).rotateX(Math.PI / 2)); wheel.add(box(0.12, 0.6, 0.12, 0xfdcb6e, 0, 0.18, 0.2)); }
      const lamp = sphere(0.14, 0x636e72, 0, 0.75, 0, 6); g.add(lamp); this.group.add(g);
      const t = { x, y, z, cb, done: false, wheel, lamp, spin: 0 }; (this.spinTargets ||= []).push(t); return t;
    },
    // ---- Bell-Ziel (Alarmanlage, Glocke …): Bellen in Reichweite und Blickrichtung löst es aus
    barkTarget(x, y, z, cb, o = {}) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffeaa7, transparent: true, opacity: 0.7 }));
      ring.position.set(x, y + (o.ringY ?? 1.6), z); this.group.add(ring);
      const t = { x, y, z, cb, done: false, ring, range: o.range ?? 11 }; (this.barkTargets ||= []).push(t); return t;
    },
    // ---- Bodenschalter: nur ein Bauchklatscher drückt ihn ganz runter
    stompPad(x, y, z, cb, color = 0xe74c3c) {
      const base = this.box(x, y, z, 2.2, 0.2, 2.2, 0x636e72), cap = box(1.5, 0.35, 1.5, color, x, y + 0.37, z); this.group.add(cap);
      const t = { x, y: y + 0.2, z, cb, done: false, cap, base }; (this.stompPads ||= []).push(t); return t;
    },
    // ---- Kiste/Karton: Bauchklatscher obendrauf oder daneben zerbricht sie; contents sind vergrabene Sammelsachen darin
    crate(x, y, z, s = 1.6, contents = [], color = 0xc49a6c) {
      const so = this.box(x, y, z, s, s, s, color, { dynamic: true });
      [[0, 1], [1, 0]].forEach(([a, b]) => { so.mesh.add(box(s * 1.02 * (a || 0.1) + 0.02, s * 0.12, s * 1.02 * (b || 0.1) + 0.02, 0x8d6e4a, 0, s * 0.44, 0)); so.mesh.add(box(s * 1.02 * (a || 0.1) + 0.02, s * 0.12, s * 1.02 * (b || 0.1) + 0.02, 0x8d6e4a, 0, -s * 0.44, 0)); });
      contents.forEach(p => this.bury(p));
      const c = { x, y, z, s, solid: so, contents, broken: false }; (this.crates ||= []).push(c); return c;
    },
    // ---- Erdhügel: BISS mit Buddeln gräbt aus, was darunter liegt
    digSpot(x, z, contents = [], o = {}) {
      const y = o.y ?? Math.max(0, this.top(x, z)), m = sphere(1, 0x6d4c33, 0, 0, 0, 9); m.scale.set(1.2, 0.45, 1.2); this.deco(m, x, y, z);
      [[0.4, 0.3], [-0.5, 0.1], [0.1, -0.5]].forEach(([dx, dz]) => this.deco(sphere(0.18, 0x5a3c26, 0, 0, 0, 5), x + dx, y + 0.35, z + dz));
      contents.forEach(p => this.bury(p));
      const d = { x, y, z, mesh: m, contents, dug: false }; (this.digSpots ||= []).push(d);
      this.interactable(x, y, z, 1.4, it => {
        if (!this.game.has('buddeln')) { it.used = false; this.game.toast('Riecht nach Knochen … aber wie buddelt man? Opa Bruno weiß es!'); return; }
        this.dig(d);
      }, 'BISS = buddeln');
      return d;
    },
    dig(d) {
      if (d.dug) return; d.dug = true; d.mesh.scale.y = 0.12; this.game.audio.sfx('dig');
      this.game.fx.burst({ x: d.x, y: d.y + 0.4, z: d.z }, { n: 26, color: [0x6d4c33, 0x8d6e4a, 0x5a3c26], speed: 5, up: 6, life: 0.8, size: 0.2 });
      d.contents.forEach(p => this.unbury(p)); if (!d.contents.length) this.game.toast('Nur Erde …');
    },
    bury(p) { p.buried = true; p.mesh.visible = false; },
    unbury(p) { if (!p.buried) return; p.buried = false; if (p.taken) return; p.mesh.visible = true; p.appear = 0; p.mesh.scale.setScalar(0.01); },
    // ---- Backsteinwand: an ihr klappt der Wandsprung (andere Wände sind zu glatt)
    climbWall(x, y, z, w, h, d, color = BRICK) {
      const s = this.box(x, y, z, w, h, d, color, { climb: true });
      const along = w >= d; // Mörtelfugen als dünne helle Streifen
      for (let k = 0.8; k < h; k += 0.8) this.deco(box(along ? w + 0.04 : w + 0.04, 0.08, along ? d + 0.04 : d + 0.04, MORTAR), x, y + k, z);
      return s;
    },
    // ---- Aufwind (Windsäule): beim Gleiten geht es darin nach oben
    updraft(x, y0, z, h = 12, r = 2.2) {
      const g = new THREE.Group(); g.position.set(x, y0, z); const leaves = [];
      for (let i = 0; i < 18; i++) { const l = box(0.25, 0.04, 0.12, i % 2 ? 0xffffff : 0xdff9fb); l.userData = { a: Math.random() * 7, y: Math.random() * h, rr: 0.4 + Math.random() * (r - 0.4) }; g.add(l); leaves.push(l); }
      const col = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xdff9fb, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
      col.position.y = h / 2; g.add(col); this.group.add(g);
      const u = { x, y0, z, h, r, leaves }; (this.updrafts ||= []).push(u); return u;
    },
    updraftAt(p) { return (this.updrafts || []).find(u => Math.hypot(u.x - p.x, u.z - p.z) < u.r && p.y > u.y0 - 1 && p.y < u.y0 + u.h + 1); },
    // ---- Apportieren: Gegenstand, den man trägt, und ein Ziel, das ihn annimmt
    fetchItem(x, y, z, kind = 'ball') {
      const m = new THREE.Group();
      let spin = null;
      if (kind === 'ball') { // Kugel in eigener Gruppe um den Mittelpunkt, damit sie beim Rollen nicht eiert
        spin = new THREE.Group(); spin.position.y = BALL_R; m.add(spin);
        spin.add(sphere(BALL_R, 0xc6e83a, 0, 0, 0, 12)); spin.add(new THREE.Mesh(new THREE.TorusGeometry(BALL_R, 0.025, 4, 18), new THREE.MeshLambertMaterial({ color: 0xffffff })));
      }
      else if (kind === 'key') { m.add(cyl(0.22, 0.22, 0.08, 0xffcc33, 0, 0.3, 0, 10).rotateX(Math.PI / 2)); m.add(box(0.1, 0.1, 0.6, 0xffcc33, 0, 0.3, 0.4)); }
      else m.add(box(0.14, 0.14, 1.3, 0x8d6e4a, 0, 0.15, 0));
      m.position.set(x, y, z); this.group.add(m);
      const it = { x, y, z, kind, mesh: m, spin, carried: false, done: false, vx: 0, vy: 0, vz: 0, home: { x, y, z } }; (this.fetchItems ||= []).push(it); return it;
    },
    fetchGoal(x, y, z, r, kind, cb) { const fg = { x, y, z, r, kind, cb, done: false }; (this.fetchGoals ||= []).push(fg); return fg; },
    fetchNear(p) { return (this.fetchItems || []).find(it => !it.carried && !it.done && Math.hypot(it.x - p.x, it.z - p.z) < (it.spin ? 2.4 : 1.9) && Math.abs(it.y - p.y) < 1.5); }, // Ball liegt oft vor der Schnauze
    dropItem(it, at, vel) {
      it.carried = false; it.mesh.rotation.set(0, 0, 0);
      if (it.spin) { // Ball fällt aus dem Maul (dort, wo er gerade ist) und rollt mit Molls Schwung weiter
        const v = vel || { x: 0, y: 0, z: 0 }; it.vx = v.x * 0.8 + (at.x - this.game.player.pos.x) * 0.6; it.vz = v.z * 0.8 + (at.z - this.game.player.pos.z) * 0.6; it.vy = Math.max(0, v.y) + 1;
        if (!this._ballFree(it, it.x, it.y, it.z)) { it.x = at.x; it.z = at.z; it.y = Math.max(it.y, this.groundAt(at.x, at.z, at.y + 0.5)); }
        it.mesh.position.set(it.x, it.y, it.z); this._fetchGoalCheck(it, at); return;
      }
      it.x = at.x; it.z = at.z; it.y = Math.max(this.groundAt(at.x, at.z, at.y + 0.5), this.def.floorY ?? -Infinity, -50); it.mesh.position.set(it.x, it.y, it.z);
      this._fetchGoalCheck(it, at);
    },
    _fetchGoalCheck(it, at = it) {
      const fg = (this.fetchGoals || []).find(f => !f.done && f.kind === it.kind && Math.hypot(f.x - at.x, f.z - at.z) < f.r && Math.abs(f.y - it.y) < 2);
      if (fg) { fg.done = true; it.done = true; this.game.audio.sfx('big'); FX.sparkle(this.game.fx, it); fg.cb(it); }
    },
    // Ball-Physik: Schwerkraft, Hangabtrieb, Rollreibung, Abprallen an Kisten/Wänden/steilem Gelände, Schwimmen im Wasser.
    // it.x/y/z ist der Auflagepunkt unten am Ball, der Mittelpunkt liegt BALL_R darüber.
    _ballGround(x, z, y) { return Math.max(this.groundAt(x, z, y + 0.3), this.def.floorY ?? -Infinity); },
    _ballFree(it, x, y, z) { // frei = kein Körper und kein Gelände ragt in die Kugel
      for (const s of this.solids) if (s.active && s !== it.solidIgnore && x + BALL_R > s.min.x && x - BALL_R < s.max.x && z + BALL_R > s.min.z && z - BALL_R < s.max.z && y + 0.12 < s.max.y && y + BALL_R * 2 > s.min.y) return false;
      const h = this.heightAt(x, z, y); return !(h > y + 0.25);
    },
    _rollBall(it, dt, pl) {
      const G = 22, ground = this._ballGround(it.x, it.z, it.y), wy = this.waterAt ? this.waterAt(it.x, it.z) : null;
      const onGround = it.y <= ground + 0.02 && it.vy <= 0.5;
      if (wy !== null && it.y + BALL_R * 0.8 < wy) { // Wasser: Auftrieb, starke Bremse, Ball dümpelt an der Oberfläche
        it.vy += (wy - BALL_R * 0.8 - it.y) * 18 * dt - it.vy * 3 * dt; const k = Math.exp(-1.5 * dt); it.vx *= k; it.vz *= k;
      } else if (onGround) {
        const e = 0.25, gx = (this._ballGround(it.x + e, it.z, it.y) - this._ballGround(it.x - e, it.z, it.y)) / (2 * e), gz = (this._ballGround(it.x, it.z + e, it.y) - this._ballGround(it.x, it.z - e, it.y)) / (2 * e);
        if (Math.abs(gx) < 2 && Math.abs(gz) < 2) { it.vx -= G * 0.71 * gx * dt; it.vz -= G * 0.71 * gz * dt; } // rollende Kugel: 5/7 der Hangkraft; Kanten (Sprung im Boden) zählen nicht
        const sp = Math.hypot(it.vx, it.vz), dec = Math.min(sp, (1.2 + sp * 0.45) * dt); // Rollreibung + Luftwiderstand
        if (sp > 0) { it.vx -= it.vx / sp * dec; it.vz -= it.vz / sp * dec; }
        if (Math.hypot(it.vx, it.vz) < 0.03 && Math.hypot(gx, gz) < 0.02) it.vx = it.vz = 0;
      } else it.vy -= G * dt;
      // Moll stupst den Ball an, wenn sie hineinläuft
      if (pl && !pl.frozen && Math.abs(pl.pos.y - it.y) < 1.2) {
        // Molls Körper als Kapsel von der Hüfte bis zur Schnauze
        const fx = Math.sin(pl.yaw), fz = Math.cos(pl.yaw), t = Math.max(-0.75, Math.min(1.45, (it.x - pl.pos.x) * fx + (it.z - pl.pos.z) * fz));
        const cx = pl.pos.x + fx * t, cz = pl.pos.z + fz * t, dx = it.x - cx, dz = it.z - cz, d = Math.hypot(dx, dz), R = 0.45 + BALL_R;
        if (d < R && d > 1e-4) {
          const nx = dx / d, nz = dz / d, rel = (pl.vel.x - it.vx) * nx + (pl.vel.z - it.vz) * nz;
          if (rel > 0) { it.vx += nx * rel * 1.35; it.vz += nz * rel * 1.35; if (rel > 4) { it.vy = Math.max(it.vy, rel * 0.25); this.game.audio.sfx('click'); } }
          if (this._ballFree(it, cx + nx * R, it.y, cz + nz * R)) { it.x = cx + nx * R; it.z = cz + nz * R; }
        }
      }
      // Bewegung achsenweise, an Hindernissen abprallen
      const sp = Math.hypot(it.vx, it.vz); if (sp > 25) { it.vx *= 25 / sp; it.vz *= 25 / sp; }
      const n = Math.max(1, Math.ceil(sp * dt / (BALL_R * 0.8))), h = dt / n;
      for (let i = 0; i < n; i++) {
        const nx = it.x + it.vx * h; if (this._ballFree(it, nx, it.y, it.z)) it.x = nx; else if (this._ballFree(it, nx, it.y + 0.3, it.z) && onGround) { it.x = nx; it.y += 0.3; } else { it.vx *= -0.5; this._ballBonk(it, it.vx); }
        const nz = it.z + it.vz * h; if (this._ballFree(it, it.x, it.y, nz)) it.z = nz; else if (this._ballFree(it, it.x, it.y + 0.3, nz) && onGround) { it.z = nz; it.y += 0.3; } else { it.vz *= -0.5; this._ballBonk(it, it.vz); }
      }
      it.y += it.vy * dt;
      const g2 = this._ballGround(it.x, it.z, it.y);
      if (it.y < g2) { it.y = g2; if (it.vy < -3) { it.vy *= -0.45; this._ballBonk(it, it.vy); } else it.vy = 0; }
      if (it.vy > 0 && !this._ballFree(it, it.x, it.y, it.z)) it.vy = 0; // Decke
      const b = this.bounds; if (b) { // nicht aus dem Bereich rollen
        if (it.x < b.min.x + BALL_R) { it.x = b.min.x + BALL_R; it.vx = Math.abs(it.vx) * 0.5; } if (it.x > b.max.x - BALL_R) { it.x = b.max.x - BALL_R; it.vx = -Math.abs(it.vx) * 0.5; }
        if (it.z < b.min.z + BALL_R) { it.z = b.min.z + BALL_R; it.vz = Math.abs(it.vz) * 0.5; } if (it.z > b.max.z - BALL_R) { it.z = b.max.z - BALL_R; it.vz = -Math.abs(it.vz) * 0.5; }
      }
      if (it.y < (this.killY ?? -25)) { Object.assign(it, { x: it.home.x, y: it.home.y + 2, z: it.home.z, vx: 0, vy: 0, vz: 0 }); FX.sparkle(this.game.fx, it); }
      // Drehung passend zur zurückgelegten Strecke
      const dist = Math.hypot(it.vx, it.vz) * dt;
      if (dist > 1e-5) { _ax.set(it.vz, 0, -it.vx).normalize(); _q.setFromAxisAngle(_ax, dist / BALL_R); it.spin.quaternion.premultiply(_q); }
      it.mesh.position.set(it.x, it.y, it.z);
      if (!it.done && Math.hypot(it.vx, it.vz) > 0.05) this._fetchGoalCheck(it); // auch reingerollt oder reingestupst zählt
    },
    _dogFree(x, y, z) { // Molls Box (wie in player.js) kollidiert hier mit nichts außer niedrigen Stufen
      for (const s of this.solids) if (s.active && x + 0.42 > s.min.x && x - 0.42 < s.max.x && z + 0.42 > s.min.z && z - 0.42 < s.max.z && y + 0.45 < s.max.y && y + 1.15 > s.min.y) return false;
      return true;
    },
    _ballBonk(it, v) { if (Math.abs(v) > 2.5 && Math.hypot(it.x - this.game.player.pos.x, it.z - this.game.player.pos.z) < 25) this.game.audio.sfx('click'); },
    // Ball im Maul: Mittelpunkt sitzt vorn zwischen den Lefzen (Kopf-Knochen), folgt Kopfnicken, Kopfdrehen, Trab/Galopp und Biss.
    // Ragt er in eine Wand oder in den Boden, wird er herausgeschoben statt hindurchzuragen.
    _holdBall(it, pl) {
      const u = pl.mesh.userData; pl.mesh.updateMatrixWorld(true);
      _v.copy(MOUTH); u.head.localToWorld(_v);
      let x = _v.x, y = _v.y - BALL_R, z = _v.z;
      // Stößt der Ball an eine Kiste oder Wand, hält er Moll davon ab: sie wird um genau so viel zurückgeschoben (Ball bleibt im Maul)
      let px = 0, pz = 0;
      for (const s of this.solids) {
        if (!s.active || !(x + px + BALL_R > s.min.x && x + px - BALL_R < s.max.x && z + pz + BALL_R > s.min.z && z + pz - BALL_R < s.max.z && y + 0.12 < s.max.y && y + BALL_R * 2 > s.min.y)) continue;
        if (s.max.y - y < 0.45) continue; // niedrige Kante: Moll steigt ohnehin hoch
        const o = [[s.min.x - BALL_R - x - px, 0], [s.max.x + BALL_R - x - px, 0], [0, s.min.z - BALL_R - z - pz], [0, s.max.z + BALL_R - z - pz]].sort((a, b) => Math.hypot(...a) - Math.hypot(...b))[0];
        px += o[0]; pz += o[1];
      }
      if ((px || pz) && Math.hypot(px, pz) < 1.2 && this._dogFree(pl.pos.x + px, pl.pos.y, pl.pos.z + pz)) {
        pl.pos.x += px; pl.pos.z += pz; pl.mesh.position.copy(pl.pos); x += px; z += pz;
        if (px * pl.vel.x < 0) pl.vel.x = 0; if (pz * pl.vel.z < 0) pl.vel.z = 0;
      }
      if (!this._ballFree(it, x, y, z)) { // sonst (z.B. steiles Gelände) zur Kopfmitte hin zurückziehen, bis er frei ist
        const sx = x, sy = y, sz = z; _w.set(0, -0.1, 0.3); u.head.localToWorld(_w); _w.y -= BALL_R;
        for (let k = 1; k <= 8 && !this._ballFree(it, x, y, z); k++) { const t = k / 8; x = sx + (_w.x - sx) * t; y = sy + (_w.y - sy) * t; z = sz + (_w.z - sz) * t; }
      }
      y = Math.max(y, this._ballGround(x, z, y + BALL_R)); // nie in den Boden
      it.x = x; it.y = y; it.z = z; it.vx = pl.vel.x; it.vy = pl.vel.y; it.vz = pl.vel.z;
      it.mesh.position.set(x, y, z); it.mesh.rotation.set(0, 0, 0);
      u.head.getWorldQuaternion(it.spin.quaternion);
    },

    // ---- Treffer verteilen: Trillern, Bellen, Bauchklatscher
    onSpin(point, r, hit, strong) {
      for (const e of this.enemies) if (!e.dead && !hit.has(e) && Math.hypot(e.mesh.position.x - point.x, e.mesh.position.z - point.z) < r + (e.radius || 1) && Math.abs(e.mesh.position.y - point.y) < 2.5 + (e.radius || 1)) { hit.add(e); if (e.onSpin) e.onSpin(strong); else if (e.onBite && !e.maxHp) e.onBite(); }
      for (const t of this.spinTargets || []) if (!t.done && Math.hypot(t.x - point.x, t.z - point.z) < r + 1.4 && Math.abs(t.y - point.y) < 2.5) {
        t.done = true; t.spin = 1; t.lamp.material = t.lamp.material.clone(); t.lamp.material.color.set(0x55efc4); t.lamp.material.emissive = new THREE.Color(0x00b894);
        this.game.audio.sfx('click'); FX.sparkle(this.game.fx, t); t.cb && t.cb(t);
      }
    },
    onBark(point, fwd, range) {
      const inFront = (x, z, rr) => { const dx = x - point.x, dz = z - point.z, d = Math.hypot(dx, dz); return d < rr && (d < 1.5 || (dx * fwd.x + dz * fwd.z) / d > 0.35); };
      for (const e of this.enemies) if (!e.dead && Math.abs(e.mesh.position.y - point.y) < 8 && inFront(e.mesh.position.x, e.mesh.position.z, range)) { if (e.onBark) e.onBark(); else if (e.onBite && !e.maxHp && e.radius < 1) e.onBite(); }
      for (const t of this.barkTargets || []) if (!t.done && Math.abs(t.y - point.y) < 6 && inFront(t.x, t.z, t.range)) { t.done = true; t.ring.visible = false; t.cb && t.cb(t); }
      for (const it of this.fetchItems || []) if (it.spin && !it.carried && Math.abs(it.y - point.y) < 3 && inFront(it.x, it.z, 6)) { const dx = it.x - point.x, dz = it.z - point.z, d = Math.hypot(dx, dz) || 1, k = 9 - d; it.vx += dx / d * k; it.vz += dz / d * k; it.vy = Math.max(it.vy, 2); } // WUFF schubst den Ball weg
    },
    onStomp(point) {
      this.game.fx.burst({ x: point.x, y: point.y + 0.1, z: point.z }, { n: 24, color: [0xffffff, 0xe8dcc8], speed: 7, up: 0.5, life: 0.5, size: 0.3, gravity: 0, flat: true });
      for (const t of this.stompPads || []) if (!t.done && Math.abs(t.x - point.x) < 1.6 && Math.abs(t.z - point.z) < 1.6 && Math.abs(t.y - point.y) < 0.8) { t.done = true; t.cap.scale.y = 0.25; t.cap.position.y -= 0.15; this.game.audio.sfx('click'); t.cb && t.cb(t); }
      for (const c of this.crates || []) if (!c.broken && Math.abs(c.x - point.x) < c.s / 2 + 1.4 && Math.abs(c.z - point.z) < c.s / 2 + 1.4 && point.y > c.y - 0.5 && point.y < c.y + c.s + 0.5) this.breakCrate(c);
      for (const e of this.enemies) if (!e.dead && e.onStomp && Math.hypot(e.mesh.position.x - point.x, e.mesh.position.z - point.z) < 4 + (e.radius || 1)) e.onStomp(point);
    },
    breakCrate(c) {
      c.broken = true; c.solid.active = false; c.solid.mesh.visible = false; this.game.audio.sfx('break'); this.game.shake(0.2);
      this.game.fx.burst({ x: c.x, y: c.y + c.s / 2, z: c.z }, { n: 22, color: [0xc49a6c, 0x8d6e4a, 0xe0c39a], speed: 6, up: 5, life: 0.8, size: 0.26 });
      c.contents.forEach(p => this.unbury(p));
    },
    // Trillern zieht Krümel in der Nähe an
    attract(point, r, dt) {
      for (const p of this.pickups) {
        if (p.taken || p.buried || p.goal || p.special || p.kind === 'goldbone' || !p.mesh.visible) continue;
        const dx = point.x - p.x, dz = point.z - p.z, d = Math.hypot(dx, dz); if (d > r || d < 0.2 || Math.abs(p.y - point.y) > 2) continue;
        const k = Math.min(1, dt * 6); p.x += dx * k; p.z += dz * k; p.mesh.position.x = p.x; p.mesh.position.z = p.z;
      }
    },
    updateGadgets(dt) {
      for (const t of this.spinTargets || []) { if (t.spin > 0) { t.spin = Math.max(0, t.spin - dt * 0.6); t.wheel.rotation.z += dt * 18 * t.spin; } }
      for (const t of this.barkTargets || []) if (!t.done) { const k = (this.t * 1.2) % 1; t.ring.scale.setScalar(0.6 + k * 0.9); t.ring.material.opacity = 0.7 * (1 - k); t.ring.lookAt(this.game.camera.position); }
      for (const u of this.updrafts || []) for (const l of u.leaves) { const d = l.userData; d.a += dt * 3; d.y = (d.y + dt * 4) % u.h; l.position.set(Math.cos(d.a) * d.rr, d.y, Math.sin(d.a) * d.rr); l.rotation.set(d.a, d.a * 2, 0); }
      const pl = this.game.player;
      for (const it of this.fetchItems || []) if (it.carried) {
        if (it.spin) { this._holdBall(it, pl); continue; }
        const f = { x: Math.sin(pl.yaw), z: Math.cos(pl.yaw) }; it.mesh.position.set(pl.pos.x + f.x * 1.15, pl.pos.y + 0.95, pl.pos.z + f.z * 1.15); it.mesh.rotation.y = pl.yaw + Math.PI / 2;
      } else if (it.spin) this._rollBall(it, Math.min(dt, 1 / 20), pl);
      else if (!it.done) it.mesh.rotation.y += dt;
    },
  });
}
