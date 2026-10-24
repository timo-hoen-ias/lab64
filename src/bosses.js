// Bosse und Gegner. Jeder hat: mesh, name, hp, maxHp, radius, dead, update(dt, level), onBite().
import * as THREE from 'three';
import { FX } from './fx.js';
import { makeVacuum, makeCat, makeCanOpener, makeBird, makeFatMan, makeRat, makeCrab, makeJelly, box, cyl, sphere } from './models.js';

class Boss {
  constructor(game, mesh, name, hp, radius = 1.4) {
    this.game = game; this.mesh = mesh; this.name = name; this.hp = hp; this.maxHp = hp; this.radius = radius;
    this.dead = false; this.stun = 0; this.t = 0; this.state = 'idle'; this.flash = 0; this.rage = 1;
  }
  get pos() { return this.mesh.position; }
  get player() { return this.game.player; }
  dist() { return this.pos.distanceTo(this.player.pos); }
  faceTo(target, dt, speed = 6) {
    const d = Math.atan2(target.x - this.pos.x, target.z - this.pos.z); let r = d - this.mesh.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); this.mesh.rotation.y += r * Math.min(1, dt * speed);
  }
  moveTo(target, speed, dt) {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z, l = Math.hypot(dx, dz);
    if (l < 0.05) return; this.pos.x += dx / l * speed * dt; this.pos.z += dz / l * speed * dt;
  }
  touchPlayer(r = 1.5, dmg = 1) { if (this.dist() < r + this.radius * 0.5 && Math.abs(this.player.pos.y - this.pos.y) < 2.5) this.player.hurt(dmg); }
  damage(n = 1) {
    this.hp -= n; this.flash = 0.3; this.rage = 1 + (this.maxHp - this.hp) * 0.3; // Phase 2+: schneller
    this.game.audio.sfx('hit'); this.game.input.vibrate(150); this.game.shake(0.35);
    FX.hit(this.game.fx, { x: this.pos.x, y: this.pos.y + 1.5, z: this.pos.z });
    this.mesh.traverse(o => { if (o.material) { o.material.emissive = new THREE.Color(0xff4444); } });
    if (this.hp <= 0) this.die();
  }
  onBite() { if (this.stun > 0 && !this.dead) { this.damage(1); this.stun = 0; } else if (!this.dead) this.game.toast('Nur angreifbar, wenn er benommen ist!'); }
  die() {
    this.dead = true; this.game.audio.sfx('win'); this.game.hideBoss(); this.game.shake(0.6);
    this.game.fx.burst({ x: this.pos.x, y: this.pos.y + 1, z: this.pos.z }, { n: 40, color: [0xffffff, 0xdddddd, 0xffe066], speed: 9, up: 6, life: 1, size: 0.35, gravity: -10 });
    this.game.toast(`${this.name} besiegt!`);
    const lvl = this.game.level; this.game.later(800, () => lvl.spawnGoldbone(this.pos.x, this.pos.y + 1, this.pos.z));
  }
  baseUpdate(dt) {
    this.t += dt;
    if (this.flash > 0) { this.flash -= dt; if (this.flash <= 0) this.mesh.traverse(o => { if (o.material) o.material.emissive = new THREE.Color(0x000000); }); }
    if (this.stun > 0) {
      this.stun -= dt; this.mesh.rotation.z = Math.sin(this.t * 20) * 0.1;
      if (Math.random() < dt * 12) { const a = this.t * 6; this.game.fx.burst({ x: this.pos.x + Math.cos(a) * this.radius, y: this.pos.y + this.radius * 2 + 0.6, z: this.pos.z + Math.sin(a) * this.radius }, { n: 1, color: [0xffe066, 0xffffff], speed: 0.3, up: 0.5, life: 0.6, size: 0.25, gravity: 0 }); } // Sternchen
      return true;
    }
    this.mesh.rotation.z = 0; return false;
  }
  clampArena(r) { const l = Math.hypot(this.pos.x - this.cx, this.pos.z - this.cz); if (l > r) { this.pos.x = this.cx + (this.pos.x - this.cx) / l * r; this.pos.z = this.cz + (this.pos.z - this.cz) / l * r; return true; } return false; }
}

