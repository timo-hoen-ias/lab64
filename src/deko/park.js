// Grillpark: Grillplätze auf der Blumenwiese, Zeltplatz, Felsen mit Pilzen, Ufer mit Schilf und Booten,
// Laternen und Bänke an den Wegen, Kiosk am Rodelhügel.
import { box } from '../models.js';
import * as P from '../requisiten.js';

function grill() { const g = P.table(1.2, 0.8, 0.9, 0x2d3436); g.add(box(1.25, 0.08, 0.85, 0x636e72, 0, 0.98, 0)); for (let i = 0; i < 4; i++) g.add(box(0.15, 0.06, 0.12, 0xd35400, -0.4 + i * 0.27, 1.04, 0)); return g; }

export function park(d, l) {
  // Wege von den Toren frei, Grillwiese (Schleich-Bereich) bleibt wie sie ist
  [[0, -38, 0, -64], [0, 38, 0, 64], [38, 0, 64, 0], [-38, 0, -64, 0]].forEach(([a, b, c, e]) => d.keepLine(a, b, c, e, 3));
  d.keepOut(0, 0, 37);
  // Laternen und Bänke an den Wegen nach draußen
  for (const s of [-1, 1]) {
    d.row(s * 3.5, -42, s * 3.5, -62, 10, i => [i % 2 ? P.bench() : P.lantern(2.8), { ry: s > 0 ? -Math.PI / 2 : Math.PI / 2, solid: i % 2 ? [2.2, 1, 0.7] : undefined }]);
    d.row(s * 3.5, 42, s * 3.5, 62, 10, i => [i % 2 ? P.bench() : P.lantern(2.8), { ry: s > 0 ? -Math.PI / 2 : Math.PI / 2, solid: i % 2 ? [2.2, 1, 0.7] : undefined }]);
    d.row(42, s * 3.5, 62, s * 3.5, 10, i => [i % 2 ? P.bench() : P.lantern(2.8), { ry: s > 0 ? Math.PI : 0, solid: i % 2 ? [0.7, 1, 2.2] : undefined }]);
    d.row(-42, s * 3.5, -62, s * 3.5, 10, i => [i % 2 ? P.bench() : P.lantern(2.8), { ry: s > 0 ? Math.PI : 0, solid: i % 2 ? [0.7, 1, 2.2] : undefined }]);
  }
  d.scatter([-62, 62, -62, 62], 10, () => [P.bin(), { w: 0.8, d: 0.8 }]);

  // ---- Nordosten: Blumenwiese mit Grillplätzen und Birkenhain
  d.zone(95, -95, 60, () => {
    [[60, -50], [78, -48], [96, -56], [66, -86], [88, -84], [112, -78]].forEach(([x, z], i) => {
      if (!d.put(P.picnicTable(), x, z, { solid: [2.4, 1, 2.2], ry: i * 0.7 })) return;
      d.put(grill(), x + 3.2, z + 0.5, { solid: [1.3, 1.1, 0.9], ry: i * 0.7 }); d.put(P.bin(), x - 2.6, z + 2, { w: 0.8, d: 0.8 });
    });
    d.scatter([45, 145, -145, -40], 26, i => [P.flowerPatch(2 + (i % 3)), { w: 2.5, d: 2.5 }]);
    d.scatter([100, 145, -145, -60], 30, i => [P.birch(1 + (i % 3) * 0.15), { solid: [0.5, 3, 0.5] }]);
    d.scatter([45, 145, -145, -40], 8, i => [P.rocks(0.8 + (i % 3) * 0.3), { solid: [2, 0.9, 1.8] }]);
    d.scatter([45, 145, -145, -40], 24, i => [P.tree(1.3 + (i % 3) * 0.2), { solid: [0.9, 3, 0.9] }]);
    d.put(P.kiosk(0xe17055), 52, -38, { solid: [3, 2.6, 2.6], ry: Math.PI });
  });
  // ---- Südosten: Kiosk und Tannen am Rodelhügel, Wildblumen
  d.zone(100, 100, 55, () => {
    d.put(P.iceCart(), 72, 62, { solid: [2, 1.6, 1.2], ry: -0.5 });
    [[70, 68], [76, 66]].forEach(([x, z], i) => d.put(P.cafeTable(i ? 0xfeca57 : 0x48dbfb), x, z, { solid: [1.6, 1, 1] }));
    d.scatter([55, 147, 50, 147], 30, i => [P.pine(1.3 + (i % 4) * 0.2), { solid: [0.8, 2.5, 0.8] }]);
    d.scatter([55, 147, 40, 147], 16, i => [i % 2 ? P.flowerPatch(2) : P.tallGrass(8), { w: 2, d: 2 }]);
    d.scatter([55, 147, 40, 147], 6, i => [P.rocks(1 + (i % 2) * 0.4), { solid: [2.4, 1, 2] }]);
    d.scatter([55, 147, 40, 147], 6, () => [P.stump(1.2), { solid: [1, 0.7, 1] }]);
  });
  // ---- Südwesten: Zeltplatz
  d.zone(-100, 100, 55, () => {
    const cx = -95, cz = 95;
    d.at(P.campfire(), cx, cz, { solid: [1.6, 0.4, 1.6] });
    [[0, -7, 0xe17055], [6.5, -2, 0x0984e3], [5, 6, 0x00b894], [-6, 4, 0xfdcb6e]].forEach(([x, z, c]) => d.put(P.tent(c), cx + x, cz + z, { ry: Math.atan2(-x, -z), solid: [3, 2, 4] }));
    [[-3, -2], [2.5, 3], [-2, 3.2]].forEach(([x, z], i) => d.put(P.log(2.4), cx + x, cz + z, { ry: i * 1.1, solid: [2.4, 0.7, 0.7] }));
    d.put(P.picnicTable(), cx - 10, cz - 6, { solid: [2.4, 1, 2.2] });
    d.put(P.signpost(), cx + 9, cz - 9, { w: 1, d: 0.5 });
    d.scatter([-147, -55, 70, 147], 30, i => [P.pine(1.4 + (i % 4) * 0.25), { solid: [0.8, 2.5, 0.8] }]);
    d.scatter([-147, -55, 70, 147], 12, i => [[P.mushrooms(4), P.stump(1), P.logPile(), P.tallGrass(7)][i % 4], { solid: i % 4 === 2 ? [2.4, 1.2, 1.4] : undefined }]);
  });
  // ---- Nordwesten hinter dem Hügel: Felsen, Farne, Pilze
  d.zone(-100, -105, 50, () => {
    d.scatter([-147, -60, -147, -75], 14, i => [P.rocks(1 + (i % 3) * 0.5), { solid: [2.5, 1.2, 2.2] }]);
    d.scatter([-147, -60, -147, -75], 20, i => [P.pine(1.5 + (i % 3) * 0.3), { solid: [0.8, 2.5, 0.8] }]);
    d.scatter([-147, -60, -147, -75], 16, i => [[P.mushrooms(5, 0xe74c3c), P.mushrooms(3, 0xfeca57), P.tallGrass(9), P.stump(1.1)][i % 4], {}]);
  });
  // ---- Ufer am See: Schilf, Ruderboote, Angelplatz, Bänke
  d.zone(0, 100, 70, () => {
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + 0.1, x = Math.cos(a) * 49, z = 100 + Math.sin(a) * 33; d.put(i % 3 ? P.reeds(5) : P.rocks(0.7), x, z, { w: 1.2, d: 1.2, solid: i % 3 ? undefined : [1.6, 0.7, 1.4] }); }
    [[-38, 70, 0.6], [34, 132, 2.6]].forEach(([x, z, ry]) => d.put(P.rowboat(0x0984e3), x, z, { ry, solid: [1.4, 0.6, 3.4] }));
    [[-30, 66], [24, 68], [-52, 110], [52, 96]].forEach(([x, z]) => d.put(P.bench(), x, z, { ry: Math.atan2(-x, 100 - z), solid: [2.2, 1, 0.7] }));
    d.scatter([-70, 70, 125, 147], 12, i => [P.tree(1.3 + (i % 3) * 0.2), { solid: [0.9, 3, 0.9] }]);
    d.scatter([-75, 75, 60, 147], 14, i => [P.flowerPatch(2), { w: 2, d: 2 }]);
  });
  // ---- Zwischen Wiese und Wald: verstreute Bäume, Büsche, Steine
  d.scatter([-60, -40, -60, 60], 10, i => [i % 2 ? P.bush(2.2) : P.tree(1.4), { solid: i % 2 ? undefined : [0.9, 3, 0.9], w: 2, d: 2 }]);
  d.scatter([40, 65, -40, 40], 8, i => [i % 2 ? P.bush(2.2) : P.flowerPatch(2), { w: 2, d: 2 }]);
  d.scatter([-40, 40, -75, -40], 8, i => [i % 2 ? P.bush(2.2) : P.tree(1.3), { solid: i % 2 ? undefined : [0.9, 3, 0.9], w: 2, d: 2 }]);
}
