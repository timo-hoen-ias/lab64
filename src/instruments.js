// Instrumente des Soundtracks.
// Gezupftes und Geschlagenes (Banjo, Gitarre, Harfe, Marimba, Glocken, Steel-Drum, Schlagzeug …) wird beim ersten Gebrauch
// einmal je Oktave in JavaScript berechnet – Karplus-Strong-Saiten, Modalsynthese, FM – und danach als Sample abgespielt.
// Gehaltene Töne (Akkordeon, Orgel, Klarinette, Blech, Chor …) entstehen live aus Oszillatoren mit eigenen Wellenformen und Filtern.

const SR = 32000; // Abtastrate der berechneten Samples: spart Speicher, reicht für Musik

// ---- Klangberechnung ----------------------------------------------------
// Saite (Karplus-Strong): Rauschen läuft durch eine Verzögerung mit Tiefpass. S = Dämpfung der Höhen (0.5 = dunkel), smooth = weicherer Anschlag
function string(f, sec, { decay = 0.996, S = 0.5, smooth = 0, pick = 0.2, twang = 0 }) {
  const n = Math.round(SR * sec), N = Math.max(2, Math.round(SR / f + S)), d = new Float32Array(N), out = new Float32Array(n);
  for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
  const P = Math.max(1, Math.round(N * pick)), e = d.slice(); for (let i = 0; i < N; i++) d[i] = e[i] - 0.9 * e[(i + P) % N]; // Anschlagstelle
  for (let s = 0; s < smooth; s++) for (let i = 0; i < N; i++) d[i] = 0.5 * (d[i] + d[(i + 1) % N]);
  for (let i = 0, p = 0; i < n; i++) { const j = p + 1 === N ? 0 : p + 1, v = d[p]; out[i] = v; d[p] = decay * ((1 - S) * v + S * d[j]); p = j; }
  if (twang) { let prev = 0; for (let i = 0; i < n; i++) { const v = out[i]; out[i] = v - twang * prev; prev = v; } } // Banjo-Fell: mehr Höhen
  return { data: out, f0: SR / (N - S) }; // die Mittelung mit dem nächsten Wert verkürzt die Periode um S
}
// Modal: Summe gedämpfter Teiltöne [Verhältnis, Lautstärke, Abklingzeit s]; noise = Schlägelgeräusch, trem = Tremolo (Vibraphon)
function modal(f, sec, parts, { noise = 0, trem = 0, scale = 1 } = {}) {
  const n = Math.round(SR * sec), out = new Float32Array(n), k = Math.pow(440 / f, 0.35) * scale; // hohe Töne klingen kürzer
  for (const [r, a, dec] of parts) {
    const w = 2 * Math.PI * f * r / SR; if (f * r > SR * 0.45) continue;
    const g = Math.exp(-1 / (SR * dec * k)); let amp = a, s = 0, c = 1; const cw = Math.cos(w), sw = Math.sin(w);
    for (let i = 0; i < n && amp > 1e-4; i++) { out[i] += amp * s; const ns = s * cw + c * sw; c = c * cw - s * sw; s = ns; amp *= g; }
  }
  if (noise) for (let i = 0, m = Math.min(n, SR * 0.012); i < m; i++) out[i] += noise * (Math.random() * 2 - 1) * (1 - i / m);
  if (trem) for (let i = 0; i < n; i++) out[i] *= 1 - trem * (0.5 + 0.5 * Math.sin(2 * Math.PI * 5.2 * i / SR));
  return { data: out, f0: f };
}
// FM: Träger + Modulator mit abklingendem Index (E-Piano, Glocke)
function fm(f, sec, { ratio = 1, index = 2, idec = 0.3, dec = 1.2, ratio2 = 0, amp2 = 0 }) {
  const n = Math.round(SR * sec), out = new Float32Array(n), w = 2 * Math.PI * f / SR;
  for (let i = 0; i < n; i++) {
    const t = i / SR, I = index * Math.exp(-t / idec), e = Math.exp(-t / dec);
    out[i] = e * Math.sin(w * i + I * Math.sin(w * ratio * i)) + (amp2 ? amp2 * Math.exp(-t / 0.08) * Math.sin(w * ratio2 * i) : 0);
  }
  return { data: out, f0: f };
}
// Schlagzeug: ungestimmte Einzelklänge
const rnd = () => Math.random() * 2 - 1;
function drum(kind) {
  const len = { kick: 0.4, snare: 0.3, hat: 0.08, ohat: 0.4, clap: 0.3, tamb: 0.25, shaker: 0.09, wood: 0.12, cowbell: 0.35, conga: 0.35, bongo: 0.2, tomH: 0.3, tomM: 0.35, tomL: 0.45, crash: 1.6, brush: 0.25, rim: 0.06, tri: 1.2 }[kind] || 0.2;
  const n = Math.round(SR * len), o = new Float32Array(n);
  const sweep = (f0, f1, td, ad, a = 1) => { let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, fr = f1 + (f0 - f1) * Math.exp(-t / td); ph += 2 * Math.PI * fr / SR; o[i] += a * Math.sin(ph) * Math.exp(-t / ad); } };
  const noise = (ad, a = 1, hp = 0, bp = 0) => { let y1 = 0, x1 = 0, lp = 0; for (let i = 0; i < n; i++) { let x = rnd(); if (bp) { lp += bp * (x - lp); x = lp; } if (hp) { const y = hp * (y1 + x - x1); x1 = x; y1 = y; x = y; } o[i] += a * x * Math.exp(-i / SR / ad); } };
  const metal = (fs, ad, a = 1, hp = 0.6) => { let y1 = 0, x1 = 0; for (let i = 0; i < n; i++) { const t = i / SR; let x = 0; for (const fr of fs) x += Math.sin(2 * Math.PI * fr * t) > 0 ? 1 : -1; x /= fs.length; const y = hp * (y1 + x - x1); x1 = x; y1 = y; o[i] += a * y * Math.exp(-t / ad); } };
  const HAT = [205, 304, 369, 522, 540, 800].map(x => x * 2.6);
  switch (kind) {
    case 'kick': sweep(160, 48, 0.035, 0.18, 1); for (let i = 0; i < SR * 0.004; i++) o[i] += rnd() * 0.4; break;
    case 'snare': sweep(220, 180, 0.02, 0.06, 0.6); noise(0.07, 0.8, 0.7); break;
    case 'hat': metal(HAT, 0.02, 1, 0.9); noise(0.015, 0.3, 0.9); break;
    case 'ohat': metal(HAT, 0.15, 1, 0.9); noise(0.1, 0.25, 0.9); break;
    case 'clap': for (const d of [0, 0.011, 0.022]) { const s = Math.round(d * SR); let lp = 0; for (let i = s; i < n; i++) { lp += 0.5 * (rnd() - lp); o[i] += 0.7 * lp * Math.exp(-(i - s) / SR / (d < 0.02 ? 0.006 : 0.08)); } } break;
    case 'tamb': metal([3500, 4700, 5900, 7100].map(x => x * 0.6), 0.09, 0.7, 0.85); noise(0.06, 0.4, 0.95); break;
    case 'shaker': { let x1 = 0; for (let i = 0; i < n; i++) { const x = rnd(), env = Math.sin(Math.PI * Math.min(1, i / SR / len)) ** 2; o[i] = 0.5 * (x - x1) * env; x1 = x; } break; }
    case 'wood': sweep(1100, 1000, 0.01, 0.025, 1); sweep(2900, 2800, 0.01, 0.012, 0.4); break;
    case 'rim': sweep(1700, 1600, 0.01, 0.012, 0.8); noise(0.008, 0.6, 0.8); break;
    case 'cowbell': metal([587, 845], 0.1, 1, 0.3); break;
    case 'conga': sweep(260, 200, 0.02, 0.15, 1); noise(0.006, 0.3); break;
    case 'bongo': sweep(480, 400, 0.01, 0.08, 1); noise(0.004, 0.3); break;
    case 'tomH': sweep(240, 170, 0.08, 0.15, 1); noise(0.01, 0.2); break;
    case 'tomM': sweep(170, 120, 0.08, 0.18, 1); noise(0.01, 0.2); break;
    case 'tomL': sweep(120, 80, 0.1, 0.22, 1); noise(0.01, 0.2); break;
    case 'crash': metal(HAT.map(x => x * 0.8), 0.6, 0.6, 0.8); noise(0.7, 0.5, 0.85); break;
    case 'brush': { for (let i = 0; i < n; i++) { const t = i / SR; o[i] = rnd() * 0.4 * Math.min(1, t / 0.02) * Math.exp(-t / 0.08); } break; }
    case 'tri': for (const [r, a] of [[1, 1], [2.76, 0.4], [5.4, 0.2]]) for (let i = 0; i < n; i++) o[i] += a * Math.sin(2 * Math.PI * 2600 * r * i / SR) * Math.exp(-i / SR / 0.5) * 0.3; break;
  }
  return { data: o, f0: 0 };
}