// Staubsauger: saugt sich an Moll ran, rammt und bleibt an der Wand hängen → benommen.
export class Vacuum extends Boss {
  constructor(game, cx, cz, arena = 12) {
    super(game, makeVacuum(), 'Der Staubsauger', 3, 2.5); this.cx = cx; this.cz = cz; this.arena = arena;
    this.pos.set(cx, 0, cz); this.state = 'hunt'; this.timer = 0; this.size = 1.7; this.mesh.scale.setScalar(this.size);
  }
  // Motorgeräusch: lauter, je näher Moll ist; heult beim Anlauf und Rammen auf, stottert wenn benommen
  motor() {
    if (this.dead) { if (this.hum) this.hum.stop(); return; }
    if (!this.hum || this.hum.dead) this.hum = this.game.audio.loop('vacuum');
    if (!this.hum) return;
    const near = Math.max(0.25, 1 - this.dist() / 30), pitch = this.stun > 0 ? 0.6 + Math.sin(this.t * 25) * 0.1 : this.state === 'wind' ? 1 + this.timer * 0.8 : this.state === 'charge' ? 1.8 : 1;
    this.hum.set(0.22 * near * (this.stun > 0 ? 0.6 : 1), pitch);
  }
  die() { if (this.hum) this.hum.stop(); this.game.audio.sfx('ko'); super.die(); }
  update(dt, lvl) {
    this.motor();
    if (this.state === 'hunt' && Math.random() < dt * 10) this.game.fx.burst({ x: this.pos.x, y: 0.3, z: this.pos.z }, { n: 1, color: [0xcfcfcf, 0xa8a8a8], speed: 1.5, up: 0.8, life: 0.6, size: 0.25, gravity: 0, flat: true }); // Staubwolke
    if (this.baseUpdate(dt)) { this.mesh.userData.nozzle.rotation.y = Math.sin(this.t * 15) * 0.3; return; }
    this.mesh.userData.nozzle.rotation.y = 0;
    this.mesh.position.y = Math.abs(Math.sin(this.t * 10)) * 0.05;
    if (this.state === 'hunt') {
      this.faceTo(this.player.pos, dt, 2.5); this.moveTo(this.player.pos, 3.2 * this.rage, dt);
      // Schnauzsog: zieht Moll in der Nähe an
      if (this.dist() < 8) { const d = new THREE.Vector3().subVectors(this.pos, this.player.pos).normalize(); this.player.vel.x += d.x * 10 * dt; this.player.vel.z += d.z * 10 * dt; }
      this.timer += dt;
      if (this.timer > 3.5 / this.rage && this.dist() < 10) { this.state = 'wind'; this.timer = 0; this.game.audio.sfx('vacuum'); }
      this.touchPlayer(1.2);
    } else if (this.state === 'wind') {
      this.timer += dt; this.mesh.scale.setScalar(this.size * (1 + Math.sin(this.t * 30) * 0.03));
      this.faceTo(this.player.pos, dt, 6);
      if (this.timer > 0.9) { this.state = 'charge'; this.timer = 0; this.dir = new THREE.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)); this.mesh.scale.setScalar(this.size); }
    } else if (this.state === 'charge') {
      this.pos.addScaledVector(this.dir, 16 * this.rage * dt); this.timer += dt; this.touchPlayer(1.4);
      if (this.clampArena(this.arena) || this.timer > 1.6) { this.state = 'hunt'; this.timer = 0; this.stun = 2.6; this.game.audio.sfx('hit'); this.game.shake(0.4); this.game.toast('Benommen – BEISSEN!'); }
    }
    this.clampArena(this.arena);
  }
}

