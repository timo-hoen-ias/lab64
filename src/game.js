// Spielzustand, Kamera, HUD, Levelwechsel, Speicherstand.
import * as THREE from 'three';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { LEVELS, BONES, TOTAL_BONES, WORLD_NAMES } from './levels.js';
import { RunnerLevel } from './runner.js';
import { Particles } from './fx.js';

const SAVE_KEY = 'moll-save-v1';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
    this.input = new Input(); this.audio = new AudioEngine();
    this.fx = new Particles(); this.shakeT = 0; this._shake = new THREE.Vector3();
    this.player = new Player(this);
    this.hud = { levelName: document.getElementById('levelName'), hearts: document.getElementById('hearts'), counter: document.getElementById('counter'), toast: document.getElementById('toast'), boss: document.getElementById('bossbar'), sniff: document.getElementById('sniff') };
    this.camYaw = 0; this.camPitch = 0.35; this.camDist = 9;
    this.paused = true; this.level = null; this.clock = new THREE.Clock();
    this.save = this.loadSave();
    window.addEventListener('resize', () => this.resize()); this.resize();
    document.getElementById('btnStart').addEventListener('click', () => this.start());
    document.getElementById('btnReset').addEventListener('click', () => { localStorage.removeItem(SAVE_KEY); this.save = this.loadSave(); this.toast('Spielstand gelöscht'); });
    this.enterLevel('hub', true);
    this.loop();
  }

  loadSave() { try { const s = Object.assign({ crumbs: 0, bones: {} }, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); if (typeof s.bones !== 'object' || !s.bones) s.bones = {}; return s; } catch (e) { return { crumbs: 0, bones: {} }; } }
  // Verzögerte Aktion, die verfällt, sobald das Level gewechselt wurde.
  later(ms, fn) { const lvl = this.level; setTimeout(() => { if (this.level === lvl) fn(); }, ms); }
  boneCount() { return Object.keys(this.save.bones).length; }
  hasBone(level, id) { return !!this.save.bones[`${level}:${id}`]; }
  levelProgress(level) { const ids = BONES[level] || []; return { have: ids.filter(id => this.hasBone(level, id)).length, total: ids.length }; }
  awardBone(level, id, exit) {
    const key = typeof level === 'string' ? level : level.key, fresh = !this.hasBone(key, id);
    if (fresh) { this.save.bones[`${key}:${id}`] = true; this.persist(); }
    this.audio.sfx('win'); this.input.vibrate(250); this.updateCounter();
    this.toast(fresh ? `GOLDKNOCHEN! ${this.boneCount()}/${TOTAL_BONES}` : 'Den hattest du schon.', 3000);
    if (exit) { this.player.frozen = true; this.later(2500, () => { this.player.frozen = false; this.enterLevel('hub'); }); }
  }
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { } }

  resize() {
    const w = window.innerWidth, h = window.innerHeight; this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    const portrait = h > w; this.camera.fov = portrait ? 80 : 60; this.camDist = portrait ? 14 : 9; this.camPitch = portrait ? 0.5 : 0.35; // Hochformat: mehr Überblick
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.audio.init(); this.audio.resume();
    document.getElementById('menu').classList.add('hidden'); this.paused = false;
    if (this.level) this.audio.playTheme(this.level.def.music);
  }
  pause() {
    this.paused = true; const m = document.getElementById('menu'); m.classList.remove('hidden');
    document.getElementById('btnStart').textContent = 'Weiter';
    const rows = Object.keys(BONES).map(k => { const p = this.levelProgress(k); return `<span style="display:inline-block;min-width:46%;text-align:left">${p.have === p.total ? '✅' : '🦴'} ${WORLD_NAMES[k]} <b>${p.have}/${p.total}</b></span>`; }).join(' ');
    document.getElementById('menuText').innerHTML = `<b>Pause</b> · Goldknochen ${this.boneCount()}/${TOTAL_BONES} · Krümel ${this.save.crumbs}<br><span style="font-size:13px;line-height:1.7">${rows}</span>`;
    this.audio.stopMusic(); this.audio.stopLoops();
  }

  enterLevel(key, silent = false) {
    this.fx.detach(); if (this.player.shadow.parent) this.player.shadow.parent.remove(this.player.shadow);
    if (this.level && this.level.scene) this.level.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.hideBoss(); this.suspicion(0); this.audio.stopLoops();
    if (key === 'albtraum' || key === 'rattenrennen') { this.level = new RunnerLevel(this, key); }
    else { this.level = new Level(this, LEVELS[key], key); this.level.scene.add(this.player.mesh, this.player.shadow); this.player.reset(this.level.spawn); this.player.yaw = Math.PI; this.camYaw = 0; }
    this.fx.attach(this.level.scene); this.fade();
    this.level.key = key;
    this.hud.levelName.textContent = this.level.def.name;
    this.updateHearts(); this.updateCounter();
    if (!silent) { this.audio.sfx('portal'); this.audio.playTheme(this.level.def.music); }
    if (!this.level.isRunner) { const intro = this.level.intro; if (key !== 'hub') this.toast(this.level.def.name + (intro ? ' – ' + intro : ''), 4500); else if (intro) this.toast(intro, 3500); }
  }

  // ------------------------------------------------------------- HUD
  updateHearts() { if (this._hp !== undefined && this.player.hp < this._hp) { this.pop(this.hud.hearts); this.shake(0.3); } this._hp = this.player.hp; this.hud.hearts.innerHTML = '<span>♥</span>'.repeat(Math.max(0, this.player.hp)) + '<span style="opacity:.25">♥</span>'.repeat(Math.max(0, 3 - this.player.hp)); }
  updateCounter() {
    const l = this.level; if (!l || l.isRunner) return;
    const icon = { ham: '🍖', bread: '🥖', treat: '🦴', sausage: '🌭', fish: '🐟', cheese: '🧀' }[l.goal.kind] || '⭐';
    this.hud.counter.textContent = l.goal.need ? `${icon} ${l.goal.have}/${l.goal.need}   ✦ ${l.crumbHave}/${l.crumbTotal}   🦴 ${this.boneCount()}` : `🦴 ${this.boneCount()}/${TOTAL_BONES}   ✦ ${l.crumbHave}/${l.crumbTotal}`;
  }
  pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  fade() { const f = document.getElementById('fade'); if (!f) return; f.classList.remove('out'); void f.offsetWidth; f.classList.add('out'); }
  shake(t = 0.3) { this.shakeT = Math.max(this.shakeT, t); }
  toast(text, ms = 2600) { const t = this.hud.toast; t.textContent = text; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), ms); }
  hint(text) { if (text && this._hint !== text) { this.toast(text, 1200); } this._hint = text; }
  showBoss(b) { this.hud.boss.style.display = 'block'; this.hud.boss.querySelector('.name').textContent = b.name; }
  updateBossBar(b) { this.hud.boss.querySelector('.fill').style.width = `${Math.max(0, b.hp / b.maxHp * 100)}%`; }
  hideBoss() { this.hud.boss.style.display = 'none'; }
  sniffHint(p, d) {
    const s = this.hud.sniff; if (!p) { s.style.display = 'none'; return; }
    s.style.display = 'block'; const k = Math.max(0, 1 - d / 25); s.style.transform = `translate(-50%,-50%) scale(${0.6 + k * 1.2})`; s.textContent = d < 6 ? '👃‼️' : d < 14 ? '👃❗' : '👃';
    if (d < 6 && !this._sniffS) { this.audio.sfx('sniff'); this._sniffS = true; } else if (d >= 6) this._sniffS = false;
  }
  suspicion(v) {
    let el = this._sus; if (!el) { el = this._sus = document.createElement('div'); el.style.cssText = 'position:absolute;left:50%;top:38%;transform:translateX(-50%);font-size:64px;display:none;filter:drop-shadow(0 3px 0 #3b2412)'; document.getElementById('hud').appendChild(el); }
    if (v <= 0.02) { el.style.display = 'none'; return; } el.style.display = 'block'; el.textContent = v > 0.66 ? '‼️' : v > 0.33 ? '❗' : '👀'; el.style.opacity = 0.4 + v * 0.6;
  }

  // ---------------------------------------------------------- Ereignisse
  collect(p, level) {
    if (p.kind === 'goldbone') { this.audio.sfx('win'); return; }
    this.pop(this.hud.counter);
    if (p.goal) { level.goal.have++; this.audio.sfx('big'); this.input.vibrate(60); level.checkGoal(); }
    else { this.save.crumbs += p.value; this.audio.sfx('collect'); if (p.kind === 'bone') this.toast('Knochen! +5 Krümel'); level.onCrumb(); }
    this.updateCounter();
  }
  onDeath() { this.toast('Moll braucht ein Nickerchen … zurück zum Garten.', 3000); this.audio.sfx('lose'); this.later(1800, () => this.enterLevel('hub')); this.player.hp = 3; }

  // ------------------------------------------------------------- Kamera
  updateCamera(dt) {
    const c = this.input.consumeCam(); this.camYaw -= c.x; this.camPitch = Math.max(0.1, Math.min(1.2, this.camPitch + c.y));
    const p = this.player.pos; const target = new THREE.Vector3(p.x, p.y + 1.2, p.z);
    const off = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch)).multiplyScalar(this.camDist);
    // Kamera-Kollision: Wände zwischen Hund und Kamera verkürzen den Abstand
    if (!this.level._camMeshes) this.level._camMeshes = this.level.solids.filter(s => s.mesh && s.max.y - s.min.y > 2.2).map(s => s.mesh);
    this._ray = this._ray || new THREE.Raycaster();
    this._ray.set(target, off.clone().normalize()); this._ray.far = this.camDist;
    const hit = this._ray.intersectObjects(this.level._camMeshes, false)[0];
    if (hit) off.setLength(Math.max(1.5, hit.distance - 0.4));
    const want = target.clone().add(off);
    // Kamera nicht unter den Boden / in Blöcke
    want.y = Math.max(want.y, 1.2);
    this.camera.position.lerp(want, Math.min(1, dt * (hit ? 20 : 6))); this.camera.lookAt(target);
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    this.input.update();
    if (this.input.pressed('pause')) { if (this.paused) this.start(); else this.pause(); }
    else if (this.paused && this.input.pressed('jump') && this.level) this.start(); // Gamepad A / Leertaste startet
    if (!this.paused && this.level) {
      if (this.level.isRunner) this.level.update(dt);
      else { this.player.update(dt, this.level); this.level.update(dt); this.updateCamera(dt); }
    }
    if (!this.paused) this.fx.update(dt);
    // Kamerawackeln nur für dieses Bild, damit die Kamerafahrt nicht verschoben wird
    if (this.shakeT > 0 && !this.paused) { this.shakeT -= dt; const k = Math.min(1, this.shakeT * 3) * 0.35; this._shake.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k); } else this._shake.set(0, 0, 0);
    this.camera.position.add(this._shake);
    if (this.level) this.renderer.render(this.level.scene, this.camera);
    this.camera.position.sub(this._shake);
  }
}
