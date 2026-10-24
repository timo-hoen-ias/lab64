// Albtraum: Emmentaler-Höhlen – Endlos-Runner-Rennen gegen die Ratte (Subway-Surfers-Steuerung).
// Moll läuft auf den linken 3 Spuren, die Ratte auf den rechten 3. Käse sammeln, Hindernissen ausweichen, vor der Ratte am Ziel sein.
import * as THREE from 'three';
import { makeDog, animateDog, makeRat, makeFood, compact, box, cyl, sphere } from './models.js';
import { makeSky, FX, characterLook } from './fx.js';

const LANE_W = 2.2, SPEED = 18, LENGTH = 700, SEG = 40;

export class RunnerLevel {
  constructor(game, mode = 'albtraum') {
    this.game = game; this.isRunner = true; this.mode = mode;
    const dream = mode === 'albtraum';
    this.th = dream
      ? { sky: 0x3a2b12, floor: 0xffd94a, wall: 0xe0b526, hole: 0x3a2b12, low: 0x7d5a2e, tall: 0x6f6f72, item: 'cheese', ceil: true }
      : { sky: 0x9fdcff, floor: 0x6d6d6d, wall: 0xe17055, hole: 0x2d3436, low: 0x2d3436, tall: 0x0984e3, item: 'sausage', ceil: false };
    this.scene = new THREE.Scene(); this.sky = makeSky(this.th.sky, dream); this.scene.add(this.sky.mesh); this.scene.background = this.sky.horizon.clone(); this.scene.fog = new THREE.Fog(this.sky.horizon, 25, 80);
    this.scene.add(new THREE.HemisphereLight(dream ? 0xfff0b0 : 0xffffff, 0x5a4010, 0.9));
    const sun = new THREE.DirectionalLight(0xffe08a, 1); sun.position.set(5, 20, -10); this.scene.add(sun);
    this.def = dream
      ? { name: 'Albtraum: Emmentaler-Höhlen', music: { scale: 'spooky', root: 262, bpm: 150, seed: 99, style: 'nightmare' } }
      : { name: 'Rattenrennen: Hinterhofgasse', music: { scale: 'mixo', root: 294, bpm: 160, seed: 31, style: 'chase' } };
    this.ratLead = 0; this.ratY = 0; this.ratVy = 0;
    this.pickups = []; this.solids = []; this.bounds = { min: { x: -1e9, z: -1e9 }, max: { x: 1e9, z: 1e9 } };
    this.dog = characterLook(compact(makeDog())); this.scene.add(this.dog);
    this.rat = makeRat(1.3); this.scene.add(this.rat);
    this.lane = 1; this.ratLane = 1; this.z = 0; this.y = 0; this.vy = 0; this.score = 0; this.ratScore = 0; this.t = 0; this.done = false; this.hurtT = 0;
    this.obstacles = []; this.items = []; this.segments = [];
    this.camPos = new THREE.Vector3();
    this.build();
  }

  // Spur 0 = links im Bild. Kamera blickt Richtung +z, daher ist +x links.
  laneX(side, lane) { return (side === 'dog' ? 1 : -1) * (LANE_W * 2) - (lane - 1) * LANE_W; }

