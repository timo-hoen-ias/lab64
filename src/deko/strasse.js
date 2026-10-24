// Einkaufsstraße: Stadtviertel mit Wohnblöcken und Läden, Parkplatz, kleiner Stadtpark, Straßenmöbel an allen Straßen.
import { box } from '../models.js';
import * as P from '../props.js';

const flat = (l, m) => { m.userData.merge = true; l.group.add(m); };
const WALLS = [0xdfe6e9, 0xffeaa7, 0xfab1a0, 0x81ecec, 0xb2bec3, 0xe8d5b7, 0xd1ccc0];
const CARS = [0xe74c3c, 0x0984e3, 0xf1c40f, 0x2d3436, 0xecf0f1, 0x00b894];

export function strasse(d, l) {
  // Straßen frei lassen (Fahrbahn + Tore)
  d.keepLine(0, -36, 0, -96, 7); d.keepLine(0, 36, 0, 96, 7); d.keepLine(36, 0, 96, 0, 7); d.keepLine(-36, 0, -96, 0, 7);
  const block = (x, z, o = {}) => { const w = o.w || d.pick([12, 14, 16]), dd = o.d || d.pick([10, 12]), h = o.h || d.pick([8, 11, 14, 17, 21]); return d.put(P.cityBlock(w, dd, h, o.c || d.pick(WALLS), d.pick([0x74b9ff, 0x9ad7ff]), d.pick([0x7f8c8d, 0x8d3b2a, 0x57606f, 0x6a8d73])), x, z, { solid: [w, h, dd], ry: o.ry || 0, margin: 2 }); };
  const shop = (x, z, ry = 0) => d.put(P.awningShop(8, 6, d.pick(WALLS), d.pick([0xe74c3c, 0x0984e3, 0x00b894, 0xfdcb6e])), x, z, { solid: [8, 5.4, 7], ry, margin: 1.5 });
  const furniture = rect => d.scatter(rect, 14, i => [[P.planterTree(1.1), P.bin(), P.hydrant(), P.bench(), P.bike(d.pick(CARS)), P.cone3(), P.streetLamp()][i % 7], { solid: i % 7 === 0 ? [1.6, 3, 1.6] : i % 7 === 3 ? [2.2, 1, 0.7] : undefined, w: 1, d: 1 }]);

  // ---- Laternen, Bäume und Bänke an den vier Straßen
  for (const s of [-1, 1]) {
    d.row(s * 9, -40, s * 9, -94, 12, i => [i % 2 ? P.planterTree(1.1) : P.streetLamp(), { ry: s > 0 ? Math.PI : 0, solid: i % 2 ? [1.6, 3, 1.6] : undefined }]);
    d.row(s * 9, 40, s * 9, 94, 12, i => [i % 2 ? P.planterTree(1.1) : P.streetLamp(), { ry: s > 0 ? Math.PI : 0, solid: i % 2 ? [1.6, 3, 1.6] : undefined }]);
    d.row(40, s * 9, 94, s * 9, 12, i => [i % 2 ? P.planterTree(1.1) : P.streetLamp(), { ry: s > 0 ? Math.PI / 2 : -Math.PI / 2, solid: i % 2 ? [1.6, 3, 1.6] : undefined }]);
    d.row(-40, s * 9, -94, s * 9, 12, i => [i % 2 ? P.planterTree(1.1) : P.streetLamp(), { ry: s > 0 ? Math.PI / 2 : -Math.PI / 2, solid: i % 2 ? [1.6, 3, 1.6] : undefined }]);
  }
  [[-9, 46, 0], [9, -46, Math.PI], [46, 9, Math.PI / 2], [-46, -9, -Math.PI / 2]].forEach(([x, z, ry]) => d.put(P.busStop(), x + Math.sign(x) * 1.5, z, { ry, solid: [3.2, 2.5, 1.4] }));
  // geparkte Autos am Straßenrand
  for (let z = 50; z < 92; z += 9) { if (d.rand() < 0.7) d.put(P.car(d.pick(CARS)), 4, z, { ry: Math.PI / 2, solid: [1.8, 1.9, 3.8] }); if (d.rand() < 0.6) d.put(P.car(d.pick(CARS)), -4, -z, { ry: -Math.PI / 2, solid: [1.8, 1.9, 3.8] }); }
  for (let x = 50; x < 92; x += 9) { if (d.rand() < 0.6) d.put(P.car(d.pick(CARS)), x, 4, { solid: [3.8, 1.9, 1.8] }); if (d.rand() < 0.6) d.put(P.car(d.pick(CARS)), -x, -4, { ry: Math.PI, solid: [3.8, 1.9, 1.8] }); }

  // ---- Nordwesten: Wohnviertel mit Stadtpark
  d.zone(-90, -95, 60, () => {
    for (const x of [-45, -122, -142]) for (const z of [-135, -110, -85, -60]) block(x, z);
    for (const z of [-135, -110, -60]) { block(-70, z); block(-96, z); }
    // Stadtpark: Brunnen, Bäume, Beete, Bänke
    d.at(P.fountainSmall(), -83, -85, { solid: [4.4, 1.9, 4.4] });
    [[-74, -77], [-92, -77], [-74, -93], [-92, -93]].forEach(([x, z]) => d.put(P.tree(1.4), x, z, { solid: [0.9, 3, 0.9] }));
    [[-83, -76], [-83, -94]].forEach(([x, z], i) => d.put(P.bed(4, 1.2, 14), x, z, { w: 4, d: 1.2 }));
    [[-76, -85, Math.PI / 2], [-90, -85, -Math.PI / 2]].forEach(([x, z, ry]) => d.put(P.bench(), x, z, { ry: ry + Math.PI, solid: [2.2, 1, 0.7] }));
    furniture([-147, -40, -147, -45]);
  });
  // ---- Nordosten: Parkplatz und Bürotürme
  d.zone(95, -95, 60, () => {
    flat(l, box(40, 0.04, 36, 0x4d4d4d, 60, 0.025, -60)); for (let x = 44; x <= 76; x += 4) [-72, -48].forEach(z => flat(l, box(0.2, 0.05, 5, 0xffffff, x, 0.03, z)));
    for (let x = 46; x <= 74; x += 4) { if (d.rand() < 0.65) d.put(P.car(d.pick(CARS)), x, -72, { solid: [1.8, 1.9, 3.8], ry: Math.PI / 2 }); if (d.rand() < 0.65) d.put(P.car(d.pick(CARS)), x, -48, { solid: [1.8, 1.9, 3.8], ry: -Math.PI / 2 }); }
    d.put(P.van(0xfdcb6e), 72, -60, { solid: [4.6, 2.4, 2] });
    for (const x of [100, 124, 144]) for (const z of [-135, -110, -85, -55]) block(x, z, { h: d.pick([14, 18, 24]) });
    for (const z of [-135, -112]) { block(48, z); block(72, z); }
    d.put(P.billboard(0xfeca57), 88, -44, { solid: [3.4, 5, 0.6], ry: -0.4 });
    furniture([40, 147, -147, -40]);
  });
  // ---- Südwesten: Häuschen mit Läden und Spielplatz
  d.zone(-95, 95, 60, () => {
    for (const x of [-56, -110, -136]) for (const z of [52, 78, 104, 130]) d.rand() < 0.5 ? shop(x, z, d.pick([0, Math.PI])) : block(x, z, { h: d.pick([8, 11]) });
    for (const z of [104, 130]) { block(-83, z); }
    // Spielplatz mit Sandkasten, Wippe, Klettergerüst
    flat(l, box(18, 0.05, 18, 0xe8d5a5, -83, 0.03, 64));
    d.put(P.picnicTable(), -88, 58, { solid: [2.4, 1, 2.2] });
    d.put(P.toys(), -80, 66, { w: 2, d: 1.5 });
    [[-78, 58], [-89, 70], [-76, 71]].forEach(([x, z]) => d.put(P.tree(1.2), x, z, { solid: [0.8, 3, 0.8] }));
    d.put(P.bench(), -83, 74.5, { ry: Math.PI, solid: [2.2, 1, 0.7] });
    // Café-Tische vor der Eisdiele am Brunnenplatz
    [[-124, 31], [-118, 32], [-112, 31], [-106, 32]].forEach(([x, z], i) => d.put(P.cafeTable([0xff7675, 0xfeca57, 0x74b9ff][i % 3]), x, z, { solid: [1.6, 1, 1] }));
    furniture([-147, -40, 40, 147]);
  });
  // ---- Südosten: Wohnblöcke, Werbetafeln
  d.zone(95, 95, 60, () => {
    for (const x of [60, 86, 112, 138]) for (const z of [52, 78, 104, 130]) if (d.rand() < 0.85) block(x, z);
    d.put(P.billboard(0xff7675), 52, 42, { solid: [3.4, 5, 0.6] });
    furniture([40, 147, 40, 147]);
  });
  // ---- Bahnhof: Bänke, Fahrradständer, Gepäckwagen
  d.zone(0, 108, 50, () => {
    [-25, -12, 12, 25].forEach(x => d.put(P.bench(), x, 103.5, { ry: Math.PI, y: 1.2, solid: [2.2, 1, 0.7] }));
    [[-14, 133], [-6, 133]].forEach(([x, z]) => d.put(P.bikeRack(), x, z, { w: 2.4, d: 0.6 }));
    [[-12, 132.5], [-7, 133.5]].forEach(([x, z], i) => d.put(P.bike(CARS[i]), x, z, { ry: Math.PI / 2, w: 1.4, d: 0.5 }));
    d.put(P.kiosk(0x0984e3), 34, 124, { solid: [3, 2.6, 2.6], ry: -Math.PI / 2 });
    [[-30, 124], [30, 135], [-34, 136]].forEach(([x, z]) => d.put(P.planterTree(1.2), x, z, { solid: [1.6, 3, 1.6] }));
  });
}
