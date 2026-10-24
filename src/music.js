// Soundtrack: eigene Kompositionen je Welt im verspielten Stil der N64-Jump'n'Runs (hüpfende Tuba-Bässe, Banjo, Marimba, Kazoo).
// Jedes Stück ist 16 Takte lang (A-Teil + B-Teil) und läuft in Schleife; im zweiten Durchlauf kommt eine Terz-Begleitstimme dazu.
// Notation: ein Zeichen pro Achtel, Takte mit „|“ getrennt. „c5“ = Note, „-“ = Pause, „_“ = vorige Note halten.
// Akkorde: ein Akkord pro Takt, zwei Akkorde im Takt mit Komma („Dm7,G7“).
// bass: Halbtonabstand zum Akkordgrundton je Achtel (null = Pause, 'A' = chromatische Annäherung an den nächsten Grundton).
// Alle Ebenen (Melodie, Begleitung, Unterwasser-Melodie …) laufen synchron; die Varianten blenden nur zwischen ihnen um.

const _ = null;

export const SONGS = {
  // Molls Garten (Hub): fröhlich, Banjo und Tuba, kleine chromatische Frechheiten
  garden: {
    bpm: 120, swing: 0.07,
    chords: 'C A7 Dm G7 C E7 F G7 | F Fm C A7 D7 G7 C G7',
    mel: `g4 - c5 e5 g5 - e5 c5 | a4 - c#5 e5 g5 _ e5 - | f5 - e5 d5 a4 - d5 f5 | g5 _ f5 e5 d5 - b4 - |
          c5 - e5 g5 c6 - g5 e5 | g#5 _ e5 - b4 - d5 - | c5 a4 c5 f5 a5 _ g5 f5 | e5 - d5 - g4 - - - |
          a5 _ g5 f5 c5 - f5 - | ab5 _ g5 f5 c5 - ab4 - | g5 - e5 c5 g4 - c5 e5 | a5 _ g5 - e5 - c#5 - |
          d5 - f#5 a5 c6 _ a5 f#5 | g5 _ - b5 - f5 d5 b4 | c5 - g4 - c5 e5 g5 c6 | b5 - g5 - f5 d5 b4 g4`,
    inst: { lead: 'banjo', harm: 'marimba', soft: 'clarinet', water: 'vibes', comp: 'marimba', bass: 'tuba' },
    bass: [0, _, 7, _, 0, _, 7, 'A'], comp: [2, 6],
    drums: { kick: [0, 4], snare: [2, 6], click: [1, 3, 5, 7], hat: [] },
  },
  // Erdgeschoss/Küche: flinke Marimba, Fagott-Bass, Klappern wie Kochlöffel
  kitchen: {
    bpm: 136, swing: 0.04,
    chords: 'F F Bb C7 F D7 Gm7,C7 F | Bb Bdim F D7 Gm C7 F C7',
    mel: `f5 - c5 - a4 c5 f5 - | a5 g5 f5 - c5 - a4 - | bb4 d5 f5 bb5 - f5 d5 - | c5 e5 g5 bb5 a5 g5 e5 - |
          f5 - a5 - c6 - a5 f5 | f#5 - a5 - d6 c6 a5 f#5 | g5 - bb5 g5 e5 - c5 e5 | f5 - c5 - f4 - - - |
          d6 - bb5 - f5 - d5 - | d6 - b5 - ab5 - f5 - | c6 _ a5 f5 c5 - a4 c5 | d5 f#5 a5 c6 - a5 f#5 d5 |
          g5 - d5 - bb4 d5 g5 bb5 | a5 g5 e5 c5 bb4 - g4 - | a4 c5 f5 a5 g5 f5 e5 f5 | g5 - e5 - c5 - bb4 -`,
    inst: { lead: 'marimba', harm: 'xylo', soft: 'flute', water: 'vibes', comp: 'banjo', bass: 'bassoon' },
    bass: [0, _, 7, _, 12, _, 7, _], comp: [2, 6],
    drums: { kick: [0, 4], snare: [2, 6], click: [1, 3, 5, 7], shaker: [0, 1, 2, 3, 4, 5, 6, 7] },
  },
  // Einkaufsstraße: Kazoo-Melodie, Orgel-Offbeats, laufender Bass
  street: {
    bpm: 142, swing: 0.05,
    chords: 'G G C C G E7 A7,D7 G | C C#dim G E7 Am D7 G D7',
    mel: `d5 - g5 - b5 - a5 g5 | f#5 g5 - d5 - b4 - d5 | e5 - g5 - c6 - b5 a5 | g5 - e5 - c5 - e5 g5 |
          b5 - a5 g5 d5 - g5 b5 | d6 - b5 g#5 e5 - g#5 b5 | c#6 - a5 - c6 - a5 f#5 | g5 - d5 - g4 - - - |
          e5 e5 - g5 - e5 c5 - | e5 e5 - g5 - e5 c#5 - | d5 - b4 - d5 g5 b5 d6 | e6 - d6 b5 g#5 - e5 - |
          a5 - c6 - a5 - e5 - | f#5 g5 a5 - d5 - c5 - | b4 d5 g5 b5 a5 g5 f#5 g5 | a5 - f#5 - d5 - c5 a4`,
    inst: { lead: 'kazoo', harm: 'xylo', soft: 'clarinet', water: 'vibes', comp: 'organ', bass: 'upright' },
    bass: [0, _, 4, _, 7, _, 9, 'A'], comp: [1, 3, 5, 7],
    drums: { kick: [0, 3, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
  },
  // Hochhaus/Büro: jazzig, E-Piano, Besen-Schlagzeug, Swing
  office: {
    bpm: 112, swing: 0.13,
    chords: 'Dm7 G7 Dm7 G7 Em7,A7 Dm7,G7 Cmaj7 A7 | Fmaj7 Fm7,Bb7 Em7 A7 Dm7 G7 Cmaj7 A7',
    mel: `a5 _ _ c6 - a5 f5 - | g5 _ f5 - d5 - b4 - | d5 f5 a5 c6 b5 - a5 - | g5 - - f5 - d5 - - |
          e5 g5 b5 - c#6 _ a5 - | d6 _ c6 a5 b5 _ g5 - | e5 _ _ g5 b5 _ _ - | c#6 _ a5 - g5 - e5 - |
          a5 _ c6 e6 - c6 a5 - | ab5 _ f5 - d5 _ ab5 - | g5 _ e5 - b4 - d5 e5 | g5 - c#5 - e5 - a5 - |
          f5 _ a5 - c6 - a5 - | b5 _ g5 f5 d5 - b4 - | c5 e5 g5 b5 _ - g5 e5 | c#5 - e5 - g5 - bb5 a5`,
    inst: { lead: 'epiano', harm: 'vibes', soft: 'vibes', water: 'celesta', comp: 'epiano', bass: 'upright' },
    bass: [0, _, 4, _, 7, _, 10, 'A'], comp: [0], compLen: 3, seventh: true,
    drums: { kick: [0], hat: [0, 2, 3, 4, 6, 7], brush: [2, 6] },
  },
  // Grillpark: gemütlicher Country-Trab, Slide-Gitarre und Banjo
  bbq: {
    bpm: 100, swing: 0.1,
    chords: 'A A D A A F#m B7 E7 | D D A F#7 Bm E7 A E7',
    mel: `e5 - c#5 - e5 _ a5 - | c#6 _ b5 a5 e5 - c#5 - | d5 - f#5 - a5 _ f#5 d5 | e5 _ c#5 - a4 - - - |
          a4 - c#5 e5 a5 - g#5 a5 | c#6 _ a5 - f#5 - e5 - | d#5 - f#5 - a5 _ f#5 - | g#5 _ e5 - b4 - d5 - |
          f#5 _ a5 - d6 _ a5 f#5 | e5 d5 - f#5 - a5 - - | e5 _ c#5 - a4 - c#5 e5 | f#5 _ a#5 - c#6 _ - - |
          d6 _ b5 - f#5 - d5 - | e5 f#5 g#5 - b5 - d6 - | c#6 _ - a5 - e5 c#5 - | b4 - d5 - g#5 _ e5 -`,
    inst: { lead: 'slide', harm: 'banjo', soft: 'harmonica', water: 'vibes', comp: 'banjo', bass: 'tuba' },
    bass: [0, _, _, _, 7, _, _, 'A'], comp: [2, 3, 6, 7],
    drums: { kick: [0, 4], snare: [2, 6], click: [1, 3, 5, 7] },
  },
  // Strand: Calypso mit Steel-Drum, Marimba-Offbeats; unter Wasser verträumt mit Vibraphon und Harfe
  beach: {
    bpm: 114, swing: 0.1,
    chords: 'C F G7 C C F G7 C | Am Em F C Dm G7 C G7',
    mel: `e5 - g5 - c6 _ g5 e5 | f5 - a5 - c6 _ a5 - | b5 - g5 - f5 d5 - b4 | c5 - e5 g5 - e5 c5 - |
          g5 - g5 a5 g5 - e5 c5 | a5 - a5 c6 a5 - f5 c5 | d5 - g5 - b5 _ a5 g5 | c6 _ - g5 c5 - - - |
          e6 _ c6 a5 - e5 a5 - | d6 _ b5 g5 - e5 g5 - | c6 _ a5 f5 - c5 f5 a5 | g5 _ e5 - c5 - e5 - |
          f5 - a5 - d6 _ c6 a5 | b5 _ g5 - d5 - f5 - | e5 g5 c6 - g5 - e5 - | d5 - b4 - g4 - - -`,
    inst: { lead: 'steeldrum', harm: 'marimba', soft: 'marimba', water: 'vibes', comp: 'marimba', bass: 'upright' },
    bass: [0, _, _, 7, _, _, 12, _], comp: [1, 3, 5, 7],
    drums: { kick: [0, 3, 6], click: [2, 5], shaker: [0, 1, 2, 3, 4, 5, 6, 7] },
  },
  // Hafen: Seemannslied im 6/8-Takt, Akkordeon und Tuba
  harbor: {
    bpm: 132, bar: 6, swing: 0,
    chords: 'Am Am G G Am Am E7 Am | C G Am E7 F G E7 Am',
    mel: `e5 - a5 a5 - b5 | c6 - b5 a5 - e5 | d5 - g5 g5 - a5 | b5 - a5 g5 - d5 |
          e5 - a5 a5 - b5 | c6 - d6 e6 - c6 | b5 - g#5 e5 - g#5 | a5 _ _ a4 - - |
          g5 - e5 c6 - g5 | b5 - g5 d6 - b5 | c6 - b5 a5 - e5 | g#5 - e5 b4 - e5 |
          a5 - c6 f6 - c6 | b5 - d6 g5 - b5 | g#5 - b5 e6 _ d6 | c6 - b5 a5 - -`,
    inst: { lead: 'accordion', harm: 'accordion', soft: 'clarinet', water: 'vibes', comp: 'accordion', bass: 'tuba' },
    bass: [0, _, _, 7, _, _], comp: [1, 2, 4, 5], compLen: 0.8,
    drums: { kick: [0], snare: [3], click: [1, 2, 4, 5] },
  },
  // Dorf: Polka mit Flöte, Akkordeon und Tuba
  village: {
    bpm: 128, swing: 0.08,
    chords: 'D D G A7 D Bm E7 A7 | G D A7 D G D A7 D',
    mel: `a4 - d5 - f#5 - a5 - | b5 a5 f#5 - d5 - f#5 a5 | b5 - g5 - d5 - g5 b5 | a5 _ g5 - e5 - c#5 - |
          d5 f#5 a5 d6 - a5 f#5 - | d6 - b5 - f#5 - b5 - | g#5 - b5 - e6 - d6 b5 | a5 - e5 - c#5 - a4 - |
          g5 _ a5 b5 d6 - b5 g5 | f#5 _ g5 a5 d6 - a5 f#5 | e5 _ f#5 g5 a5 - g5 e5 | f#5 - d5 - a4 - - - |
          b5 _ c#6 d6 g6 - d6 b5 | a5 _ b5 c#6 d6 - a5 f#5 | g5 - e5 c#5 a4 - c#5 e5 | d5 - - - a4 - - -`,
    inst: { lead: 'flute', harm: 'clarinet', soft: 'harp', water: 'vibes', comp: 'accordion', bass: 'tuba' },
    bass: [0, _, 7, _, 0, _, 7, _], comp: [2, 6],
    drums: { kick: [0, 4], snare: [2, 6], click: [1, 5] },
  },
  // Kanal: schleichender Moll-Groove mit Hall, gezupfte Melodie und Klarinette
  sewer: {
    bpm: 118, swing: 0.06, echo: true, drone: true,
    chords: 'Em Em C B7 Em Em Am,B7 Em | Am Am Em Em F B7 Em B7',
    mel: `e5 - - g5 - - f#5 - | e5 - b4 - - - - - | e5 - - g5 - - a5 - | b5 _ a5 - f#5 - d#5 - |
          e5 - - g5 - b5 - e6 | d6 - b5 - g5 - f#5 - | e5 - c5 - d#5 - f#5 - | e5 - - - - - b4 - |
          a5 - - c6 - - b5 a5 | e5 - - - c5 - e5 - | g5 - - b5 - - a5 g5 | e5 - - - b4 - e5 - |
          f5 - a5 - c6 - a5 f5 | f#5 - d#5 - b4 - a4 - | g4 - b4 - e5 - g5 - | f#5 - - - d#5 - - -`,
    inst: { lead: 'pluck', harm: 'clarinet', soft: 'clarinet', water: 'vibes', comp: 'pluck', bass: 'bassoon' },
    bass: [0, _, 0, 7, _, 12, 7, _], comp: [3, 7], compLen: 0.6,
    drums: { kick: [0, 3], click: [2, 6], hat: [1, 5] },
  },
  // Rattenrennen: Verfolgungsjagd, hektisch
  chase: {
    bpm: 164, swing: 0,
    chords: 'Am Am F G Am Am E7 E7 | F G Am Am F G E7 E7',
    mel: `a4 c5 e5 a5 g5 e5 c5 e5 | a5 - a5 - g5 a5 - e5 | f5 a5 c6 a5 f5 a5 c6 f6 | d6 - b5 - g5 - d5 - |
          a4 c5 e5 a5 g5 e5 c5 e5 | c6 - b5 - a5 - e5 - | g#5 b5 d6 b5 g#5 e5 d5 b4 | e5 - g#5 - b5 - d6 - |
          c6 - a5 - c6 - f6 - | d6 - b5 - d6 - g6 - | e6 d6 c6 b5 a5 g5 e5 c5 | a4 - e5 - a5 - - - |
          f5 e5 f5 a5 c6 a5 f5 a5 | g5 f5 g5 b5 d6 b5 g5 b5 | g#5 a5 b5 c6 d6 e6 d6 b5 | g#5 - e5 - g#5 - b5 -`,
    inst: { lead: 'kazoo', harm: 'lead', soft: 'lead', water: 'vibes', comp: 'organ', bass: 'bass' },
    bass: [0, 12, 0, 12, 0, 12, 7, 12], comp: [2, 6], roll: true,
    drums: { kick: [0, 2, 4, 6], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
  },
  // Albtraum: gruseliger Spieldosen-Walzer
  nightmare: {
    bpm: 150, bar: 6, swing: 0, echo: true, drone: true,
    chords: 'Cm Cm Ab G7 Cm Fm G7 Cm | Ab Fm Cm G7 Ab Db G7 Cm',
    mel: `g5 - - eb5 - c5 | g5 - - f#5 - g5 | ab5 - - c6 - ab5 | g5 - - b4 - d5 |
          c6 - - g5 - eb5 | f5 - - ab5 - c6 | b5 - - d6 - b5 | c6 _ _ - - - |
          c6 - - eb6 - c6 | ab5 - - f5 - ab5 | g5 - - eb5 - g5 | f5 - - d5 - b4 |
          c5 - eb5 ab5 - c6 | db6 - - ab5 - f5 | d5 - f5 b5 - d6 | c6 _ _ - - -`,
    inst: { lead: 'musicbox', harm: 'celesta', soft: 'musicbox', water: 'vibes', comp: 'pad', bass: 'subbass' },
    bass: [0, _, _, 7, _, _], comp: [0], compLen: 5,
    drums: { kick: [0], click: [2, 5] },
  },
};

// Lautstärke je Ebene in den Varianten. normal = draußen, inside = Räume/Höhlen, water = getaucht, boss = Bosskampf.
export const MIXES = {
  normal: { lead: 1, harm: 0.7, soft: 0, water: 0, comp: 1, bass: 1, drums: 1, arp: 0, pad: 0, boss: 0 },
  inside: { lead: 0, harm: 0.35, soft: 1, water: 0, comp: 0.5, bass: 0.75, drums: 0.35, arp: 0, pad: 0.7, boss: 0 },
  water: { lead: 0, harm: 0, soft: 0, water: 1, comp: 0, bass: 0.55, drums: 0, arp: 0.9, pad: 0.9, boss: 0 },
  boss: { lead: 1, harm: 1, soft: 0, water: 0, comp: 1.1, bass: 1.2, drums: 1.2, arp: 0, pad: 0, boss: 1 },
};

const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export function noteMidi(tok) {
  const m = /^([a-g])([#b]?)(\d)$/.exec(tok); if (!m) return undefined;
  return (+m[3] + 1) * 12 + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6, 9] };
export function parseChord(name) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name); if (!m || !(m[3] in QUAL)) throw new Error(`Akkord unbekannt: ${name}`);
  return { root: PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), iv: QUAL[m[3]] };
}

// Stück in Ereignislisten übersetzen: Melodie-Noten mit Länge (in Achteln) und Akkord je Achtel.
export function compile(song) {
  const bar = song.bar || 8;
  const bars = song.mel.split('|').map(b => b.trim().split(/\s+/));
  bars.forEach((b, i) => { if (b.length !== bar) throw new Error(`Takt ${i + 1}: ${b.length} statt ${bar} Achtel`); });
  const toks = bars.flat(), len = toks.length, mel = new Array(len).fill(null);
  let last = -1;
  toks.forEach((t, i) => {
    if (t === '_') { if (last >= 0) mel[last].len++; return; }
    if (t === '-') { last = -1; return; }
    const midi = noteMidi(t); if (midi === undefined) throw new Error(`Note unbekannt: ${t}`);
    mel[i] = { midi, len: 1 }; last = i;
  });
  const cbars = song.chords.replace(/\|/g, ' ').trim().split(/\s+/);
  if (cbars.length * bar !== len) throw new Error(`${cbars.length} Akkordtakte für ${len / bar} Melodietakte`);
  const chord = [];
  cbars.forEach(cb => { const parts = cb.split(',').map(parseChord); for (let s = 0; s < bar; s++) chord.push(parts[Math.floor(s * parts.length / bar)]); });
  return { bar, len, mel, chord };
}