  build() {
    // Käsetunnel: Boden, Wände mit Löchern, Decke
    const cheese = this.th.floor, dark = this.th.wall, dream = this.mode === 'albtraum';
    for (let z = 0; z < LENGTH + 80; z += SEG) {
      const floor = box(16, 1, SEG, cheese, 0, -0.5, z + SEG / 2); this.scene.add(floor);
      const divider = box(0.4, 0.6, SEG, dark, 0, 0.3, z + SEG / 2); this.scene.add(divider);
      const wl = box(1, 12, SEG, dark, -8.5, 5, z + SEG / 2), wr = box(1, 12, SEG, dark, 8.5, 5, z + SEG / 2); this.scene.add(wl, wr);
      if (this.th.ceil) { const ceil = box(18, 1, SEG, cheese, 0, 10.5, z + SEG / 2); this.scene.add(ceil); }
      else for (let k = 0; k < 4; k++) { const w = box(1.2, 1.4, 0.2, 0xfff3b0, k % 2 ? 8 : -8, 3 + (k > 1 ? 4 : 0), z + 10 + k * 5); this.scene.add(w); } // Fenster
      if (dream) for (let i = 0; i < 6; i++) { // Löcher
        const h = sphere(1 + Math.random() * 1.6, this.th.hole, (Math.random() < 0.5 ? -8.2 : 8.2), 2 + Math.random() * 7, z + Math.random() * SEG, 7); this.scene.add(h);
      }
    }
    // Hindernisse & Käse-Items, gespiegelt für beide Seiten
    for (let z = 40; z < LENGTH - 40; z += 9 + Math.random() * 6) {
      const lane = Math.floor(Math.random() * 3);
      if (Math.random() < 0.6) {
        const kind = Math.random() < 0.5 ? 'low' : 'wall';
        for (const side of ['dog', 'rat']) {
          let m;
          if (kind === 'low') m = box(1.8, 1.0, 1.0, this.th.low, this.laneX(side, lane), 0.5, z); // Käsekiste – drüberspringen
          else m = cyl(0.9, 0.9, 3.5, this.th.tall, this.laneX(side, lane), 1.75, z, 8); // Rattenfalle-Säule – Spur wechseln
          this.scene.add(m); this.obstacles.push({ side, lane, z, kind, mesh: m });
        }
      }
      const l2 = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      for (const side of ['dog', 'rat']) {
        const m = makeFood(this.th.item); m.position.set(this.laneX(side, l2), 0.6, z + 4); this.scene.add(m); this.items.push({ side, lane: l2, z: z + 4, mesh: m, taken: false });
      }
    }
    // Ziel
    const goal = box(16, 6, 1, 0xff6b8a, 0, 3, LENGTH); this.scene.add(goal);
    this.goalLabel = LENGTH;
    const intro = () => this.game.toast(this.mode === 'albtraum' ? 'ALBTRAUM! Ein Käselabyrinth … Spur wechseln: Wischen/Stick, Springen: hoch/Sprung. Schlag die Ratte!' : 'RATTENRENNEN! Links du, rechts die Ratte. Mehr Würstchen als sie = Sieg!', 4500);
    this.game.talk('runner.' + this.mode, { onDone: intro });
  }

  update(dt) {
    if (this.done) return;
    this.t += dt;
    const input = this.game.input;
    const sw = input.swipe();
    if (sw === 'left') this.lane = Math.max(0, this.lane - 1);
    if (sw === 'right') this.lane = Math.min(2, this.lane + 1);
    if ((sw === 'up' || input.pressed('jump')) && this.y <= 0.01) { this.vy = 12; this.game.audio.sfx('jump'); FX.dust(this.game.fx, this.dog.position, 6); }
    this.vy -= 32 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0) { if (this.vy < -3) FX.dust(this.game.fx, this.dog.position, 8); this.vy = 0; }
    const speed = SPEED + this.t * 0.4;
    this.z += speed * dt;
    if (this.hurtT > 0) this.hurtT -= dt;

    // Ratte-KI: wechselt Spur, wenn Hindernis voraus; springt über niedrige; sammelt mit 85 %
    const ratZ = this.z + this.ratLead;
    const icon = this.th.item === 'cheese' ? '🧀' : '🌭';
    for (const o of this.obstacles) if (o.side === 'rat' && o.lane === this.ratLane && o.z - ratZ < 7 && o.z - ratZ > 0 && !o.ratHandled) {
      o.ratHandled = true; if (o.kind === 'low') this.ratVy = 11; else this.ratLane = (this.ratLane + (Math.random() < 0.5 ? 1 : 2)) % 3;
    }
    for (const it of this.items) if (it.side === 'rat' && !it.taken && it.z - ratZ < 10 && it.z - ratZ > 0 && !it.ratSeen) { it.ratSeen = true; if (Math.random() < 0.85) this.ratLane = it.lane; }
    this.ratVy = (this.ratVy || 0) - 32 * dt; this.ratY = Math.max(0, (this.ratY || 0) + this.ratVy * dt); if (this.ratY === 0) this.ratVy = 0;
    // Ratte liegt etwas vorn/hinten je nach Punkten
    this.ratLead = (this.ratLead || 0) + ((this.ratScore - this.score) * 0.8 - this.ratLead) * dt;

