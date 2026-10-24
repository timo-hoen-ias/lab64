// Moll – Spielerfigur: Bewegung, Sprung/Doppelsprung, Biss, Schnüffeln, AABB-Kollision gegen Level-Solids.
// Fähigkeiten (sobald gelernt): Trillern, Gleiten, Tornado, Bellen, Bauchklatscher, Apportieren, Zoomies, Wandsprung.
import * as THREE from 'three';
import { makeDog, animateDog, compact, headTrack } from './models.js';
import { animateIdle } from './idle.js';
import { makeBlobShadow, FX, characterLook } from './fx.js';

const GRAVITY = -28, RUN = 8.5, JUMP = 11, JUMP2 = 9.5, HALF = 0.42, HEIGHT = 1.15, STEP = 0.45, SUB = 0.25; // STEP: so hohe Kanten steigt Moll im Laufen einfach hoch

export class Player {
  constructor(game) {
    this.game = game;
    this.mesh = characterLook(compact(makeDog())); this.mesh.rotation.order = 'YXZ'; this.tiltX = 0; this.tiltZ = 0; this.shadow = makeBlobShadow(0.85); this.turn = 0;
    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.onGround = false; this.canDouble = true; this.coyote = 0;
    this.bite = 0; this.biteCd = 0; this.hurtT = 0; this.hp = 3; this.sniffing = false;
    this.hidden = false; this.speedFrac = 0; this.frozen = false; this.idleT = 0;
    this.whirlT = 0; this.tornadoT = 0; this.charge = 0; this.glideFuel = 0; this.spinCd = 0; this.barkCd = 0; this.zoomT = 0; this.carry = null;
    this.checkpoint = new THREE.Vector3(0, 1, 0);
  }

