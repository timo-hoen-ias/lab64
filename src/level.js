// Level-Framework: Szene, Solids (AABB), Sammelobjekte, Portale, Interaktionen, Gegner, Boss.
import * as THREE from 'three';
import { BONES } from './levels.js';
import { box, makeFood, makeLabel, makeTree, makeBush, makeGoggles, cyl, sphere } from './models.js';
import { makeSky, makeClouds, makeWater, makePond, makePortalDisk, makeBackdrop, makeSkyLife, makeGrass, makeBubbleColumn, toonGradient, FX, addSeeThrough, addCaustics, CAUSTIC, WIND, makeAmbient, makeShoreFoam } from './fx.js';

// Kleiner Zufallsgenerator mit festem Startwert: gleiche Welt = gleiche Krümel-Positionen (für den Spielstand)
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const smooth = u => u * u * (3 - 2 * u);
// Weiche Helligkeitsflecken für Wiesen und Hügel (kein Zufall: gleiche Welt sieht immer gleich aus)
const patch = (x, z) => Math.sin(x * 0.071) * Math.sin(z * 0.063) + Math.sin(x * 0.19 + z * 0.13) * 0.5 + Math.sin(x * 0.53 - z * 0.47) * 0.18;
// Welche Umgebungspartikel wo fliegen (Anzahl bei Grafik „Hoch“)
const AMBIENT_N = { pollen: 90, leaves: 26, fireflies: 50, dust: 70, drips: 36, plankton: 80 };

export class Level {
  constructor(game, def, key) {
    this.game = game; this.def = def; this.key = key; this._scatter = [];
    this.scene = new THREE.Scene();
    const dark = new THREE.Color(def.sky || 0x6fc3ff).getHSL({}).l < 0.35, out = !def.indoor, q = game.q;
    // Außenwelten: Himmel mit Sonne und Tageszeit, Fernsicht mit Kulisse, zwei Wolkenschichten, Vögel
    this.sky = makeSky(def.sky || 0x6fc3ff, dark, out ? def.time || 'mittag' : null); this.scene.add(this.sky.mesh); this.T = this.sky.T;
    this.scene.background = this.sky.horizon.clone();
    this.scene.fog = out ? new THREE.Fog(this.sky.horizon, def.fogNear || 50, def.fogFar || q.fog) : new THREE.Fog(this.sky.horizon, def.fogNear || 40, def.fogFar || 110);
    this.follow = [this.sky.mesh];
    if (out) {
      const size = def.size || 40, k = this.T.clouds;
      this.clouds = makeClouds(Math.round(size / 3 * k), size * 1.8, 38); this.scene.add(this.clouds);
      this.farClouds = makeClouds(Math.round(12 * k), 330, 60, 4.5); this.scene.add(this.farClouds);
      if (def.backdrop) { this.backdrop = makeBackdrop(def.backdrop, this.sky.horizon, this.sky.top); this.scene.add(this.backdrop); this.follow.push(this.backdrop); }
      this.skyLife = makeSkyLife(160); this.scene.add(this.skyLife);
    }
    this.solids = []; this.pickups = []; this.enemies = []; this.portals = []; this.interact = []; this.hideSpots = [];
    this.terrain = []; this.zones = []; this.doors = []; this.killY = def.killY ?? -25;
    this.bounds = this.mainArea = { min: { x: -(def.size || 40), z: -(def.size || 40) }, max: { x: def.size || 40, z: def.size || 40 } };
    this.areas = [this.mainArea];
    this.boss = null; this.goal = { have: 0, need: def.need || 0, kind: def.goalKind || 'ham' }; this.done = false; this.t = 0;
    this.spawn = new THREE.Vector3(0, 1, 0);
    this._light();
    this.ground(def.ground || 0x6bbf59, def.size || 40);
    this.group = new THREE.Group(); this.scene.add(this.group);
    def.build(this);
    this._placeScatter();
    this._mergeStatic(this.group); this.zones.forEach(z => this._mergeStatic(z.group));
    if (def.grass) this._plantGrass(def.grass === true ? undefined : def.grass);
    CAUSTIC.uSeaY.value = this.seaY ?? -1e9;
    this._seeThrough();
    this._ambient(); if (this.seaY !== undefined) this._shoreFoam();
    this.crumbTotal = this.pickups.filter(p => !p.goal && !p.special && p.kind !== 'goldbone').length;
    this.crumbHave = 0;
  }

  _light() {
    const T = this.T;
    this.scene.add(new THREE.HemisphereLight(0xdff1ff, 0x8a6b3f, T ? T.hemi : 1.3));
    // Sonne folgt dem Hund: kleiner Schattenbereich = scharfe Schatten auch auf großen Karten
    const sun = new THREE.DirectionalLight(T ? T.sun : 0xfff0d0, T ? T.sunI : 2.4); sun.castShadow = true; this.sunOff = new THREE.Vector3(...(T ? T.sunOff : [18, 34, 12])).normalize().multiplyScalar(41);
    sun.shadow.mapSize.set(1024, 1024); const s = 26; sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s; sun.shadow.camera.far = 90;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    this.scene.add(sun, sun.target); this.sun = sun;
  }

