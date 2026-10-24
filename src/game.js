// Spielzustand, Kamera, HUD, Levelwechsel, Speicherstand.
import * as THREE from 'three';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { LEVELS, BONES, TOTAL_BONES, WORLD_NAMES, BACKTRACK } from './levels.js';
import { RunnerLevel } from './runner.js';
import { Particles, Rings, Prints, makeLightShafts, setOutlines, SEE_THROUGH } from './fx.js';
import { Menu } from './menu.js';
import { Intro } from './intro.js';
import { Post } from './post.js';
import { MenuDog } from './menudog.js';
import { ABILITIES, UPGRADES } from './abilities.js';
import { Dialog } from './dialog.js';
import { ICON, GOAL_ICON, Counters } from './hud.js';
import { pauseHTML } from './progress.js';

const SAVE_KEY = 'moll-save-v1';
// Grafik-Stufen: Auflösung, Schatten, Sichtweite (Bereiche dahinter werden ausgeblendet)
const QUALITY = {
  hoch: { name: 'Hoch', ratio: 2, shadows: true, shadowMap: 2048, view: 220, fog: 330, grass: 3500, outlines: true, ambient: 1, post: true },
  mittel: { name: 'Mittel', ratio: 1.5, shadows: true, shadowMap: 1024, view: 150, fog: 240, grass: 1600, outlines: true, ambient: 0.6 },
  niedrig: { name: 'Niedrig', ratio: 1, shadows: false, shadowMap: 512, view: 95, fog: 150, grass: 500, outlines: false, ambient: 0.3 },
};

