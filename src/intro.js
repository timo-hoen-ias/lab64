// Intro im Startmenü: „MOLLY“ hüpft herein, Moll (3D, menudog.js) läuft darüber und springt aufs Y – es fällt herunter, übrig bleibt „MOLL“.
// Startet mit dem ersten Tippen/Tastendruck (vorher dürfen Browser keinen Ton abspielen); ein weiteres Tippen überspringt es.
// Die Bilder laufen auf der Uhr der Musik (Achtel des Intro-Stücks in music.js), ohne Ton auf der Uhr des Browsers.
import { SONGS } from './music.js';
const $ = id => document.getElementById(id);
// Moll (menudog.js) plumpst aufs M, trabt bis zum zweiten L, springt aufs Y – das Y wackelt unter ihr und fällt, Moll rettet sich zurück aufs L
const CUES = [[0, 'l0'], [2, 'l1'], [4, 'l2'], [6, 'l3'], [8, 'l4'], [9, 'drop'], [12, 'walk'], [21.5, 'jump'], [24, 'wobble'], [30, 'fall'], [32.4, 'plonk'], [34, 'reveal']];
const FALL = 2.2; // Achtel, bis das Y unten aus dem Bild ist (ca. 0,5 s)
const letters = word => [...word].map((c, i) => `<span class="l"${c === 'Y' ? ' id="titleY"' : ''}>${c}</span>`).join('') + '<small>Der Labrador</small>';

export class Intro {
  constructor(game) {
    this.game = game; this.menu = $('menu'); this.card = this.menu.querySelector('.card'); this.h1 = this.menu.querySelector('h1');
    this.state = 'wait'; this.endT = -1e9; this.lastT = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { this._final(); return; }
    // Starten auf pointerup (bei Touch erst dann darf Ton starten), Überspringen schon beim Drücken
    window.addEventListener('pointerup', () => { if (this.state === 'wait') this.play(); });
    window.addEventListener('pointerdown', () => { if (this.state === 'play') this.skip(); });
    window.addEventListener('keydown', e => { this.keyDown = true; if (e.repeat) return; if (this.state === 'wait') this.play(); else if (this.state === 'play') this.skip(); });
    window.addEventListener('keyup', () => { this.keyDown = false; });
  }
  // Solange das Intro läuft (und kurz danach), gehören Eingaben ihm – sonst würde derselbe Tastendruck gleich das Spiel starten
  blocking() { return this.state !== 'done' || performance.now() - this.endT < 400; }
  poll(input) { // Gamepad (Tastatur und Touch kommen über die Ereignisse oben)
    if (this.state === 'done' || performance.now() - this.lastT < 300 || !(input.anyPressed() || input.pressed('pause'))) return;
    if (this.state === 'wait') this.play(); else this.skip();
  }
  play() {
    this.state = 'play'; this.lastT = performance.now();
    const a = this.game.audio; a.init(); a.resume();
    this.menu.classList.replace('wait', 'intro');
    this.h1.innerHTML = letters('MOLLY'); this.game.menuDog.hide();
    a.playTheme({ style: 'intro' });
    this.song = a.song; this.step = 60 / SONGS.intro.bpm / 2; this.pos = -0.3; this.cue = 0; this.prev = performance.now();
    this._tick();
  }
  // Aktuelle Achtel: von der Musik, falls sie läuft; sonst selbst weiterzählen
  _now() {
    const a = this.game.audio, sg = this.song, now = performance.now(), dt = (now - this.prev) / 1000; this.prev = now;
    if (sg && a.song === sg && a.ctx.state === 'running') return Math.max(this.pos, (a.ctx.currentTime - sg.start) / this.step);
    return now - this.lastT > 300 ? this.pos + dt / this.step : this.pos; // kurz auf den Ton warten (resume ist asynchron)
  }
  _tick() {
    if (this.state !== 'play') return;
    requestAnimationFrame(() => this._tick());
    this.pos = this._now();
    while (this.cue < CUES.length && this.pos >= CUES[this.cue][0]) this._do(CUES[this.cue++][1]);
    if (this.fall) this._fallFrame();
  }
  _do(what) {
    const a = this.game.audio, dog = this.game.menuDog, st = this.step, ch = this.h1.children;
    if (what[0] === 'l') ch[+what[1]].classList.add('in');
    else if (what === 'drop') dog.dropTo(dog.xOf(ch[0]));
    else if (what === 'walk') dog.walkTo(dog.xOf(ch[3]), (21.5 - 12) * st);
    else if (what === 'jump') { dog.jumpTo(dog.xOf(ch[4]), 2.5 * st); a.sfx('jump'); }
    else if (what === 'wobble') $('titleY').classList.add('wobble');
    else if (what === 'fall') {
      a.sfx('slidewhistle'); dog.jumpTo(dog.xOf(this.h1.children[3]), 1.8 * this.step); dog.face(1); // Moll rettet sich aufs L und schaut dem Y hinterher
      const y = $('titleY'); y.classList.remove('wobble');
      const r = y.getBoundingClientRect(), cs = getComputedStyle(y), el = document.createElement('span');
      el.className = 'fallY'; el.textContent = 'Y';
      Object.assign(el.style, { left: r.left + 'px', top: r.top + 'px', fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily, lineHeight: cs.lineHeight });
      this.menu.appendChild(el);
      y.style.width = r.width + 'px'; void y.offsetWidth; y.classList.add('gone'); // Lücke schließt sich: „MOLL“ rückt zusammen
      const d = innerHeight - r.top + r.height, v0 = -r.height * 0.9, T = FALL * this.step;
      this.fall = { el, v0, g: 2 * (d - v0 * T) / (T * T), dx: r.width * 0.8 };
    } else if (what === 'plonk') { a.sfx('plonk'); this._remFall(); this.card.classList.add('shake'); }
    else if (what === 'reveal') this._final();
  }
  _fallFrame() {
    const f = this.fall, t = Math.max(0, this.pos - CUES.find(c => c[1] === 'fall')[0]) * this.step, k = t / (FALL * this.step);
    f.el.style.transform = `translate(${f.dx * k}px,${f.v0 * t + f.g * t * t / 2}px) rotate(${k * k * 220}deg)`;
    if (k > 1.2) this._remFall();
  }
  _remFall() { if (this.fall) { this.fall.el.remove(); this.fall = null; } }
  skip() {
    const a = this.game.audio;
    if (this.state === 'play' && a.song && a.song === this.song) a.stopMusic();
    this._final();
  }
  // Endzustand: „MOLL“, Menü komplett
  _final() {
    const wasIntro = this.menu.classList.contains('intro');
    this.state = 'done'; this.endT = performance.now(); this._remFall();
    this.menu.classList.remove('wait', 'intro'); setTimeout(() => this.game.menuDog?.free(), wasIntro ? 900 : 0); this.card.classList.remove('shake');
    this.h1.innerHTML = letters('MOLL');
    if (wasIntro) { this.card.style.animation = 'none'; void this.card.offsetWidth; this.card.style.animation = ''; } // Karte springt neu herein
    // Fokus erst nach dem Loslassen: sonst löst das Loslassen der Leertaste gleich „Spielen“ aus
    const focus = () => setTimeout(() => $('btnStart').focus({ preventScroll: true }), 0);
    if (this.keyDown) window.addEventListener('keyup', focus, { once: true }); else focus();
  }
}
