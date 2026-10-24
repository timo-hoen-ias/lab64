// Die Einkaufsstraße: Hauptstraße mit Läden und Dächer-Parcours in der Mitte, Kaufhaus mit drei Etagen im Norden,
// Baustelle mit Gerüst im Osten, Brunnenplatz mit Wasserfontänen und Eisdiele im Westen, Bahnhof im Süden.
import * as THREE from 'three';
import { Cat, Pigeon } from '../bosses.js';
import { box, cyl, cone, sphere, makeSign, makeNpcDog, makeRoundTree } from '../models.js';
import { placeAsset } from '../assets.js';

const WALK = 0xbdbdbd, ROAD = 0x5a5a5a, STEEL = 0x95a5a6, WOOD = 0x7a4a1f;

function bench() { const g = new THREE.Group(); g.add(box(2.4, 0.15, 0.7, WOOD, 0, 0.55, 0)); g.add(box(2.4, 0.6, 0.12, WOOD, 0, 0.95, -0.3)); [-1, 1].forEach(s => g.add(box(0.12, 0.55, 0.6, 0x2d3436, s, 0.27, 0))); return g; }

export const STRASSE = {
  name: 'Die Einkaufsstraße', surface: 'stone', time: 'mittag', backdrop: 'stadt', sky: 0x8fd3ff, ground: 0x9a9a9a, size: 150, need: 12, goalKind: 'bread',
  music: { scale: 'major', root: 330, bpm: 140, seed: 11, style: 'street' },
  build(l) {
    const g = l.game;
    l.spawn.set(0, 1, 30);
    // ---- Hauptstraße (Kern) – Mauer mit Toren zu den Vierteln
    l.wallRing(36, 10, 0xc7c7c7, 10);
    l.group.add(box(16, 0.06, 72, ROAD, 0, 0.03, 0));
    for (let z = -34; z < 34; z += 6) l.group.add(box(0.6, 0.07, 3, 0xffffff, 0, 0.04, z));
    l.box(-18, 0, 0, 20, 0.5, 72, WALK); l.box(18, 0, 0, 20, 0.5, 72, WALK);
    const shops = [[-24, -24, 'Metzger', 0xe17055], [-24, -8, 'Bäcker', 0xfdcb6e], [-24, 10, 'Fischladen', 0x74b9ff], [24, -24, 'Café', 0xa29bfe], [24, -8, 'Döner', 0x55efc4], [24, 10, 'Imbiss', 0xff7675]];
    shops.forEach(([x, z, n, c]) => { l.box(x, 0.5, z, 12, 6, 12, c); l.box(x + (x < 0 ? 6.2 : -6.2), 0.5, z, 0.4, 3, 8, 0x3b2412); l.label(n, x, 7.5, z); });
    [[-15.5, 2.8, -24], [-15.5, 2.8, -8], [15.5, 2.8, -8]].forEach(([x, y, z]) => l.box(x, y, z, 5, 0.3, 8, 0xffffff));
    [[-12, 20], [12, 20], [-12, -30], [12, -30]].forEach(([x, z]) => { l.box(x, 0.5, z, 3, 0.6, 1, WOOD); l.box(x, 1.1, z + 0.4, 3, 0.5, 0.2, WOOD); });
    l.box(15.5, 0.5, -14, 2, 1.5, 2, WOOD); l.box(15.5, 4.6, -8, 3, 0.3, 3, 0xffeaa7);
    l.goldbone('kletter', 24, 7.2, -8);
    l.goldbone('geheim', -33, 0.6, 1, { hidden: true });
    [[-10, 0], [10, 0]].forEach(([x, z]) => l.deco(cyl(0.7, 0.6, 1.4, 0x2d3436, x, 0.7, z, 10), x, 0.7, z));
    // Autos (GLB-Modelle, src/assets.js): drei mit Alarmanlage, der Lieferwagen, eine Streife; ohne Modell die alten Kisten-Autos
    const car = (x, z, kind, ry = 0, o = {}) => placeAsset(l, kind, x, 0, z, ry, { solid: 'car', ...o })?.top
      ?? (l.box(x, 0, z, 4, 1.4, 7, o.color ?? 0xb2bec3), l.box(x, 1.4, z, 3.2, 1.1, 4, 0x3b2412), 2.5);
    const roof = [car(-4, -20, 'auto-rot', 0, { color: 0xd63031 }), car(4, 12, 'auto-blau', Math.PI, { color: 0x0984e3 }), car(-4, -2, 'auto-gelb', 0, { color: 0xfdcb6e })];
    placeAsset(l, 'lieferwagen', 4.6, 0, -9, Math.PI, { solid: 'car' }); placeAsset(l, 'police', 4.6, 0, -27, Math.PI, { size: 6.6, solid: 'car' });
    // ---- Fähigkeit dieser Welt: Bellen. Drei Autos mit Alarmanlage – jedes einmal anbellen
    l.teacher(6, 28, 'bellen');
    l.alarms = 0;
    [[-4, -20], [4, 12], [-4, -2]].forEach(([x, z]) => l.barkTarget(x, 0, z, () => {
      l.alarms++; g.audio.sfx('honk'); g.shake(0.15);
      if (l.alarms < 3) { g.toast(`TÜT-TÜT! Alarmanlage ${l.alarms}/3`); return; }
      if (!g.hasBone(l.key, 'bellen')) { g.toast('Alle drei hupen! Der Lieferwagen erschrickt und verliert etwas Goldenes …'); l.spawnGoldbone(0, 1, -8, 'bellen'); }
    }, { ringY: 3 }));
    // Dächer-Parcours: Bretter zwischen den Läden, Lichterketten-Brücke über die Straße, Ringe
    [-24, 24].forEach(x => { l.box(x, 6.25, -16, 3, 0.3, 4.4, WOOD); l.box(x, 6.25, 1, 3, 0.3, 6.4, WOOD); }); // Bretter 5 cm über den Dächern, nicht bündig (Flackern)
    l.box(0, 6.25, 10, 36.4, 0.3, 1.8, 0xffeaa7);
    for (let x = -11; x <= 11; x += 2) l.deco(sphere(0.18, [0xff7675, 0xfdcb6e, 0x74b9ff][(x + 11) / 2 % 3], 0, 0, 0, 6), x, 6.9, 10.9);
    l.ringCourse([[24, 7.6, -24], [24, 7.6, 10], [0, 7.6, 10], [-24, 7.6, 10], [-24, 7.6, -24]], 'daecher', 30, 0x74b9ff);
    [[-12, 0], [12, 12], [0, -14]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z)));
    l.warp(-6, 0, 26, 'Hauptstraße', bench());
    [[-15.5, 3.3, -24, 'sausage'], [-15.5, 3.3, -8, 'bread'], [-12, 1.2, 20, 'bread'], [12, 1.2, 20, 'sausage'], [-4, roof[0] + 0.2, -20, 'bread'], [4, roof[1] + 0.2, 12, 'sausage'], [15.5, 3.3, -8, 'sausage'], [0, 0.3, -32, 'sausage']].forEach(([x, y, z, k]) => l.pickup(x, y, z, k, { goal: true }));
    // Straßen in die Viertel
    [[0, -66, 12, 60], [0, 66, 12, 60], [66, 0, 60, 12], [-66, 0, 60, 12]].forEach(([x, z, w, d]) => l.group.add(box(w, 0.04, d, ROAD, x, 0.02, z))); // etwas flacher als die Plätze, sonst flackert die Überlappung

    // ---- Norden: Kaufhaus (drei Etagen innen)
    l.zone(0, -110, 55, () => {
      l.box(0, 0, -112, 44, 18, 28, 0xdfe6e9); l.box(0, 18, -112, 46, 0.6, 30, 0x636e72);
      for (let i = 0; i < 3; i++) for (let k = -3; k <= 3; k++) l.deco(box(4, 2.4, 0.2, 0x74b9ff), k * 6, 3 + i * 5.5, -97.9);
      l.deco(makeSign('KAUFHAUS', { w: 10, post: 0.4 }), 0, 18.6, -99);
      l.door(0, 0, -97.6, { x: 2000, y: 0.2, z: 11, yaw: Math.PI }, { label: 'Eingang', frame: 0x2d3436 });
      [[-30, -90], [30, -90], [-30, -130], [30, -130]].forEach(([x, z]) => l.tree(x, z, 1.4, makeRoundTree(1.4)));
      l.warp(6, 0, -88, 'Kaufhaus', bench());
    });
    const kx = 2000; l.room(kx, 0, 44, 32);
    l.box(kx, -1, 0, 44, 1, 32, 0xf5f6fa); l.box(kx, 18, 0, 44, 1, 32, 0xdfe6e9);
    l.box(kx, 0, -16, 44, 18, 1, 0xdfe6e9); l.box(kx, 0, 16, 44, 18, 1, 0xdfe6e9); l.box(kx - 22, 0, 0, 1, 18, 32, 0xdfe6e9); l.box(kx + 22, 0, 0, 1, 18, 32, 0xdfe6e9);
    // EG: Regale; Rolltreppe hoch in den 1. Stock (Streifen z -15..-4, Höhe 6)
    [[-8, 4], [0, 4], [8, 4], [-8, -1], [8, -1]].forEach(([x, z], i) => l.box(kx + x, 0, z, 6, 1.8, 1.4, [0xfab1a0, 0x81ecec, 0xffeaa7, 0xa29bfe, 0x55efc4][i]));
    l.box(kx, 5.6, -9.5, 44, 0.4, 11, 0xb2bec3);
    l.ramp(kx - 18, 12, kx - 18, -4, 3, 0, 6, 0x636e72, { bridge: true });
    // 1. Stock: Kleiderständer; Rolltreppe in den 2. Stock (Galerie rechts, Höhe 12)
    [[-12, -6], [-4, -6], [4, -7]].forEach(([x, z]) => l.box(kx + x, 6, z, 4, 1.6, 1.2, 0x6c5ce7));
    l.box(kx + 15, 11.6, 0, 14, 0.4, 32, 0xb2bec3);
    l.ramp(kx - 6, -12.5, kx + 8, -12.5, 3, 6, 12, 0x636e72, { bridge: true });
    l.box(kx + 16, 12, 10, 3, 1.5, 3, 0xfdcb6e); // Podest
    l.goldbone('kaufhaus', kx + 16, 14.3, 10);
    [[-10, 10], [10, 10], [14, -6], [-14, -10, 6.3], [-2, -6, 6.3], [12, -12, 12.3], [18, 2, 12.3]].forEach(([x, z, y]) => l.pickup(kx + x, y ?? 0.3, z, 'crumb'));
    l.pickup(kx - 18, 6.3, -12, 'fish', { goal: true });
    const clerk = makeNpcDog(0xdfe6e9, 0xd63031); l.deco(clerk, kx + 4, 0, 10, Math.PI);
    l.trigger(kx + 4, 0, 10, 4, () => g.talk('vera', { mesh: clerk }), false);
    l.door(kx, 0, 15.4, { x: 0, y: 0.2, z: -95.4, yaw: 0 }, { label: 'Ausgang', ry: Math.PI, frame: 0x2d3436 });

    // ---- Osten: Baustelle mit Rohbau und Gerüst
    l.zone(105, 0, 55, () => {
      const bx = 110, bz = -6;
      l.group.add(box(50, 0.05, 50, 0xc8a165, bx, 0.03, bz)); // Sandboden
      for (let f = 0; f < 4; f++) { l.box(bx, f * 4.5, bz, 18, 0.5, 14, 0xb2bec3); [[-8.5, -6.5], [8.5, -6.5], [-8.5, 6.5], [8.5, 6.5]].forEach(([dx, dz]) => l.box(bx + dx, f * 4.5 + 0.5, bz + dz, 1, 4, 1, 0xb2bec3)); }
      l.box(bx, 18, bz, 18, 0.5, 14, 0xb2bec3);
      // Gerüst an der Westseite: Plattformen im Zickzack
      [[-11, -4, 1.5], [-11, 2, 3], [-12.5, 6, 4.5], [-11, 0, 6.2], [-12.5, -6, 7.8], [-11, -2, 9.4], [-11, 4, 11], [-12.5, 8, 12.6], [-11, 2, 14.2], [-11, -4, 15.8], [-11, 2, 17.2]].forEach(([dx, dz, y]) => l.box(bx + dx, y, bz + dz, 3, 0.3, 3, 0xe17055));
      for (let i = 0; i < 4; i++) l.deco(box(0.2, 18, 0.2, STEEL, 0, 9, 0), bx - 13.5, 0, bz - 6 + i * 4);
      l.box(bx + 6, 18.5, bz + 3, 3, 1.4, 3, 0x0984e3); // Dixi-Klo auf dem Dach
      l.goldbone('baustelle', bx + 6, 20.7, bz + 3);
      // Sandhaufen, Zementmischer, Absperrungen
      l.hill(bx - 4, bz + 22, 5, 2.4, { flat: 0.2, color: 0xe0b872, side: 0xc8a165 });
      l.deco(cyl(1.2, 0.8, 2, 0xf39c12, 0, 1.6, 0, 10).rotateZ(0.5), bx + 14, 0, bz + 16);
      for (let i = 0; i < 8; i++) l.deco(box(2, 1, 0.2, i % 2 ? 0xffffff : 0xe74c3c, 0, 0.8, 0), bx - 24, 0, bz - 18 + i * 4.5, Math.PI / 2);
      [[-26, -20], [-26, 18], [-20, 24], [-14, 24], [16, 20]].forEach(([dx, dz], i) => placeAsset(l, i < 4 ? 'cone' : 'carton', bx + dx, 0, bz + dz, i * 0.4, { scale: 2.2 })); // Pylonen, Karton
      l.pickup(bx, 9.8, bz, 'sausage', { goal: true });
      l.pickup(bx - 4, 2.7, bz + 22, 'ice', { special: true, onTake: () => l.eis(), onRestore: () => l.kugeln++ });
      const worker = makeNpcDog(0xd35400, 0xf1c40f); l.deco(worker, bx - 18, 0, bz + 10, Math.PI / 2);
      l.trigger(bx - 18, 0, bz + 10, 5, () => g.talk('paul', { mesh: worker }), false);
      [[90, -30], [125, 25]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z)));
      l.warp(86, 0, 8, 'Baustelle', bench());
    });

    // ---- Westen: Brunnenplatz mit Fontänen, Denkmal und Eisdiele
    l.zone(-105, 0, 55, () => {
      const fx = -110, fz = 0;
      l.group.add(box(56, 0.05, 56, 0xd8cfc4, fx, 0.03, fz));
      l.deco(cyl(9, 9.4, 0.8, 0x95a5a6, 0, 0.4, 0, 20), fx, 0, fz); l.deco(cyl(8.4, 8.4, 0.1, 0x74b9ff, 0, 0.82, 0, 20), fx, 0, fz);
      // Denkmal in der Mitte: Sockel 12 hoch, oben der Knochen
      l.box(fx, 0, fz, 3, 12, 3, 0x7f8c8d); l.deco(box(3.4, 0.3, 3.4, 0x6c7a89, 0, 0.15, 0), fx, 12, fz);
      // Fontänen: wachsen nacheinander – nur solange sie sprudeln, kann man draufstehen
      l.jets = [[-6, 5, 2.4], [-3, 6.5, 4.6], [1, 7, 6.8], [5, 4, 8.8], [5, -1, 10.6]].map(([dx, dz, h], i) => {
        const s = l.box(fx + dx, 0.8, fz + dz, 1.6, h - 0.8, 1.6, 0xbfe9ff, { dynamic: true });
        s.mesh.material = new THREE.MeshLambertMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.7, emissive: 0x3d8bd8, emissiveIntensity: 0.3 });
        return { s, phase: i * 0.7 };
      });
      l.box(fx + 3, 10.6, fz - 1, 2.6, 0.4, 2.6, 0x7f8c8d); // Vorsprung am Denkmal
      l.goldbone('brunnen', fx, 13.1, fz);
      // Eisdiele
      l.box(fx - 6, 0, fz + 22, 10, 4, 6, 0xffeaa7); l.box(fx - 6, 4, fz + 22, 11, 0.3, 7, 0xff7675);
      const ella = makeNpcDog(0xffe0b2, 0xff7675); l.deco(ella, fx - 6, 0, fz + 17.5, 0);
      l.kugeln = 0;
      l.interactable(fx - 6, 0, fz + 17.5, 2, it => {
        it.used = false;
        if (l.kugeln >= 3 && !g.hasBone(l.key, 'eisdiele')) { it.used = true; g.talk('ella.fertig', { mesh: ella }); l.spawnGoldbone(fx - 6, 0.6, fz + 15.5, 'eisdiele'); }
        else if (!g.hasBone(l.key, 'eisdiele')) g.talk('ella', { mesh: ella, vars: { n: l.kugeln, r: 3 - l.kugeln } });
      });
      l.pickup(fx + 16, 0.3, fz - 20, 'bread', { goal: true });
      [[-128, -24], [-90, 26], [-130, 22], [-88, -26]].forEach(([x, z]) => l.tree(x, z, 1.4, makeRoundTree(1.4)));
      [[-95, -15], [-125, 10]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z)));
      l.warp(-84, 0, 8, 'Brunnenplatz', bench());
    });

    // ---- Süden: Bahnhof mit Zug, Bahnsteig und Uhrturm
    l.zone(0, 108, 55, () => {
      for (let x = -40; x <= 40; x += 2) l.group.add(box(0.5, 0.12, 4, 0x6d4c41, x, 0.06, 110));
      [-1.4, 1.4].forEach(dz => l.group.add(box(84, 0.1, 0.2, 0x7f8c8d, 0, 0.15, 110 + dz)));
      l.box(0, 0, 102, 70, 1.2, 6, 0xb2bec3); // Bahnsteig
      for (let i = 0; i < 3; i++) { const x = -22 + i * 14; l.box(x, 0.3, 110, 12, 3.6, 3.6, i ? 0x0984e3 : 0xd63031); l.deco(box(10, 0.8, 3.7, 0xffffff), x, 2.3, 110); }
      l.box(-31, 0.3, 110, 6, 4.8, 3.6, 0xd63031); // Lok
      // Bahnhofsgebäude mit Uhrturm
      l.box(10, 0, 124, 30, 7, 10, 0xe17055); l.box(10, 7, 124, 31, 0.5, 11, 0x636e72);
      l.box(20, 7.5, 124, 5, 9, 5, 0xe17055); l.box(20, 16.5, 124, 6, 0.4, 6, 0x636e72);
      l.deco(cyl(1.4, 1.4, 0.2, 0xffffff, 0, 0, 0, 16).rotateX(Math.PI / 2), 20, 13, 121.4);
      [[6, 7.5, 120.5, 1.4], [10, 7.5, 120.5, 2.8], [14, 7.5, 120.5, 4.2], [16.8, 7.5, 120.5, 5.6]].forEach(([x, y, z, h]) => l.box(x, y, z, 2, h, 2, 0xa1887f)); // Koffer-Stapel auf dem Dach
      l.box(18.5, 7.5, 120.5, 1.4, 7.4, 1.4, 0xa1887f);
      [[-8, 1.5], [-5.5, 3], [-3, 4.5], [-0.5, 6]].forEach(([x, h]) => l.box(x, 0, 117.5, 2, h, 2, 0xa1887f)); // Kisten hoch aufs Bahnhofsdach
      l.goldbone('bahnhof', 20, 17.7, 124);
      l.pickup(-8, 4.2, 110, 'bread', { goal: true });
      l.pickup(30, 1.5, 102, 'ice', { special: true, onTake: () => l.eis(), onRestore: () => l.kugeln++ });
      const cond = makeNpcDog(0x2d3436, 0x0984e3); l.deco(cond, -10, 1.2, 101, 0);
      l.trigger(-10, 1.2, 101, 4, () => g.talk('schorsch', { mesh: cond }), false);
      l.warp(-6, 1.2, 100, 'Bahnhof', bench());
      [85, 93].forEach(z => placeAsset(l, 'taxi', -3.2, 0, z, 0, { size: 6.6, solid: 'car' })); // Taxistand vor dem Bahnsteig
    });
    l.pickup(60, 0.3, -60, 'ice', { special: true, onTake: () => l.eis(), onRestore: () => l.kugeln++ });
    l.eis = () => { l.kugeln++; g.toast(`Eiskugel ${l.kugeln}/3 – zurück zur Eisdiele am Brunnenplatz!`); };

    l.scatter(70);
    l.label('12 Essensreste in allen Vierteln finden – Vorsicht, Kater!', 0, 4, 26);
  },
  update(l, dt) {
    if (!l.jets) return;
    l.jetT = (l.jetT || 0) + dt;
    for (const j of l.jets) { const on = ((l.jetT + j.phase) % 4.5) < 3.3; j.s.active = on; j.s.mesh.visible = on; }
  },
  onGoal(l) { l.game.toast('Ein Fauchen vom Dach … DER KATER!'); l.game.later(1000, () => l.setBoss(new Cat(l.game, 0, 0, 13))); },
};