// ---- Instrumententabelle -------------------------------------------------
// Sampleinstrumente: make(f) berechnet einen Ton; vol = Pegel; ring = darf über die Notenlänge hinaus ausklingen (Sekunden)
const SAMPLED = {
  banjo: { make: f => string(f, 1.2, { decay: 0.995, S: 0.25, pick: 0.12, twang: 0.6 }), vol: 0.85, ring: 0.25 },
  guitar: { make: f => string(f, 1.6, { decay: 0.997, S: 0.45, smooth: 1, pick: 0.22 }), vol: 0.57, ring: 0.5 },
  harp: { make: f => string(f, 2, { decay: 0.9985, S: 0.5, smooth: 3, pick: 0.5 }), vol: 0.29, ring: 1.2 },
  pizz: { make: f => string(f, 0.6, { decay: 0.99, S: 0.5, smooth: 3, pick: 0.3 }), vol: 0.57, ring: 0.1 },
  pluck: { make: f => string(f, 0.8, { decay: 0.993, S: 0.5, smooth: 2, pick: 0.3 }), vol: 0.51, ring: 0.2 },
  upright: { make: f => string(f, 1.4, { decay: 0.996, S: 0.5, smooth: 4, pick: 0.25 }), vol: 0.47, ring: 0.05 },
  marimba: { make: f => modal(f, 1, [[1, 1, 0.35], [3.93, 0.25, 0.08], [9.2, 0.06, 0.03]], { noise: 0.15 }), vol: 0.18, ring: 0.6 },
  xylo: { oct: 12, make: f => modal(f, 0.6, [[1, 1, 0.15], [3, 0.4, 0.06], [6.2, 0.15, 0.03]], { noise: 0.2 }), vol: 0.3, ring: 0.4 },
  glock: { oct: 12, make: f => modal(f, 1.8, [[1, 1, 0.9], [2.76, 0.35, 0.3], [5.4, 0.15, 0.12], [8.9, 0.08, 0.06]], { noise: 0.1 }), vol: 0.14, ring: 1.2 },
  vibes: { make: f => modal(f, 2.2, [[1, 1, 1.2], [4, 0.2, 0.25], [10, 0.05, 0.05]], { trem: 0.35 }), vol: 0.09, ring: 1 },
  celesta: { oct: 12, make: f => modal(f, 1.4, [[1, 1, 0.6], [4, 0.15, 0.15], [2, 0.2, 0.3]], { noise: 0.05 }), vol: 0.12, ring: 0.8 },
  musicbox: { oct: 12, make: f => modal(f, 2, [[1, 1, 1], [5.4, 0.25, 0.15], [11.2, 0.08, 0.05]], { noise: 0.08 }), vol: 0.12, ring: 1.5 },
  kalimba: { make: f => modal(f, 1.2, [[1, 1, 0.5], [5.9, 0.3, 0.06], [3.1, 0.06, 0.1]], { noise: 0.1 }), vol: 0.15, ring: 0.6 },
  toypiano: { make: f => modal(f, 1.2, [[1, 1, 0.5], [2.99, 0.5, 0.2], [4.65, 0.3, 0.1], [7.1, 0.15, 0.05]], { noise: 0.1 }), vol: 0.17, ring: 0.5 },
  steeldrum: { make: f => modal(f, 1.2, [[1, 1, 0.5], [2, 0.5, 0.35], [3.01, 0.3, 0.2], [4.1, 0.12, 0.1]], { noise: 0.04 }), vol: 0.16, ring: 0.6 },
  epiano: { make: f => fm(f, 2, { ratio: 1, index: 1.6, idec: 0.25, dec: 1.4, ratio2: 14, amp2: 0.12 }), vol: 0.11, ring: 0.3 },
  bell: { make: f => fm(f, 2.5, { ratio: 3.5, index: 3, idec: 0.5, dec: 1.2 }), vol: 0.07, ring: 1.5 },
};