  reset(pos) { this.pos.copy(pos); this.checkpoint.copy(pos); this.vel.set(0, 0, 0); this.hp = this.game.maxHp(); this.carry = null; this.whirlT = 0; this.tornadoT = 0; this.charge = 0; this.gliding = false; this.stomp = false; this.zoomT = 0; this.hurtT = 0; this.frozen = false; this.diving = false; this.air = undefined; this.idleT = 0; }
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
    if (this.spinCd > 0) this.spinCd -= dt; if (this.barkCd > 0) this.barkCd -= dt; if (this.wallLock > 0) this.wallLock -= dt;
    const has = a => this.game.has(a);

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
    if (wet && !this._wet) { FX.splash(this.game.fx, { x: this.pos.x, y: wy, z: this.pos.z }); this.game.audio.sfx('splash'); this.flipT = 0; this.stomp = false; this.gliding = false; if (!this._swamOnce) { this._swamOnce = true; this.game.toast('Platsch! Moll schwimmt – zum Rausklettern einfach ans Ufer paddeln'); } }
    this._wet = wet; this.swimming = swim;
    // Zoomies: nach einem Moment Vollgas am Boden rast Moll los (bleibt im Sprung erhalten)
    if (has('zoomies') && this.onGround && !wet && this.speedFrac > 0.92) this.zoomT = Math.min(1.5, (this.zoomT || 0) + dt);
    else if (this.onGround || wet) this.zoomT = Math.max(0, (this.zoomT || 0) - dt * 4);
    const zoom = this.zoomT > 0.7; if (zoom && !this.zoom) { this.game.audio.sfx('jump2'); FX.dust(this.game.fx, this.pos, 10); } this.zoom = zoom;
    const accel = dive ? 8 : this.onGround || swim ? 40 : this.wallLock > 0 ? 0 : 18, top = dive ? RUN * 0.62 : swim ? RUN * 0.55 : RUN * (zoom ? 1.6 : 1) * (this.whirlT > 0 && this.onGround ? 0.75 : 1) * (this.charge > 0 ? 0.3 : 1);
    this.vel.x += (mx * top - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (mz * top - this.vel.z) * Math.min(1, accel * dt);

    // Springen
    if (this.onGround || swim) { this.coyote = 0.12; this.canDouble = true; } else this.coyote -= dt;
    if (!this.frozen && !dive && input.pressed('jump')) {
      if (this.coyote > 0) { this.vel.y = JUMP * (this.zoom ? 1.08 : 1); this.coyote = 0; this.onGround = false; this.game.audio.sfx('jump'); FX.dust(this.game.fx, this.pos, 6); this.stretch = 0.2; }
      else if (has('wandsprung') && (this._wall = this._wallNear(level))) { // Wandsprung: von der Backsteinwand abstoßen
        const w = this._wall; this.vel.y = JUMP; this.vel.x = w.nx * 8.5; this.vel.z = w.nz * 8.5; this.yaw = Math.atan2(w.nx, w.nz); this.wallLock = 0.35; this.autoHop = true; this.canDouble = true; this.gliding = false;
        this.game.audio.sfx('jump'); FX.dust(this.game.fx, { x: this.pos.x - w.nx * 0.4, y: this.pos.y + 0.6, z: this.pos.z - w.nz * 0.4 }, 8);
      }
      else if (this.canDouble) { this.vel.y = JUMP2; this.canDouble = false; this.game.audio.sfx('jump2'); this.flipT = 0.5; this.game.fx.burst({ x: this.pos.x, y: this.pos.y + 0.3, z: this.pos.z }, { n: 10, color: [0xffffff, 0xfff3a0], speed: 4, up: -1, life: 0.4, size: 0.18, gravity: 0, flat: true }); }
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
    this._abilities(dt, level, input, wet, dive, has);
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
    const airborne = !this.onGround && !wet && this.coyote <= 0;
    if (!this.frozen && input.pressed('act') && this.biteCd <= 0 && airborne && !this.stomp && has('bauchklatscher')) { // Bauchklatscher
      this.stomp = true; this.gliding = false; this.vel.set(0, 6, 0); this.flipT = 0.35; this.game.audio.sfx('jump2');
    }
    else if (!this.frozen && input.pressed('act') && this.biteCd <= 0 && (this.carry || (has('apportieren') && level.fetchNear(this.pos)))) { // Apportieren
      this.biteCd = 0.3; this.bite = 0.6;
      if (this.carry) { const it = this.carry; this.carry = null; level.dropItem(it, { x: this.pos.x + Math.sin(this.yaw) * 1.1, y: this.pos.y, z: this.pos.z + Math.cos(this.yaw) * 1.1 }); this.game.audio.sfx('land'); }
      else { this.carry = level.fetchNear(this.pos); this.carry.carried = true; this.game.audio.sfx('chomp'); }
    }
    else if (!this.frozen && input.pressed('act') && this.biteCd <= 0) {
      this.bite = 1; this.biteCd = 0.45; this.game.audio.sfx('chomp'); if (Math.random() < 0.25) this.game.audio.sfx('bark');
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const push = this.diving ? 7 : 4; this.vel.x += fwd.x * push; this.vel.z += fwd.z * push; // unter Wasser: Schwimmstoß
      const at = this.pos.clone().addScaledVector(fwd, 1.2); at.y += 1; FX.bite(this.game.fx, at); at.y -= 1;
      level.onBite(at, 1.6);
    }
    this.sniffing = !this.frozen && input.held('sniff');

    // Kollision: achsenweise, in Teilschritten von höchstens SUB Metern (sonst rutscht Moll bei Tempo/Ruckeln durch dünne Wände und Platten)
    const solids = level.solids, wasGround = this.onGround;
    const n = Math.min(8, Math.ceil(Math.max(Math.abs(this.vel.x), Math.abs(this.vel.y), Math.abs(this.vel.z)) * dt / SUB) || 1), h = dt / n;
    let ground = wasGround, landed = false;
    for (let i = 0; i < n; i++) {
      this.onGround = false; this._wasGround = ground;
      let d = this.vel.x * h; this.pos.x += d; this._resolve(solids, 'x', d); this._terrainSide(level, 'x', d);
      d = this.vel.z * h; this.pos.z += d; this._resolve(solids, 'z', d); this._terrainSide(level, 'z', d);
      this._dt = h; this.pos.y += (this.vel.y || (ground ? -0.5 : 0)) * h; this._resolve(solids, 'y'); this._terrainY(level, ground); // stehend leicht nach unten tasten
      ground = this.onGround; landed = landed || ground;
    }
    this.onGround = landed;
    if (this.stomp && (this.onGround || wet)) { // Bauchklatscher gelandet
      this.stomp = false; if (!wet) { level.onStomp(this.pos); this.game.audio.sfx('stomp'); this.game.shake(0.35); this.game.input.vibrate(200); this.squash = 0.4; }
    }
    if (this.onGround && !wasGround && this.vel.y <= 0) { this.game.audio.sfx('land'); this.squash = 0.25; FX.dust(this.game.fx, this.pos, Math.min(14, 4 + Math.round(-this._lastVy * 0.6))); if (this._lastVy < -12) FX.land(this.game.fx, this.pos, Math.min(2, -this._lastVy / 14)); }
    this._lastVy = this.vel.y;
    // Laufstaub
    if (this.onGround && !wet && this.speedFrac > 0.7) { this._dustT = (this._dustT || 0) - dt; if (this._dustT <= 0) { this._dustT = 0.12; FX.dust(this.game.fx, this.pos, 1); if (level.grass && Math.random() < 0.35) FX.petals(this.game.fx, this.pos); } }
    if (this.pos.y < (level.killY ?? -25)) { this.hurt(1); this.respawn(); }
    // Pfotenabdrücke (Welten mit def.prints, nur auf Gelände über Wasser): abwechselnd links/rechts
    if (level.def.prints && this.onGround && !wet && level.heightAt(this.pos.x, this.pos.z) >= this.pos.y - 0.05 && (level.seaY === undefined || this.pos.y > level.seaY + 0.1)) {
      this._step = (this._step || 0) + Math.hypot(this.vel.x, this.vel.z) * dt;
      if (this._step > 0.45) { this._step = 0; this._side = -(this._side || 1); const s = this._side * 0.2, c = Math.cos(this.yaw), n = Math.sin(this.yaw); this.game.prints.add(this.pos.x + c * s, this.pos.y, this.pos.z - n * s, this.yaw); }
    }
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

    // Auf Schrägen kippt Moll mit (Pfoten bleiben am Boden): Neigung aus dem Boden vor/hinter und links/rechts von ihr
    let pitch = 0, roll = 0;
    if (this.onGround && !wet && level.terrain && level.terrain.length && Math.abs(level.heightAt(this.pos.x, this.pos.z, this.pos.y + 0.1) - this.pos.y) < 0.05) {
      const sn = Math.sin(this.yaw), cs = Math.cos(this.yaw), r = 0.45;
      const at = (dx, dz) => { const v = level.groundAt(this.pos.x + dx, this.pos.z + dz, this.pos.y + 0.6); return v > -Infinity ? v : this.pos.y; };
      pitch = Math.atan2(at(sn * r, cs * r) - at(-sn * r, -cs * r), 2 * r); roll = Math.atan2(at(cs * r, -sn * r) - at(-cs * r, sn * r), 2 * r);
    }
    const kt = Math.min(1, dt * 12);
    this.tiltX += (THREE.MathUtils.clamp(-pitch, -0.6, 0.6) - this.tiltX) * kt; this.tiltZ += (THREE.MathUtils.clamp(roll, -0.5, 0.5) - this.tiltZ) * kt;
    // Mesh
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw + (this.whirlA || 0);
    if (this.flipT > 0) { this.flipT -= dt; this.mesh.rotation.x = -this.flipT * Math.PI * 4; }
    else this.mesh.rotation.x = this.diving ? THREE.MathUtils.clamp(-this.vel.y * 0.12, -0.7, 0.7) : this.tiltX; // Kopf voran tauchen
    this.mesh.rotation.z = this.tiltZ;
    // Squash beim Landen, Stretch beim Absprung (Volumen bleibt ungefähr gleich)
    if (this.squash > 0) { this.squash -= dt; const s = 1 - this.squash * 0.8; this.mesh.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); }
    else if (this.stretch > 0) { this.stretch -= dt; const s = 1 + this.stretch * 1.2; this.mesh.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); }
    else this.mesh.scale.set(1, 1, 1);
    this.mesh.visible = this.hurtT <= 0 || Math.floor(this.hurtT * 12) % 2 === 0;
    animateDog(this.mesh, Math.hypot(this.vel.x, this.vel.z) / RUN, !this.onGround && !wet, dt, this.bite, this.vel.y, this.turn, wet); // echtes Tempo (Stick-Ausschlag und Beschleunigung) wählt Trab oder Galopp
    const u = this.mesh.userData; if (this.gliding) { u.earL.rotation.set(0, 0, -1.4); u.earR.rotation.set(0, 0, 1.4); u.head.rotation.y = 0; u.earsSpin = (u.earsSpin || 0) + dt * 30; u.head.children.forEach(c => { if (c === u.earL || c === u.earR) c.rotation.y = u.earsSpin; }); } else { u.earL.rotation.y = 0; u.earR.rotation.y = 0; }
    // Leerlauf: nur wenn Moll still am Boden steht und keine Taste gedrückt ist; jede Eingabe weckt sie sofort
    const busy = this.frozen || wet || !this.onGround || this.hurtT > 0 || this.bite > 0 || Math.hypot(this.vel.x, this.vel.z) > 0.5
      || Math.hypot(input.move.x, input.move.y) > 0.05 || ['jump', 'act', 'sniff', 'spin', 'bark'].some(k => input.held(k)) || this.whirlT > 0 || this.charge > 0;
    this.idleT = busy ? 0 : this.idleT + dt;
    animateIdle(this.mesh, this.idleT, dt);
    // Moll schaut nahe NPCs an – nicht beim Schlafen, Rollen, Gleiten oder Wirbeln
    let npc = null, nd = 7;
    for (const n of level.npcs || []) { const d = Math.hypot(n.position.x - this.pos.x, n.position.z - this.pos.z); if (d < nd && n.visible && Math.abs(n.position.y - this.pos.y) < 4) { nd = d; npc = n; } }
    const ip = u.idlePose, awake = ip ? (1 - ip.sleep) * (1 - ip.roll / Math.PI) : 1;
    const tr = headTrack(u, npc ? npc.position.x - this.pos.x : 0, npc ? npc.position.z - this.pos.z : 1, this.mesh.rotation.y, !!npc && !this.gliding && this.whirlT <= 0 && awake > 0.5, dt, 0.9);
    if (!this.gliding) { const k = Math.min(1, Math.abs(tr) * 2) * awake; u.head.rotation.y = u.head.rotation.y * (1 - k) + tr * awake; } // ersetzt das ziellose Umschauen
    // Blob-Schatten auf dem höchsten Boden unter Moll
    const gy = level.groundAt ? level.groundAt(this.pos.x, this.pos.z, this.pos.y) : -Infinity;
    this.shadow.visible = gy > -Infinity && !wet;
    if (this.shadow.visible) { const h = this.pos.y - gy, k = Math.max(0.35, 1 - h * 0.08); this.shadow.position.set(this.pos.x, gy + 0.03, this.pos.z); this.shadow.scale.setScalar(k); this.shadow.material.opacity = k; }
  }

  // ---- Fähigkeiten pro Frame: Trillern, Tornado aufladen, Gleiten, Bellen, Bauchklatscher-Sturz
  _abilities(dt, level, input, wet, dive, has) {
    const fx = this.game.fx, spinP = !this.frozen && input.pressed('spin'), spinH = !this.frozen && input.held('spin');
    if (this.onGround || wet) { this.glideFuel = has('langeOhren') ? 3.5 : 2; this.gliding = false; }
    // Gleiten: in der Luft TRILLER drücken/halten
    if (spinP && !this.onGround && !wet && has('gleiten') && this.glideFuel > 0 && !this.stomp) { this.gliding = true; this.game.audio.sfx('whirl'); }
    if (spinP && has('trillern') && this.spinCd <= 0 && !dive && !this.carry) { // Trillern (in der Luft zusammen mit dem Gleiten)
      this.whirlT = 0.6; this.spinCd = has('trillernPlus') ? 0.6 : 1.2; this.whirlHit = new Set(); this.game.audio.sfx('whirl'); FX.dust(fx, this.pos, 10);
    }
    else if (spinP && !['trillern', 'gleiten', 'tornado'].some(has) && !this._noSpinHint) { this._noSpinHint = true; this.game.toast('Das kann Moll noch nicht – Opa Bruno bringt es ihr bei!'); }
    if (this.gliding && (!spinH || this.glideFuel <= 0 || this.onGround || wet)) this.gliding = false;
    if (this.gliding) {
      const up = level.updraftAt && level.updraftAt(this.pos);
      if (up) { this.vel.y += (7 - this.vel.y) * Math.min(1, dt * 3) - GRAVITY * dt; this.glideFuel = Math.max(this.glideFuel, 0.6); } // Aufwind trägt nach oben
      else if (this.vel.y <= 0) { this.glideFuel -= dt; if (this.vel.y < -2.2) this.vel.y = Math.min(-2.2, this.vel.y + 45 * dt); } // Ausdauer zählt erst beim Sinken
      if (Math.random() < dt * 20) fx.burst({ x: this.pos.x, y: this.pos.y + 1.6, z: this.pos.z }, { n: 1, color: 0xffffff, speed: 2, up: 0, life: 0.3, size: 0.12, gravity: 0, flat: true });
    }
    // Tornado: nach dem Trillern TRILLER gedrückt halten, bis es funkelt, dann loslassen
    if (has('tornado') && this.onGround && !wet && spinH && this.whirlT <= 0.05 && this.tornadoT <= 0) {
      this.charge += dt; if (this.charge >= 0.6 && !this._charged) { this._charged = true; this.game.audio.sfx('click'); }
      if (Math.random() < dt * (this._charged ? 40 : 15)) fx.burst({ x: this.pos.x + (Math.random() - 0.5) * 2, y: this.pos.y + 0.2, z: this.pos.z + (Math.random() - 0.5) * 2 }, { n: 1, color: this._charged ? [0xfff3a0, 0xffffff] : 0xe8dcc8, speed: 1, up: 3, life: 0.5, size: 0.16, gravity: 0 });
    } else if (this.charge > 0) {
      if (this._charged && this.onGround) {
        this.vel.y = 17; this.onGround = false; this.coyote = 0; this.canDouble = true; this.autoHop = true; this.tornadoT = 0.9; this.whirlHit = new Set();
        this.game.audio.sfx('tornado'); this.game.shake(0.3); fx.burst({ x: this.pos.x, y: this.pos.y + 0.2, z: this.pos.z }, { n: 30, color: [0xffffff, 0xdff9fb, 0xe8dcc8], speed: 6, up: 1, life: 0.7, size: 0.3, gravity: 0, flat: true });
      }
      this.charge = 0; this._charged = false;
    }
    // Drehung + Treffer
    const spinning = this.whirlT > 0 || this.tornadoT > 0 || this.charge > 0.05;
    if (this.whirlT > 0) this.whirlT -= dt; if (this.tornadoT > 0) this.tornadoT -= dt;
    if (spinning) {
      this.whirlA = (this.whirlA || 0) + dt * (this.tornadoT > 0 ? 34 : this.charge > 0 ? 14 + this.charge * 20 : 26);
      if (this.whirlT > 0 || this.tornadoT > 0) {
        const strong = this.tornadoT > 0, r = strong ? 4.2 : has('trillernPlus') ? 3.2 : 2.2;
        level.onSpin(this.pos, r, this.whirlHit, strong); level.attract(this.pos, strong ? 7 : 4.5, dt);
        if (Math.random() < dt * 30) { const a = Math.random() * 6.28; fx.burst({ x: this.pos.x + Math.cos(a) * r * 0.6, y: this.pos.y + 0.4 + Math.random(), z: this.pos.z + Math.sin(a) * r * 0.6 }, { n: 1, color: strong ? [0xffffff, 0xdff9fb] : [0xe8dcc8, 0xffffff], speed: 3, up: 1, life: 0.35, size: 0.18, gravity: 0 }); }
      }
    } else this.whirlA = 0;
    // Bellen
    if (!this.frozen && input.pressed('bark')) {
      if (has('bellen') && this.barkCd <= 0) {
        this.barkCd = 0.7; this.bite = 0.7; this.game.audio.sfx('woof'); this.game.input.vibrate(80);
        const fwd = { x: Math.sin(this.yaw), z: Math.cos(this.yaw) };
        for (let k = 1; k <= 3; k++) fx.burst({ x: this.pos.x + fwd.x * k * 1.6, y: this.pos.y + 1.2, z: this.pos.z + fwd.z * k * 1.6 }, { n: 6, color: [0xffffff, 0xffeaa7], speed: 2.5 + k, up: 0.5, life: 0.3, size: 0.2, gravity: 0 });
        level.onBark(this.pos, fwd, 11);
      } else if (!has('bellen') && !this._noBarkHint) { this._noBarkHint = true; this.game.toast('Moll räuspert sich … richtig bellen lernt sie noch!'); }
    }
    // Bauchklatscher: kurz in der Luft stehen, dann senkrecht runter
    if (this.stomp) { this.vel.x = 0; this.vel.z = 0; if (this.vel.y > 0) this.vel.y -= 60 * dt; else this.vel.y = -30; }
    // Wandrutschen: an einer Backsteinwand fällt Moll langsamer (Zeichen: hier geht der Wandsprung)
    if (has('wandsprung') && !this.onGround && !wet && this.vel.y < -3 && !this.stomp && this._wallNear(level)) { this.vel.y = Math.max(this.vel.y, -3.5); if (Math.random() < dt * 15) FX.dust(this.game.fx, { x: this.pos.x, y: this.pos.y + 0.5, z: this.pos.z }, 1); }
  }
  // Backsteinwand direkt neben Moll? Liefert die Richtung von der Wand weg.
  _wallNear(level) {
    const p = this.pos, g = 0.3;
    for (const s of level.solids) {
      if (!s.climb || !s.active || p.y + HEIGHT < s.min.y + 0.2 || p.y > s.max.y - 0.3) continue;
      const inX = p.x + HALF > s.min.x && p.x - HALF < s.max.x, inZ = p.z + HALF > s.min.z && p.z - HALF < s.max.z;
      if (inZ && p.x + HALF <= s.min.x + 0.01 && s.min.x - (p.x + HALF) < g) return { nx: -1, nz: 0 };
      if (inZ && p.x - HALF >= s.max.x - 0.01 && p.x - HALF - s.max.x < g) return { nx: 1, nz: 0 };
      if (inX && p.z + HALF <= s.min.z + 0.01 && s.min.z - (p.z + HALF) < g) return { nx: 0, nz: -1 };
      if (inX && p.z - HALF >= s.max.z - 0.01 && p.z - HALF - s.max.z < g) return { nx: 0, nz: 1 };
    }
    return null;
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

  // Auf Höhe y steigen, wenn dort oben kein anderer Körper im Weg ist
  _stepUp(solids, y) {
    const p = this.pos;
    for (const s of solids) if (s.active && p.x + HALF > s.min.x && p.x - HALF < s.max.x && p.z + HALF > s.min.z && p.z - HALF < s.max.z && y < s.max.y - 0.01 && y + HEIGHT > s.min.y) return false;
    p.y = y; return true;
  }

  _resolve(solids, axis, moved = 0) {
    const p = this.pos;
    for (const s of solids) {
      if (!s.active) continue;
      const mn = s.min, mx = s.max;
      if (p.x + HALF <= mn.x || p.x - HALF >= mx.x || p.z + HALF <= mn.z || p.z - HALF >= mx.z || p.y >= mx.y || p.y + HEIGHT <= mn.y) continue;
      if (axis === 'y') {
        if (this.vel.y <= 0 && p.y - this.vel.y * Math.max(0.02, this._dt || 0) >= mx.y - 0.3) { p.y = mx.y; this.vel.y = 0; this.onGround = true; if (s.onStand) s.onStand(); }
        else if (this.vel.y > 0) { p.y = mn.y - HEIGHT; this.vel.y = 0; }
      } else if (this._wasGround && mx.y - p.y <= STEP && this._stepUp(solids, mx.y)) {
        continue; // kleine Kante (z.B. Rampenende an einer Plattform): hochsteigen statt anhalten
      } else {
        // Zurück auf die Seite, von der Moll kam; steckte sie schon vorher drin (Nische, geschoben), auf kürzestem Weg raus
        const prev = p[axis] - moved;
        if (prev + HALF <= mn[axis] + 0.01) p[axis] = mn[axis] - HALF;
        else if (prev - HALF >= mx[axis] - 0.01) p[axis] = mx[axis] + HALF;
        else { this._pushOut(s); continue; }
        this.vel[axis] = 0;
      }
    }
  }
  _pushOut(s) {
    const p = this.pos, o = [[v => p.x = v, s.min.x - HALF, p.x + HALF - s.min.x, 'x'], [v => p.x = v, s.max.x + HALF, s.max.x - p.x + HALF, 'x'],
      [v => p.z = v, s.min.z - HALF, p.z + HALF - s.min.z, 'z'], [v => p.z = v, s.max.z + HALF, s.max.z - p.z + HALF, 'z']];
    const best = o.reduce((a, b) => b[2] < a[2] ? b : a); best[0](best[1]); this.vel[best[3]] = 0;
  }
}
