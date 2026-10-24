// Molls Garten (Hub): Haus und Teich in der Mitte, rundherum Schuppen mit Werkstatt, Obstwiese mit Baumhaus,
// Gemüsegarten mit Gewächshaus und der Aussichtshügel. Die 9 Portale stehen verteilt in eigenen Themen-Ecken (portals),
// am Teichgrund führt ein Tauchtunnel in Molls geheime Knochenhöhle (cave). 11 Goldknochen, darunter 5 Gartenzwerge.
import * as THREE from 'three';
import { box, cyl, cone, sphere, makeRoundTree, makeFlowers, makeButterfly, makeGnome, makeNpcDog, makeRat, makeFood, makeSign } from '../models.js';
import { BONES, TOTAL_BONES, WORLD_NAMES } from '../levels.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const shadeOf = c => new THREE.Color(c).multiplyScalar(0.8).getHex();

export const GARTEN = {
  name: 'Molls Garten', surface: 'grass', time: 'mittag', backdrop: 'huegel', grass: true, sky: 0x7fd0ff, ground: 0x6bbf59, size: 80, music: { scale: 'major', root: 262, bpm: 118, seed: 7, style: 'garden' },
  hazard: (x, z) => (x / 9.5) ** 2 + ((z - 20) / 6.5) ** 2 < 1, // keine Krümel in den Teich
  build(l) {
    l.spawn.set(0, 1, 6);
    // ---- Molls Haus (begehbar): x -7..7, z -24..-12
    const wall = 0xf3d9a6, trim = 0xc9a66b, H = 5;
    l.box(0, 0, -23.75, 14, H, 0.5, wall); l.box(-6.75, 0, -18, 0.5, H, 12, wall); l.box(6.75, 0, -18, 0.5, H, 12, wall);
    l.box(-4.25, 0, -12.25, 5.5, H, 0.5, wall); l.box(4.25, 0, -12.25, 5.5, H, 0.5, wall); l.box(0, 3.3, -12.25, 3, H - 3.3, 0.5, wall); // Front mit Tür
    l.prop(box(14.4, 0.4, 12.4, trim), 0, H, -18); // Traufe
    const roof = new THREE.Group(); roof.add(cone(10.2, 4.2, 0xc0392b, 0, 0, 0, 4)); roof.add(box(1, 2.2, 1, 0x8d6e63, 3.5, 0.8, 1.5)); // Dach + Schornstein
    roof.scale.set(1, 1, 0.86); l.deco(roof, 0, H + 2.1, -18, 0); roof.children[0].rotation.y = Math.PI / 4; l.roof = roof;
    l.smoke(3.5, H + 4.1, -16.7); // Rauch aus dem Schornstein
    l.shelter(-7.2, 7.2, -24.2, -11.8, H + 6); // kein Regen im Haus
    l.prop(box(14.6, 0.15, 12.6, 0xa47148), 0, 0.02, -18); // Holzboden
    [[-4.25, -11.95], [4.25, -11.95], [-4.25, -24.05], [4.25, -24.05]].forEach(([x, z]) => { l.prop(box(1.8, 1.4, 0.15, 0x9ad7ff), x, 2.4, z); l.prop(box(2.1, 0.15, 0.25, trim), x, 1.65, z); }); // Fenster
    [-18, -15].forEach(z => { l.prop(box(0.15, 1.4, 1.8, 0x9ad7ff), -7.05, 2.4, z); l.prop(box(0.15, 1.4, 1.8, 0x9ad7ff), 7.05, 2.4, z); });
    [1.36, 1.64].forEach(x => l.prop(box(0.12, 0.12, 0.2, 0xffcc33), x, 1.5, -9.8)); // Türknauf (beidseitig) am freien Ende der offenen Tür
    const door = box(0.15, 3.2, 2.6, 0x7a4a1f); l.deco(door, 1.5, 1.6, -10.7);
    l.label('Molls Haus', 0, 4.3, -11.6);
    // Einrichtung
    l.prop(cyl(2.4, 2.4, 0.05, 0xc0392b, 0, 0, 0, 16), 0, 0.12, -17); l.prop(cyl(1.8, 1.8, 0.06, 0xe17055, 0, 0, 0, 16), 0, 0.13, -17); // Teppich
    l.box(-4.5, 0, -21.2, 2.6, 0.45, 2, 0xd63031); l.deco(box(2, 0.2, 1.4, 0xff7675), -4.5, 0.5, -21.2); // Hundekörbchen
    l.prop(cyl(0.45, 0.35, 0.3, 0x2e86de, 0, 0, 0, 12), -2.2, 0.15, -13.6); l.prop(cyl(0.35, 0.35, 0.05, 0x8b5a2b, 0, 0, 0, 10), -2.2, 0.3, -13.6); // Napf
    l.box(3.5, 0, -22.4, 4, 1, 1.6, 0x6c5ce7); l.box(3.6, 0, -23.3, 4.2, 2, 0.5, 0x5f4dd6); l.box(1.65, 0, -22.4, 0.4, 1.4, 1.7, 0x5f4dd6); // Sofa (Teile leicht versetzt: keine flackernden Flächen)
    l.box(6, 0, -19.5, 1, 3.4, 3, 0x8d6e63); // Bücherregal (Kletterweg: Sofa → Lehne → Regal)
    [[-19.2, 0xe74c3c], [-19.6, 0x3498db], [-20.0, 0xf1c40f], [-20.4, 0x27ae60]].forEach(([z, c], i) => l.prop(box(0.6, 0.7, 0.3, c), 5.7, 0.4 + (i % 2) * 1.1, z));
    l.pickup(6, 3.8, -19.5, 'bone', { value: 5 });
    l.box(2, 0, -15.5, 2.6, 1.1, 1.6, 0xb5835a); // Tisch
    l.deco(cyl(0.2, 0.15, 0.4, 0xffffff, 0, 0, 0, 8), 2.4, 1.3, -15.5);
    l.box(-6.1, 0, -17, 0.8, 2.6, 3, 0x95a5a6); l.deco(box(0.2, 1.2, 1.6, 0x2d3436), -5.65, 0.7, -17); // Kamin
    l.fire = new THREE.PointLight(0xff9f43, 6, 9, 1.5); l.fire.position.set(-5.2, 1, -17); l.scene.add(l.fire);
    [[-2, 0xe17055], [2, 0x00b894]].forEach(([x, c]) => l.deco(box(1.4, 1, 0.08, c), x, 3, -23.45)); // Bilder
    l.goldbone('geheim', -4.5, 0.6, -21.2, { hidden: true }); // im Körbchen erschnüffeln
    // ---- Weg, Beete, Hecken
    for (let z = 4; z > -12; z -= 1.6) l.prop(box(1.4 + Math.random() * 0.3, 0.08, 1.1, 0xd6cfc0), (Math.random() - 0.5) * 0.3, 0.04, z, Math.random() * 0.3);
    [[-4.5, -10.6], [4.5, -10.6]].forEach(([x, z]) => l.deco(makeFlowers(4, 1.2, 16), x, 0, z));
    [[-9, -18], [9, -18]].forEach(([x, z]) => l.deco(makeFlowers(1.2, 6, 14), x, 0, z));
    [[-30, -30, 8], [30, -30, 8], [-30, 30, 6], [30, 30, 6]].forEach(([x, z, n]) => { for (let i = 0; i < n; i++) l.bush(x + (x < 0 ? i * 1.6 : -i * 1.6), z, 2.2); });
    // ---- Zaun mit Querlatten
    // Gartentore in alle Richtungen (bei x bzw. z = ±4..±8 offen)
    for (let i = -32; i <= 32; i += 2) { if (Math.abs(i) >= 4 && Math.abs(i) <= 8) continue; l.box(i, 0, -33, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(i, 0, 33, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(-33, 0, i, 0.3, 1.3, 0.3, 0xf5f0e1); l.box(33, 0, i, 0.3, 1.3, 0.3, 0xf5f0e1); }
    [0.45, 0.95].forEach(y => [[-20.5, 25], [0, 6], [20.5, 25]].forEach(([c, w]) => { l.prop(box(w, 0.12, 0.08, 0xf5f0e1), c, y, -33); l.prop(box(w, 0.12, 0.08, 0xf5f0e1), c, y, 33); l.prop(box(0.08, 0.12, w, 0xf5f0e1), -33, y, c); l.prop(box(0.08, 0.12, w, 0xf5f0e1), 33, y, c); }));
    l.wallRing(80, 2.2, 0x8d6e63);
    // ---- Bäume
    [[-28, -12, 1.3], [28, -14, 1.2], [-29, 14, 1.4], [29, 13, 1.3], [-10, 30, 1.2], [10, 30, 1.1]].forEach(([x, z, sc], i) => { l.deco(makeRoundTree(sc, i % 2 === 0), x, 0, z); l.solids.push({ min: { x: x - 0.4 * sc, y: 0, z: z - 0.4 * sc }, max: { x: x + 0.4 * sc, y: 2 * sc, z: z + 0.4 * sc }, active: true }); });
    [[-14, -29], [14, -29], [-30, 0], [30, 0]].forEach(([x, z]) => l.tree(x, z, rnd(1.1, 1.5)));
    // ---- Hundehütte, Zwerg, Briefkasten
    l.box(-13, 0, 9, 3, 2.2, 3, 0xb5651d); l.deco(cone(2.4, 1.5, 0x8b1e1e, 0, 0, 0, 4), -13, 2.9, 9, Math.PI / 4); l.shelter(-14.7, -11.3, 7.3, 10.7, 3.6); l.deco(box(1.2, 1.4, 0.1, 0x3b2412), -13, 0.7, 10.52);
    l.deco(box(1.6, 0.25, 0.4, 0xffffff), -13, 1.8, 10.6); // Namensschild
    l.deco(makeGnome(), 3, 0, 13, -0.6); l.deco(makeGnome(), -11, 0, 15, 0.8);
    // Opa Bruno: bringt Moll das Apportieren bei und hat einen Leckerli-Laden (Krümel gegen Upgrades)
    l.teacher(-9, 9.5, 'apportieren', { shop: true });
    l.fetchItem(7, 0, 9, 'ball');
    // Spielzeug zum Herumtollen (rollt, rutscht, quietscht): weitere Bälle und Quietsche-Knochen, im Haus und im Garten
    [[-3, 5, 0xe74c3c], [10, -4, 0x3498db, 0xf1c40f], [-1.5, -16.5, 0xfd79a8], [12, 15, 0xf39c12]].forEach(([x, z, color, stripe]) => l.fetchItem(x, 0, z, 'ball', { color, stripe }));
    [[-2.4, -20, 0xff8fb1], [-9, 4, 0x74b9ff], [16, -2, 0xfdcb6e]].forEach(([x, z, color]) => l.fetchItem(x, 0, z, 'quietsch', { color }));
    l.fetchGoal(-13, 0, 11.6, 2.6, 'ball', () => { l.game.talk('bruno.apportiert', { mesh: l.bruno.mesh }); l.spawnGoldbone(-13, 1, 13, 'apport'); });
    l.deco(cyl(0.08, 0.08, 1.2, 0x7a4a1f, 0, 0.6, 0, 6), 4, 0, 4); l.deco(box(0.5, 0.4, 0.7, 0x2e86de, 0, 1.3, 0), 4, 0, 4);
    // ---- Teich zum Schwimmen mit Steinrand, Seerosen, Schilf und Steg
    l.pond(0, 20, 9, 6, 3.4); // tief genug zum Tauchen
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; if (Math.abs(a - Math.PI * 1.5) < 0.3) continue; const s = sphere(0.45 + Math.random() * 0.25, i % 2 ? 0xa4a4a4 : 0x8c8c8c, 0, 0, 0, 5); s.scale.y = 0.5; l.prop(s, Math.cos(a) * 9.4, 0.1, 20 + Math.sin(a) * 6.4); }
    l.lilies = [[-4, 18], [3, 22], [5, 17.5], [-2, 23]].map(([x, z]) => { const p = cyl(0.7, 0.7, 0.05, 0x2ecc71, 0, 0, 0, 10); l.deco(p, x, -0.2, z); l.deco(sphere(0.18, 0xff9ff3, 0, 0, 0, 6), x + 0.2, -0.05, z); return p; });
    [[-8.6, 22], [-8, 24], [8.4, 17], [7.8, 15.5]].forEach(([x, z]) => { for (let k = 0; k < 4; k++) l.prop(cyl(0.05, 0.05, 1.6 + k * 0.2, 0x6ab04c, 0, 0, 0, 4), x + k * 0.2, 0.8, z + (k % 2) * 0.2); });
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
    // ---- Portale: über den ganzen Garten verteilt, jedes in seiner eigenen kleinen Themen-Ecke (siehe GARTEN.portals)
    GARTEN.portals(l);
    GARTEN.cave(l);
    // ---- Schmetterlinge
    l.butterflies = [0xff9ff3, 0xfeca57, 0x48dbfb, 0xffffff, 0xff7675].map((c, i) => { const b = makeButterfly(c); b.userData.home = new THREE.Vector3(rnd(-20, 20), 1.5, rnd(-8, 28)); l.deco(b, 0, 0, 0); return b; });
    l.label('Die Portale sind im ganzen Garten verteilt – folge den Wegweisern!', 0, 3.2, 1);
  },
  // ---- Außenbereiche (160 × 160 m)
  outer(l) {
    const g = l.game, T = (x, z) => l.top(x, z);
    const hut = () => { const m = new THREE.Group(); m.add(box(1.6, 1.2, 1.6, 0xb5651d, 0, 0.6, 0)); m.add(cone(1.3, 0.8, 0x8b1e1e, 0, 1.6, 0, 4).rotateY(Math.PI / 4)); return m; };
    const gnome = (x, y, z) => l.pickup(x, y, z, 'gnome', { special: true, onTake: () => { l.zwerge++; if (l.zwerge >= 5 && !g.hasBone('hub', 'zwerge')) { g.talk('zwerge.fertig'); l.spawnGoldbone(-3, 1, -9, 'zwerge'); } else g.toast(`Gartenzwerg ${l.zwerge}/5 gefunden!`); }, onRestore: () => l.zwerge++ });
    l.zwerge = 0; l.deco(makeGnome(), -3, 0, -9.5, 0.3);
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
      [[56, 4, 1.6], [56.5, 0, 3.2], [57, -4, 4.8], [60.5, -5, 6], [64, -3, 7.2], [66, 1.5, 8.4]].forEach(([x, z, h]) => { l.box(x, h - 0.3, z, 2.6, 0.3, 2.6, 0x8d6e63); const dx = x - 60, dz = z, d = Math.hypot(dx, dz) - 1.2; l.prop(box(0.4, 0.4, d, 0x6d4c41), 60 + dx / 2 * (1 + 1.2 / Math.hypot(dx, dz)), h - 0.55, dz / 2 * (1 + 1.2 / Math.hypot(dx, dz)), Math.atan2(dx, dz)); }); // Astgabeln mit Ast zum Stamm
      l.box(60, 9.4, 4, 8, 0.4, 6, 0xa47148); l.box(60, 9.8, 6.8, 8, 3, 0.4, 0xa47148); l.thRoof = l.deco(cone(6, 2.6, 0xc0392b, 0, 0, 0, 4), 60, 14.1, 4, Math.PI / 4); l.shelter(56, 64, 1, 7, 14); // Baumhaus (Dach blendet aus, wenn Moll drin ist)
      l.goldbone('baumhaus', 62, 10.6, 4);
      l.box(52, 0, 30, 0.6, 7, 0.6, 0x6d4c41); l.box(52, 7, 30, 2.4, 0.3, 2.4, 0x8d6e63); l.deco(cone(1.8, 1, 0xc0392b, 0, 0, 0, 4), 52, 8.4, 30, Math.PI / 4); [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]].forEach(([dx, dz]) => l.prop(box(0.14, 0.62, 0.14, 0x6d4c41), 52 + dx, 7.6, 30 + dz)); // Vogelhaus (Dach auf Eckpfosten)
      [[47, 30, 1.4], [48, 33, 2.8], [50.5, 34, 4.2], [53, 33.5, 5.6]].forEach(([x, z, h]) => l.box(x, 0, z, 1.8, h, 1.8, 0xb5835a)); // Brennholz-Stapel
      l.goldbone('vogelhaus', 52, 7.8, 30);
      for (let i = 0; i < 6; i++) l.tree(42 + (i % 3) * 12, -30 + Math.floor(i / 3) * 14, 1.2, makeRoundTree(1.2, true));
      gnome(70, 0.3, -20);
      l.warp(44, 0, 10, 'Obstwiese', hut());
    });

    // Westen: Gemüsegarten und Gewächshaus
    l.zone(-58, 0, 30, () => {
      for (let r = 0; r < 4; r++) { l.box(-50 - r * 5, 0, -20, 3, 0.6, 14, 0x6d4c41); const kind = ['karotte', 'kartoffel', 'kuerbis', 'karotte'][r]; for (let k = 0; k < (kind === 'kuerbis' ? 5 : 10); k++) { const n = kind === 'kuerbis' ? 5 : 10, z = -26 + 12 * (k + 0.5) / n; l.fetchItem(-50 - r * 5 + (kind === 'kuerbis' ? 0 : (k % 2 - 0.5) * 1.2), 0.6, z, kind, { planted: true }); } } // Beete: Karotten, Kartoffeln, Kürbisse – beißen oder wegtrillern!
      const gx = -60, gz = 16;
      const legs = (x, z, w, d, h) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => l.prop(box(0.14, h, 0.14, 0xb2bec3), x + sx * (w / 2 - 0.15), h / 2, z + sz * (d / 2 - 0.15)));
      const glass = new THREE.MeshLambertMaterial({ color: 0xdff9fb, transparent: true, opacity: 0.35, depthWrite: false });
      [[gx, gz - 8, 20, 0.3], [gx, gz + 8, 20, 0.3], [gx - 10, gz, 0.3, 16], [gx + 10, gz - 5, 0.3, 6], [gx + 10, gz + 5, 0.3, 6]].forEach(([x, z, w, d]) => { l.box(x, 0, z, w, 9, d, 0xdff9fb, { dynamic: true }).mesh.material = glass; });
      const roof = box(20.4, 0.3, 16.4, 0xc7ecee); roof.material = glass; roof.castShadow = false; l.deco(roof, gx, 9.1, gz); l.shelter(gx - 10.2, gx + 10.2, gz - 8.2, gz + 8.2, 9.3);
      [[-10, -8], [10, -8], [-10, 8], [10, 8]].forEach(([x, z]) => l.deco(box(0.4, 9.4, 0.4, 0xecf0f1), gx + x, 4.7, gz + z));
      [[-6, -5, 1.5], [-2, -5, 3], [2, -5, 4.5], [6, -4, 6], [6, 1, 7.5]].forEach(([x, z, h]) => { l.box(gx + x, h - 0.3, gz + z, 3, 0.3, 2.4, 0x95a5a6); l.prop(cyl(0.6, 0.4, 0.8, 0xd35400, 0, 0.4, 0, 8), gx + x, h, gz + z); legs(gx + x, gz + z, 3, 2.4, h - 0.3); }); // Pflanzregale auf Beinen
      l.box(gx + 2, 7.2, gz + 4, 8, 0.3, 2.4, 0x95a5a6); legs(gx + 2, gz + 4, 8, 2.4, 7.2);
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
  // ---- Portale über den ganzen Garten verteilt (wie die Welt-Eingänge in Gruntildas Burg): jedes in einer kleinen
  // Themen-Ecke, manche erhöht (Turm, Hügel, Kai). Wegweiser an den Gartentoren und Trittstein-Wege führen hin.
  portals(l) {
    const H = (x, z) => Math.max(0, l.heightAt(x, z));
    const st = g => { g.userData.static = true; return g; };
    const grp = (...ms) => { const g = new THREE.Group(); ms.forEach(m => g.add(m)); return st(g); };
    // Trittsteine entlang eines Polygonzugs (auf Hügeln obenauf)
    const path = (pts, color = 0xd6cfc0) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.1)); for (let k = 0; k < n; k++) { const t = k / n, x = x0 + (x1 - x0) * t + (Math.random() - 0.5) * 0.4, z = z0 + (z1 - z0) * t + (Math.random() - 0.5) * 0.4, m = box(1.2 + Math.random() * 0.3, 0.08, 0.95, color); m.userData.merge = true; l.deco(m, x, H(x, z) + 0.04, z, Math.random() * 0.6); } } };
    // Wegweiser: Pfosten mit Brettern, die zu den Portalen zeigen
    const sign = (x, z, list) => {
      l.deco(st(grp(cyl(0.12, 0.14, 2.8, 0x7a4a1f, 0, 1.4, 0, 6), cone(0.22, 0.3, 0x7a4a1f, 0, 2.95, 0, 6))), x, 0, z);
      l.solids.push({ min: { x: x - 0.2, y: 0, z: z - 0.2 }, max: { x: x + 0.2, y: 2.8, z: z + 0.2 }, active: true });
      list.forEach(([text, tx, tz], i) => {
        const a = Math.atan2(tx - x, tz - z), y = 2.25 - i * 0.55, b = new THREE.Group(), s = makeSign(text, { w: 1.9 });
        s.position.set(1.1, -0.24, 0); b.add(s); b.add(cone(0.3, 0.35, 0x5a3715, 2.2, 0, 0, 3).rotateZ(-Math.PI / 2)); // Brett mit Pfeilspitze
        l.deco(b, x, y, z, a - Math.PI / 2);
      });
    };
    const lamp = (x, z, h = 4.2) => { l.box(x, 0, z, 0.25, h, 0.25, 0x2d3436); const s = sphere(0.35, 0xfff3b0, 0, 0, 0, 8); s.material.emissive = new THREE.Color(0xffd56b); l.deco(s, x, h + 0.2, z); l.deco(box(0.8, 0.15, 0.8, 0x2d3436), x, h + 0.55, z); };
    const bin = (x, z, c) => { l.box(x, 0, z, 1.1, 1.3, 1.1, c); l.deco(box(1.2, 0.15, 1.2, shadeOf(c)), x, 1.37, z); };

    // ---- 1. Erdgeschoss: Terrasse neben Molls Haus (Wäscheleine, Kräuterkübel, Gartentisch)
    l.deco(box(10, 0.14, 10, 0xb08860), 13, 0.07, -17);
    for (let i = 0; i < 6; i++) l.prop(box(0.06, 0.15, 9.96, 0x8d6e4a), 8.4 + i * 1.8, 0.08, -17);
    l.portal(13, -16, 'Erdgeschoss', 'kueche', 0xff9f43, 0);
    l.box(17, 0, -21, 2.4, 1.1, 1.6, 0xecf0f1); l.deco(cyl(0.2, 0.2, 0.3, 0xe17055, 0, 0, 0, 8), 17.4, 1.25, -21); // Gartentisch mit Teekanne
    [[15.4, -21], [18.6, -21]].forEach(([x, z]) => l.box(x, 0, z, 0.9, 0.7, 0.9, 0x74b9ff));
    [[9, -21.5, 0x27ae60], [11.5, -21.8, 0xe84393], [17.5, -12.8, 0xfdcb6e]].forEach(([x, z, c]) => { l.box(x, 0, z, 1.3, 0.9, 1.3, 0xb5651d); l.deco(sphere(0.75, c, 0, 0, 0, 6), x, 1.3, z); });
    [[19.5, -23], [19.5, -11.5]].forEach(([x, z]) => l.box(x, 0, z, 0.2, 2.6, 0.2, 0xecf0f1)); // Wäscheleine
    l.deco(box(0.03, 0.03, 11.5, 0xffffff), 19.5, 2.5, -17.25);
    [[-21.5, 0xe84393, 0.6], [-19.6, 0x74b9ff, 1.1], [-17.4, 0xffeaa7, 0.9], [-15, 0x55efc4, 0.6], [-13, 0xff7675, 1]].forEach(([z, c, h]) => l.prop(box(0.06, h, 0.9, c), 19.5, 2.5 - h / 2, z));
    l.deco(box(1.4, 0.04, 0.9, 0xc0392b), 1.6, 0.05, -10.4); // Fußmatte vor der Haustür

    // ---- 2. Einkaufsstraße: Gehweg mit Laternen, Litfaßsäule, Mülltonnen und Zebrastreifen (hinter dem Nordwest-Tor)
    l.box(-26, 0, -49, 16, 0.12, 10, 0xb2bec3);
    l.prop(box(24, 0.06, 4, 0x4a4a4a), -26, 0.03, -42); for (let i = 0; i < 5; i++) l.prop(box(0.7, 0.07, 3.6, 0xffffff), -30 + i * 1.3, 0.04, -42);
    for (let i = 0; i < 6; i++) l.prop(box(1.6, 0.07, 0.2, 0xffffff), -37 + i * 4, 0.04, -40.2);
    l.portal(-26, -49, 'Einkaufsstraße', 'strasse', 0x54a0ff, 3);
    lamp(-33, -45); lamp(-19, -45);
    l.box(-32, 0, -52.9, 2, 3.4, 2, 0x95a5a6); [[0.8, 0xe74c3c], [1.6, 0xf1c40f], [2.4, 0x3498db]].forEach(([y, c]) => l.prop(cyl(1.08, 1.08, 0.6, c, 0, 0, 0, 12), -32, y, -52.9)); l.prop(cone(1.3, 0.6, 0x2d3436, 0, 0, 0, 12), -32, 3.7, -52.9); // Litfaßsäule
    bin(-20, -53, 0x2d3436); bin(-21.4, -53, 0x0984e3); bin(-22.8, -53, 0xfdcb6e);
    l.box(-19, 0, -49.5, 0.7, 1.2, 0.5, 0xf1c40f); l.deco(box(0.5, 0.08, 0.1, 0x2d3436), -19, 1, -49.24); // Briefkasten
    l.box(-34, 0, -49, 0.15, 2.6, 0.15, 0x7f8c8d); l.deco(cyl(0.45, 0.45, 0.08, 0x27ae60, 0, 0, 0, 12).rotateX(Math.PI / 2), -34, 2.75, -49); // Bushaltestelle

    // ---- 3. Das Büro (Amt): Aussichtsplattform auf Stelzen, über Stapel aus Aktenkartons zu erklettern, dahinter Mini-Wolkenkratzer
    l.box(46, 7.5, -46, 9, 0.5, 9, 0x95a5a6);
    [[42, -50], [50, -50], [42, -42], [50, -42]].forEach(([x, z]) => l.box(x, 0, z, 0.7, 7.5, 0.7, 0x636e72));
    [[-4.4, 0, 0.2, 9], [0, -4.4, 9, 0.2], [4.4, 0, 0.2, 9]].forEach(([dx, dz, w, d]) => l.box(46 + dx, 8, -46 + dz, w, 1, d, 0x2d3436)); // Geländer (vorn offen)
    l.portal(46, -46, 'Das Büro', 'buero', 0x9b9b9b, 8, { y: 8 });
    [[35, -38, 1.3], [35.5, -42.5, 2.6], [36, -47, 3.9], [38, -51.5, 5.2], [42.5, -54, 6.5]].forEach(([x, z, h], i) => { l.box(x, 0, z, 2.6, h, 2.6, i % 2 ? 0xc8a26b : 0xb8915a); l.prop(box(2.65, 0.25, 0.4, 0xecf0f1), x, h - 0.5, z); l.pickup(x, h + 0.3, z, 'crumb'); });
    [[57, -57, 6, 20, 0x7f8c8d], [60, -45, 5, 14, 0x95a5a6], [47, -61, 5, 16, 0xa4b0be], [66, -54, 4, 11, 0xb2bec3]].forEach(([x, z, w, h, c]) => {
      l.box(x, 0, z, w, h, w, c); for (let y = 2; y < h - 1; y += 2.2) l.prop(box(w + 0.08, 0.7, w + 0.08, 0x74b9ff), x, y, z);
      l.prop(box(w * 0.4, 1.4, w * 0.4, 0x636e72), x, h + 0.7, z);
    });

    // ---- 4. Grillpark: kleiner Picknickhügel östlich der Obstwiese mit Grill, Decke, Bank und Lampions
    l.hill(70, 18, 10, 2.2, { flat: 0.55, color: 0x7cc35f });
    const py = H(70, 18); l.portal(70, 18, 'Grillpark', 'park', 0x8e44ad, 14, { y: py });
    l.box(74, py, 22.5, 1.8, 1, 1.1, 0x2d3436); l.deco(box(1.9, 0.08, 1.2, 0x636e72), 74, py + 1.04, 22.5); [-0.5, 0, 0.5].forEach(d => l.deco(cyl(0.08, 0.08, 0.6, 0xc8502e, 0, 0, 0, 6).rotateZ(Math.PI / 2), 74 + d * 0.3, py + 1.15, 22.5 + d));
    const blanket = new THREE.Group(); blanket.add(box(3, 0.04, 3, 0xe74c3c, 0, 0.02, 0)); for (let i = 0; i < 3; i++) blanket.add(box(3, 0.05, 0.4, 0xffffff, 0, 0.025, -1 + i)); blanket.add(box(0.8, 0.5, 0.5, 0xb5651d, 0.8, 0.25, 0.6)); l.deco(st(blanket), 67, py, 22.5, 0.3);
    l.box(73.5, py, 13.5, 2.6, 0.55, 0.7, 0x9c6b3f); l.box(73.5, py, 13.15, 2.6, 1.15, 0.12, 0x9c6b3f); // Bank
    [[63, 12], [77, 12]].forEach(([x, z]) => l.box(x, H(x, z), z, 0.2, 3.6, 0.2, 0x7a4a1f));
    l.deco(box(14, 0.03, 0.03, 0x2d3436), 70, H(63, 12) + 3.4, 12);
    l.lamps = [0xff7675, 0xfdcb6e, 0x55efc4, 0x74b9ff, 0xff9ff3].map((c, i) => { const s = sphere(0.32, c, 0, -0.35, 0, 8); s.material.emissive = new THREE.Color(c).multiplyScalar(0.4); const g = new THREE.Group(); g.add(s); g.add(box(0.02, 0.3, 0.02, 0x2d3436, 0, -0.1, 0)); l.deco(g, 64.6 + i * 2.7, H(63, 12) + 3.4, 12); return g; });

    // ---- 5. Rattenrennen: Komposthaufen und Mülltonnen hinter dem Schuppen, mit Start-Ziel-Banner
    l.portal(20, -72, 'Rattenrennen', 'rattenrennen', 0xff7675, 18);
    l.hill(29, -76, 4.5, 2.4, { flat: 0.2, color: 0x6d4c41, side: 0x4e342e });
    [[28, -74.5, 0xa0522d], [29.5, -77, 0x8bc34a], [30.5, -75, 0xf39c12]].forEach(([x, z, c]) => l.deco(sphere(0.35, c, 0, 0, 0, 5), x, H(x, z) + 0.15, z)); // Apfelbutzen und Schalen
    bin(12, -74, 0x27ae60); bin(13.4, -75.4, 0x2d3436); bin(11.2, -76, 0x0984e3);
    [[14, -66], [26, -66]].forEach(([x, z]) => l.box(x, 0, z, 0.3, 4.3, 0.3, 0xecf0f1));
    for (let i = 0; i < 12; i++) for (let r = 0; r < 2; r++) l.prop(box(1, 0.5, 0.06, (i + r) % 2 ? 0x111111 : 0xffffff), 14.5 + i, 3.45 + r * 0.5, -66);
    [[16.5, -69], [23.5, -69]].forEach(([x, z]) => l.deco(box(0.15, 0.04, 6, 0xffffff), x, 0.03, z));
    [[24, -77], [15.5, -79], [27, -70]].forEach(([x, z]) => { const h = cyl(0.55, 0.55, 0.05, 0x1e1410, 0, 0, 0, 10); l.deco(h, x, 0.03, z); });
    [[10.5, -71], [31, -71.5]].forEach(([x, z], i) => l.deco(makeRat(0.7), x, 0, z, i ? -1.2 : 2));
    l.deco(box(0.6, 0.35, 0.5, 0xffd94a), 25, 0.17, -73.5, 0.4);

    // ---- 6. Strand: Sandfläche mit Sonnenschirm, Liegestuhl, Sandburg und Wasserball
    l.box(-50, 0, 46, 20, 0.12, 16, 0xf3e0a6);
    l.portal(-50, 44, 'Strand', 'strand', 0xffd36e, 22, { y: 0.12 });
    const umb = new THREE.Group(); umb.add(cyl(0.07, 0.07, 3, 0xffffff, 0, 1.5, 0, 6)); for (let i = 0; i < 8; i++) { const c = cone(2, 0.8, i % 2 ? 0xffffff : 0xe74c3c, 0, 3.1, 0, 8); c.geometry = new THREE.ConeGeometry(2, 0.8, 8, 1, true, i * Math.PI / 4, Math.PI / 4); umb.add(c); } l.deco(st(umb), -56, 0.12, 50);
    l.box(-54, 0.12, 52.5, 1.2, 0.4, 2.4, 0x74b9ff); l.deco(box(1.2, 1, 0.12, 0x74b9ff), -54, 0.9, 51.4).rotation.x = -0.4; // Liegestuhl
    l.box(-44, 0.12, 50, 2.4, 0.8, 2.4, 0xe9c46a); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz]) => { l.prop(cyl(0.35, 0.4, 1, 0xe9c46a, 0, 0, 0, 6), -44 + dx, 1.4, 50 + dz); l.prop(cone(0.42, 0.5, 0xd4a64a, 0, 0, 0, 6), -44 + dx, 2.15, 50 + dz); }); // Sandburg
    l.deco(cyl(0.3, 0.22, 0.45, 0xe74c3c, 0, 0, 0, 8), -46.5, 0.35, 52); l.deco(box(0.15, 0.04, 0.9, 0x0984e3), -46, 0.16, 53, 0.6); // Eimer + Schaufel
    const ball = new THREE.Group(); [0xe74c3c, 0xffffff, 0x0984e3, 0xf1c40f].forEach((c, i) => { const s = sphere(0.5, c, 0, 0, 0, 8); s.geometry = new THREE.SphereGeometry(0.5, 8, 6, i * Math.PI / 2, Math.PI / 2); ball.add(s); }); l.deco(st(ball), -57, 0.62, 41);
    l.deco(box(1.6, 0.03, 2.6, 0x55efc4), -52.5, 0.14, 40, 0.3); [[-48, 52.5], [-58.5, 45], [-42, 41]].forEach(([x, z]) => l.deco(sphere(0.18, 0xffb3c6, 0, 0, 0, 5), x, 0.15, z)); // Handtuch, Muscheln

    // ---- 7. Hafen: Kaimauer mit Leuchtturm, über einen Holzsteg vom Strand aus erreichbar
    l.box(-63, 0, 66, 13.6, 3.7, 11.6, 0x95a5a6); l.box(-63, 3.7, 66, 14, 0.4, 12, 0xa47148);
    l.ramp(-46, 64, -56, 64, 3.2, 0, 4.1, 0xa47148);
    l.portal(-64, 67, 'Hafen', 'hafen', 0x48dbfb, 30, { y: 4.1, ry: Math.PI / 2 });
    const lh = new THREE.Group(); for (let i = 0; i < 4; i++) lh.add(cyl(1.25 - i * 0.12, 1.3 - i * 0.12, 1.8, i % 2 ? 0xffffff : 0xe74c3c, 0, 0.9 + i * 1.8, 0, 12));
    lh.add(cyl(0.9, 0.9, 1.3, 0xdff9fb, 0, 7.85, 0, 10)); lh.add(cone(1.1, 1.2, 0xe74c3c, 0, 9.1, 0, 10)); l.deco(st(lh), -67, 4.1, 61.8);
    l.solids.push({ min: { x: -68.3, y: 4.1, z: 60.5 }, max: { x: -65.7, y: 13.6, z: 63.1 }, active: true, cam: true });
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.2, 14, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    bm.rotation.z = Math.PI / 2; bm.position.x = 7; l.beacon = new THREE.Group(); l.beacon.add(bm); l.deco(l.beacon, -67, 12, 61.8);
    [[-56.6, 61], [-56.6, 71]].forEach(([x, z]) => { l.box(x, 4.1, z, 0.6, 0.7, 0.6, 0x2d3436); l.deco(box(0.75, 0.15, 0.75, 0x2d3436), x, 4.85, z); }); // Poller
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 6, 14), new THREE.MeshToonMaterial({ color: 0xff7f00 })); l.deco(ring, -62, 5.4, 71.9); l.deco(box(0.15, 1.6, 0.15, 0x7a4a1f), -62, 4.9, 71.95);
    [[-59, 70, 0x3498db], [-60.2, 70.2, 0xe74c3c], [-59.5, 70, 0x27ae60]].forEach(([x, z, c], i) => l.box(x + (i === 2 ? 0.5 : 0), 4.1 + (i === 2 ? 0.8 : 0), z, 1.1, 0.8, 0.8, c)); // Fischkisten
    const boat = new THREE.Group(); boat.add(box(1.8, 0.7, 4, 0xffffff, 0, 0.35, 0)); boat.add(box(1.5, 0.15, 3.6, 0x9c6b3f, 0, 0.72, 0)); boat.add(box(1.9, 0.2, 4.1, 0x0984e3, 0, 0.1, 0)); l.deco(st(boat), -43, 0.12, 58, 0.5);
    l.solids.push({ min: { x: -44.5, y: 0, z: 56.3 }, max: { x: -41.5, y: 0.8, z: 59.7 }, active: true });
    const anchor = new THREE.Group(); anchor.add(box(0.2, 1.6, 0.2, 0x2d3436, 0, 0.8, 0)); anchor.add(box(1.3, 0.2, 0.2, 0x2d3436, 0, 0.2, 0)); anchor.add(box(0.7, 0.15, 0.2, 0x2d3436, 0, 1.4, 0)); l.deco(st(anchor), -47, 0.12, 61, 0.4);

    // ---- 8. Dorf: Bauernhof-Hügel mit Windmühle, Heuballen, Kürbissen, Hühnern und Vogelscheuche
    l.hill(54, 56, 14, 4, { flat: 0.45, color: 0x8fd17a });
    const dy = H(54, 56); l.portal(54, 56, 'Dorf', 'dorf', 0xfeca57, 40, { y: dy });
    const mx = 62, mz = 63, my = H(mx, mz);
    l.box(mx, my - 0.3, mz, 3.2, 6.3, 3.2, 0xf5f0e1); l.deco(cone(2.6, 2.2, 0x8b1e1e, 0, 0, 0, 4), mx, my + 7.1, mz, Math.PI / 4);
    l.deco(box(1, 1.6, 0.1, 0x6d4c41), mx - 1.15, my + 0.8, mz - 1.15, Math.PI / 4);
    l.mill = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = box(0.5, 4.2, 0.08, 0xecf0f1, 0, 2.1, 0); const arm = new THREE.Group(); arm.add(b); arm.add(box(0.12, 4.2, 0.1, 0x8d6e63, 0, 2.1, 0)); arm.rotation.z = i * Math.PI / 2; l.mill.add(arm); }
    l.mill.add(sphere(0.35, 0x8d6e63)); l.deco(l.mill, mx - 1.9, my + 5.3, mz - 1.9, Math.PI / 4 + Math.PI);
    [[48, 60], [49.5, 61.5], [59, 50]].forEach(([x, z], i) => { const y = H(x, z); l.box(x, y, z, 1.6, 1.3, 1.6, 0xf6d365); l.deco(cyl(0.66, 0.66, 1.62, 0xe1b84a, 0, 0, 0, 10).rotateX(Math.PI / 2), x, y + 0.65, z, i * 0.7); });
    [[57, 59], [58, 60.5], [56, 61], [51, 51]].forEach(([x, z]) => { l.prop(sphere(0.4, 0xe67e22, 0, 0, 0, 7), x, H(x, z) + 0.3, z); l.prop(box(0.08, 0.2, 0.08, 0x27ae60), x, H(x, z) + 0.75, z); });
    const hen = () => grp(sphere(0.3, 0xffffff, 0, 0.3, 0, 6), sphere(0.18, 0xffffff, 0, 0.6, 0.22, 6), box(0.08, 0.12, 0.12, 0xe74c3c, 0, 0.8, 0.22), cone(0.06, 0.12, 0xf39c12, 0, 0.58, 0.42, 4).rotateX(Math.PI / 2));
    [[50, 54, 0.5], [52, 53, -1], [47, 57, 2]].forEach(([x, z, a]) => l.deco(hen(), x, H(x, z), z, a));
    l.deco(grp(box(0.15, 2.4, 0.15, 0x7a4a1f, 0, 1.2, 0), box(2, 0.15, 0.15, 0x7a4a1f, 0, 1.8, 0), box(0.7, 0.9, 0.4, 0x3498db, 0, 1.6, 0), sphere(0.3, 0xf6d365, 0, 2.4, 0, 6), cone(0.5, 0.4, 0x8d6e63, 0, 2.75, 0, 8)), 59, H(59, 56), 56, -0.8);
    for (let i = 0; i < 9; i++) { const a = 2.3 + i * 0.26, x = 54 + Math.cos(a) * 7.5, z = 56 + Math.sin(a) * 7.5; l.prop(box(0.15, 1, 0.15, 0x9c6b3f), x, H(x, z) + 0.5, z); if (i) { const a0 = a - 0.26, x0 = 54 + Math.cos(a0) * 7.5, z0 = 56 + Math.sin(a0) * 7.5; l.prop(box(0.08, 0.12, 2, 0x9c6b3f), (x + x0) / 2, H(x, z) + 0.7, (z + z0) / 2, Math.atan2(x - x0, z - z0)); } }

    // ---- 9. Kanal: großes Abwasserrohr aus einem Erdwall, grüner Schleim, Gullydeckel und Ratten (Nordwest-Ecke)
    l.hill(-60, -60, 13, 7, { flat: 0.3, color: 0x6d8b4a, side: 0x5d4e37 });
    const pipe = new THREE.Group(); pipe.add(cyl(3, 3, 8, 0x95a5a6, 0, 0, 0, 16)); pipe.add(cyl(3.3, 3.3, 0.6, 0x7f8c8d, 0, 4, 0, 16)); pipe.add(cyl(2.5, 2.5, 0.65, 0x111111, 0, 4.02, 0, 14));
    for (let i = -2; i <= 2; i++) pipe.add(box(0.15, 0.2, 4.6 - Math.abs(i) * 0.7, 0x2d3436, i * 0.9, 4.3, 0));
    pipe.rotation.set(Math.PI / 2, 0, 0); const pw = new THREE.Group(); pw.add(pipe); l.deco(st(pw), -54.5, 2.9, -54.5, Math.PI / 4);
    l.portal(-47, -47, 'Kanal', 'kanal', 0x2ecc71, 52);
    [[-51.5, -51.5, 2.2], [-44, -50.5, 1.2], [-50.5, -43.5, 1.1]].forEach(([x, z, r]) => { const m = cyl(r, r, 0.04, 0x7bed9f, 0, 0, 0, 12); m.material.emissive = new THREE.Color(0x1e8449); l.deco(m, x, 0.03, z); });
    l.deco(cyl(0.9, 0.9, 0.06, 0x2d3436, 0, 0, 0, 12), -42, 0.04, -44.5); for (let i = -1; i <= 1; i++) l.deco(box(1.5, 0.07, 0.12, 0x636e72), -42, 0.06, -44.5 + i * 0.4);
    l.deco(makeRat(0.6), -45.5, 0, -52, 0.6); l.deco(makeRat(0.5), -52, 0, -45, 2.2);
    l.box(-41, 0, -52, 0.15, 2.2, 0.15, 0x7f8c8d); l.deco(box(1.4, 1, 0.08, 0xf1c40f), -41, 2.2, -51.95); l.deco(box(0.9, 0.12, 0.09, 0x2d3436), -41, 2.2, -51.9, 0); // Warnschild

    // ---- Wege von den Gartentoren und Wegweiser
    path([[-6, -34], [-13, -40], [-21, -45]]); path([[6, -34], [12, -48], [17, -66]]); path([[6, -34], [26, -36], [33.5, -37]]);
    path([[34, 6], [50, 12], [61, 16.5]]); path([[-34, -6], [-42, -28], [-44, -44]]);
    path([[-6, 34], [-28, 40], [-41, 42]]); path([[-46, 54.5], [-45.5, 63]], 0xc8b48a); path([[6, 34], [30, 40], [48, 50]]);
    sign(-8.5, -36, [['Einkaufsstraße', -26, -49], ['Rattenrennen', 20, -72], ['Das Büro', 46, -46], ['Kanal', -47, -47]]);
    sign(36, 9, [['Grillpark', 70, 18], ['Das Büro', 46, -46]]);
    sign(-8.5, 36, [['Strand', -50, 44], ['Hafen', -64, 67], ['Dorf', 54, 56]]);
    sign(-3.5, 3.5, [['Erdgeschoss', 13, -16], ['Nordtor', -6, -33], ['Südtor', -6, 33], ['Osttor', 33, 6]]);
  },

  // ---- Geheime Knochenhöhle: nur tauchend durch einen Tunnel am Teichgrund erreichbar. Zeigt alle Goldknochen je Welt.
  cave(l) {
    const g = l.game, cx = 3000;
    const hole = sphere(1.6, 0x0c1218, 0, 0, 0, 10); hole.scale.set(0.45, 1, 1.3); l.deco(hole, -9.05, -2.6, 20);
    [[-8.7, -1.3, 18.3], [-8.7, -1.2, 21.7], [-8.8, -0.85, 20]].forEach(([x, y, z]) => { const r = sphere(0.75, 0x7f8c8d, 0, 0, 0, 5); r.scale.y = 0.6; l.deco(r, x, y, z); });
    l.airBubbles(-7.4, -3.4, 21.6, 3.2);
    l.pickup(-6, -3, 20, 'crumb'); l.pickup(-5, -3, 18, 'crumb');
    l.door(-8.3, -3.6, 20, { x: cx - 7, y: 0.3, z: 7, yaw: Math.PI / 2 }, { noFrame: true });
    l.room(cx, 0, 32, 26);
    l.zone(cx, 0, 30, () => {
      l.box(cx, -1, 0, 32, 1, 26, 0x8a7563); l.box(cx, 7, 0, 32, 1, 26, 0x3e342e);
      l.box(cx, 0, -13, 32, 7, 1, 0x9a8470); l.box(cx, 0, 13, 32, 7, 1, 0x9a8470); l.box(cx - 16, 0, 0, 1, 7, 26, 0x9a8470); l.box(cx + 16, 0, 0, 1, 7, 26, 0x9a8470);
      for (let i = 0; i < 26; i++) { const a = i / 26, side = i % 4, r = sphere(1 + (i * 7 % 5) * 0.25, i % 2 ? 0x7d6b5c : 0x5e4f43, 0, 0, 0, 5); r.scale.y = 0.7; r.userData.merge = true; const t = (i * 0.37) % 1; l.deco(r, side < 2 ? cx - 15 + t * 30 : cx + (side === 2 ? -15.4 : 15.4), 0.3 + (i % 3) * 2.2, side === 0 ? -12.4 : side === 1 ? 12.4 : -11 + t * 22); }
      [[-14, -11, 0x74b9ff], [14, -11, 0xa29bfe], [14, 11, 0x55efc4], [-3, 12, 0xfd79a8], [5, -12, 0x74b9ff], [-14, 1, 0xa29bfe]].forEach(([x, z, c], i) => [0, 1, 2].forEach(k => { const cr = cone(0.35 - k * 0.07, 1.6 - k * 0.3, c, 0, 0, 0, 5); cr.material.emissive = new THREE.Color(c).multiplyScalar(0.55); cr.rotation.z = (k - 1) * 0.4; l.deco(cr, cx + x + (k - 1) * 0.4, 0.7, z); }));
      const pool = cyl(2.6, 2.6, 0.08, 0x2e86de, 0, 0, 0, 16); pool.material.emissive = new THREE.Color(0x0a3d62); l.deco(pool, cx - 10, 0.04, 7);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = sphere(0.45, 0x8c8c8c, 0, 0, 0, 5); r.scale.y = 0.5; l.deco(r, cx - 10 + Math.cos(a) * 2.9, 0.1, 7 + Math.sin(a) * 2.9); }
      l.door(cx - 10, 0, 7, { x: 0, y: 0.5, z: 10.6, yaw: Math.PI }, { noFrame: true, label: 'Zurück zum Teich' });
      // Mitte: Molls Körbchen mit Knochenberg und großer Goldknochen-Statue
      l.box(cx, 0, 0, 3.4, 1.2, 3.4, 0x8d7b6a); l.deco(box(3.6, 0.15, 3.6, 0xffcc33), cx, 1.2, 0);
      l.box(cx + 5, 0, 6, 3, 0.5, 2.4, 0xd63031); l.deco(box(2.4, 0.2, 1.8, 0xff7675), cx + 5, 0.55, 6);
      for (let i = 0; i < 14; i++) { const b = makeFood('bone'); b.scale.setScalar(1.3); l.deco(b, cx + 5 + Math.cos(i) * (0.4 + i * 0.05), 0.5 + (i % 3) * 0.12, 6 + Math.sin(i * 1.7) * 0.6, i); }
      const statue = makeFood('goldbone'); statue.scale.setScalar(2.4); l.deco(statue, cx, 1.4, 0);
      const spots = [[-12, -9.6, 0], [-6, -9.6, 0], [0, -9.6, 0], [6, -9.6, 0], [12, -9.6, 0], [12.6, -3, -Math.PI / 2], [12.6, 3, -Math.PI / 2], [12.6, 9, -Math.PI / 2], [-12.6, -3, Math.PI / 2], [-12.6, 2.5, Math.PI / 2]];
      const shelves = Object.keys(BONES).map((key, i) => { const [x, z, ry] = spots[i]; l.box(cx + x, 0, z, Math.abs(ry) ? 2.6 : 4.2, 1, Math.abs(ry) ? 4.2 : 2.6, 0x8d7b6a); const sg = new THREE.Group(); l.deco(sg, cx + x, 1, z, ry); return { key, group: sg }; });
      l.cave = { shelves, statue, n: -1 };
      [[-8, 0], [8, 0], [0, 8], [0, -5]].forEach(([x, z]) => l.pickup(cx + x, 0.3, z, 'crumb'));
    });
    l.trigger(cx - 7, 0, 7, 2.5, () => g.toast('Molls geheime Knochenhöhle! Hier liegen alle Goldknochen, die du schon gefunden hast.', 4500));
    GARTEN.refreshCave(l);
  },
  // Regale der Knochenhöhle neu bestücken: echte Goldknochen für gefundene, blasse Umrisse für fehlende, Schild mit Stand
  refreshCave(l) {
    const c = l.cave, g = l.game, n = g.boneCount(); if (!c || c.n === n) return; c.n = n;
    const gold = makeFood('goldbone').children[0], ghost = new THREE.MeshBasicMaterial({ color: 0x3b2f27, transparent: true, opacity: 0.5 });
    for (const s of c.shelves) {
      s.group.clear(); const ids = BONES[s.key], have = ids.filter(id => g.hasBone(s.key, id)).length;
      ids.forEach((id, i) => { const m = new THREE.Mesh(gold.geometry, g.hasBone(s.key, id) ? gold.material : ghost); m.scale.setScalar(0.42); m.position.set(-1.4 + (i % 4) * 0.93, 0, -0.75 + Math.floor(i / 4) * 0.75); m.rotation.y = 0.3; s.group.add(m); });
      const full = have === ids.length, sg = makeSign(`${WORLD_NAMES[s.key]} ${have}/${ids.length}`, { w: 3.4, post: 0.8, ink: full ? '#9a6a00' : undefined }); sg.position.set(0, 0, -1.2); s.group.add(sg);
      if (full) { const cr = sphere(0.3, 0xffcc33, 0, 1.2, -1.1, 6); cr.material.emissive = new THREE.Color(0x8a5a00); s.group.add(cr); }
    }
    if (c.total) c.total.removeFromParent();
    c.total = makeSign(`Goldknochen ${n}/${TOTAL_BONES} · ${Math.round(n / TOTAL_BONES * 100)} %`, { w: 6 }); c.total.position.set(3000, 4.6, -3); c.statue.parent.add(c.total);
    c.statue.scale.setScalar(1.4 + 1.6 * n / TOTAL_BONES); // die Statue wächst mit dem Spielfortschritt
  },
  update(l, dt) {
    const p = l.game.player.pos, inside = p.x > -6.5 && p.x < 6.5 && p.z > -23.5 && p.z < -12;
    l.roof.visible = !inside; // im Haus Dach ausblenden, damit man was sieht
    if (l.thRoof) l.thRoof.visible = !(p.y > 9 && Math.abs(p.x - 60) < 5 && Math.abs(p.z - 4) < 4);
    if (l.mill) l.mill.rotation.z += dt * 0.8;
    l.lamps?.forEach((m, i) => { m.rotation.z = Math.sin(l.t * 1.6 + i) * 0.15; });
    if (l.beacon) l.beacon.rotation.y += dt * 0.9;
    if (l.cave && p.x > 2900) { GARTEN.refreshCave(l); l.cave.statue.rotation.y += dt * 0.7; }
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