// Wellenformen aus Obertönen für die live gespielten Instrumente
const WAVES = {
  organ: [0, 1, 0.9, 0.5, 0.6, 0.15, 0.3, 0.05, 0.25],
  reed: [0, 1, 0.6, 0.75, 0.35, 0.5, 0.25, 0.3, 0.15, 0.2, 0.1], // Akkordeon, Mundharmonika
  clarinet: [0, 1, 0.02, 0.7, 0.02, 0.45, 0.02, 0.25, 0.02, 0.15],
  tuba: [0, 1, 0.8, 0.45, 0.25, 0.12, 0.06],
  brass: [0, 1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.28, 0.2, 0.15, 0.1],
  flute: [0, 1, 0.12, 0.04],
  ocarina: [0, 1, 0.05, 0.08],
};
// Live-Instrumente: wave (WAVES) oder type (Oszillatortyp); cut = Tiefpass (× Grundton, wenn rel), env = Filterhüllkurve [Start, Ziel, Zeit],
// vib = [Tiefe, Rate, Verzögerung], att/rel = Ein-/Ausklingen, det = Verstimmung zweiter Stimme (Cent), breath = Anblasgeräusch, form = Vokalformanten
const LIVE = {
  accordion: { wave: 'reed', vol: 0.24, cut: 3000, det: 14, att: 0.03, trem: 0.1 },
  organ: { wave: 'organ', vol: 0.19, cut: 5000, att: 0.008, click: 0.15, trem: 0.08 },
  harmonica: { wave: 'reed', vol: 0.37, bp: [1.4, 1.2], vib: [0.012, 5.5, 0.15], att: 0.04, breath: 0.15 },
  clarinet: { wave: 'clarinet', vol: 0.16, cut: 2200, vib: [0.006, 5, 0.2], att: 0.03, breath: 0.08 },
  flute: { wave: 'flute', vol: 0.13, vib: [0.01, 5.2, 0.15], att: 0.05, breath: 0.25 },
  ocarina: { wave: 'ocarina', vol: 0.12, vib: [0.008, 4.8, 0.25], att: 0.04, breath: 0.12 },
  whistle: { type: 'sine', vol: 0.12, vib: [0.015, 6, 0.1], att: 0.02, scoop: 0.97, breath: 0.1, oct: 12 },
  kazoo: { type: 'sawtooth', vol: 0.115, form: [600, 1400], vib: [0.015, 6.5, 0], att: 0.02, scoop: 0.95, buzz: 0.3 },
  fiddle: { type: 'sawtooth', vol: 0.32, bp: [3, 0.8], cut: 4000, vib: [0.012, 6, 0.12], att: 0.06, det: 5 },
  sax: { type: 'sawtooth', vol: 0.17, form: [520, 1600], cut: 3500, vib: [0.01, 5, 0.2], att: 0.03, scoop: 0.96, breath: 0.12 },
  trumpet: { wave: 'brass', vol: 0.21, cut: 1.2, rel: true, env: [1.2, 7, 0.06], vib: [0.008, 5.5, 0.2], att: 0.02, scoop: 0.97 },
  brass: { wave: 'brass', vol: 0.23, cut: 1.5, rel: true, env: [1.5, 5, 0.08], att: 0.03, det: 8 },
  tuba: { wave: 'tuba', vol: 0.26, cut: 2.5, rel: true, env: [2, 5, 0.04], att: 0.015, scoop: 0.98 },
  bassoon: { wave: 'reed', vol: 0.44, cut: 3, rel: true, bp: [2.2, 0.7], att: 0.02 },
  strings: { type: 'sawtooth', vol: 0.15, cut: 2600, det: 9, voices: 3, att: 0.12, vib: [0.006, 5, 0.3] },
  choir: { type: 'sawtooth', vol: 0.14, form: [700, 1150], det: 10, voices: 3, att: 0.15, vib: [0.006, 5, 0.2] },
  pad: { type: 'sawtooth', vol: 0.15, cut: 900, det: 7, voices: 2, att: 0.1 },
  slide: { sample: 'guitar', glide: 0.92 },
  lead: { type: 'square', vol: 0.1, cut: 4000, det: 6, att: 0.005, vib: [0.01, 6, 0.25] },
  bass: { type: 'square', vol: 0.16, cut: 1.8, rel: true, env: [6, 1.8, 0.05], att: 0.005 },
  subbass: { type: 'sine', vol: 0.2, att: 0.01 },
};

