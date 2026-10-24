// Moll – Spielerfigur: Bewegung, Sprung/Doppelsprung, Biss, Schnüffeln, AABB-Kollision gegen Level-Solids.
import * as THREE from 'three';
import { makeDog, animateDog } from './models.js';
import { makeBlobShadow, FX } from './fx.js';

const GRAVITY = -28, RUN = 8.5, JUMP = 11, JUMP2 = 9.5, HALF = 0.42, HEIGHT = 1.15;

export class Player {
  constructor(game) {
    this.game = game;
    this.mesh = makeDog(); this.shadow = makeBlobShadow(0.85); this.turn = 0;
    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.onGround = false; this.canDouble = true; this.coyote = 0;
    this.bite = 0; this.biteCd = 0; this.hurtT = 0; this.hp = 3; this.sniffing = false;
    this.hidden = false; this.speedFrac = 0; this.frozen = false;
    this.checkpoint = new THREE.Vector3(0, 1, 0);
  }

  reset(pos) { this.pos.copy(pos); this.checkpoint.copy(pos); this.vel.set(0, 0, 0); this.hp = 3; this.hurtT = 0; this.frozen = false; this.diving = false; this.air = undefined; }
  respawn() { this.pos.copy(this.checkpoint); this.pos.y += 0.5; this.vel.set(0, 0, 0); }

  hurt(amount = 1) {
    if (this.hurtT > 0 || this.frozen) return false;
    this.hp -= amount; this.hurtT = 1.4; this.vel.y = 7;
    this.game.audio.sfx('hurt'); this.game.input.vibrate(200); this.game.updateHearts();
    if (this.hp <= 0) this.game.onDeath();
    return true;
  }

  update(dt, level) {
    const input = this.game.input, cam = this.game.camera;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.biteCd > 0) this.biteCd -= dt;
    if (this.bite > 0) this.bite = Math.max(0, this.bite - dt * 4);

