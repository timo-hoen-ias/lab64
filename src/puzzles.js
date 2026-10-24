// Rätsel im Banjo-Kazooie-Stil: jede Welt hat zwei bis drei Knobeleien mit eigenem Goldknochen (PUZZLES).
// Eins davon braucht eine Fähigkeit aus einer späteren Welt (Backtracking, NEEDS) – ein Schild mit dem Symbol zeigt das an.
// Bausteine (an Level): pzBone (versteckter Knochen), cage (Käfig, der auf Zeit aufgeht), button (Schalter, wieder scharf),
// pzTimer (Countdown mit Ticken), tempPlats (Plattformen auf Zeit), memory, melody (Reihenfolge nachspielen),
// flipTiles (Umdreh-Fliesen), moles (Maulwurf-Klopfen), candles (alle gleichzeitig aus), letters (Wort stempeln),
// shaft (Backstein-Schacht), pillar (glatte Säule), chest (Truhe am Grund). Die Welten selbst stehen unten in WORLDS.
// Gebaut wird nach def.build und vor Deko/Gegnern (die halten dann Abstand); Treffer kommen über onBite/onSpin/onBark/onStomp.
import * as THREE from 'three';
import { box, cyl, sphere, cone, makeSign } from './models.js';
import { FX } from './fx.js';
import { ABILITIES } from './abilities.js';

// Goldknochen-IDs der Rätsel je Welt (werden in levels.js an BONES angehängt)
export const PUZZLES = {
  hub: ['memory', 'wettlauf', 'brunnen'],
  kueche: ['kerzen', 'glaeser', 'kamin'],
  strasse: ['klingeln', 'rolltor', 'ballon'],
  buero: ['akte', 'ordner', 'luefter'],
  park: ['maulwurf', 'huepfen', 'seegrund'],
  strand: ['memory', 'rettungsturm', 'drachen'],
  hafen: ['glocken', 'container', 'speicher'],
  dorf: ['pflaster', 'kuhglocken', 'taubenschlag'],
  kanal: ['ventile', 'rohrpost', 'gitter'],
};
// Rückkehr-Rätsel: Goldknochen → Fähigkeit aus einer späteren Welt
export const NEEDS = {
  'hub:brunnen': 'bauchklatscher', 'kueche:kamin': 'wandsprung', 'strasse:ballon': 'gleiten', 'buero:luefter': 'tornado',
  'park:seegrund': 'tauchen', 'strand:drachen': 'gleiten', 'hafen:speicher': 'wandsprung', 'dorf:taubenschlag': 'tornado',
};
const LEARNED = { apportieren: 'Garten', trillern: 'Erdgeschoss', bellen: 'in der Einkaufsstraße', bauchklatscher: 'im Büro', buddeln: 'im Grillpark', zoomies: 'beim Rattenrennen', tauchen: 'am Strand', gleiten: 'am Hafen', wandsprung: 'im Dorf', tornado: 'im Kanal' };

const TAU = Math.PI * 2;
const AB = a => ABILITIES[a] || { tauchen: { name: 'Tauchen', icon: '🤿' } }[a];
const glow = (m, c, k = 0.6) => { m.material = m.material.clone(); m.material.emissive = new THREE.Color(c).multiplyScalar(k); return m; };
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Memory-Bildchen: kleine, gut unterscheidbare Low-Poly-Dinge
const SYMBOLS = {
  apfel: () => { const g = new THREE.Group(); g.add(sphere(0.42, 0xe53935, 0, 0.42, 0, 8)); g.add(box(0.06, 0.25, 0.06, 0x5d3f26, 0, 0.9, 0)); g.add(box(0.25, 0.04, 0.12, 0x4caa4c, 0.12, 0.88, 0)); return g; },
  karotte: () => { const g = new THREE.Group(); g.add(cone(0.24, 0.9, 0xf0761e, 0, 0.5, 0, 8).rotateX(Math.PI)); [-0.4, 0, 0.4].forEach(a => { const l = box(0.08, 0.4, 0.08, 0x3fae49, Math.sin(a) * 0.15, 1.1, 0); l.rotation.z = a; g.add(l); }); return g; },
  knochen: () => { const g = new THREE.Group(); g.add(cyl(0.11, 0.11, 0.8, 0xf5f0e1, 0, 0.3, 0, 8).rotateZ(Math.PI / 2)); [-1, 1].forEach(s => [-1, 1].forEach(t => g.add(sphere(0.16, 0xf5f0e1, s * 0.42, 0.3, t * 0.12, 7)))); return g; },
  ball: () => { const g = new THREE.Group(); g.add(sphere(0.4, 0xc6e83a, 0, 0.42, 0, 10)); const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 4, 18), new THREE.MeshLambertMaterial({ color: 0xffffff })); r.position.y = 0.42; g.add(r); return g; },
  muschel: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = cone(0.12, 0.7, 0xffb8c6, (i - 2) * 0.13, 0.3, 0, 5); s.rotation.z = (i - 2) * 0.35; g.add(s); } g.add(sphere(0.15, 0xffd1dc, 0, 0.05, 0, 6)); return g; },
  seestern: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, s = box(0.18, 0.12, 0.6, 0xff7f50, Math.sin(a) * 0.3, 0.12, Math.cos(a) * 0.3); s.rotation.y = a; g.add(s); } return g; },
  fisch: () => { const g = new THREE.Group(); const b = sphere(0.35, 0x74b9ff, 0, 0.4, 0, 8); b.scale.set(1.4, 0.8, 0.5); g.add(b); g.add(cone(0.25, 0.4, 0x0984e3, -0.6, 0.4, 0, 4).rotateZ(Math.PI / 2)); return g; },
  krebs: () => { const g = new THREE.Group(); const b = sphere(0.34, 0xd63031, 0, 0.3, 0, 8); b.scale.y = 0.6; g.add(b); [-1, 1].forEach(s => g.add(sphere(0.14, 0xd63031, s * 0.45, 0.45, 0.2, 6))); return g; },
};

// Holzschild mit Text, Hinweis als Einblendung, sobald Moll in die Nähe kommt (einmal je Besuch)
function hintSign(l, id, x, z, title, tip, o = {}) {
  const y = o.y ?? Math.max(0, l.top(x, z)), s = makeSign(title, { w: o.w ?? 2.6, post: o.post ?? 1.3 });
  l.deco(s, x, y, z, o.ry ?? Math.atan2(l.spawn.x - x, l.spawn.z - z));
  l.solids.push({ min: { x: x - 0.2, y, z: z - 0.2 }, max: { x: x + 0.2, y: y + (o.post ?? 1.3), z: z + 0.2 }, active: true });
  if (tip) l.trigger(x, y, z, o.r ?? 5, () => l.once('pz:' + id, tip, 5000), false);
  return s;
}

