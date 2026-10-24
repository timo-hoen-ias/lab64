// Leveldefinitionen. Jedes Level: name, sky, ground, size, need (Zielanzahl), goalKind, music, build(lvl), optional update/onGoal.
import * as THREE from 'three';
import { Vacuum, Cat, CanOpener, BirdBoss, Pigeon, FatMan, RatBoss } from './bosses.js';
import { box, cyl, cone, sphere, makeRoundTree, makeFlowers, makeButterfly, makeGnome } from './models.js';
import { FX } from './fx.js';
import { STRAND } from './worlds/strand.js';
import { PARK } from './worlds/park.js';
import { HAFEN } from './worlds/hafen.js';
import { DORF } from './worlds/dorf.js';
import { STRASSE } from './worlds/strasse.js';
import { KUECHE } from './worlds/kueche.js';
import { BUERO } from './worlds/buero.js';
import { KANAL } from './worlds/kanal.js';
import { GARTEN } from './worlds/garten.js';

const rnd = (a, b) => a + Math.random() * (b - a);

// Goldknochen je Welt (IDs). Summe = Gesamtziel des Spiels.
export const BONES = {
  hub: ['huegel', 'geheim', 'kruemel', 'teich', 'baumhaus', 'vogelhaus', 'gewaechshaus', 'schuppen', 'aussicht', 'zwerge'],
  kueche: ['boss', 'kruemel', 'geheim', 'kletter', 'vorrat', 'regal', 'treppe', 'uhr', 'keller', 'socken'],
  strasse: ['boss', 'kruemel', 'geheim', 'kletter', 'daecher', 'kaufhaus', 'baustelle', 'brunnen', 'eisdiele', 'bahnhof'],
  buero: ['boss', 'kruemel', 'geheim', 'kletter', 'kopierer', 'chef', 'server', 'fenster', 'tassen', 'antenne'],
  park: ['boss', 'kruemel', 'geheim', 'kletter', 'turm', 'insel', 'dachsbau', 'baumkrone', 'parcours', 'picknick'],
  rattenrennen: ['sieg', 'gierig'],
  strand: ['boss', 'kruemel', 'geheim', 'riesenrad', 'schatz', 'leuchtturm', 'ringe', 'sandburg', 'rennen', 'muscheln'],
  hafen: ['boss', 'kruemel', 'geheim', 'kletter', 'kran', 'markt', 'mole', 'laderaum', 'anker', 'bojen'],
  dorf: ['boss', 'kruemel', 'geheim', 'kletter', 'muehle', 'scheune', 'huehner', 'burg', 'teich', 'baecker'],
  kanal: ['boss', 'kruemel', 'geheim', 'kletter', 'pumpe', 'rohre', 'becken', 'gully', 'nest', 'lampen'],
};
export const TOTAL_BONES = Object.values(BONES).reduce((a, b) => a + b.length, 0);
export const WORLD_NAMES = { hub: 'Garten', kueche: 'Erdgeschoss', strasse: 'Einkaufsstraße', buero: 'Hochhaus', park: 'Grillpark', rattenrennen: 'Rattenrennen', strand: 'Strand', hafen: 'Hafen', dorf: 'Dorf', kanal: 'Kanal + Albtraum' };

export const LEVELS = {
  strand: STRAND,
  park: PARK,
  // ------------------------------------------------------------------ HUB
  hub: GARTEN,


  // ---------------------------------------------------------------- KÜCHE
  kueche: KUECHE,

  // -------------------------------------------------------- EINKAUFSSTRASSE
  strasse: STRASSE,

  // ----------------------------------------------------------------- BÜRO
  buero: BUERO,

  // -------------------------------------------------------- GRILLPARK (Schleichen)
  // ---------------------------------------------------------------- HAFEN
  hafen: HAFEN,

  // ----------------------------------------------------------------- DORF
  dorf: DORF,

  // ---------------------------------------------------------------- KANAL
  kanal: KANAL,

};
