// Prozedurale Chiptune-Musik und Effekte (Banjo-Kazooie-Stimmung: hüpfende Bässe, Xylophon-Melodie, Holzbläser-Antwort).
// Kein Asset nötig – alles aus Oszillatoren.

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
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.7; this.sfxGain.connect(this.master);
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
  // theme: { scale, root, bpm, swing, mood }
  playTheme(theme) {
    if (!this.ctx) return;
    this.stopMusic();
    const seed = theme.seed || 1;
    let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const scale = SCALES[theme.scale || 'major'];
    const root = theme.root || 220, bpm = theme.bpm || 128;
    const beat = 60 / bpm, step = beat / 2;
    // 16-Step-Melodie + Bassmuster generieren
    const mel = [], bass = [];
    let deg = 0;
    for (let i = 0; i < 32; i++) {
      deg += Math.round((rnd() - 0.5) * 4); deg = Math.max(-3, Math.min(10, deg));
      mel.push(rnd() < 0.8 ? deg : null);
      bass.push([0, 4, 3, 5][Math.floor(i / 8) % 4]);
    }
    const degFreq = (d, oct = 0) => this._note(scale[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct), root);
    const song = { stop: false, step: 0 };
    this.song = song;
    const start = this.ctx.currentTime + 0.05;
    const schedule = () => {
      if (song.stop) return;
      const now = this.ctx.currentTime;
      while (start + song.step * step < now + 0.4) {
        const i = song.step % 32, t = start + song.step * step + (song.step % 2 ? (theme.swing || 0.06) : 0);
        // Melodie (Xylophon-artig)
        if (mel[i] !== null) this._tone(degFreq(mel[i], 1), t, step * 0.9, 'triangle', 0.22, this.musicGain);
        if (mel[i] !== null && i % 4 === 0) this._tone(degFreq(mel[i], 2), t, step * 0.5, 'sine', 0.08, this.musicGain);
        // Bass hüpfend
        if (song.step % 2 === 0) this._tone(degFreq(bass[i], -1), t, step * 0.8, 'square', 0.12, this.musicGain);
        // Gegenstimme
        if (i % 8 === 6 && mel[i] !== null) this._tone(degFreq(mel[i] + 2, 0), t, step * 1.5, 'sawtooth', 0.05, this.musicGain);
        // Schlagzeug
        if (song.step % 4 === 0) this._tone(80, t, 0.12, 'sine', 0.3, this.musicGain, -60);
        if (song.step % 4 === 2) this._drumNoise(t, 0.08, 0.12);
        if (song.step % 2 === 1) this._drumNoise(t, 0.03, 0.04);
        song.step++;
      }
      song.timer = setTimeout(schedule, 120);
    };
    schedule();
  }
  _drumNoise(t, dur, vol) {
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(this.musicGain); s.start(t);
  }
  stopMusic() { if (this.song) { this.song.stop = true; clearTimeout(this.song.timer); this.song = null; } }

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