// Kater: lauert, springt mit Vorwarnung, landet und ist kurz benommen.
export class Cat extends Boss {
  constructor(game, cx, cz, arena = 11) {
    super(game, makeCat(0x3b3b3b), 'Der große Kater', 3, 1.3); this.cx = cx; this.cz = cz; this.arena = arena;
    this.pos.set(cx, 0, cz); this.state = 'prowl'; this.timer = 0;
  }
  update(dt) {
    const u = this.mesh.userData; u.t += dt * 8;
    if (this.baseUpdate(dt)) return;
    this.faceTo(this.player.pos, dt, 4);
    if (this.state === 'prowl') {
      u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.t + i * 1.5) * 0.5); u.tail.rotation.z = Math.sin(u.t * 0.5) * 0.4;
      // Kreist um Moll
      const ang = Math.atan2(this.pos.z - this.player.pos.z, this.pos.x - this.player.pos.x) + dt * 0.9;
      const tx = this.player.pos.x + Math.cos(ang) * 6, tz = this.player.pos.z + Math.sin(ang) * 6;
      this.moveTo({ x: tx, z: tz }, 4, dt); this.timer += dt;
      if (this.timer > 2.2 / this.rage) { this.state = 'crouch'; this.timer = 0; }
      this.touchPlayer(1.1);
    } else if (this.state === 'crouch') {
      this.mesh.scale.y = 0.75 + Math.sin(this.t * 25) * 0.04; this.timer += dt;
      if (this.timer > 0.7 / this.rage) { this.state = 'pounce'; this.timer = 0; this.mesh.scale.y = 1; this.target = this.player.pos.clone(); this.from = this.pos.clone(); this.game.audio.sfx('bark'); }
    } else if (this.state === 'pounce') {
      this.timer += dt; const k = Math.min(1, this.timer / 0.55);
      this.pos.lerpVectors(this.from, this.target, k); this.pos.y = Math.sin(k * Math.PI) * 3;
      u.legs.forEach(l => l.rotation.x = -0.8);
      if (k >= 1) { this.pos.y = 0; this.state = 'prowl'; this.timer = 0; this.stun = 1.8; this.touchPlayer(1.6); this.game.toast('Kater gelandet – jetzt beißen!'); }
    }
    this.clampArena(this.arena);
  }
}

// Dosenöffner: bewacht die Dose, schlägt mit der Klinge nach unten, bleibt im Boden stecken.
export class CanOpener extends Boss {
  constructor(game, cx, cz) {
    super(game, makeCanOpener(), 'Der Dosenöffner', 3, 1.4); this.cx = cx; this.cz = cz;
    this.pos.set(cx, 0.5, cz); this.state = 'hover'; this.timer = 0; this.baseY = 0.5;
    this.can = cyl(0.8, 0.8, 1.0, 0xc0c8d0, cx, 0.5, cz, 14); this.can.add(cyl(0.6, 0.6, 1.02, 0xe8c04a, 0, 0, 0, 14));
  }
  update(dt, lvl) {
    this.mesh.userData.blade.rotation.z += dt * 6;
    if (this.baseUpdate(dt)) { this.pos.y = 0; return; }
    if (this.state === 'hover') {
      this.timer += dt; this.pos.y = this.baseY + Math.sin(this.t * 2) * 0.4 + 2;
      const ang = this.t * 0.6; const tx = this.cx + Math.cos(ang) * 5, tz = this.cz + Math.sin(ang) * 5;
      // schwebt über Moll, wenn er in der Nähe ist
      const target = this.dist() < 9 ? this.player.pos : { x: tx, z: tz };
      this.moveTo(target, 4.5 * this.rage, dt);
      if (this.timer > 2.6 / this.rage && this.dist() < 4.5) { this.state = 'slam'; this.timer = 0; this.game.audio.sfx('vacuum'); }
    } else if (this.state === 'slam') {
      this.timer += dt;
      if (this.timer < 0.5) this.pos.y += 6 * dt; else { this.pos.y -= 30 * dt; }
      if (this.pos.y <= 0) {
        this.pos.y = 0; this.state = 'hover'; this.timer = 0; this.stun = 2.4; this.game.audio.sfx('hit'); this.game.input.vibrate(300);
        this.touchPlayer(2.2); this.game.toast('Steckt fest – BEISS die Klinge!');
      }
    }
    this.clampArena(10);
  }
  die() { super.die(); this.can.scale.y = 0.5; this.game.toast('Die Dose ist offen! Thunfisch für alle!'); }
}

