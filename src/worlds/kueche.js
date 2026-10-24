// Das Erdgeschoss: Küche in der Mitte, Speisekammer, Wohnzimmer mit Bücherregal, Flur mit Treppe, Galerie und Standuhr,
// Wintergarten und ein Keller (eigener Raum) mit Waschmaschine und Wäschekorb.
import * as THREE from 'three';
import { Vacuum } from '../bosses.js';
import { box, cyl, sphere, makeLabel, makeNpcDog, makeRoundTree } from '../models.js';
import { AntSwarm } from '../abilities.js';

const WALL = 0xfdf4e3, WOOD = 0xa0522d, H = 16;

// Wand entlang x (z fest) oder z (x fest) mit Durchgängen [von, bis]
function wallZ(l, z, x0, x1, gaps = []) { let a = x0; for (const [g0, g1] of [...gaps, [x1, x1]]) { if (g0 > a) l.box((a + g0) / 2, 0, z, g0 - a, H, 1, WALL); a = g1; } }
function wallX(l, x, z0, z1, gaps = []) { let a = z0; for (const [g0, g1] of [...gaps, [z1, z1]]) { if (g0 > a) l.box(x, 0, (a + g0) / 2, 1, H, g0 - a, WALL); a = g1; } }

export const KUECHE = {
  name: 'Das Erdgeschoss', indoor: true, sky: 0xfff1c9, ground: 0xe7d2a8, size: 60, need: 8, goalKind: 'ham',
  music: { scale: 'mixo', root: 294, bpm: 132, seed: 3, style: 'kitchen' },
  build(l) {
    const g = l.game;
    l.spawn.set(0, 1, 12); l.wallRing(60, H, WALL);
    wallX(l, -18, -60, 60, [[-40, -34], [4, 10], [36, 42]]); wallX(l, 18, -60, 60, [[-40, -34], [6, 12], [36, 42]]);
    wallZ(l, -18, -18, 18, [[-5, 0]]); wallZ(l, 18, -18, 18, [[-3, 3]]);
    [[-18, 7, 'Wohnzimmer'], [18, 9, 'Flur']].forEach(([x, z, t]) => { const s = makeLabel(t); s.scale.set(4, 1, 1); l.deco(s, x, 5, z); });

    // ---- Küche (Kern, wie bisher)
    for (let x = -16; x < 16; x += 4) for (let z = -16; z < 16; z += 4) if ((x + z) % 8 === 0) l.group.add(box(4, 0.05, 4, 0xd6bf94, x + 2, 0.03, z + 2));
    l.box(-12, 0, -14, 12, 1, 4, WOOD); l.box(-12, 1, -16.5, 12, 0.4, 2, 0xf5f5f5);
    l.box(-16, 0, -11, 3, 0.6, 2, WOOD); l.box(-13.5, 0, -11, 2, 1.0, 2, WOOD);
    l.box(6, 0, -14, 10, 1.5, 4, WOOD); l.box(6, 1.5, -14, 10, 0.3, 4, 0x777777);
    l.box(14, 0, -10, 4, 4, 6, 0xf0f0f0); l.box(14, 4, -10, 4, 0.3, 6, 0xdddddd);
    l.box(11, 0, -5, 2, 1, 2, 0xc9a66b); l.box(13, 0, -2.5, 2, 2, 2, 0xc9a66b); l.box(15, 0, 0, 2, 3, 2, 0xc9a66b);
    l.box(0, 0, 2, 8, 1.6, 5, 0xd2b48c);
    l.box(-5, 0, 6, 1.4, 0.9, 1.4, 0x8b5a2b); l.box(5, 0, 6, 1.4, 0.9, 1.4, 0x8b5a2b);
    l.deco(cyl(1.2, 1.0, 0.6, 0xd63031, 6, 1.8, -14, 14), 6, 1.8, -14);
    l.box(-6, 3.5, -16.5, 4, 0.3, 2, 0xf5f5f5); l.box(2, 5.5, -16.5, 4, 0.3, 2, 0xf5f5f5);
    l.goldbone('kletter', 2, 6.3, -16.5);
    // ---- Fähigkeit dieser Welt: Trillern. Opa Bruno am Eingang, Übungskreisel neben ihm
    l.teacher(-8, 13, 'trillern', { say: 'Opa Bruno: „Am Herd sind drei Drehknöpfe – dreh sie alle mit Trillern auf!“' });
    l.spinTarget(-10.5, 0.7, 15, () => g.toast('Opa Bruno: „Genau so! Ameisen mögen das übrigens gar nicht.“'));
    // Herd: drei Drehknöpfe vorne – alle aufgetrillert, kocht im Topf ein Goldknochen hoch
    l.herd = 0;
    [3, 6, 9].forEach(x => l.spinTarget(x, 0.9, -11.75, () => {
      l.herd++; if (l.herd < 3) { g.toast(`Herdknopf ${l.herd}/3`); return; }
      if (!g.hasBone(l.key, 'trillern')) { g.toast('Alle Platten an! Im Topf blubbert etwas Goldenes hoch …'); l.spawnGoldbone(6, 2.6, -13, 'trillern'); }
    }));
    // Ameisenstraßen: versperren die Wege zur Speisekammer, zum Bücherregal und zur Treppe – nur Trillern hilft
    [[-14, -50], [-53, 4], [28, 53]].forEach(([x, z]) => l.addEnemy(new AntSwarm(g, x, 0.05, z, 2.4)));
    l.goldbone('geheim', 17, 0.6, -10, { hidden: true });
    [[-12, 1.5, -16], [6, 1.9, -14], [14, 4.4, -10], [0, 1.7, 2]].forEach(([x, y, z]) => l.pickup(x, y, z, 'ham', { goal: true }));

    // ---- Speisekammer (Norden): Regalbretter im Zickzack bis unter die Decke
    l.box(-14, 0, -53.5, 3, 1.5, 3, 0xc9a66b);
    [[-12, 3], [-6, 5], [0, 7], [6, 9], [12, 11]].forEach(([x, y], i) => { l.box(x, y - 0.4, -57, 5, 0.4, 4, 0xdeb887); for (let k = 0; k < 3; k++) l.deco(cyl(0.35, 0.35, 0.9, [0xe74c3c, 0xf1c40f, 0x27ae60][(i + k) % 3], 0, 0.45, 0, 8), x - 1.6 + k * 1.6, y, -58.4); });
    for (let i = 0; i < 5; i++) l.box(-12 + i * 6, 0, -59.6, 0.3, 11, 0.3, 0x8b5a2b);
    l.box(10, 0, -30, 5, 2, 5, 0xc9a66b); l.box(-10, 0, -24, 4, 3, 3, 0x95a5a6); // Kartoffelsack, Getränkekiste
    l.goldbone('vorrat', 12, 11.8, -57);
    [[-12, 3.3, -56], [0, 7.3, -56]].forEach(([x, y, z]) => l.pickup(x, y, z, 'ham', { goal: true }));
    l.pickup(6, 9.3, -56, 'sock', { special: true, onTake: () => l.socke(), onRestore: () => l.socken++ });

    // ---- Wohnzimmer (Westen): Sofa, Kamin, riesiges Bücherregal
    l.group.add(box(26, 0.05, 30, 0x8e44ad, -40, 0.03, 10));
    l.box(-40, 0, 22, 14, 2.2, 4, 0x2980b9); l.box(-40, 2.2, 23.6, 14, 2, 0.8, 0x2471a3); l.box(-46.6, 2.2, 22, 0.8, 1, 4, 0x2471a3); l.box(-33.4, 2.2, 22, 0.8, 1, 4, 0x2471a3);
    l.box(-40, 0, 12, 6, 1.2, 3, 0x6d4c41); // Couchtisch
    l.box(-40, 0, -58, 12, 6, 3, 0x7f8c8d); l.deco(box(5, 3, 0.2, 0x2d3436), -40, 1.6, -56.4); l.deco(sphere(0.9, 0xff7f27, 0, 0, 0, 6), -40, 1.2, -57); // Kamin
    l.box(-40, 6, -58, 14, 0.4, 3.6, 0x5d4037); // Kaminsims
    // Bücherregal an der Westwand mit Brettern zum Hochklettern
    l.box(-58, 0, 0, 3, 14, 22, 0x6d4c41);
    [[-55.5, 6, 2], [-55.5, 2, 4], [-55.5, -2, 6], [-55.5, 2, 8], [-55.5, 6, 10], [-55.5, 2, 12]].forEach(([x, z, y]) => l.box(x, y - 0.4, z, 2.2, 0.4, 3, 0xa1887f));
    for (let i = 0; i < 6; i++) for (let k = 0; k < 7; k++) l.deco(box(0.5, 1.6, 0.3 + (k % 3) * 0.1, [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12][(i + k) % 4]), -56.6, 0.6 + i * 2.2, -9 + k * 2.6);
    l.goldbone('regal', -58, 14.8, 0);
    l.pickup(-40, 2.5, 21, 'ham', { goal: true });
    l.pickup(-40, 0.3, 26, 'sock', { special: true, onTake: () => l.socke(), onRestore: () => l.socken++ });
    l.deco(makeRoundTree(1.2), -24, 0, -50);

    // ---- Flur (Osten): Treppe zur Galerie, Garderobe und Standuhr, Kellertür
    l.ramp(28, 50, 28, 10, 5, 0, 9, 0xb07a4f);
    l.box(28, 0, 0, 8, 9, 20, 0xb07a4f); // Treppenabsatz
    l.box(46, 8.6, -6, 28, 0.4, 6, 0xb07a4f); for (let x = 33; x <= 59; x += 2) l.deco(box(0.15, 1.2, 0.15, 0x6d4c41), x, 9.6, -3.2);
    l.goldbone('treppe', 56, 9.8, -6);
    l.pickup(44, 9.3, -6, 'sock', { special: true, onTake: () => l.socke(), onRestore: () => l.socken++ });
    l.box(36, 0, 57, 6, 2, 3, 0x8b5a2b); [[41.5, 3.6], [45.5, 5.6], [49.5, 7.6]].forEach(([x, y]) => l.box(x, y, 57, 3, 0.4, 3, 0x8b5a2b));
    l.box(53.5, 0, 57, 4, 9.5, 3, 0x6d4c41); l.deco(cyl(1.3, 1.3, 0.2, 0xfdf4e3, 0, 0, 0, 16).rotateX(Math.PI / 2), 53.5, 7.5, 55.4);
    l.pendel = l.deco(box(0.2, 3, 0.2, 0xf1c40f), 53.5, 2, 55.4);
    l.goldbone('uhr', 53.5, 10.3, 57);
    l.door(59.4, 0, -40, { x: 2000, y: 0.2, z: 10, yaw: Math.PI }, { label: 'Keller', ry: -Math.PI / 2 });

    // ---- Wintergarten (Süden): Pflanzen, Hängekörbe
    l.group.add(box(36, 0.05, 42, 0xa5d6a7, 0, 0.03, 39));
    [[-12, 30], [12, 30], [-12, 50], [12, 50], [0, 56]].forEach(([x, z]) => { l.box(x, 0, z, 3, 1.2, 3, 0xd35400); l.deco(makeRoundTree(1.1), x, 1.2, z); });
    l.pickup(0, 0.3, 40, 'ham', { goal: true });
    l.pickup(6, 0.3, 46, 'sock', { special: true, onTake: () => l.socke(), onRestore: () => l.socken++ });
    l.socke = () => { l.socken++; g.toast(`Socke ${l.socken}/5 – ab in den Wäschekorb im Keller!`); };

    // ---- Keller (eigener Raum): Waschmaschine, Heizungsrohre, Wäschekorb
    const kx = 2000; l.room(kx, 0, 40, 28);
    l.box(kx, -1, 0, 40, 1, 28, 0x7f8c8d); l.box(kx, 10, 0, 40, 1, 28, 0x57606f);
    l.box(kx, 0, -14, 40, 10, 1, 0x95a5a6); l.box(kx, 0, 14, 40, 10, 1, 0x95a5a6); l.box(kx - 20, 0, 0, 1, 10, 28, 0x95a5a6); l.box(kx + 20, 0, 0, 1, 10, 28, 0x95a5a6);
    l.box(kx - 12, 0, -10, 4, 4, 4, 0xf5f6fa); l.deco(cyl(1.2, 1.2, 0.2, 0x34495e, 0, 0, 0, 14).rotateX(Math.PI / 2), kx - 12, 2, -7.9); // Waschmaschine
    l.box(kx - 7, 0, -10, 4, 6, 4, 0xf5f6fa); // Trockner obendrauf-Stapel
    l.box(kx, 7.6, -11, 30, 0.6, 1.6, 0xb87333); // Heizungsrohr
    l.box(kx - 16.5, 0, -10, 3, 2, 3, 0x8d6e63);
    l.box(kx + 10, 0, -10, 4, 2, 4, 0x8d6e63); l.box(kx + 14, 0, -6, 3, 3.6, 3, 0x8d6e63);
    l.goldbone('keller', kx + 12, 8.6, -11);
    const basket = new THREE.Group(); basket.add(cyl(1.4, 1.1, 1.4, 0xd7b98e, 0, 0.7, 0, 12)); l.deco(basket, kx + 6, 0, 6);
    l.socken = 0;
    l.interactable(kx + 6, 0, 6, 2, it => {
      it.used = false;
      if (l.socken >= 5 && !g.hasBone(l.key, 'socken')) { it.used = true; g.toast('Alle 5 Socken im Korb! Darunter lag was Goldenes …'); l.spawnGoldbone(kx + 6, 1.8, 6, 'socken'); }
      else if (!g.hasBone(l.key, 'socken')) g.toast(`Der Wäschekorb – es fehlen noch ${5 - l.socken} Socken.`, 3000);
    });
    l.pickup(kx + 14, 3.9, -6, 'sock', { special: true, onTake: () => l.socke(), onRestore: () => l.socken++ });
    [[-16, 10], [-4, 0], [8, -2], [16, 10]].forEach(([x, z]) => l.pickup(kx + x, 0.3, z, 'crumb'));
    const lamp = new THREE.PointLight(0xffe6a8, 1.4, 30); lamp.position.set(kx, 8, 0); l.scene.add(lamp);
    l.door(kx, 0, 13.4, { x: 57.5, y: 0.2, z: -40, yaw: Math.PI / 2 }, { label: 'Treppe hoch', ry: Math.PI });

    l.scatter(60);
    l.label('Sammle 8 Schinken im ganzen Erdgeschoss!', 0, 4, 10);
  },
  update(l, dt) { if (l.pendel) { l.pendelT = (l.pendelT || 0) + dt; l.pendel.rotation.z = Math.sin(l.pendelT * 2.5) * 0.35; } },
  onGoal(l) { l.game.toast('Was brummt da?! Der STAUBSAUGER!'); l.game.audio.sfx('vacuum'); l.game.later(1200, () => l.setBoss(new Vacuum(l.game, 0, 8, 13))); },
};