  ground(color, size) {
    let g;
    if (this.def.water) { g = makeWater(color, size); this.water = g; }
    else { g = new THREE.Mesh(this._tint(new THREE.PlaneGeometry(size * 2.4, size * 2.4, 64, 64)), new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), vertexColors: true })); g.rotation.x = -Math.PI / 2; g.position.y = this.def.floorY || 0; }
    g.receiveShadow = true; this.scene.add(g); this.groundMesh = g;
    // Weiter Boden bis zum Horizont (ohne Kollision), damit man auf großen Sichtweiten keine Kante sieht
    if (!this.def.indoor && !this.def.water) {
      const far = new THREE.Mesh(new THREE.RingGeometry(size * 1.2, 520, 64, 1), new THREE.MeshToonMaterial({ color: this.def.farGround ?? color, gradientMap: toonGradient() }));
      far.rotation.x = -Math.PI / 2; far.position.y = -0.03; far.receiveShadow = true; this.scene.add(far);
    }
    const fy = this.def.floorY || 0; // Meeresgrund o.ä. unter 0
    this.groundSolid = { min: { x: -size * 1.2, y: fy - 5, z: -size * 1.2 }, max: { x: size * 1.2, y: fy, z: size * 1.2 }, active: true };
    this.solids.push(this.groundSolid);
  }

  // Schwimmteich (Ellipse): Loch im Boden, Becken, Wasser. Moll schwimmt darin (siehe Player).
  pond(x, z, rx, rz, depth = 1.8) {
    const size = (this.def.size || 40) * 1.2, color = this.groundMesh.material.color;
    // Boden neu: Rechteck mit elliptischem Loch
    const shape = new THREE.Shape(); shape.moveTo(-size, -size); shape.lineTo(size, -size); shape.lineTo(size, size); shape.lineTo(-size, size); shape.lineTo(-size, -size);
    const hole = new THREE.Path(); hole.absellipse(x, -z, rx, rz, 0, Math.PI * 2, false, 0); shape.holes.push(hole);
    this.groundMesh.geometry.dispose(); this.groundMesh.geometry = this._tint(new THREE.ShapeGeometry(shape, 48));
    // Kollision: Boden in Streifen um die Ellipse herum, Beckengrund tiefer
    this.solids.splice(this.solids.indexOf(this.groundSolid), 1);
    const add = (x0, x1, z0, z1, top = 0) => { if (x1 > x0 && z1 > z0) this.solids.push({ min: { x: x0, y: -5, z: z0 }, max: { x: x1, y: top, z: z1 }, active: true }); };
    add(-size, size, -size, z - rz); add(-size, size, z + rz, size);
    const strips = 24, h = rz * 2 / strips;
    for (let i = 0; i < strips; i++) {
      const z0 = z - rz + i * h, zc = Math.max(Math.abs(z0 - z), Math.abs(z0 + h - z)), half = rx * Math.sqrt(Math.max(0, 1 - (zc / rz) ** 2));
      add(-size, x - half, z0, z0 + h); add(x + half, size, z0, z0 + h);
    }
    add(x - rx, x + rx, z - rz, z + rz, -depth);
    const p = makePond(rx, rz, depth); p.position.set(x, 0, z); this.scene.add(p);
    this.ponds = (this.ponds || []).concat({ x, z, rx, rz, y: -0.25, mesh: p });
  }
  // Boden-Geometrie (liegt in xy, wird um -90° gekippt → Welt-z = -y) bekommt sanfte Helligkeitsflecken
  _tint(geo) {
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), indoor = this.def.indoor;
    for (let i = 0; i < p.count; i++) { const k = 1 + patch(p.getX(i), -p.getY(i)) * (indoor ? 0.025 : 0.055); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
  }
  waterAt(x, z) {
    for (const p of this.ponds || []) if (((x - p.x) / p.rx) ** 2 + ((z - p.z) / p.rz) ** 2 < 1) return p.y;
    if (this.seaY !== undefined && this.groundAt(x, z, this.seaY) < this.seaY - 0.3) return this.seaY;
    return null;
  }
  // Meer: Wasser überall dort, wo der Boden unter y liegt (Strand: Grund bei floorY, Land = Hügel darüber)
  sea(y = 0, color = 0x2e9be0) {
    this.seaY = y; const size = this.def.size || 40, w = makeWater(color, size); w.position.y = y - 0.12;
    w.material.transparent = true; w.material.opacity = 0.8; w.material.side = THREE.DoubleSide; w.renderOrder = 2; this.scene.add(w); this.water = w;
  }
  // Luftblasen-Säule vom Grund bis zur Oberfläche: dort tankt Moll unter Wasser Luft
  airBubbles(x, y0, z, h = 6) { const c = makeBubbleColumn(h); c.position.set(x, y0, z); this.group.add(c); (this.bubbles ||= []).push({ x, y0, z, h, mesh: c }); }
  airAt(p) { return (this.bubbles || []).some(b => Math.hypot(b.x - p.x, b.z - p.z) < 1.4 && p.y > b.y0 - 1 && p.y < b.y0 + b.h + 1); }
  // Auslöser: fn(), sobald Moll in den Radius kommt (once = nur einmal)
  trigger(x, y, z, r, fn, once = true) { (this.triggers ||= []).push({ x, y, z, r, fn, once, done: false, inside: false }); }
  // Schnellreise-Punkte (Strandkörbe, Hundehütten): Berühren schaltet frei, BISS daneben reist zum nächsten freigeschalteten
  warp(x, y, z, name, mesh) {
    const w = { x, y, z, name, on: (this.game.worldState(this.key).warps || []).includes(name) }; (this.warps ||= []).push(w);
    if (mesh) this.deco(mesh, x, y, z);
    const lab = makeLabel(`⇄ ${name}`); lab.scale.set(4, 1, 1); lab.position.set(x, y + 3, z); this.group.add(lab); w.label = lab;
    this.interactable(x, y, z, 1.6, it => {
      it.used = false; const on = this.warps.filter(v => v.on); if (on.length < 2) { this.game.toast('Finde weitere Schnellreise-Punkte!'); return; }
      const next = on[(on.indexOf(w) + 1) % on.length]; this.teleport({ x: next.x + 1.8, y: next.y + 0.5, z: next.z }); this.game.toast(`Schnellreise: ${next.name}`);
    }, 'BISS = Schnellreise');
    this.trigger(x, y, z, 2, () => { if (w.on) return; w.on = true; const st = this.game.worldState(this.key); (st.warps ||= []).push(name); this.game.persist(); this.game.toast(`Schnellreise-Punkt „${name}“ gefunden!`); this.game.audio.sfx('collect'); });
    return w;
  }
  // Ring-Parcours: alle Ringe in Reihenfolge innerhalb von time Sekunden → Goldknochen
  ringCourse(points, boneId, time = 25, color = 0xffd32a) {
    const rings = points.map(([x, y, z], i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 8, 24), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 })); m.position.set(x, y, z); this.group.add(m); return { x, y, z, m }; });
    const c = { rings, i: 0, t: 0, boneId, time, done: this.game.hasBone(this.key, boneId) }; (this.courses ||= []).push(c); return c;
  }
  _updateCourses(dt, pp) {
    for (const c of this.courses || []) {
      if (c.done) continue;
      c.rings.forEach((r, k) => { r.m.rotation.y += dt * (k === c.i ? 3 : 0.6); r.m.material.emissiveIntensity = k === c.i ? 0.9 : k < c.i ? 0.05 : 0.3; });
      if (c.i > 0) { c.t -= dt; if (c.t <= 0) { c.i = 0; this.game.toast('Zu langsam! Fang beim ersten Ring neu an.'); } }
      const r = c.rings[c.i]; if (Math.hypot(r.x - pp.x, r.z - pp.z) < 1.8 && Math.abs(r.y - (pp.y + 0.5)) < 1.8) {
        c.i++; c.t = c.time; this.game.audio.sfx('collect'); FX.sparkle(this.game.fx, r);
        if (c.i === c.rings.length) { c.done = true; this.spawnGoldbone(r.x, r.y, r.z, c.boneId); } else this.game.toast(`Ring ${c.i}/${c.rings.length}`, 1200);
      }
    }
  }

  // Fähigkeits-Gegenstand (z.B. Taucherbrille): einmal einsammeln, dauerhaft freigeschaltet
  abilityItem(x, y, z, ability, text) {
    if (this.game.has(ability)) return null;
    const m = ability === 'tauchen' ? makeGoggles() : sphere(0.4, 0xffcc33); m.position.set(x, y, z); this.group.add(m);
    const it = { x, y, z, ability, text, mesh: m }; (this.abilityItems ||= []).push(it); return it;
  }

  // Fester Block: x,y,z = Mittelpunkt (y = Unterkante), w,h,d
  box(x, y, z, w, h, d, color, opts = {}) {
    const m = box(w, h, d, color, x, y + h / 2, z); this.group.add(m); m.userData.merge = !opts.dynamic;
    const s = { min: { x: x - w / 2, y, z: z - d / 2 }, max: { x: x + w / 2, y: y + h, z: z + d / 2 }, active: true, mesh: m, cam: h > 2.2, ...opts };
    this.solids.push(s); return s;
  }

  // ---- Gelände: Hügel (rund/elliptisch, flacher Gipfel) und Rampen. Liegt über dem Boden, Kisten kommen obendrauf.
  // hill: o.flat = Anteil Gipfelplateau (0..1), o.rz = Radius in z, o.y0 = Fußhöhe (für Stufen auf Plateaus), o.color/o.side
  hill(x, z, r, h, o = {}) {
    const t = { kind: 'hill', x, z, rx: r, rz: o.rz || r, h, flat: o.flat ?? 0.35, y0: o.y0 || 0 };
    t.min = { x: x - t.rx, z: z - t.rz }; t.max = { x: x + t.rx, z: z + t.rz };
    this.terrain.push(t); this.group.add(this._hillMesh(t, o.color ?? this.def.ground ?? 0x6bbf59, o.side ?? 0x9b7b4f)); return t;
  }
  // Rampe von (x0,z0) nach (x1,z1), Breite w, Höhe h0 → h1 (z.B. Weg auf ein Plateau)
  ramp(x0, z0, x1, z1, w, h0, h1, color = 0xc8b48a, o = {}) {
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), t = { kind: 'ramp', x0, z0, ux: dx / len, uz: dz / len, len, w, h0, h1, y0: o.bridge ? Math.min(h0, h1) - 0.35 : o.y0 || 0, bridge: !!o.bridge };
    const hw = w / 2 + 0.01, ex = Math.abs(t.uz) * hw, ez = Math.abs(t.ux) * hw;
    t.min = { x: Math.min(x0, x1) - ex, z: Math.min(z0, z1) - ez }; t.max = { x: Math.max(x0, x1) + ex, z: Math.max(z0, z1) + ez };
    this.terrain.push(t); this.group.add(this._rampMesh(t, color)); return t;
  }
  _terrainH(t, x, z) {
    if (x < t.min.x || x > t.max.x || z < t.min.z || z > t.max.z) return -Infinity;
    if (t.kind === 'hill') {
      const d = Math.hypot((x - t.x) / t.rx, (z - t.z) / t.rz); if (d >= 1) return -Infinity;
      return t.y0 + t.h * (d <= t.flat ? 1 : smooth((1 - d) / (1 - t.flat)));
    }
    const px = x - t.x0, pz = z - t.z0, a = px * t.ux + pz * t.uz, b = -px * t.uz + pz * t.ux;
    if (a < 0 || a > t.len || Math.abs(b) > t.w / 2) return -Infinity;
    return t.h0 + (t.h1 - t.h0) * a / t.len;
  }
  // Höhe des Geländes an (x,z); -Infinity = kein Gelände (dann zählen nur Boden und Kisten).
  // Mit y zählen Brücken (ramp mit bridge) nur, wenn man nicht deutlich darunter ist – so kann man unter ihnen durchlaufen.
  heightAt(x, z, y = Infinity) { let h = -Infinity; for (const t of this.terrain) { const v = this._terrainH(t, x, z); if (v > h && !(t.bridge && y < v - 1.2)) h = v; } return h; }
  // Höchster Boden unter einem Punkt: Gelände oder Kisten-Oberseite (nicht höher als y)
  groundAt(x, z, y = Infinity) {
    let g = this.heightAt(x, z, y); if (g > y + 0.05) g = -Infinity;
    for (const s of this.solids) if (s.active && x > s.min.x && x < s.max.x && z > s.min.z && z < s.max.z && s.max.y <= y + 0.05 && s.max.y > g) g = s.max.y;
    return g;
  }
  _hillMesh(t, top, side) {
    const R = 14, S = 48, pos = [], col = [], idx = [], cTop = new THREE.Color(top), cSide = new THREE.Color(side), c = new THREE.Color();
    for (let i = 0; i <= R; i++) {
      const r = i / R, k = r <= t.flat ? 1 : smooth((1 - r) / (1 - t.flat)), y = t.y0 + t.h * k + (i === R ? -0.05 : 0);
      // Hänge bekommen die Erdfarbe, je steiler desto mehr
      const steep = r <= t.flat ? 0 : Math.min(1, t.h * 6 * (1 - r) * r / ((1 - t.flat) * Math.max(t.rx, t.rz)) * 1.4);
      c.copy(cTop).lerp(cSide, steep * 0.4);
      for (let j = 0; j < (i ? S : 1); j++) { const a = j / S * Math.PI * 2, px = t.x + Math.cos(a) * t.rx * r, pz = t.z + Math.sin(a) * t.rz * r, k = 1 + patch(px, pz) * 0.06; pos.push(px, y, pz); col.push(c.r * k, c.g * k, c.b * k); }
    }
    for (let j = 0; j < S; j++) idx.push(0, 1 + (j + 1) % S, 1 + j);
    for (let i = 1; i < R; i++) { const a0 = 1 + (i - 1) * S, a1 = 1 + i * S; for (let j = 0; j < S; j++) { const j1 = (j + 1) % S; idx.push(a0 + j, a0 + j1, a1 + j, a0 + j1, a1 + j1, a1 + j); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonGradient() })); m.receiveShadow = true; m.castShadow = true; return m;
  }
  _rampMesh(t, color) {
    const len = t.len, hw = t.w / 2, b = t.y0, g = new THREE.BufferGeometry();
    // lokale Koordinaten: x = Breite, z = Länge; Oberseite schräg, Seiten bis y0
    const P = [[-hw, t.h0, 0], [hw, t.h0, 0], [hw, t.h1, len], [-hw, t.h1, len], [-hw, b, 0], [hw, b, 0], [hw, b, len], [-hw, b, len]];
    const F = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [3, 0, 4, 7]], pos = [];
    F.forEach(f => [[f[0], f[1], f[2]], [f[0], f[2], f[3]]].forEach(tri => tri.forEach(k => pos.push(...P[k]))));
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), side: THREE.DoubleSide }));
    m.position.set(t.x0, 0, t.z0); m.rotation.y = Math.atan2(t.ux, t.uz); m.castShadow = m.receiveShadow = true; return m;
  }

  // ---- Bereiche: alles, was in fn gebaut wird, landet in einer eigenen Gruppe, die aus der Ferne ausgeblendet wird
  zone(x, z, r, fn) {
    const zg = new THREE.Group(), prev = this.group; this.scene.add(zg); this.group = zg;
    try { fn(this); } finally { this.group = prev; }
    const zo = { x, z, r, group: zg }; this.zones.push(zo); return zo;
  }
  // ---- Innenräume abseits der Hauptkarte (eigene Begrenzung). Rückgabe: Mittelpunkt + Fläche
  room(x, z, w, d) { const a = { min: { x: x - w / 2, z: z - d / 2 }, max: { x: x + w / 2, z: z + d / 2 }, room: true }; this.areas.push(a); return a; }
  // Tür: Berühren bringt Moll zum Ziel (to = {x,y,z,yaw?}). o.label = Schild über der Tür, o.color
  door(x, y, z, to, o = {}) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = o.ry || 0;
    g.add(box(2.4, 3.2, 0.3, o.frame ?? 0x7a4a1f, 0, 1.6, -0.05)); g.add(box(1.8, 2.7, 0.32, 0x1d1208, 0, 1.35, 0));
    if (o.label) { const l = makeLabel(o.label); l.scale.set(4, 1, 1); l.position.set(0, 3.8, 0); g.add(l); }
    this.group.add(g); this.doors.push({ x, y, z, to, group: g });
  }
  areaAt(x, z) { return this.areas.find(a => x >= a.min.x - 0.5 && x <= a.max.x + 0.5 && z >= a.min.z - 0.5 && z <= a.max.z + 0.5) || this.mainArea; }
  teleport(to) {
    const pl = this.game.player; pl.pos.set(to.x, to.y, to.z); pl.vel.set(0, 0, 0); pl.checkpoint.copy(pl.pos);
    if (to.yaw !== undefined) { pl.yaw = to.yaw; this.game.camYaw = to.yaw + Math.PI; }
    this.bounds = this.areaAt(to.x, to.z); this.game.snapCam = true; this.game.fade(); this.game.audio.sfx('portal'); this._doorCd = 0.8;
  }

  // Gras auf freiem Boden und Hügeln (nicht in Kisten, nicht im Wasser), Dichte je Grafik-Stufe
  _plantGrass(colors) {
    const n = this.game.q.grass, b = this.mainArea, pts = [];
    for (let i = 0; i < n * 4 && pts.length < n; i++) {
      const x = b.min.x + Math.random() * (b.max.x - b.min.x), z = b.min.z + Math.random() * (b.max.z - b.min.z);
      if (this.waterAt(x, z) !== null || (this.def.hazard && this.def.hazard(x, z))) continue;
      const th = this.heightAt(x, z); let top = th > -Infinity ? th : 0, blocked = false;
      for (const s of this.solids) if (s.active && s.mesh && x > s.min.x - 0.2 && x < s.max.x + 0.2 && z > s.min.z - 0.2 && z < s.max.z + 0.2 && s.max.y > top - 0.05) { blocked = true; break; }
      if (!blocked && (th > -Infinity || this.groundAt(x, z, 0.1) > -0.1)) pts.push([x, top, z]);
    }
    this.grass = makeGrass(pts, colors); this.scene.add(this.grass);
  }

  // Kulisse wird durchsichtig, wo sie Moll verdeckt (Gegner und Sammelsachen nicht). Flache, breite Kisten
  // (Decken, Zwischenböden) halten außerdem die Kamera auf, damit sie nicht über die Decke eines Raums fliegt.
  _seeThrough() {
    const skip = new Set([...this.enemies.map(e => e.mesh), ...this.pickups.map(p => p.mesh), ...(this.abilityItems || []).map(i => i.mesh)]);
    const sea = this.seaY !== undefined;
    const walk = o => { if (skip.has(o)) return; if (o.isMesh) [].concat(o.material).forEach(m => { addSeeThrough(m); if (sea && !m.transparent) addCaustics(m); }); o.children.forEach(walk); };
    walk(this.group); this.zones.forEach(z => walk(z.group));
    if (sea && this.groundMesh.material.isMeshToonMaterial) addCaustics(this.groundMesh.material);
    for (const s of this.solids) if (s !== this.groundSolid && (s.max.x - s.min.x) * (s.max.z - s.min.z) > 40 && s.max.y - s.min.y < 3) s.ceil = true;
  }

  // Statische Kisten und reine Deko-Pflanzen (userData.static) gleicher Farbe zu einem Mesh zusammenfassen: viel weniger
  // Zeichenaufrufe auf großen Karten. Dabei bekommt jedes Teil unten eine leichte Abdunklung (Kontaktschatten an Wänden).
  _mergeStatic(group) {
    group.updateMatrixWorld(true);
    const buckets = new Map(), statics = [];
    const add = m => { const t = m.material, k = `${t.type}|${t.color.getHex()}|${t.flatShading ? 1 : 0}|${t.userData.sway ? 1 : 0}`; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(m); };
    for (const m of group.children) {
      if (m.isMesh && m.userData.merge && !m.material.transparent && !m.material.vertexColors) add(m);
      else if (m.userData.static) { m.traverse(o => { if (o.isMesh) add(o); }); statics.push(m); }
    }
    for (const list of buckets.values()) {
      const pos = [], nor = [], col = [], idx = []; let off = 0;
      for (const m of list) {
        const g = m.geometry.clone().applyMatrix4(m.matrixWorld), p = g.attributes.position;
        let y0 = Infinity, y1 = -Infinity; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < y0) y0 = y; if (y > y1) y1 = y; }
        const ao = y1 - y0 >= 0.6;
        for (let i = 0; i < p.count; i++) { const k = ao ? 0.74 + 0.26 * Math.min(1, (p.getY(i) - y0) / 2.2) : 1; col.push(k, k, k); }
        pos.push(...p.array); nor.push(...g.attributes.normal.array);
        if (g.index) for (const i of g.index.array) idx.push(i + off); else for (let i = 0; i < p.count; i++) idx.push(i + off);
        off += p.count; g.dispose(); if (!m.userData.static) m.geometry.dispose(); m.removeFromParent();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const mt = list[0].material; mt.vertexColors = true; mt.needsUpdate = true;
      const mm = new THREE.Mesh(g, mt); mm.castShadow = list[0].castShadow; mm.receiveShadow = true; group.add(mm);
    }
    statics.forEach(st => st.removeFromParent());
  }

  // Umgebungspartikel je Welt (def.ambient = Liste überschreibt die Auswahl); unter Wasser schweben Teilchen
  _ambient() {
    const d = this.def, q = this.game.q.ambient ?? 1, out = !d.indoor;
    const kinds = d.ambient || (!out ? [this.key === 'kanal' ? 'drips' : 'dust'] : [...(d.time === 'abend' ? ['fireflies'] : []), 'pollen', ...(['huegel', 'wald', 'berge'].includes(d.backdrop) ? ['leaves'] : [])]);
    this.ambient = kinds.map(k => { const m = makeAmbient(k, Math.max(4, Math.round(AMBIENT_N[k] * q)), k === 'leaves' ? 18 : 14, k === 'drips' ? 9 : 8); m.userData.place(this.spawn); this.scene.add(m); return m; });
    if (this.seaY !== undefined || this.ponds) { this.plankton = makeAmbient('plankton', Math.round(AMBIENT_N.plankton * q), 12, 10); this.plankton.visible = false; this.plankton.userData.place(this.spawn); this.scene.add(this.plankton); }
  }
  // Schaum am Strand: Rasterpunkte, an denen das Gelände die Wasserlinie schneidet
  _shoreFoam() {
    const y = this.seaY, S = (this.def.size || 40) * 1.1, step = 2, pts = [];
    for (let x = -S; x < S; x += step) for (let z = -S; z < S; z += step) {
      const h = this.heightAt(x, z) - y; if (h === -Infinity) continue;
      for (const [dx, dz] of [[step, 0], [0, step]]) {
        const h2 = this.heightAt(x + dx, z + dz) - y; if (h2 === -Infinity || (h > 0) === (h2 > 0)) continue;
        const f = h / (h - h2), gx = this.heightAt(x + 1, z) - this.heightAt(x - 1, z), gz = this.heightAt(x, z + 1) - this.heightAt(x, z - 1);
        pts.push([x + dx * f, z + dz * f, Math.atan2(gx, gz)]);
      }
      if (pts.length > 2400) break;
    }
    if (!pts.length) return; this.foam = makeShoreFoam(pts, y); this.scene.add(this.foam);
  }

  // Nur Deko (keine Kollision)
  deco(mesh, x = 0, y = 0, z = 0, ry = 0) { mesh.position.set(x, y, z); mesh.rotation.y = ry; this.group.add(mesh); return mesh; }
  tree(x, z, s = 1, mesh) { const y = Math.max(0, this.heightAt(x, z)); this.deco(mesh || makeTree(s), x, y, z); this.solids.push({ min: { x: x - 0.4 * s, y, z: z - 0.4 * s }, max: { x: x + 0.4 * s, y: y + 1.5 * s, z: z + 0.4 * s }, active: true }); }
  // Höchste begehbare Oberfläche an (x,z): Gelände oder Kiste (zum Platzieren von Dingen)
  top(x, z) { return this.groundAt(x, z, 1e6); }
  bush(x, z, w = 2) { const b = makeBush(w); this.deco(b, x, 0, z); this.hideSpots.push({ x, z, r: w * 0.5 }); return b; }
  // Mauer um das Quadrat ±size; gate > 0 lässt in jeder Seite mittig ein Tor dieser Breite frei
  wallRing(size, h = 3, color = 0x999999, gate = 0) {
    if (!gate) {
      this.box(0, 0, -size, size * 2, h, 1, color); this.box(0, 0, size, size * 2, h, 1, color);
      this.box(-size, 0, 0, 1, h, size * 2, color); this.box(size, 0, 0, 1, h, size * 2, color); return;
    }
    const w = size - gate / 2, c = gate / 2 + w / 2;
    [-c, c].forEach(o => { this.box(o, 0, -size, w, h, 1, color); this.box(o, 0, size, w, h, 1, color); this.box(-size, 0, o, 1, h, w, color); this.box(size, 0, o, 1, h, w, color); });
  }
  label(text, x, y, z) { if (text.length > 18) { this.intro = text; return null; } const l = makeLabel(text); l.position.set(x, y, z); this.group.add(l); return l; }

  // Sammelobjekt. goal=true zählt für das Levelziel. hidden=true: nur per Schnüffeln auffindbar (unsichtbar bis nah).
  pickup(x, y, z, kind = 'crumb', opts = {}) {
    const m = makeFood(kind); m.position.set(x, y, z); this.group.add(m);
    const p = { mesh: m, kind, x, y, z, goal: !!opts.goal, hidden: !!opts.hidden, special: !!opts.special, taken: false, value: opts.value || 1, onTake: opts.onTake, id: opts.id, idx: this.pickups.length };
    if (p.hidden) m.visible = false;
    this.pickups.push(p); return p;
  }

  // Portal: Steinsockel, zwei Säulen, Runenring mit Strudel; verschlossen = grau mit Vorhängeschloss
  portal(x, z, text, target, color = 0xffcc33, need = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); // schaut zur Gartenmitte
    g.add(cyl(2.3, 2.5, 0.3, 0xb8b0a0, 0, 0.15, 0, 10)); g.add(cyl(1.9, 2.1, 0.15, 0xd6cfc0, 0, 0.37, 0, 10));
    const orbs = [];
    [-1, 1].forEach(sx => {
      g.add(box(0.45, 3.4, 0.45, 0xcfc6b4, sx * 2.05, 2.0, 0)); g.add(box(0.7, 0.3, 0.7, 0xb8b0a0, sx * 2.05, 0.45, 0)); g.add(box(0.7, 0.25, 0.7, 0xb8b0a0, sx * 2.05, 3.8, 0));
      const orb = sphere(0.3, color, sx * 2.05, 4.25, 0, 10); orb.material.emissive = new THREE.Color(color).multiplyScalar(0.6); g.add(orb); orbs.push(orb);
    });
    const ring = new THREE.Group(); ring.position.y = 2.2; g.add(ring);
    ring.add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.2, 8, 32), new THREE.MeshToonMaterial({ color: 0x9a9080, gradientMap: toonGradient() })));
    const gems = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, gm = box(0.26, 0.26, 0.5, color, Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0); gm.rotation.z = a + Math.PI / 4; gm.castShadow = false;
      gm.material.emissive = new THREE.Color(color).multiplyScalar(0.5); ring.add(gm); gems.push(gm);
    }
    const disk = makePortalDisk(color); ring.add(disk);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.0, 7, 20, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 3.5; g.add(beam);
    const lock = new THREE.Group(); lock.position.set(0, 2.0, 0.35); g.add(lock);
    lock.add(box(0.9, 0.75, 0.3, 0x8a8f99)); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 12, Math.PI), new THREE.MeshToonMaterial({ color: 0x8a8f99, gradientMap: toonGradient() })); sh.position.y = 0.37; lock.add(sh);
    lock.add(box(0.12, 0.25, 0.05, 0x333333, 0, -0.05, 0.16));
    const prog = this.game.levelProgress(target);
    const crown = sphere(0.35, 0xffcc33, 0, 5.0, 0, 4); crown.material.emissive = new THREE.Color(0x8a5a00); crown.visible = prog.total > 0 && prog.have === prog.total; g.add(crown); // alles gesammelt
    this.group.add(g);
    const po = { x, z, target, text, group: g, disk, need, ring, gems, orbs, beam, lock, crown, color: new THREE.Color(color), locked: null };
    this.portals.push(po); this._portalState(po);
  }
  _portalState(po) {
    const locked = po.need > this.game.boneCount(); if (locked === po.locked) return; po.locked = locked;
    const c = locked ? new THREE.Color(0x777777) : po.color;
    [...po.gems, ...po.orbs].forEach(m => { m.material.color.copy(c); m.material.emissive.copy(c).multiplyScalar(locked ? 0.1 : 0.5); });
    po.beam.visible = !locked; po.lock.visible = locked;
    const prog = this.game.levelProgress(po.target);
    if (po.label) po.group.remove(po.label);
    po.label = makeLabel(locked ? `${po.text} 🔒${po.need}` : `${po.text} ${prog.have}/${prog.total}`); po.label.scale.set(6, 1.5, 1); po.label.position.set(0, 5.8, 0); po.group.add(po.label);
  }

  // Interaktion in Reichweite (Schublade etc.)
  interactable(x, y, z, r, cb, hintText = 'BISS') { this.interact.push({ x, y, z, r, cb, hintText, used: false }); }

  addEnemy(e) { this.enemies.push(e); this.group.add(e.mesh); return e; }
  setBoss(b) { this.boss = b; this.addEnemy(b); this.game.showBoss(b); }

  onBite(point, r) {
    for (const e of this.enemies) if (!e.dead && e.mesh.position.distanceTo(point) < r + (e.radius || 1)) e.onBite && e.onBite();
    for (const it of this.interact) if (!it.used && Math.hypot(it.x - point.x, it.z - point.z) < it.r + 1 && Math.abs(it.y - point.y) < 2.5) { it.used = true; it.cb(it); }
  }

  isHidden(pos) { return this.hideSpots.some(h => Math.hypot(h.x - pos.x, h.z - pos.z) < h.r); }

  update(dt) {
    this.t += dt;
    const pl = this.game.player, pp = pl.pos;
    this.sun.position.copy(pp).add(this.sunOff); this.sun.target.position.copy(pp);
    const cp = this.game.camera.position;
    this.sky.mesh.position.copy(cp); if (this.backdrop) this.backdrop.position.set(cp.x, 0, cp.z);
    if (this.clouds) this.clouds.userData.update(dt);
    if (this.farClouds) { this.farClouds.userData.update(dt * 0.3); this.farClouds.position.set(cp.x, 0, cp.z); }
    if (this.skyLife) this.skyLife.userData.update(dt, this.t);
    if (this.grass) this.grass.userData.update(dt);
    WIND.uWind.value += dt; CAUSTIC.uCaT.value += dt;
    if (this.foam) this.foam.userData.update(this.t);
    for (const a of this.ambient || []) a.userData.update(dt, cp, pp.y - 1.5);
    if (this.plankton) { const uw = !!this._uw; this.plankton.visible = uw; if (uw) this.plankton.userData.update(dt, cp, cp.y - 5); }
    if (this.water) this.water.userData.update(dt);
    for (const p of this.ponds || []) p.mesh.userData.update(dt);
    // Ferne Bereiche ausblenden (Sichtweite je Grafik-Stufe)
    this._zoneT = (this._zoneT || 0) - dt;
    if (this._zoneT <= 0) { this._zoneT = 0.25; const c = this.game.camera.position, vd = this.game.q.view; for (const z of this.zones) z.group.visible = Math.hypot(z.x - c.x, z.z - c.z) < vd + z.r; }
    for (const b of this.bubbles || []) b.mesh.userData.update(dt, this.t);
    for (const tr of this.triggers || []) { if (tr.done) continue; const ins = Math.hypot(tr.x - pp.x, tr.z - pp.z) < tr.r && Math.abs(tr.y - pp.y) < tr.r + 1.5; if (ins && !tr.inside) { tr.fn(tr); if (tr.once) tr.done = true; } tr.inside = ins; }
    this._updateCourses(dt, pp);
    for (const it of this.abilityItems || []) {
      if (it.taken) continue; it.mesh.rotation.y += dt * 2; it.mesh.position.y = it.y + Math.sin(this.t * 3) * 0.15;
      if (Math.random() < dt * 10) FX.sparkle(this.game.fx, { x: it.x, y: it.y + 0.3, z: it.z });
      if (Math.hypot(it.x - pp.x, it.z - pp.z) < 1.3 && Math.abs(it.y - pp.y) < 2) { it.taken = true; it.mesh.visible = false; FX.gold(this.game.fx, it); this.game.unlock(it.ability, it.text); }
    }
    // Türen
    if (this._doorCd > 0) this._doorCd -= dt;
    else for (const d of this.doors) if (Math.hypot(d.x - pp.x, d.z - pp.z) < 1.1 && Math.abs(d.y - pp.y) < 2) { this.teleport(d.to); break; }
    // Sammeln
    let nearestHidden = null, nd = 1e9;
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * (p.kind === 'goldbone' ? 2.5 : 2); p.mesh.position.y = p.y + Math.sin(this.t * 3 + p.mesh.userData.spin) * 0.12;
      if (p.mesh.userData.halo) { const h = p.mesh.userData.halo; h.scale.setScalar(1 + Math.sin(this.t * 4) * 0.12); h.material.opacity = 0.3 + Math.sin(this.t * 4) * 0.15; }
      if (p.kind === 'goldbone' && p.mesh.visible && Math.random() < dt * 8) FX.sparkle(this.game.fx, { x: p.x, y: p.y + 0.3, z: p.z });
      else if (p.goal && p.mesh.visible && Math.random() < dt * 1.5) FX.sparkle(this.game.fx, { x: p.x, y: p.y + 0.2, z: p.z }); // Ziel-Essen glitzert
      if (p.appear !== undefined && p.appear < 1) { p.appear = Math.min(1, p.appear + dt * 2.5); const k = p.appear, e = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); p.mesh.scale.setScalar(Math.max(0.01, e)); }
      const d = Math.hypot(p.x - pp.x, p.z - pp.z), dy = Math.abs(p.y - pp.y);
      if (p.hidden) {
        if (d < nd) { nd = d; nearestHidden = p; }
        if (pl.sniffing && d < 6 && !p.mesh.visible) { p.mesh.visible = true; p.appear = 0; FX.crumb(this.game.fx, { x: p.x, y: p.y + 0.3, z: p.z }); }
        if (!p.mesh.visible) continue;
      }
      if (d < 1.2 && dy < 1.8) {
        p.taken = true; p.mesh.visible = false;
        const at = { x: p.x, y: p.mesh.position.y + 0.3, z: p.z };
        if (p.kind === 'goldbone') FX.gold(this.game.fx, at); else if (p.goal) FX.food(this.game.fx, at); else { FX.crumb(this.game.fx, at); FX.crumbRing(this.game.fx, at); }
        this.game.collect(p, this); this.remember(p); if (p.onTake) p.onTake(p);
      }
    }
    this.game.sniffHint(pl.sniffing ? nearestHidden : null, nd);
    // Portale
    for (const po of this.portals) {
      this._portalState(po); const locked = po.locked;
      po.disk.userData.update(dt, locked);
      po.gems.forEach((gm, i) => gm.scale.setScalar(locked ? 1 : 1 + Math.max(0, Math.sin(this.t * 4 - i * 0.52)) * 0.35)); // Lauflicht
      po.orbs.forEach((o, i) => { o.position.y = 4.25 + Math.sin(this.t * 2 + i) * 0.08; });
      po.lock.rotation.z = Math.sin(this.t * 2) * 0.12; po.crown.rotation.y += dt * 2;
      po.beam.material.opacity = 0.1 + Math.sin(this.t * 2.5) * 0.04;
      if (!locked && Math.random() < dt * 8) this.game.fx.burst({ x: po.x + (Math.random() - 0.5) * 3, y: 0.5, z: po.z + (Math.random() - 0.5) * 3 }, { n: 1, color: [po.color.getHex(), 0xffffff], speed: 0.2, up: 2.2, life: 1.4, size: 0.12, gravity: 0, drag: 0 });
      if (Math.hypot(po.x - pp.x, po.z - pp.z) < 1.3 && pp.y < 3) {
        if (locked) { this.game.toast(`Verschlossen – ${po.need} Goldknochen nötig`); const dx = pp.x - po.x, dz = pp.z - po.z, l = Math.hypot(dx, dz) || 1; pl.vel.x += dx / l * 9; pl.vel.z += dz / l * 9; }
        else this.game.enterLevel(po.target);
      }
    }
    // Gegner
    for (const e of this.enemies) if (!e.dead) e.update(dt, this);
    // Interaktions-Hinweis
    let hint = null;
    for (const it of this.interact) if (!it.used && Math.hypot(it.x - pp.x, it.z - pp.z) < it.r + 1.3 && Math.abs(it.y - pp.y) < 2.5) hint = it.hintText;
    this.game.hint(hint);
    if (this.def.update) this.def.update(this, dt);
    if (this.boss) this.game.updateBossBar(this.boss);
  }

  // Levelziel erreicht → Goldknochen erscheint (oder Boss startet)
  // Zufällige Krümel erst nach dem Aufbau verteilen: nie in Blöcken, nie über Wasser/Gefahr, immer erreichbar.
  scatter(n, kind = 'crumb') { this._scatter.push({ n, kind }); }
  _placeScatter() {
    const s = (this.def.size || 40) - 3, hazard = this.def.hazard, rand = seeded(this.key || 'x');
    for (const { n, kind } of this._scatter) {
      let placed = 0, tries = 0;
      while (placed < n && tries++ < n * 60) {
        const x = (rand() * 2 - 1) * s, z = (rand() * 2 - 1) * s;
        if (hazard && hazard(x, z)) continue;
        if (this.waterAt(x, z) !== null) continue;
        let top = -Infinity;
        for (const so of this.solids) if (so.active && x > so.min.x - 0.5 && x < so.max.x + 0.5 && z > so.min.z - 0.5 && z < so.max.z + 0.5) top = Math.max(top, so.max.y);
        const th = this.heightAt(x, z);
        if (top > 2.6 && top > th) continue; // hohe Kisten nicht, Hügel schon
        top = Math.max(top, th);
        if (this.def.minFloor !== undefined && top < this.def.minFloor) continue;
        this.pickup(x, top + 0.3, z, kind); placed++;
      }
    }
  }

  // Goldknochen mit fester ID je Welt. Schon gesammelte erscheinen als Geist und zählen nicht doppelt.
  goldbone(id, x, y, z, opts = {}) {
    const owned = this.game.hasBone(this.key, id);
    const p = this.pickup(x, y, z, 'goldbone', { hidden: opts.hidden, onTake: () => this.game.awardBone(this, id, opts.exit) });
    p.boneId = id;
    if (owned) p.mesh.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; } });
    return p;
  }

  checkGoal() {
    if (this.goal.need && this.goal.have >= this.goal.need && !this.goalReached) {
      this.goalReached = true;
      if (this.def.onGoal) this.def.onGoal(this); else this.spawnGoldbone(0, 1, 0);
    }
  }
  spawnGoldbone(x, y, z, id = 'boss') {
    this.game.audio.sfx('big'); this.game.toast('Ein GOLDKNOCHEN ist erschienen! 🦴');
    const p = this.goldbone(id, x, Math.max(y, 1), z); p.appear = 0; p.mesh.scale.setScalar(0.01);
    FX.gold(this.game.fx, { x, y: Math.max(y, 1) + 0.5, z }); this.game.shake(0.25);
  }
  // ---- Fortschritt pro Welt: gesammelte Ziele und Krümel bleiben gesammelt, auch nach dem Verlassen
  restore() {
    const st = this.game.worldState(this.key); this.state = st;
    for (const p of this.pickups) {
      if (p.kind === 'goldbone') continue;
      if (p.special) { if (st.special.includes(p.idx)) { p.taken = true; p.mesh.visible = false; if (p.onRestore) p.onRestore(p); } continue; }
      if ((p.goal ? st.goals : st.crumbs).includes(p.idx)) { p.taken = true; p.mesh.visible = false; if (p.goal) this.goal.have++; else this.crumbHave++; }
    }
    if (this.goal.need && this.goal.have >= this.goal.need) {
      if (this.game.hasBone(this.key, 'boss')) this.goalReached = true; else this.checkGoal();
    }
    if (this.crumbTotal && this.crumbHave === this.crumbTotal && (BONES[this.key] || []).includes('kruemel') && !this.game.hasBone(this.key, 'kruemel')) this.spawnGoldbone(this.spawn.x + 2, this.spawn.y + 0.8, this.spawn.z, 'kruemel');
  }
  remember(p) {
    if (!this.state || p.kind === 'goldbone') return;
    const list = p.special ? this.state.special : p.goal ? this.state.goals : this.state.crumbs; if (!list.includes(p.idx)) { list.push(p.idx); this.game.persist(); }
  }
  onCrumb() {
    this.crumbHave++;
    if ((BONES[this.key] || []).includes('kruemel') && this.crumbHave === this.crumbTotal) {
      const p = this.game.player.pos, f = this.game.player.yaw;
      this.game.toast('Alle Krümel gefressen!', 2500);
      this.spawnGoldbone(p.x + Math.sin(f) * 2.5, p.y + 0.8, p.z + Math.cos(f) * 2.5, 'kruemel');
    }
  }
}
