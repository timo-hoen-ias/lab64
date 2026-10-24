// Leveldefinitionen. Jedes Level: name, sky, ground, size, need (Zielanzahl), goalKind, music, build(lvl), optional update/onGoal.
import * as THREE from 'three';
import { Vacuum, Cat, CanOpener, BirdBoss, Pigeon, FatMan, RatBoss } from './bosses.js';
import { box, cyl, cone, sphere, makeRoundTree, makeFlowers, makeButterfly, makeGnome } from './models.js';
import { FX } from './fx.js';
import { STRAND } from './worlds/strand.js';
import { PARK } from './worlds/park.js';

const rnd = (a, b) => a + Math.random() * (b - a);

// Goldknochen je Welt (IDs). Summe = Gesamtziel des Spiels.
export const BONES = {
  hub: ['huegel', 'geheim'],
  kueche: ['boss', 'kruemel', 'geheim', 'kletter'],
  strasse: ['boss', 'kruemel', 'geheim', 'kletter'],
  buero: ['boss', 'kruemel', 'geheim', 'kletter'],
  park: ['boss', 'kruemel', 'geheim', 'kletter', 'turm', 'insel', 'dachsbau', 'baumkrone', 'parcours', 'picknick'],
  rattenrennen: ['sieg', 'gierig'],
  strand: ['boss', 'kruemel', 'geheim', 'riesenrad', 'schatz', 'leuchtturm', 'ringe', 'sandburg', 'rennen', 'muscheln'],
  hafen: ['boss', 'kruemel', 'geheim', 'kletter'],
  dorf: ['boss', 'kruemel', 'geheim', 'kletter'],
  kanal: ['boss', 'kruemel', 'geheim', 'kletter'],
};
export const TOTAL_BONES = Object.values(BONES).reduce((a, b) => a + b.length, 0);
export const WORLD_NAMES = { hub: 'Garten', kueche: 'Küche', strasse: 'Einkaufsstraße', buero: 'Büro', park: 'Grillpark', rattenrennen: 'Rattenrennen', strand: 'Strand', hafen: 'Hafen', dorf: 'Dorf', kanal: 'Kanal + Albtraum' };