// Möwe / Taube: kreist, stürzt herab und landet zum Verschnaufen.
export class BirdBoss extends Boss {
  constructor(game, kind, cx, cz, name) {
    super(game, makeBird(kind), name, 3, kind === 'seagull' ? 1.6 : 1.1); this.cx = cx; this.cz = cz; this.kind = kind;
    this.pos.set(cx, 6, cz); this.state = 'circle'; this.timer = 0; this.ang = 0;
  }
  update(dt) {
    const u = this.mesh.userData; u.t += dt;
    if (this.baseUpdate(dt)) { u.wings.forEach(w => w.rotation.z = 0); this.pos.y = this.restY || 0; return; }
    u.wings.forEach((w, i) => w.rotation.z = Math.sin(u.t * 14) * 0.6 * (i ? -1 : 1));
    if (this.state === 'circle') {
      this.ang += dt * 1.2; this.timer += dt;
      const tx = this.player.pos.x + Math.cos(this.ang) * 7, tz = this.player.pos.z + Math.sin(this.ang) * 7;
      this.moveTo({ x: tx, z: tz }, 9, dt); this.pos.y += (this.player.pos.y + 6 - this.pos.y) * dt * 2;
      this.faceTo({ x: tx + Math.cos(this.ang + 1), z: tz + Math.sin(this.ang + 1) }, dt, 5);
      if (this.timer > 3 / this.rage) { this.state = 'dive'; this.timer = 0; this.target = this.player.pos.clone(); this.from = this.pos.clone(); }
    } else if (this.state === 'dive') {
      this.timer += dt; const k = Math.min(1, this.timer / 0.7);
      this.pos.lerpVectors(this.from, this.target, k); this.faceTo(this.target, dt, 10);
      if (k >= 1) { this.restY = Math.max(0, this.target.y); this.touchPlayer(1.8); this.state = 'rest'; this.timer = 0; this.stun = 2.2; this.game.toast(`${this.name} muss verschnaufen – beißen!`); }
    }
  }
}

// Kleine Tauben-Plage: pickt Moll bei Berührung; weicht Bissen aus.
export class Pigeon {
  constructor(game, x, z, y0 = 0) { this.game = game; this.mesh = makeBird('pigeon'); this.y0 = y0; this.mesh.position.set(x, y0, z); this.radius = 0.8; this.dead = false; this.t = Math.random() * 10; this.home = { x, z }; }
  update(dt) {
    this.t += dt; const u = this.mesh.userData; u.wings.forEach((w, i) => w.rotation.z = Math.sin(this.t * 12) * 0.5 * (i ? -1 : 1));
    this.mesh.position.x = this.home.x + Math.cos(this.t * 0.7) * 3; this.mesh.position.z = this.home.z + Math.sin(this.t * 0.9) * 3;
    this.mesh.position.y = this.y0 + 0.3 + Math.abs(Math.sin(this.t * 2)) * 1.5; this.mesh.rotation.y = this.t * 0.8;
    const p = this.game.player; if (this.mesh.position.distanceTo(p.pos) < 1.2) p.hurt(1);
  }
  onBite() { this.dead = true; this.mesh.visible = false; this.game.audio.sfx('collect'); this.game.toast('Taube verscheucht!'); }
}

