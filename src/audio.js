// Prozedurale Chiptune-Musik und Effekte (Banjo-Kazooie-Stimmung: hüpfende Bässe, Xylophon-Melodie, Holzbläser-Antwort).
// Kein Asset nötig – alles aus Oszillatoren.

// Musikstile je Welt. motif: Tonstufen pro Schritt (null = Pause) über 2 Takte; bass: Stufe relativ zum Akkord je Schritt eines Takts.
const _ = null;
const STYLES = {
  garden: { motif: [0, _, 2, 4, 7, _, 4, _, 5, 4, 2, _, 4, _, _, _], lead: 'banjo', harm: 'xylo', bass: [0, _, 4, _, 0, _, 4, _], bassInst: 'upright', prog: [0, 3, 4, 0], drums: { kick: [0, 4], hat: [2, 6], click: [1, 3, 5, 7] } },
  kitchen: { motif: [4, 4, _, 2, 4, _, 7, _, 5, _, 4, 2, 0, _, 2, _], lead: 'marimba', bass: [0, 2, 4, 5, 4, 2, 0, -1], bassInst: 'upright', bassLen: 0.6, prog: [0, 0, 3, 4], drums: { kick: [0, 4], snare: [2, 6], click: [1, 3, 5, 7] } },
  street: { motif: [0, 0, 4, _, 4, 5, 4, 2, 0, _, 2, 4, _, 2, 0, _], lead: 'lead', harm: 'xylo', bass: [0, 7, 0, 7, 0, 7, 0, 7], bassLen: 0.45, prog: [0, 5, 3, 4], drums: { kick: [0, 3, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] } },
  office: { motif: [4, _, _, 6, 5, _, 4, _, 2, _, _, _, 1, 2, 4, _], lead: 'epiano', chords: [0, 3], chordInst: 'epiano', chordLen: 2, seventh: true, bass: [0, _, 2, _, 4, _, 5, _], bassInst: 'upright', prog: [1, 4, 0, 0], swing: 0.1, drums: { hat: [0, 2, 3, 4, 6, 7], kick: [0] } },
  bbq: { motif: [0, 2, 4, _, 4, _, 2, 4, 5, _, 4, _, 2, _, 0, _], lead: 'slide', harm: 'banjo', bass: [0, _, 4, _, 0, _, 4, _], bassInst: 'tuba', prog: [0, 0, 4, 0], drums: { kick: [0, 4], snare: [2, 6], click: [1, 3, 5, 7] } },
  harbor: { bar: 6, motif: [4, _, 4, 4, _, 2, 0, _, 2, 4, _, _], lead: 'accordion', bass: [0, _, _, 4, _, _], bassInst: 'tuba', chords: [1, 4], chordInst: 'accordion', chordLen: 1, prog: [0, 4, 0, 4], drums: { kick: [0], snare: [3], hat: [1, 2, 4, 5] } },
  village: { motif: [0, 2, 4, 2, 4, 7, 4, _, 5, 4, 2, 4, 2, 0, -3, _], lead: 'flute', harm: 'accordion', bass: [0, _, 4, _, 0, _, 4, _], bassInst: 'tuba', chords: [2, 6], chordInst: 'pad', chordLen: 1, prog: [0, 4, 4, 0], drums: { kick: [0, 4], snare: [2, 6] } },
  sewer: { motif: [0, _, _, 2, _, _, 1, _, _, _, -1, _, 0, _, _, _], lead: 'pluck', echo: true, drone: true, bass: [0, _, _, _, -1, _, _, _], bassInst: 'subbass', bassLen: 3, prog: [0, 0, 5, 4], drums: { kick: [0], click: [3, 6] } },
  chase: { motif: [0, 2, 3, 4, 3, 2, 0, _, 7, 6, 4, 3, 4, _, 2, _], lead: 'lead', bass: [0, 0, 7, 0, 0, 7, 0, 7], bassLen: 0.4, prog: [0, 5, 3, 4], drums: { kick: [0, 2, 4, 6], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], roll: true } },
  nightmare: { bar: 6, motif: [7, _, 6, 4, _, _, 3, _, 1, 0, _, _], lead: 'musicbox', echo: true, drone: true, bass: [0, _, _, 1, _, _], bassInst: 'subbass', bassLen: 2, prog: [0, 1, 0, 5], drums: { kick: [0], click: [2, 5] } },
};

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  mixo: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  spooky: [0, 1, 4, 6, 7, 8, 11],
};

