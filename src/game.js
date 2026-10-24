// Spielzustand, Kamera, HUD, Levelwechsel, Speicherstand.
import * as THREE from 'three';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { LEVELS, BONES, TOTAL_BONES, WORLD_NAMES } from './levels.js';
import { RunnerLevel } from './runner.js';
import { Particles, makeLightShafts, SEE_THROUGH } from './fx.js';

const SAVE_KEY = 'moll-save-v1';
// Grafik-Stufen: Auflösung, Schatten, Sichtweite (Bereiche dahinter werden ausgeblendet)
const QUALITY = {
  hoch: { name: 'Hoch', ratio: 2, shadows: true, shadowMap: 2048, view: 220, fog: 330, grass: 3500 },
  mittel: { name: 'Mittel', ratio: 1.5, shadows: true, shadowMap: 1024, view: 150, fog: 240, grass: 1600 },
  niedrig: { name: 'Niedrig', ratio: 1, shadows: false, shadowMap: 512, view: 95, fog: 150, grass: 500 },
};
const QUALITY_ORDER = ['hoch', 'mittel', 'niedrig'];

// Strahl gegen Kiste (Slab-Test): Abstand oder Infinity
function rayBox(o, d, s) {
  let t0 = 0, t1 = Infinity;
  for (const a of ['x', 'y', 'z']) {
    if (Math.abs(d[a]) < 1e-6) { if (o[a] < s.min[a] || o[a] > s.max[a]) return Infinity; continue; }
    let ta = (s.min[a] - o[a]) / d[a], tb = (s.max[a] - o[a]) / d[a]; if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return Infinity;
  }
  return t0;
}

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);
    this.input = new Input(); this.audio = new AudioEngine();
    this.fx = new Particles(); this.shakeT = 0; this._shake = new THREE.Vector3();
    this.player = new Player(this);
    this.hud = { levelName: document.getElementById('levelName'), hearts: document.getElementById('hearts'), counter: document.getElementById('counter'), toast: document.getElementById('toast'), boss: document.getElementById('bossbar'), sniff: document.getElementById('sniff') };
    this.camYaw = 0; this.camPitch = 0.35; this.camDist = 9;
    this.paused = true; this.level = null; this.clock = new THREE.Clock();
    this.save = this.loadSave(); this.applyQuality();
    window.addEventListener('resize', () => this.resize()); this.resize();
    document.getElementById('btnStart').addEventListener('click', () => this.start());
    document.getElementById('btnReset').addEventListener('click', () => { localStorage.removeItem(SAVE_KEY); this.save = this.loadSave(); this.toast('Spielstand gelöscht'); });
    document.getElementById('btnQuality').addEventListener('click', () => { const i = QUALITY_ORDER.indexOf(this.save.settings.quality); this.save.settings.quality = QUALITY_ORDER[(i + 1) % 3]; this.persist(); this.applyQuality(); });
    document.getElementById('btnLeave').addEventListener('click', () => { this.enterLevel('hub', true); this.start(); });
    this.enterLevel('hub', true);
    this.loop();
  }

  loadSave() {
    const fresh = () => ({ crumbs: 0, bones: {}, worlds: {}, abilities: {}, settings: {} });
    let s; try { s = Object.assign(fresh(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { s = fresh(); }
    for (const k of ['bones', 'worlds', 'abilities', 'settings']) if (typeof s[k] !== 'object' || !s[k]) s[k] = {};
    if (!QUALITY[s.settings.quality]) s.settings.quality = matchMedia('(pointer: coarse)').matches ? 'mittel' : 'hoch';
    return s;
  }
  has(ability) { return !!this.save.abilities[ability]; }
  unlock(ability, text) {
    if (this.has(ability)) return; this.save.abilities[ability] = true; this.persist();
    this.audio.sfx('big'); this.input.vibrate(300); this.shake(0.3); this.toast(text || `Neue Fähigkeit: ${ability}!`, 6000);
  }
  updateAir(k, show) {
    const el = document.getElementById('air'); if (!el) return;
    el.style.display = show ? 'flex' : 'none'; if (!show) return;
    el.style.setProperty('--p', `${Math.max(0, k) * 100}%`); el.classList.toggle('low', k < 0.3);
  }
  // Unter Wasser: Nebel und Hintergrund blaugrün, Musik dumpf, Lichtstrahlen von oben
  _underwater() {
    const L = this.level, c = this.camera.position; if (!L || L.isRunner) return;
    const wy = L.waterAt(c.x, c.z), under = wy !== null && c.y < wy - 0.05;
    if (under === !!L._uw) { if (under && L._shafts) { L._shafts.position.set(c.x, wy, c.z); L._shafts.userData.update(L.t); } return; }
    L._uw = under; const f = L.scene.fog;
    if (under) {
      L._fogAbove = { color: f.color.clone(), near: f.near, far: f.far, bg: L.scene.background.clone() };
      const col = new THREE.Color(L.def.waterFog ?? 0x1b7fa6); f.color.copy(col); f.near = 0.5; f.far = L.def.waterView ?? 30; L.scene.background = col.clone();
      if (!L._shafts) { L._shafts = makeLightShafts(); L.scene.add(L._shafts); } L._shafts.visible = true; L.sky.mesh.visible = false;
    } else if (L._fogAbove) {
      const a = L._fogAbove; f.color.copy(a.color); f.near = a.near; f.far = a.far; L.scene.background = a.bg; if (L._shafts) L._shafts.visible = false; L.sky.mesh.visible = true;
    }
    this.audio.underwater(under);
  }
  worldState(key) { const w = this.save.worlds; if (!w[key] || typeof w[key] !== 'object') w[key] = {}; w[key].goals ||= []; w[key].crumbs ||= []; w[key].special ||= []; return w[key]; }
  applyQuality() {
    const q = this.q = QUALITY[this.save.settings.quality];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.ratio));
    if (this.renderer.shadowMap.enabled !== q.shadows) { this.renderer.shadowMap.enabled = q.shadows; this.level?.scene?.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); }
    if (this.level?.sun) this._sunQuality(this.level.sun);
    if (this.level?.scene?.fog && this.level.def && !this.level.def.indoor && !this.level.def.fogFar) this.level.scene.fog.far = q.fog;
    const b = document.getElementById('btnQuality'); if (b) b.textContent = `Grafik: ${q.name}`;
    this.resize?.();
  }
  _sunQuality(sun) { sun.castShadow = this.q.shadows; if (sun.shadow.mapSize.x !== this.q.shadowMap) { sun.shadow.mapSize.set(this.q.shadowMap, this.q.shadowMap); sun.shadow.map?.dispose(); sun.shadow.map = null; } }
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
    // Kein Rauswurf mehr: man bleibt in der Welt und sammelt weiter (zurück über Pause → Welt verlassen)
    if (fresh && id === 'boss' && key !== 'hub') this.later(3200, () => this.toast('Sammle ruhig weiter! Zurück in den Garten: Pause → Welt verlassen', 4500));
    if (fresh && key === 'kanal' && id === 'boss') setTimeout(() => this.credits('Die Ratte ist besiegt – Moll schläft wieder ruhig.'), 2600);
    else if (fresh && this.boneCount() === TOTAL_BONES) setTimeout(() => this.credits(`ALLE ${TOTAL_BONES} GOLDKNOCHEN! Moll ist der satteste Labrador der Welt.`), 2600);
  }
  // Abspann: läuft einmal durch, Klick/Taste schließt ihn
  credits(headline) {
    const el = document.getElementById('credits'); if (!el) return;
    const rows = Object.keys(BONES).map(k => { const p = this.levelProgress(k); return `${WORLD_NAMES[k]} · ${p.have}/${p.total}`; }).join('<br>');
    el.querySelector('.roll').innerHTML = `<h2>🐕 MOLL – Der Labrador</h2><p>${headline}</p><p>Goldknochen ${this.boneCount()}/${TOTAL_BONES}</p><p style="opacity:.8">${rows}</p>
      <h3>Mitwirkende</h3><p>Moll · der Labrador<br>Der Staubsauger · Der große Kater · Der Dosenöffner<br>Die Möwe · Die Obertaube · Kneifer die Krabbe<br>Der dicke Mann · Die Kanalratte</p>
      <p>Idee &amp; Spieltests: timo<br>Programmierung: Claude</p><p style="font-size:40px">🦴</p><p>Danke fürs Spielen!</p>`;
    el.classList.remove('hidden'); const roll = el.querySelector('.roll'); roll.style.animation = 'none'; void roll.offsetWidth; roll.style.animation = '';
    this.paused = true; this.audio.sfx('win');
    const close = () => { el.classList.add('hidden'); this.paused = false; window.removeEventListener('keydown', close); el.removeEventListener('pointerdown', close); };
    setTimeout(() => { window.addEventListener('keydown', close); el.addEventListener('pointerdown', close); }, 1500);
  }
  // Kompass: zeigt zum nächsten noch nicht entdeckten Schnellreise-Punkt der Welt
  updateCompass(dt) {
    const el = document.getElementById('compass'); if (!el) return;
    this._compT = (this._compT || 0) - dt; if (this._compT > 0) return; this._compT = 0.25;
    const l = this.level, p = this.player.pos, open = (l && !l.isRunner && l.warps || []).filter(w => !w.on);
    if (!open.length) { el.style.display = 'none'; return; }
    let best = null, bd = Infinity; for (const w of open) { const d = Math.hypot(w.x - p.x, w.z - p.z); if (d < bd) { bd = d; best = w; } }
    const f = new THREE.Vector3(); this.camera.getWorldDirection(f); f.y = 0; f.normalize();
    const tx = (best.x - p.x) / bd, tz = (best.z - p.z) / bd, a = Math.atan2(tx * -f.z + tz * f.x, tx * f.x + tz * f.z);
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']; el.style.display = '';
    el.textContent = `🧭 ${arrows[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]} ${best.name} · ${Math.round(bd)} m`;
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
    document.getElementById('btnLeave').style.display = this.level && this.level.key !== 'hub' ? '' : 'none';
    const rows = Object.keys(BONES).map(k => { const p = this.levelProgress(k); return `<span style="display:inline-block;min-width:46%;text-align:left">${p.have === p.total ? '✅' : '🦴'} ${WORLD_NAMES[k]} <b>${p.have}/${p.total}</b></span>`; }).join(' ');
    const k = this.level && !this.level.isRunner ? this.level.key : null, NAME = { boss: 'Boss', kruemel: 'Alle Krümel', geheim: 'Geheimversteck', kletter: 'Kletterweg' };
    const here = k && BONES[k] ? `<br><span style="font-size:13px">Hier (${WORLD_NAMES[k]}): ${BONES[k].map(id => `${this.hasBone(k, id) ? '✅' : '❔'} ${NAME[id] || id[0].toUpperCase() + id.slice(1)}`).join(' · ')}</span>` : '';
    document.getElementById('menuText').innerHTML = `<b>Pause</b> · Goldknochen ${this.boneCount()}/${TOTAL_BONES} · Krümel ${this.save.crumbs}${here}<br><span style="font-size:13px;line-height:1.7">${rows}</span>`;
    this.audio.stopMusic(); this.audio.stopLoops();
  }

  enterLevel(key, silent = false) {
    this.fx.detach(); this.player.mesh.removeFromParent(); this.player.shadow.removeFromParent(); // Moll wandert mit in die neue Welt: seine Geometrie nicht mit der alten Welt freigeben
    if (this.level && this.level.scene) this.level.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.hideBoss(); this.suspicion(0); this.audio.stopLoops();
    if (key === 'albtraum' || key === 'rattenrennen') { this.level = new RunnerLevel(this, key); }
    else {
      this.level = new Level(this, LEVELS[key], key); this.level.scene.add(this.player.mesh, this.player.shadow); this.player.reset(this.level.spawn);
      this.player.yaw = this.level.spawnYaw ?? Math.PI; this.camYaw = this.player.yaw - Math.PI;
      this._sunQuality(this.level.sun); this.level.restore(); this.snapCam = true;
    }
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
    const icon = { ham: '🍖', bread: '🥖', treat: '🦴', sausage: '🌭', fish: '🐟', cheese: '🧀', fries: '🍟' }[l.goal.kind] || '⭐';
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
    if (p.special) { this.audio.sfx('collect'); this.pop(this.hud.counter); return; }
    this.pop(this.hud.counter);
    if (p.goal) { level.goal.have++; this.audio.sfx('big'); this.input.vibrate(60); level.checkGoal(); }
    else { this.save.crumbs += p.value; this.audio.sfx('collect'); if (p.kind === 'bone') this.toast('Knochen! +5 Krümel'); level.onCrumb(); }
    this.updateCounter();
  }
  // Fortschritt bleibt gespeichert, deshalb geht es nach einem Nickerchen am Welteingang weiter
  onDeath() { const key = this.level.key; this.toast('Moll braucht ein Nickerchen … gleich geht es weiter.', 3000); this.audio.sfx('lose'); this.later(1800, () => this.enterLevel(key, true)); this.player.hp = 3; }

  // ------------------------------------------------------------- Kamera
  updateCamera(dt) {
    const c = this.input.consumeCam(); this.camYaw -= c.x; this.camPitch = Math.max(0.1, Math.min(1.2, this.camPitch + c.y));
    const p = this.player.pos; const target = new THREE.Vector3(p.x, p.y + 1.2, p.z);
    const off = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch)).multiplyScalar(this.camDist);
    // Kamera-Kollision: hohe Kisten, Decken über dem Hund und Hügel zwischen Hund und Kamera verkürzen den Abstand
    const L = this.level, dir = off.clone().normalize(); let hit = this.camDist;
    for (const s of L.solids) if (s.active && (s.cam || s.ceil && s.min.y > target.y)) { const d = rayBox(target, dir, s); if (d < hit) hit = d; }
    if (L.terrain.length) for (let k = 1; k <= 10; k++) { const d = hit * k / 10, x = target.x + dir.x * d, y = target.y + dir.y * d, z = target.z + dir.z * d; if (L.heightAt(x, z, y) > y - 0.3) { hit = Math.max(0, d - hit / 10); break; } }
    const blocked = hit < this.camDist; if (blocked) off.setLength(Math.max(1.5, hit - 0.4));
    const want = target.clone().add(off);
    // Kamera nicht unter den Boden; beim Schwimmen an der Oberfläche bleibt sie über dem Wasser
    want.y = Math.max(want.y, this.player.diving ? -Infinity : L.camFloor ?? 1.2, L.heightAt(want.x, want.z, want.y) + 0.8);
    if (this.player.diving) want.y = Math.max(want.y, L.groundAt(want.x, want.z, want.y + 2) + 0.6);
    else if (this.player.swimming) { const wy = L.waterAt(p.x, p.z); if (wy !== null) want.y = Math.max(want.y, wy + 0.6); }
    this.camera.position.lerp(want, this.snapCam ? 1 : Math.min(1, dt * (blocked ? 20 : 6))); this.snapCam = false; this.camera.lookAt(target);
    SEE_THROUGH.uCutA.value.copy(this.camera.position); SEE_THROUGH.uCutB.value.set(p.x, p.y + 0.7, p.z); SEE_THROUGH.uCutFeet.value = p.y + 0.25; SEE_THROUGH.uCutR.value = 1.5;
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    this.input.update();
    if (this.input.pressed('pause')) { if (this.paused) this.start(); else this.pause(); }
    else if (this.paused && this.input.pressed('jump') && this.level) this.start(); // Gamepad A / Leertaste startet
    if (!this.paused && this.level) {
      if (this.level.isRunner) this.level.update(dt);
      else { this.player.update(dt, this.level); this.level.update(dt); this.updateCamera(dt); this.updateCompass(dt); }
    }
    if (!this.paused) this.fx.update(dt);
    // Kamerawackeln nur für dieses Bild, damit die Kamerafahrt nicht verschoben wird
    if (this.shakeT > 0 && !this.paused) { this.shakeT -= dt; const k = Math.min(1, this.shakeT * 3) * 0.35; this._shake.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k); } else this._shake.set(0, 0, 0);
    if (!this.paused) this._underwater();
    this.camera.position.add(this._shake);
    if (this.level) this.renderer.render(this.level.scene, this.camera);
    this.camera.position.sub(this._shake);
  }
}
