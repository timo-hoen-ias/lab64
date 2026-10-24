// Badebucht: Strandhäuschen und Bänke an der Promenade, Sonnenschirm-Grüppchen, Beachvolleyball, Rettungsturm,
// Palmen und Felsen an den Enden, Seesterne am Spülsaum, Segelboote und Bojen draußen.
import * as P from '../requisiten.js';

const COL = [0xe74c3c, 0xfeca57, 0x48dbfb, 0x1dd1a1, 0xff9ff3];

export function strand(d, l) {
  // ---- Promenade: Strandhäuschen, Bänke zum Meer, Mülleimer, Fahnen
  d.zone(0, -135, 70, () => {
    for (let i = 0, x = -96; x <= 96; x += 9, i++) d.put(P.beachHut(COL[i % 5]), x, -144, { solid: [2.4, 3.3, 2.2] });
    for (let x = -95; x <= 95; x += 20) d.put(P.bench(), x, -125.5, { solid: [2.2, 1, 0.7] });
    for (let x = -85; x <= 85; x += 40) d.put(P.bin(0x0984e3), x, -124.5, { w: 0.8, d: 0.8 });
    [[-50, -140], [40, -140], [-70, -126]].forEach(([x, z], i) => d.put(P.flagPole(COL[i]), x, z, { w: 0.4, d: 0.4 }));
    d.put(P.iceCart(), 24, -126, { solid: [2, 1.6, 1.2] });
    d.put(P.bikeRack(), -12, -140, { w: 2.4, d: 0.6 }); [[-13, 0x0984e3], [-11, 0xe74c3c]].forEach(([x, c]) => d.put(P.bike(c), x, -139.5, { ry: Math.PI / 2, w: 1.4, d: 0.5 }));
    d.scatter([-110, 110, -146, -138], 6, i => [P.surfboard(COL[i % 5]), { w: 0.6, d: 0.4 }]);
  });
  // ---- Strand: Schirm-Grüppchen mit Handtüchern und Liegen, Volleyball, Rettungsturm, Sandburgen
  d.zone(0, -80, 90, () => {
    const group = (x, z) => {
      const c = d.pick(COL); if (!d.put(P.umbrella(c), x, z, { w: 1, d: 1 })) return;
      d.put(P.towel(d.pick(COL)), x + 1.5, z + 0.4, { ry: 0.2, w: 1, d: 2, margin: 0.1 }); d.put(P.deckChair(d.pick(COL)), x - 1.5, z + 0.3, { ry: d.r(-0.4, 0.4), w: 0.8, d: 1.6, margin: 0.1 });
    };
    for (let i = 0; i < 48; i++) group(d.r(-130, 140), d.r(-112, -62));
    d.put(P.volleyNet(), -12, -88, { w: 8, d: 1 }) || d.put(P.volleyNet(), -40, -96, { w: 8, d: 1 });
    [[30, -58], [-62, -56], [118, -62]].forEach(([x, z]) => d.put(P.lifeguardTower(), x, z, { solid: [2.4, 5, 2.4] }));
    d.scatter([-120, 130, -100, -55], 8, i => [P.sandcastle(0.6 + (i % 3) * 0.2), { w: 1.6, d: 1.6 }]);
    d.scatter([-140, 140, -64, -42], 30, i => [i % 3 ? P.starfish(i % 2 ? 0xff7f50 : 0xe056fd) : P.rock(0.4 + (i % 4) * 0.15, 0xb8ad9e), { w: 0.6, d: 0.6, margin: 0.1 }]);
    d.scatter([62, 140, -118, -66], 8, i => [P.palmTree(6 + (i % 3)), { solid: [0.6, 3, 0.6] }]);
    d.scatter([-140, -100, -100, -50], 4, i => [P.palmTree(6 + (i % 2)), { solid: [0.6, 3, 0.6] }]);
    d.scatter([125, 148, -120, -45], 8, i => [P.rocks(1 + (i % 3) * 0.5, 0xa39a8c), { solid: [2.4, 1.2, 2] }]);
    d.scatter([-148, -125, -90, -45], 6, i => [P.rocks(1 + (i % 3) * 0.5, 0xa39a8c), { solid: [2.4, 1.2, 2] }]);
    [[-8, -52, 0.5], [88, -50, 2.2]].forEach(([x, z, ry]) => d.put(P.rowboat(0xe17055), x, z, { ry, solid: [1.4, 0.6, 3.4] }));
  });
  // ---- Meer: Segelboote mit Rumpf zum Draufklettern, Bojen der Badezone
  [[-118, -18, 0.5], [-96, 62, 2.4], [20, 40, -0.8], [130, -38, 1.4], [-10, 120, 0.2]].forEach(([x, z, ry], i) => {
    const m = P.sailboat([0xffffff, 0xfab1a0, 0xdfe6e9][i % 3]); if (i % 2 === 0) m.userData.bob = true;
    if (d.free(x, z, 3, 7, { y: 0, anywhere: true }) === null) return;
    d.at(m, x, z, { y: -0.4, ry, keep: 4 });
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), ww = 2 * c + 6.6 * s, dd = 2 * s + 6.6 * c;
    l.solids.push({ min: { x: x - ww / 2, y: -12, z: z - dd / 2 }, max: { x: x + ww / 2, y: 0.5, z: z + dd / 2 }, active: true, mesh: true });
  });
  for (let x = -30; x <= 40; x += 14) d.at(P.buoyBob(x % 28 ? 0xfeca57 : 0xff7675), x, -24, { y: -0.2, keep: 1.5 });
}