export function installPuzzles(Level) {
  const wrap = (name, fn) => { const orig = Level.prototype[name]; Level.prototype[name] = function (...a) { const r = orig.apply(this, a); fn.apply(this, a); return r; }; };
  const before = (name, fn) => { const orig = Level.prototype[name]; Level.prototype[name] = function (...a) { fn.apply(this, a); return orig.apply(this, a); }; };
  before('_initDetails', function () { this._initPuzzles(); });
  wrap('updateGadgets', function (dt) { this._pzUpdate(dt); });
  wrap('onBite', function (point, r) { this._pzHit('bite', point, r); });
  wrap('onSpin', function (point, r, hit) { this._pzHit('spin', point, r, hit); });
  wrap('onBark', function (point, fwd, range) { this._pzHit('bark', point, range, null, fwd); });
  wrap('onStomp', function (point) { this._pzHit('stomp', point, 0.6); });

  Object.assign(Level.prototype, {
    _initPuzzles() {
      this.puzzles = []; this.pzHits = []; this.pzSteps = []; this.pzTimers = []; this.pzLater = []; this.pzAnims = []; this.pzCages = []; this._pzNeedT = 0;
      const w = WORLDS[this.key]; if (w) w(this, this.game);
      for (const z of this.puzzles) if (z.need && z.bone) z.bone.backtrack = true;
      this.pzKeep = [...this.pzHits, ...this.pzSteps, ...this.pzCages].map(e => ({ x: e.x, z: e.z, r: 2.5 })) // Deko hält Abstand (auch keine Trittsteine zu Rückkehr-Knochen)
        .concat(this.puzzles.filter(z => z.bone).map(z => ({ x: z.bone.x, z: z.bone.z, r: z.need ? 7 : 3.5 })));
    },
    // Rätsel anmelden: id = Goldknochen, Rest landet im Eintrag (für Tests: l.puzzles)
    pzAdd(id, kind, data = {}) { const z = { id, kind, need: NEEDS[`${this.key}:${id}`], ...data, solved: () => this.game.hasBone(this.key, id) || !!z.won }; this.puzzles.push(z); return z; },
    // Fähigkeit da? Sonst Hinweis, wo man sie lernt (nicht öfter als alle 3 s)
    pzNeed(ab) {
      if (!ab || this.game.has(ab)) return true;
      if (this.t - this._pzNeedT > 3) { this._pzNeedT = this.t; const A = AB(ab); this.game.toast(`${A.icon} Hier braucht Moll ${A.name} – das lernt sie ${LEARNED[ab]}. Komm später wieder!`, 4000); }
      return false;
    },
    // Goldknochen des Rätsels: bis zur Lösung vergraben (caged = sichtbar im Käfig, aber nicht zu holen)
    pzBone(id, x, y, z, o = {}) {
      const p = this.goldbone(id, x, y, z); p.pz = true;
      if (!this.game.hasBone(this.key, id)) { if (o.caged) { p.buried = true; p.caged = true; } else this.bury(p); }
      return p;
    },
    pzWin(z, p, text) {
      if (z.won) return; z.won = true;
      this.game.audio.sfx('big'); this.game.shake(0.2); this.game.toast(text || 'Rätsel gelöst! Ein GOLDKNOCHEN! 🦴', 3200);
      if (p) { const was = p.caged; p.caged = false; if (p.buried) { this.unbury(p); if (was) { p.appear = 1; p.mesh.scale.setScalar(1); } } FX.gold(this.game.fx, { x: p.x, y: p.y + 0.5, z: p.z }); }
    },
    pzWait(sec, fn) { this.pzLater.push({ t: this.t + sec, fn }); },
    // ---- Treffer verteilen. Mehrere Ziele in Reichweite: das nächste bekommt den Treffer (multi-Ziele alle)
    _pzHit(kind, point, r = 1.6, hit, fwd) {
      let best = null, bd = 1e9;
      for (const e of this.pzHits) {
        if (!e[kind] || e.off || (hit && hit.has(e))) continue;
        const dx = e.x - point.x, dz = e.z - point.z, d = Math.hypot(dx, dz), dy = e.y - point.y;
        if (kind === 'bark') { if (d > (e.range ?? 9) || Math.abs(dy) > 5 || (d > 1.5 && (dx * fwd.x + dz * fwd.z) / d < 0.35)) continue; }
        else if (kind === 'stomp') { if (d > (e.r ?? 1) + r || dy > 0.6 || dy < -1.4) continue; }
        else if (d > (e.r ?? 1) + r || Math.abs(dy) > (kind === 'spin' ? 2.5 : 2)) continue;
        if (e.multi) { hit?.add(e); e[kind](point); continue; }
        if (d < bd) { bd = d; best = e; }
      }
      if (best) { hit?.add(best); best[kind](point); }
    },
    _pzUpdate(dt) {
      const pl = this.game.player, pp = pl.pos;
      for (let i = this.pzLater.length - 1; i >= 0; i--) if (this.t >= this.pzLater[i].t) { const w = this.pzLater.splice(i, 1)[0]; w.fn(); }
      for (const t of [...this.pzTimers]) {
        t.left -= dt; const s = Math.max(0, Math.ceil(t.left));
        if (s !== t.shown) { t.shown = s; if (s > 0) this.game.audio.sfx(s <= 3 ? 'tock' : 'tick'); this._pzHud(s > 0 ? `⏱ ${s}` : null); }
        t.tick?.(t.left);
        if (t.left <= 0) { this.pzTimers.splice(this.pzTimers.indexOf(t), 1); this._pzHud(null); t.end?.(); }
      }
      // Schritt-Felder (Memory, Fliesen): betreten zählt, wenn Moll darauf steht
      let on = null;
      if (pl.onGround) for (const s of this.pzSteps) if (!s.off && Math.abs(pp.x - s.x) < s.hw && Math.abs(pp.z - s.z) < s.hd && Math.abs(pp.y - s.top) < 0.4) { on = s; break; }
      if (on !== this._pzOn) { this._pzOn = on; if (on) on.step(); }
      for (const c of this.pzCages) { const k = c.open ? 1 : 0; if (c.k !== k) { c.k += Math.sign(k - c.k) * Math.min(Math.abs(k - c.k), dt * 2.5); c.bars.position.y = c.k * (c.h + 0.3); } }
      for (const p of this.pickups) if (p.caged && !p.taken) { p.mesh.rotation.y += dt * 2.5; p.mesh.position.y = p.y + Math.sin(this.t * 3) * 0.12; }
      for (let i = this.pzAnims.length - 1; i >= 0; i--) if (this.pzAnims[i](dt) === false) this.pzAnims.splice(i, 1);
    },
    _pzHud(text) {
      let el = document.getElementById('pztimer');
      if (!el) { el = document.createElement('div'); el.id = 'pztimer'; el.style.cssText = 'position:fixed;left:50%;top:14%;transform:translateX(-50%);font:900 42px system-ui,sans-serif;color:#fff;text-shadow:0 3px 0 #2d3436,0 0 14px rgba(0,0,0,.5);pointer-events:none;z-index:30;display:none'; document.body.appendChild(el); }
      el.style.display = text ? 'block' : 'none'; if (text) el.textContent = text;
    },
    // Countdown mit Ticken und großer Anzeige; end() wenn abgelaufen, stop() bricht ohne end ab
    pzTimer(sec, end, tick) { this.pzTimers.forEach(t => t.stop()); const t = { left: sec, end, tick, shown: -1, stop: () => { const i = this.pzTimers.indexOf(t); if (i >= 0) { this.pzTimers.splice(i, 1); this._pzHud(null); } } }; this.pzTimers.push(t); return t; },

    // ---- Käfig um einen Knochen: Gitterstäbe fahren hoch (open) und wieder runter (close)
    cage(x, y, z, o = {}) {
      const r = o.r ?? 1.3, h = o.h ?? 2.4, color = o.color ?? 0x7f8c8d, g = new THREE.Group(); g.position.set(x, y, z); this.group.add(g);
      this.deco(cyl(r + 0.25, r + 0.3, 0.2, 0x636e72, 0, 0, 0, 14), x, y + 0.1, z).userData.merge = true;
      const bars = new THREE.Group(); g.add(bars);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; bars.add(cyl(0.06, 0.06, h, color, Math.cos(a) * r, h / 2, Math.sin(a) * r, 5)); }
      bars.add(cyl(r + 0.12, r + 0.12, 0.18, color, 0, h, 0, 14)); bars.add(sphere(0.25, o.knob ?? 0xffd32a, 0, h + 0.25, 0, 8));
      const solid = { min: { x: x - r, y, z: z - r }, max: { x: x + r, y: y + h + 0.1, z: z + r }, active: true };
      this.solids.push(solid);
      const c = { x, y, z, r, h, bars, solid, open: false, k: 0 };
      c.set = v => { if (!v && Math.hypot(this.game.player.pos.x - x, this.game.player.pos.z - z) < r + 0.6) return; c.open = v; solid.active = !v; this.game.audio.sfx(v ? 'creak' : 'bonk'); };
      this.pzCages.push(c); return c;
    },
    // ---- Schalter: by = 'bite' | 'stomp' | 'bark' | 'spin'. Knopf am Boden (Bodenplatte) oder an einem Pfosten (o.post = Höhe)
    button(x, y, z, by, cb, o = {}) {
      const color = o.color ?? 0xe74c3c, post = o.post ?? (by === 'stomp' ? 0 : 1.1);
      let cap, up, dn;
      if (post) {
        this.box(x, y, z, 0.35, post, 0.35, 0x636e72);
        if (by === 'bark') { cap = glow(cone(0.45, 0.8, color, 0, 0, 0, 10), color, 0.3); cap.rotation.x = Math.PI / 2; } // Trichter: hier hineinbellen
        else if (by === 'spin') { cap = glow(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 6, 14), new THREE.MeshToonMaterial({ color })), color, 0.3); cap.rotation.x = Math.PI / 2; }
        else cap = glow(sphere(0.38, color, 0, 0, 0, 10), color, 0.3);
        up = y + post + 0.3; dn = up - 0.15; cap.position.set(x, up, z); this.group.add(cap);
        if (o.ry !== undefined) cap.rotation.y = o.ry;
      } else {
        this.box(x, y, z, 2, 0.22, 2, 0x636e72);
        cap = glow(cyl(0.7, 0.8, 0.3, color, x, 0, z, 14), color, 0.3); up = y + 0.37; dn = y + 0.25; cap.position.y = up; this.group.add(cap);
      }
      const e = { x, y: post ? y + 0.2 : y + 0.22, z, r: post ? 0.8 : 1, range: o.range, down: false, cap };
      e[by] = () => {
        if (e.down) return; if (o.need && !this.pzNeed(o.need)) return;
        e.down = true; cap.position.y = dn; cap.material.emissive.setHex(0x00b894); this.game.audio.sfx('click'); FX.sparkle(this.game.fx, { x, y: up, z }); cb(e);
      };
      e.reset = () => { e.down = false; cap.position.y = up; cap.material.emissive.copy(new THREE.Color(color).multiplyScalar(0.3)); };
      this.pzHits.push(e); return e;
    },
    // ---- Plattformen auf Zeit: unsichtbar-blass bis set(true), blinken in den letzten Sekunden
    tempPlats(list, color = 0x74b9ff) {
      const ps = list.map(([x, y, z, w = 2.6, d = 2.6, h = 0.4]) => {
        const s = this.box(x, y - h, z, w, h, d, color, { dynamic: true }); s.active = false; s.mesh.castShadow = false;
        s.mesh.material.transparent = true; s.mesh.material.opacity = 0.16; s.mesh.material.depthWrite = false; return s;
      });
      const t = { ps, on: false };
      t.set = v => { t.on = v; ps.forEach(s => { s.active = v; s.mesh.material.opacity = v ? 1 : 0.16; s.mesh.material.transparent = !v; s.mesh.material.depthWrite = v; s.mesh.castShadow = v; }); if (v) ps.forEach(s => FX.sparkle(this.game.fx, { x: (s.min.x + s.max.x) / 2, y: s.max.y, z: (s.min.z + s.max.z) / 2 })); };
      t.blink = left => { if (!t.on) return; const vis = left > 3 || Math.sin(left * 18) > -0.3; ps.forEach(s => { s.mesh.material.opacity = vis ? 1 : 0.35; s.mesh.material.transparent = !vis; }); };
      return t;
    },
    // Zeitschalter: Schalter startet Countdown, open(true) bei Start, open(false) wenn die Zeit um ist; Schalter wird wieder scharf
    timedSwitch(btn, sec, open, z) {
      const cb0 = btn.onPress; btn.onPress = () => { cb0?.(); open(true); this.game.toast(`Schnell! ${sec} Sekunden!`, 1600); this.pzTimer(sec, () => { if (z?.solved()) return; open(false); btn.reset(); this.game.toast('Zu langsam! Nochmal …', 2000); }, left => z?.tick?.(left)); };
      return btn;
    },
    // Schritt-Feld (für Memory und Fliesen)
    pzStep(x, top, z, hw, hd, step) { const s = { x, top, z, hw, hd, step, off: false }; this.pzSteps.push(s); return s; },

    // ---- Memory: Platten betreten deckt das Bildchen auf; zwei gleiche bleiben offen, sonst klappen sie wieder zu
    memory(id, x, y, z, cols, rows, gap, symbols, p) {
      const r = seeded(this.key + ':' + id), syms = shuffle([...symbols, ...symbols], r), tiles = [];
      const zz = this.pzAdd(id, 'memory', { tiles, bone: p });
      let open = [], lock = false, pairs = 0;
      syms.forEach((sym, i) => {
        const tx = x + (i % cols - (cols - 1) / 2) * gap, tz = z + (Math.floor(i / cols) - (rows - 1) / 2) * gap, s = gap * 0.82;
        this.box(tx, y, tz, s, 0.22, s, 0x8395a7);
        const cover = box(s - 0.2, 0.06, s - 0.2, 0xdfe6e9, tx, y + 0.25, tz); this.group.add(cover);
        cover.add(box(0.5, 0.02, 0.5, 0xb2bec3, 0, 0.04, 0)); // Fragezeichen-Fleck
        const icon = SYMBOLS[sym](); icon.position.set(tx, y + 0.3, tz); icon.scale.setScalar(0.01); icon.visible = false; this.group.add(icon);
        const t = { i, x: tx, z: tz, sym, cover, icon, shown: false, matched: false };
        const show = v => { t.shown = v; icon.visible = true; cover.material.color.setHex(v ? 0xfff3a0 : 0xdfe6e9); const k0 = v ? 0.01 : 1, k1 = v ? 1 : 0.01; let a = 0; this.pzAnims.push(dt => { a = Math.min(1, a + dt * 5); icon.scale.setScalar(k0 + (k1 - k0) * a); if (a >= 1) { icon.visible = v; return false; } }); };
        t.step = () => {
          if (lock || t.shown || zz.won) return;
          show(true); this.game.audio.note(open.length ? 7 : 0, 'marimba'); open.push(t);
          if (open.length < 2) return;
          const [a, b] = open; open = [];
          if (a.sym === b.sym) {
            a.matched = b.matched = true; [a, b].forEach(q => q.cover.material.color.setHex(0x55efc4)); pairs++; this.game.audio.sfx('collect');
            if (pairs === symbols.length) this.pzWait(0.5, () => this.pzWin(zz, p, 'Alle Paare gefunden! 🦴'));
            else this.game.toast(`Paar ${pairs}/${symbols.length}!`, 1200);
          } else { lock = true; this.pzWait(0.9, () => { this.game.audio.sfx('bonk'); a.hide(); b.hide(); lock = false; }); }
        };
        t.hide = () => show(false);
        this.pzStep(tx, y + 0.22, tz, s / 2, s / 2, () => t.step()); tiles.push(t);
      });
      return zz;
    },
    // ---- Reihenfolge nachspielen: Starter (BISS) spielt die Melodie vor, dann die Dinge in derselben Reihenfolge treffen
    melody(id, items, o, p) {
      const r = seeded(this.key + ':' + id + ':m'), seq = []; while (seq.length < o.len) { const k = Math.floor(r() * items.length); if (k !== seq[seq.length - 1]) seq.push(k); }
      const zz = this.pzAdd(id, 'melody', { items, seq, by: o.by, bone: p });
      let pos = 0, armed = false, playing = false;
      const flash = (it, ok = true) => { this.game.audio.note(it.note, o.inst ?? 'glock'); it.mesh.traverse(m => m.material?.emissive?.setHex(ok ? 0xffd32a : 0xd63031)); let a = 0; this.pzAnims.push(dt => { a += dt; it.mesh.scale.setScalar(1 + Math.sin(Math.min(1, a * 3) * Math.PI) * 0.25); if (a > 0.45) { it.mesh.traverse(m => m.material?.emissive?.setHex(0x000000)); it.mesh.scale.setScalar(1); return false; } }); };
      const play = () => { playing = true; armed = true; pos = 0; seq.forEach((k, i) => this.pzWait(0.4 + i * 0.7, () => flash(items[k]))); this.pzWait(0.5 + seq.length * 0.7, () => { playing = false; this.game.toast(o.go ?? 'Jetzt du – in derselben Reihenfolge!', 2200); }); };
      zz.play = play;
      items.forEach((it, k) => {
        const e = { x: it.x, y: it.y, z: it.z, r: it.r ?? 0.8, range: it.range ?? 8 };
        e[o.by] = () => {
          if (zz.won || playing) return; if (o.need && !this.pzNeed(o.need)) return;
          if (!armed) { flash(it); this.game.toast(o.first ?? 'Erst zuhören!', 1800); return; }
          if (seq[pos] === k) { flash(it); pos++; if (pos === seq.length) this.pzWait(0.5, () => this.pzWin(zz, p, o.win)); }
          else { flash(it, false); this.game.audio.sfx('bonk'); this.game.toast('Falsch! Hör nochmal genau hin …', 2000); armed = false; this.pzWait(1.2, play); }
        };
        this.pzHits.push(e);
      });
      this.interactable(o.start.x, o.start.y, o.start.z, 1.4, it => { it.used = false; if (!zz.won && !playing) play(); }, o.startHint ?? 'BISS = vorspielen');
      return zz;
    },
    // ---- Umdreh-Fliesen: betreten dreht die Fliese und ihre Nachbarn um – alle gelb = gelöst. BISS am Schild setzt zurück
    flipTiles(id, x, y, z, n, cell, p, o = {}) {
      const r = seeded(this.key + ':' + id + ':f'), st = new Array(n * n).fill(true), tiles = [], presses = [];
      const zz = this.pzAdd(id, 'flip', { tiles, presses, bone: p });
      const ON = o.on ?? 0xffd32a, OFF = o.off ?? 0x636e72;
      const paint = () => tiles.forEach((t, i) => { t.top.material.color.setHex(st[i] ? ON : OFF); t.top.material.emissive.setHex(st[i] ? 0x6b4f00 : 0x000000); });
      const press = i => { const cx = i % n, cz = Math.floor(i / n); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { const a = cx + dx, b = cz + dz; if (a >= 0 && a < n && b >= 0 && b < n) st[b * n + a] = !st[b * n + a]; }); };
      while (presses.length < (o.moves ?? 3)) { const i = Math.floor(r() * n * n); if (!presses.includes(i)) presses.push(i); }
      const start = () => { st.fill(true); presses.forEach(press); };
      for (let i = 0; i < n * n; i++) {
        const tx = x + (i % n - (n - 1) / 2) * cell, tz = z + (Math.floor(i / n) - (n - 1) / 2) * cell, s = cell * 0.88;
        this.box(tx, y, tz, s, 0.2, s, 0x2d3436);
        const top = glow(box(s - 0.15, 0.06, s - 0.15, OFF, tx, y + 0.23, tz), 0); this.group.add(top);
        const t = { i, x: tx, z: tz, top }; tiles.push(t);
        this.pzStep(tx, y + 0.2, tz, s / 2, s / 2, () => { if (zz.won) return; press(i); paint(); this.game.audio.note(st[i] ? 7 : 2, 'xylo');
          if (st.every(v => v)) { tiles.forEach(t => t.top.material.emissive.setHex(0xb8860b)); this.pzWait(0.4, () => this.pzWin(zz, p, o.win ?? 'Alle Fliesen leuchten! 🦴')); } });
      }
      start(); if (this.game.hasBone(this.key, id)) st.fill(true); paint();
      zz.reset = () => { if (zz.won) return; start(); paint(); this.game.audio.sfx('pop'); };
      if (o.reset) this.interactable(o.reset[0], o.reset[1], o.reset[2], 1.4, it => { it.used = false; zz.reset(); this.game.toast('Fliesen zurückgesetzt.', 1400); }, 'BISS = neu anfangen');
      return zz;
    },
    // ---- Maulwurf-Klopfen: BISS am Startpfosten, dann need Maulwürfe in time Sekunden beißen
    moles(id, x, y, z, holes, need, time, p, o = {}) {
      const ms = holes.map(([dx, dz]) => {
        const hx = x + dx, hz = z + dz, hy = o.flat ? y : Math.max(y, this.top(hx, hz));
        const mound = sphere(0.9, 0x6d4c33, 0, 0, 0, 8); mound.scale.set(1, 0.35, 1); this.deco(mound, hx, hy, hz); mound.userData.merge = true;
        this.deco(cyl(0.45, 0.45, 0.05, 0x2d1d12, 0, 0, 0, 10), hx, hy + 0.3, hz).userData.merge = true;
        const g = new THREE.Group(); g.position.set(hx, hy - 0.6, hz); this.group.add(g);
        g.add(sphere(0.42, 0x4a3b30, 0, 0.4, 0, 8)); g.add(sphere(0.12, 0xff8fb1, 0, 0.5, 0.38, 6)); [-0.15, 0.15].forEach(s => g.add(sphere(0.06, 0x111111, s, 0.66, 0.3, 4)));
        [-1, 1].forEach(s => g.add(box(0.18, 0.06, 0.25, 0xffe0bd, s * 0.32, 0.25, 0.3)));
        return { x: hx, y: hy + 0.3, z: hz, g, hy, up: 0, t: 0 };
      });
      const zz = this.pzAdd(id, 'moles', { moles: ms, count: need, bone: p });
      let run = false, hits = 0, next = 0;
      ms.forEach(m => {
        const e = { x: m.x, y: m.y, z: m.z, r: 0.7 };
        e.bite = e.stomp = () => { if (!run || m.t <= 0) return; m.t = 0; hits++; this.game.audio.sfx('bonk'); FX.dust(this.game.fx, m, 8); this.game.toast(`Maulwurf ${hits}/${need}`, 900);
          if (hits >= need) { run = false; this.pzTimers.forEach(t => t.stop()); this.pzWin(zz, p, 'Alle Maulwürfe erwischt! 🦴'); } };
        this.pzHits.push(e);
      });
      this.pzAnims.push(dt => {
        if (run) { next -= dt; if (next <= 0) { next = 0.7 + Math.random() * 0.5; const free = ms.filter(m => m.t <= 0); if (free.length) { const m = free[Math.floor(Math.random() * free.length)]; m.t = 1.5; this.game.audio.sfx('pop'); } } }
        for (const m of ms) { if (m.t > 0) m.t -= dt; const k = m.t > 0 ? 1 : 0; m.up += (k - m.up) * Math.min(1, dt * 12); m.g.position.y = m.hy - 0.6 + m.up * 0.75; m.g.rotation.y += dt * 2; }
      });
      zz.start = () => { if (run || zz.solved()) return; run = true; hits = 0; next = 0.3; this.game.toast(`Beiß ${need} Maulwürfe in ${time} Sekunden!`, 2000); this.pzTimer(time, () => { run = false; ms.forEach(m => m.t = 0); this.game.toast(`Nur ${hits}/${need} – nochmal!`, 2200); }); };
      this.interactable(o.start[0], o.start[1], o.start[2], 1.4, it => { it.used = false; zz.start(); }, 'BISS = Spiel starten');
      return zz;
    },
    // ---- Kerzen: TRILLERN pustet sie aus, nach relight Sekunden brennen sie wieder – alle zugleich aus = gelöst
    candles(id, pts, relight, p, o = {}) {
      const cs = pts.map(([x, y, z]) => {
        this.deco(cyl(0.12, 0.12, 0.6, o.wax ?? 0xfdf6e3, 0, 0.3, 0, 8), x, y, z).userData.merge = true;
        const fl = sphere(0.12, 0xffb142, 0, 0, 0, 6); fl.material = new THREE.MeshBasicMaterial({ color: 0xffd56b }); fl.scale.y = 1.6; this.deco(fl, x, y + 0.75, z);
        return { x, y, z, fl, out: 0 };
      });
      const zz = this.pzAdd(id, 'candles', { candles: cs, bone: p }), solvedNow = this.game.hasBone(this.key, id);
      cs.forEach(c => {
        if (solvedNow) { c.out = 1e9; c.fl.visible = false; }
        const e = { x: c.x, y: c.y, z: c.z, r: 0.4, multi: true };
        e[o.by ?? 'spin'] = () => {
          if (c.out > 0 || zz.won) return; c.out = relight; c.fl.visible = false; this.game.audio.sfx('poof');
          this.game.fx.burst({ x: c.x, y: c.y + 0.8, z: c.z }, { n: 6, color: [0xb2bec3, 0xdfe6e9], speed: 0.6, up: 1.5, life: 0.9, size: 0.18, gravity: -1 });
          const n = cs.filter(q => q.out > 0).length; if (n === cs.length) this.pzWin(zz, p, o.win ?? 'Alle Kerzen aus! 🦴'); else this.game.toast(`Kerzen aus: ${n}/${cs.length}`, 900);
        };
        this.pzHits.push(e);
      });
      this.pzAnims.push(dt => { for (const c of cs) { if (zz.won) return; if (c.out > 0) { c.out -= dt; if (c.out <= 0) { c.fl.visible = true; this.game.audio.sfx('crackle'); } } else c.fl.scale.set(1 + Math.sin(this.t * 17 + c.x) * 0.15, 1.6 + Math.sin(this.t * 11 + c.z) * 0.25, 1); } });
      return zz;
    },
    // ---- Buchstaben-Platten: mit by (Bauchklatscher) das Wort der Reihe nach treffen, falsch = von vorn
    letters(id, x, y, z, chars, word, cols, gap, by, p, o = {}) {
      const zz = this.pzAdd(id, 'letters', { word, tiles: [], bone: p }); let pos = 0;
      const show = o.display ? makeSign(word.replace(/./g, '_ ').trim(), { w: 3.4, post: o.display[3] ?? 1.6 }) : null;
      if (show) this.deco(show, o.display[0], o.display[1], o.display[2], o.display[4] ?? 0);
      const progress = () => show?.userData.setText([...word].map((ch, i) => i < pos ? ch : '_').join(' '));
      [...chars].forEach((ch, i) => {
        const tx = x + (i % cols - (cols - 1) / 2) * gap, tz = z + (Math.floor(i / cols) - Math.floor((chars.length - 1) / cols) / 2) * gap, s = gap * 0.8;
        this.box(tx, y, tz, s, 0.2, s, 0x57606f);
        const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
        g.fillStyle = '#f5f6fa'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c0392b'; g.font = '900 96px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70);
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
        const face = new THREE.Mesh(new THREE.PlaneGeometry(s - 0.2, s - 0.2), new THREE.MeshLambertMaterial({ map: tex })); face.rotation.x = -Math.PI / 2; face.rotation.z = o.faceRy ?? 0; face.position.set(tx, y + 0.22, tz); this.group.add(face);
        const t = { ch, x: tx, z: tz, face }; zz.tiles.push(t);
        const e = { x: tx, y: y + 0.2, z: tz, r: s / 2 - 0.2 };
        e[by] = () => {
          if (zz.won) return;
          if (ch === word[pos]) { pos++; face.material.color.setHex(0x7bed9f); this.game.audio.note([0, 4, 7, 12, 16][Math.min(4, pos - 1)], 'glock'); progress();
            if (pos === word.length) this.pzWait(0.4, () => this.pzWin(zz, p, o.win)); }
          else { pos = 0; this.game.audio.sfx('bonk'); zz.tiles.forEach(q => q.face.material.color.setHex(0xffffff)); face.material.color.setHex(0xff7675); this.pzWait(0.5, () => face.material.color.setHex(0xffffff)); this.game.toast('Falscher Stempel! Von vorn …', 1600); progress(); }
        };
        this.pzHits.push(e);
      });
      if (this.game.hasBone(this.key, id)) { pos = word.length; zz.tiles.forEach(q => word.includes(q.ch) && q.face.material.color.setHex(0x7bed9f)); }
      progress(); return zz;
    },
    // ---- Backstein-Schacht für den Wandsprung: zwei Wände (along = Wände quer zu x), Sims oben, Knochen darauf
    shaft(x, y, z, h, gap = 4, along = 'x') {
      if (along === 'x') { this.climbWall(x - gap / 2 - 1, y, z, 2, h, 4); this.climbWall(x + gap / 2 + 0.5, y, z, 1, h, 4); this.box(x - gap / 2 - 2.5, y + h - 0.4, z, 3, 0.4, 4, 0x8d4a3b); return { x: x - gap / 2 - 2.5, y: y + h, z }; }
      this.climbWall(x, y, z - gap / 2 - 1, 4, h, 2); this.climbWall(x, y, z + gap / 2 + 0.5, 4, h, 1); this.box(x, y + h - 0.4, z - gap / 2 - 2.5, 4, 0.4, 3, 0x8d4a3b); return { x, y: y + h, z: z - gap / 2 - 2.5 };
    },
    // ---- Truhe (unter Wasser): BISS öffnet den Deckel
    chest(x, y, z, cb, need) {
      this.box(x, y, z, 1.8, 0.9, 1.2, 0x8d6e4a); this.deco(box(1.9, 0.12, 1.3, 0xd4a017), x, y + 0.5, z).userData.merge = true;
      const lid = new THREE.Group(); lid.position.set(x, y + 0.9, z - 0.6); lid.add(box(1.85, 0.35, 1.25, 0x6d4c33, 0, 0.17, 0.6)); lid.add(box(0.3, 0.25, 0.1, 0xd4a017, 0, 0.05, 1.25)); this.group.add(lid);
      let open = false;
      this.interactable(x, y + 0.5, z, 1.6, it => { if (need && !this.pzNeed(need)) { it.used = false; return; } if (open) return; open = true; this.game.audio.sfx('creak'); let a = 0; this.pzAnims.push(dt => { a = Math.min(1, a + dt * 2); lid.rotation.x = -a * 1.9; return a < 1; }); cb(); }, 'BISS = öffnen');
      return { open: () => open, lid };
    },
  });
}

