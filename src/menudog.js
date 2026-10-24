// Moll im Menü: dasselbe 3D-Modell wie im Spiel läuft oben auf dem Schriftzug herum – trabt hin und her, bleibt stehen,
// schaut, wedelt, macht mal Platz oder dreht eine Runde Zoomies. Im Intro steuert intro.js sie (aufs M plumpsen, laufen, aufs Y springen).
// Eigener kleiner Renderer mit durchsichtigem Hintergrund; gezeichnet wird nur, solange das Menü mit Titel offen ist.
// Maßstab und Boden kommen aus dem Titel: Moll ist etwa so hoch wie ein Großbuchstabe und steht auf der Oberkante der Buchstaben.
import * as THREE from 'three';
import { makeDog, animateDog, compact } from './models.js';
import { animateIdle } from './idle.js';
import { characterLook } from './fx.js';

const L = THREE.MathUtils.lerp, G = 22, DIST = 30, RUN = 9;

export class MenuDog {
  constructor(canvas, menu) {
    this.canvas = canvas; this.menu = menu; this.h1 = menu.querySelector('h1');
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfff4dd, 0x8a6b3f, 1.5));
    const sun = new THREE.DirectionalLight(0xfff0d0, 2.4); sun.position.set(3, 6, 5); this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(10, 3, 1, 80);
    this.dog = characterLook(compact(makeDog())); this.scene.add(this.dog);
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.yaw = 0; this.speed = 0; this.idleT = 0; this.wait = 1.5; this.target = null;
    this.script = null; // Intro: { x, until } laufen bis, { face } Blickrichtung
    this.upp = 0.03; this.cx = 0; this.min = -2; this.max = 2; this.w = 0; this.h = 0;
    this.clock = new THREE.Clock(); this._loop();
  }
  // Welt-x der Mitte eines Elements (z. B. eines Buchstabens)
  xOf(el) { const r = el.getBoundingClientRect(); return (r.left + r.width / 2 - this.cx) * this.upp; }
  _layout() {
    const cr = this.canvas.getBoundingClientRect(), w = Math.round(cr.width), h = Math.round(cr.height); if (!w || !h) return false;
    if (w !== this.w || h !== this.h) { this.w = w; this.h = h; this.renderer.setSize(w, h, false); }
    const fs = parseFloat(getComputedStyle(this.h1).fontSize), hr = this.h1.getBoundingClientRect();
    this.upp = 1.75 / (fs * 0.72 * 0.85); // Moll (ca. 1,75 hoch) = 85 % der Versalhöhe
    this.cx = cr.left + w / 2;
    // Boden: Oberkante der Großbuchstaben (bei line-height 1 ca. 0,14 em unter der Zeilenoberkante)
    const floor = hr.top + fs * 0.14, cy = (floor - cr.top - h / 2) * this.upp;
    this.camera.aspect = w / h; this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h * this.upp / 2 / DIST));
    this.camera.position.set(0, cy, DIST); this.camera.lookAt(0, cy, 0); this.camera.updateProjectionMatrix();
    // Laufbereich: über dem Wort, nicht über die Ränder hinaus
    const word = [...this.h1.children].filter(e => e.tagName !== 'SMALL' && !e.classList.contains('gone'));
    if (word.length) {
      const a = word[0].getBoundingClientRect(), b = word[word.length - 1].getBoundingClientRect();
      this.min = (a.left - this.cx) * this.upp + 0.8; this.max = (b.right - this.cx) * this.upp - 0.8;
    }
    return true;
  }
  // ---- Steuerung fürs Intro ----
  hide() { this.dog.visible = false; this.script = { x: this.x }; } // bis zum Auftritt im Intro
  dropTo(x) { this.dog.visible = true; this.script = { x }; this.x = x; this.y = this.h * this.upp; this.vy = 0; this.vx = 0; this.yaw = Math.PI / 2; this.idleT = 0; }
  walkTo(x, sec) { this.script = { x, until: performance.now() + sec * 1000 }; }
  jumpTo(x, sec) { this.script = { x }; this.vy = G * sec / 2; this.vx = (x - this.x) / sec; this.y = Math.max(this.y, 0.001); this.yaw = Math.sign(x - this.x || 1) * Math.PI / 2; }
  face(dir) { this.script = { ...(this.script || {}), face: dir }; } // +1 rechts, -1 links, 0 nach vorn
  free() { this.dog.visible = true; this.script = null; this.wait = 2.5; this.target = null; }
  // ---- Eigenes Herumlaufen im Menü ----
  _think(dt) {
    const s = this.script;
    if (s) {
      if (s.until) { const left = Math.max(0.05, (s.until - performance.now()) / 1000); return { tx: s.x, v: Math.min(RUN * 1.3, Math.abs(s.x - this.x) / left), face: s.face }; }
      return { tx: s.x, v: RUN * 0.5, face: s.face };
    }
    if (this.target === null) {
      this.wait -= dt; if (this.wait > 0) return { tx: this.x, face: 0 };
      // Neues Ziel: meist gemütlich traben, selten Zoomies von einem Ende zum anderen
      const zoom = Math.random() < 0.2; let tx = L(this.min, this.max, Math.random());
      if (zoom) tx = this.x > (this.min + this.max) / 2 ? this.min : this.max;
      else if (Math.abs(tx - this.x) < 1.2) tx = this.x > (this.min + this.max) / 2 ? this.min + 0.3 : this.max - 0.3;
      this.target = { tx, v: RUN * (zoom ? 1.05 : 0.38 + Math.random() * 0.12) };
    }
    if (Math.abs(this.target.tx - this.x) < 0.1) { this.target = null; this.wait = Math.random() < 0.3 ? 9 + Math.random() * 3 : 1.5 + Math.random() * 3; this.idleT = 0; return { tx: this.x, face: 0 }; }
    return this.target;
  }
  _loop() {
    requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this.clock.getDelta()), m = this.menu.classList;
    if (m.contains('hidden') || m.contains('paused') || m.contains('wait') || !this.canvas.offsetParent || !this._layout()) return;
    if (!this.script) { this.x = THREE.MathUtils.clamp(this.x, Math.min(this.min, this.max), Math.max(this.min, this.max)); }
    const air = this.y > 0, { tx, v = RUN * 0.45, face } = this._think(dt), d = tx - this.x;
    let vel = 0;
    if (air) { this.x += this.vx * dt; vel = this.vx; }
    else if (Math.abs(d) > 0.02) { vel = Math.sign(d) * Math.min(v, Math.abs(d) * 4 + 1.5); this.x += THREE.MathUtils.clamp(vel * dt, -Math.abs(d), Math.abs(d)); }
    this.speed = L(this.speed, Math.abs(vel) / RUN, Math.min(1, dt * 10));
    // Blickrichtung: beim Laufen seitlich, im Stand zum Spieler (oder wohin das Intro will)
    const yawT = Math.abs(vel) > 0.3 ? Math.sign(vel) * Math.PI / 2 : face ? face * Math.PI / 2 * 0.8 : 0;
    let dy = yawT - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); const step = dy * Math.min(1, dt * 9); this.yaw += step;
    if (air) { this.vy -= G * dt; this.y += this.vy * dt; if (this.y <= 0) { this.y = 0; this.vy = 0; this.vx = 0; this.landed = performance.now(); } }
    this.idleT = Math.abs(vel) > 0.3 || this.y > 0 ? 0 : this.idleT + dt;
    this.dog.position.set(this.x, this.y, 0); this.dog.rotation.y = this.yaw;
    const sq = Math.max(0, 1 - (performance.now() - (this.landed || 0)) / 180) * 0.25; this.dog.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5); // Landung: kurz zusammengestaucht
    animateDog(this.dog, this.speed, this.y > 0, dt, 0, this.vy, step / Math.max(dt, 1e-3));
    animateIdle(this.dog, this.idleT, dt);
    this.renderer.render(this.scene, this.camera);
  }
}
