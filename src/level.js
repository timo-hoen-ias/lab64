// Level-Framework: Szene, Solids (AABB), Sammelobjekte, Portale, Interaktionen, Gegner, Boss.
import * as THREE from 'three';
import { BONES } from './levels.js';
import { box, makeFood, makeLabel, makeTree, makeBush, cyl } from './models.js';
import { makeSky, makeClouds, makeWater, toonGradient, FX } from './fx.js';

export class Level {
  constructor(game, def, key) {
    this.game = game; this.def = def; this.key = key; this._scatter = [];
    this.scene = new THREE.Scene();
    const dark = new THREE.Color(def.sky || 0x6fc3ff).getHSL({}).l < 0.35;
    this.sky = makeSky(def.sky || 0x6fc3ff, dark); this.scene.add(this.sky.mesh);
    this.scene.background = this.sky.horizon.clone();
    this.scene.fog = new THREE.Fog(this.sky.horizon, def.fogNear || 40, def.fogFar || 110);
    if (!def.indoor) { this.clouds = makeClouds(Math.round((def.size || 40) / 3), (def.size || 40) * 1.8, 38); this.scene.add(this.clouds); }
    this.solids = []; this.pickups = []; this.enemies = []; this.portals = []; this.interact = []; this.hideSpots = [];
    this.bounds = { min: { x: -(def.size || 40), z: -(def.size || 40) }, max: { x: def.size || 40, z: def.size || 40 } };
    this.boss = null; this.goal = { have: 0, need: def.need || 0, kind: def.goalKind || 'ham' }; this.done = false; this.t = 0;
    this.spawn = new THREE.Vector3(0, 1, 0);
    this._light();
    this.ground(def.ground || 0x6bbf59, def.size || 40);
    this.group = new THREE.Group(); this.scene.add(this.group);
    def.build(this);
    this._placeScatter();
    this.crumbTotal = this.pickups.filter(p => !p.goal && p.kind !== 'goldbone').length;
    this.crumbHave = 0;
  }

  _light() {
    this.scene.add(new THREE.HemisphereLight(0xdff1ff, 0x8a6b3f, 1.3));
    // Sonne folgt dem Hund: kleiner Schattenbereich = scharfe Schatten auch auf großen Karten
    const sun = new THREE.DirectionalLight(0xfff0d0, 2.4); sun.castShadow = true; this.sunOff = new THREE.Vector3(18, 34, 12);
    sun.shadow.mapSize.set(1024, 1024); const s = 26; sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s; sun.shadow.camera.far = 90;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    this.scene.add(sun, sun.target); this.sun = sun;
  }

  ground(color, size) {
    let g;
    if (this.def.water) { g = makeWater(color, size); this.water = g; }
    else { g = new THREE.Mesh(new THREE.PlaneGeometry(size * 2.4, size * 2.4), new THREE.MeshToonMaterial({ color, gradientMap: toonGradient() })); g.rotation.x = -Math.PI / 2; }
    g.receiveShadow = true; this.scene.add(g);
    this.solids.push({ min: { x: -size * 1.2, y: -5, z: -size * 1.2 }, max: { x: size * 1.2, y: 0, z: size * 1.2 }, active: true });
  }

  // Fester Block: x,y,z = Mittelpunkt (y = Unterkante), w,h,d
  box(x, y, z, w, h, d, color, opts = {}) {
    const m = box(w, h, d, color, x, y + h / 2, z); this.group.add(m);
    const s = { min: { x: x - w / 2, y, z: z - d / 2 }, max: { x: x + w / 2, y: y + h, z: z + d / 2 }, active: true, mesh: m, ...opts };
    this.solids.push(s); return s;
  }
  // Nur Deko (keine Kollision)
  deco(mesh, x = 0, y = 0, z = 0, ry = 0) { mesh.position.set(x, y, z); mesh.rotation.y = ry; this.group.add(mesh); return mesh; }
  tree(x, z, s = 1) { this.deco(makeTree(s), x, 0, z); this.solids.push({ min: { x: x - 0.4 * s, y: 0, z: z - 0.4 * s }, max: { x: x + 0.4 * s, y: 1.5 * s, z: z + 0.4 * s }, active: true }); }
  bush(x, z, w = 2) { const b = makeBush(w); this.deco(b, x, 0, z); this.hideSpots.push({ x, z, r: w * 0.5 }); return b; }
  wallRing(size, h = 3, color = 0x999999) {
    this.box(0, 0, -size, size * 2, h, 1, color); this.box(0, 0, size, size * 2, h, 1, color);
    this.box(-size, 0, 0, 1, h, size * 2, color); this.box(size, 0, 0, 1, h, size * 2, color);
  }
  label(text, x, y, z) { if (text.length > 18) { this.intro = text; return null; } const l = makeLabel(text); l.position.set(x, y, z); this.group.add(l); return l; }

