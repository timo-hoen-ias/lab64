// Moll – Spielerfigur: Bewegung, Sprung/Doppelsprung, Biss, Schnüffeln, AABB-Kollision gegen Level-Solids.
import * as THREE from 'three';
import { makeDog, animateDog } from './models.js';

const GRAVITY = -28, RUN = 8.5, JUMP = 11, JUMP2 = 9.5, HALF = 0.42, HEIGHT = 1.15;

export class Player {
  constructor(game) {
    this.game = game;
    this.mesh = makeDog();
    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.onGround = false; this.canDouble = true; this.coyote = 0;
    this.bite = 0; this.biteCd = 0; this.hurtT = 0; this.hp = 3; this.sniffing = false;
    this.hidden = false; this.speedFrac = 0; this.frozen = false;
    this.checkpoint = new THREE.Vector3(0, 1, 0);
  }

  reset(pos) { this.pos.copy(pos); this.checkpoint.copy(pos); this.vel.set(0, 0, 0); this.hp = 3; this.hurtT = 0; this.frozen = false; }
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
        this.yaw += d * Math.min(1, dt * 14);
      }
      this.speedFrac = len;
    } else this.speedFrac = 0;
    const accel = this.onGround ? 40 : 18;
    this.vel.x += (mx * RUN - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (mz * RUN - this.vel.z) * Math.min(1, accel * dt);

    // Springen
    if (this.onGround) { this.coyote = 0.12; this.canDouble = true; } else this.coyote -= dt;
    if (!this.frozen && input.pressed('jump')) {
      if (this.coyote > 0) { this.vel.y = JUMP; this.coyote = 0; this.onGround = false; this.game.audio.sfx('jump'); }
      else if (this.canDouble) { this.vel.y = JUMP2; this.canDouble = false; this.game.audio.sfx('jump2'); this.spinT = 0.5; }
    }
    if (!this.frozen && !input.held('jump') && this.vel.y > 4) this.vel.y -= 40 * dt; // kurzer Sprung bei Loslassen
    this.vel.y += GRAVITY * dt;

    // Biss
    if (!this.frozen && input.pressed('act') && this.biteCd <= 0) {
      this.bite = 1; this.biteCd = 0.45; this.game.audio.sfx('bark');
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      this.vel.x += fwd.x * 4; this.vel.z += fwd.z * 4;
      level.onBite(this.pos.clone().addScaledVector(fwd, 1.2), 1.6);
    }
    this.sniffing = !this.frozen && input.held('sniff');

    // Kollision: achsenweise
    const solids = level.solids;
    const wasGround = this.onGround; this.onGround = false;
    this.pos.x += this.vel.x * dt; this._resolve(solids, 'x');
    this.pos.z += this.vel.z * dt; this._resolve(solids, 'z');
    this.pos.y += this.vel.y * dt; this._resolve(solids, 'y');
    if (this.onGround && !wasGround && this.vel.y <= 0) { this.game.audio.sfx('land'); this.squash = 0.25; }
    if (this.pos.y < -25) { this.hurt(1); this.respawn(); }

    // Level-Grenzen
    const b = level.bounds;
    this.pos.x = Math.max(b.min.x, Math.min(b.max.x, this.pos.x)); this.pos.z = Math.max(b.min.z, Math.min(b.max.z, this.pos.z));

    // Mesh
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw;
    if (this.spinT > 0) { this.spinT -= dt; this.mesh.rotation.x = -this.spinT * Math.PI * 4; } else this.mesh.rotation.x = 0;
    if (this.squash > 0) { this.squash -= dt; const s = 1 - this.squash * 0.8; this.mesh.scale.set(1 / s, s, 1 / s); } else this.mesh.scale.set(1, 1, 1);
    this.mesh.visible = this.hurtT <= 0 || Math.floor(this.hurtT * 12) % 2 === 0;
    animateDog(this.mesh, this.speedFrac, !this.onGround, dt, this.bite);
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