// Gemeinsames Muster: Knopf startet Countdown, Käfig geht auf, Knochen darin
function cageRace(l, id, btn, cagePos, sec, o = {}) {
  const [cx, cz] = cagePos, cy = o.cy ?? Math.max(0, l.top(cx, cz)), p = l.pzBone(id, cx, cy + 0.9, cz, { caged: true });
  const c = l.cage(cx, cy, cz, { color: o.color }); const z = l.pzAdd(id, 'race', { cage: c, button: btn, sec, bone: p });
  if (l.game.hasBone(l.key, id)) { c.set(true); c.k = 1; c.bars.position.y = c.h + 0.3; btn.down = true; }
  btn.onPress = () => {};
  l.timedSwitch(btn, sec, v => { c.set(v); if (p.taken) return; if (c.open) { p.buried = false; p.caged = false; } else { p.buried = true; p.caged = true; } }, z);
  p.onTake = (orig => q => { orig?.(q); z.won = true; l.pzTimers.forEach(t => t.stop()); })(p.onTake);
  return z;
}
// Knopf → Plattformen auf Zeit
function platRace(l, id, btn, plats, sec, p, color) {
  const t = l.tempPlats(plats, color), z = l.pzAdd(id, 'plats', { plats: t, button: btn, sec, bone: p });
  btn.onPress = () => {}; l.timedSwitch(btn, sec, v => t.set(v), z); z.tick = left => t.blink(left);
  p.onTake = (orig => q => { orig?.(q); z.won = true; })(p.onTake);
  return z;
}
// Fähigkeiten-Hinweis: Schild mit Symbol, Trigger zeigt, was fehlt (oder wie es geht)
function abilitySign(l, id, x, z, ab, tipHave, o = {}) {
  const A = AB(ab);
  const s = hintSign(l, id, x, z, `${A.icon} ${A.name}`, null, o);
  const y = o.y ?? Math.max(0, l.top(x, z));
  l.trigger(x, y, z, o.r ?? 5, () => { if (l.game.has(ab)) l.once('pz:' + id, tipHave, 4500); else l.pzNeed(ab); }, false);
  return s;
}
const button = (l, x, z, by, o = {}) => l.button(x, o.y ?? Math.max(0, l.top(x, z)), z, by, b => b.onPress?.(), o);
const G = (l, x, z) => Math.max(0, l.top(x, z));