// Der dicke Mann: läuft Wegpunkte ab, verliert Essen, schaut sich um. Wer im Blickkegel steht, wird erwischt.
export class FatMan {
  constructor(game, path, onDrop) {
    this.game = game; this.mesh = makeFatMan(); this.path = path; this.i = 0; this.radius = 1.5; this.dead = false;
    this.mesh.position.set(path[0].x, 0, path[0].z); this.t = 0; this.drop = 0; this.onDrop = onDrop; this.suspicion = 0; this.turning = 0; this.name = 'Der dicke Mann';
    this.dropped = 0;
  }
  update(dt, lvl) {
    this.t += dt; const u = this.mesh.userData;
    const p = this.game.player;
    if (this.turning > 0) { this.turning -= dt; this.mesh.rotation.y += dt * 2.2; }
    else {
      const wp = this.path[this.i]; const dx = wp.x - this.mesh.position.x, dz = wp.z - this.mesh.position.z, l = Math.hypot(dx, dz);
      if (l < 0.5) { this.i = (this.i + 1) % this.path.length; if (Math.random() < 0.5) this.turning = 1.4; }
      else { this.mesh.position.x += dx / l * 2.6 * dt; this.mesh.position.z += dz / l * 2.6 * dt; this.mesh.rotation.y = Math.atan2(dx, dz); }
      u.legs.forEach((lg, k) => lg.rotation.x = Math.sin(this.t * 6 + k * Math.PI) * 0.5);
      u.arms.forEach((a, k) => a.rotation.x = Math.sin(this.t * 6 + k * Math.PI + Math.PI) * 0.4);
      // Essen fallen lassen
      this.drop += dt;
      if (this.drop > 4 && this.dropped < 10) { this.drop = 0; this.dropped++; const b = new THREE.Vector3(-Math.sin(this.mesh.rotation.y), 0, -Math.cos(this.mesh.rotation.y)); this.onDrop(this.mesh.position.x + b.x * 1.5, this.mesh.position.z + b.z * 1.5); }
    }
    // Sichtkegel
    const f = new THREE.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
    const to = new THREE.Vector3().subVectors(p.pos, this.mesh.position); const d = to.length(); to.normalize();
    const seen = d < 9 && f.dot(to) > 0.45 && !lvl.isHidden(p.pos);
    if (seen) this.suspicion = Math.min(1, this.suspicion + dt * (d < 4 ? 2.5 : 0.9)); else this.suspicion = Math.max(0, this.suspicion - dt * 0.8);
    this.game.suspicion(this.suspicion);
    if (this.suspicion >= 1) {
      this.suspicion = 0; this.game.audio.sfx('lose'); this.game.toast('„HEY! Weg da, Hund!“ – Erwischt!'); p.hurt(1); p.respawn();
    }
  }
  onBite() { this.game.toast('Lieber nicht beißen. Leise bleiben!'); }
}

// Ratte (Kanal-Boss): wird nicht besiegt – nach 3 Bissen schlägt sie Moll k.o. → Albtraum.
export class RatBoss extends Boss {
  constructor(game, cx, cz) {
    super(game, makeRat(2.2), 'Die Kanalratte', 3, 1.6); this.cx = cx; this.cz = cz; this.pos.set(cx, 0, cz); this.state = 'dash'; this.timer = 0;
  }
  update(dt) {
    const u = this.mesh.userData; u.t += dt * 10; u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.t + i) * 0.6);
    if (this.baseUpdate(dt)) return;
    if (this.state === 'dash') {
      this.timer += dt; this.faceTo(this.player.pos, dt, 3); this.moveTo(this.player.pos, 6 * this.rage, dt); this.touchPlayer(1.3);
      if (this.timer > 2.5) { this.state = 'spin'; this.timer = 0; }
    } else {
      this.timer += dt; this.mesh.rotation.y += dt * 12;
      if (this.timer > 1.2) { this.state = 'dash'; this.timer = 0; this.stun = 1.5; this.game.toast('Schwindelig – beißen!'); }
    }
    this.clampArena(10);
    this.pos.y = Math.abs(this.pos.x) > 5 ? 1 : 0; // Gehweg oder Rinne
  }
  die() {
    // Kein Sieg: Die Ratte holt zum K.o. aus.
    this.dead = true; this.game.hideBoss(); this.game.audio.sfx('ko');
    this.game.toast('Die Ratte holt aus … alles wird schwarz.');
    this.game.player.frozen = true;
    this.game.later(2200, () => this.game.enterLevel('albtraum'));
  }
}