// Strahl gegen Kiste (Slab-Test): Abstand oder Infinity. r > 0 vergrößert die Kiste rundum (dicker Strahl);
// steht der Startpunkt schon in diesem Rand, wird r auf den Abstand zur Kiste verkleinert.
function rayBox(o, d, s, r = 0) {
  if (r > 0) { const dx = Math.max(s.min.x - o.x, 0, o.x - s.max.x), dy = Math.max(s.min.y - o.y, 0, o.y - s.max.y), dz = Math.max(s.min.z - o.z, 0, o.z - s.max.z); r = Math.max(0, Math.min(r, Math.hypot(dx, dy, dz) - 0.05)); }
  let t0 = 0, t1 = Infinity;
  for (const a of ['x', 'y', 'z']) {
    const lo = s.min[a] - r, hi = s.max[a] + r;
    if (Math.abs(d[a]) < 1e-6) { if (o[a] < lo || o[a] > hi) return Infinity; continue; }
    let ta = (lo - o[a]) / d[a], tb = (hi - o[a]) / d[a]; if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return Infinity;
  }
  return t0;
}
const CAM_R = 0.5; // Kamera als Kugel: deckt die Ecken der Near-Plane (0.3) ab, auch im Hochformat mit 80° Blickwinkel

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.post = new Post(this.renderer); this.vignette();
    this.renderer.toneMapping = THREE.CustomToneMapping; // ACES + kräftigere Farben, siehe fx.js this.renderer.toneMappingExposure = 1.0;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.3, 600); // near nicht kleiner: sonst reicht die Tiefengenauigkeit nicht und übereinanderliegende Flächen flackern
    this.input = new Input(); this.audio = new AudioEngine();
    this.fx = new Particles(); this.rings = this.fx.rings = new Rings(); this.prints = new Prints(); this.shakeT = 0; this._shake = new THREE.Vector3();
    this.player = new Player(this);
    this.hud = { levelName: document.getElementById('levelName'), hearts: document.getElementById('hearts'), counter: document.getElementById('counter'), toast: document.getElementById('toast'), boss: document.getElementById('bossbar'), sniff: document.getElementById('sniff') }; this.counters = new Counters(this.hud.counter);
    this.camYaw = 0; this.camPitch = 0.35; this.camDist = 9;
    this.paused = true; this.level = null; this.clock = new THREE.Clock();
    this.save = this.loadSave(); this.dialog = new Dialog(this); this.applyQuality(); this.updateAbilityButtons(); this._setupShop();
    window.addEventListener('resize', () => this.resize()); this.resize();
    document.getElementById('btnStart').addEventListener('click', () => this.start());
    this.menu = new Menu(this); this.menuDog = new MenuDog(document.getElementById('dogIcon'), document.getElementById('menu')); this.intro = new Intro(this);
    document.getElementById('btnLeave').addEventListener('click', () => { this.enterLevel('hub', true); this.start(); });
    this.enterLevel('hub', true);
    this.loop();
  }

  loadSave(fresh = false) {
    const empty = () => ({ crumbs: 0, bones: {}, worlds: {}, abilities: {}, settings: {} });
    let s; try { s = Object.assign(empty(), JSON.parse((!fresh && localStorage.getItem(SAVE_KEY)) || '{}')); } catch (e) { s = empty(); }
    for (const k of ['bones', 'worlds', 'abilities', 'settings']) if (typeof s[k] !== 'object' || !s[k]) s[k] = {};
    if (!QUALITY[s.settings.quality]) s.settings.quality = matchMedia('(pointer: coarse)').matches ? 'mittel' : 'hoch';
    return s;
  }
  has(ability) { return !!this.save.abilities[ability]; }
  maxHp() { return 3 + (this.has('herz4') ? 1 : 0) + (this.has('herz5') ? 1 : 0); }
  unlock(ability, text) {
    if (this.has(ability)) return; this.save.abilities[ability] = true; this.persist(); this.updateAbilityButtons();
    this.audio.sfx('big'); this.input.vibrate(300); this.shake(0.3); this.toast(text || `Neue Fähigkeit: ${ability}!`, 6000);
  }
  // Neue Fähigkeit von Heribert: große Karte mit Name und Steuerung
  // Von Heribert: erst das Gespräch (beim ersten Mal ganz, danach ein kurzer Spruch), dann die Karte.
  learn(ability, fromBruno, mesh) {
    const a = ABILITIES[ability]; if (!a) return; const fresh = !this.has(ability);
    if (fresh) { this.save.abilities[ability] = true; if (ability === 'tornado') this.save.abilities.trillern = true; this.persist(); this.updateAbilityButtons(); }
    const card = () => { if (fresh) { this.audio.sfx('big'); this.input.vibrate(300); this.shake(0.3); } this._learnCard(a, fresh, fromBruno); if (fresh) this.later(7000, () => this.backtrackHint(ability)); };
    if (fromBruno) this.talk('bruno.' + ability, { mesh, onDone: card }); else card();
  }
  _learnCard(a, fresh, fromBruno) {
    const el = document.getElementById('learn'); if (!el) return;
    el.innerHTML = `<div class="ic">${a.icon}</div><small>${fresh ? 'Neue Fähigkeit' : 'Fähigkeit'}${fromBruno ? ' · von Heribert' : ''}</small><h3>${a.name}</h3><p>${a.how}</p>`;
    el.classList.add('show'); clearTimeout(this._lt); this._lt = setTimeout(() => el.classList.remove('show'), 6500);
  }
  // Nach neuer Fähigkeit: in welchen schon besuchten Welten jetzt Rückkehr-Knochen erreichbar sind
  backtrackHint(ability) {
    const worlds = Object.keys(BACKTRACK).filter(k => k !== this.level?.key && (k === 'hub' || Object.keys(this.save.bones).some(b => b.startsWith(k + ':'))) && Object.entries(BACKTRACK[k]).some(([id, need]) => need === ability && !this.hasBone(k, id)));
    if (worlds.length) this.toast(`Mit ${(ABILITIES[ability] || UPGRADES.find(u => u.id === ability)).name} kommst du jetzt an neue Goldknochen: ${worlds.map(k => WORLD_NAMES[k]).join(', ')}!`, 5500);
  }
  updateAbilityButtons() {
    const b = document.body.classList; b.toggle('can-spin', ['trillern', 'gleiten', 'tornado'].some(a => this.has(a))); b.toggle('can-bark', this.has('bellen'));
  }
  // ---- Krümel-Laden (Heribert im Garten)
  _setupShop() {
    const el = document.getElementById('shop'); if (!el) return;
    el.querySelector('.close').addEventListener('click', () => this.closeShop());
  }
  openShop() {
    const el = document.getElementById('shop'); if (!el) return; this.shopOpen = true; this.shopSel = 0; this.renderShop(); el.classList.add('show');
    this.talk('bruno.laden');
  }
  closeShop() { document.getElementById('shop').classList.remove('show'); this.shopOpen = false; }
  shopItems() { return UPGRADES.map(u => ({ ...u, owned: this.has(u.id), locked: !!u.needs && !this.has(u.needs) })); }
  renderShop() {
    const el = document.getElementById('shop'), items = this.shopItems();
    el.querySelector('.wallet').textContent = `Deine Krümel: ${this.save.crumbs} ✦`;
    el.querySelector('.list').innerHTML = items.map((u, i) => `<div class="item ${i === this.shopSel ? 'sel' : ''} ${u.owned || u.locked || this.save.crumbs < u.price ? 'off' : ''}" data-i="${i}"><span class="ic">${u.icon}</span><span class="tx"><b>${u.name}</b><br>${u.locked ? `Erst ${ABILITIES[u.needs]?.name || 'das vorige Upgrade'} lernen` : u.text}</span><span class="pr">${u.owned ? '✅' : u.price + ' ✦'}</span></div>`).join('');
    el.querySelectorAll('.item').forEach(d => d.addEventListener('click', () => { this.shopSel = +d.dataset.i; this.buy(); }));
  }
  buy() {
    const u = this.shopItems()[this.shopSel]; if (!u) return;
    if (u.owned) this.toast('Hast du schon!'); else if (u.locked) this.toast('Dafür musst du erst etwas anderes lernen.'); else if (this.save.crumbs < u.price) this.talk('bruno.pleite', { vars: { n: u.price - this.save.crumbs } });
    else { this.save.crumbs -= u.price; this.save.abilities[u.id] = true; this.persist(); this.audio.sfx('big'); this.toast(`${u.icon} ${u.name}!`); this.talk('bruno.gekauft'); if (u.id.startsWith('herz')) { this.player.hp = this.maxHp(); this.updateHearts(); } this.updateAbilityButtons(); this.later(1500, () => this.backtrackHint(u.id)); }
    this.renderShop();
  }
  _shopInput() {
    const i = this.input, n = UPGRADES.length;
    if (i.pressed('down') || i.pressed('right')) { this.shopSel = (this.shopSel + 1) % n; this.renderShop(); }
    if (i.pressed('up') || i.pressed('left')) { this.shopSel = (this.shopSel + n - 1) % n; this.renderShop(); }
    if (i.pressed('jump')) this.buy();
    if (i.pressed('act') || i.pressed('sniff') || i.pressed('pause')) this.closeShop();
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
  // Musikvariante passend zur Lage: getaucht, Bosskampf, Innenraum oder draußen – das Stück läuft im selben Takt weiter
  _musicMix() {
    const L = this.level; if (!L) return;
    this.audio.setMix(L.isRunner ? 'normal' : L._uw || this.player.diving ? 'water' : L.boss && !L.boss.dead ? 'boss' : L.bounds?.room ? 'inside' : 'normal');
    // Bereichs-Variante: jede Zone der Welt färbt die Melodie mit einem anderen Instrument (nur alle ~30 Bilder prüfen)
    if (!L.isRunner && (this._areaF = (this._areaF || 0) + 1) % 30 === 0) {
      const p = this.player.pos; let a = 0; (L.zones || []).forEach((z, k) => { if (Math.hypot(z.x - p.x, z.z - p.z) < z.r) a = k + 1; });
      this.audio.setArea(a);
    }
    // Hub: je näher Moll einem Portal kommt, desto mehr blendet die Musik ins Stück der Zielwelt über (ab 24 m, voll bei 6 m)
    let style = null, k = 0;
    if (L.key === 'hub' && !L.isRunner) {
      const p = this.player.pos; let best = null, bd = Infinity;
      for (const po of L.portals) { const d = Math.hypot(po.x - p.x, (po.y - p.y) * 1.5, po.z - p.z); if (d < bd) { bd = d; best = po; } }
      if (best) { style = best.target === 'rattenrennen' ? 'chase' : LEVELS[best.target]?.music?.style; k = Math.min(0.9, Math.max(0, (24 - bd) / 18)); }
    }
    this.audio.setBlend(style, k);
  }
  worldState(key) { const w = this.save.worlds; if (!w[key] || typeof w[key] !== 'object') w[key] = {}; w[key].goals ||= []; w[key].crumbs ||= []; w[key].special ||= []; return w[key]; }
  applyQuality() {
    const q = this.q = QUALITY[this.save.settings.quality];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.ratio)); setOutlines(q.outlines);
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

  // Bild zeichnen: bei Grafik „Hoch“ mit Bloom, Sonnenstrahlen und Linsenreflex (post.js), sonst direkt
  draw() {
    const L = this.level;
    if (this.q.post) { try { this.post.render(L.scene, this.camera, L.T && !L.def?.indoor && !L._uw && L.sky ? L.sky.sunDir : null); return; } catch (e) { this.q = { ...this.q, post: false }; console.warn('Nachbearbeitung aus:', e); } }
    this.renderer.setRenderTarget(null); this.renderer.render(L.scene, this.camera);
  }
  // Leichte Vignette (dunklere Bildränder) als CSS-Ebene: kostet nichts
  vignette() {
    const v = document.createElement('div'); v.id = 'vignette';
    v.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(20,10,30,0.28) 100%)';
    this.canvas.after(v);
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight; this.renderer.setSize(w, h, false); this.post?.setSize(w, h); this.camera.aspect = w / h;
    const portrait = h > w; this.camera.fov = portrait ? 80 : 60; this.camDist = portrait ? 14 : 9; this.camPitch = portrait ? 0.5 : 0.35; // Hochformat: mehr Überblick
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.audio.init(); this.audio.resume();
    this.menu.show(false); document.getElementById('menu').classList.add('hidden'); document.body.classList.remove('is-paused'); this.paused = false;
    if (this.level) this.audio.playTheme(this.level.def.music);
  }
  pause() {
    this.paused = true; const m = document.getElementById('menu'); m.classList.remove('hidden'); m.classList.add('paused'); document.body.classList.add('is-paused');
    document.getElementById('btnStart').textContent = '▶ Weiter';
    document.getElementById('btnLeave').style.display = this.level && this.level.key !== 'hub' ? '' : 'none';
    document.getElementById('menuText').innerHTML = pauseHTML(this);
    this.audio.stopMusic(); this.audio.stopLoops();
  }

  enterLevel(key, silent = false) {
    this.dialog.reset();
    this.fx.detach(); this.rings.detach(); this.prints.detach(); this.player.mesh.removeFromParent(); this.player.shadow.removeFromParent(); // Moll wandert mit in die neue Welt: seine Geometrie nicht mit der alten Welt freigeben
    if (this.level && this.level.scene) this.level.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.hideBoss(); this.suspicion(0); this.audio.stopLoops(); this.fromKey = this.level?.key;
    if (key === 'albtraum' || key === 'rattenrennen') { this.level = new RunnerLevel(this, key); }
    else {
      this.level = new Level(this, LEVELS[key], key); this.level.scene.add(this.player.mesh, this.player.shadow); this.player.reset(this.level.spawn);
      this.player.yaw = this.level.spawnYaw ?? Math.PI; this.camYaw = this.level.spawnCam ?? this.player.yaw - Math.PI;
      this._sunQuality(this.level.sun); this.level.restore(); this.snapCam = true;
    }
    this.fx.attach(this.level.scene); this.rings.attach(this.level.scene); if (this.level.def.prints) this.prints.attach(this.level.scene, this.level.def.prints); this.fade();
    this.level.key = key;
    this.hud.levelName.textContent = this.level.def.name; this.banner();
    this.updateHearts(); this.updateCounter(); if (!this.level.isRunner) this.counters.show(5000);
    if (!silent) { this.audio.sfx('portal'); this.audio.playTheme(this.level.def.music); }
    const br = this.level.bruno; if (br && br.ability && !this.has(br.ability)) this.later(5200, () => { if (!this.has(br.ability)) this.toast('🐕 Heribert wartet hier in der Nähe – er bringt dir etwas Neues bei!', 4000); });
    if (!this.level.isRunner) { const intro = this.level.intro; if (key !== 'hub') this.toast(this.level.def.name + (intro ? ' – ' + intro : ''), 4500); else if (intro) this.toast(intro, 3500); }
  }

  // ------------------------------------------------------------- HUD
  updateHearts() {
    if (this._hp !== undefined && this.player.hp < this._hp) { this.pop(this.hud.hearts, 'ouch'); this.shake(0.3); }
    else if (this._hp !== undefined && this.player.hp > this._hp) this.pop(this.hud.hearts);
    this._hp = this.player.hp; const hp = Math.max(0, this.player.hp);
    this.hud.hearts.innerHTML = ICON.heart(true).repeat(hp) + ICON.heart(false).repeat(Math.max(0, this.maxHp() - hp));
  }
  updateCounter() {
    const l = this.level; if (!l || l.isRunner) return;
    const icon = GOAL_ICON[l.goal.kind] || '⭐', rows = [];
    if (l.goal.need) rows.push({ k: 'goal', icon: ICON.badge(icon), text: `${l.goal.have}/${l.goal.need}` });
    rows.push({ k: 'crumb', icon: ICON.crumb(), text: `${l.crumbHave}/${l.crumbTotal}` });
    rows.push({ k: 'bone', icon: ICON.bone(), text: l.goal.need ? `${this.boneCount()}` : `${this.boneCount()}/${TOTAL_BONES}` });
    this.counters.set(rows);
  }
  // Weltname als Holzschild oben in der Mitte, rutscht nach ein paar Sekunden wieder weg
  banner(ms = 3800) { const b = this.hud.levelName; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); clearTimeout(this._bt); this._bt = setTimeout(() => b.classList.remove('show'), ms); }
  pop(el, cls = 'pop') {
    if (el === this.hud.counter) { this.counters.show(); return; } // Zähler hüpfen selbst, sobald sich die Zahl ändert
    el.classList.remove('pop', 'ouch'); void el.offsetWidth; el.classList.add(cls);
  }
  fade() { const f = document.getElementById('fade'); if (!f) return; f.classList.remove('out'); void f.offsetWidth; f.classList.add('out'); }
  shake(t = 0.3) { this.shakeT = Math.max(this.shakeT, t); }
  // Figuren sprechen (Texte und Stimmen in dialog.js)
  talk(id, o) { this.dialog.talk(id, o); }
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
  onDeath() { const key = this.level.key; this.toast('Moll braucht ein Nickerchen … gleich geht es weiter.', 3000); this.audio.sfx('lose'); this.later(1800, () => this.enterLevel(key, true)); this.player.hp = this.maxHp(); }

  // ------------------------------------------------------------- Kamera
  updateCamera(dt) {
    const c = this.input.consumeCam(); this.camYaw -= c.x; this.camPitch = Math.max(0.1, Math.min(1.2, this.camPitch + c.y));
    const p = this.player.pos; const target = new THREE.Vector3(p.x, p.y + 1.2, p.z);
    const off = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch)).multiplyScalar(this.camDist);
    // Kamera-Kollision: hohe Kisten, Decken über dem Hund und Hügel zwischen Hund und Kamera verkürzen den Abstand
    const L = this.level, dir = off.clone().normalize(), hit = this._camHit(target, dir, this.camDist);
    const blocked = hit < this.camDist; if (blocked) off.setLength(hit);
    const want = target.clone().add(off);
    // Kamera nicht unter den Boden; beim Schwimmen an der Oberfläche bleibt sie über dem Wasser
    want.y = Math.max(want.y, this.player.diving ? -Infinity : L.camFloor ?? 1.2, L.heightAt(want.x, want.z, want.y) + 0.8);
    if (this.player.diving) want.y = Math.max(want.y, L.groundAt(want.x, want.z, want.y + 2) + 0.6);
    else if (this.player.swimming) { const wy = L.waterAt(p.x, p.z); if (wy !== null) want.y = Math.max(want.y, wy + 0.6); }
    const cam = this.camera.position; cam.lerp(want, this.snapCam ? 1 : Math.min(1, dt * (blocked ? 20 : 6))); this.snapCam = false;
    // Nachziehen schneidet beim Drehen Ecken ab: die geglättete Position noch einmal prüfen, nie hinter eine Wand
    const back = cam.clone().sub(target), bl = back.length();
    if (bl > 0.01) { const h2 = this._camHit(target, back.divideScalar(bl), bl); if (h2 < bl) cam.copy(target).addScaledVector(back, h2); }
    this.camera.lookAt(target);
    SEE_THROUGH.uCutA.value.copy(this.camera.position); SEE_THROUGH.uCutB.value.set(p.x, p.y + 0.7, p.z); SEE_THROUGH.uCutFeet.value = p.y + 0.25; SEE_THROUGH.uCutR.value = 1.5;
  }

  // Wie weit die Kamera-Kugel von from in Richtung dir (normiert) bis max kommt
  _camHit(from, dir, max) {
    const L = this.level; let hit = max;
    for (const s of L.solids) if (s.active && (s.cam || s.ceil && s.min.y > from.y)) { const d = rayBox(from, dir, s, CAM_R); if (d < hit) hit = d; }
    if (L.terrain.length) for (let k = 1; k <= 10; k++) { const d = hit * k / 10, x = from.x + dir.x * d, y = from.y + dir.y * d, z = from.z + dir.z * d; if (L.heightAt(x, z, y) > y - 0.3 - CAM_R) { hit = Math.max(0, d - hit / 10); break; } }
    return Math.max(0.2, hit);
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    this.input.update(); this.dialog.update();
    if (this.dialog.open) { this.dialog.input(this.input); if (this.level) this.draw(); return; }
    if (this.shopOpen) { this._shopInput(); if (this.level) this.draw(); return; }
    if (this.intro.blocking()) this.intro.poll(this.input); // Intro im Startmenü: Eingaben starten/überspringen nur das Intro
    else if (this.menu.options && this.paused) { if (this.input.pressed('pause')) this.menu.show(false); } // in den Optionen: Esc/Start = zurück
    else if (this.input.pressed('pause')) { if (this.paused) this.start(); else this.pause(); }
    else if (this.paused && this.input.pressed('jump') && this.level) this.start(); // Gamepad A / Leertaste startet
    if (!this.paused && this.level) {
      if (this.level.isRunner) this.level.update(dt);
      else { this.player.update(dt, this.level); this.level.update(dt); if (this.player.idleT > 1.5) this.counters.show(2500); this.updateCamera(dt); this.updateCompass(dt); }
    }
    if (!this.paused) { this.fx.update(dt); this.rings.update(dt); this.prints.update(dt); }
    // Kamerawackeln nur für dieses Bild, damit die Kamerafahrt nicht verschoben wird
    if (this.shakeT > 0 && !this.paused) { this.shakeT -= dt; const k = Math.min(1, this.shakeT * 3) * 0.35; this._shake.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k); } else this._shake.set(0, 0, 0);
    if (!this.paused) { this._underwater(); this._musicMix(); }
    this.camera.position.add(this._shake);
    // Startmenü verdeckt die Welt ganz: nur selten zeichnen (spart Akku, Moll im Menü läuft flüssiger)
    const m = document.getElementById('menu').classList, covered = this.paused && !m.contains('hidden') && !m.contains('paused');
    this._coverT = covered ? (this._coverT || 0) + dt : 0;
    if (this.level && (!covered || this._coverT > 0.5)) { this.draw(); if (covered) this._coverT = 0; }
    this.camera.position.sub(this._shake);
  }
}
