// Der Grillpark: in der Mitte die Grillwiese mit dem dicken Mann (Schleichen), rundherum See mit Insel,
// Wald mit Baumkronenpfad, Spielplatz mit Parcours, Aussichtsturm auf dem Hügel und ein Dachsbau unter der Erde.
import * as THREE from 'three';
import { FatMan, Pigeon } from '../bosses.js';
import { box, cyl, cone, sphere, makeSign, makeNpcDog, makeRoundTree, makeFlowers } from '../models.js';
import { toonGradient } from '../fx.js';

const WOOD = 0x9c6b3f, PATH = 0xc9b58c;

function bench() { const g = new THREE.Group(); g.add(box(2.4, 0.15, 0.7, WOOD, 0, 0.55, 0)); g.add(box(2.4, 0.6, 0.12, WOOD, 0, 0.95, -0.3)); [-1, 1].forEach(s => g.add(box(0.12, 0.55, 0.6, 0x2d3436, s, 0.27, 0))); return g; }
function blanket(c) { const g = new THREE.Group(); g.add(box(3, 0.04, 3, c, 0, 0.02, 0)); for (let i = 0; i < 3; i++) g.add(box(3, 0.045, 0.4, 0xffffff, 0, 0.025, -1 + i)); g.add(box(0.8, 0.5, 0.5, 0xb5651d, 0.8, 0.25, 0.6)); return g; }