    // Bewegung relativ zur Kamera
    let mx = 0, mz = 0;
    if (!this.frozen) {
      const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize();
      const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0));
      const dir = new THREE.Vector3().addScaledVector(f, input.move.y).addScaledVector(r, input.move.x);
      const len = Math.min(1, dir.length());
      if (len > 0.05) {
        dir.normalize(); mx = dir.x * len; mz = dir.z * len;
        const targetYaw = Math.atan2(dir.x, dir.z);
        let d = targetYaw - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
        const step = d * Math.min(1, dt * 14); this.yaw += step; this.turn = step / Math.max(dt, 1e-3);
      }
      if (len <= 0.05) this.turn = 0;
      this.speedFrac = len;
    } else this.speedFrac = 0;
    // Schwimmen: im Wasser treibt Moll an der Oberfläche, paddelt langsamer und kann jederzeit rausspringen.
    // Tauchen (mit Taucherbrille): NASE halten = abtauchen/tiefer, SPRUNG halten = hoch, sonst leichter Auftrieb.
    const wy = level.waterAt ? level.waterAt(this.pos.x, this.pos.z) : null;
    const wet = wy !== null && this.pos.y < wy - 0.45;
    if (!wet) this.diving = false;
    else if (!this.diving && !this.frozen && this.game.has('tauchen') && (input.held('sniff') || (!this.swimming && this.vel.y < -12))) { this.diving = true; this.vel.y = Math.min(this.vel.y, -3); this.game.audio.sfx('splash'); } // Abtauchen oder Kopfsprung
    if (this.diving && this.pos.y > wy - 0.95 && this.vel.y > 0 && !input.held('sniff')) this.diving = false; // wieder oben
    const swim = wet && !this.diving, dive = this.diving;
    if (wet && !this._wet) { FX.splash(this.game.fx, { x: this.pos.x, y: wy, z: this.pos.z }); this.game.audio.sfx('splash'); this.spinT = 0; if (!this._swamOnce) { this._swamOnce = true; this.game.toast('Platsch! Moll schwimmt – zum Rausklettern einfach ans Ufer paddeln'); } }
    this._wet = wet; this.swimming = swim;
    const accel = dive ? 8 : this.onGround || swim ? 40 : 18, top = dive ? RUN * 0.62 : swim ? RUN * 0.55 : RUN;
    this.vel.x += (mx * top - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (mz * top - this.vel.z) * Math.min(1, accel * dt);

    // Springen
    if (this.onGround || swim) { this.coyote = 0.12; this.canDouble = true; } else this.coyote -= dt;
    if (!this.frozen && !dive && input.pressed('jump')) {
      if (this.coyote > 0) { this.vel.y = JUMP; this.coyote = 0; this.onGround = false; this.game.audio.sfx('jump'); FX.dust(this.game.fx, this.pos, 6); this.stretch = 0.2; }
      else if (this.canDouble) { this.vel.y = JUMP2; this.canDouble = false; this.game.audio.sfx('jump2'); this.spinT = 0.5; this.game.fx.burst({ x: this.pos.x, y: this.pos.y + 0.3, z: this.pos.z }, { n: 10, color: [0xffffff, 0xfff3a0], speed: 4, up: -1, life: 0.4, size: 0.18, gravity: 0, flat: true }); }
    }
    if (this.vel.y <= 0) this.autoHop = false;
    if (dive) { // unter Wasser schweben
      const target = this.frozen ? 0.8 : input.held('jump') ? 4.5 : input.held('sniff') ? -4.5 : 0.8;
      this.vel.y += (target - this.vel.y) * Math.min(1, dt * 4);
    } else {
      if (!this.frozen && !this.autoHop && !input.held('jump') && this.vel.y > 4) this.vel.y -= 40 * dt; // kurzer Sprung bei Loslassen
      if (swim && this.vel.y < 4) { this.vel.y += ((wy - 0.8 - this.pos.y) * 40 - this.vel.y * 6) * dt; } // Auftrieb
      else this.vel.y += GRAVITY * dt;
    }
    if (swim && this.speedFrac > 0.1) { this._rip = (this._rip || 0) - dt; if (this._rip <= 0) { this._rip = 0.15; this.game.fx.burst({ x: this.pos.x, y: wy + 0.02, z: this.pos.z }, { n: 3, color: 0xffffff, speed: 1.6, up: 0, life: 0.6, size: 0.14, gravity: 0, flat: true, drag: 3 }); } }
    // Luft: unter Wasser zählt sie runter, an der Oberfläche oder an Luftblasen füllt sie sich wieder
    this.airMax = this.game.has('grosseLunge') ? 25 : 15; if (this.air === undefined) this.air = this.airMax;
    const under = wy !== null && this.pos.y + 0.95 < wy; this.underwater = under;
    if (under) {
      this.air -= dt; if (level.airAt && level.airAt(this.pos)) this.air = Math.min(this.airMax, this.air + dt * 12);
      this._bub = (this._bub || 0) - dt; if (this._bub <= 0) { this._bub = 0.5 + Math.random() * 0.4; this.game.fx.burst({ x: this.pos.x + Math.sin(this.yaw) * 0.9, y: this.pos.y + 0.8, z: this.pos.z + Math.cos(this.yaw) * 0.9 }, { n: 2, color: [0xdff6ff, 0xffffff], speed: 0.3, up: 2.5, life: 1.2, size: 0.12, gravity: 1.5, drag: 1, floor: -1e9 }); }
      if (this.air <= 0) { this.air = 4; this.game.toast('Luft! Schnell nach oben!'); this.hurtT = 0; this.hurt(1); this.vel.y = 6; }
    } else this.air = Math.min(this.airMax, this.air + dt * 10);
    this.game.updateAir(this.air / this.airMax, under || this.air < this.airMax - 0.01);

    // Biss
    if (!this.frozen && input.pressed('act') && this.biteCd <= 0) {
      this.bite = 1; this.biteCd = 0.45; this.game.audio.sfx('chomp'); if (Math.random() < 0.25) this.game.audio.sfx('bark');
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const push = this.diving ? 7 : 4; this.vel.x += fwd.x * push; this.vel.z += fwd.z * push; // unter Wasser: Schwimmstoß
      const at = this.pos.clone().addScaledVector(fwd, 1.2); at.y += 1; FX.bite(this.game.fx, at); at.y -= 1;
      level.onBite(at, 1.6);
    }
    this.sniffing = !this.frozen && input.held('sniff');

    // Kollision: achsenweise
    const solids = level.solids;
    const wasGround = this.onGround; this.onGround = false;
    this.pos.x += this.vel.x * dt; this._resolve(solids, 'x'); this._terrainSide(level, 'x', this.vel.x * dt);
    this.pos.z += this.vel.z * dt; this._resolve(solids, 'z'); this._terrainSide(level, 'z', this.vel.z * dt);
    this.pos.y += this.vel.y * dt; this._resolve(solids, 'y'); this._terrainY(level, wasGround);
    if (this.onGround && !wasGround && this.vel.y <= 0) { this.game.audio.sfx('land'); this.squash = 0.25; FX.dust(this.game.fx, this.pos, Math.min(14, 4 + Math.round(-this._lastVy * 0.6))); }
    this._lastVy = this.vel.y;
    // Laufstaub
    if (this.onGround && !wet && this.speedFrac > 0.7) { this._dustT = (this._dustT || 0) - dt; if (this._dustT <= 0) { this._dustT = 0.12; FX.dust(this.game.fx, this.pos, 1); } }
    if (this.pos.y < (level.killY ?? -25)) { this.hurt(1); this.respawn(); }
    // Am Ufer: schwimmt Moll gegen den Rand, hüpft sie automatisch raus
    if (swim && this.speedFrac > 0.3 && this.vel.y < 4) {
      const fx = this.pos.x + Math.sin(this.yaw) * 0.8, fz = this.pos.z + Math.cos(this.yaw) * 0.8;
      const th = level.heightAt ? level.heightAt(fx, fz) : -Infinity;
      let edge = th > this.pos.y + 0.3 && th <= wy + 0.8;
      for (const s of solids) if (s.active && fx > s.min.x && fx < s.max.x && fz > s.min.z && fz < s.max.z && s.max.y > this.pos.y + 0.3 && s.max.y <= wy + 0.8) { edge = true; break; }
      if (edge) { this.vel.y = 10; this.autoHop = true; this.game.audio.sfx('jump'); FX.splash(this.game.fx, { x: this.pos.x, y: wy, z: this.pos.z }); }
    }

    // Level-Grenzen
    const b = level.bounds;
    this.pos.x = Math.max(b.min.x, Math.min(b.max.x, this.pos.x)); this.pos.z = Math.max(b.min.z, Math.min(b.max.z, this.pos.z));

    // Mesh
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw;
    if (this.spinT > 0) { this.spinT -= dt; this.mesh.rotation.x = -this.spinT * Math.PI * 4; }
    else this.mesh.rotation.x = this.diving ? THREE.MathUtils.clamp(-this.vel.y * 0.12, -0.7, 0.7) : 0; // Kopf voran tauchen
    // Squash beim Landen, Stretch beim Absprung (Volumen bleibt ungefähr gleich)
    if (this.squash > 0) { this.squash -= dt; const s = 1 - this.squash * 0.8; this.mesh.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); }
    else if (this.stretch > 0) { this.stretch -= dt; const s = 1 + this.stretch * 1.2; this.mesh.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); }
    else this.mesh.scale.set(1, 1, 1);
    this.mesh.visible = this.hurtT <= 0 || Math.floor(this.hurtT * 12) % 2 === 0;
    animateDog(this.mesh, this.speedFrac, !this.onGround && !wet, dt, this.bite, this.vel.y, this.turn, wet);
    // Blob-Schatten auf dem höchsten Boden unter Moll
    const gy = level.groundAt ? level.groundAt(this.pos.x, this.pos.z, this.pos.y) : -Infinity;
    this.shadow.visible = gy > -Infinity && !wet;
    if (this.shadow.visible) { const h = this.pos.y - gy, k = Math.max(0.35, 1 - h * 0.08); this.shadow.position.set(this.pos.x, gy + 0.03, this.pos.z); this.shadow.scale.setScalar(k); this.shadow.material.opacity = k; }
  }

  // Gelände seitlich: zu steiler Anstieg wirkt wie eine Wand, sanfte Hänge läuft Moll einfach hoch
  _terrainSide(level, axis, moved) {
    if (!level.terrain || !level.terrain.length || !moved) return;
    const h = level.heightAt(this.pos.x, this.pos.z, this.pos.y);
    if (h - this.pos.y > 0.08 + Math.abs(moved) * 2.4) { this.pos[axis] -= moved; this.vel[axis] = 0; }
  }
  _terrainY(level, wasGround) {
    if (!level.terrain || !level.terrain.length) return;
    const h = level.heightAt(this.pos.x, this.pos.z, this.pos.y); if (h === -Infinity) return;
    if (this.pos.y <= h && this.pos.y > h - 1.5) { this.pos.y = h; if (this.vel.y <= 0) { this.vel.y = 0; this.onGround = true; } }
    else if (!this.onGround && wasGround && this.vel.y <= 0 && this.pos.y - h < 0.45) { this.pos.y = h; this.vel.y = 0; this.onGround = true; } // bergab am Boden bleiben
  }

  _resolve(solids, axis) {
    const p = this.pos;
    for (const s of solids) {
      if (!s.active) continue;
      const mn = s.min, mx = s.max;
      if (p.x + HALF <= mn.x || p.x - HALF >= mx.x || p.z + HALF <= mn.z || p.z - HALF >= mx.z || p.y >= mx.y || p.y + HEIGHT <= mn.y) continue;
      if (axis === 'y') {
        if (this.vel.y <= 0 && p.y - this.vel.y * 0.02 >= mx.y - 0.3) { p.y = mx.y; this.vel.y = 0; this.onGround = true; if (s.onStand) s.onStand(); }
        else if (this.vel.y > 0) { p.y = mn.y - HEIGHT; this.vel.y = 0; }
      } else if (axis === 'x') {
        if (this.vel.x > 0) p.x = mn.x - HALF; else if (this.vel.x < 0) p.x = mx.x + HALF; this.vel.x = 0;
      } else {
        if (this.vel.z > 0) p.z = mn.z - HALF; else if (this.vel.z < 0) p.z = mx.z + HALF; this.vel.z = 0;
      }
    }
  }
}
