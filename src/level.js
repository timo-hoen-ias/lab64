// Level-Framework: Szene, Solids (AABB), Sammelobjekte, Portale, Interaktionen, Gegner, Boss.
import * as THREE from 'three';
import { BONES } from './levels.js';
import { box, makeFood, makeLabel, makeTree, makeBush, cyl, sphere } from './models.js';
import { makeSky, makeClouds, makeWater, makePond, makePortalDisk, toonGradient, FX } from './fx.js';

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
    g.receiveShadow = true; this.scene.add(g); this.groundMesh = g;
    this.groundSolid = { min: { x: -size * 1.2, y: -5, z: -size * 1.2 }, max: { x: size * 1.2, y: 0, z: size * 1.2 }, active: true };
    this.solids.push(this.groundSolid);
  }

  // Schwimmteich (Ellipse): Loch im Boden, Becken, Wasser. Moll schwimmt darin (siehe Player).
  pond(x, z, rx, rz, depth = 1.8) {
    const size = (this.def.size || 40) * 1.2, color = this.groundMesh.material.color;
    // Boden neu: Rechteck mit elliptischem Loch
    const shape = new THREE.Shape(); shape.moveTo(-size, -size); shape.lineTo(size, -size); shape.lineTo(size, size); shape.lineTo(-size, size); shape.lineTo(-size, -size);
    const hole = new THREE.Path(); hole.absellipse(x, -z, rx, rz, 0, Math.PI * 2, false, 0); shape.holes.push(hole);
    this.groundMesh.geometry.dispose(); this.groundMesh.geometry = new THREE.ShapeGeometry(shape, 48);
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
  waterAt(x, z) { for (const p of this.ponds || []) if (((x - p.x) / p.rx) ** 2 + ((z - p.z) / p.rz) ** 2 < 1) return p.y; return null; }

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
    this.sky.mesh.position.copy(this.game.camera.position);
    if (this.clouds) this.clouds.userData.update(dt);
    if (this.water) this.water.userData.update(dt);
    for (const p of this.ponds || []) p.mesh.userData.update(dt);
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
