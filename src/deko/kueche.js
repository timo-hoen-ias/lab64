// Erdgeschoss: Wohnzimmer mit Sesseln am Kamin, Fernseher und Esstisch, Flur mit Garderobe und Kisten,
// Speisekammer mit Säcken und Einmachgläsern, Wintergarten mit Pflanzen und Korbsesseln, Keller mit Gerümpel.
// Alles im Hunde-Maßstab der Wohnung (Möbel etwa 2,4-fach), damit es zu Sofa, Regal und Kamin passt.
import { box } from '../models.js';
import * as P from '../props.js';

const S = 2.4;

export function kueche(d, l) {
  const M = m => { m.userData.merge = true; return m; };
  const wallArt = (x, y, z, ry, c) => { l.deco(M(box(ry ? 0.15 : 3.6, 2.6, ry ? 3.6 : 0.15, P.WOOD)), x, y, z); l.deco(M(box(ry ? 0.18 : 3, 2, ry ? 3 : 0.18, c)), x - Math.sign(x) * 0.03 * ry, y, z - Math.sign(z) * 0.03 * (1 - ry)); }; // Bilder an der Wand
  const plant = (x, z, k = S) => d.put(P.bigPlant(1), x, z, { s: k, solid: [0.9, 1.5, 0.9] });
  // ---- Wohnzimmer Nord: Sessel am Kamin, Teppich, Leselampe, Bücherregal, Spielzeug
  d.put(P.rug(14, 9, 0xc0392b), -40, -44, { w: 14, d: 9, margin: 0, dy: 0.01 });
  d.put(P.armchair(0x6c5ce7), -48, -46, { s: S, ry: Math.PI - 0.5, solid: [1.4, 1.4, 1.3] });
  d.put(P.armchair(0x00b894), -32, -46, { s: S, ry: Math.PI + 0.5, solid: [1.4, 1.4, 1.3] });
  d.put(P.table(1.6, 1, 0.6, P.DWOOD), -40, -41, { s: S, solid: [1.6, 0.7, 1] });
  d.put(P.floorLamp(), -54, -52, { s: S, w: 0.6, d: 0.6 });
  [[-56, -56], [-22, -55], [-55, -24]].forEach(([x, z]) => plant(x, z));
  d.put(P.toys(), -26, -32, { s: 2, w: 2, d: 1.5 });
  d.put(P.shelf(2.4, 3), -58.3, -38, { s: S, ry: Math.PI / 2, solid: [2.4, 3, 0.5] });
  // Fernseher gegenüber dem großen Sofa
  d.put(P.tvStand(), -40, -8, { s: S, solid: [2.4, 1.8, 0.6] });
  // ---- Wohnzimmer Süd: Esstisch, Regal, Kommode, Pflanzen
  d.put(P.rug(11, 8, 0x2980b9), -40, 44, { w: 11, d: 8, margin: 0, dy: 0.01 });
  d.put(P.diningSet(), -40, 44, { s: S, solid: [3, 1.2, 1.6] });
  d.put(P.shelf(3, 2.6, P.LWOOD), -58.3, 46, { s: S, ry: Math.PI / 2, solid: [3, 2.6, 0.5] });
  d.put(P.cabinet(P.LWOOD, 1.2), -40, 58.3, { s: S, ry: Math.PI, solid: [0.8, 1.2, 0.7] });
  [[-56, 56], [-22, 56], [-22, 32]].forEach(([x, z]) => plant(x, z, 2.2));
  d.put(P.floorLamp(), -28, 31, { s: S, w: 0.6, d: 0.6 });
  wallArt(-59.4, 6, 30, 1, 0xfeca57); wallArt(-46, 6.5, 59.4, 0, 0x74b9ff); wallArt(-59.4, 7, -28, 1, 0xff7675); wallArt(-30, 7, -59.4, 0, 0x55efc4);
  // ---- Flur: Läufer, Garderobe, Schuhregal, Kisten, Fahrrad, Kommode, Bilder
  d.put(P.rug(5, 22, 0x8e44ad), 46, 22, { w: 5, d: 22, margin: 0, dy: 0.01 });
  d.put(P.coatRack(), 57, -26, { s: S, solid: [0.7, 2.2, 0.7] });
  d.put(P.shoeRack(), 58.2, -16, { s: S, ry: -Math.PI / 2, solid: [1.6, 0.8, 0.5] });
  d.put(P.boxes(3), 40, -52, { s: S, solid: [0.9, 1.8, 0.7] }); d.put(P.boxes(2), 44, -55, { s: S, solid: [0.9, 1.2, 0.7], ry: 0.4 });
  d.put(P.bike(0x00b894), 51, -57.5, { s: S, w: 1.4, d: 0.5 });
  d.put(P.cabinet(P.LWOOD, 1.1), 58.2, 22, { s: S, ry: -Math.PI / 2, solid: [0.8, 1.1, 0.7] });
  plant(37, 44); plant(57, 4, 2);
  wallArt(59.4, 5, 10, 1, 0x55efc4); wallArt(59.4, 5, 32, 1, 0xfab1a0);
  // ---- Speisekammer: Einmachgläser, Säcke, Kisten, Fässchen
  d.put(P.jarShelf(), -16.6, -36, { s: S, ry: Math.PI / 2, solid: [2.4, 1.5, 0.6] }); d.put(P.jarShelf(), 16.6, -42, { s: S, ry: -Math.PI / 2, solid: [2.4, 1.5, 0.6] });
  [[-13, -46], [-10.5, -48], [13, -28]].forEach(([x, z]) => d.put(P.sack(d.pick([0xd7ccc8, 0xbcaaa4])), x, z, { s: 2.2, solid: [0.9, 1.1, 0.8], margin: 0.2 }));
  d.put(P.crates(), 2, -40, { s: 2, solid: [2.6, 2.2, 1.4] }); d.put(P.barrel(), 14, -23, { s: 2.2, solid: [1, 1.1, 1] });
  // ---- Wintergarten: Kübelpflanzen, Korbsessel, Gießkanne, Pflanzkästen, Brunnen
  [[-15, 22], [15, 22], [-15, 57], [15, 57]].forEach(([x, z]) => plant(x, z));
  [[-6, 27, -0.4], [6, 27, 0.4]].forEach(([x, z, ry]) => d.put(P.armchair(0xd7b98e), x, z, { s: 2.2, ry, solid: [1.4, 1.4, 1.3] }));
  d.put(P.table(1.2, 1.2, 0.6, 0xffffff), 0, 28, { s: 2.2, solid: [1.2, 0.7, 1.2] });
  for (const z of [36, 44, 52]) { d.put(P.plantBox(2.4), -16.6, z, { s: 2, ry: Math.PI / 2, solid: [2.4, 0.9, 0.6] }); d.put(P.plantBox(2.4), 16.6, z, { s: 2, ry: -Math.PI / 2, solid: [2.4, 0.9, 0.6] }); }
  d.put(P.wateringCan(), -7, 53, { s: S, w: 0.6, d: 0.6 }); d.put(P.fountainSmall(), -7, 44, { s: 1.3, solid: [4.4, 1.9, 4.4] });
  // ---- Keller: Regal, Kisten, Fahrrad und ein alter Reifen
  const kx = 2000;
  d.at(P.shelf(3, 3, P.METAL), kx + 2, -12.7, { s: 2, solid: [3, 3, 0.5] }); d.at(P.boxes(3), kx - 17.5, 8, { s: 2, solid: [0.9, 1.8, 0.7] });
  d.at(P.tire(), kx + 17, 10, { s: 2, w: 1, d: 1 }); d.at(P.bike(0xe74c3c), kx - 8, 12, { s: 2, w: 1.4, d: 0.5 });
}
