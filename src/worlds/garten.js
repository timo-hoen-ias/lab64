// Molls Garten (Hub): Haus, Teich und Portale in der Mitte, rundherum Schuppen mit Werkstatt, Obstwiese mit Baumhaus,
// Gemüsegarten mit Gewächshaus und der Aussichtshügel. 10 Goldknochen, darunter eine Suche nach 5 Gartenzwergen.
import * as THREE from 'three';
import { box, cyl, cone, sphere, makeRoundTree, makeFlowers, makeButterfly, makeGnome, makeLabel, makeNpcDog } from '../models.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export const GARTEN = {
  name: 'Molls Garten', time: 'mittag', backdrop: 'huegel', grass: true, sky: 0x7fd0ff, ground: 0x6bbf59, size: 80, music: { scale: 'major', root: 262, bpm: 118, seed: 7, style: 'garden' },
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
    // Gartentore in alle Richtungen (bei x bzw. z = ±4..±8 offen)
    for (let i = -32; i <= 32; i += 2) { if (Math.abs(i) >= 4 && Math.abs(i) <= 8) continue; l.box(i, 0, -33, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(i, 0, 33, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(-33, 0, i, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(33, 0, i, 0.3, 1.3, 0.3, 0xf5f0e1); }
    [0.45, 0.95].forEach(y => [[-20.5, 25], [0, 6], [20.5, 25]].forEach(([c, w]) => { l.deco(box(w, 0.12, 0.08, 0xf5f0e1), c, y, -33); l.deco(box(w, 0.12, 0.08, 0xf5f0e1), c, y, 33); l.deco(box(0.08, 0.12, w, 0xf5f0e1), -33, y, c); l.deco(box(0.08, 0.12, w, 0xf5f0e1), 33, y, c); }));
    l.wallRing(80, 2.2, 0x8d6e63);
    // ---- Bäume
    [[-28, -12, 1.3], [28, -14, 1.2], [-29, 14, 1.4], [29, 13, 1.3], [-10, 30, 1.2], [10, 30, 1.1]].forEach(([x, z, sc], i) => { l.deco(makeRoundTree(sc, i % 2 === 0), x, 0, z); l.solids.push({ min: { x: x - 0.4 * sc, y: 0, z: z - 0.4 * sc }, max: { x: x + 0.4 * sc, y: 2 * sc, z: z + 0.4 * sc }, active: true }); });
    [[-14, -29], [14, -29], [-30, 0], [30, 0]].forEach(([x, z]) => l.tree(x, z, rnd(1.1, 1.5)));
    // ---- Hundehütte, Zwerg, Briefkasten
    l.box(-13, 0, 9, 3, 2.2, 3, 0xb5651d); l.deco(cone(2.4, 1.5, 0x8b1e1e, 0, 0, 0, 4), -13, 2.9, 9, Math.PI / 4); l.deco(box(1.2, 1.4, 0.1, 0x3b2412), -13, 0.7, 10.52);
    l.deco(box(1.6, 0.25, 0.4, 0xffffff), -13, 1.8, 10.6); // Namensschild
    l.deco(makeGnome(), 3, 0, 13, -0.6); l.deco(makeGnome(), -11, 0, 15, 0.8);
    // Opa Bruno: bringt Moll das Apportieren bei und hat einen Leckerli-Laden (Krümel gegen Upgrades)
    l.teacher(-9, 9.5, 'apportieren', { shop: true });
    l.fetchItem(7, 0, 9, 'ball');
    l.fetchGoal(-13, 0, 11.6, 2.6, 'ball', () => { l.game.talk('bruno.apportiert', { mesh: l.bruno.mesh }); l.spawnGoldbone(-13, 1, 13, 'apport'); });
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
    l.goldbone('teich', -1, -2.7, 20.5); // nur mit Taucherbrille
    l.scatter(70);
    GARTEN.outer(l);
    // ---- Portale (schauen zur Gartenmitte)
    l.portal(-9, -4, 'Erdgeschoss', 'kueche', 0xff9f43, 0);
    l.portal(9, -4, 'Einkaufsstraße', 'strasse', 0x54a0ff, 3);
    l.portal(-22, -6, 'Hochhaus', 'buero', 0x9b9b9b, 8);
    l.portal(22, -6, 'Grillpark', 'park', 0x8e44ad, 14);
    l.portal(-23, -23, 'Rattenrennen', 'rattenrennen', 0xff7675, 18);
    l.portal(0, 30, 'Strand', 'strand', 0xffd36e, 22);
    l.portal(-19, 22, 'Hafen', 'hafen', 0x48dbfb, 30);
    l.portal(19, 22, 'Dorf', 'dorf', 0xfeca57, 40);
    l.portal(23, -23, 'Kanal', 'kanal', 0x2ecc71, 52);
    // ---- Schmetterlinge
    l.butterflies = [0xff9ff3, 0xfeca57, 0x48dbfb, 0xffffff, 0xff7675].map((c, i) => { const b = makeButterfly(c); b.userData.home = new THREE.Vector3(rnd(-20, 20), 1.5, rnd(-8, 28)); l.deco(b, 0, 0, 0); return b; });
    l.label('Lauf in einen Ring!', 0, 3.2, 1);
  },
  // ---- Außenbereiche (160 × 160 m)
  outer(l) {
    const g = l.game, T = (x, z) => l.top(x, z);
    const hut = () => { const m = new THREE.Group(); m.add(box(1.6, 1.2, 1.6, 0xb5651d, 0, 0.6, 0)); m.add(cone(1.3, 0.8, 0x8b1e1e, 0, 1.6, 0, 4).rotateY(Math.PI / 4)); return m; };
    const gnome = (x, y, z) => l.pickup(x, y, z, 'gnome', { special: true, onTake: () => { l.zwerge++; if (l.zwerge >= 5 && !g.hasBone('hub', 'zwerge')) { g.talk('zwerge.fertig'); l.spawnGoldbone(-3, 1, -9, 'zwerge'); } else g.toast(`Gartenzwerg ${l.zwerge}/5 gefunden!`); }, onRestore: () => l.zwerge++ });
    l.zwerge = 0; l.deco(makeGnome(), -3, 0, -9.5, 0.3); const king = makeLabel('Zwergenkönig'); king.scale.set(3, 0.8, 1); l.deco(king, -3, 2.2, -9.5);
    l.trigger(-3, 0, -9.5, 3, () => { if (!g.hasBone('hub', 'zwerge')) g.talk('zwerge', { vars: { n: l.zwerge, r: 5 - l.zwerge } }); }, false);
    [[0, -36], [36, 0], [-36, 0], [0, 36]].forEach(([x, z]) => l.group.add(box(Math.abs(x) ? 40 : 4, 0.05, Math.abs(z) ? 40 : 4, 0xd6cfc0, x * 1.5, 0.03, z * 1.5)));

    // Norden: Schuppen mit Werkstatt (Raum) und Komposthaufen
    l.zone(0, -58, 30, () => {
      l.box(0, 0, -62, 16, 6, 10, 0x8d6e63); l.deco(cone(11.5, 3, 0x5d4037, 0, 0, 0, 4), 0, 7.5, -62, Math.PI / 4);
      l.door(0, 0, -56.6, { x: 2000, y: 0.2, z: 8, yaw: Math.PI }, { label: 'Schuppen' });
      l.hill(-24, -60, 6, 2.6, { flat: 0.3, color: 0x6d4c41, side: 0x5d4037 }); gnome(-24, 2.9, -60);
      l.box(22, 0, -58, 6, 1.2, 3, 0xa47148); l.box(22, 1.2, -58, 6, 1.2, 3, 0xa47148); // Holzstapel
      l.warp(8, 0, -48, 'Schuppen', hut());
    });
    const wx = 2000; l.room(wx, 0, 28, 20);
    l.box(wx, -1, 0, 28, 1, 20, 0x8d6e63); l.box(wx, 8, 0, 28, 1, 20, 0x5d4037);
    l.box(wx, 0, -10, 28, 8, 1, 0xa1887f); l.box(wx, 0, 10, 28, 8, 1, 0xa1887f); l.box(wx - 14, 0, 0, 1, 8, 20, 0xa1887f); l.box(wx + 14, 0, 0, 1, 8, 20, 0xa1887f);
    l.box(wx - 4, 0, -7, 12, 1.6, 4, 0x6d4c41); // Werkbank
    [[3, -3.5, 2.8, 0xe74c3c], [6, -3.5, 4, 0x3498db], [9, -6, 5.2, 0xf1c40f]].forEach(([x, z, h, c]) => l.box(wx + x, 0, z, 2.4, h, 2.4, c)); // Farbeimer-Stapel
    l.box(wx + 8, 6.4, -9, 10, 0.3, 2, 0x8d6e63); // Regalbrett
    l.goldbone('schuppen', wx + 11, 7.2, -9);
    for (let i = 0; i < 5; i++) l.deco(box(0.2, 1.4, 0.2, 0x95a5a6), wx - 9 + i * 1.5, 3.5, -9.4); // Werkzeugwand
    [[-10, 6], [0, 6], [10, 6]].forEach(([x, z]) => l.pickup(wx + x, 0.3, z, 'crumb'));
    gnome(wx - 4, 1.9, -7);
    l.door(wx, 0, 9.4, { x: 0, y: 0.2, z: -54.5, yaw: 0 }, { label: 'Garten', ry: Math.PI });

    // Osten: Obstwiese mit Apfelbaum und Baumhaus, Vogelhaus
    l.zone(58, 0, 30, () => {
      l.box(60, 0, 0, 3, 12, 3, 0x6d4c41); l.deco(sphere(6.5, 0x4caf50, 0, 0, 0, 8), 60, 19, 0);
      [[56, 4, 1.6], [56.5, 0, 3.2], [57, -4, 4.8], [60.5, -5, 6], [64, -3, 7.2], [66, 1.5, 8.4]].forEach(([x, z, h]) => l.box(x, h - 0.3, z, 2.6, 0.3, 2.6, 0x8d6e63)); // Astgabeln
      l.box(60, 9.4, 4, 8, 0.4, 6, 0xa47148); l.box(60, 9.8, 6.8, 8, 3, 0.4, 0xa47148); l.thRoof = l.deco(cone(6, 2.6, 0xc0392b, 0, 0, 0, 4), 60, 14.1, 4, Math.PI / 4); // Baumhaus (Dach blendet aus, wenn Moll drin ist)
      l.goldbone('baumhaus', 62, 10.6, 4);
      l.box(52, 0, 30, 0.6, 7, 0.6, 0x6d4c41); l.box(52, 7, 30, 2.4, 0.3, 2.4, 0x8d6e63); l.deco(cone(1.8, 1, 0xc0392b, 0, 0, 0, 4), 52, 8.4, 30, Math.PI / 4); // Vogelhaus
      [[47, 30, 1.4], [48, 33, 2.8], [50.5, 34, 4.2], [53, 33.5, 5.6]].forEach(([x, z, h]) => l.box(x, 0, z, 1.8, h, 1.8, 0xb5835a)); // Brennholz-Stapel
      l.goldbone('vogelhaus', 52, 7.8, 30);
      for (let i = 0; i < 6; i++) l.tree(42 + (i % 3) * 12, -30 + Math.floor(i / 3) * 14, 1.2, makeRoundTree(1.2, true));
      gnome(70, 0.3, -20);
      l.warp(44, 0, 10, 'Obstwiese', hut());
    });

    // Westen: Gemüsegarten und Gewächshaus
    l.zone(-58, 0, 30, () => {
      for (let r = 0; r < 4; r++) { l.box(-50 - r * 5, 0, -20, 3, 0.6, 14, 0x6d4c41); for (let k = 0; k < 6; k++) l.deco(sphere(0.5, [0x27ae60, 0xe67e22, 0xe74c3c, 0x8e44ad][r], 0, 0, 0, 6), -50 - r * 5, 0.9, -26 + k * 2.4); }
      const gx = -60, gz = 16;
      const glass = new THREE.MeshLambertMaterial({ color: 0xdff9fb, transparent: true, opacity: 0.35, depthWrite: false });
      [[gx, gz - 8, 20, 0.3], [gx, gz + 8, 20, 0.3], [gx - 10, gz, 0.3, 16], [gx + 10, gz - 5, 0.3, 6], [gx + 10, gz + 5, 0.3, 6]].forEach(([x, z, w, d]) => { l.box(x, 0, z, w, 9, d, 0xdff9fb, { dynamic: true }).mesh.material = glass; });
      const roof = box(20.4, 0.3, 16.4, 0xc7ecee); roof.material = glass; roof.castShadow = false; l.deco(roof, gx, 9.1, gz);
      [[-10, -8], [10, -8], [-10, 8], [10, 8]].forEach(([x, z]) => l.deco(box(0.4, 9.4, 0.4, 0xecf0f1), gx + x, 4.7, gz + z));
      [[-6, -5, 1.5], [-2, -5, 3], [2, -5, 4.5], [6, -4, 6], [6, 1, 7.5]].forEach(([x, z, h]) => { l.box(gx + x, h - 0.3, gz + z, 3, 0.3, 2.4, 0x95a5a6); l.deco(cyl(0.6, 0.4, 0.8, 0xd35400, 0, 0.4, 0, 8), gx + x, h, gz + z); }); // Pflanzregale
      l.box(gx + 2, 7.2, gz + 4, 8, 0.3, 2.4, 0x95a5a6);
      l.goldbone('gewaechshaus', gx - 1, 8.1, gz + 4);
      gnome(gx - 6, 0.3, gz + 5);
      l.warp(-44, 0, -8, 'Gemüsegarten', hut());
    });

    // Süden: Aussichtshügel
    l.zone(0, 60, 30, () => {
      l.hill(0, 62, 22, 12, { flat: 0.3, color: 0x7cb342 });
      l.box(0, 12, 64, 0.3, 6, 0.3, 0xecf0f1); l.deco(box(2, 1.2, 0.05, 0xe74c3c), 1, 17.2, 64);
      l.goldbone('aussicht', -2, 12.8, 62);
      l.hill(-30, 56, 8, 3, { flat: 0.3, color: 0x7cb342 }); gnome(-30, T(-30, 56) + 0.3, 56);
      l.warp(10, 0, 44, 'Aussichtshügel', hut());
    });
  },
  update(l, dt) {
    const p = l.game.player.pos, inside = p.x > -6.5 && p.x < 6.5 && p.z > -23.5 && p.z < -12;
    l.roof.visible = !inside; // im Haus Dach ausblenden, damit man was sieht
    if (l.thRoof) l.thRoof.visible = !(p.y > 9 && Math.abs(p.x - 60) < 5 && Math.abs(p.z - 4) < 4);
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
};