    // Kollisionen Moll
    const dx = this.laneX('dog', this.lane);
    for (const o of this.obstacles) if (o.side === 'dog' && o.lane === this.lane && Math.abs(o.z - this.z) < 1.2 && !o.hit) {
      if (o.kind === 'low' && this.y > 0.9) continue;
      o.hit = true; this.hurtT = 0.8; FX.hit(this.game.fx, { x: dx, y: 1, z: this.z + 0.8 }); this.game.shake(0.3); this.z -= 3; this.score = Math.max(0, this.score - 1); this.game.audio.sfx('hurt'); input.vibrate(200);
    }
    for (const it of this.items) {
      if (it.taken) continue;
      it.mesh.rotation.y += dt * 3;
      if (it.side === 'dog' && it.lane === this.lane && Math.abs(it.z - this.z) < 1.3 && this.y < 1.2) { it.taken = true; it.mesh.visible = false; this.score++; this.game.audio.sfx('collect'); FX.crumb(this.game.fx, it.mesh.position); this.game.pop(this.game.hud.counter); }
      if (it.side === 'rat' && it.lane === this.ratLane && Math.abs(it.z - ratZ) < 1.3) { it.taken = true; it.mesh.visible = false; this.ratScore++; }
    }
    // Figuren
    this.dog.position.x += (dx - this.dog.position.x) * Math.min(1, dt * 12); this.dog.position.y = this.y; this.dog.position.z = this.z;
    this.dog.rotation.z = (dx - this.dog.position.x) * 0.15; this.dog.visible = this.hurtT <= 0 || Math.floor(this.hurtT * 12) % 2 === 0;
    animateDog(this.dog, 1, this.y > 0.05, dt);
    const rx = this.laneX('rat', this.ratLane); this.rat.position.x += (rx - this.rat.position.x) * Math.min(1, dt * 10); this.rat.position.y = this.ratY; this.rat.position.z = ratZ;
    const u = this.rat.userData; u.t += dt * 14; u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.t + i) * 0.7);
    // Kamera
    const cam = this.game.camera; this.sky.mesh.position.copy(cam.position); this.camPos.set(0, 5.5, this.z - 9); cam.position.lerp(this.camPos, Math.min(1, dt * 8)); cam.lookAt(0, 2, this.z + 8);
    this.game.hud.counter.textContent = `${icon} Moll ${this.score} : Ratte ${this.ratScore}   ${Math.max(0, Math.floor(LENGTH - this.z))} m`;

    if (this.z >= LENGTH) {
      this.done = true;
      const dream = this.mode === 'albtraum';
      if (this.score > this.ratScore) {
        this.game.audio.sfx('win');
        this.game.toast(dream ? 'Moll gewinnt! Du wachst auf … mit Käsegeschmack im Maul.' : 'Moll ist schneller als die Ratte! Goldknochen!', 3500);
        this.game.later(1200, () => {
          if (dream) this.game.awardBone('kanal', 'boss', false);
          else { this.game.awardBone('rattenrennen', 'sieg', false); if (this.score >= 30) this.game.later(1200, () => this.game.awardBone('rattenrennen', 'gierig', false)); else this.game.toast('Tipp: Mit 30+ Würstchen gibt es einen zweiten Goldknochen.', 3000); }
        });
        this.game.later(4200, () => { this.game.enterLevel(dream ? 'kanal' : 'hub'); if (!dream && !this.game.has('zoomies')) setTimeout(() => this.game.learn('zoomies', true), 1500); }); // nach dem Albtraum zurück in den Kanal (Ein-Besuch-Regel); Opa Bruno ist stolz: Zoomies
      } else { this.game.audio.sfx('lose'); this.game.toast(dream ? 'Die Ratte lacht. Der Traum beginnt von vorn …' : 'Die Ratte war gieriger. Nochmal!'); this.game.later(2500, () => this.game.enterLevel(this.mode)); }
    }
  }
  onBite() { }
}