export const PARK = {
  name: 'Der Grillpark', time: 'nachmittag', backdrop: 'wald', grass: true, sky: 0xa7e8ff, ground: 0x58b04f, size: 150, need: 10, goalKind: 'sausage',
  music: { scale: 'major', root: 220, bpm: 96, seed: 5, swing: 0.1, style: 'bbq' },
  build(l) {
    const g = l.game, T = (x, z) => l.top(x, z);
    l.spawn.set(-28, 1, 28);
    // ---- Grillwiese (Kern, wie bisher) – Mauer jetzt mit Toren in alle Richtungen
    l.wallRing(36, 4, 0x6b8e23, 10);
    const path = [{ x: -20, z: 20 }, { x: -20, z: -10 }, { x: 0, z: -20 }, { x: 20, z: -10 }, { x: 20, z: 15 }, { x: 0, z: 22 }];
    for (let i = 0; i < path.length; i++) { const a = path[i], b = path[(i + 1) % path.length]; const n = 8; for (let k = 0; k < n; k++) l.group.add(box(2.5, 0.05, 2.5, PATH, a.x + (b.x - a.x) * k / n, 0.03, a.z + (b.z - a.z) * k / n)); }
    [[-14, 14], [-24, 4], [-12, -14], [8, -14], [24, 0], [14, 12], [-4, 10], [8, 20], [-22, -20], [26, -22]].forEach(([x, z]) => l.bush(x, z, 2.6));
    [[-30, -30], [30, -30], [30, 30], [-10, -28], [12, -30], [-32, 10]].forEach(([x, z]) => l.tree(x, z, 1.6));
    [[-6, -6], [6, 6]].forEach(([x, z]) => { l.box(x, 0, z, 2, 1.2, 1.2, 0x2d3436); l.deco(box(2.2, 0.1, 1.4, 0x636e72), x, 1.25, z); });
    l.box(-28, 0, -12, 3, 1.2, 3, 0x8d6e4a); l.box(-28, 0, -16, 3, 2.4, 3, 0x8d6e4a); l.box(-28, 0, -20, 3, 3.6, 3, 0x8d6e4a);
    l.goldbone('kletter', -28, 4.4, -20);
    l.goldbone('geheim', 26, 0.6, -22, { hidden: true });
    l.addEnemy(new FatMan(g, path, (x, z) => { l.pickup(x, 0.3, z, 'sausage', { goal: true }); g.audio.sfx('collect'); }));
    l.warp(-24, 0, 30, 'Grillwiese', bench());
    // ---- Fähigkeit dieser Welt: Buddeln. Erdhügel überall im Park, in einem steckt ein Goldknochen
    l.teacher(-31, 24, 'buddeln');
    [[-30, 18], [22, 28], [-48, -22], [50, 32]].forEach(([x, z]) => l.digSpot(x, z, [l.pickup(x, 0.4, z, 'bone', { value: 5 })]));
    l.digSpot(-70, -30, [l.goldbone('buddeln', -70, 0.8, -30)]);
    // Wege von den Toren nach draußen
    [[0, -60, 0, -38], [0, 38, 0, 62], [-38, 0, -62, 0], [38, 0, 62, 0]].forEach(([x0, z0, x1, z1]) => { const n = 10; for (let k = 0; k <= n; k++) l.group.add(box(3, 0.05, 3, PATH, x0 + (x1 - x0) * k / n, 0.03, z0 + (z1 - z0) * k / n)); });

    // ---- Norden: Hügel mit Aussichtsturm, darunter der Dachsbau
    l.zone(0, -100, 60, () => {
      l.hill(0, -100, 38, 14, { flat: 0.38, color: 0x6cbf55, side: 0x8a6b3f });
      l.hill(-30, -128, 16, 6, { flat: 0.3, color: 0x6cbf55 }); l.hill(32, -126, 14, 5, { flat: 0.3, color: 0x6cbf55 });
      const ty = 14, tx = 0, tz = -100;
      [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([dx, dz]) => l.box(tx + dx, ty, tz + dz, 0.6, 22, 0.6, WOOD, { cam: false }));
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 4, r = 4.4; l.box(tx + Math.cos(a) * r, ty + 1 + i * 1.3, tz + Math.sin(a) * r, 2.4, 0.35, 2.4, 0xc49a6c); }
      l.box(tx, ty + 21.8, tz, 8, 0.4, 8, 0xc49a6c); l.deco(cone(6, 3, 0xc0392b, 0, 0, 0, 4), tx, ty + 24.5, tz, Math.PI / 4);
      l.goldbone('turm', tx, ty + 22.8, tz);
      l.deco(makeSign('Aussichtsturm', { w: 2.6, post: 1.3 }), tx, ty, tz + 8);
      l.warp(8, T(8, -76), -76, 'Hügel', bench());
      // Eingang zum Dachsbau im Hang
      l.box(18, 0, -74, 6, 4, 4, 0x8a6b3f); l.door(18, 0, -71.9, { x: 2000, y: 0.2, z: 16, yaw: Math.PI }, { label: 'Dachsbau', frame: 0x5a3715 });
      [[-40, -90], [40, -95], [-20, -140], [25, -145]].forEach(([x, z]) => l.tree(x, z, 1.8, makeRoundTree(1.4)));
    });

    // ---- Dachsbau (Innenraum abseits der Karte): Gänge, Krümel, Knochen
    const dx = 2000; l.room(dx, 0, 44, 40);
    l.box(dx, -1, 0, 44, 1, 40, 0x6b4a2b); l.box(dx, 5, 0, 44, 1, 40, 0x4a3420); // Boden, Decke
    l.box(dx, 0, -20, 44, 5, 1, 0x5a3d22); l.box(dx, 0, 20, 44, 5, 1, 0x5a3d22); l.box(dx - 22, 0, 0, 1, 5, 40, 0x5a3d22); l.box(dx + 22, 0, 0, 1, 5, 40, 0x5a3d22);
    // Labyrinth-Gänge
    [[-10, 10, 24, 1], [6, 4, 1, 12], [-4, -2, 20, 1], [-14, -10, 1, 14], [10, -10, 16, 1], [0, -15, 1, 8]].forEach(([x, z, w, d]) => l.box(dx + x, 0, z, w, 5, d, 0x5a3d22));
    [[-18, 16], [16, 16], [-18, 0], [0, 4], [14, -4], [-8, -16], [16, -16], [4, -12]].forEach(([x, z]) => l.pickup(dx + x, 0.3, z, 'crumb'));
    l.goldbone('dachsbau', dx + 18, 0.8, -17);
    for (let i = 0; i < 8; i++) l.deco(sphere(0.25, 0xfff3a0, 0, 0, 0, 6), dx - 18 + i * 5, 4.5, (i % 2 ? 6 : -6)); // Glühwürmchen-Lampen
    const badger = makeNpcDog(0x636e72, 0xffffff); l.deco(badger, dx - 16, 0, 12, Math.PI / 2);
    l.trigger(dx - 16, 0, 12, 4, () => g.talk('dieter', { mesh: badger }), false);
    l.door(dx, 0, 19.4, { x: 18, y: 0.2, z: -69, yaw: 0 }, { label: 'Ausgang', ry: Math.PI, frame: 0x5a3715 });

    // ---- Süden: See mit Insel, Steg, Ruderboot, Picknick
    l.zone(0, 100, 70, () => {
      l.pond(0, 100, 46, 30, 6);
      l.hill(12, 98, 10, 7.6, { flat: 0.5, y0: -6, color: 0x6cbf55, side: 0x8a6b3f }); // Insel
      l.deco(makeRoundTree(1.3, true), 14, 1.6, 96); l.goldbone('insel', 9, 2.4, 100);
      l.box(-20, -6, 74, 3, 6.4, 10, WOOD); // Steg
      const boat = new THREE.Group(); boat.add(box(2, 0.6, 4, 0xe17055, 0, 0, 0)); boat.add(box(1.6, 0.1, 3.4, 0xffeaa7, 0, 0.3, 0)); l.deco(boat, -14, -0.1, 88, 0.4);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; l.deco(cyl(0.05, 0.05, 1.4, 0x6ab04c, 0, 0.7, 0, 4), Math.cos(a) * 47, 0, 100 + Math.sin(a) * 31); } // Schilf am Ufer
      // Picknick-Familie vermisst 5 Sachen
      l.deco(blanket(0xe74c3c), 40, 0, 62); const pic = makeNpcDog(0xffffff, 0x0984e3); l.deco(pic, 40, 0, 60, Math.PI);
      l.picnic = 0;
      l.interactable(40, 0, 60, 2, it => {
        it.used = false; if (g.hasBone('park', 'picknick')) { g.talk('pudel.fertig', { mesh: pic }); return; }
        if (l.picnic >= 5) { g.talk('pudel.fertig', { mesh: pic }); l.spawnGoldbone(40, 1, 64, 'picknick'); }
        else g.talk('pudel', { mesh: pic, vars: { n: l.picnic, r: 5 - l.picnic } });
      }, 'BISS = reden');
      l.warp(30, 0, 56, 'See', bench());
    });
    // Verwehte Picknick-Sachen (überall verteilt)
    [[-72, 64, 'bread'], [110, 30, 'cheese'], [-120, -40, 'ham'], [75, -70, 'treat'], [-45, -125, 'fish']].forEach(([x, z, k]) => l.pickup(x, T(x, z) + 0.3, z, k, { special: true, onTake: () => { l.picnic++; g.toast(`Picknick-Sache ${l.picnic}/5 – zurück zur Decke am See!`); }, onRestore: () => l.picnic++ }));

    // ---- Westen: Wald mit Baumkronenpfad
    l.zone(-100, 0, 60, () => {
      const trees = []; for (let i = 0; i < 46; i++) { const x = -60 - Math.random() * 85, z = -70 + Math.random() * 140; if (Math.abs(z) < 6 && x > -100) continue; trees.push([x, z]); l.tree(x, z, 1.6 + Math.random() * 0.8); }
      l.hill(-120, 40, 22, 4, { flat: 0.2, color: 0x4f9a45 }); l.hill(-95, -45, 16, 3, { flat: 0.2, color: 0x4f9a45 });
      // Pfad in den Baumkronen: Plattformen auf Stämmen, Hängebrücken dazwischen
      const pts = [[-66, 10, 2], [-74, 14, 4], [-84, 16, 6], [-96, 12, 8], [-108, 8, 9.5], [-118, -4, 11], [-126, -18, 12.5], [-132, -32, 14]];
      l.box(-62, 0, 8, 2.4, 1, 2.4, WOOD); // Einstieg
      pts.forEach(([x, z, y], i) => {
        l.box(x, y - 0.4, z, 3.4, 0.4, 3.4, 0xc49a6c); l.deco(cyl(0.35, 0.45, y, 0x7a4a1f, 0, y / 2, 0, 7), x, 0, z);
        l.deco(sphere(2.6, 0x3d9a3d, 0, 0, 0, 7), x, y + 3.2, z);
        if (i) { const [px, pz, py] = pts[i - 1]; l.ramp(px, pz, x, z, 1.4, py, y, 0xa47148, { bridge: true }); }
      });
      l.goldbone('baumkrone', -132, 15, -32);
      l.warp(-66, 0, 16, 'Wald', bench());
      [[-90, 20], [-110, -20], [-80, -50]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z)));
    });

    // ---- Osten: Spielplatz mit Parcours, Rodelhügel
    l.zone(100, 0, 60, () => {
      l.box(80, 0, -10, 20, 0.15, 20, 0xf5e6c8); // Sandkasten
      // Klettergerüst
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) l.deco(cyl(0.08, 0.08, 4, 0xe17055, 0, 2, 0, 5), 92 + i * 2, 0, -2 + k * 2);
      l.box(95, 4, 1, 7, 0.3, 7, 0xe17055);
      l.box(95, 0, -4, 1.5, 1.4, 1.5, 0x0984e3); l.box(97, 0, -6, 1.5, 2.8, 1.5, 0x00b894);
      l.ramp(95, 4.5, 95, 16, 2, 4.2, 0.1, 0xfdcb6e); // Rutsche
      // Schaukel
      const sw = new THREE.Group(); [-1.5, 1.5].forEach(s => sw.add(box(0.15, 3.2, 0.15, 0x636e72, s, 1.6, 0))); sw.add(box(3.3, 0.15, 0.15, 0x636e72, 0, 3.2, 0)); sw.add(box(0.9, 0.08, 0.4, 0xd63031, 0, 0.7, 0)); l.deco(sw, 110, 0, -20);
      // Karussell
      l.box(112, 0, 8, 6, 0.4, 6, 0x6c5ce7); l.deco(cyl(0.2, 0.2, 2.5, 0xffffff, 0, 1.6, 0, 6), 112, 0, 8);
      // Parcours: Ringe in der Luft, nur mit Sprüngen über Gerüst und Pfosten erreichbar
      [[84, 0, 8], [86, 0, 12], [88, 0, 16]].forEach(([x, y, z], i) => l.box(x, y, z, 1.4, 1.2 + i * 1.2, 1.4, 0xfdcb6e));
      l.ringCourse([[84, 3.2, 4], [88, 5.6, 16], [95, 6.2, 1], [95, 3, 10], [112, 2.2, 8]], 'parcours', 16, 0x00cec9);
      l.hill(115, 95, 30, 12, { flat: 0.2, color: 0x6cbf55 }); // Rodelhügel
      l.warp(70, 0, 6, 'Spielplatz', bench());
    });

    [[60, 60], [-60, 60], [60, -60], [-60, -60]].forEach(([x, z]) => l.deco(makeFlowers(6, 3, 18), x, 0, z));
    l.scatter(55);
    l.label('Folge ihm leise. Sammle, was er verliert. Büsche = Versteck.', -20, 4, 26);
  },
  onGoal(l) { l.game.toast('Seine Tüte ist leer – und er hat nichts gemerkt!'); l.spawnGoldbone(0, 1, 0); },
};