export const LEVELS = {
  strand: STRAND,
  park: PARK,
  // ------------------------------------------------------------------ HUB
  hub: {
    name: 'Molls Garten', time: 'mittag', backdrop: 'huegel', grass: true, sky: 0x7fd0ff, ground: 0x6bbf59, size: 34, music: { scale: 'major', root: 262, bpm: 118, seed: 7, style: 'garden' },
    hazard: (x, z) => (x / 9.5) ** 2 + ((z - 20) / 6.5) ** 2 < 1, // keine Krümel in den Teich
    build(l) {
      l.spawn.set(0, 1, 6);
      // ---- Molls Haus (begehbar): x -7..7, z -24..-12
      const wall = 0xf3d9a6, trim = 0xc9a66b, H = 5;
      l.box(0, 0, -23.75, 14, H, 0.5, wall); l.box(-6.75, 0, -18, 0.5, H, 12, wall); l.box(6.75, 0, -18, 0.5, H, 12, wall);
      l.box(-4.25, 0, -12.25, 5.5, H, 0.5, wall); l.box(4.25, 0, -12.25, 5.5, H, 0.5, wall); l.box(0, 3.3, -12.25, 3, H - 3.3, 0.5, wall); // Front mit Tür
      l.deco(box(14.4, 0.4, 12.4, trim), 0, H, -18); // Traufe
      const roof = new THREE.Group(); roof.add(cone(10.2, 4.2, 0xc0392b, 0, 0, 0, 4)); roof.add(box(1, 2.2, 1, 0x8d6e63, 3.5, 0.8, 1.5)); // Dach + Schornstein
      roof.scale.set(1, 1, 0.86); l.deco(roof, 0, H + 2.1, -18, 0); roof.children[0].rotation.y = Math.PI / 4; l.roof = roof;
      l.deco(box(14.6, 0.15, 12.6, 0xa47148), 0, 0.02, -18); // Holzboden
      [[-4.25, -11.95], [4.25, -11.95], [-4.25, -24.05], [4.25, -24.05]].forEach(([x, z]) => { l.deco(box(1.8, 1.4, 0.15, 0x9ad7ff), x, 2.4, z); l.deco(box(2.1, 0.15, 0.25, trim), x, 1.65, z); }); // Fenster
      [-18, -15].forEach(z => { l.deco(box(0.15, 1.4, 1.8, 0x9ad7ff), -7.05, 2.4, z); l.deco(box(0.15, 1.4, 1.8, 0x9ad7ff), 7.05, 2.4, z); });
      l.deco(box(0.2, 0.2, 0.2, 0xffcc33), 1.1, 1.6, -11.9); // Türknauf an der offenen Tür
      const door = box(0.15, 3.2, 2.6, 0x7a4a1f); l.deco(door, 1.5, 1.6, -10.7);
      l.label('Molls Haus', 0, 4.3, -11.6);
      // Einrichtung
      l.deco(cyl(2.4, 2.4, 0.05, 0xc0392b, 0, 0, 0, 16), 0, 0.12, -17); l.deco(cyl(1.8, 1.8, 0.06, 0xe17055, 0, 0, 0, 16), 0, 0.13, -17); // Teppich
      l.box(-4.5, 0, -21.2, 2.6, 0.45, 2, 0xd63031); l.deco(box(2, 0.2, 1.4, 0xff7675), -4.5, 0.5, -21.2); // Hundekörbchen
      l.deco(cyl(0.45, 0.35, 0.3, 0x2e86de, 0, 0, 0, 12), -2.2, 0.15, -13.6); l.deco(cyl(0.35, 0.35, 0.05, 0x8b5a2b, 0, 0, 0, 10), -2.2, 0.3, -13.6); // Napf
      l.box(3.5, 0, -22.4, 4, 1, 1.6, 0x6c5ce7); l.box(3.5, 0, -23.3, 4, 2, 0.5, 0x5f4dd6); l.box(1.65, 0, -22.4, 0.4, 1.4, 1.6, 0x5f4dd6); // Sofa
      l.box(6, 0, -19.5, 1, 3.4, 3, 0x8d6e63); // Bücherregal (Kletterweg: Sofa → Lehne → Regal)
      [[-19.2, 0xe74c3c], [-19.6, 0x3498db], [-20.0, 0xf1c40f], [-20.4, 0x27ae60]].forEach(([z, c], i) => l.deco(box(0.6, 0.7, 0.3, c), 5.7, 0.4 + (i % 2) * 1.1, z));
      l.pickup(6, 3.8, -19.5, 'bone', { value: 5 });
      l.box(2, 0, -15.5, 2.6, 1.1, 1.6, 0xb5835a); // Tisch
      l.deco(cyl(0.2, 0.15, 0.4, 0xffffff, 0, 0, 0, 8), 2.4, 1.3, -15.5);
      l.box(-6.1, 0, -17, 0.8, 2.6, 3, 0x95a5a6); l.deco(box(0.2, 1.2, 1.6, 0x2d3436), -5.65, 0.7, -17); // Kamin
      l.fire = new THREE.PointLight(0xff9f43, 6, 9, 1.5); l.fire.position.set(-5.2, 1, -17); l.scene.add(l.fire);
      [[-2, 0xe17055], [2, 0x00b894]].forEach(([x, c]) => l.deco(box(1.4, 1, 0.08, c), x, 3, -23.45)); // Bilder
      l.goldbone('geheim', -4.5, 0.6, -21.2, { hidden: true }); // im Körbchen erschnüffeln
      // ---- Weg, Beete, Hecken
      for (let z = 4; z > -12; z -= 1.6) l.deco(box(1.4 + Math.random() * 0.3, 0.08, 1.1, 0xd6cfc0), (Math.random() - 0.5) * 0.3, 0.04, z, Math.random() * 0.3);
      [[-4.5, -10.6], [4.5, -10.6]].forEach(([x, z]) => l.deco(makeFlowers(4, 1.2, 16), x, 0, z));
      [[-9, -18], [9, -18]].forEach(([x, z]) => l.deco(makeFlowers(1.2, 6, 14), x, 0, z));
      [[-30, -30, 8], [30, -30, 8], [-30, 30, 6], [30, 30, 6]].forEach(([x, z, n]) => { for (let i = 0; i < n; i++) l.bush(x + (x < 0 ? i * 1.6 : -i * 1.6), z, 2.2); });
      // ---- Zaun mit Querlatten
      for (let i = -32; i <= 32; i += 2) { l.box(i, 0, -33, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(i, 0, 33, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(-33, 0, i, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(33, 0, i, 0.3, 1.3, 0.3, 0xf5f0e1); }
      [0.45, 0.95].forEach(y => { l.deco(box(66, 0.12, 0.08, 0xf5f0e1), 0, y, -33); l.deco(box(66, 0.12, 0.08, 0xf5f0e1), 0, y, 33); l.deco(box(0.08, 0.12, 66, 0xf5f0e1), -33, y, 0); l.deco(box(0.08, 0.12, 66, 0xf5f0e1), 33, y, 0); });
      // ---- Bäume
      [[-28, -12, 1.3], [28, -14, 1.2], [-29, 14, 1.4], [29, 13, 1.3], [-10, 30, 1.2], [10, 30, 1.1]].forEach(([x, z, sc], i) => { l.deco(makeRoundTree(sc, i % 2 === 0), x, 0, z); l.solids.push({ min: { x: x - 0.4 * sc, y: 0, z: z - 0.4 * sc }, max: { x: x + 0.4 * sc, y: 2 * sc, z: z + 0.4 * sc }, active: true }); });
      [[-14, -29], [14, -29], [-30, 0], [30, 0]].forEach(([x, z]) => l.tree(x, z, rnd(1.1, 1.5)));
      // ---- Hundehütte, Zwerg, Briefkasten
      l.box(-13, 0, 9, 3, 2.2, 3, 0xb5651d); l.deco(cone(2.4, 1.5, 0x8b1e1e, 0, 0, 0, 4), -13, 2.9, 9, Math.PI / 4); l.deco(box(1.2, 1.4, 0.1, 0x3b2412), -13, 0.7, 10.52);
      l.deco(box(1.6, 0.25, 0.4, 0xffffff), -13, 1.8, 10.6); // Namensschild
      l.deco(makeGnome(), 3, 0, 13, -0.6); l.deco(makeGnome(), -11, 0, 15, 0.8);
      l.deco(cyl(0.08, 0.08, 1.2, 0x7a4a1f, 0, 0.6, 0, 6), 4, 0, 4); l.deco(box(0.5, 0.4, 0.7, 0x2e86de, 0, 1.3, 0), 4, 0, 4);
      // ---- Teich zum Schwimmen mit Steinrand, Seerosen, Schilf und Steg
      l.pond(0, 20, 9, 6, 3.4); // tief genug zum Tauchen
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; if (Math.abs(a - Math.PI * 1.5) < 0.3) continue; const s = sphere(0.45 + Math.random() * 0.25, i % 2 ? 0xa4a4a4 : 0x8c8c8c, 0, 0, 0, 5); s.scale.y = 0.5; l.deco(s, Math.cos(a) * 9.4, 0.1, 20 + Math.sin(a) * 6.4); }
      l.lilies = [[-4, 18], [3, 22], [5, 17.5], [-2, 23]].map(([x, z]) => { const p = cyl(0.7, 0.7, 0.05, 0x2ecc71, 0, 0, 0, 10); l.deco(p, x, -0.2, z); l.deco(sphere(0.18, 0xff9ff3, 0, 0, 0, 6), x + 0.2, -0.05, z); return p; });
      [[-8.6, 22], [-8, 24], [8.4, 17], [7.8, 15.5]].forEach(([x, z]) => { for (let k = 0; k < 4; k++) l.deco(cyl(0.05, 0.05, 1.6 + k * 0.2, 0x6ab04c, 0, 0, 0, 4), x + k * 0.2, 0.8, z + (k % 2) * 0.2); });
      l.box(0, -3.4, 14, 2.4, 3.7, 5, 0xa47148); // Steg ins Wasser (bis zum Grund, damit man nicht drunter schwimmt)
      // Krümel über dem Wasser als Belohnung fürs Schwimmen
      [[-5, 20], [0, 20], [5, 20], [0, 24]].forEach(([x, z]) => l.pickup(x, -0.1, z, 'crumb'));
      // Am Teichgrund: nur mit Taucherbrille erreichbar
      [[-3, 21], [3, 19], [0, 23.5]].forEach(([x, z]) => l.pickup(x, -3.0, z, 'crumb'));
      l.airBubbles(5.5, -3.4, 22, 3.2);
      // ---- Hügel mit Goldknochen
      l.box(13, 0, 6, 4, 1.2, 4, 0x8fd17a); l.box(16.5, 0, 9.5, 4, 2.4, 4, 0x8fd17a); l.box(20, 0, 6, 4, 3.6, 4, 0x8fd17a);
      l.goldbone('huegel', 20, 4.4, 6);
      l.scatter(20);
      // ---- Portale (schauen zur Gartenmitte)
      l.portal(-9, -4, 'Küche', 'kueche', 0xff9f43, 0);
      l.portal(9, -4, 'Einkaufsstraße', 'strasse', 0x54a0ff, 2);
      l.portal(-22, -6, 'Büro', 'buero', 0x9b9b9b, 4);
      l.portal(22, -6, 'Grillpark', 'park', 0x8e44ad, 7);
      l.portal(-23, -23, 'Rattenrennen', 'rattenrennen', 0xff7675, 9);
      l.portal(0, 30, 'Strand', 'strand', 0xffd36e, 10);
      l.portal(-19, 22, 'Hafen', 'hafen', 0x48dbfb, 12);
      l.portal(19, 22, 'Dorf', 'dorf', 0xfeca57, 15);
      l.portal(23, -23, 'Kanal', 'kanal', 0x2ecc71, 19);
      // ---- Schmetterlinge
      l.butterflies = [0xff9ff3, 0xfeca57, 0x48dbfb, 0xffffff, 0xff7675].map((c, i) => { const b = makeButterfly(c); b.userData.home = new THREE.Vector3(rnd(-20, 20), 1.5, rnd(-8, 28)); l.deco(b, 0, 0, 0); return b; });
      l.label('Lauf in einen Ring!', 0, 3.2, 1);
    },
    update(l, dt) {
      const p = l.game.player.pos, inside = p.x > -6.5 && p.x < 6.5 && p.z > -23.5 && p.z < -12;
      l.roof.visible = !inside; // im Haus Dach ausblenden, damit man was sieht
      l.fire.intensity = 5 + Math.sin(l.t * 13) * 0.8 + Math.sin(l.t * 7.3) * 0.6;
      if (Math.random() < dt * 10) l.game.fx.burst({ x: -5.5, y: 0.5, z: -17 + (Math.random() - 0.5) }, { n: 1, color: [0xff9f43, 0xffd32a, 0xff5e57], speed: 0.2, up: 1.4, life: 0.5, size: 0.14, gravity: 0, drag: 0 });
      l.lilies.forEach((m, i) => { m.position.y = -0.2 + Math.sin(l.t * 1.5 + i) * 0.03; m.rotation.y += dt * 0.1; });
      for (const b of l.butterflies) {
        const u = b.userData; u.t += dt;
        b.position.set(u.home.x + Math.sin(u.t * 0.5) * 3, u.home.y + Math.sin(u.t * 1.7) * 0.6, u.home.z + Math.cos(u.t * 0.37) * 3);
        b.rotation.y = Math.atan2(Math.cos(u.t * 0.5) * 1.5, -Math.sin(u.t * 0.37) * 1.1);
        u.wings.forEach((w, i) => { w.rotation.z = Math.sin(u.t * 18) * 0.9 * (i ? -1 : 1); });
      }
    }
  },

  // ---------------------------------------------------------------- KÜCHE
  kueche: {
    name: 'Die Küche', indoor: true, sky: 0xfff1c9, ground: 0xe7d2a8, size: 18, need: 8, goalKind: 'ham', music: { scale: 'mixo', root: 294, bpm: 132, seed: 3, style: 'kitchen' },
    build(l) {
      l.spawn.set(0, 1, 12); l.wallRing(18, 7, 0xfdf4e3);
      // Fliesenmuster
      for (let x = -16; x < 16; x += 4) for (let z = -16; z < 16; z += 4) if ((x + z) % 8 === 0) { const t = box(4, 0.05, 4, 0xd6bf94, x + 2, 0.03, z + 2); l.group.add(t); }
      // Küchenzeile mit Treppen aus Schubladen
      l.box(-12, 0, -14, 12, 1, 4, 0xa0522d); l.box(-12, 1, -16.5, 12, 0.4, 2, 0xf5f5f5);
      l.box(-16, 0, -11, 3, 0.6, 2, 0xa0522d); l.box(-13.5, 0, -11, 2, 1.0, 2, 0xa0522d); // Treppe
      l.box(6, 0, -14, 10, 1.5, 4, 0xa0522d); l.box(6, 1.5, -14, 10, 0.3, 4, 0x777777); // Herd
      l.box(14, 0, -10, 4, 4, 6, 0xf0f0f0); l.box(14, 4, -10, 4, 0.3, 6, 0xdddddd); // Kühlschrank
      l.box(11, 0, -5, 2, 1, 2, 0xc9a66b); l.box(13, 0, -2.5, 2, 2, 2, 0xc9a66b); l.box(15, 0, 0, 2, 3, 2, 0xc9a66b); // Hocker-Treppe zum Kühlschrank
      l.box(0, 0, 2, 8, 1.6, 5, 0xd2b48c); // Tisch
      l.box(-5, 0, 6, 1.4, 0.9, 1.4, 0x8b5a2b); l.box(5, 0, 6, 1.4, 0.9, 1.4, 0x8b5a2b); // Stühle
      l.deco(cyl(1.2, 1.0, 0.6, 0xd63031, 6, 1.8, -14, 14), 6, 1.8, -14); // Topf
      l.box(-6, 3.5, -16.5, 4, 0.3, 2, 0xf5f5f5); l.box(2, 5.5, -16.5, 4, 0.3, 2, 0xf5f5f5); // Wandregale
      l.goldbone('kletter', 2, 6.3, -16.5);
      l.goldbone('geheim', 17, 0.6, -10, { hidden: true }); // hinter dem Kühlschrank
      // Schinken
      [[-12, 1.5, -16], [-6, 1.5, -16], [6, 1.9, -14], [14, 4.4, -10], [0, 1.7, 2], [-16, 0.3, 10], [16, 0.3, 14], [-15, 0.3, -2]].forEach(([x, y, z]) => l.pickup(x, y, z, 'ham', { goal: true }));
      l.scatter(20);
      l.label('Sammle 8 Schinken!', 0, 4, 10);
    },
    onGoal(l) { l.game.toast('Was brummt da?! Der STAUBSAUGER!'); l.game.audio.sfx('vacuum'); l.game.later(1200, () => l.setBoss(new Vacuum(l.game, 0, 8, 13))); }
  },

  // -------------------------------------------------------- EINKAUFSSTRASSE
  strasse: {
    name: 'Die Einkaufsstraße', time: 'mittag', backdrop: 'stadt', sky: 0x8fd3ff, ground: 0x9a9a9a, size: 36, need: 12, goalKind: 'bread', music: { scale: 'major', root: 330, bpm: 140, seed: 11, style: 'street' },
    build(l) {
      l.spawn.set(0, 1, 30); l.wallRing(36, 10, 0xc7c7c7);
      // Straße & Bürgersteige
      l.group.add(box(16, 0.06, 72, 0x5a5a5a, 0, 0.03, 0));
      for (let z = -34; z < 34; z += 6) l.group.add(box(0.6, 0.07, 3, 0xffffff, 0, 0.04, z));
      l.box(-18, 0, 0, 20, 0.5, 72, 0xbdbdbd); l.box(18, 0, 0, 20, 0.5, 72, 0xbdbdbd);
      // Läden
      const shops = [[-24, -24, 'Metzger', 0xe17055], [-24, -8, 'Bäcker', 0xfdcb6e], [-24, 10, 'Fischladen', 0x74b9ff], [24, -24, 'Café', 0xa29bfe], [24, -8, 'Döner', 0x55efc4], [24, 10, 'Imbiss', 0xff7675]];
      shops.forEach(([x, z, n, c]) => { l.box(x, 0.5, z, 12, 6, 12, c); l.box(x + (x < 0 ? 6.2 : -6.2), 0.5, z, 0.4, 3, 8, 0x3b2412); l.label(n, x, 7.5, z); });
      // Markise-Plattformen und Bänke
      [[-15.5, 2.8, -24], [-15.5, 2.8, -8], [15.5, 2.8, -8]].forEach(([x, y, z]) => l.box(x, y, z, 5, 0.3, 8, 0xffffff));
      [[-12, 20], [12, 20], [-12, -30], [12, -30]].forEach(([x, z]) => { l.box(x, 0.5, z, 3, 0.6, 1, 0x7a4a1f); l.box(x, 1.1, z + 0.4, 3, 0.5, 0.2, 0x7a4a1f); });
      l.box(15.5, 0.5, -14, 2, 1.5, 2, 0x7a4a1f); l.box(15.5, 4.6, -8, 3, 0.3, 3, 0xffeaa7); // Kiste + Ladenschild
      l.goldbone('kletter', 24, 7.2, -8);
      l.goldbone('geheim', -33, 0.6, 1, { hidden: true }); // hinter den Läden
      // Mülleimer (Treppen) und Autos
      [[-10, 0], [10, 0]].forEach(([x, z]) => l.deco(cyl(0.7, 0.6, 1.4, 0x2d3436, x, 0.7, z, 10), x, 0.7, z));
      [[-4, -20, 0xd63031], [4, 12, 0x0984e3]].forEach(([x, z, c]) => { l.box(x, 0, z, 4, 1.4, 7, c); l.box(x, 1.4, z, 3.2, 1.1, 4, 0x3b2412); });
      // Essensreste (12 Ziele)
      [[-24, 3.3, -24, 'sausage'], [-24, 3.3, -8, 'bread'], [-12, 1.2, 20, 'bread'], [12, 1.2, 20, 'sausage'], [-4, 2.7, -20, 'bread'], [4, 2.7, 12, 'sausage'], [-12, 1.2, -30, 'fish'], [12, 1.2, -30, 'bread'], [15.5, 3.3, -8, 'sausage'], [-30, 0.8, 24, 'fish'], [30, 0.8, 24, 'bread'], [0, 0.3, -32, 'sausage']].forEach(([x, y, z, k]) => l.pickup(x, y, z, k, { goal: true }));
      l.scatter(30);
      l.label('12 Essensreste finden – Vorsicht, Kater!', 0, 4, 26);
    },
    onGoal(l) { l.game.toast('Ein Fauchen vom Dach … DER KATER!'); l.game.later(1000, () => l.setBoss(new Cat(l.game, 0, 0, 13))); }
  },

  // ----------------------------------------------------------------- BÜRO
  buero: {
    name: 'Das Büro', indoor: true, sky: 0xdfe6e9, ground: 0x636e72, size: 26, need: 6, goalKind: 'treat', music: { scale: 'dorian', root: 247, bpm: 112, seed: 21, style: 'office' },
    build(l) {
      l.spawn.set(0, 1, 18); l.wallRing(26, 6, 0xf5f6fa);
      // Teppich
      l.group.add(box(50, 0.04, 50, 0x4a6fa5, 0, 0.02, 0));
      // Schreibtische in Reihen, jede mit Schublade
      const desks = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = -14 + c * 14, z = -12 + r * 11;
        l.box(x, 0, z, 6, 1.4, 3, 0xdcdde1); l.box(x + 1.8, 0, z, 2.2, 1.3, 2.8, 0xb2bec3);
        l.box(x - 1, 1.4, z - 0.6, 1.6, 1.0, 0.2, 0x2d3436); // Monitor
        l.box(x + 2.2, 0, z + 3, 1.4, 1.0, 1.4, 0x2d3436); // Stuhl
        desks.push({ x, z });
      }
      // Schubladen: 6 mit Leckerli, 3 leer
      desks.forEach((d, i) => {
        const drawer = box(1.6, 0.4, 0.2, 0x636e72, d.x + 1.8, 1.0, d.z + 1.5); l.group.add(drawer);
        l.interactable(d.x + 1.8, 1, d.z + 1.5, 1.5, it => {
          l.game.audio.sfx('drawer'); drawer.position.z += 0.8; drawer.scale.z = 6;
          if (i !== 2 && i !== 4 && i !== 7) { l.pickup(d.x + 1.8, 1.5, d.z + 2.2, 'treat', { goal: true }); l.game.toast('Leckerli in der Schublade!'); }
          else l.game.toast('Nur Büroklammern. Bäh.');
        }, 'SCHUBLADE: BISS');
      });
      // Aktenschrank-Treppe + Regal mit Krümeln
      l.box(-22, 0, -20, 3, 1.5, 3, 0x95a5a6); l.box(-22, 0, -16, 3, 3, 3, 0x95a5a6); l.box(-22, 0, -12, 3, 4.5, 3, 0x95a5a6);
      l.goldbone('kletter', -22, 5.2, -12);
      l.goldbone('geheim', 24, 0.6, -24, { hidden: true });
      // Kantine: Dose
      l.box(22, 0, 18, 6, 0.8, 6, 0xd63031); l.label('Kantine', 22, 3.5, 18);
      l.scatter(24);
      l.label('6 Leckerli in Schubladen – beiß dran!', 0, 4, 16);
    },
    onGoal(l) { l.game.toast('Aus der Kantine: ein Klappern. DER DOSENÖFFNER!'); l.game.later(1000, () => { const b = new CanOpener(l.game, 10, 8); l.group.add(b.can); l.setBoss(b); }); }
  },

  // -------------------------------------------------------- GRILLPARK (Schleichen)
  // ---------------------------------------------------------------- HAFEN
  hafen: {
    name: 'Der Hafen', water: true, time: 'wolkig', backdrop: 'meer', sky: 0x74b9ff, ground: 0x1e90ff, size: 36, minFloor: 1.9, need: 8, goalKind: 'fish', music: { scale: 'mixo', root: 262, bpm: 124, seed: 42, style: 'harbor' },
    build(l) {
      l.spawn.set(0, 2.5, 26);
      // Kai (Holz) – alles darunter ist Wasser
      l.box(0, 0, 10, 50, 2, 36, 0x8d6e4a); l.box(-26, 0, -14, 14, 2, 20, 0x8d6e4a); l.box(20, 0, -16, 20, 2, 16, 0x8d6e4a);
      l.box(0, 0, -20, 6, 2, 30, 0x8d6e4a); // Steg
      // Kisten-Stapel (Verstecke) und Kran
      const crates = [[-10, 2, 4], [-7, 2, 4], [-8.5, 4.5, 4], [12, 2, 12], [15, 2, 12], [12, 2, 15], [13.5, 4.5, 13.5], [-20, 2, -10], [-20, 4.5, -10], [-20, 7, -10], [24, 2, -18], [20, 2, -22]];
      crates.forEach(([x, y, z]) => l.box(x, y, z, 2.5, 2.5, 2.5, 0xc0905a));
      l.box(28, 2, 0, 2, 14, 2, 0xf1c40f); l.box(24, 14, -4, 12, 1, 1.4, 0xf1c40f); // Kran
      // Containertreppe hoch zum Kranarm
      [[22, -12, 4, 0xe74c3c], [24.6, -12, 6, 0x3498db], [24.6, -9.4, 8, 0x27ae60], [22, -9.4, 10, 0xe67e22], [19.4, -9.4, 12, 0x9b59b6], [19.4, -6.8, 13.6, 0xe74c3c]]
        .forEach(([x, z, top, c]) => l.box(x, 2, z, 2.4, top - 2, 2.4, c));
      l.goldbone('kletter', 28, 16.6, 0);
      l.goldbone('geheim', -31, 2.6, -5, { hidden: true });
      l.box(-20, 2, 20, 8, 1.6, 8, 0x2d3436); // Poller-Plattform
      [[-16, 2, 0], [-16, 2, 20], [16, 2, 0], [16, 2, 20]].forEach(([x, y, z]) => l.deco(cyl(0.5, 0.6, 1.2, 0x2d3436, x, y + 0.6, z, 8), x, y + 0.6, z));
      // Boot
      l.box(0, 1.2, -36, 8, 1.5, 5, 0xd63031); l.box(0, 2.7, -36, 1, 6, 1, 0xffffff);
      l.deco(box(5, 0.2, 5, 0xffffff), 0, 6, -36);
      // Versteckte Fische (per Nase) – hinter Kisten, auf Kran, im Boot
      [[-8.5, 7.2, 4], [13.5, 7.2, 13.5], [-20, 9.7, -10], [22, 2.3, -22], [19, 15.3, -4], [-20, 3.8, 20], [0, 2.9, -36], [-30, 2.3, -22]].forEach(([x, y, z]) => l.pickup(x, y, z, 'fish', { goal: true, hidden: true }));
      l.scatter(24);
      l.label('Die Möwe hat 8 Fische versteckt. Halte NASE gedrückt!', 0, 6, 20);
      // Möwe kreist zur Deko
      l.gull = new BirdBoss(l.game, 'seagull', 0, 0, 'Die Möwe'); l.gull.decor = true; l.group.add(l.gull.mesh);
    },
    update(l, dt) {
      if (l.gull && !l.gullActive) { const g = l.gull; g.t += dt; g.mesh.position.set(Math.cos(g.t * 0.5) * 20, 12 + Math.sin(g.t) * 2, Math.sin(g.t * 0.5) * 20); g.mesh.rotation.y = -g.t * 0.5 + Math.PI; g.mesh.userData.wings.forEach((w, i) => w.rotation.z = Math.sin(g.t * 10) * 0.5 * (i ? -1 : 1)); }
      // ins Wasser gefallen?
      if (l.game.player.pos.y < 1.5) { FX.splash(l.game.fx, l.game.player.pos); l.game.toast('Platsch! Nass bis auf die Knochen.'); l.game.player.hurt(1); l.game.player.respawn(); }
    },
    onGoal(l) { l.game.toast('KREEEE! Die Möwe will ihre Beute zurück!'); l.gullActive = true; l.group.remove(l.gull.mesh); l.game.later(1000, () => { const b = new BirdBoss(l.game, 'seagull', 0, 10, 'Die Möwe'); b.pos.y = 8; l.setBoss(b); }); }
  },

  // ----------------------------------------------------------------- DORF
  dorf: {
    name: 'Das Dorf', time: 'abend', backdrop: 'berge', grass: true, sky: 0x9fc8f0, ground: 0x9ccc65, size: 36, need: 8, goalKind: 'bread', music: { scale: 'major', root: 294, bpm: 126, seed: 77, swing: 0.09, style: 'village' },
    build(l) {
      l.spawn.set(0, 1, 28); l.wallRing(36, 5, 0xa1887f);
      // Marktplatz
      l.group.add(box(24, 0.05, 24, 0xbcaaa4, 0, 0.03, 0)); l.deco(cyl(2.5, 2.8, 1.2, 0x90a4ae, 0, 0.6, 0, 12), 0, 0.6, 0); l.deco(cyl(0.4, 0.4, 3, 0x90a4ae, 0, 2.5, 0, 8), 0, 2.5, 0); // Brunnen
      // Häuser mit Dächern (begehbar über Fässer/Karren)
      const houses = [[-24, -20, 0xffccbc], [-24, 0, 0xc5e1a5], [-24, 20, 0xb3e5fc], [24, -20, 0xfff59d], [24, 0, 0xd1c4e9], [24, 20, 0xffab91], [-8, -28, 0xf8bbd0], [10, -28, 0xb2dfdb]];
      houses.forEach(([x, z, c]) => { l.box(x, 0, z, 10, 5, 10, c); l.box(x, 5, z, 10.5, 0.4, 10.5, 0x8d6e63); l.deco(cone(7.5, 3.5, 0xb71c1c, 0, 0, 0, 4), x, 7.1, z, Math.PI / 4); });
      // Aufstiege: Fässer + Karren
      // Fass-Treppen: [niedrig x, hoch x, z] – das hohe Fass steht direkt am Haus
      [[-15.6, -17.8, -20], [15.6, 17.8, 0], [15.6, 17.8, -20], [-16.4, -14.2, -28]].forEach(([lx, hx, z]) => { l.box(lx, 0, z, 2, 1.6, 2, 0x795548); l.box(hx, 0, z, 2, 3.4, 2, 0x795548); });
      l.box(30, 0, -30, 4, 8, 4, 0xbcaaa4); l.deco(cone(3, 4, 0x5d4037, 0, 0, 0, 4), 30, 10, -30, Math.PI / 4); // Kirchturm
      l.box(28.5, 8, -30, 1, 0.3, 4, 0xbcaaa4);
      l.goldbone('kletter', 30, 8.8, -30);
      l.goldbone('geheim', -33, 0.6, 33, { hidden: true });
      l.box(16, 0, 20, 4, 1.5, 3, 0x6d4c41); l.box(16, 1.5, 21, 4, 1.5, 1, 0x6d4c41); // Karren
      // Marktstände
      [[-8, 8], [8, 8], [-8, -8], [8, -8]].forEach(([x, z]) => { l.box(x, 0, z, 4, 1.2, 2, 0x8d6e63); l.box(x, 3.2, z, 4.6, 0.2, 3, (x + z) % 16 ? 0xef5350 : 0x42a5f5); });
      // Versteckte Brote (Tauben-Verstecke): auf Dächern, unter Ständen, im Brunnen
      [[-24, 5.6, -20, 'bread'], [24, 5.6, 0, 'bread'], [-8, 5.6, -28, 'bread'], [-8, 1.5, 8, 'bread'], [8, 1.5, -8, 'bread'], [0, 1.5, 0, 'bread'], [16, 3.3, 20, 'bread'], [30, 0.3, 30, 'bread']].forEach(([x, y, z, k]) => l.pickup(x, y, z, k, { goal: true, hidden: true }));
      // Taubenschwärme
      [[-12, 0], [12, 12], [0, -14], [14, -10]].forEach(([x, z]) => l.addEnemy(new Pigeon(l.game, x, z)));
      l.scatter(30);
      l.label('Die Tauben haben 8 Brote versteckt. NASE benutzen, Tauben beißen!', 0, 5, 24);
    },
    onGoal(l) { l.game.toast('Von der Kirchturmspitze: GURR! Die Obertaube!'); l.game.later(1000, () => { const b = new BirdBoss(l.game, 'pigeon', 0, 0, 'Die Obertaube'); b.mesh.scale.setScalar(2.2); b.radius = 1.8; l.setBoss(b); }); }
  },

  // ---------------------------------------------------------------- KANAL
  kanal: {
    name: 'Der Kanal', indoor: true, sky: 0x2f3542, ground: 0x3d3d3d, size: 26, hazard: (x, z) => Math.abs(x) < 5.6, need: 6, goalKind: 'cheese', fogNear: 15, fogFar: 60, music: { scale: 'minor', root: 196, bpm: 120, seed: 13, style: 'sewer' },
    build(l) {
      l.spawn.set(-12, 2, 20); l.wallRing(26, 8, 0x57606f);
      // Abwasserrinne in der Mitte, Gehwege links/rechts
      l.group.add(box(10, 0.05, 52, 0x2e5d3a, 0, 0.03, 0));
      l.box(-12, 0, 0, 14, 1, 52, 0x747d8c); l.box(12, 0, 0, 14, 1, 52, 0x747d8c);
      // Rohre als Brücken
      [[-10], [4], [16]].forEach(([z]) => { const p = cyl(0.9, 0.9, 10, 0x8395a7, 0, 1.4, z, 10); p.rotation.z = Math.PI / 2; l.deco(p, 0, 1.4, z); l.solids.push({ min: { x: -5, y: 0.5, z: z - 0.7 }, max: { x: 5, y: 2.1, z: z + 0.7 }, active: true }); });
      // Laternen
      [[-18, -20], [18, -20], [-18, 0], [18, 0], [-18, 20], [18, 20]].forEach(([x, z]) => { l.box(x, 1, z, 0.4, 5, 0.4, 0x2f3542); const lamp = new THREE.PointLight(0x9ad7ff, 1.2, 14); lamp.position.set(x, 6.2, z); l.scene.add(lamp); l.deco(sphere(0.5, 0x9ad7ff, x, 6.2, z, 6), x, 6.2, z); });
      l.box(22, 1, -10, 3, 1.5, 3, 0x57606f); l.box(22, 1, -14, 3, 3, 3, 0x57606f); l.box(22, 1, -18, 3, 4.5, 3, 0x57606f); // Mauervorsprünge
      l.goldbone('kletter', 22, 6.8, -18);
      l.goldbone('geheim', -24, 1.6, 24, { hidden: true });
      // Käse (die Ratte hortet)
      [[-16, 1.3, -22], [16, 1.3, -22], [-10, 1.3, 10], [10, 1.3, -6], [0, 2.4, 4], [16, 1.3, 22]].forEach(([x, y, z]) => l.pickup(x, y, z, 'cheese', { goal: true }));
      l.scatter(20);
      l.label('Käse sammeln. Hier unten wohnt etwas Großes …', 0, 4, 18);
    },
    update(l) { if (l.game.player.pos.y < 0.6 && Math.abs(l.game.player.pos.x) < 5) { FX.splash(l.game.fx, l.game.player.pos); l.game.toast('Igitt – Kanalbrühe!'); l.game.player.hurt(1); l.game.player.respawn(); } },
    onGoal(l) { l.game.toast('Rote Augen im Dunkeln. DIE KANALRATTE!'); l.game.later(1000, () => l.setBoss(new RatBoss(l.game, 0, -4))); }
  },
};
