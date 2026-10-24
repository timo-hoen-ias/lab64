// Das Hochhaus: vier Ebenen übereinander, verbunden durch lange Treppen an den Außenwänden.
// EG Großraumbüro (Schubladen, Kantine), 1. Stock Konferenz + Kopierer + Chefbüro (Raum), 2. Stock Serverraum,
// Kaffeeküche und Fensterbänke, oben das Dach mit Hubschrauberlandeplatz und Antennenmast.
import * as THREE from 'three';
import { CanOpener, Pigeon } from '../bosses.js';
import { box, cyl, sphere, makeLabel, makeNpcDog, makeRoundTree } from '../models.js';

const WALL = 0xf5f6fa, SLAB = 0xb2bec3, STAIR = 0x7f8c8d, F1 = 12, F2 = 24, ROOF = 36, S = 32;

export const BUERO = {
  name: 'Das Hochhaus', time: 'abend', backdrop: 'stadt', sky: 0xdfe6e9, ground: 0x636e72, size: S, need: 6, goalKind: 'treat',
  music: { scale: 'dorian', root: 247, bpm: 112, seed: 21, style: 'office' },
  build(l) {
    const g = l.game, slab = (x0, x1, z0, z1, y, c = SLAB) => { const s = l.box((x0 + x1) / 2, y - 0.6, (z0 + z1) / 2, x1 - x0, 0.6, z1 - z0, c, { cam: true, dynamic: true }); s.mesh.castShadow = false; }; // Decken werfen keinen Schatten, sonst wäre es drinnen stockdunkel
    const crumbs = (y, pts) => pts.forEach(([x, z]) => l.pickup(x, y + 0.3, z, 'crumb'));
    l.spawn.set(0, 1, 18); l.wallRing(S, ROOF + 1.2, WALL); l.solids.slice(-4).forEach(w => w.mesh.castShadow = false);
    for (const y of [0, F1, F2]) for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) l.deco(box(4, 0.15, 1, 0xfffbe6), x, y + 11.25, z); // Deckenlampen
    for (let f = 0; f < 3; f++) for (let i = -3; i <= 3; i++) [[i * 8, -S + 0.6, 0], [i * 8, S - 0.6, 0], [-S + 0.6, i * 8, 1], [S - 0.6, i * 8, 1]].forEach(([a, b, r]) => l.deco(box(r ? 0.2 : 5, 6, r ? 5 : 0.2, 0x74b9ff), r ? a : a, f * 12 + 3, r ? b : b));
    // Treppen: Ost EG→1, West 1→2, Ost 2→Dach (dünne Rampen, man kann drunter durch)
    l.ramp(28.5, 22, 28.5, -28, 4.5, 0, F1, STAIR, { bridge: true });
    l.ramp(-28.5, -28, -28.5, 28, 4.5, F1, F2, STAIR, { bridge: true });
    l.ramp(28.5, 28, 28.5, -28, 4.5, F2, ROOF, STAIR, { bridge: true });
    slab(-26, 26, -S, S, F1); slab(26, S, -S, -28, F1); slab(-S, -26, -S, -28, F1);
    slab(-26, 26, -S, S, F2); slab(-S, -26, 28, S, F2); slab(26, S, 28, S, F2);
    slab(-S, 26, -S, S, ROOF, 0x95a5a6); slab(26, S, -S, -28, ROOF, 0x95a5a6);
    [[30, 0, 'Treppe ↑'], [-30, F1, 'Treppe ↑'], [30, F2, 'Treppe ↑ Dach']].forEach(([x, y, t]) => { const s = makeLabel(t); s.scale.set(3.6, 0.9, 1); l.deco(s, x - Math.sign(x) * 4, y + 4, x > 0 ? 18 : -18); });

    // ---- EG: Großraumbüro mit Schubladen (Hauptziel), Aktenschrank, Kantine
    l.group.add(box(50, 0.04, 60, 0x4a6fa5, 0, 0.02, 0));
    const desks = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = -14 + c * 14, z = -12 + r * 11;
      l.box(x, 0, z, 6, 1.4, 3, 0xdcdde1); l.box(x + 1.8, 0, z, 2.2, 1.3, 2.8, 0xb2bec3);
      l.box(x - 1, 1.4, z - 0.6, 1.6, 1.0, 0.2, 0x2d3436); l.box(x + 2.2, 0, z + 3, 1.4, 1.0, 1.4, 0x2d3436);
      desks.push({ x, z });
    }
    desks.forEach((d, i) => {
      const drawer = box(1.6, 0.4, 0.2, 0x636e72, d.x + 1.8, 1.0, d.z + 1.5); l.group.add(drawer);
      l.interactable(d.x + 1.8, 1, d.z + 1.5, 1.5, () => {
        g.audio.sfx('drawer'); drawer.position.z += 0.8; drawer.scale.z = 6;
        if (i !== 2 && i !== 4 && i !== 7) { l.pickup(d.x + 1.8, 1.5, d.z + 2.2, 'treat', { goal: true }); g.toast('Leckerli in der Schublade!'); }
        else g.toast('Nur Büroklammern. Bäh.');
      }, 'SCHUBLADE: BISS');
    });
    l.box(-22, 0, -20, 3, 1.5, 3, 0x95a5a6); l.box(-22, 0, -16, 3, 3, 3, 0x95a5a6); l.box(-22, 0, -12, 3, 4.5, 3, 0x95a5a6);
    l.goldbone('kletter', -22, 5.2, -12);
    l.goldbone('geheim', 24, 0.6, -24, { hidden: true });
    l.box(20, 0, 20, 6, 0.8, 6, 0xd63031); l.label('Kantine', 20, 3.5, 20);
    l.pickup(-20, 0.3, 26, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    crumbs(0, [[-24, 24], [-8, 24], [8, 24], [-24, 4], [24, 4], [0, -24], [-12, -26], [12, -26]]);

    // ---- 1. Stock: Konferenzraum, Kopierer-Ecke, Tür zum Chefbüro
    l.group.add(box(52, 0.04, 64, 0x8e7cc3, 0, F1 + 0.02, 0));
    l.box(0, F1, -12, 16, 1.6, 5, 0x6d4c41); [-6, -2, 2, 6].forEach(x => [-16, -8].forEach(z => l.box(x, F1, z, 1.4, 1, 1.4, 0x2d3436)));
    l.deco(box(10, 5, 0.2, 0xffffff), 0, F1 + 2, -31.2); // Whiteboard
    l.box(-12, F1, 18, 3, 2, 3, 0xdfe6e9); l.box(-15, F1, 20.5, 3, 4, 3, 0xffffff); l.box(-18, F1, 23, 3, 6, 3, 0x95a5a6); l.box(-21, F1, 25.5, 3, 8, 3, 0x6d4c41); // Kopierer, Papier, Ordner, Aktenregal
    l.goldbone('kopierer', -21, F1 + 8.8, 25.5);
    l.door(10, F1, -31.4, { x: 2000, y: 0.2, z: 8, yaw: Math.PI }, { label: 'Chef', frame: 0x2d3436 });
    l.deco(makeRoundTree(1.2), 20, F1, 0); l.deco(makeRoundTree(1.2), -20, F1, -4);
    crumbs(F1, [[-20, 0], [-10, 6], [0, 6], [10, 6], [20, 10], [16, -20], [-16, -24], [0, 24], [12, 24]]);
    // Chefbüro (Raum): Schreibtisch, Sessel, Pokalschrank
    const cx = 2000; l.room(cx, 0, 30, 22);
    l.box(cx, -1, 0, 30, 1, 22, 0x6d4c41); l.box(cx, 9, 0, 30, 1, 22, 0x3d3d3d);
    l.box(cx, 0, -11, 30, 9, 1, 0xdcdde1); l.box(cx, 0, 11, 30, 9, 1, 0xdcdde1); l.box(cx - 15, 0, 0, 1, 9, 22, 0xdcdde1); l.box(cx + 15, 0, 0, 1, 9, 22, 0xdcdde1);
    l.box(cx, 0, -4, 10, 1.8, 4, 0x4e342e); l.box(cx, 0, -8, 3, 3, 2, 0x2d3436); // Schreibtisch, Sessel
    l.box(cx + 6, 0, -9, 3, 4.6, 3, 0x6d4c41); l.box(cx + 10.5, 0, -9, 4, 6.6, 3, 0x6d4c41); // Bücherschrank, Pokalschrank
    for (let i = 0; i < 3; i++) l.deco(cyl(0.3, 0.2, 0.9, 0xf1c40f, 0, 0.45, 0, 8), cx + 9.5 + i, 6.6, -9.3);
    l.goldbone('chef', cx + 11.5, 7.4, -8.6);
    l.deco(box(4, 2.4, 1.6, 0x74b9ff), cx - 10, 1.2, -9); // Aquarium
    l.pickup(cx - 10, 2.7, -9, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    l.solids.push({ min: { x: cx - 12, y: 0, z: -9.8 }, max: { x: cx - 8, y: 2.4, z: -8.2 }, active: true });
    crumbs(0, [[cx - 6, 4], [cx + 6, 4], [cx, 6]]);
    const boss = makeNpcDog(0x2d3436, 0xc0392b); l.deco(boss, cx - 4, 0, 6, Math.PI);
    l.trigger(cx - 4, 0, 6, 4, () => g.toast('Chef Bruno: „Mein goldener Mitarbeiter-des-Monats-Knochen? Steht ganz oben im Pokalschrank.“', 4000), false);
    l.door(cx, 0, 10.4, { x: 10, y: F1 + 0.2, z: -29, yaw: 0 }, { label: 'Flur', ry: Math.PI });

    // ---- 2. Stock: Serverraum, Kaffeeküche, Fensterbänke
    l.group.add(box(52, 0.04, 64, 0x2d3436, 0, F2 + 0.02, 0));
    const racks = [[-16, -20, 3], [-12, -20, 5], [-8, -16, 7], [-4, -20, 8.5], [0, -16, 10], [4, -20, 6], [8, -16, 3], [12, -20, 5]];
    racks.forEach(([x, z, h]) => { l.box(x, F2, z, 2.6, h, 2.6, 0x1e272e); for (let k = 0; k < h; k += 1) l.deco(box(2.62, 0.08, 0.1, k % 2 ? 0x55efc4 : 0x00b894), x, F2 + k + 0.5, z + 1.3); });
    l.goldbone('server', 0, F2 + 10.8, -16);
    l.box(10, F2, 22, 10, 1.6, 4, 0xdfe6e9); const machine = box(1.6, 2, 1.4, 0x2d3436, 0, 1, 0); l.deco(machine, 12, F2 + 1.6, 22);
    l.tassen = 0;
    l.interactable(12, F2 + 1.6, 22, 2.2, it => {
      it.used = false;
      if (l.tassen >= 4 && !g.hasBone(l.key, 'tassen')) { it.used = true; g.toast('Blubb, zisch … die Kaffeemaschine spuckt einen Goldknochen aus!'); l.spawnGoldbone(10, F2 + 0.6, 18.5, 'tassen'); }
      else if (!g.hasBone(l.key, 'tassen')) g.toast(`Kaffeemaschine: „Bitte 4 Tassen einstellen.“ (${l.tassen}/4)`, 3000);
    }, 'KAFFEE: BISS');
    [[-22, 29.4, 2], [-16, 29.4, 4], [-10, 29.4, 6], [-4, 29.4, 8], [2, 29.4, 10]].forEach(([x, z, h]) => l.box(x, F2 + h - 0.4, z, 3.4, 0.4, 2.6, 0xecf0f1)); // Fensterbänke
    l.goldbone('fenster', 2, F2 + 10.8, 29.4);
    l.pickup(-4, F2 + 8.3, 29.4, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    crumbs(F2, [[-20, 0], [-10, 8], [0, 0], [10, 8], [20, -6], [-16, -26], [16, -26], [-20, 20], [20, 14]]);

    // ---- Dach: Landeplatz, Lüftungen, Antennenmast
    const hp = cyl(8, 8, 0.05, 0x2d3436, 0, 0, 0, 24); l.deco(hp, 0, ROOF + 0.02, 6); l.deco(box(1, 0.06, 6, 0xf1c40f), -2, ROOF + 0.05, 6); l.deco(box(1, 0.06, 6, 0xf1c40f), 2, ROOF + 0.05, 6); l.deco(box(3, 0.06, 1, 0xf1c40f), 0, ROOF + 0.05, 6);
    [[-20, 20, 4, 2.4, 4], [18, 18, 6, 3, 4], [-12, -24, 5, 2, 3]].forEach(([x, z, w, h, d]) => l.box(x, ROOF, z, w, h, d, 0xb2bec3));
    l.box(-22, ROOF, -10, 1.4, 16, 1.4, 0x636e72); l.box(14, ROOF, 18, 2, 1.5, 2, 0xb2bec3);
    for (let i = 0; i < 9; i++) { const a = i * 0.8, r = 1.9; l.box(-22 + Math.cos(a) * r, ROOF + 1.2 + i * 1.6, -10 + Math.sin(a) * r, 1.6, 0.3, 1.6, 0xe74c3c); }
    l.box(-22, ROOF + 16, -10, 3, 0.3, 3, 0x636e72); l.deco(sphere(0.4, 0xff3838, 0, 0, 0, 6), -22, ROOF + 17.6, -10);
    l.goldbone('antenne', -21, ROOF + 16.8, -9);
    l.pickup(18, ROOF + 3.3, 18, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    l.tasse = () => { l.tassen++; g.toast(`Kaffeetasse ${l.tassen}/4 – zur Kaffeemaschine im 2. Stock!`); };
    [[10, -10], [-10, 14]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z, ROOF)));
    crumbs(ROOF, [[-24, 0], [-8, -16], [8, -16], [24, -10], [-24, 26], [10, 26], [0, -26]]);

    l.label('6 Leckerli in Schubladen – beiß dran! Dann hoch bis aufs Dach.', 0, 4, 16);
  },
  onGoal(l) { l.game.toast('Aus der Kantine: ein Klappern. DER DOSENÖFFNER!'); l.game.later(1000, () => { const b = new CanOpener(l.game, 10, 8); l.group.add(b.can); l.setBoss(b); }); },
};
