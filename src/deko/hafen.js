// Hafen: Lagerhallen, Fischstände und Fracht am Westkai, Poller und Laternen an den Kanten, Kutter am Kai,
// Segelboote draußen auf dem Wasser und schaukelnde Bojen.
import * as P from '../props.js';

const SEA = 1.3, BED = -10;

export function hafen(d, l) {
  // Boot im Wasser: Rumpf von Grund bis Deck als Kollision (man kann hochklettern), schaukelt leicht
  const boat = (mesh, x, z, ry, w, len, deck, bob = true) => {
    if (bob) mesh.userData.bob = true;
    d.at(mesh, x, z, { y: SEA - 0.5, ry, keep: len / 2 + 1 });
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), ww = w * c + len * s, dd = w * s + len * c;
    l.solids.push({ min: { x: x - ww / 2, y: BED, z: z - dd / 2 }, max: { x: x + ww / 2, y: SEA - 0.5 + deck, z: z + dd / 2 }, active: true, mesh: true });
  };
  const cargo = i => [[P.barrel(), P.crates(), P.palletStack(3), P.fishNet(), P.ropeCoil(), P.lobsterPot(), P.barrel(0x2980b9), P.crate(1.2)][i % 8], { solid: [[1, 1.1, 1], [2.6, 2.2, 1.4], [1.2, 1.6, 1.2], [2.4, 0.5, 1.8], [1, 0.4, 1], [1, 0.6, 0.7], [1, 1.1, 1], [1.2, 1.2, 1.2]][i % 8], s: 1.4 }];

  // ---- Westkai: Lagerhallen, Fischstände, Fracht
  d.zone(-88, -15, 50, () => {
    [[-118, -51], [-92, -51]].forEach(([x, z], i) => d.put(P.warehouse(18, 10, 7, i ? 0xa4b0be : 0x95a5a6), x, z, { solid: [18, 8.5, 10], margin: 1 }));
    d.put(P.shed(5, 4, 0x2980b9), -64, -53, { solid: [5.4, 2.6, 4.6] });
    [[-64, -26], [-64, -4], [-64, 20], [-100, 20], [-118, 6]].forEach(([x, z], i) => d.put(P.marketStall([0x2980b9, 0xef5350, 0x27ae60][i % 3]), x, z, { ry: x > -70 ? -Math.PI / 2 : Math.PI, solid: [3, 1.1, 1.4] }));
    // Container-Stapel an der Westkante
    [[-122, -30], [-122, -22], [-56, 4]].forEach(([x, z], i) => { const h = 2 + (i % 2); for (let k = 0; k < h; k++) d.at(P.crate(2.4, [0xe74c3c, 0x3498db, 0x27ae60, 0xe67e22][(i + k) % 4]), x, z, { y: 2 + k * 2.4, keep: 3 }); l.solids.push({ min: { x: x - 1.2, y: 2, z: z - 1.2 }, max: { x: x + 1.2, y: 2 + h * 2.4, z: z + 1.2 }, active: true, mesh: true, cam: true }); });
    d.scatter([-128, -48, -58, 28], 60, cargo);
    for (let x = -124; x <= -50; x += 9) { d.put(P.bollard(), x, 28.6, { w: 0.9, d: 0.9 }); d.put(P.bollard(), x, -58.6, { w: 0.9, d: 0.9 }); }
    for (let z = -52; z <= 24; z += 9) d.put(P.bollard(), -128.6, z, { w: 0.9, d: 0.9 });
    for (let x = -120; x <= -52; x += 17) d.put(P.lantern(3.2), x, 27, { w: 0.4, d: 0.4 });
    d.put(P.van(0xecf0f1), -84, 14, { solid: [4.6, 2.4, 2] });
    // Kutter am Kai
    [[-136, -40], [-136, -12], [-136, 14]].forEach(([x, z], i) => boat(P.fishingBoat([0x0984e3, 0xe74c3c, 0x00b894][i]), x, z, 0, 3, 9.6, 1.5));
    [[-112, -66], [-80, -66]].forEach(([x, z], i) => boat(i ? P.rowboat(0xfdcb6e) : P.fishingBoat(0xe17055), x, z, Math.PI / 2, i ? 1.4 : 3, i ? 3.6 : 9.6, i ? 0.6 : 1.5));
  });
  // ---- Holzkai: ein paar Netze, Fässer und Taue an den Rändern
  d.scatter([-24, 24, -7, 27], 10, i => cargo(i + 3));
  [[-24, 27.5], [24, 27.5], [-24, -7], [24, -7]].forEach(([x, z]) => d.put(P.lantern(3.2), x, z, { w: 0.4, d: 0.4 }));
  d.put(P.anchorDeco(), 6, 27, { w: 1.8, d: 0.4, ry: 0 });
  // ---- Terminal: Paletten und Gabelstapler-Ecke am Rand
  d.zone(90, -10, 60, () => {
    d.scatter([116, 129, -58, 38], 14, i => [i % 3 ? P.palletStack(2 + (i % 3)) : P.barrel(0xe67e22), { solid: i % 3 ? [1.2, 1.4, 1.2] : [1, 1.1, 1] }]);
    for (let x = 52; x <= 126; x += 12) d.put(P.bollard(), x, 39.4, { w: 0.9, d: 0.9 });
    for (let z = -54; z <= 34; z += 11) d.put(P.lantern(4), 128.5, z, { w: 0.4, d: 0.4 });
  });
  // ---- Mole: Laternen und Rettungsringe
  d.zone(-20, 90, 55, () => {
    for (let z = 40; z <= 128; z += 16) { d.put(P.lantern(3), -22.4, z, { w: 0.4, d: 0.4, margin: 0.1 }); d.put(P.lifebuoyStand(), -17.6, z + 8, { w: 0.4, d: 0.4, margin: 0.1 }); }
  });
  // ---- Draußen auf dem Wasser: Segelboote, Bojen
  [[-70, 72, 0.4], [-108, 102, 2.2], [108, 72, -0.6], [126, 118, 1.2], [-62, -98, 1.6], [36, -104, -1.2], [112, -96, 0.3], [-118, 132, 2.6]].forEach(([x, z, ry], i) => boat(P.sailboat([0xffffff, 0xdfe6e9, 0xfab1a0][i % 3]), x, z, ry, 2, 6.6, 0.9, i % 2 === 0));
  [[-40, 38], [-60, 50], [34, -70], [-36, -74], [80, 50], [140, 44]].forEach(([x, z], i) => { const b = P.buoyBob(i % 2 ? 0xfeca57 : 0xff7675); d.at(b, x, z, { y: SEA - 0.3, keep: 1.5 }); });
}