  // Sammelobjekt. goal=true zählt für das Levelziel. hidden=true: nur per Schnüffeln auffindbar (unsichtbar bis nah).
  pickup(x, y, z, kind = 'crumb', opts = {}) {
    const m = makeFood(kind); m.position.set(x, y, z); this.group.add(m);
    const p = { mesh: m, kind, x, y, z, goal: !!opts.goal, hidden: !!opts.hidden, taken: false, value: opts.value || 1, onTake: opts.onTake, id: opts.id };
    if (p.hidden) m.visible = false;
    this.pickups.push(p); return p;
  }

  portal(x, z, text, target, color = 0xffcc33, need = 0) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.25, 8, 20), new THREE.MeshLambertMaterial({ color }));
    ring.position.y = 1.9; g.add(ring);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    disk.position.y = 1.9; g.add(disk);
    // Wirbel im Ring
    const swirl = new THREE.Group(); swirl.position.y = 1.9; g.add(swirl);
    for (let i = 0; i < 3; i++) { const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5 + i * 0.35, 0.05, 4, 16, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 - i * 0.12, side: THREE.DoubleSide })); arc.rotation.z = i * 2.1; swirl.add(arc); }
    g.position.set(x, 0, z); this.group.add(g);
    const prog = this.game.levelProgress(target); const locked = need > this.game.boneCount();
    const lab = makeLabel(locked ? `${text} 🔒${need}` : `${text} ${prog.have}/${prog.total}`); lab.scale.set(6, 1.5, 1); lab.position.set(0, 4.6, 0); g.add(lab);
    this.portals.push({ x, z, target, group: g, disk, need, ring, swirl });
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
    this.sky.mesh.position.copy(this.game.camera.position);
    if (this.clouds) this.clouds.userData.update(dt);
    if (this.water) this.water.userData.update(dt);
    // Sammeln
    let nearestHidden = null, nd = 1e9;
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * (p.kind === 'goldbone' ? 2.5 : 2); p.mesh.position.y = p.y + Math.sin(this.t * 3 + p.mesh.userData.spin) * 0.12;
      if (p.mesh.userData.halo) { const h = p.mesh.userData.halo; h.scale.setScalar(1 + Math.sin(this.t * 4) * 0.12); h.material.opacity = 0.3 + Math.sin(this.t * 4) * 0.15; }
      if (p.kind === 'goldbone' && p.mesh.visible && Math.random() < dt * 8) FX.sparkle(this.game.fx, { x: p.x, y: p.y + 0.3, z: p.z });
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
        if (p.kind === 'goldbone') FX.gold(this.game.fx, at); else if (p.goal) FX.food(this.game.fx, at); else FX.crumb(this.game.fx, at);
        this.game.collect(p, this); if (p.onTake) p.onTake(p);
      }
    }
    this.game.sniffHint(pl.sniffing ? nearestHidden : null, nd);
    // Portale
    for (const po of this.portals) {
      const locked = po.need > this.game.boneCount(); po.ring.material.color.set(locked ? 0x777777 : 0xffcc33);
      po.ring.rotation.z += dt * 0.6; po.disk.material.opacity = 0.3 + Math.sin(this.t * 3) * 0.1;
      po.group.rotation.y = Math.atan2(this.game.camera.position.x - po.x, this.game.camera.position.z - po.z); // Ring schaut zur Kamera
      po.swirl.rotation.z -= dt * (locked ? 0.4 : 3); po.swirl.visible = !locked;
      if (!locked && Math.random() < dt * 6) FX.sparkle(this.game.fx, { x: po.x + (Math.random() - 0.5) * 2.4, y: 0.6 + Math.random() * 2.6, z: po.z });
      if (Math.hypot(po.x - pp.x, po.z - pp.z) < 1.3 && pp.y < 3) {
        if (locked) { this.game.toast(`Verschlossen – ${po.need} Goldknochen nötig`); pl.vel.z -= 5; pl.vel.x -= 5; }
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
    const s = (this.def.size || 40) - 3, hazard = this.def.hazard;
    for (const { n, kind } of this._scatter) {
      let placed = 0, tries = 0;
      while (placed < n && tries++ < n * 60) {
        const x = (Math.random() * 2 - 1) * s, z = (Math.random() * 2 - 1) * s;
        if (hazard && hazard(x, z)) continue;
        let top = -Infinity;
        for (const so of this.solids) if (so.active && x > so.min.x - 0.5 && x < so.max.x + 0.5 && z > so.min.z - 0.5 && z < so.max.z + 0.5) top = Math.max(top, so.max.y);
        if (top > 2.6) continue;
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
    const p = this.goldbone(id, x, Math.max(y, 1), z, { exit: id === 'boss' }); p.appear = 0; p.mesh.scale.setScalar(0.01);
    FX.gold(this.game.fx, { x, y: Math.max(y, 1) + 0.5, z }); this.game.shake(0.25);
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