export class AudioEngine {
  constructor() { this.ctx = null; this.song = null; this.enabled = true; }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
    this.lowpass = this.ctx.createBiquadFilter(); this.lowpass.type = 'lowpass'; this.lowpass.frequency.value = 20000; // unter Wasser dumpf
    this.master.connect(this.lowpass); this.lowpass.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.7; this.sfxGain.connect(this.master);
  }
  underwater(on) {
    if (!this.ctx) return; const t = this.ctx.currentTime; this.lowpass.frequency.cancelScheduledValues(t);
    this.lowpass.frequency.setTargetAtTime(on ? 650 : 20000, t, on ? 0.08 : 0.2); if (on) this.sfx('splash');
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

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
  // theme: { style, scale, root, bpm, swing, seed }. Jeder Stil hat eigenes Motiv, Instrumente, Bass und Rhythmus.
  playTheme(theme) {
    if (!this.ctx) return;
    this.stopMusic();
    const st = STYLES[theme.style] || STYLES.garden;
    let s = theme.seed || 1; const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const scale = SCALES[theme.scale || 'major'];
    const root = theme.root || 220, bpm = theme.bpm || 128;
    const bar = st.bar || 8, step = 60 / bpm / 2;
    const len = bar * 8; // 8 Takte: A A' B A
    const motif = st.motif, mel = [];
    for (let i = 0; i < len; i++) {
      const k = i % (bar * 2), part = Math.floor(i / (bar * 2));
      let d = motif[k % motif.length];
      if (part === 1 && d !== null && k >= bar) d += [1, 2, -1][Math.floor(rnd() * 3)]; // Antwort-Phrase
      if (part === 2 && d !== null) d = d + 2 + (rnd() < 0.3 ? 1 : 0);                  // B-Teil höher
      if (i >= len - bar) d = k % bar === 0 ? 0 : (k % bar < bar / 2 ? d : null);       // Schlusskadenz
      mel.push(d);
    }
    const prog = st.prog || [0, 3, 4, 0];
    const degFreq = (d, oct = 0) => this._note(scale[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct), root);
    const out = this.musicGain;
    let dest = out;
    if (st.echo) { // Hall/Echo für Kanal und Albtraum
      const dl = this.ctx.createDelay(1), fb = this.ctx.createGain(), wet = this.ctx.createGain(), inp = this.ctx.createGain();
      dl.delayTime.value = step * 3; fb.gain.value = 0.35; wet.gain.value = 0.5;
      inp.connect(out); inp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out); dest = inp;
    }
    const song = { stop: false, step: 0, nodes: [dest] };
    this.song = song;
    const start = this.ctx.currentTime + 0.05;
    const schedule = () => {
      if (song.stop) return;
      const now = this.ctx.currentTime;
      while (start + song.step * step < now + 0.4) {
        const i = song.step % len, b = i % bar, chord = prog[Math.floor(i / bar) % prog.length];
        const t = start + song.step * step + (song.step % 2 ? (theme.swing ?? st.swing ?? 0.03) : 0);
        const m = mel[i];
        if (m !== null && m !== undefined) this._inst(st.lead, degFreq(m + (st.leadOct || 0), 1), t, step, dest);
        if (st.harm && m !== null && m !== undefined && b % (bar / 2) === 0) this._inst(st.harm, degFreq(m - 2, 1), t, step * 2, dest);
        // Akkorde
        if (st.chords && st.chords.includes(b)) [0, 2, 4, st.seventh ? 6 : 7].forEach(o => this._inst(st.chordInst || 'pad', degFreq(chord + o, 0), t, step * (st.chordLen || 1.5), dest, 0.35));
        // Bass
        const bp = st.bass[b]; if (bp !== null && bp !== undefined) this._inst(st.bassInst || 'bass', degFreq(chord + bp, -1), t, step * (st.bassLen || 0.8), dest);
        // Drone (Kanal, Albtraum)
        if (st.drone && i % (bar * 2) === 0) this._tone(degFreq(0, -2), t, step * bar * 2, 'sawtooth', 0.04, dest);
        // Schlagzeug
        const dr = st.drums;
        if (dr.kick && dr.kick.includes(b)) this._tone(85, t, 0.14, 'sine', 0.3, out, -60);
        if (dr.snare && dr.snare.includes(b)) this._drumNoise(t, 0.09, 0.12);
        if (dr.hat && dr.hat.includes(b)) this._drumNoise(t, 0.025, 0.035);
        if (dr.click && dr.click.includes(b)) this._tone(1800, t, 0.03, 'square', 0.04, out);
        if (dr.roll && i % (bar * 4) >= bar * 4 - 2) this._drumNoise(t + step / 2, 0.05, 0.08);
        song.step++;
      }
      song.timer = setTimeout(schedule, 120);
    };
    schedule();
  }
  // Instrumente aus Oszillatoren
  _inst(kind, f, t, step, dest, vol = 1) {
    switch (kind) {
      case 'banjo': this._tone(f, t, step * 0.7, 'square', 0.09 * vol, dest); this._tone(f * 2, t, step * 0.3, 'triangle', 0.05 * vol, dest); break;
      case 'marimba': this._tone(f, t, step * 0.6, 'sine', 0.24 * vol, dest); this._tone(f * 4, t, 0.04, 'sine', 0.06 * vol, dest); break;
      case 'xylo': this._tone(f, t, step * 0.9, 'triangle', 0.22 * vol, dest); break;
      case 'lead': this._tone(f, t, step * 0.85, 'square', 0.1 * vol, dest); break;
      case 'epiano': this._tone(f, t, step * 1.8, 'sine', 0.14 * vol, dest); this._tone(f * 2, t, step * 0.6, 'sine', 0.04 * vol, dest); break;
      case 'slide': this._tone(f * 0.94, t, step * 0.9, 'sawtooth', 0.06 * vol, dest, f * 0.06); break;
      case 'accordion': this._filtered(f, t, step * 0.95, 'sawtooth', 0.08 * vol, dest, 1800); this._filtered(f * 1.005, t, step * 0.95, 'sawtooth', 0.05 * vol, dest, 1800); break;
      case 'flute': this._vib(f, t, step * 0.95, 0.13 * vol, dest); break;
      case 'pluck': this._tone(f, t, step * 0.5, 'triangle', 0.2 * vol, dest); this._tone(f * 1.01, t, step * 0.4, 'square', 0.03 * vol, dest); break;
      case 'musicbox': this._tone(f * 2, t, step * 2.5, 'sine', 0.14 * vol, dest); this._tone(f * 2.02, t, step * 2, 'sine', 0.05 * vol, dest); break;
      case 'pad': this._filtered(f, t, step, 'sawtooth', 0.03 * vol, dest, 900); break;
      case 'tuba': this._filtered(f, t, step, 'square', 0.16 * vol, dest, 500); break;
      case 'bass': this._tone(f, t, step, 'square', 0.11 * vol, dest); break;
      case 'subbass': this._tone(f, t, step, 'sine', 0.3 * vol, dest); break;
      case 'upright': this._tone(f, t, step, 'triangle', 0.3 * vol, dest); break;
    }
  }
  _filtered(f, t, dur, type, vol, dest, cut) {
    const o = this.ctx.createOscillator(), fl = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  _vib(f, t, dur, vol, dest) {
    const o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5.5; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  _drumNoise(t, dur, vol) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(this.musicGain); s.start(t);
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
  stopMusic() { if (this.song) { const sg = this.song; sg.stop = true; clearTimeout(sg.timer); setTimeout(() => sg.nodes.forEach(n => n.disconnect()), 1500); this.song = null; } }

  // ---- Effekte -------------------------------------------------------
  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump': this._tone(300, t, 0.18, 'square', 0.15, null, 300); break;
      case 'jump2': this._tone(400, t, 0.2, 'square', 0.15, null, 500); break;
      case 'land': this._noise(t, 0.06, 0.15); break;
      case 'collect': this._tone(880, t, 0.08, 'square', 0.15); this._tone(1320, t + 0.08, 0.14, 'square', 0.15); break;
      case 'big': [0, 4, 7, 12, 16].forEach((s, i) => this._tone(this._note(s, 440), t + i * 0.08, 0.3, 'triangle', 0.2)); break;
      case 'splash': this._noise(t, 0.35, 0.3); this._tone(600, t, 0.2, 'sine', 0.12, null, -450); break;
      case 'chomp': // Zähne schnappen zu: zwei Klacks + dumpfer Biss
        this._click(t, 0.5); this._click(t + 0.07, 0.7); this._tone(180, t + 0.06, 0.12, 'sine', 0.3, null, -110); this._noise(t + 0.06, 0.05, 0.12); break;
      case 'bark': this._tone(220, t, 0.08, 'sawtooth', 0.25, null, -120); this._noise(t, 0.08, 0.2); break;
      case 'hit': this._tone(150, t, 0.25, 'sawtooth', 0.3, null, -100); this._noise(t, 0.15, 0.25); break;
      case 'hurt': this._tone(500, t, 0.3, 'square', 0.2, null, -400); break;
      case 'drawer': this._noise(t, 0.12, 0.1); this._tone(200, t, 0.1, 'triangle', 0.15, null, 100); break;
      case 'sniff': this._noise(t, 0.1, 0.08); this._noise(t + 0.15, 0.1, 0.08); break;
      case 'win': [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => this._tone(this._note(s, 330), t + i * 0.1, 0.35, 'square', 0.18)); break;
      case 'lose': [7, 4, 0, -5].forEach((s, i) => this._tone(this._note(s, 330), t + i * 0.2, 0.45, 'sawtooth', 0.15)); break;
      case 'vacuum': this._tone(110, t, 0.5, 'sawtooth', 0.12, null, 30); break;
      case 'ko': this._tone(90, t, 1.2, 'sine', 0.4, null, -70); this._noise(t, 0.4, 0.3); break;
      case 'portal': [0, 7, 12].forEach((s, i) => this._tone(this._note(s, 262), t + i * 0.06, 0.4, 'sine', 0.2)); break;
    }
  }
}
