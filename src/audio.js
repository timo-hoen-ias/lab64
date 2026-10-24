// Musik und Effekte, alles aus Oszillatoren – kein Asset nötig.
// Die Stücke selbst stehen in music.js; hier spielt sie ein Sequenzer mit Instrumenten und synchronen Varianten (draußen, drinnen, unter Wasser, Boss).
import { SONGS, MIXES, compile } from './music.js';

export class AudioEngine {
  constructor() { this.ctx = null; this.song = null; this.enabled = true; this.mix = 'normal'; }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    // Unter Wasser: Effekte stark gedämpft, Musik nur leicht (die Unterwasser-Variante klingt ohnehin weich)
    this.lowpass = this.ctx.createBiquadFilter(); this.lowpass.type = 'lowpass'; this.lowpass.frequency.value = 20000; this.lowpass.connect(this.master);
    this.musicLP = this.ctx.createBiquadFilter(); this.musicLP.type = 'lowpass'; this.musicLP.frequency.value = 20000; this.musicLP.connect(this.master);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.musicLP);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.7; this.sfxGain.connect(this.lowpass);
    if (this.vol) this.setVolume(...this.vol);
    // Mobilbrowser setzen den Kontext nach Anrufen, Sperrbildschirm oder Tab-Wechsel auf 'suspended'/'interrupted' → bei nächster Gelegenheit fortsetzen
    const wake = () => this.resume();
    ['pointerdown', 'touchend', 'keydown'].forEach(e => window.addEventListener(e, wake, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    this.ctx.onstatechange = () => { if (this.ctx.state !== 'running' && !document.hidden) wake(); };
  }
  underwater(on) {
    if (!this.ctx) return; const t = this.ctx.currentTime; this.lowpass.frequency.cancelScheduledValues(t);
    this.lowpass.frequency.setTargetAtTime(on ? 650 : 20000, t, on ? 0.08 : 0.2); if (on) this.sfx('splash');
    this.musicLP.frequency.cancelScheduledValues(t); this.musicLP.frequency.setTargetAtTime(on ? 2400 : 20000, t, 0.2);
  }
  // Lautstärke aus den Optionen (0..1); 1 = Standardpegel. Merkt sich den Wert, falls der Kontext noch fehlt.
  setVolume(music, sfx) {
    this.vol = [music, sfx]; this.musicLevel = 0.35 * music * music; if (!this.ctx) return; const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t); this.musicGain.gain.setTargetAtTime(this.musicLevel, t, 0.03); this.sfxGain.gain.setTargetAtTime(0.7 * sfx * sfx, t, 0.03); // quadratisch: klingt gleichmäßiger
  }
  resume() { if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => { }); }

  _note(semi, base = 220) { return base * Math.pow(2, semi / 12); }

  _tone(freq, t, dur, type = 'square', vol = 0.2, dest = null, slide = 0) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain); o.start(t); o.stop(t + dur + 0.05);
  }

  _noise(t, dur, vol = 0.2) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b;
    const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.sfxGain); s.start(t);
  }

  // ---- Musik ----------------------------------------------------------
  // theme: { style } aus der Leveldefinition; style wählt das Stück in music.js.
  playTheme(theme) {
    if (!this.ctx) return;
    this.stopMusic();
    const key = SONGS[theme.style] ? theme.style : 'garden', def = SONGS[key];
    const S = (this._compiled ||= {})[key] ||= compile(def);
    const step = 60 / def.bpm / 2;
    // Eigener Lautstärkeregler je Stück: weich einblenden, beim Wechsel ausblenden (Crossfade statt hartem Schnitt)
    const out = this.ctx.createGain(), t0 = this.ctx.currentTime;
    out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(1, t0 + 0.6); out.connect(this.musicGain);
    let dest = out;
    if (def.echo) { // Hall/Echo für Kanal und Albtraum
      const dl = this.ctx.createDelay(1), fb = this.ctx.createGain(), wet = this.ctx.createGain(), inp = this.ctx.createGain();
      dl.delayTime.value = step * 3; fb.gain.value = 0.35; wet.gain.value = 0.5;
      inp.connect(out); inp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out); dest = inp;
    }
    // Jede Ebene hat einen eigenen Regler; Varianten blenden nur die Regler um, die Noten laufen im selben Takt weiter
    const mix = MIXES[this.mix] || MIXES.normal, layers = {};
    for (const k of Object.keys(MIXES.normal)) { const g = this.ctx.createGain(); g.gain.value = mix[k]; g.connect(k === 'drums' || k === 'boss' ? out : dest); layers[k] = g; }
    const song = { stop: false, step: 0, gain: out, layers, def, S, stepLen: step, start: 0, nodes: [dest, out, ...Object.values(layers)] };
    this.song = song;
    song.start = this.ctx.currentTime + 0.05;
    const schedule = () => {
      if (song.stop) return;
      const now = this.ctx.currentTime;
      // Hing der Hauptthread (Ruckler beim Einblenden eines Bereichs, Hintergrund-Tab), lägen die nächsten Noten in der Vergangenheit
      // und blieben stumm → Takt neu ansetzen, damit die Musik sofort weiterläuft statt abzubrechen.
      if (song.start + song.step * step < now + 0.02) song.start = now + 0.05 - song.step * step;
      while (song.start + song.step * step < now + 1.0) { this._playStep(song, song.step); song.step++; }
      song.timer = setTimeout(schedule, 100);
    };
    schedule();
  }
  // Variante umschalten (normal, inside, water, boss). Ebenen, die neu dazukommen, werden für die schon geplante Sekunde nachgetragen.
  setMix(name) {
    if (!MIXES[name] || this.mix === name) return;
    const prev = MIXES[this.mix] || MIXES.normal; this.mix = name;
    const sg = this.song; if (!sg || !this.ctx) return;
    const t = this.ctx.currentTime, mix = MIXES[name], added = new Set();
    for (const [k, g] of Object.entries(sg.layers)) {
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.setTargetAtTime(mix[k], t, 0.15);
      if (mix[k] > 0 && !(prev[k] > 0)) added.add(k);
    }
    if (added.size) for (let n = Math.max(0, Math.ceil((t + 0.03 - sg.start) / sg.stepLen)); n < sg.step; n++) this._playStep(sg, n, added);
  }
  _playStep(song, n, only) {
    const { def, S, layers, stepLen: step } = song, mix = MIXES[this.mix] || MIXES.normal;
    const on = k => (!only || only.has(k)) && mix[k] > 0;
    const { bar, len, mel, chord } = S, i = n % len, b = i % bar, pass = Math.floor(n / len), ch = chord[i], m = mel[i];
    const t = song.start + n * step + (n % 2 ? def.swing || 0 : 0), I = def.inst, f = midi => 440 * Math.pow(2, (midi - 69) / 12);
    const tone = (o, base) => base + ((ch.root + o) % 12 + 12) % 12; // Akkordton oberhalb von base
    // Melodie in drei Klangfarben: draußen, drinnen, unter Wasser
    if (m) {
      if (on('lead')) this._inst(I.lead, f(m.midi), t, m.len * step, layers.lead);
      if (on('soft')) this._inst(I.soft || 'clarinet', f(m.midi), t, m.len * step, layers.soft);
      if (on('water')) this._inst(I.water || 'vibes', f(m.midi), t, m.len * step, layers.water);
      // Zweitstimme: nächster Akkordton mindestens eine kleine Terz darunter, ab dem zweiten Durchlauf (im Bosskampf immer)
      if (on('harm') && b % 2 === 0 && (pass % 2 === 1 || this.mix === 'boss')) {
        let h = -1; for (const o of ch.iv) for (let oc = 48; oc <= 84; oc += 12) { const x = tone(o, oc); if (x <= m.midi - 3 && x > h) h = x; }
        if (h > 0) this._inst(I.harm || 'xylo', f(h), t, Math.min(m.len, 2) * step, layers.harm, 0.7);
      }
    }
    // Begleitakkorde (Offbeats, Stabs)
    if (on('comp') && def.comp.includes(b)) ch.iv.forEach(o => this._inst(I.comp, f(tone(o, 60)), t, (def.compLen || 0.6) * step, layers.comp, 0.32));
    // Bass: Grundton zwischen G2 und F#3, 'A' = Halbton unter dem nächsten Grundton
    const bp = def.bass[b];
    if (on('bass') && bp !== null && bp !== undefined) {
      const root = ((ch.root - 7) % 12 + 12) % 12 + 43, next = chord[(i + 1) % len];
      const midi = bp === 'A' ? ((next.root - 7) % 12 + 12) % 12 + 42 : root + bp;
      this._inst(I.bass, f(midi), t, (def.bassLen || 0.8) * step, layers.bass);
    }
    if (on('bass') && def.drone && i % (bar * 2) === 0) this._tone(f(((ch.root - 7) % 12 + 12) % 12 + 31), t, step * bar * 2, 'sawtooth', 0.04, layers.bass);
    // Unter-Wasser-Ebenen: perlende Harfe und Flächenklang
    if (on('arp')) { const k = ch.iv.length, o = ch.iv[n % k]; this._inst('harp', f(tone(o, 72) + (Math.floor(n / k) % 2) * 12), t, step * 2, layers.arp, 0.5); }
    if (on('pad') && (i === 0 || chord[i - 1] !== ch)) {
      let d = 1; while (d < bar && chord[(i + d) % len] === ch) d++;
      ch.iv.forEach(o => this._inst('pad', f(tone(o, 55)), t, d * step, layers.pad, 1.2));
    }
    // Schlagzeug
    const dr = def.drums, L = layers.drums;
    if (on('drums')) {
      if (dr.kick?.includes(b)) this._tone(85, t, 0.14, 'sine', 0.3, L, -60);
      if (dr.snare?.includes(b)) this._drumNoise(t, 0.09, 0.12, L);
      if (dr.hat?.includes(b)) this._drumNoise(t, 0.025, 0.035, L);
      if (dr.brush?.includes(b)) this._drumNoise(t, 0.16, 0.05, L);
      if (dr.shaker?.includes(b)) this._drumNoise(t, 0.03, 0.02, L);
      if (dr.click?.includes(b)) this._tone(1500, t, 0.035, 'triangle', 0.09, L, -300); // Holzblock
      if (def.roll && i % (bar * 4) >= bar * 4 - 2) this._drumNoise(t + step / 2, 0.05, 0.08, L);
    }
    // Bosskampf: Blechbläser-Stöße und Trommelwirbel
    if (on('boss')) {
      if (b === 0 || b === 3) ch.iv.slice(0, 3).forEach(o => this._inst('brass', f(tone(o, 55)), t, step * 0.9, layers.boss, 0.5));
      if (b % 2 === 1) this._drumNoise(t, 0.06, 0.07, layers.boss);
      if (i % (bar * 2) >= bar * 2 - 3) this._tone(180 - (i % bar) * 12, t, 0.18, 'sine', 0.25, layers.boss, -70);
    }
  }
  // Instrumente aus Oszillatoren
  _inst(kind, f, t, dur, dest, vol = 1) {
    switch (kind) {
      case 'banjo': this._tone(f, t, Math.min(dur * 0.7, 0.3), 'square', 0.08 * vol, dest); this._tone(f * 2, t, 0.12, 'triangle', 0.05 * vol, dest); break;
      case 'marimba': this._tone(f, t, Math.min(dur * 0.6, 0.35), 'sine', 0.24 * vol, dest); this._tone(f * 4, t, 0.04, 'sine', 0.06 * vol, dest); break;
      case 'xylo': this._tone(f * 2, t, Math.min(dur, 0.25), 'triangle', 0.14 * vol, dest); break;
      case 'steeldrum': this._tone(f, t, 0.45, 'sine', 0.2 * vol, dest, -f * 0.01); this._tone(f * 2, t, 0.3, 'sine', 0.07 * vol, dest); this._tone(f * 3.01, t, 0.15, 'sine', 0.04 * vol, dest); break;
      case 'kazoo': this._filtered(f, t, dur * 0.92, 'sawtooth', 0.1 * vol, dest, 1300, { vib: 0.015, scoop: 0.96, q: 3 }); break;
      case 'clarinet': this._filtered(f, t, dur * 0.95, 'square', 0.07 * vol, dest, 1500, { vib: 0.006 }); break;
      case 'harmonica': this._filtered(f, t, dur * 0.95, 'sawtooth', 0.06 * vol, dest, 2200, { vib: 0.01 }); this._filtered(f * 1.004, t, dur * 0.95, 'square', 0.03 * vol, dest, 1800); break;
      case 'organ': this._filtered(f, t, dur, 'square', 0.06 * vol, dest, 2500); this._tone(f * 2, t, dur, 'sine', 0.04 * vol, dest); break;
      case 'bassoon': this._filtered(f, t, dur, 'sawtooth', 0.2 * vol, dest, 650); break;
      case 'brass': this._filtered(f, t, dur, 'sawtooth', 0.09 * vol, dest, 1600); this._filtered(f * 1.006, t, dur, 'sawtooth', 0.06 * vol, dest, 1600); break;
      case 'vibes': this._tone(f, t, Math.max(dur, 0.8), 'sine', 0.2 * vol, dest); this._tone(f * 4, t, 0.25, 'sine', 0.03 * vol, dest); break;
      case 'celesta': this._tone(f * 2, t, Math.max(dur, 0.6), 'sine', 0.14 * vol, dest); this._tone(f * 4, t, 0.2, 'triangle', 0.03 * vol, dest); break;
      case 'harp': this._tone(f, t, 0.7, 'triangle', 0.16 * vol, dest); break;
      case 'lead': this._tone(f, t, dur * 0.85, 'square', 0.1 * vol, dest); break;
      case 'epiano': this._tone(f, t, Math.max(dur, 0.5), 'sine', 0.14 * vol, dest); this._tone(f * 2, t, 0.15, 'sine', 0.04 * vol, dest); break;
      case 'slide': this._filtered(f, t, dur * 0.95, 'sawtooth', 0.08 * vol, dest, 2400, { scoop: 0.94 }); break;
      case 'accordion': this._filtered(f, t, dur * 0.95, 'sawtooth', 0.08 * vol, dest, 1800); this._filtered(f * 1.005, t, dur * 0.95, 'sawtooth', 0.05 * vol, dest, 1800); break;
      case 'flute': this._vib(f, t, dur * 0.95, 0.13 * vol, dest); break;
      case 'pluck': this._tone(f, t, Math.min(dur * 0.5, 0.3), 'triangle', 0.2 * vol, dest); this._tone(f * 1.01, t, 0.12, 'square', 0.03 * vol, dest); break;
      case 'musicbox': this._tone(f * 2, t, 0.9, 'sine', 0.14 * vol, dest); this._tone(f * 2.02, t, 0.7, 'sine', 0.05 * vol, dest); break;
      case 'pad': this._filtered(f, t, dur, 'sawtooth', 0.03 * vol, dest, 900); break;
      case 'tuba': this._filtered(f, t, dur, 'square', 0.17 * vol, dest, 500); break;
      case 'bass': this._tone(f, t, dur, 'square', 0.11 * vol, dest); break;
      case 'subbass': this._tone(f, t, dur, 'sine', 0.3 * vol, dest); break;
      case 'upright': this._tone(f, t, dur, 'triangle', 0.3 * vol, dest); break;
    }
  }
  _filtered(f, t, dur, type, vol, dest, cut, o = {}) {
    const osc = this.ctx.createOscillator(), fl = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    osc.type = type; fl.type = 'lowpass'; fl.frequency.value = cut; if (o.q) fl.Q.value = o.q;
    if (o.scoop) { osc.frequency.setValueAtTime(f * o.scoop, t); osc.frequency.exponentialRampToValueAtTime(f, t + 0.06); } else osc.frequency.value = f; // Ton von unten anschleifen
    if (o.vib) { const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = f * o.vib; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(fl); fl.connect(g); g.connect(dest); osc.start(t); osc.stop(t + dur + 0.05);
  }
  _vib(f, t, dur, vol, dest) {
    const o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5.5; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  _drumNoise(t, dur, vol, dest = this.musicGain) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(dest); s.start(t);
  }
  // Kurzer, heller Klick (Zähne)
  _click(t, vol) {
    const n = Math.floor(this.ctx.sampleRate * 0.025), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = b; f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 2; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t);
  }
  // Dauerton (z. B. Staubsaugermotor). Liefert { set(vol, pitch), stop() }.
  loop(kind = 'vacuum') {
    if (!this.ctx) return null;
    const t = this.ctx.currentTime, g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0; f.connect(g); g.connect(this.sfxGain);
    const oscs = [[62, 'sawtooth', 0.5], [124.5, 'sawtooth', 0.3], [7, 'sine', 0]].map(([fr, ty, v]) => { const o = this.ctx.createOscillator(); o.type = ty; o.frequency.value = fr; return [o, v]; });
    const mix = oscs.slice(0, 2).map(([o, v]) => { const m = this.ctx.createGain(); m.gain.value = v; o.connect(m); m.connect(f); o.start(t); return o; });
    // Rauschen = Luftstrom
    const n = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, n, n), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const air = this.ctx.createBufferSource(); air.buffer = buf; air.loop = true; const ag = this.ctx.createGain(); ag.gain.value = 0.35; air.connect(ag); ag.connect(f); air.start(t);
    // Leichtes Wummern
    const [lfo] = oscs[2]; const lg = this.ctx.createGain(); lg.gain.value = 4; lfo.connect(lg); mix.forEach(o => lg.connect(o.frequency)); lfo.start(t);
    const h = { dead: false,
      set: (vol, pitch = 1) => { if (h.dead) return; const now = this.ctx.currentTime; g.gain.setTargetAtTime(vol, now, 0.08); mix[0].frequency.setTargetAtTime(62 * pitch, now, 0.1); mix[1].frequency.setTargetAtTime(124.5 * pitch, now, 0.1); f.frequency.setTargetAtTime(900 * pitch, now, 0.1); },
      stop: () => { if (h.dead) return; h.dead = true; const now = this.ctx.currentTime; g.gain.setTargetAtTime(0, now, 0.05); [...mix, lfo, air].forEach(o => o.stop(now + 0.3)); } };
    this.loops = (this.loops || []).filter(l => !l.dead); this.loops.push(h);
    return h;
  }
  stopLoops() { (this.loops || []).forEach(l => l.stop()); this.loops = []; }
  stopMusic() {
    if (!this.song) return;
    const sg = this.song, t = this.ctx.currentTime; sg.stop = true; clearTimeout(sg.timer); this.song = null;
    sg.gain.gain.cancelScheduledValues(t); sg.gain.gain.setValueAtTime(sg.gain.gain.value, t); sg.gain.gain.linearRampToValueAtTime(0, t + 0.5); // ausblenden, bereits geplante Noten verklingen leise
    setTimeout(() => sg.nodes.forEach(n => n.disconnect()), 1600);
  }

  // Musik für eine Fanfare kurz zurücknehmen und danach wieder einblenden
  duck(sec) {
    const g = this.musicGain.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); const lv = this.musicLevel ?? 0.35, low = Math.min(0.05, lv);
    g.linearRampToValueAtTime(low, t + 0.08); g.setValueAtTime(low, t + sec); g.linearRampToValueAtTime(lv, t + sec + 0.8);
  }
  _fanfare(notes, base, t, beat, vol) { // notes: [Halbton, Länge in Schlägen] – Melodie mit Oktav-Glockenspiel und Bass
    let x = t; for (const [s, l] of notes) { if (s !== null) { const f = this._note(s, base); this._tone(f, x, beat * l * 1.1, 'square', vol); this._tone(f * 2, x, beat * l, 'triangle', vol * 0.6); } x += beat * l; }
    return x - t;
  }

  // ---- Effekte -------------------------------------------------------
  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump': this._tone(300, t, 0.18, 'square', 0.15, null, 300); break;
      case 'jump2': this._tone(400, t, 0.2, 'square', 0.15, null, 500); break;
      case 'land': this._noise(t, 0.06, 0.15); break;
      case 'collect': this._tone(880, t, 0.08, 'square', 0.15); this._tone(1320, t + 0.08, 0.14, 'square', 0.15); break;
      case 'big': this.duck(1.2); this._fanfare([[0, 0.5], [4, 0.5], [7, 0.5], [12, 1], [11, 0.5], [12, 2]], 523, t, 0.11, 0.1); this._tone(131, t + 0.33, 0.6, 'triangle', 0.3); break;
      case 'splash': this._noise(t, 0.35, 0.3); this._tone(600, t, 0.2, 'sine', 0.12, null, -450); break;
      case 'chomp': // Zähne schnappen zu: zwei Klacks + dumpfer Biss
        this._click(t, 0.5); this._click(t + 0.07, 0.7); this._tone(180, t + 0.06, 0.12, 'sine', 0.3, null, -110); this._noise(t + 0.06, 0.05, 0.12); break;
      case 'bark': this._tone(220, t, 0.08, 'sawtooth', 0.25, null, -120); this._noise(t, 0.08, 0.2); break;
      case 'hit': this._tone(150, t, 0.25, 'sawtooth', 0.3, null, -100); this._noise(t, 0.15, 0.25); break;
      case 'hurt': this._tone(500, t, 0.3, 'square', 0.2, null, -400); break;
      case 'drawer': this._noise(t, 0.12, 0.1); this._tone(200, t, 0.1, 'triangle', 0.15, null, 100); break;
      case 'sniff': this._noise(t, 0.1, 0.08); this._noise(t + 0.15, 0.1, 0.08); break;
      case 'win': { // Goldknochen-Fanfare: Musik pausiert kurz wie bei einem großen Fund
        const d = this._fanfare([[7, 0.5], [12, 0.5], [16, 0.5], [19, 1], [16, 0.5], [19, 0.5], [21, 0.5], [19, 0.5], [24, 2.5]], 262, t, 0.13, 0.1);
        [[0, 0], [7, 0.39], [5, 0.78], [7, 1.17], [0, 1.56]].forEach(([s, dt]) => this._tone(this._note(s, 65.4), t + dt, 0.35, 'triangle', 0.35));
        [0, 4, 7].forEach(s => this._tone(this._note(s + 12, 262), t + d - 0.33, 0.8, 'sine', 0.08)); this.duck(d + 0.3); break; }
      case 'lose': this.duck(1.2); [7, 6, 5, 4].forEach((s, i) => this._tone(this._note(s, 262), t + i * 0.2, i === 3 ? 0.7 : 0.22, 'sawtooth', 0.12, null, i === 3 ? -40 : 0)); break;
      case 'vacuum': this._tone(110, t, 0.5, 'sawtooth', 0.12, null, 30); break;
      case 'ko': this._tone(90, t, 1.2, 'sine', 0.4, null, -70); this._noise(t, 0.4, 0.3); break;
      case 'portal': [0, 7, 12].forEach((s, i) => this._tone(this._note(s, 262), t + i * 0.06, 0.4, 'sine', 0.2)); break;
    }
  }
}