export class Instruments {
  constructor(ctx) { this.ctx = ctx; this.cache = {}; this.waves = {}; }
  has(kind) { return kind in SAMPLED || kind in LIVE; }
  // Sample in der Oktave des Tons holen oder berechnen
  _sample(kind, f) {
    const root = 12 * Math.round(Math.log2(f / 440)), key = kind + root; // eine Fassung je Oktave (Halbtöne über/unter A4)
    if (!this.cache[key]) {
      const r = SAMPLED[kind].make(440 * Math.pow(2, root / 12)), d = r.data;
      let pk = 0; for (const v of d) pk = Math.max(pk, Math.abs(v)); const k = pk ? 1 / pk : 1;
      const fade = Math.min(d.length, SR * 0.02); for (let i = 0; i < fade; i++) d[d.length - 1 - i] *= i / fade; // ohne Knacken enden
      const b = this.ctx.createBuffer(1, d.length, SR), ch = b.getChannelData(0); for (let i = 0; i < d.length; i++) ch[i] = d[i] * k;
      this.cache[key] = { buf: b, f0: r.f0 };
    }
    return this.cache[key];
  }
  _drum(kind) {
    if (!this.cache[kind]) {
      const r = drum(kind), d = r.data; let pk = 0; for (const v of d) pk = Math.max(pk, Math.abs(v));
      const b = this.ctx.createBuffer(1, d.length, SR), ch = b.getChannelData(0); for (let i = 0; i < d.length; i++) ch[i] = d[i] / (pk || 1);
      this.cache[kind] = { buf: b };
    }
    return this.cache[kind];
  }
  // Schlagzeugklang abspielen (rate = Tonhöhe, z. B. leicht variiert)
  hit(kind, t, vol, dest, rate = 1) {
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = this._drum(kind).buf; s.playbackRate.value = rate;
    g.gain.value = vol; s.connect(g); g.connect(dest); s.start(t);
  }
  _wave(name) {
    if (!this.waves[name]) { const h = WAVES[name], re = new Float32Array(h.length), im = Float32Array.from(h); this.waves[name] = this.ctx.createPeriodicWave(re, im); }
    return this.waves[name];
  }
  play(kind, f, t, dur, dest, vol = 1) {
    const S = SAMPLED[kind], L = LIVE[kind];
    if (S || L?.sample) return this._playSample(L?.sample || kind, f, t, dur, dest, vol, L?.glide);
    if (L) return this._playLive(L, f, t, dur, dest, vol);
  }
  _playSample(kind, f, t, dur, dest, vol, glide = 0) {
    const spec = SAMPLED[kind]; if (spec.oct) f *= Math.pow(2, spec.oct / 12);
    const { buf, f0 } = this._sample(kind, f), c = this.ctx;
    const src = c.createBufferSource(), g = c.createGain(), rate = f / f0;
    src.buffer = buf;
    if (glide) { src.playbackRate.setValueAtTime(rate * glide, t); src.playbackRate.exponentialRampToValueAtTime(rate, t + 0.09); } else src.playbackRate.value = rate; // Slide-Gitarre rutscht in den Ton
    const end = Math.min(t + buf.duration / rate, t + Math.max(dur, 0.05) + spec.ring), v = spec.vol * vol;
    g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, Math.max(t, end - 0.06)); g.gain.linearRampToValueAtTime(0, end);
    src.connect(g); g.connect(dest); src.start(t); src.stop(end + 0.02);
  }
  _playLive(L, f, t, dur, dest, vol) {
    const c = this.ctx, v = L.vol * vol, att = L.att || 0.01, end = t + Math.max(dur, att + 0.03), rel = 0.05;
    if (L.oct) f *= Math.pow(2, L.oct / 12);
    const out = c.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(v, t + att);
    out.gain.setValueAtTime(v, Math.max(t + att, end - rel)); out.gain.linearRampToValueAtTime(0, end); out.connect(dest);
    // Klangformung: Tiefpass (optional mit Hüllkurve), Bandpass oder zwei Vokalformanten
    let input = out;
    if (L.form) { const mix = c.createGain(); L.form.forEach((ff, k) => { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 5; const gg = c.createGain(); gg.gain.value = k ? 1.6 : 2.4; mix.connect(bp); bp.connect(gg); gg.connect(out); }); const dry = c.createGain(); dry.gain.value = 0.25; mix.connect(dry); dry.connect(out); input = mix; }
    if (L.bp) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * L.bp[0]; bp.Q.value = L.bp[1]; bp.connect(input); input = bp; }
    if (L.cut) {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; const cut = L.rel ? f * L.cut : L.cut;
      if (L.env) { lp.frequency.setValueAtTime(f * L.env[0], t); lp.frequency.linearRampToValueAtTime(Math.min(16000, f * L.env[1]), t + L.env[2]); lp.frequency.setTargetAtTime(cut, t + L.env[2], 0.12); } // Blech „blattert“ auf
      else lp.frequency.value = Math.min(16000, cut);
      lp.connect(input); input = lp;
    }
    if (L.trem) { const tr = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = L.trem; tr.gain.value = 1 - L.trem; lfo.connect(lg); lg.connect(tr.gain); tr.connect(input); input = tr; lfo.start(t); lfo.stop(end + 0.05); }
    // Stimmen (leicht gegeneinander verstimmt = Schwebung wie beim Akkordeon/Streicher)
    const n = L.voices || (L.det ? 2 : 1), oscs = [];
    let vibG = null;
    if (L.vib) { const lfo = c.createOscillator(); vibG = c.createGain(); lfo.frequency.value = L.vib[1]; vibG.gain.setValueAtTime(0, t); vibG.gain.linearRampToValueAtTime(f * L.vib[0], t + L.vib[2] + 0.05); lfo.connect(vibG); lfo.start(t); lfo.stop(end + 0.05); }
    for (let k = 0; k < n; k++) {
      const o = c.createOscillator(); if (L.wave) o.setPeriodicWave(this._wave(L.wave)); else o.type = L.type;
      o.detune.value = n > 1 ? (k - (n - 1) / 2) * (L.det || 0) : 0;
      if (L.scoop) { o.frequency.setValueAtTime(f * L.scoop, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07); } else o.frequency.value = f; // von unten anschleifen
      if (vibG) vibG.connect(o.frequency);
      const og = c.createGain(); og.gain.value = 1 / Math.sqrt(n); o.connect(og); og.connect(input); o.start(t); o.stop(end + 0.05); oscs.push(o);
    }
    if (L.buzz) { const o = c.createOscillator(), og = c.createGain(); o.type = 'square'; o.frequency.value = f; og.gain.value = L.buzz; if (vibG) vibG.connect(o.frequency); o.connect(og); og.connect(input); o.start(t); o.stop(end + 0.05); } // Kazoo-Schnarren
    if (L.breath) { const s = c.createBufferSource(), bp = c.createBiquadFilter(), bg = c.createGain(); s.buffer = this._noiseBuf(); bp.type = 'bandpass'; bp.frequency.value = Math.min(12000, f * 2); bp.Q.value = 1.5; bg.gain.setValueAtTime(L.breath * 2, t); bg.gain.exponentialRampToValueAtTime(L.breath * 0.3 + 0.001, t + 0.08); s.connect(bp); bp.connect(bg); bg.connect(out); s.start(t, Math.random()); s.stop(end); } // Anblasen
    if (L.click) { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = f * 8; og.gain.setValueAtTime(L.click * v * 4, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.012); o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.02); } // Orgel-Tastenklick
  }
  _noiseBuf() {
    if (!this._nb) { const n = SR * 2; this._nb = this.ctx.createBuffer(1, n, SR); const d = this._nb.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    return this._nb;
  }
}