// ======================================================================= Welten
export const WORLDS = {
  // ---------------------------------------------------------------- Garten
  hub(l) {
    // Gemüse-Memory im Südwesten: Platten betreten
    const mp = l.pzBone('memory', -60, 1.2, 39.5);
    l.memory('memory', -60, 0, 34, 4, 2, 3.4, ['apfel', 'karotte', 'knochen', 'ball'], mp);
    hintSign(l, 'memory', -66.5, 39, 'Garten-Memory', 'Lauf über die Platten und finde die Paare! Zwei gleiche bleiben offen.');
    // Wettlauf: Gartenhahn beißen, dann in 10 Sekunden zum Käfig in der Obstwiese
    const b = button(l, 46, -38, 'bite', { color: 0x0984e3 });
    hintSign(l, 'wettlauf', 43, -35.5, 'Wettlauf', 'Beiß den blauen Hahn – dann hast du 10 Sekunden bis zum Käfig dahinten!');
    l.box(54, 0, -46, 6, 0.9, 1, 0x3f8f3f); l.box(62, 0, -54, 1, 0.9, 6, 0x3f8f3f); // Hecken als Hürden
    cageRace(l, 'wettlauf', b, [70, -62], 10);
    // Rückkehr: alter Brunnen mit morschem Deckel – nur ein Bauchklatscher bricht ihn
    const wx = -66, wz = -38;
    l.box(wx, 0, wz, 3.2, 1.1, 3.2, 0x95a5a6); l.deco(cyl(1.7, 1.8, 1.1, 0xa4a4a4, 0, 0.55, 0, 12), wx, 0, wz).userData.merge = true;
    [-1.4, 1.4].forEach(dx => l.box(wx + dx, 1.1, wz, 0.25, 2.2, 0.25, 0x6d4c41)); l.deco(cone(2.2, 1.2, 0x8b1e1e, 0, 0, 0, 4).rotateY(Math.PI / 4), wx, 3.9, wz).userData.merge = true;
    const lid = cyl(1.45, 1.45, 0.16, 0x8d6e4a, wx, 1.18, wz, 12); l.group.add(lid);
    const bp = l.pzBone('brunnen', wx, 2.3, wz), zb = l.pzAdd('brunnen', 'stomp', { bone: bp, at: [wx, 1.1, wz] });
    if (l.game.hasBone('hub', 'brunnen')) lid.visible = false;
    l.pzHits.push({ x: wx, y: 1.1, z: wz, r: 1.2, stomp: () => { if (!lid.visible || !l.pzNeed('bauchklatscher')) return; lid.visible = false; l.game.audio.sfx('break'); l.game.fx.burst({ x: wx, y: 1.3, z: wz }, { n: 22, color: [0x8d6e4a, 0x6d4c33], speed: 6, up: 5, life: 0.8, size: 0.25 }); l.pzWin(zb, bp, 'Der Deckel ist durch – und im Brunnen glänzt was! 🦴'); } });
    abilitySign(l, 'brunnen', wx + 3.2, wz + 3, 'bauchklatscher', 'Spring auf den Brunnen und mach einen Bauchklatscher auf den Deckel!');
  },

  // ---------------------------------------------------------------- Erdgeschoss
  kueche(l) {
    // Wohnzimmer: lange Festtafel mit 6 Kerzen – alle zugleich auspusten (Trillern)
    l.box(-40, 0, -42, 11, 1.1, 2.4, 0x8b5a2b); [-45, -35].forEach(x => l.box(x, 0, -39.3, 1.2, 0.6, 1.2, 0x6d4c41));
    l.deco(box(11.2, 0.05, 2.6, 0xffffff), -40, 1.13, -42).userData.merge = true; // Tischdecke
    const kp = l.pzBone('kerzen', -40, 1.9, -42);
    l.candles('kerzen', [-44.5, -42.7, -40.9, -39.1, -37.3, -35.5].map(x => [x, 1.15, -42]), 5, kp);
    hintSign(l, 'kerzen', -33, -39, 'Festtafel', 'Alle 6 Kerzen müssen gleichzeitig aus sein – sie gehen nach 5 Sekunden wieder an. TRILLERN!');
    // Wintergarten: Gläser-Melodie (Spieluhr beißen, dann die Gläser in derselben Reihenfolge beißen)
    l.box(2, 0, 40, 15, 0.6, 1.4, 0xa1887f);
    const notes = [0, 2, 4, 7, 9], glasses = [-4, -1, 2, 5, 8].map((x, i) => {
      const g = new THREE.Group(); g.add(glow(cyl(0.28, 0.2, 0.6, 0xdff9fb, 0, 0.3, 0, 10), 0, 0)); g.add(glow(cyl(0.25, 0.19, 0.12 + i * 0.08, [0xff7675, 0xfdcb6e, 0x55efc4, 0x74b9ff, 0xa29bfe][i], 0, 0.08 + i * 0.04, 0, 10), 0, 0));
      l.deco(g, x, 0.6, 40); return { x, y: 0.6, z: 40, mesh: g, note: notes[i] + 12, r: 0.6 };
    });
    const box2 = new THREE.Group(); box2.add(box(1.2, 0.7, 0.9, 0xd35400, 0, 0.35, 0)); box2.add(cyl(0.12, 0.12, 0.4, 0xf1c40f, 0.7, 0.4, 0, 6).rotateZ(Math.PI / 2)); l.deco(box2, 2, 0, 45);
    l.solids.push({ min: { x: 1.4, y: 0, z: 44.55 }, max: { x: 2.6, y: 0.7, z: 45.45 }, active: true });
    const gp = l.pzBone('glaeser', 2, 1.6, 40);
    l.melody('glaeser', glasses, { by: 'bite', len: 5, inst: 'glock', start: { x: 2, y: 0, z: 45 }, startHint: 'BISS = Spieluhr aufziehen', first: 'Zieh erst die Spieluhr auf!', win: 'Was für ein Konzert! 🦴' }, gp);
    hintSign(l, 'glaeser', 9, 45, 'Gläser-Konzert', 'Beiß die Spieluhr, hör zu und beiß dann die Gläser in derselben Reihenfolge!');
    // Rückkehr: Backstein-Kaminschacht im Wohnzimmer, nur mit Wandsprung
    const top = l.shaft(-48, 0, -50, 13); l.pzAdd('kamin', 'shaft', { bone: l.goldbone('kamin', top.x, top.y + 0.8, top.z) });
    abilitySign(l, 'kamin', -44, -46, 'wandsprung', 'Spring im Schacht von Wand zu Wand nach oben!');
  },

  // ---------------------------------------------------------------- Einkaufsstraße
  strasse(l) {
    // Fahrradklingeln-Melodie: Leierkasten beißen, dann die vier Klingeln in der Reihenfolge anbellen
    const cx = -120, cz = -40, bells = [[-131, -37], [-125, -46], [-115, -46], [-109, -37]].map(([x, z], i) => {
      const y = G(l, x, z); l.box(x, y, z, 0.3, 1.8, 0.3, 0x2d3436);
      const g = new THREE.Group(); g.add(glow(sphere(0.45, [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db][i], 0, 0, 0, 10), 0, 0)); g.add(cyl(0.08, 0.08, 0.3, 0x2d3436, 0, 0.5, 0, 6)); l.deco(g, x, y + 2.2, z);
      return { x, y: y + 0.2, z, mesh: g, note: [0, 4, 7, 12][i], range: 9 };
    });
    const org = new THREE.Group(); org.add(box(1.6, 1.3, 1, 0x8e44ad, 0, 0.65, 0)); org.add(cyl(0.2, 0.2, 1.1, 0xf1c40f, 0, 1.4, 0, 8).rotateZ(Math.PI / 2)); l.deco(org, cx, G(l, cx, cz + 6), cz + 6);
    l.solids.push({ min: { x: cx - 0.8, y: 0, z: cz + 5.5 }, max: { x: cx + 0.8, y: 1.3, z: cz + 6.5 }, active: true });
    const kp = l.pzBone('klingeln', cx, 1.2, cz - 3);
    l.melody('klingeln', bells, { by: 'bark', len: 5, inst: 'glock', start: { x: cx, y: 0, z: cz + 6 }, startHint: 'BISS = Leierkasten drehen', first: 'Dreh erst am Leierkasten!', go: 'Jetzt die Klingeln in derselben Reihenfolge anBELLEN!', win: 'Bravo, Straßenmusik! 🦴' }, kp);
    hintSign(l, 'klingeln', cx + 4, cz + 7, 'Klingel-Konzert', 'Dreh am Leierkasten, hör zu – und bell die Klingeln in derselben Reihenfolge an!');
    // Rolltor-Wettlauf: in den Hupen-Trichter bellen, dann in 9 Sekunden zum Käfig auf dem Container
    const b = button(l, -60, -45, 'bark', { color: 0xfdcb6e, post: 1.4 });
    hintSign(l, 'rolltor', -57, -42, 'Alarm-Wettlauf', 'Bell in den Trichter – dann geht der Käfig auf dem Container 9 Sekunden lang auf!');
    l.box(-97, 0, -44, 5, 2.2, 3, 0xc0392b); l.box(-92.5, 0, -44, 2.4, 1.1, 2.4, 0x7f8c8d); // Container + Kiste als Stufe
    cageRace(l, 'rolltor', b, [-97.5, -44], 9, { cy: 2.2, color: 0x2d3436 });
    // Rückkehr: Aufwind hinauf zum Werbeballon (Gleiten)
    l.updraft(-75, 0, -33, 17, 2.2);
    l.box(-75, 14.6, -40.5, 4, 0.4, 4, 0xecf0f1); l.deco(sphere(3.2, 0xe84393, 0, 0, 0, 10), -75, 20, -40.5).userData.merge = true;
    [-1.6, 1.6].forEach(dx => l.deco(cyl(0.04, 0.04, 3, 0x2d3436, 0, 0, 0, 4), -75 + dx, 16.5, -40.5).userData.merge = true);
    l.pzAdd('ballon', 'updraft', { bone: l.goldbone('ballon', -75, 15.8, -40.5) });
    abilitySign(l, 'ballon', -71, -30, 'gleiten', 'Spring in den Aufwind, halt TRILLER zum Gleiten – und dann rüber zum Ballon!');
  },

  // ---------------------------------------------------------------- Das Büro
  buero(l) {
    const F1 = 12, F2 = 24, ROOF = 36;
    // 1. Stock: Formular „AKTE“ mit Bauchklatschern stempeln
    const ap = l.pzBone('akte', 0, F1 + 0.8, 12);
    l.letters('akte', 0, F1, 6, 'MKSAEOTL', 'AKTE', 4, 3, 'stomp', ap, { display: [0, F1, 1.2, 1.6, 0], win: 'Formular AKTE gestempelt – genehmigt! 🦴' });
    hintSign(l, 'akte', 7.5, 3, 'Antrag 27b', 'Stempel die Buchstaben A-K-T-E der Reihe nach – mit dem Bauchklatscher!', { y: F1 });
    // 2. Stock: Rohrpost-Knopf → schwebende Ordner bis aufs Aktenregal (15 Sekunden)
    l.box(10.5, F2, -6.5, 3, 8, 3, 0x6d4c41); for (let k = 1; k < 8; k += 1.6) l.deco(box(3.05, 0.12, 3.05, 0x5d4037), 10.5, F2 + k, -6.5).userData.merge = true;
    const op = l.goldbone('ordner', 10.5, F2 + 8.8, -6.5);
    const b = button(l, -6, 9, 'bite', { y: F2, color: 0x00b894 });
    platRace(l, 'ordner', b, [[-2, F2 + 1.8, 5], [1.5, F2 + 3.6, 2.5], [4.5, F2 + 5.4, 0], [7.5, F2 + 7.2, -3]], 15, op, 0xfdcb6e);
    hintSign(l, 'ordner', -9, 9, 'Rohrpost', 'Beiß den Knopf – dann schweben 15 Sekunden lang Ordner bis aufs Regal!', { y: F2 });
    // Rückkehr (Dach): glatter Lüftungsturm, nur mit Tornado-Trillern
    l.box(8, ROOF, 12, 3, 5.6, 3, 0xb2bec3); l.deco(cyl(1.2, 1.2, 0.4, 0x636e72, 0, 0, 0, 12), 8, ROOF + 5.8, 12).userData.merge = true;
    l.pzAdd('luefter', 'pillar', { bone: l.goldbone('luefter', 8, ROOF + 6.6, 12) });
    abilitySign(l, 'luefter', 4, 15, 'tornado', 'Lade das Tornado-Trillern auf und schieß auf den Lüftungsturm!', { y: ROOF });
  },

  // ---------------------------------------------------------------- Grillpark
  park(l) {
    // Maulwurf-Klopfen: 8 Maulwürfe in 30 Sekunden
    const mx = 75, mz = -30, mp = l.pzBone('maulwurf', mx, G(l, mx, mz) + 1, mz);
    l.moles('maulwurf', mx, G(l, mx, mz), mz, [[-4, 0], [4, 0], [-2, -3.5], [2, -3.5], [-2, 3.5], [2, 3.5]], 8, 30, mp, { start: [mx, G(l, mx, mz + 7), mz + 7] });
    l.box(mx, G(l, mx, mz + 7), mz + 7, 0.3, 1.2, 0.3, 0x6d4c41); l.deco(makeSign('Hau den Maulwurf', { w: 2.4 }), mx, G(l, mx, mz + 7) + 1.2, mz + 7, Math.PI);
    l.trigger(mx, 0, mz + 7, 5, () => l.once('pz:maulwurf', 'Beiß das Schild zum Starten – dann 8 Maulwürfe in 30 Sekunden beißen!', 4500), false);
    // Spielplatz: Hüpfkästchen-Fliesen (alle gelb)
    const fp = l.pzBone('huepfen', 70, G(l, 70, 50.5) + 0.9, 50.5);
    l.flipTiles('huepfen', 70, G(l, 70, 45), 45, 3, 2.8, fp, { reset: [75.5, G(l, 75.5, 41), 41] });
    l.box(75.5, G(l, 75.5, 41), 41, 0.3, 1.2, 0.3, 0x6d4c41);
    hintSign(l, 'huepfen', 64, 40, 'Hüpfkästchen', 'Jeder Hüpfer dreht die Fliese und ihre Nachbarn um. Mach alle gelb!');
    // Rückkehr: Truhe am Seegrund (Tauchen)
    const sx = -20, sz = 106, wy = l.waterAt(sx, sz), by = l.groundAt(sx, sz, 0);
    const sp = l.pzBone('seegrund', sx, by + 1.6, sz), zs = l.pzAdd('seegrund', 'chest', { bone: sp, at: [sx, by, sz], water: wy });
    l.chest(sx, by, sz, () => l.pzWin(zs, sp, 'Ein Schatz am Seegrund! 🦴'), 'tauchen');
    l.airBubbles(sx + 3, by, sz, (wy ?? 0) - by);
    abilitySign(l, 'seegrund', sx, 66.5, 'tauchen', 'Am Seegrund liegt eine Truhe – tauch hinab (NASE halten) und beiß sie auf!');
  },

  // ---------------------------------------------------------------- Strand
  strand(l) {
    const mx = -30, mz = -100, my = G(l, mx, mz);
    const mp = l.pzBone('memory', mx, my + 1.2, mz - 5);
    l.memory('memory', mx, my, mz, 4, 2, 3.4, ['muschel', 'seestern', 'fisch', 'krebs'], mp);
    hintSign(l, 'memory', mx + 8, mz + 3, 'Muschel-Memory', 'Lauf über die Platten und finde die Paare!');
    // Rettungsturm: Glocke beißen, dann 10 Sekunden lang Stufen bis hinauf
    const tx = 30, tz = -92, ty = G(l, tx, tz);
    l.box(tx, ty, tz, 3, 8, 3, 0xd63031); l.deco(box(3.4, 0.3, 3.4, 0xffffff), tx, ty + 4, tz).userData.merge = true;
    const rp = l.goldbone('rettungsturm', tx, ty + 8.8, tz);
    const b = button(l, tx - 6, tz + 6, 'bite', { color: 0xf1c40f });
    platRace(l, 'rettungsturm', b, [[tx - 3.5, ty + 1.8, tz + 2], [tx - 3.5, ty + 3.6, tz - 2], [tx, ty + 5.4, tz - 3.5], [tx + 3.5, ty + 7.2, tz - 1]], 12, rp, 0xffeaa7);
    hintSign(l, 'rettungsturm', tx - 9, tz + 6, 'Rettungsturm', 'Beiß die Glocke – dann erscheinen 12 Sekunden lang Stufen am Turm!');
    // Rückkehr: Aufwind hinauf zum Drachen (Gleiten)
    const dx = 60, dz = -100, dy = G(l, dx, dz);
    l.updraft(dx, dy, dz, 16, 2.2); l.box(dx, dy + 13.6, dz - 7, 4, 0.4, 4, 0x74b9ff);
    const kite = new THREE.Group(); const sail = box(3, 3, 0.1, 0xff7675); sail.rotation.z = Math.PI / 4; kite.add(sail); kite.add(cyl(0.03, 0.03, 4, 0xffffff, 0, -3, 0, 4)); l.deco(kite, dx, dy + 19, dz - 7);
    l.pzAdd('drachen', 'updraft', { bone: l.goldbone('drachen', dx, dy + 14.8, dz - 7) });
    abilitySign(l, 'drachen', dx + 4, dz + 4, 'gleiten', 'Spring in den Aufwind und gleite rüber zum Drachen!');
  },

  // ---------------------------------------------------------------- Hafen
  hafen(l) {
    // Schiffsglocken: Nebelhorn beißen, dann vier Glocken anbellen
    const pts = [[-122, 12], [-114, 6], [-106, 6], [-98, 12]], bells = pts.map(([x, z], i) => {
      const y = G(l, x, z); l.box(x, y, z, 0.3, 2.2, 0.3, 0x6d4c41); l.deco(box(1.2, 0.2, 0.2, 0x6d4c41), x, y + 2.2, z).userData.merge = true;
      const g = new THREE.Group(); g.add(glow(cone(0.5, 0.8, 0xd4a017, 0, 0, 0, 10), 0, 0)); g.add(sphere(0.12, 0x2d3436, 0, -0.45, 0, 6)); l.deco(g, x, y + 1.7, z);
      return { x, y: y + 0.2, z, mesh: g, note: [-5, 0, 4, 7][i], range: 9 };
    });
    const hx = -110, hz = 20, hy = G(l, hx, hz); l.box(hx, hy, hz, 0.4, 1.2, 0.4, 0x2d3436); l.deco(cone(0.4, 1, 0xb2bec3, 0, 0, 0, 10).rotateZ(Math.PI / 2), hx, hy + 1.5, hz).userData.merge = true;
    const gp = l.pzBone('glocken', -110, G(l, -110, 10) + 1.2, 10);
    l.melody('glocken', bells, { by: 'bark', len: 5, inst: 'vibes', start: { x: hx, y: hy, z: hz }, startHint: 'BISS = Nebelhorn', first: 'Erst ins Nebelhorn beißen!', go: 'Jetzt die Glocken in derselben Reihenfolge anBELLEN!', win: 'Glasen wie ein alter Seebär! 🦴' }, gp);
    hintSign(l, 'glocken', hx + 4, hz + 2, 'Schiffsglocken', 'Beiß ins Nebelhorn, hör zu und bell die Glocken in derselben Reihenfolge an!');
    // Container-Wettlauf am Terminal: Hebel beißen, 14 Sekunden bis zum Käfig ganz hinten
    const b = button(l, 85, 0, 'bite', { color: 0xe17055 });
    hintSign(l, 'container', 80.5, 1, 'Kran-Wettlauf', 'Beiß den Hebel – 12 Sekunden bis zum Käfig ganz hinten am Terminal!');
    cageRace(l, 'container', b, [113, -37.5], 12, { color: 0xe17055 });
    // Rückkehr: Backstein-Speicher, nur mit Wandsprung
    const sx = -100, sz = -38, sy = G(l, sx, sz), top = l.shaft(sx, sy, sz, 12);
    l.pzAdd('speicher', 'shaft', { bone: l.goldbone('speicher', top.x, top.y + 0.8, top.z) });
    abilitySign(l, 'speicher', sx + 4, sz + 4, 'wandsprung', 'Im Schacht des alten Speichers geht es per Wandsprung nach oben!');
  },

  // ---------------------------------------------------------------- Dorf
  dorf(l) {
    // Pflaster-Fliesen am Dorfrand
    const fx = 60, fz = -2, fp = l.pzBone('pflaster', fx, G(l, fx, fz + 5.5) + 0.9, fz + 5.5);
    l.flipTiles('pflaster', fx, G(l, fx, fz), fz, 3, 2.8, fp, { reset: [fx + 5.5, G(l, fx + 5.5, fz - 4), fz - 4], on: 0xe1b12c });
    l.box(fx + 5.5, G(l, fx + 5.5, fz - 4), fz - 4, 0.3, 1.2, 0.3, 0x6d4c41);
    hintSign(l, 'pflaster', fx - 6, fz - 4, 'Zauberpflaster', 'Jeder Schritt dreht den Stein und seine Nachbarn um. Mach alle golden!');
    // Kuhglocken: Melkschemel beißen, dann die Glocken beißen
    const pts = [[92, -64], [98, -68], [104, -68], [110, -64]], bells = pts.map(([x, z], i) => {
      const y = G(l, x, z); l.box(x, y, z, 0.3, 1.0, 0.3, 0x6d4c41);
      const g = new THREE.Group(); g.add(glow(cyl(0.25, 0.4, 0.6, [0xd4a017, 0xb87333, 0xa4a4a4, 0xe1b12c][i], 0, 0, 0, 8), 0, 0)); g.add(box(0.5, 0.08, 0.12, 0x8b1e1e, 0, 0.35, 0)); l.deco(g, x, y + 1.1, z);
      return { x, y: y + 0.4, z, mesh: g, note: [0, 3, 5, 7][i], r: 0.6 };
    });
    l.box(101, 0, -58, 1, 0.6, 1, 0x8d6e4a);
    const kp = l.pzBone('kuhglocken', 101, G(l, 101, -64) + 1.2, -64);
    l.melody('kuhglocken', bells, { by: 'bite', len: 5, inst: 'marimba', start: { x: 101, y: 0, z: -58 }, startHint: 'BISS = Melkschemel', first: 'Erst auf den Melkschemel beißen!', go: 'Jetzt die Kuhglocken in derselben Reihenfolge beißen!', win: 'Muuusikalisch! 🦴' }, kp);
    hintSign(l, 'kuhglocken', 95, -56, 'Kuhglocken', 'Beiß den Melkschemel, hör zu und beiß die Glocken in derselben Reihenfolge!');
    // Rückkehr: glatter Taubenschlag-Pfahl, nur mit Tornado-Trillern
    const tx = -70, tz = 45, ty = G(l, tx, tz);
    l.box(tx, ty, tz, 1.2, 5.2, 1.2, 0xdfe6e9); l.box(tx, ty + 5.2, tz, 3.4, 0.4, 3.4, 0xecf0f1); l.deco(box(1.4, 1, 1.4, 0xffffff), tx + 1, ty + 6.1, tz - 1).userData.merge = true;
    l.pzAdd('taubenschlag', 'pillar', { bone: l.goldbone('taubenschlag', tx - 0.6, ty + 6.4, tz + 0.6) });
    abilitySign(l, 'taubenschlag', tx + 4, tz + 3, 'tornado', 'Das Tornado-Trillern schießt dich auf den Taubenschlag!');
  },

  // ---------------------------------------------------------------- Kanal
  kanal(l) {
    // Pumpwerk-Ventile: Lautsprecher beißen, dann die Ventile in der Reihenfolge trillern
    const pts = [[37, -15], [43, -17], [49, -15], [43, -9]], vs = pts.map(([x, z], i) => {
      const y = G(l, x, z); l.box(x, y, z, 0.4, 1.2, 0.4, 0x636e72);
      const g = new THREE.Group(); const w = glow(new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 14), new THREE.MeshToonMaterial({ color: [0xd63031, 0x0984e3, 0x00b894, 0xfdcb6e][i] })), 0, 0); w.rotation.x = Math.PI / 2; g.add(w); g.add(box(1.2, 0.1, 0.1, 0x636e72)); l.deco(g, x, y + 1.4, z);
      return { x, y: y + 0.2, z, mesh: g, note: [0, 3, 7, 10][i], r: 0.8 };
    });
    l.box(40, 0, 6, 1.2, 1.4, 1.2, 0x2d3436); l.deco(cone(0.5, 0.6, 0xb2bec3, 0, 0, 0, 8), 40, 1.7, 6).userData.merge = true;
    const vp = l.pzBone('ventile', 43, 1.2, -12.5);
    l.melody('ventile', vs, { by: 'spin', len: 5, inst: 'steeldrum', start: { x: 40, y: 0, z: 6 }, startHint: 'BISS = Lautsprecher', first: 'Erst den Lautsprecher beißen!', go: 'Jetzt die Ventile in derselben Reihenfolge TRILLERN!', win: 'Die Pumpe läuft wieder! 🦴' }, vp);
    hintSign(l, 'ventile', 45, 8, 'Ventil-Folge', 'Beiß den Lautsprecher, hör zu und triller die Ventile in derselben Reihenfolge!');
    // Rohrpost-Wettlauf im Südgang
    const b = button(l, -20, 32, 'stomp', { color: 0x6c5ce7 });
    hintSign(l, 'rohrpost', -16, 29, 'Rohrpost', 'Bauchklatscher auf die Platte – dann 9 Sekunden bis zum Käfig!');
    cageRace(l, 'rohrpost', b, [18, 46], 9, { color: 0x6c5ce7 });
    // Gitter-Fliesen im Nordwesten
    const gp = l.pzBone('gitter', -50, 0.9, -34);
    l.flipTiles('gitter', -50, 0, -42, 3, 2.6, gp, { reset: [-55.5, 0, -36.5], on: 0x55efc4, moves: 4 });
    l.box(-55.5, 0, -36.5, 0.3, 1.2, 0.3, 0x636e72);
    hintSign(l, 'gitter', -44, -36, 'Gitter-Rätsel', 'Jeder Schritt dreht das Gitter und seine Nachbarn um. Mach alle grün!');
  },
};
