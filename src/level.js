// Level-Framework: Szene, Solids (AABB), Sammelobjekte, Portale, Interaktionen, Gegner, Boss.
import * as THREE from 'three';
import { box, makeFood, makeLabel, makeTree, makeBush, cyl } from './models.js';

export class Level {
  constructor(game, def) {
    this.game = game; this.def = def;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(def.sky || 0x6fc3ff);
    this.scene.fog = new THREE.Fog(def.sky || 0x6fc3ff, def.fogNear || 40, def.fogFar || 110);
    this.solids = []; this.pickups = []; this.enemies = []; this.portals = []; this.interact = []; this.hideSpots = [];
    this.bounds = { min: { x: -(def.size || 40), z: -(def.size || 40) }, max: { x: def.size || 40, z: def.size || 40 } };
    this.boss = null; this.goal = { have: 0, need: def.need || 0, kind: def.goalKind || 'ham' }; this.done = false; this.t = 0;
    this.spawn = new THREE.Vector3(0, 1, 0);
    this._light();
    this.ground(def.ground || 0x6bbf59, def.size || 40);
    this.group = new THREE.Group(); this.scene.add(this.group);
    def.build(this);
  }

  _light() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a6b3f, 0.75));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.2); sun.position.set(20, 40, 15); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); const s = 45; sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s; sun.shadow.camera.far = 120;
    this.scene.add(sun); this.sun = sun;
  }

  ground(color, size) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(size * 2.4, size * 2.4), new THREE.MeshLambertMaterial({ color }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; this.scene.add(g);
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
    g.position.set(x, 0, z); this.group.add(g);
    const lab = makeLabel(need ? `${text} 🦴${need}` : text); lab.position.set(0, 4.2, 0); g.add(lab);
    this.portals.push({ x, z, target, group: g, disk, need, ring });
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
    // Sammeln
    let nearestHidden = null, nd = 1e9;
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * 2; p.mesh.position.y = p.y + Math.sin(this.t * 3 + p.mesh.userData.spin) * 0.12;
      const d = Math.hypot(p.x - pp.x, p.z - pp.z), dy = Math.abs(p.y - pp.y);
      if (p.hidden) {
        if (d < nd) { nd = d; nearestHidden = p; }
        if (pl.sniffing && d < 6) p.mesh.visible = true;
        if (!p.mesh.visible) continue;
      }
      if (d < 1.2 && dy < 1.8) {
        p.taken = true; p.mesh.visible = false;
        this.game.collect(p, this); if (p.onTake) p.onTake(p);
      }
    }
    this.game.sniffHint(pl.sniffing ? nearestHidden : null, nd);
    // Portale
    for (const po of this.portals) {
      po.ring.rotation.y += dt; po.disk.material.opacity = 0.3 + Math.sin(this.t * 3) * 0.1;
      const locked = po.need > this.game.save.goldbones; po.ring.material.color.set(locked ? 0x777777 : 0xffcc33);
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
  checkGoal() {
    if (this.goal.need && this.goal.have >= this.goal.need && !this.goalReached) {
      this.goalReached = true;
      if (this.def.onGoal) this.def.onGoal(this); else this.spawnGoldbone(0, 1, 0);
    }
  }
  spawnGoldbone(x, y, z) {
    this.game.audio.sfx('big'); this.game.toast('Ein GOLDKNOCHEN ist erschienen! 🦴');
    this.pickup(x, y, z, 'goldbone', { onTake: () => this.game.levelComplete(this) });
  }
}
