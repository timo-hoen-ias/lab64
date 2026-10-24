// Der Hafen: alter Holzkai in der Mitte, Containerterminal mit Riesenkran, Fischmarkthalle, Mole mit Leuchtturm,
// Frachtschiff mit Laderaum und ein Hafenbecken zum Tauchen. Wasser bei y = 1.3, Grund bei y = -10.
import * as THREE from 'three';
import { BirdBoss, BeachCrab, Jelly, Pigeon } from '../bosses.js';
import { box, cyl, cone, sphere, makeNpcDog } from '../models.js';
import { FX } from '../fx.js';

const WOOD = 0x8d6e4a, CONCRETE = 0xa4a7ab, SEA = 1.3, BED = -10;
const CONT = [0xe74c3c, 0x3498db, 0x27ae60, 0xe67e22, 0x9b59b6, 0x16a085, 0xf1c40f];

function bollard() { const g = new THREE.Group(); g.add(cyl(0.45, 0.55, 1, 0x2d3436, 0, 0.5, 0, 8)); g.add(cyl(0.6, 0.6, 0.2, 0x2d3436, 0, 1.05, 0, 8)); return g; }

export const HAFEN = {
  name: 'Der Hafen', surface: 'sand', time: 'wolkig', backdrop: 'meer', sky: 0x74b9ff, ground: 0x35556a, floorY: BED, killY: -30, size: 150, minFloor: 1.9, need: 8, goalKind: 'fish', camFloor: -Infinity,
  waterFog: 0x22607a, waterView: 26,
  music: { scale: 'mixo', root: 262, bpm: 124, seed: 42, style: 'harbor' },
  build(l) {
    const g = l.game, Q = (x, z, w, d, top = 2, c = WOOD) => l.box(x, BED, z, w, top - BED, d, c); // Kaimauer bis zum Grund
    l.spawn.set(0, 2.5, 26);
    l.sea(SEA, 0x1e90ff);

    // ---- Alter Holzkai (Kern wie bisher)
    Q(0, 10, 50, 36); Q(-26, -14, 14, 20); Q(20, -16, 20, 16); Q(0, -20, 6, 30);
    const crates = [[-10, 2, 4], [-7, 2, 4], [-8.5, 4.5, 4], [12, 2, 12], [15, 2, 12], [12, 2, 15], [13.5, 4.5, 13.5], [-20, 2, -10], [-20, 4.5, -10], [-20, 7, -10], [24, 2, -18], [20, 2, -22]];
    crates.forEach(([x, y, z]) => l.box(x, y, z, 2.5, 2.5, 2.5, 0xc0905a));
    l.box(28, 2, 0, 2, 14, 2, 0xf1c40f); l.box(24, 14, -4, 12, 1, 1.4, 0xf1c40f);
    [[22, -12, 4, 0xe74c3c], [24.6, -12, 6, 0x3498db], [24.6, -9.4, 8, 0x27ae60], [22, -9.4, 10, 0xe67e22], [19.4, -9.4, 12, 0x9b59b6], [19.4, -6.8, 13.6, 0xe74c3c]].forEach(([x, z, top, c]) => l.box(x, 2, z, 2.4, top - 2, 2.4, c));
    l.goldbone('kletter', 28, 16.6, 0);
    l.goldbone('geheim', -31, 2.6, -5, { hidden: true });
    l.box(-20, 2, 20, 8, 1.6, 8, 0x2d3436);
    [[-16, 0], [-16, 20], [16, 0], [16, 20]].forEach(([x, z]) => l.deco(bollard(), x, 2, z));
    l.box(0, 1.2, -36, 8, 1.5, 5, 0xd63031); l.box(0, 2.7, -36, 1, 6, 1, 0xffffff); l.deco(box(5, 0.2, 5, 0xffffff), 0, 6, -36);
    [[-8.5, 7.2, 4], [13.5, 7.2, 13.5], [-20, 9.7, -10], [22, 2.3, -22], [19, 15.3, -4], [-20, 3.8, 20], [0, 2.9, -36], [-30, 2.3, -22]].forEach(([x, y, z]) => l.pickup(x, y, z, 'fish', { goal: true, hidden: true }));
    // Leitern aus dem Wasser an jeder Kaikante
    [[0, 28.6], [-25, 28.6], [25, 28.6], [-33.6, -14], [30.6, -16], [0, -35.6]].forEach(([x, z]) => l.box(x, SEA - 0.6, z, 1.4, 0.5, 1.2, 0x636e72));
    // Taucher Tim: gibt die Taucherbrille, falls man den Strand noch nicht kennt
    const diver = makeNpcDog(0x2d3436, 0xf1c40f); l.deco(diver, 8, 2, 24, Math.PI);
    l.abilityItem(5, 3, 22, 'tauchen', 'TAUCHERBRILLE! Im Wasser NASE halten = tauchen, SPRUNG = hoch.');
    l.trigger(8, 2, 24, 6, () => g.talk(g.has('tauchen') ? 'tim.tauchen' : 'tim', { mesh: diver }), false);
    l.warp(-6, 2, 24, 'Holzkai', bollard());
    // ---- Fähigkeit dieser Welt: Gleiten. Vom Ausguck übers Wasser zum Möwennest, ein Aufwind hilft
    l.teacher(-11, 25, 'gleiten');
    [[16, 22, 3.6], [18.5, 22, 5.2], [18.5, 24.5, 6.8], [16, 24.5, 8.4], [13.5, 24.5, 10]].forEach(([x, z, top]) => l.box(x, 2, z, 2.5, top - 2, 2.5, 0x8d6e4a));
    l.label('Ausguck', 13.5, 12, 24.5);
    l.box(13.5, BED, 45, 4, 8 - BED, 4, 0x7f8c8d); l.deco(cyl(1.6, 1.2, 0.6, 0xc49a6c, 0, 0.3, 0, 10), 13.5, 8, 45); // Pfahl mit Möwennest
    l.goldbone('gleiten', 13.5, 8.8, 45);
    l.updraft(13.5, SEA, 35, 13, 2.6);

    // ---- Osten: Containerterminal mit Riesenkran
    l.zone(90, -10, 60, () => {
      Q(88, -10, 84, 100, 2, CONCRETE);
      l.box(40, 2, 0, 8, 0.3, 4, WOOD); // Steg vom Holzkai rüber
      // Container-Reihen (Dekor + Krümelverstecke) und eine Treppe hoch zum Kran
      let k = 0;
      for (let x = 58; x <= 112; x += 9) for (let z = -52; z <= 30; z += 7) { if (Math.abs(z + 20) < 6 && x > 95) continue; const n = 1 + ((x * 7 + z * 3) % 3 + 3) % 3; for (let i = 0; i < n; i++) l.box(x, 2 + i * 2.6, z, 6, 2.6, 2.6, CONT[k++ % CONT.length]); }
      [[96, -14, 1], [99, -14, 2], [102, -14, 3], [105, -14, 4], [108, -14, 5]].forEach(([x, z, n], i) => l.box(x, 2, z, 2.6, n * 2.6, 2.6, CONT[i]));
      // Kran: Turm, Leitersprossen, Ausleger
      l.box(112, 2, -20, 4, 26, 4, 0xf1c40f);
      for (let i = 0; i < 6; i++) l.box(110.6 + (i % 2) * 2.8, 15 + i * 2.2, -17.6, 1.6, 0.3, 1.2, 0xf39c12);
      l.box(112, 28, -20, 6, 0.6, 6, 0xf1c40f); l.box(100, 28.6, -20, 20, 1, 1.6, 0xf1c40f);
      l.deco(box(2.5, 2, 2.5, 0x2d3436), 112, 30.2, -20);
      l.goldbone('kran', 92, 30.4, -20);
      for (let i = 0; i < 4; i++) l.addEnemy(new BeachCrab(g, 70 + i * 10, 36));
      l.warp(60, 2, 38, 'Terminal', bollard());
    });

    // ---- Westen: Fischmarkthalle (innen eigener Raum)
    l.zone(-90, -15, 50, () => {
      Q(-88, -15, 84, 90, 2, CONCRETE);
      l.box(-40, 2, -6, 6, 0.3, 4, WOOD);
      const hx = -92, hz = -15;
      l.box(hx, 2, hz - 12, 32, 10, 1, 0x95a5a6); l.box(hx, 2, hz + 12, 32, 10, 1, 0x95a5a6); l.box(hx - 16, 2, hz, 1, 10, 24, 0x95a5a6);
      l.box(hx + 16, 2, hz - 7, 1, 10, 10, 0x95a5a6); l.box(hx + 16, 2, hz + 7, 1, 10, 10, 0x95a5a6); l.box(hx + 16, 7, hz, 1, 5, 4, 0x95a5a6);
      l.box(hx, 12, hz, 34, 0.6, 26, 0x2980b9);
      l.door(hx + 16.6, 2, hz, { x: 3000, y: 0.2, z: 12, yaw: Math.PI }, { label: 'Fischmarkt', ry: Math.PI / 2 });
      [[-60, -40], [-120, 20], [-70, 25]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z)));
      l.warp(-50, 2, 10, 'Fischmarkt', bollard());
    });
    // Fischmarkt innen: Stände, Kisten, hängende Lampen als Sprungweg zum Dachbalken
    const mx = 3000; l.room(mx, 0, 40, 30);
    l.box(mx, -1, 0, 40, 1, 30, 0x7f8c8d); l.box(mx, 11, 0, 40, 1, 30, 0x34495e);
    l.box(mx, 0, -15, 40, 11, 1, 0xbdc3c7); l.box(mx, 0, 15, 40, 11, 1, 0xbdc3c7); l.box(mx - 20, 0, 0, 1, 11, 30, 0xbdc3c7); l.box(mx + 20, 0, 0, 1, 11, 30, 0xbdc3c7);
    [[-12, -6], [-12, 4], [0, -6], [0, 4], [12, -6], [12, 4]].forEach(([x, z], i) => { l.box(mx + x, 0, z, 6, 1.1, 2.4, 0xecf0f1); l.deco(box(6.2, 0.15, 2.8, [0xe74c3c, 0x3498db, 0x27ae60][i % 3]), mx + x, 2.6, z); for (let f = 0; f < 4; f++) l.deco(box(0.7, 0.2, 0.3, 0x7fb6d8), mx + x - 2 + f * 1.3, 1.25, z); });
    [[-16, 1.2, 10], [-12, 2.6, 10], [-8, 4, 10], [-4, 5.4, 8], [0, 6.8, 6], [4, 8.2, 4]].forEach(([x, y, z]) => l.box(mx + x, y, z, 2, 0.4, 2, 0xf39c12)); // Lampen/Kisten-Treppe
    l.box(mx + 4, 9.4, -2, 30, 0.5, 1.2, 0x5d4037); // Dachbalken
    l.goldbone('markt', mx + 16, 10.6, -2);
    [[-16, -12], [16, -12], [-6, 12], [8, 12], [16, 0]].forEach(([x, z]) => l.pickup(mx + x, 0.3, z, 'crumb'));
    const seller = makeNpcDog(0xf5f0e1, 0x2980b9); l.deco(seller, mx - 4, 0, 10, Math.PI);
    l.trigger(mx - 4, 0, 10, 4, () => g.talk('fritz', { mesh: seller }), false);
    l.door(mx, 0, 14.4, { x: -74, y: 2.3, z: -15, yaw: -Math.PI / 2 }, { label: 'Ausgang', ry: Math.PI });

    // ---- Süden: Mole mit Leuchtturm, Bojen-Parcours im Becken
    l.zone(-20, 90, 55, () => {
      l.box(-20, BED, 86, 6, 12.5, 116, 0x7f8c8d); // Mole von z 28 bis 144
      for (let z = 34; z < 144; z += 5) [-4, 4].forEach(dx => l.deco(sphere(1.2, 0x95a5a6, 0, 0, 0, 5), -20 + dx, 1.4, z + (dx > 0 ? 2 : 0)));
      const ly = 2.5; l.box(-20, ly, 140, 4, 16, 4, 0xffffff);
      for (let i = 0; i < 5; i++) l.deco(cyl(2.15, 2.15, 1.4, 0xe74c3c, 0, 0, 0, 12), -20, ly + 1.5 + i * 3, 140);
      for (let i = 0; i < 11; i++) { const a = i * 0.6 + Math.PI, r = 3.6; l.box(-20 + Math.cos(a) * r, ly + 1 + i * 1.4, 140 + Math.sin(a) * r, 1.9, 0.4, 1.9, 0x95a5a6); }
      l.box(-20, ly + 16, 140, 6, 0.4, 6, 0x95a5a6); l.deco(sphere(1, 0xfff3a0, 0, 0, 0, 10), -20, ly + 17.6, 140);
      l.goldbone('mole', -18, ly + 17, 142);
      l.warp(-20, 2.5, 60, 'Mole', bollard());
      // Bojen: an der Wasseroberfläche schwimmen
      const buoys = [[-5, 45], [10, 60], [25, 72], [15, 88], [-2, 100]];
      buoys.forEach(([x, z]) => { l.deco(cyl(0.6, 0.8, 1.4, 0xff7675, 0, 0, 0, 8), x + 2.2, SEA - 0.4, z); l.deco(cone(0.3, 0.6, 0xffffff, 0, 0, 0, 6), x + 2.2, SEA + 0.6, z); });
      l.ringCourse(buoys.map(([x, z]) => [x, SEA - 0.2, z]), 'bojen', 18, 0xff7675);
    });

    // ---- Südosten: Frachtschiff mit Laderaum, Hafenbecken mit Anker
    l.zone(60, 90, 50, () => {
      l.box(60, BED + 2, 92, 44, 14, 20, 0x2c3e50); l.deco(box(44.2, 1.2, 20.2, 0xc0392b), 60, BED + 2.6, 92); // Rumpf
      l.box(60, 6, 92, 42, 0.4, 18, 0x95a5a6, { surface: 'metal' }); // Deck (Oberkante 6.4)
      l.box(76, 6.4, 92, 8, 8, 10, 0xecf0f1); l.box(76, 14.4, 92, 9, 0.5, 11, 0x34495e); // Brücke
      l.deco(cyl(0.8, 0.8, 6, 0xe67e22, 0, 3, 0, 10), 70, 6.4, 92);
      [[48, 88], [54, 96], [60, 88]].forEach(([x, z], i) => l.box(x, 6.4, z, 6, 2.6, 2.6, CONT[i + 2]));
      l.ramp(60, 41, 60, 81.5, 3, 2, 6.4, 0x7f8c8d, { bridge: true }); // Gangway vom Terminal
      l.door(44, 6.4, 92, { x: 3300, y: 0.2, z: 10, yaw: Math.PI }, { label: 'Laderaum', ry: -Math.PI / 2 });
      // Anker mit Kette am Grund, versunkenes Auto
      const anchor = new THREE.Group(); anchor.add(box(0.5, 4, 0.5, 0x636e72, 0, 2, 0)); anchor.add(box(4, 0.6, 0.6, 0x636e72, 0, 0.3, 0)); [-2, 2].forEach(s => anchor.add(cone(0.5, 1, 0x636e72, s, 0.9, 0, 4))); l.deco(anchor, 40, BED, 80);
      for (let i = 0; i < 8; i++) l.deco(sphere(0.35, 0x636e72, 0, 0, 0, 5), 40 + i * 0.7, BED + 4 + i * 1.3, 80 + i * 1.4);
      l.box(25, BED, 70, 4, 1.6, 2.2, 0x0984e3); l.deco(box(2.4, 1, 2, 0x74b9ff), 25, BED + 2.1, 70);
      l.goldbone('anker', 41.5, BED + 0.6, 78);
      l.airBubbles(36, BED, 76, SEA - BED); l.airBubbles(22, BED, 62, SEA - BED);
      [[30, 55], [50, 65], [15, 80]].forEach(([x, z]) => l.addEnemy(new Jelly(g, x, -4, z)));
      for (const [x, z] of [[28, 66], [33, 82], [46, 70], [18, 74]]) l.pickup(x, BED + 0.4, z, 'crumb');
      l.warp(60, 6.4, 98, 'Frachter', bollard());
    });
    // Laderaum innen: Kisten-Labyrinth im Halbdunkel
    const sx = 3300; l.room(sx, 0, 40, 26);
    l.box(sx, -1, 0, 40, 1, 26, 0x2c3e50); l.box(sx, 8, 0, 40, 1, 26, 0x1e272e);
    l.box(sx, 0, -13, 40, 8, 1, 0x34495e); l.box(sx, 0, 13, 40, 8, 1, 0x34495e); l.box(sx - 20, 0, 0, 1, 8, 26, 0x34495e); l.box(sx + 20, 0, 0, 1, 8, 26, 0x34495e);
    [[-14, 6, 2], [-14, 0, 1], [-8, -6, 3], [-2, 4, 2], [4, -4, 2], [8, 6, 1], [12, -8, 3], [16, 2, 2], [-6, -10, 1], [2, 10, 1]].forEach(([x, z, n], i) => { for (let k = 0; k < n; k++) l.box(sx + x, k * 2.4, z, 4, 2.4, 2.4, k % 2 ? 0xc0905a : 0xa47148); });
    l.goldbone('laderaum', sx + 12, 7.8, -8);
    [[-17, -10], [17, 10], [0, 0], [-10, 10], [10, -2]].forEach(([x, z]) => l.pickup(sx + x, 0.3, z, 'crumb'));
    for (let i = 0; i < 5; i++) l.deco(sphere(0.3, 0xfff3a0, 0, 0, 0, 6), sx - 16 + i * 8, 7.5, 0);
    l.door(sx, 0, 12.4, { x: 47, y: 6.8, z: 92, yaw: Math.PI / 2 }, { label: 'An Deck', ry: Math.PI });

    l.scatter(50);
    l.label('Die Möwe hat 8 Fische versteckt. Halte NASE gedrückt!', 0, 6, 20);
    l.gull = new BirdBoss(g, 'seagull', 0, 0, 'Die Möwe'); l.gull.decor = true; l.group.add(l.gull.mesh);
  },
  update(l, dt) {
    if (l.gull && !l.gullActive) { const g = l.gull; g.t += dt; g.mesh.position.set(Math.cos(g.t * 0.5) * 20, 12 + Math.sin(g.t) * 2, Math.sin(g.t * 0.5) * 20); g.mesh.rotation.y = -g.t * 0.5 + Math.PI; g.mesh.userData.wings.forEach((w, i) => w.rotation.z = Math.sin(g.t * 10) * 0.5 * (i ? -1 : 1)); }
  },
  onGoal(l) { l.game.toast('KREEEE! Die Möwe will ihre Beute zurück!'); l.gullActive = true; l.group.remove(l.gull.mesh); l.game.later(1000, () => { const b = new BirdBoss(l.game, 'seagull', 0, 10, 'Die Möwe'); b.pos.y = 8; b.restY = 2; l.setBoss(b); }); },
};