// Kneifer, die Riesenkrabbe: rennt seitwärts, hebt die Scheren und haut sie in den Sand. Steckt eine fest → benommen.
// Nach dem ersten Treffer flüchtet sie ins Wasser (hinterhertauchen!), nach dem zweiten kommt sie zurück und wirft Muscheln.
export class Crab extends Boss {
  constructor(game, cx, cz, water, arena = 13) {
    super(game, makeCrab(), 'Kneifer, die Riesenkrabbe', 3, 2.2); this.home = { x: cx, z: cz }; this.cx = cx; this.cz = cz; this.water = water; this.arena = arena;
    this.pos.set(cx, 0, cz); this.state = 'scuttle'; this.timer = 0; this.size = 2; this.mesh.scale.setScalar(this.size); this.shells = []; this.phase = 0;
  }
  ground(lvl) { return lvl.groundAt(this.pos.x, this.pos.z, 30); }
  update(dt, lvl) {
    const u = this.mesh.userData; u.t += dt;
    for (const s of this.shells) { s.v.y -= 20 * dt; s.m.position.addScaledVector(s.v, dt); s.life -= dt; if (s.m.position.distanceTo(this.player.pos.clone().setY(this.player.pos.y + 0.6)) < 1 && s.life > 0) { this.player.hurt(1); s.life = 0; } if (s.life <= 0) s.m.visible = false; }
    this.shells = this.shells.filter(s => s.life > 0);
    if (this.baseUpdate(dt)) { u.claws.forEach((c, i) => c.rotation.x = 0.9 + Math.sin(this.t * 18 + i) * 0.08); this.pos.y = this.ground(lvl); return; }
    // Phasenwechsel nach Treffern
    const ph = this.maxHp - this.hp;
    if (ph !== this.phase) {
      this.phase = ph;
      if (ph === 1) { this.cx = this.water.x; this.cz = this.water.z; this.state = 'flee'; this.game.toast('Kneifer flüchtet ins Wasser – tauch hinterher!', 3500); }
      if (ph === 2) { this.cx = this.home.x; this.cz = this.home.z; this.state = 'flee'; this.game.toast('Kneifer ist sauer und wirft mit Muscheln!', 3000); }
    }
    u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.t * 14 + i * 1.3) * 0.4);
    if (this.state === 'flee') {
      this.moveTo({ x: this.cx, z: this.cz }, 9, dt); this.faceTo({ x: this.cx, z: this.cz }, dt, 4);
      if (Math.hypot(this.pos.x - this.cx, this.pos.z - this.cz) < 1) { this.state = 'scuttle'; this.timer = 0; }
    } else if (this.state === 'scuttle') {
      // seitwärts um Moll herum, langsam näher
      this.faceTo(this.player.pos, dt, 3);
      const a = Math.atan2(this.pos.z - this.player.pos.z, this.pos.x - this.player.pos.x) + dt * 0.8 * this.rage, r = Math.max(4, this.dist() - dt * 2);
      this.moveTo({ x: this.player.pos.x + Math.cos(a) * r, z: this.player.pos.z + Math.sin(a) * r }, 4 * this.rage, dt);
      u.claws.forEach((c, i) => c.rotation.x = Math.sin(u.t * 6 + i) * 0.2);
      this.timer += dt;
      if (this.phase === 2 && this.timer > 0.9 && Math.random() < dt * 1.5) this.throwShell(lvl);
      if (this.timer > 2.6 / this.rage && this.dist() < 12) { this.state = 'raise'; this.timer = 0; this.game.audio.sfx('vacuum'); }
      this.touchPlayer(1.2);
    } else if (this.state === 'raise') {
      this.timer += dt; this.faceTo(this.player.pos, dt, 8); u.claws.forEach(c => c.rotation.x = -1.2);
      if (this.timer > 0.8) { this.state = 'slam'; this.timer = 0; this.target = this.player.pos.clone(); }
    } else if (this.state === 'slam') {
      this.timer += dt; this.moveTo(this.target, 13, dt);
      if (this.timer > 0.55 || Math.hypot(this.pos.x - this.target.x, this.pos.z - this.target.z) < 0.6) {
        u.claws.forEach(c => c.rotation.x = 0.9); this.game.shake(0.4); this.game.audio.sfx('hit');
        FX.dust(this.game.fx, { x: this.pos.x, y: this.pos.y + 0.2, z: this.pos.z }, 18);
        if (this.dist() < 3.2) this.player.hurt(1);
        this.stun = 2.4; this.state = 'scuttle'; this.timer = 0; this.game.toast('Die Schere steckt fest – beißen!');
      }
    }
    this.clampArena(this.arena); this.pos.y = this.ground(lvl);
  }
  throwShell(lvl) {
    const m = sphere(0.3, 0xffb3c6, 0, 0, 0, 6); m.position.copy(this.pos).setY(this.pos.y + 2); lvl.group.add(m);
    const d = this.player.pos.clone().sub(m.position); const t = 1.1; const v = new THREE.Vector3(d.x / t, (d.y + 10 * t * t) / t, d.z / t);
    this.shells.push({ m, v, life: 2.5 });
  }
}

