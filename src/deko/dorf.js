// Dorf: Häuser an den Ausfallstraßen, Felder mit Vogelscheuche, Obstgarten mit Bienenstöcken, Weiler mit Brunnen,
// Försterwald mit Holzfällerhütte und ein belebter Marktplatz.
import * as P from '../props.js';

const CROPS = [0xe1b12c, 0x7bc043, 0x27ae60, 0xa29bfe, 0xf6c445, 0x6ab04c];

export function dorf(d, l) {
  [[0, -36, 0, -86], [0, 36, 0, 86], [36, 0, 86, 0], [-36, 0, -74, 0]].forEach(([a, b, c, e]) => d.keepLine(a, b, c, e, 2.5));
  // Haus mit Vorgarten: Zaun, Beet, Briefkasten (ry: Blickrichtung der Haustür)
  const home = (x, z, ry) => {
    const w = d.pick([6, 7, 8]), dd = d.pick([5, 6]), h = d.pick([3, 3.5, 4]);
    if (!d.put(P.cottage(w, dd, h, d.pick(P.WALLS), d.pick(P.ROOFS)), x, z, { ry, solid: [w + 0.3, h + dd * 0.45, dd + 0.3], margin: 1 })) return;
    const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry), f = dd / 2 + 2.2;
    [-1, 1].forEach(s => d.put(P.fence(2.6), x + fx * f + sx * s * (w / 2 - 1), z + fz * f + sz * s * (w / 2 - 1), { ry, w: 2.6, d: 0.3 }));
    d.put(P.bed(2, 0.8, 8), x + fx * (dd / 2 + 0.9) + sx * w * 0.3, z + fz * (dd / 2 + 0.9) + sz * w * 0.3, { ry, w: 2, d: 0.8, margin: 0.2 });
    d.put(P.lantern(1.3, 0x2980b9), x + fx * (f + 0.3) + sx * 1.4, z + fz * (f + 0.3) + sz * 1.4, { w: 0.4, d: 0.4, margin: 0.2 });
  };
  // ---- Häuser an den Straßen vor den Toren
  for (const x of [46, 60, 74]) { home(x, -13, 0); home(x, 13, Math.PI); }
  for (const z of [46, 60]) { home(-13, z, Math.PI / 2); home(13, z, -Math.PI / 2); }
  for (const z of [-46, -58]) { home(-13, z, Math.PI / 2); home(13, z, -Math.PI / 2); }
  for (const x of [-46, -60]) { home(x, -13, 0); home(x, 13, Math.PI); }
  d.row(-4, 40, -4, 84, 11, () => [P.lantern(2.6), { w: 0.4, d: 0.4 }]); d.row(40, -4, 84, -4, 11, () => [P.lantern(2.6), { w: 0.4, d: 0.4 }]);
  d.row(4, -40, 4, -64, 11, () => [P.lantern(2.6), { w: 0.4, d: 0.4 }]); d.row(-40, 4, -70, 4, 11, () => [P.lantern(2.6), { w: 0.4, d: 0.4 }]);

  // ---- Marktplatz: Fässer, Kisten, Blumen, Bänke, Laternen
  [[-12.5, -12.5], [12.5, -12.5], [-12.5, 12.5], [12.5, 12.5]].forEach(([x, z]) => d.put(P.lantern(3), x, z, { w: 0.4, d: 0.4 }));
  [[0, 5.5, Math.PI], [0, -5.5, 0], [5.5, 0, -Math.PI / 2], [-5.5, 0, Math.PI / 2]].forEach(([x, z, ry]) => d.put(P.bench(), x, z, { ry, solid: [2.2, 1, 0.7] }));
  d.scatter([-34, 34, -34, 34], 18, i => [[P.barrel(), P.crate(1), P.pot(0xd35400, 0x3d9a3d, 1.1), P.sack(), P.cart(), P.well()][i % 6], { solid: [[1, 1.1, 1], [1, 1, 1], [0.8, 1.1, 0.8], [0.9, 1.1, 0.8], [4, 1.6, 1.8], [2.4, 2.8, 2.4]][i % 6] }]);

  // ---- Nordosten: Felder mit Zäunen, Vogelscheuche, Heuballen, Geräteschuppen
  d.zone(95, -100, 60, () => {
    for (const x of [62, 82, 102, 122, 140]) for (const z of [-58, -76, -94, -112, -130]) {
      const c = d.pick(CROPS); if (!d.put(P.field(16, 12, c), x, z, { w: 16, d: 12, margin: 0.3 })) continue;
      if (d.rand() < 0.5) d.put(P.woodFence(16), x, z - 7, { w: 16, d: 0.4, solid: [16, 1.1, 0.3], margin: 0.2 });
    }
    d.scatter([50, 147, -147, -50], 4, () => [P.scarecrow(), { w: 1, d: 0.6 }]);
    d.scatter([50, 147, -147, -50], 14, i => [P.hayBale(i % 3 !== 0), { solid: i % 3 ? [1.2, 1.6, 1.6] : [1.6, 0.8, 1] }]);
    d.put(P.shed(4, 3), 56, -50, { solid: [4.4, 2.4, 3.6], ry: Math.PI / 2 });
    d.put(P.wheelbarrow(), 60, -46, { solid: [1, 0.9, 2.2] });
  });
  // ---- Südosten: Obstgarten mit Bienenstöcken, Brunnen und Leiterwagen
  d.zone(100, 100, 55, () => {
    for (let x = 52; x <= 144; x += 12) for (let z = 52; z <= 144; z += 12) d.put(P.tree(1.3 + d.r(0, 0.4), d.rand() < 0.6), x + d.r(-1.5, 1.5), z + d.r(-1.5, 1.5), { solid: [0.9, 3, 0.9] });
    [[96, 66], [98, 66], [100, 66], [102, 66]].forEach(([x, z]) => d.put(P.beehive(), x, z, { solid: [0.9, 1.4, 0.9], margin: 0.2 }));
    d.put(P.well(), 112, 92, { solid: [2.4, 2.8, 2.4] }); d.put(P.cart(), 86, 112, { solid: [4, 1.6, 1.8], ry: 0.4 });
    d.scatter([50, 147, 50, 147], 10, i => [i % 2 ? P.flowerPatch(2) : P.tallGrass(8), { w: 2, d: 2 }]);
  });
  // ---- Südwesten: Weiler um einen Brunnen
  d.zone(-95, 95, 55, () => {
    const cx = -92, cz = 96;
    d.at(P.well(), cx, cz, { solid: [2.4, 2.8, 2.4] });
    [[0, -14, 0], [13, -4, -Math.PI / 2], [-13, -4, Math.PI / 2], [8, 12, Math.PI], [-9, 12, Math.PI]].forEach(([x, z, ry]) => d.put(P.cottage(7, 6, 3.5, d.pick(P.WALLS), d.pick(P.ROOFS)), cx + x, cz + z, { ry, solid: [7.3, 6.2, 6.3] }));
    d.put(P.logPile(), cx + 5, cz - 4, { solid: [2.4, 1.2, 1.4] }); d.put(P.bench(), cx - 4, cz + 3, { ry: Math.PI / 2, solid: [0.7, 1, 2.2] });
    d.scatter([cx - 22, cx + 22, cz - 22, cz + 22], 10, i => [i % 2 ? P.bed(2.4, 1, 10) : P.pot(0xd35400, 0x3d9a3d, 1), { w: 2.4, d: 1 }]);
    d.scatter([-147, -45, 45, 147], 28, i => [i % 3 ? P.pine(1.4 + (i % 4) * 0.2) : P.tree(1.4), { solid: [0.9, 2.6, 0.9] }]);
    d.scatter([-147, -45, 45, 147], 8, i => [P.rocks(0.9 + (i % 2) * 0.4), { solid: [2.2, 1, 2] }]);
  });
  // ---- Nordwesten: Försterwald mit Holzfällerhütte
  d.zone(-100, -100, 55, () => {
    d.put(P.cottage(6, 5, 3, 0x8d6e4a, 0x3e6b48), -92, -78, { solid: [6.3, 5.3, 5.3] });
    d.put(P.logPile(), -84, -76, { solid: [2.4, 1.2, 1.4] }); d.put(P.stump(1.3), -86, -82, { solid: [1.2, 0.8, 1.2] });
    d.scatter([-147, -45, -147, -45], 50, i => [P.pine(1.5 + (i % 5) * 0.25), { solid: [0.9, 2.8, 0.9] }]);
    d.scatter([-147, -45, -147, -45], 18, i => [[P.mushrooms(4), P.stump(1.1), P.log(3), P.rocks(1), P.tallGrass(8), P.mushrooms(3, 0xfeca57)][i % 6], { solid: [undefined, [1, 0.7, 1], [3, 0.7, 0.8], [2.2, 1, 2], undefined, undefined][i % 6] }]);
  });
  // ---- Ränder: Blumen, Büsche, Felsen auf der Wiese
  d.scatter([-147, 147, -147, 147], 30, i => [[P.flowerPatch(2), P.bush(2), P.rocks(0.8), P.tallGrass(7)][i % 4], { w: 2, d: 2, solid: i % 4 === 2 ? [1.8, 0.8, 1.6] : undefined }]);
}
