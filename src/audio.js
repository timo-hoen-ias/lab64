// Musik und Effekte, alles aus Oszillatoren – kein Asset nötig.
// Die Stücke selbst stehen in music.js; hier spielt sie ein Sequenzer mit Instrumenten und synchronen Varianten (draußen, drinnen, unter Wasser, Boss).
import { SONGS, MIXES, compile } from './music.js';
import { Instruments } from './instruments.js';

// Formanten (F1, F2 in Hz) je Vokal: färben das Gebrabbel, damit „a“ anders blubbert als „i“
const FORMANTS = { a: [800, 1250], e: [480, 1900], i: [300, 2300], o: [500, 880], u: [340, 720], ä: [650, 1700], ö: [450, 1500], ü: [300, 1650], y: [300, 1650] };

// Pfoten je Untergrund ungefähr gleich laut machen (Gras rauscht leise, Holz klopft laut)
const PAW_GAIN = { grass: 2, tile: 1.5, leaves: 1.4, metal: 1.2, wood: 0.7, stone: 0.65 };

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

  // Rauschen; cut = Filterfrequenz (type lowpass/highpass/bandpass), swell = an- und abschwellen statt abklingen
  _noise(t, dur, vol = 0.2, cut = 0, type = 'lowpass', swell = false) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (swell ? Math.sin(Math.PI * i / n) : 1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b;
    const g = this.ctx.createGain(); g.gain.value = vol; g.connect(this.sfxGain);
    if (cut) { const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = cut; s.connect(f); f.connect(g); } else s.connect(g);
    s.start(t);
  }

  // ---- Musik ----------------------------------------------------------
  // theme: { style } aus der Leveldefinition; style wählt das Stück in music.js.
  playTheme(theme) {
    if (!this.ctx) return;
    const key = SONGS[theme.style] ? theme.style : 'garden', bl = this.blend; this.blend = null;
    // Wurde das Stück schon am Portal hereingeblendet, läuft es einfach weiter und übernimmt (kein Neustart beim Weltwechsel)
    if (bl && bl.key === key) { this.stopMusic(); this.song = bl.song; this._fade(bl.song, 1); return; }
    if (bl) this._stopSong(bl.song);
    this.stopMusic();
    this.song = this._startSong(key);
  }
  // Hub: nah an einem Portal klingt schon das Stück der Zielwelt herein. k = 0..1 nach Entfernung, Überblendung mit gleicher Lautheit.
  setBlend(style, k) {
    if (!this.ctx || !this.song) return;
    const key = style && SONGS[style] && SONGS[style] !== this.song.def ? style : null;
    if (!key || k <= 0.01) { if (this.blend) { this._stopSong(this.blend.song); this.blend = null; this._fade(this.song, 1); } return; }
    if (this.blend?.key !== key) { if (this.blend) this._stopSong(this.blend.song); this.blend = { key, k: -1, song: this._startSong(key, 0) }; }
    if (Math.abs(this.blend.k - k) < 0.02) return; this.blend.k = k;
    this._fade(this.song, Math.cos(k * Math.PI / 2)); this._fade(this.blend.song, Math.sin(k * Math.PI / 2));
  }
  _fade(song, v) { const g = song.fader.gain, t = this.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.setTargetAtTime(v, t, 0.15); }
  // Stück starten und zurückgeben. level = Anfangswert des Überblendreglers (0 = stumm, für das Portal-Stück)
  _startSong(key, level = 1) {
    const def = SONGS[key];
    const S = (this._compiled ||= {})[key] ||= compile(def);
    const step = 60 / def.bpm / 2;
    // Eigener Lautstärkeregler je Stück: weich einblenden, beim Wechsel ausblenden (Crossfade statt hartem Schnitt)
    const out = this.ctx.createGain(), t0 = this.ctx.currentTime;
    out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(1, t0 + 0.6);
    const fader = this.ctx.createGain(); fader.gain.value = level; out.connect(fader); fader.connect(this.musicGain);
    let dest = out;
    if (def.echo) { // Hall/Echo für Kanal und Albtraum
      const dl = this.ctx.createDelay(1), fb = this.ctx.createGain(), wet = this.ctx.createGain(), inp = this.ctx.createGain();
      dl.delayTime.value = step * 3; fb.gain.value = 0.35; wet.gain.value = 0.5;
      inp.connect(out); inp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out); dest = inp;
    }
    // Jede Ebene hat einen eigenen Regler; Varianten blenden nur die Regler um, die Noten laufen im selben Takt weiter
    const mix = MIXES[this.mix] || MIXES.normal, layers = {};
    for (const k of Object.keys(MIXES.normal)) { const g = this.ctx.createGain(); g.gain.value = mix[k]; g.connect(k === 'drums' || k === 'boss' ? out : dest); layers[k] = g; }
    const song = { stop: false, step: 0, gain: out, fader, layers, def, S, stepLen: step, start: 0, nodes: [dest, out, fader, ...Object.values(layers)] };
    song.start = this.ctx.currentTime + 0.05;
    const schedule = () => {
      if (song.stop) return;
      const now = this.ctx.currentTime;
      // Hing der Hauptthread (Ruckler beim Einblenden eines Bereichs, Hintergrund-Tab), lägen die nächsten Noten in der Vergangenheit
      // und blieben stumm → Takt neu ansetzen, damit die Musik sofort weiterläuft statt abzubrechen.
      if (song.start + song.step * step < now + 0.02) song.start = now + 0.05 - song.step * step;
      while (song.start + song.step * step < now + 1.0 && !(def.once && song.step >= S.len)) { this._playStep(song, song.step); song.step++; }
      if (!(def.once && song.step >= S.len)) song.timer = setTimeout(schedule, 100); // once: Stück (Intro) läuft nur einmal
    };
    schedule();
    return song;
  }
  // Variante umschalten (normal, inside, water, boss). Ebenen, die neu dazukommen, werden für die schon geplante Sekunde nachgetragen.
  setMix(name) {
    if (!MIXES[name] || this.mix === name) return;
    const prev = MIXES[this.mix] || MIXES.normal; this.mix = name;
    if (!this.ctx) return;
    const t = this.ctx.currentTime, mix = MIXES[name];
    for (const sg of [this.song, this.blend?.song]) {
      if (!sg) continue; const added = new Set();
      for (const [k, g] of Object.entries(sg.layers)) {
        g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.setTargetAtTime(mix[k], t, 0.15);
        if (mix[k] > 0 && !(prev[k] > 0)) added.add(k);
      }
      if (added.size) for (let n = Math.max(0, Math.ceil((t + 0.03 - sg.start) / sg.stepLen)); n < sg.step; n++) this._playStep(sg, n, added);
    }
  }
  // Ein Achtel planen. Stücke mit A-, B- und C-Teil laufen nach FORM (music.js): jede Wiederholung ist anders arrangiert –
  // wechselnde Melodie-Instrumente, Zweitstimme, Gegenmelodie in den Pausen, Schlagzeug-Fills, C-Teil als Bridge, Finale mit Glockenspiel.
  // Bereich der Welt (0 = Hauptgebiet, sonst Zone): wechselt das Melodie-Instrument ab der nächsten geplanten Note
  setArea(k) { this.area = k; }
  _playStep(song, n, only) {
    const { def, S, layers, stepLen: step } = song, mix = MIXES[this.mix] || MIXES.normal;
    const on = k => (!only || only.has(k)) && mix[k] > 0;
    const { bar, len, mel, chord, form, secLen } = S, total = form.length * secLen;
    const k = n % total, F = form[Math.floor(k / secLen)], j = k % secLen, i = F.s * secLen + j, arr = F.arr, cycle = Math.floor(n / total);
    const b = i % bar, ch = chord[i], m = mel[i], bridge = arr === 2, rich = arr === 1 || arr === 3;
    const t = song.start + n * step + (n % 2 ? def.swing || 0 : 0), I = def.inst, f = midi => 440 * Math.pow(2, (midi - 69) / 12);
    const tone = (o, base) => base + ((ch.root + o) % 12 + 12) % 12; // Akkordton oberhalb von base
    const pick = (list, x) => list[((x % list.length) + list.length) % list.length], area = this.area || 0;
    // Melodie-Instrument: wechselt je Durchgang und je Bereich der Welt (setArea)
    const lead = bridge && def.cLead ? def.cLead : pick(def.leads || [I.lead], (arr === 3 ? 0 : arr) + area + cycle), oct = bridge ? def.cOct || 0 : 0;
    // stops: Takte mit Stop-Time – Begleitung schweigt (null) oder spielt nur einen gehaltenen Schlag auf dieser Achtel
    const stop = def.stops?.[Math.floor(i / bar)], acc = stop === undefined || stop === b, hold = stop === b ? bar - b : 0;
    // Melodie in drei Klangfarben: draußen, drinnen, unter Wasser
    if (m) {
      const mf = f(m.midi + oct), d = m.len * step;
      if (on('lead')) this._inst(lead, mf, t, d, layers.lead);
      if (on('fill') && arr === 3) this._inst(def.fillInst || 'glock', f(m.midi), t, d, layers.fill, 0.55); // Finale: Glockenspiel spielt mit
      if (on('soft')) this._inst(bridge && def.cLead ? def.cLead : I.soft || 'clarinet', mf, t, d, layers.soft);
      if (on('water')) this._inst(I.water || 'vibes', f(m.midi), t, d, layers.water);
      // Zweitstimme: nächster Akkordton mindestens eine kleine Terz darunter (Wiederholungen, Bosskampf)
      if (on('harm') && b % 2 === 0 && (rich || this.mix === 'boss' || def.harmony)) {
        let h = -1; for (const o of ch.iv) for (let oc = 48; oc <= 84; oc += 12) { const x = tone(o, oc); if (x <= m.midi - 3 && x > h) h = x; }
        if (h > 0) this._inst(I.harm || 'xylo', f(h + oct), t, Math.min(m.len, 2) * step, layers.harm, 0.7);
      }
    }
    // Gegenmelodie: schweigt die Melodie bis zum Taktende, perlt ein Akkord-Arpeggio in die Lücke
    const q = S.tail[i];
    if (on('fill') && rich && q >= 0 && b >= bar / 2) this._inst(def.fillInst || 'glock', f(tone(ch.iv[q % ch.iv.length], 72) + 12 * Math.floor(q / ch.iv.length)), t, step, layers.fill, 0.45);
    // Begleitakkorde (Offbeats, Stabs; leicht geschrummt). Im C-Teil eigenes Instrument mit längeren Akkorden.
    const comp = bridge && def.cComp ? def.cComp : I.comp, compAt = bridge && def.cComp ? [0, bar / 2] : def.comp, cLen = bridge && def.cComp ? bar / 2 : def.compLen || 0.6;
    if (on('comp') && acc && (hold || compAt.includes(b))) ch.iv.forEach((o, x) => this._inst(comp, f(tone(o, 60)), t + x * 0.007, (hold || cLen) * step, layers.comp, 0.32));
    if (on('comp') && hold) ch.iv.forEach(o => this._inst('brass', f(tone(o, 55)), t, hold * step, layers.comp, 0.6)); // Schlussakkord mit Blech
    // Bass: Grundton zwischen G2 und F#3, 'A' = Halbton unter dem nächsten Grundton; im C-Teil halbe Zeit
    const bp = bridge ? (def.bassC || [])[b] ?? (b === 0 ? 0 : b === bar / 2 ? 7 : null) : def.bass[b];
    if (on('bass') && acc && (hold || (bp !== null && bp !== undefined))) {
      const root = ((ch.root - 7) % 12 + 12) % 12 + 43, next = chord[(i + 1) % len];
      const midi = hold ? root : bp === 'A' ? ((next.root - 7) % 12 + 12) % 12 + 42 : root + bp;
      this._inst(I.bass, f(midi), t, (hold || (bridge ? bar / 2 - 0.5 : def.bassLen || 0.8)) * step, layers.bass);
    }
    if (on('bass') && def.drone && i % (bar * 2) === 0) this._tone(f(((ch.root - 7) % 12 + 12) % 12 + 31), t, step * bar * 2, 'sawtooth', 0.04, layers.bass);
    // Unter-Wasser-Ebenen: perlende Harfe und Flächenklang
    if (on('arp')) { const q = ch.iv.length, o = ch.iv[n % q]; this._inst('harp', f(tone(o, 72) + (Math.floor(n / q) % 2) * 12), t, step * 2, layers.arp, 0.5); }
    if (on('pad') && (i === 0 || chord[i - 1] !== ch)) {
      let d = 1; while (d < bar && chord[(i + d) % len] === ch) d++;
      ch.iv.forEach(o => this._inst(bridge ? 'choir' : 'pad', f(tone(o, 55)), t, d * step, layers.pad, 1.2));
    }
    // Schlagzeug: C-Teil mit eigenem (halbem) Groove, Finale mit Schellenkranz, alle acht Takte ein Fill
    const dr = bridge ? def.drumsC || { kick: [0], snare: [bar / 2], hat: [2, 6].filter(x => x < bar), shaker: [] } : def.drums, L = layers.drums, H = (kind, v, tt = t, r = 1) => this.ins.hit(kind, tt, v * 0.45, L, r);
    if (on('drums') && acc) {
      const fill = j % (bar * 8) >= bar * 8 - bar / 2 && secLen >= bar * 8, fp = (cycle + arr + Math.floor(j / (bar * 8))) % 4, q = Math.floor(b - bar / 2);
      if (j % (bar * 8) === 0 && n > 0 && (rich || bridge || cycle > 0)) H('crash', 0.35);
      if (dr.kick?.includes(b) || hold) H('kick', 0.9);
      if (hold) H('crash', 0.45);
      if (fill) {
        if (fp === 0) { H('snare', 0.3 + q * 0.12); H('snare', 0.25 + q * 0.1, t + step / 2); }
        else if (fp === 1) H(['tomH', 'tomH', 'tomM', 'tomL'][Math.min(3, q)], 0.6);
        else if (fp === 2) { if (q !== 1) H('snare', 0.5); if (q === bar / 2 - 1) H('snare', 0.4, t + step / 2); }
        else H(q % 2 ? 'clap' : 'kick', 0.6);
      } else {
        if (dr.snare?.includes(b)) H('snare', 0.55);
        if (dr.hat?.includes(b)) H(b === bar - 1 && arr === 3 ? 'ohat' : 'hat', 0.28);
        if (dr.brush?.includes(b)) H('brush', 0.4);
        if (dr.shaker?.includes(b)) H('shaker', 0.22);
        if (dr.click?.includes(b)) H('wood', 0.3, t, b % 2 ? 1.25 : 1); // Holzblock, abwechselnd hoch/tief
        if (dr.conga?.includes(b)) H(b % 2 ? 'bongo' : 'conga', 0.45);
        if (dr.cowbell?.includes(b)) H('cowbell', 0.2);
        if (dr.tamb?.includes(b) || (arr === 3 && b === bar / 2 - 1)) H('tamb', 0.3);
      }
      if (def.roll && i % (bar * 4) >= bar * 4 - 2) H('snare', 0.35, t + step / 2);
    }
    // Bosskampf: Blechbläser-Stöße und Trommelwirbel
    if (on('boss')) {
      if (b === 0 || b === 3) ch.iv.slice(0, 3).forEach(o => this._inst('brass', f(tone(o, 55)), t, step * 0.9, layers.boss, 0.5));
      if (b % 2 === 1) this.ins.hit('snare', t, 0.14, layers.boss);
      if (i % (bar * 2) >= bar * 2 - 3) this.ins.hit(['tomH', 'tomM', 'tomL'][i % (bar * 2) - (bar * 2 - 3)], t, 0.28, layers.boss);
    }
  }
  // Instrumente: siehe instruments.js
  _inst(kind, f, t, dur, dest, vol = 1) { this.ins.play(kind, f, t, dur, dest, vol); }
  get ins() { return this._ins ||= new Instruments(this.ctx); }
  _drumNoise(t, dur, vol, dest = this.musicGain) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(dest); s.start(t);
  }
  // Kurzer, heller Klick (Zähne)
  _click(t, vol, freq = 3200) {
    const n = Math.floor(this.ctx.sampleRate * 0.025), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 2; g.gain.value = vol;
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
    if (this.blend) { this._stopSong(this.blend.song); this.blend = null; }
    if (!this.song) return;
    this._stopSong(this.song); this.song = null;
  }
  _stopSong(sg) {
    const t = this.ctx.currentTime; sg.stop = true; clearTimeout(sg.timer);
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
  // Gebrabbel beim Sprechen (wie in Banjo-Kazooie): pro Silbe ein kurzer Ton, der durch zwei Formantfilter läuft.
  // v = Stimme aus dialog.js, step = Halbtöne über/unter der Grundstimme, t = Startzeit (für Offline-Hörproben).
  blub(v, vowel = 'a', step = 0, loud = 1, t = null) {
    if (!this.ctx) return; const c = this.ctx; t ??= c.currentTime + 0.005;
    const F = FORMANTS[vowel] || FORMANTS.a, dur = v.dur * (0.85 + Math.random() * 0.3), f0 = v.base * Math.pow(2, step / 12);
    const o = c.createOscillator(); o.type = v.wave || 'sawtooth';
    // Tonhöhe kippt am Silbenanfang kurz von oben (oder unten) auf den Zielton: das macht das „Blubb“
    o.frequency.setValueAtTime(f0 * (1 + (v.slide ?? 0.15)), t); o.frequency.exponentialRampToValueAtTime(f0, t + dur * 0.5);
    if (v.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = v.vibRate || 9; lg.gain.value = f0 * v.vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const out = c.createGain(), vol = 0.16 * loud * (v.vol ?? 1);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + 0.012); out.gain.setValueAtTime(vol, t + dur * 0.45); out.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const fs = v.formant || 1;
    [[F[0], 4, 1.6], [F[1], 7, 0.9]].forEach(([f, q, g]) => { const bp = c.createBiquadFilter(), gg = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = f * fs; bp.Q.value = q; gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(out); });
    const dry = c.createGain(); dry.gain.value = v.dry ?? 0.18; o.connect(dry); dry.connect(out);
    out.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.05);
  }

  // ---- Pfoten: Schritte, Absprung und Landung je nach Untergrund (surface.js) ----
  // Gefiltertes Rauschen aus einem gemeinsamen Puffer (zufälliger Ausschnitt): f = Filterfrequenz, f1 = Ziel für einen Filter-Sweep
  _burst(t, dur, vol, type, f, q = 1, f1 = 0) {
    const c = this.ctx;
    if (!this._nb) { const n = c.sampleRate * 2; this._nb = c.createBuffer(1, n, c.sampleRate); const d = this._nb.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this._nb; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q; if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.004, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.sfxGain); s.start(t, Math.random() * 1.8, dur + 0.02);
  }
  // Ein Pfotenaufsatz. k = Lautstärke (1 = normaler Schritt), heavy 0..1 = wuchtiger und länger (Landung), r = Tonhöhe
  _paw(surf, t, k = 1, heavy = 0, r = 1) {
    k *= PAW_GAIN[surf] ?? 1;
    const L = 1 + heavy * 1.5, B = this._burst.bind(this), T = (f, dur, v, type = 'sine', sl = 0) => this._tone(f * r, t, dur * L, type, v * k, null, sl * r), rnd = () => Math.random();
    switch (surf) {
      case 'grass': B(t, 0.07 * L, 0.09 * k, 'bandpass', 2600 * r, 0.7); B(t + 0.015 + rnd() * 0.02, 0.035 * L, 0.05 * k, 'highpass', 5000 * r); break; // Halme rascheln
      case 'leaves': for (let i = 0; i < 3 + heavy * 3; i++) B(t + rnd() * 0.07 * L, 0.025, 0.08 * k, 'bandpass', (2000 + rnd() * 2500) * r, 1.2); break; // Laub knistert
      case 'dirt': B(t, 0.06 * L, 0.14 * k, 'lowpass', 700 * r); T(110, 0.05, 0.06, 'sine', -40); break;
      case 'sand': B(t, 0.09 * L, 0.08 * k, 'bandpass', 2200 * r, 1.2, 1500 * r); for (let i = 0; i < 4; i++) B(t + rnd() * 0.07 * L, 0.012, 0.035 * k, 'highpass', 4500 * r); break; // Knirschen
      case 'snow': B(t, 0.1 * L, 0.1 * k, 'bandpass', 1300 * r, 2.5, 900 * r); B(t + 0.03, 0.05, 0.05 * k, 'lowpass', 2500 * r); break;
      case 'wood': T(180, 0.07, 0.15, 'sine', -60); T(420, 0.04, 0.035, 'triangle'); B(t, 0.015, 0.06 * k, 'bandpass', 3500 * r, 3); break; // hohles Klopfen + Krallen
      case 'stone': B(t, 0.012, 0.1 * k, 'bandpass', 3000 * r, 3); B(t + 0.008 + rnd() * 0.01, 0.01, 0.06 * k, 'bandpass', 3400 * r, 3); B(t, 0.035 * L, 0.06 * k, 'lowpass', 400 * r); break; // Krallen klicken
      case 'tile': B(t, 0.01, 0.12 * k, 'bandpass', 4200 * r, 4); B(t + 0.012 + rnd() * 0.01, 0.01, 0.08 * k, 'bandpass', 4800 * r, 4); T(220, 0.03, 0.04, 'sine', -60); break;
      case 'carpet': B(t, 0.06 * L, 0.1 * k, 'lowpass', 350 * r); T(90, 0.04, 0.035, 'sine', -30); break; // dumpf
      case 'metal': [[640, 0.12, 0.035], [1530, 0.08, 0.022], [2470, 0.05, 0.014]].forEach(([f, d, v]) => T(f * (0.97 + rnd() * 0.06), d * (1 + heavy * 2), v)); B(t, 0.01, 0.06 * k, 'bandpass', 5000 * r, 3); break; // Blech klingt nach
      case 'water': B(t, 0.12 * L, 0.13 * k, 'bandpass', 1100 * r, 1.5, 380 * r); if (rnd() < 0.6 || heavy) T(300 + rnd() * 200, 0.06, 0.05, 'sine', 600); break; // Platsch + Blubb
      default: B(t, 0.05 * L, 0.1 * k, 'lowpass', 900 * r);
    }
  }
  _pawsOff() { return !this.ctx || (this.vol && this.vol[1] <= 0); }
  // Schritt einer Pfote (synchron zur Laufanimation). speed 0..1+, hind = Hinterpfote (etwas leiser und tiefer)
  step(surf, speed = 1, hind = false, delay = 0) {
    if (this._pawsOff()) return;
    this._paw(surf, this.ctx.currentTime + 0.003 + delay, (0.5 + 0.5 * Math.min(1.2, speed)) * (hind ? 0.75 : 1), 0, (hind ? 0.88 : 1) * (0.92 + Math.random() * 0.16));
  }
  // Absprung: beide Hinterpfoten stoßen sich ab
  jumpOff(surf, t = null) {
    if (this._pawsOff()) return; t ??= this.ctx.currentTime + 0.003;
    this._paw(surf, t, 1.3, 0.3, 0.9); this._paw(surf, t + 0.018, 1.1, 0.3, 0.85);
  }
  // Landung: erst Vorder-, dann Hinterpfoten, dazu ein Plumps; impact = Fallgeschwindigkeit
  landOn(surf, impact = 8, t = null) { // t = Startzeit (für Offline-Hörproben)
    if (this._pawsOff()) return; t ??= this.ctx.currentTime + 0.003; const w = Math.min(1, impact / 22), k = 1.1 + w * 1.6;
    this._paw(surf, t, k, w); this._paw(surf, t + 0.014, k * 0.8, w, 0.95); this._paw(surf, t + 0.06, k * 0.9, w, 0.85); this._paw(surf, t + 0.075, k * 0.7, w, 0.8);
    const soft = surf === 'carpet' || surf === 'sand' || surf === 'snow' || surf === 'grass';
    this._tone(soft ? 95 : 130, t, 0.1 + w * 0.12, 'sine', (0.05 + w * 0.2) * (surf === 'water' ? 0.4 : 1), null, soft ? -45 : -70); // Körper-Plumps
    if (surf === 'water') this._burst(t, 0.25 + w * 0.3, 0.1 + w * 0.15, 'bandpass', 1400, 0.8, 300); // Spritzer
    if (surf === 'sand' || surf === 'dirt') this._burst(t + 0.02, 0.15 + w * 0.2, 0.04 + w * 0.06, 'lowpass', 1500, 0.7, 500); // rieselt
  }

  // vol < 1: leiser (Geräusche aus der Ferne), delay: später (Echo). Dafür läuft der Effekt kurz über einen eigenen Regler.
  sfx(name, vol = 1, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay, main = this.sfxGain;
    if (vol !== 1) { const g = this.ctx.createGain(); g.gain.value = Math.max(0, vol); g.connect(main); this.sfxGain = g; }
    try { this._sfx(name, t); } finally { this.sfxGain = main; }
  }
  // Gefilterter Ton für Tierstimmen und Maschinen (scoop = von unten/oben anschleifen, vib = Vibrato)
  _buzz(f, t, dur, type, vol, dest, cut, o = {}) {
    const osc = this.ctx.createOscillator(), fl = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    osc.type = type; fl.type = 'lowpass'; fl.frequency.value = cut;
    if (o.scoop) { osc.frequency.setValueAtTime(f * o.scoop, t); osc.frequency.exponentialRampToValueAtTime(f, t + 0.06); } else osc.frequency.value = f;
    if (o.vib) { const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = f * o.vib; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(fl); fl.connect(g); g.connect(dest); osc.start(t); osc.stop(t + dur + 0.05);
  }
  // Ein Ton auf einem Instrument der Musik (Bodenklavier, Glockenspiel …), Halbtöne über C5
  note(semi, inst = 'marimba', vol = 1.4) { if (this.ctx) this._inst(inst, 523.25 * Math.pow(2, semi / 12), this.ctx.currentTime, 0.5, this.sfxGain, vol); }
  _sfx(name, t) {
    const S = this.sfxGain;
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
      case 'poof': this._noise(t, 0.12, 0.2); this._tone(420, t, 0.12, 'square', 0.12, null, 500); this._tone(990, t + 0.1, 0.12, 'triangle', 0.12); break;
      case 'ko': this._tone(90, t, 1.2, 'sine', 0.4, null, -70); this._noise(t, 0.4, 0.3); break;
      case 'warp': this._noise(t, 0.9, 0.18); this._tone(220, t, 0.9, 'triangle', 0.14, null, 900); [0, 4, 7, 12].forEach((n, i) => this._tone(this._note(n + 12, 262), t + 0.15 + i * 0.12, 0.25, 'sine', 0.1)); break;
      case 'portal': [0, 7, 12].forEach((s, i) => this._tone(this._note(s, 262), t + i * 0.06, 0.4, 'sine', 0.2)); break;
      // Fähigkeiten
      case 'whirl': this._noise(t, 0.45, 0.18); this._tone(260, t, 0.45, 'triangle', 0.12, null, 520); break;
      case 'tornado': this._noise(t, 0.8, 0.3); this._tone(140, t, 0.8, 'sawtooth', 0.14, null, 700); break;
      case 'woof': this._tone(180, t, 0.16, 'sawtooth', 0.32, null, -90); this._noise(t, 0.12, 0.25); this._tone(170, t + 0.2, 0.18, 'sawtooth', 0.28, null, -80); break;
      case 'stomp': this._tone(70, t, 0.35, 'sine', 0.45, null, -40); this._noise(t, 0.25, 0.35); break;
      case 'dig': this._noise(t, 0.12, 0.2); this._noise(t + 0.18, 0.12, 0.2); this._noise(t + 0.36, 0.15, 0.22); break;
      case 'break': this._noise(t, 0.3, 0.35); this._tone(240, t, 0.15, 'square', 0.12, null, -180); break;
      case 'squeak': this._tone(820, t, 0.07, 'square', 0.12, null, 700); this._tone(1450, t + 0.06, 0.11, 'square', 0.1, null, -500); this._tone(1100, t, 0.17, 'sine', 0.08, null, 300); break; // Quietsche-Spielzeug
      case 'pop': this._click(t, 0.9); this._tone(380, t, 0.12, 'sine', 0.3, null, 900); this._tone(1200, t + 0.1, 0.35, 'sine', 0.07, null, -700); break; // Gemüse ploppt aus dem Beet
      case 'bonk': this._tone(150, t, 0.3, 'sine', 0.45, null, -70); this._tone(300, t + 0.02, 0.18, 'triangle', 0.15, null, 260); this._noise(t, 0.08, 0.2); break; // Kürbis
      case 'click': this._click(t, 0.8); this._tone(660, t, 0.08, 'square', 0.12); break;
      case 'honk': this._tone(392, t, 0.25, 'square', 0.16); this._tone(494, t, 0.25, 'square', 0.12); this._tone(392, t + 0.3, 0.3, 'square', 0.16); this._tone(494, t + 0.3, 0.3, 'square', 0.12); break;
      // Intro: das Y löst sich (Lotsenpfeife abwärts) und schlägt irgendwo unten auf
      case 'slidewhistle': { const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.85); lfo.frequency.value = 7; lg.gain.value = 18;
        lfo.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.04); g.gain.setValueAtTime(0.16, t + 0.7); g.gain.linearRampToValueAtTime(0, t + 0.9);
        o.connect(g); g.connect(this.sfxGain); o.start(t); lfo.start(t); o.stop(t + 0.95); lfo.stop(t + 0.95); break; }
      case 'plonk': this._tone(110, t, 0.4, 'sine', 0.45, null, -60); this._noise(t, 0.18, 0.3); this._click(t + 0.02, 0.6); this._tone(520, t + 0.12, 0.12, 'triangle', 0.1, null, -200); break;
      case 'bell': [0, 12, 7].forEach((s, i) => this._tone(this._note(s, 523), t + i * 0.02, 1.2, 'sine', 0.18)); break;
      // Spielereien in den Welten: Uhren, Feuer, Tiere, Maschinen …
      case 'tick': this._click(t, 0.4, 4200); break;
      case 'tock': this._click(t, 0.4, 2500); break;
      case 'crackle': for (let i = 0; i < 3; i++) this._click(t + Math.random() * 0.45, 0.15 + Math.random() * 0.4, 1200 + Math.random() * 2600); this._noise(t, 0.5, 0.05, 500, 'lowpass', true); break;
      case 'cuckoo': [[784, 0], [622, 0.26], [784, 0.75], [622, 1.01]].forEach(([f, d]) => this._tone(f, t + d, 0.22, 'triangle', 0.22)); break;
      case 'gong': [[0, 0.24], [12, 0.08], [19, 0.05], [24, 0.03]].forEach(([s, v]) => this._tone(this._note(s, 98), t, 2.8, 'sine', v)); break;
      case 'chime': [[0, 0.16], [7, 0.05], [12, 0.06]].forEach(([s, v]) => this._tone(this._note(s, 988), t, 1.3, 'sine', v)); break;
      case 'rustle': for (let i = 0; i < 5; i++) this._noise(t + i * 0.07, 0.13, 0.1, 2400, 'highpass'); break;
      case 'plop': this._tone(240, t, 0.1, 'sine', 0.28, null, -130); this._noise(t, 0.05, 0.08, 900); break;
      case 'tonk': this._tone(900, t, 0.07, 'triangle', 0.22, null, -300); this._tone(1350, t + 0.06, 0.09, 'triangle', 0.12); break;
      case 'quack': [0, 0.2].forEach(d => this._buzz(270, t + d, 0.15, 'sawtooth', 0.25, S, 1200, { scoop: 1.3 })); break;
      case 'moo': this._buzz(140, t, 1.1, 'sawtooth', 0.3, S, 520, { scoop: 0.75, vib: 0.02 }); break;
      case 'cluck': [0, 0.11, 0.2, 0.44].forEach((d, i) => this._tone(i === 3 ? 950 : 640, t + d, 0.07, 'triangle', 0.15, null, -280)); break;
      case 'meow': this._tone(480, t, 0.2, 'triangle', 0.16, null, 280); this._tone(760, t + 0.17, 0.4, 'triangle', 0.16, null, -360); break;
      case 'chirp': [0, 0.13, 0.3].forEach((d, i) => this._tone(2600 + i * 300, t + d, 0.07, 'sine', 0.09, null, 1400)); break;
      case 'frog': [0, 0.17].forEach(d => this._buzz(150, t + d, 0.14, 'square', 0.16, S, 700, { scoop: 1.2 })); break;
      case 'cricket': for (let i = 0; i < 4; i++) this._tone(4300, t + i * 0.045, 0.025, 'sine', 0.05); break;
      case 'drip': this._tone(850, t, 0.09, 'sine', 0.15, null, 950); break;
      case 'bubble': this._tone(330 + Math.random() * 220, t, 0.1, 'sine', 0.13, null, 520); break;
      case 'hum': this._tone(100, t, 1.25, 'sine', 0.07); this._tone(200, t, 1.25, 'sine', 0.025); break;
      case 'wave': this._noise(t, 2.4, 0.16, 650, 'lowpass', true); break;
      case 'gull': this._tone(1300, t, 0.3, 'sawtooth', 0.05, null, -520); this._tone(1240, t + 0.36, 0.22, 'sawtooth', 0.045, null, -460); break;
      case 'horn': [98, 147].forEach(f => this._buzz(f, t, 1.9, 'sawtooth', 0.24, S, 700, { scoop: 0.9 })); break;
      case 'toot': [0, 4].forEach(s => this._buzz(this._note(s, 587), t, 0.9, 'square', 0.06, S, 2400, { vib: 0.01 })); break;
      case 'whistle': this._buzz(2600, t, 0.55, 'square', 0.05, S, 4500, { vib: 0.05 }); break;
      case 'slurp': [0, 0.17, 0.34].forEach(d => { this._tone(300, t + d, 0.1, 'sine', 0.16, null, 520); this._noise(t + d, 0.04, 0.06, 1500); }); break;
      case 'brrr': this._buzz(62, t, 1.1, 'sawtooth', 0.14, S, 900, { vib: 0.3 }); this._noise(t, 1.0, 0.05, 3000); break;
      case 'ring': for (let i = 0; i < 8; i++) this._tone(i % 2 ? 1100 : 880, t + i * 0.05, 0.05, 'square', 0.06); break;
      case 'gurgle': for (let i = 0; i < 6; i++) this._tone(250 + Math.random() * 300, t + i * 0.09, 0.08, 'sine', 0.12, null, 300); break;
      case 'boing': this._tone(150, t, 0.5, 'sine', 0.28, null, 450); this._tone(300, t, 0.3, 'triangle', 0.06, null, 600); break;
      case 'sizzle': this._noise(t, 0.7, 0.06, 5000, 'highpass', true); break;
      case 'flap': for (let i = 0; i < 5; i++) this._noise(t + i * 0.08, 0.06, 0.12, 1100); break;
      case 'splish': this._noise(t, 0.22, 0.16, 2500); this._tone(520, t, 0.12, 'sine', 0.1, null, -320); break;
      case 'creak': this._buzz(85, t, 0.7, 'sawtooth', 0.12, S, 1400, { vib: 0.09 }); break;
      case 'snore': this._noise(t, 1.1, 0.08, 400, 'lowpass', true); this._buzz(70, t, 1.1, 'sawtooth', 0.05, S, 300); break;
      case 'sneeze': this._tone(620, t, 0.3, 'triangle', 0.12, null, 380); this._noise(t + 0.34, 0.28, 0.35, 2500, 'highpass'); this._tone(520, t + 0.34, 0.18, 'sawtooth', 0.12, null, -300); break;
      case 'giggle': [0, 0.09, 0.18, 0.27].forEach((d, i) => this._tone(880 - i * 60, t + d, 0.07, 'triangle', 0.1, null, 200)); break;
    }
  }
}