// Kleine Strandkrabbe: läuft hin und her, zwickt. Biss = verscheucht (lässt Krümel fallen)
export class BeachCrab {
  constructor(game, x, z) { this.game = game; this.mesh = makeCrab(0xf0703a); this.mesh.scale.setScalar(0.55); this.home = { x, z }; this.t = Math.random() * 10; this.radius = 0.7; this.dead = false; this.mesh.position.set(x, 0, z); }
  update(dt, lvl) {
    this.t += dt; const u = this.mesh.userData; u.t += dt; u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.t * 16 + i) * 0.4);
    const p = this.mesh.position; p.x = this.home.x + Math.sin(this.t * 0.6) * 4; p.z = this.home.z + Math.sin(this.t * 0.23) * 1.5; p.y = lvl.groundAt(p.x, p.z, 30);
    this.mesh.rotation.y = Math.PI / 2;
    const pl = this.game.player; if (p.distanceTo(pl.pos) < 1.1) pl.hurt(1);
  }
  onBite() { this.dead = true; this.mesh.visible = false; this.game.audio.sfx('collect'); FX.hit(this.game.fx, this.mesh.position); this.game.toast('Zwick zurück!'); }
}

// Qualle: schwebt im Wasser auf und ab, Berührung brennt. Kann man nicht beißen.
export class Jelly {
  constructor(game, x, y, z) { this.game = game; this.mesh = makeJelly(); this.home = { x, y, z }; this.t = Math.random() * 10; this.radius = 0.8; this.dead = false; this.mesh.position.set(x, y, z); }
  update(dt) {
    this.t += dt; const u = this.mesh.userData, p = this.mesh.position;
    p.y = this.home.y + Math.sin(this.t * 0.8) * 2; p.x = this.home.x + Math.sin(this.t * 0.3) * 2;
    u.bell.scale.set(1 + Math.sin(this.t * 3) * 0.12, 1 - Math.sin(this.t * 3) * 0.12, 1 + Math.sin(this.t * 3) * 0.12); u.tent.forEach((t, i) => t.rotation.x = Math.sin(this.t * 3 + i) * 0.3);
    const pl = this.game.player; if (Math.hypot(p.x - pl.pos.x, p.z - pl.pos.z) < 1.1 && pl.pos.y + 0.6 > p.y - 1.4 && pl.pos.y < p.y + 0.6) pl.hurt(1);
  }
  onBite() { this.game.toast('Autsch – Quallen beißt man nicht!'); }
}
